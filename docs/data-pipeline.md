# Data & Training Pipeline on Google Cloud

This describes the system **as actually built and deployed**, not as a plan.
Every resource, endpoint, and file path named below exists and has been
exercised end-to-end (locally and, for the API/Jobs, via the live deployment)
at the time of writing. Where something described in an earlier design pass
was never actually built, that's called out explicitly in §7 rather than
presented as real.

## 1. Deployed resources

| Resource | Type | Name | Notes |
|---|---|---|---|
| Metadata store | Firestore (Native mode) | default database, `us-central1` | 7 collections: `users`, `projects`, `datasets`, `modelSpecs`, `trainingRuns`, `evaluations`, `flags` |
| Dataset storage | GCS bucket | `<project>-model-explorer-data` | raw entry files (CSV, PNG) |
| Model storage | GCS bucket | `<project>-model-explorer-artifacts` | pickled trained models |
| API | Cloud Run **Service** | `model-explorer-api` | Express, public URL, gated by an API key (§6) |
| Training compute | Cloud Run **Job** | `train-job` | Python, `scikit-learn` |
| Evaluation compute | Cloud Run **Job** | `evaluate-job` | Python, `scikit-learn` |
| API identity | Service account | `api-runtime@<project>.iam.gserviceaccount.com` | Firestore R/W, GCS R/W both buckets, mints signed URLs, triggers both Jobs |
| Job identity | Service account | `training-job-runtime@<project>.iam.gserviceaccount.com` | Firestore R/W, GCS read on data bucket, R/W on artifacts bucket. Shared by both Jobs — same trust boundary, no reason for a third SA |
| API key secret | Secret Manager | `api-key` | app-level auth for the public API (§6) |
| Job-trigger role | Custom IAM role | `projects/<project>/roles/trainJobTrigger` | `run.jobs.{get,run,runWithOverrides}` only — bound to `api-runtime` on both Job resources specifically, not project-wide. Deliberately narrower than the predefined `roles/run.developer`, which also grants create/delete on all Cloud Run resources. Name predates `evaluate-job` existing; still accurate in scope, just not in naming |
| Container images | Artifact Registry | `us-central1-docker.pkg.dev/<project>/model-explorer/{api,train,evaluate}` | pushed via Cloud Build, no local Docker involved |

Get the live API URL and key:
```bash
gcloud run services describe model-explorer-api --region us-central1 --format='value(status.url)'
gcloud secrets versions access latest --secret=api-key
```

**Everything cross-service is authenticated via short-lived impersonation**
(`google.auth.impersonated_credentials` in Python, `Impersonated` from
`google-auth-library` in Node) — there is no downloaded service-account key
file anywhere in this system, in code, in git, or on any deployed container.
The same code runs unmodified whether the ambient identity already *is* the
target service account (Cloud Run, in production — effectively
self-impersonation) or a human's `gcloud auth application-default login`
session with `roles/iam.serviceAccountTokenCreator` on that service account
(local dev). See `server/src/gcs.ts`, `server/src/cloudRunJobs.ts`,
`pipeline/*/gcp_clients.py`.

---

## 2. Dataset ingestion

Real flow, exercised by `pipeline/ingest/*.py` and (once the frontend's
upload UI exists — see §7) will be exercised by the browser identically:

1. Caller asks the API for a signed upload URL:
   `POST /datasets/:datasetId/entries/upload-url` with `{entryId,
   contentType, ext}` (`server/src/routes/datasetEntries.ts`).
2. API mints a V4 signed URL scoped to
   `raw/<datasetId>/<entryId>.<ext>` in the data bucket, via
   `getUploadUrl()` in `server/src/gcs.ts`.
3. Caller `PUT`s the file bytes directly to that signed URL — straight to
   GCS, never through the API process.
