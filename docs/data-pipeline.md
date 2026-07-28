# Data & Training Pipeline on Google Cloud

This document describes, step by step, how data moves through the system once
Model Explorer is wired to real Google Cloud infrastructure: how a dataset
gets from the outside world into storage, how a model and its weights are
uploaded and stored, how multimodal data is prepared for training/evaluation
across the different task types the app supports, and how results make it
back to the frontend for visualization.

It documents the target architecture agreed in the connection plan
(`/Users/Fei/.claude/plans/lazy-singing-lobster.md`). `/server` (Phase 1,
Firestore CRUD skeleton) already exists; `/pipeline` (Phases 3-4, the actual
training/eval containers) does not exist yet — those sections describe the
design to be built, not shipped code.

## 0. Components involved

| Component | Tech | Role |
|---|---|---|
| Frontend | React/Vite/Zustand (`src/`) | UI, polls run status, renders charts |
| API | Node/Express, Cloud Run service (`server/`) | only component holding GCP credentials; all reads/writes to Firestore/GCS go through it |
| Metadata store | Firestore (Native mode) | `projects`, `datasets`, `modelSpecs`, `trainingRuns`, `evaluations`, `flags`, `users` — mirrors `src/types/index.ts` 1:1 |
| Object storage | Cloud Storage, 2 buckets | `<project>-model-explorer-data` (raw + processed dataset files), `<project>-model-explorer-artifacts` (trained weights) |
| Compute | Cloud Run Jobs (Python containers, `/pipeline`) | training job, evaluation job |

The one architectural rule everything below follows: **the frontend and API
never talk to a training/eval job directly.** They only create a status
document (`trainingRuns/{id}` or `evaluations/{id}`) and poll it. The job
reads its own instructions from that document and writes progress back into
it. This is what lets compute be swapped (Cloud Run Job today, Vertex AI
later) without changing the frontend or API contract.

---

## 1. How data gets from the system into storage (dataset ingestion)

This is the path for adding a new `Dataset` (a `Entry[]` of subjects/sessions
tagged with a `modalityType`).

1. **User initiates upload** in the frontend (Dataset creation/edit flow),
   selecting one or more raw files (images, ECG signal files, clinical note
   text) plus per-entry metadata (`subjectId`, `sessionId`, `date`, `age`,
   `sex`, `diagnosis`, `modalityType`, `split`).
2. **Frontend requests a signed upload URL** from the API:
   `POST /datasets/:id/entries/upload-url` (new endpoint, Phase 2) with the
   file's content type and a proposed object path. The API does **not**
   proxy file bytes itself — for anything beyond toy-sized files, routing
   binary uploads through the Express process wastes Cloud Run request time
   and memory.
3. **API generates a V4 signed URL** (`storage.bucket(...).file(...).getSignedUrl()`)
   scoped to `raw/<datasetId>/<entryId>.<ext>` in the data bucket, valid for
   a short TTL (e.g. 15 min), and returns it to the frontend. This is why the
   `api-runtime` service account needs GCS write scoped to that bucket, even
   though the actual bytes never pass through the API container.
4. **Frontend uploads the file directly to GCS** via `PUT` to the signed URL.
   No GCP credentials are ever exposed to the browser — the signed URL itself
   is the (time-limited) credential.
5. **Frontend confirms the upload**: `POST /datasets/:id/entries` with the
   entry metadata and the now-known `gs://<bucket>/raw/<datasetId>/<entryId>.<ext>`
   path. The API writes this as an `Entry` inside the `Dataset` document's
   `entries` array in Firestore (embedded array, not a subcollection — fine
   under Firestore's 1MB doc limit at this dataset scale; see §7 for the
   scale-out plan).
6. **Optional ingest-time normalization**: for modalities that benefit from a
   canonical processed form (e.g. resizing/normalizing images, resampling
   ECG signal arrays), the API triggers a lightweight Cloud Run Job (or, for
   Phase 2 toy scale, does it inline) that reads `raw/<datasetId>/<entryId>.<ext>`,
   writes a normalized version to `processed/<datasetId>/<entryId>.<ext>`, and
   records that path back on the `Entry`. This runs once at ingest, not on
   every training run, so training jobs never redo the same resize/normalize
   work.
