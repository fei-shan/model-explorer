# model-explorer-api (Phase 1)

Express + Firestore API mirroring the mock Zustand store 1:1. This phase
intentionally has no training/eval logic yet — it only proves the
deploy/Firestore/CORS plumbing works.

## Setup (once `gcloud` is installed)

```bash
# from repo root
gcloud auth login
gcloud config set project <your-project-id>
gcloud auth application-default login   # lets the Firestore SDK pick up ADC locally

gcloud services enable firestore.googleapis.com
gcloud firestore databases create --location=<region, e.g. us-central1>
```

## Run locally

```bash
cd server
npm install
npm run seed   # imports src/mocks/* into Firestore, re-runnable
npm run dev    # http://localhost:8080
```

Then in the repo root, copy `.env.example` to `.env.local` and set
`VITE_USE_API=true` to point the frontend at this API instead of the
in-memory mocks.

## Endpoints

`GET/POST /:collection`, `GET/PUT/DELETE /:collection/:id` for each of:
`users`, `projects`, `datasets`, `modelSpecs`, `trainingRuns`, `evaluations`,
`flags`.
