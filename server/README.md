# model-explorer-api

Express + Firestore/GCS API that backs Model Explorer's "real mode"
(`VITE_USE_API=true`). Holds the only GCP credentials in the whole system —
the frontend never touches Firestore/GCS/Cloud Run directly, only this API.
Full architecture: [`../docs/data-pipeline.md`](../docs/data-pipeline.md).

## One-time GCP setup (run once per project)

```bash
gcloud auth login
gcloud config set project <your-project-id>
gcloud auth application-default login   # lets local dev pick up your credentials

gcloud services enable run.googleapis.com firestore.googleapis.com \
  storage.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com

gcloud firestore databases create --location=<region, e.g. us-central1>

gcloud storage buckets create gs://<project>-model-explorer-data --location=<region>
gcloud storage buckets create gs://<project>-model-explorer-artifacts --location=<region>

# Two service accounts, least-privilege: api-runtime serves the app and
# signs upload URLs; training-job-runtime is what pipeline/train and
# pipeline/evaluate run as (see ../pipeline/*/README-equivalent docstrings).
gcloud iam service-accounts create api-runtime
gcloud iam service-accounts create training-job-runtime
# ... IAM bindings for both (Firestore R/W, scoped bucket R/W, Cloud Run Jobs
# trigger permission for api-runtime) - see docs/data-pipeline.md for the
# exact role list; there's no single command for all of it.
```

## Run locally

```bash
cd server
npm install
cp .env.example .env      # fill in your project's values
npm run seed               # imports src/mocks/* into Firestore, re-runnable
npm run dev                 # http://localhost:8080
```

Then in the repo root, copy `.env.example` to `.env.local`, set
`VITE_USE_API=true`, and leave `VITE_API_BASE_URL=http://localhost:8080` (the
default) to point the frontend at this local server instead of synthetic
data. `VITE_API_KEY` isn't needed locally — `API_KEY` is unset in
`server/.env`, so the auth gate (`src/auth.ts`) is a no-op.

## Deploying to Cloud Run (making it real for anyone, not just local dev)

The API is designed to run identically whether it's you locally or the
deployed service — same code path, same impersonation pattern (see
`src/gcs.ts`, `src/cloudRunJobs.ts`), just a different ambient identity.

**One-time**: create an API key, since the deployed service will be publicly
reachable (Cloud Run's own IAM auth isn't practical for a public static-site
frontend to use, so this app-level key is the actual access control):

```bash
openssl rand -hex 32 | gcloud secrets create api-key --data-file=-
gcloud secrets add-iam-policy-binding api-key \
  --member="serviceAccount:api-runtime@<project>.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Build, push, deploy**:

```bash
cd server
gcloud builds submit --tag us-central1-docker.pkg.dev/<project>/model-explorer/api:latest .

gcloud run deploy model-explorer-api \
  --image us-central1-docker.pkg.dev/<project>/model-explorer/api:latest \
  --region us-central1 \
  --service-account api-runtime@<project>.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_CLOUD_PROJECT=<project>,DATA_BUCKET=<project>-model-explorer-data,ARTIFACTS_BUCKET=<project>-model-explorer-artifacts,SIGNING_SERVICE_ACCOUNT=api-runtime@<project>.iam.gserviceaccount.com,GCP_REGION=us-central1,TRAIN_JOB_NAME=train-job,EVALUATE_JOB_NAME=evaluate-job \
  --set-secrets API_KEY=api-key:latest \
  --allow-unauthenticated
```

Redeploying after code changes is the same two commands (`builds submit` then
`run deploy`) — Cloud Run just creates a new revision.

Get the deployed URL and key for pointing a frontend at it:

```bash
gcloud run services describe model-explorer-api --region us-central1 --format='value(status.url)'
gcloud secrets versions access latest --secret=api-key
```

## Endpoints

Generic CRUD — `GET/POST /:collection`, `GET/PUT/DELETE /:collection/:id` —
for each of: `users`, `projects`, `datasets`, `modelSpecs`, `trainingRuns`,
`evaluations`, `flags`.

Plus purpose-built routes:

| Route | Purpose |
|---|---|
| `POST /datasets/:datasetId/entries/upload-url` | Signed GCS upload URL for one raw entry file |
| `POST /datasets/:datasetId/entries` | Confirm an uploaded entry, append it to the Dataset doc |
| `POST /projects/:projectId/training-runs` | Create a TrainingRun doc + trigger the `train-job` Cloud Run Job |
| `POST /projects/:projectId/evaluations` | Create an Evaluation doc + trigger the `evaluate-job` Cloud Run Job |
| `GET /health` | Unauthenticated liveness check (only route the API key gate exempts) |

Every route except `/health` requires an `x-api-key` header when `API_KEY`
is set in the environment (always true when deployed; unset by default
locally).

## Related

- `../pipeline/train`, `../pipeline/evaluate` — the actual training/evaluation
  containers this API triggers. Separate Cloud Run Jobs, separate deploy
  steps, documented via their own module docstrings and
  `../docs/data-pipeline.md`.
- `../pipeline/ingest` — one-off scripts that seed real toy datasets through
  this API's upload flow (not run automatically).