7. Dataset is now queryable/servable through the API exactly like a seeded
   mock dataset: `GET /datasets/:id` returns the full document including all
   `entries`, each with a real `gs://...` path instead of the mock
   `/data/mri/...` placeholder string.

**Storage layout convention** (data bucket):
```
raw/<datasetId>/<entryId>.<ext>          # original file, uploaded as-is
processed/<datasetId>/<entryId>.<ext>    # normalized/resized, produced once
```

---

## 2. How a model is uploaded and stored

A `ModelSpec` describes an architecture/config; its `savedWeights` array
holds zero or more `WeightSnapshot`s (a base pretrained checkpoint, or the
output of a previous training run). Two upload paths exist:

### 2a. Model spec creation (no weights yet)
1. User fills in the model form: `name`, `type` (`classification` |
   `regression` | `detection` | `segmentation` | `clustering` |
   `llm-finetuning`), `architecture`, and `parameters` (hyperparameter
   key/value map).
2. `POST /modelSpecs` writes the doc straight to Firestore — no GCS
   involved, since there's no binary payload yet.

### 2b. Uploading a weight snapshot (e.g. bringing an externally pretrained checkpoint)
1. Frontend requests a signed upload URL the same way as §1 step 2-3, this
   time scoped to the **artifacts bucket**:
   `artifacts/<modelSpecId>/<snapshotId>.<ext>` (`.pt`/`.h5`/`.pkl`/etc.
   depending on framework).
2. Frontend `PUT`s the weight file directly to GCS via the signed URL.
3. Frontend confirms: `POST /modelSpecs/:id/weights` with the snapshot
   metadata (`name`, `description`, `filePath` = the `gs://...` URI). API
   appends a `WeightSnapshot` to the `ModelSpec.savedWeights` array in
   Firestore.

### 2c. Weights produced by training (the more common path)
This does not go through the upload flow at all — the training job itself
writes directly to the artifacts bucket and Firestore at the end of a run
(see §4 step 6). The distinction matters operationally: uploaded weights use
the `api-runtime` service account's signed-URL flow; job-produced weights use
the `training-job-runtime` service account's direct write scoped to the
artifacts bucket. Neither service account can do the other's job — that's
the intended least-privilege boundary from the provisioning plan.

**Storage layout convention** (artifacts bucket):
```
artifacts/<modelSpecId>/<snapshotId>.<ext>
```

---

## 3. How multimodal data is processed before training/evaluation

The training/eval container is **one image with a small internal registry of
loader/model plugins**, not one container per modality. Which plugin runs is
selected by `ModelSpec.type` + `ModelSpec.architecture` — both already exist
as fields on the type, so no schema change is needed to route to the right
plugin.

Common preprocessing steps (every modality, every task type):

1. Job starts with a `trainingRunId` (or `evaluationId`) argument.
2. Looks up the `TrainingRun`/`Evaluation` doc in Firestore → gets
   `modelSpecId`, `trainDatasetId`/`datasetId`, `parameterOverrides`.
3. Looks up the `Dataset` doc → gets the full `Entry[]` list, each with a
   `gcsUri` (the `processed/` path if one exists, else `raw/`) and a label
   (`diagnosis`, or task-appropriate target).
4. Splits entries by `Entry.split` (`'train'` | `'val'`) if present;
   otherwise the job performs a deterministic split (seeded) so runs are
   reproducible.
5. Downloads the needed files to local container disk. At current (toy)
   scale this is done eagerly for the whole split; no streaming/sharding
   layer yet (explicitly deferred — see §7).
