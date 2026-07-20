# Model Exploration System

A frontend-only demo prototype for ML model exploration with multi-modal clinical data. Supports role-based workflows for ML researchers and clinical practitioners, including training run management, model evaluation, failure case review, and flag-based collaboration.

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

Open **http://localhost:5173** in your browser. No backend or environment variables required — all data is synthetic and runs entirely in the browser.

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

> **No environment variables are required.** `VITE_BASE_PATH` intentionally has no value set in Railway, so it defaults to `'/'` (root). Do not set it in Railway's variable panel unless you have a custom subpath.

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
| Data | Synthetic — no backend required |
