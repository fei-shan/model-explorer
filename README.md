# Model Exploration System

An ML model exploration app for multi-modal clinical data, with role-based workflows for ML researchers and clinical practitioners: training run management, model evaluation, failure case review, and flag-based collaboration.

Runs in two modes, switched by one env var:

- **Demo mode** (default, `VITE_USE_API=false`) — frontend-only, all data is synthetic and generated in the browser. No backend, no environment variables, no cloud account needed. This is what sections 1-3 below deploy.
- **Real mode** (`VITE_USE_API=true`) — backed by a real Google Cloud pipeline: Firestore + Cloud Storage for data/models, Cloud Run Jobs that actually train/evaluate models. See §4 below and [`docs/data-pipeline.md`](docs/data-pipeline.md) for the full architecture.

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

---

### 1 — Local Development

```bash
git clone https://github.com/fei-shan/model-explorer.git
cd model-explorer
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. No backend or environment variables required — all data is synthetic and runs entirely in the browser (demo mode).

To build for production:

```bash
npm run build       # outputs to dist/
npm run preview     # serve the build locally at http://localhost:4173
```

---

### 2 — GitHub Pages

The app is configured for GitHub Pages deployment out of the box.

**What's already set up in this repo:**
- `vite.config.ts` — `base: '/model-explorer/'` is set.
- `public/404.html` — handles SPA deep-link redirects so React Router keeps working after a hard refresh or direct URL load.
- `.github/workflows/deploy.yml` — CI/CD pipeline that builds and pushes to the `gh-pages` branch on every push to `main`.

**One-time repository setup (do this once):**

1. Push the repo to GitHub (if not already done):
   ```bash
   git remote add origin https://github.com/fei-shan/model-explorer.git
   git push -u origin main
   ```

2. Enable GitHub Pages in the repository:  
   **Settings → Pages → Source → Deploy from a branch → `gh-pages` / `/ (root)`**

3. After the next push to `main`, the Actions workflow runs automatically.  
   The app will be live at **https://fei-shan.github.io/model-explorer/**.

**Manual deploy (optional, without Actions):**

```bash
npm install --save-dev gh-pages   # first time only
npm run deploy                    # builds then publishes dist/ to gh-pages branch
```

> **SPA routing note:** `public/404.html` saves the requested path to `sessionStorage` and redirects to the app root. A script in `index.html` restores the path before React Router initialises, making all deep links work transparently.

---

### 3 — Railway (Option A — Nixpacks, recommended)

This repo is ready for Railway deployment with zero additional config. The following files are already committed:

| File | Purpose |
|---|---|
| `railway.json` | Tells Railway to use Nixpacks and sets the start command |
| `vite.config.ts` | Uses `VITE_BASE_PATH` env variable (defaults to `/`) so the build serves from the root on Railway |
| `.github/workflows/deploy.yml` | Still sets `VITE_BASE_PATH=/model-explorer/` for the GitHub Pages build, so both deployments coexist |

**Step-by-step: deploy to Railway**

1. **Push this repo to GitHub** (if not already done):
   ```bash
   git remote add origin https://github.com/fei-shan/model-explorer.git
   git push -u origin main
   ```

2. **Create a Railway account** at [railway.app](https://railway.app) and log in.

3. **New project → Deploy from GitHub repo:**
   - Click **New Project** → **Deploy from GitHub repo**.
   - Authorise Railway to access your GitHub account if prompted.
   - Select **fei-shan/model-explorer** from the list.

4. **Railway detects the config automatically** — `railway.json` is present so no manual settings are needed. Railway will:
   - Detect Node.js via Nixpacks.
   - Run `npm ci && npm run build` (producing `dist/`).
   - Start the app with `npx serve -s dist` (`-s` enables SPA fallback so React Router deep links work).

5. **Generate a public domain:**
   - In the service panel, go to **Settings → Networking → Generate Domain**.
   - Railway assigns a URL like `https://model-explorer-production.up.railway.app`.

6. **All future pushes to `main`** redeploy automatically — no extra steps required.

> **No environment variables are required for demo mode.** `VITE_BASE_PATH` intentionally has no value set in Railway, so it defaults to `'/'` (root). Do not set it in Railway's variable panel unless you have a custom subpath.
>
> To make this same Railway (or GitHub Pages) deployment serve **real** data instead of synthetic data, set `VITE_USE_API=true`, `VITE_API_BASE_URL`, and `VITE_API_KEY` in Railway's variable panel, pointing at the deployed Cloud Run API from §4 below. The frontend hosting doesn't change — only which data it talks to.

---

### 4 — Real backend (Google Cloud)

Real mode replaces the synthetic in-browser data with an actual pipeline: **Firestore** (metadata), **Cloud Storage** (dataset files + trained weights), and **Cloud Run Jobs** that really train/evaluate models (not simulated). One Cloud Run **Service** (`server/`) is the only component the frontend ever talks to — it holds the only GCP credentials, everything else (Jobs, Firestore, GCS) is reached through it. Full architecture: [`docs/data-pipeline.md`](docs/data-pipeline.md).

**This repo's GCP project already has a deployed API** at a Cloud Run URL (ask whoever set up the project for the URL and API key, or see below to run/redeploy it yourself). To point any frontend deployment at it:

```bash
VITE_USE_API=true
VITE_API_BASE_URL=<the Cloud Run service URL>
VITE_API_KEY=<the API key>       # get it with: gcloud secrets versions access latest --secret=api-key
```

**Deploying/redeploying the API yourself** (requires `gcloud` auth + the GCP project already provisioned — see [`server/README.md`](server/README.md) for one-time setup):

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

> **Why `--allow-unauthenticated` if there's an API key?** Cloud Run's own IAM-based auth requires the caller to present a Google-signed token, which isn't practical for a public static-site frontend. The service is reachable by anyone, but the app-level `x-api-key` check (`server/src/auth.ts`) is the actual access control — every route except `/health` rejects requests without the correct key. This is a deliberately lightweight stand-in; see `docs/data-pipeline.md` §7 for the fuller auth hardening (Firebase Auth / per-user tokens) that's intentionally deferred.

**Running the API locally instead** (e.g. to develop against it, or if you'd rather not deploy): see [`server/README.md`](server/README.md). Training/evaluation containers (`pipeline/train`, `pipeline/evaluate`) and their own deploy steps are documented there too.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State management | Zustand 5 |
| Routing | React Router 6 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Demo-mode data | Synthetic, generated in-browser — no backend required |
| Real-mode API | Node/TypeScript + Express, Cloud Run Service (`server/`) |
| Real-mode data/storage | Firestore + Cloud Storage |
| Real-mode compute | Cloud Run Jobs (Python + scikit-learn, `pipeline/`) |