6. Dispatches to a **modality-specific loader** that turns raw bytes into a
   feature array:

   | `modalityType` | Loader behavior |
   |---|---|
   | `MRI`, `CT`, `X-Ray`, `Pathology` | PIL/`numpy` open → resize → normalize to a fixed tensor shape. (Real DICOM/NIfTI parsing with `pydicom`/`nibabel` is out of scope for v1; source data is converted to plain PNG/`.npy` at ingest time instead, per §1 step 6.) |
   | `ECG` | Parse the numeric signal array (`.csv`/`.npy`) → optional resampling to a fixed length → hand-crafted or windowed features. |
   | `Clinical Note` | Tokenize / TF-IDF vectorize (classical) or tokenize with the model's tokenizer (for `llm-finetuning`). |

7. Dispatches to a **modality- and task-appropriate model**, again selected
   by `ModelSpec.type`:

   | `ModelSpec.type` | Typical model for v1 | Feeds which `EvaluationMetrics` fields |
   |---|---|---|
   | `classification` | tiny CNN (image) / logistic regression (ECG, tabular) | `accuracy`, `auc`, `f1`, `sensitivity`, `specificity`, `confusionMatrix` |
   | `regression` | linear/ridge regression | `rmse`, `mae`, `r2` |
   | `detection`, `segmentation` | deferred past v1 toy slice — same loader stage applies, model stage is a stub until real data justifies it | (n/a for v1) |
   | `clustering` | k-means / hierarchical over extracted features | `silhouetteScore`, `daviesBouldinIndex`, `calinskiHarabaszIndex`, `numClusters`, `clusterSizes` |
   | `llm-finetuning` | small causal LM fine-tune (e.g. LoRA on a small base model) over `Clinical Note` text | `perplexity`, `rougeL`, `bleu`, `bertScore`, `benchmarks` |

   These are intentionally toy-scale, not the full ResNet-50/ClinicalBERT
   implementations the mock data's `architecture` strings imply — v1 proves
   real-data-to-real-model plumbing, not modeling quality.
8. `parameterOverrides` from the `TrainingRun`/`Evaluation` doc (already a
   `Record<string, string | number | boolean>` on the type) are applied on
   top of the `ModelSpec.parameters` defaults before the model is
   constructed — this is how a user's per-run hyperparameter tweak in the UI
   reaches the actual training loop.

---

## 4. Training run lifecycle (Cloud Run Job)

1. User starts a run from `TrainingDetailPage` (or a "new run" form) →
   frontend calls `POST /projects/:id/training-runs` with `modelSpecId`,
   `trainDatasetId`, optional `baseWeightsSnapshotId`, `parameterOverrides`.
2. API creates the `TrainingRun` Firestore doc with `status: 'pending'`,
   `trainingHistory: []`, and returns its `id` immediately (does not wait
   for the job to finish).
3. API calls the Cloud Run Jobs API (`jobs.run`), passing the new run's `id`
   as a container argument/env var.
4. Job container starts, does the lookup/preprocessing from §3, sets
   `status: 'running'` on the doc, then loops over N training iterations
   (epochs). Loop uses `training-job-runtime` credentials, scoped to
   Firestore writes on `trainingRuns`/`evaluations` and R/W on both buckets.
5. **After every epoch**, the job appends one `TrainingEpoch` (`epoch`,
   `trainLoss`, `valLoss`, `valAccuracy`) to `trainingHistory` on the
   Firestore doc. This per-epoch write is what keeps `TrainingHistoryChart`
   meaningful against real numbers instead of the current simulated curve.
6. On completion: job uploads the final weights to
   `artifacts/<modelSpecId>/<newSnapshotId>.<ext>`, writes a new
   `WeightSnapshot` onto the `ModelSpec.savedWeights` array, sets
   `outputWeightsSnapshotId` on the `TrainingRun` doc, computes
   `finalMetrics` (`finalTrainLoss`, `finalValLoss`, `finalValAccuracy`,
   `epochs`), and sets `status: 'completed'` (or `'failed'` + error info if
   an exception occurred, so the frontend can show a failure state instead
   of hanging on "running").

## 5. Evaluation run lifecycle (mirrors training)

1. Frontend calls `POST /projects/:id/evaluations` with `modelSpecId`,
   `weightsSnapshotId`, `datasetId`.
2. API creates the `Evaluation` doc, `status: 'pending'`, calls the eval
   Cloud Run Job.