4. Caller confirms: `POST /datasets/:datasetId/entries` with the entry's
   metadata (`subjectId`, `diagnosis`, `modalityType`, etc.) plus the
   `gs://...` path. The API appends it to the `Dataset` document's `entries`
   array in Firestore (`server/src/routes/datasetEntries.ts`, upsert-by-id
   so re-confirming an entry doesn't duplicate it).

**What's actually in GCS right now**, produced by this exact flow:
`raw/ds-breast-cancer-train/en-bc-*.csv` (30 numeric features per file),
`raw/ds-breast-cancer-eval/en-bce-*.csv` (a disjoint held-out set),
`raw/ds-digits-train/en-dg-*.png` (64×64 upscaled digit images).

---

## 3. Model weights

**Only one path exists today: weights produced by a training run.**
`pipeline/train/train.py` pickles `{model, scaler, label_encoder}` and
uploads it directly to `artifacts/<modelSpecId>/w-<trainingRunId>.pkl`
using the `training-job-runtime` identity, then appends a `WeightSnapshot`
to the `ModelSpec.savedWeights` array in Firestore.

There is **no** "upload your own pretrained weights" endpoint
(`POST /modelSpecs/:id/weights`) — an earlier design pass planned one, but
it was never built. If you want to evaluate an externally-trained model,
today the only way in is to make `pipeline/train` produce it, not to upload
a `.pt`/`.pkl` file directly. Worth building if that use case comes up (see
§7).

---

## 4. Multimodal preprocessing — what's actually implemented

`pipeline/train/loaders.py` and `pipeline/evaluate/loaders.py` (identical,
intentionally duplicated — see that file's docstring) are split into two
layers, deliberately kept separate:

**Layer 1 — generic, data-type-level loaders.** These have no idea which
clinical modality they're loading:

```python
def load_image(local_path, size=(8,8)) -> np.ndarray: ...        # any image file -> flattened [0,1] pixel vector
def load_tabular(local_path) -> np.ndarray: ...                   # any 'feature,value' CSV -> sorted feature vector
def fit_caption_vectorizer(captions: list) -> TfidfVectorizer: ... # fit once on a training corpus of caption strings
def vectorize_caption(vectorizer, caption: str) -> np.ndarray: ... # transform one caption through an already-fitted vectorizer
```

Text uses a **fitted** `TfidfVectorizer`, not a hand-picked fixed vocabulary
— the vocabulary is learned from real training captions (`fit` once, on the
training split only), then only ever `.transform()`'d at eval time, exactly
the same fit-on-train/apply-everywhere pattern already used for
`StandardScaler`. This generalizes to whatever text a project actually has,
rather than working only for words someone anticipated in advance.

`load_image` loads MRI, CT, X-Ray, or Pathology-as-images identically — same
bytes in, same vector out. This is the reusable part; adding a new
image-shaped modality needs zero new loader code.

**Layer 2 — a thin modality → data-type mapping**, the only clinically-aware
part of the above:

```python
ALL_MODALITIES = ["MRI", "ECG", "CT", "Pathology", "Clinical Note", "X-Ray"]  # every value the type system allows
MODALITY_DATA_TYPE = {"Pathology": "tabular", "X-Ray": "image"}               # only these two implemented
DATA_TYPE_LOADERS = {"image": load_image, "tabular": load_tabular}
```

Only `Pathology`/`X-Ray` are mapped; anything else raises
`NotImplementedError` naming what *is* supported, rather than silently
guessing. Same registry pattern in `pipeline/train/models.py` /
`pipeline/evaluate/evaluators.py` for `ModelSpec.type`:

```python
ALL_MODEL_TYPES = ["classification", "regression", "detection", "segmentation", "clustering", "llm-finetuning"]
MODEL_BUILDERS = {
    "classification": build_classifier,  # SGDClassifier(loss='log_loss') — real per-epoch SGD, not LogisticRegression's opaque batch .fit()
    "regression": build_regressor,       # SGDRegressor, same per-epoch-progress reasoning
}
```

`classification` and `regression` both have real trainers/evaluators today.
Three seeded `ModelSpec`s: `ms-logreg-breast-cancer` and `ms-logreg-digits`
(`classification`), plus `ms-sgdreg-xray-caption` (`regression`, see below).

### The multimodal (image + text) regression task

`ms-sgdreg-xray-caption`, on the `p-digits` project, reuses the *same*
`ds-digits-train` images the classification `ModelSpec` trains on — no
separate ingestion needed, because both the input's text component and the
regression target are **computed from the image at train/eval time**, not
stored anywhere. This is the one place `loaders.py` goes beyond the two
generic layers, because there's no way to make "derive a caption from an
image" itself generic — same reason detection/segmentation will each need
their own logic later, not just a registry entry:

- `derive_xray_caption(pixels)` turns real pixel statistics (stroke
  left-right symmetry) into a short natural-language string, built from
  `load_image`'s output. The captioning step is domain-specific; the
  vectorizer it hands off to (below) is not.
- `xray_ink_coverage(pixels)` (mean pixel intensity) is the real, continuous
  regression target — deliberately a *different* derived quantity than what
  the caption describes (symmetry vs. density), so the caption is a
  genuinely separate signal rather than a bucketed restatement of the
  answer.
- Feature extraction is identical at train and eval time (same functions,
  same image), so there's no train/eval skew risk despite nothing being
  persisted.

**Fitting the vectorizer needs the whole training corpus at once, which is
why this composition is orchestrated by `train.py`/`evaluate.py` directly**
rather than living inside `loaders.py`'s generic per-entry
`load_entry_vector` dispatch (that function handles only the single-modality
case now, used as-is by classification). `train.py`'s regression path runs
two passes: (1) download every entry, load its pixels, derive its caption,
compute its target — collecting captions and pixel vectors without combining
them yet; (2) fit `TfidfVectorizer` on *only the training-split* captions,
then `vectorize_caption()` every entry's caption (train **and** val) through
that one fitted vectorizer before concatenating each onto its pixel vector.
The fitted vectorizer is pickled alongside the model/scaler (a fourth field
in the same dict) so `evaluate.py` can `vectorize_caption()` held-out
captions against the exact training vocabulary — never refitting on eval
data, which would leak eval vocabulary into the featurization. `train.py`
decides to run this multimodal path at all by checking
`ModelSpec.type == "regression"`, not `Dataset.modalities`, since it's the
same `X-Ray` images either way, just a different feature representation for
a different task.

---

## 5. Training and evaluation lifecycle

**Training** — `POST /projects/:projectId/training-runs`
(`server/src/routes/trainingRunTrigger.ts`):
1. Creates the `TrainingRun` doc (`status: 'pending'`), appends its id to
   `Project.trainingRunIds`.
2. Calls `runTrainingJob(id)` (`server/src/cloudRunJobs.ts`) — a direct
   Cloud Run Admin REST call (`POST .../jobs/train-job:run`) with an
   `overrides.containerOverrides[].env` setting `TRAINING_RUN_ID=<id>`.
   Fire-and-forget: the HTTP response returns as soon as the execution is
   *created*, not when it finishes.
3. Responds `202` immediately with the pending doc.
4. Inside the Job (`pipeline/train/train.py`): looks up the run → its
   `ModelSpec` + `Dataset` → downloads every entry file → extracts features
   via §4's loader → trains `SGDClassifier` one epoch at a time via
   `partial_fit`, writing the full `trainingHistory` array to Firestore
   after **every single epoch** (real progress, not a simulated curve) →
   on completion, uploads weights (§3), sets `finalMetrics`, sets
   `status: 'completed'`.

**Evaluation** — `POST /projects/:projectId/evaluations`
(`server/src/routes/evaluationTrigger.ts`) mirrors this exactly, triggering
`evaluate-job` instead. Inside the Job
(`pipeline/evaluate/evaluate.py`): downloads the specified
`WeightSnapshot`'s pickle + every entry in the (held-out) evaluation
dataset, scores them, writes `entryResults` (`EntryResult[]`) and `metrics`
(`EvaluationMetrics`) to the `Evaluation` doc.

**A genuine Firestore constraint surfaced here and is handled explicitly**:
Firestore rejects arrays nested directly inside arrays, and
`EvaluationMetrics.confusionMatrix.matrix` is `number[][]`. Both the Node
side (`server/src/serialize/evaluationMatrix.ts`) and the Python side
(`pipeline/evaluate/firestore_encoding.py`) flatten it to
`{rows, cols, values}` on write and the Node side reshapes it back to
`number[][]` on every `GET` — verified round-tripping the exact original
matrix, both locally and via a real Cloud Run Job execution. (The deployed
API service itself has been verified for the training-trigger and
signed-URL paths, not yet for a full evaluation run end-to-end through it
specifically — worth a quick check before relying on it.)

Both routes are fire-and-forget by design: nothing in this system ever
blocks an HTTP request on a training run finishing (some take minutes,
including Cloud Run cold-start).

---

## 6. Auth

The deployed API has **no** built-in login/session system — same mock
user picker as demo mode. What *is* real: a shared-secret gate
(`server/src/auth.ts`) in front of every route except `/health`. Only
enforced when the `API_KEY` env var is set (always true when deployed via
Secret Manager; unset — so a no-op — for local dev). The frontend sends it
as `x-api-key` when `VITE_API_KEY` is configured
(`src/services/api.ts`).

Cloud Run itself is set to `--allow-unauthenticated` — its own IAM-based
caller auth requires a Google-signed token, which a public static-site
browser client can't practically present, so the app-level key is the
actual access control, not Cloud Run's.

---

## 7. Explicitly not built (don't assume these exist)

- **Frontend upload UI** for datasets/model weights — §2's flow is real and
  callable, but only `pipeline/ingest/*.py` scripts call it today. No
  "upload a file" button exists in the app yet.
- **`POST /modelSpecs/:id/weights`** (upload externally-trained weights) —
  see §3. Only job-produced weights exist.
- **`detection`, `segmentation`, `clustering`, `llm-finetuning`**
  loaders/trainers/evaluators — the registries in §4 are structured to add
  these later (one new function each, no orchestration changes needed), but
  none exist yet. (`regression` *is* now implemented — see §4.)
- **Real DICOM/NIfTI ingestion** — images are assumed pre-converted to
  plain PNG/CSV at ingest time; no `pydicom`/`nibabel` anywhere.
- **CI/CD** — every deploy in this document (`gcloud builds submit` +
  `gcloud run deploy` / `gcloud run jobs create`) is a manual command run
  by a human. No Cloud Build trigger fires on `git push`.
- **Real user auth** — the login page's user picker is exactly as fake in
  real mode as in demo mode. The API key (§6) controls *whether a caller
  can reach the API at all*, not *which user they are*.
- **Streaming/sharded downloads** — training/eval jobs download every entry
  file to local disk eagerly. Fine at "tens of entries"; will not scale to
  large datasets without rework.
- **Entries as a subcollection** — `Dataset.entries` is still one embedded
  Firestore array. Will hit the 1MB document ceiling well before it hits
  any real scale problem.
- **Vertex AI** — Cloud Run Jobs were chosen for lowest setup cost. The
  `TrainingRun`/`Evaluation` doc-based contract (§5) was deliberately kept
  decoupled from *how* compute runs, so swapping to Vertex AI Pipelines
  later shouldn't require a frontend or API contract change — but this is
  an untested design intention, not something proven by this codebase.