3. Job downloads the specified weight snapshot from the artifacts bucket,
   runs the §3 preprocessing pipeline over the held-out split, and produces
   one result per entry — the shape depends on `ModelSpec.type`:
   - classification/regression → `EntryResult` (`predictedLabel`,
     `trueLabel`, `confidence`)
   - clustering → `ClusteringEntryResult` (`clusterId`,
     `distanceToCentroid`, `silhouetteScore`)
   - llm-finetuning → `LLMEntryResult` (`prompt`, `referenceCompletion`,
     `generatedCompletion`, `rougeL`, `bleu`)
4. Job writes the full `entryResults: AnyEntryResult[]` array and the
   aggregate `metrics: EvaluationMetrics` onto the `Evaluation` doc, sets
   `completedAt`, `status: 'completed'`.

---

## 6. How results reach the frontend for visualization

Neither the training job nor the eval job ever talks to the frontend. The
only channel is: **job writes Firestore doc → API serves Firestore doc →
frontend polls API on an interval → React state update → chart re-render.**

1. `TrainingDetailPage.tsx` (currently ~lines 44-64 run a `setTimeout` +
   `generateTrainingHistory()` mock) is replaced, gated by `VITE_USE_API`,
   with a polling hook: `GET /trainingRuns/:id` every few seconds while
   `status` is `'pending'`/`'running'`, stopping once `'completed'`/`'failed'`.
2. Each poll response's `trainingHistory: TrainingEpoch[]` feeds
   `TrainingHistoryChart` (`src/components/training/TrainingHistoryChart.tsx`)
   directly — it already takes `TrainingEpoch[]` as its only prop, so the
   real per-epoch Firestore data is a drop-in replacement for the simulated
   array, no chart code changes needed. The component renders two Recharts
   line charts (train/val loss; val accuracy) that update as new epochs
   arrive during polling.
3. `finalMetrics` (once `status: 'completed'`) can be surfaced the same way
   evaluation metrics are today.
4. `EvaluationDetailPage.tsx` (currently ~lines 48-55, same simulate pattern)
   gets the equivalent polling hook against `GET /evaluations/:id`.
5. The response's `metrics: EvaluationMetrics` and `entryResults` feed the
   existing, already task-aware visualization components — again no chart
   changes needed, since these components already branch on `modelType`:
   - `MetricsPanel` (`src/components/evaluation/MetricsPanel.tsx`) renders
     metric cards + the confusion matrix table for classification/regression,
     cluster-size bars for clustering, benchmark grid for llm-finetuning.
   - `EvalMetricsSummary` (`src/components/evaluation/EvalMetricsSummary.tsx`)
     renders the compact headline number (accuracy / silhouette / perplexity)
     used in list views.
6. Because both pages already branch their rendering on `ModelSpec.type` and
   consume exactly the `TrainingEpoch`/`EvaluationMetrics`/`AnyEntryResult`
   shapes the Firestore docs are written in, **the visualization layer needs
   zero changes** — only the data-fetching (simulate → poll) swap described
   in step 1/4.

---

## 7. Explicitly deferred (not part of this pass)

- Streaming/sharded dataset download for the training job once datasets
  exceed "a few hundred entries download eagerly to local disk."
- Moving `Dataset.entries` out of the embedded Firestore array into a
  subcollection (or BigQuery) once a dataset nears the 1MB document ceiling.
- Real DICOM/NIfTI ingestion (`pydicom`/`nibabel`) instead of pre-converted
  PNG/`.npy`.
- `detection`/`segmentation` model implementations (loader stage is designed
  to support them; model stage is a v1 stub).
- Authenticating the Cloud Run API (API key or Firebase Auth ID tokens) —
  currently designed for local/single-user dev, defaults to
  allow-unauthenticated.
- CI/CD (Cloud Build triggers for the API and pipeline container images).
- Swapping Cloud Run Jobs → Vertex AI Custom Training/Pipelines — no
  frontend/API contract change required when this happens, since both write
  to the same `trainingRuns`/`evaluations` doc shape.
