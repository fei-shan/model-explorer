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

### 3 — Railway

Railway can serve the built static files via a simple Node.js static server, or use a Nixpacks auto-detected build.

**Option A — Nixpacks (recommended, zero config)**

1. Push the repo to GitHub.
2. In [Railway](https://railway.app), create a new project → **Deploy from GitHub repo**.
3. Railway auto-detects Node.js and runs `npm run build`. Set the start command to serve the `dist/` folder:

   In Railway → service settings → **Start Command**:
   ```
   npx serve dist
   ```
   Or add a `railway.json` at the repo root:
   ```json
   {
     "build": { "builder": "NIXPACKS" },
     "deploy": { "startCommand": "npx serve dist" }
   }
   ```

4. Railway assigns a public URL automatically (e.g. `https://model-explorer-production.up.railway.app`).

**Option B — Custom static server**

Add a minimal Express server at `server.js`:

```js
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app  = express();
const port = process.env.PORT || 3000;
const dir  = join(dirname(fileURLToPath(import.meta.url)), 'dist');

app.use(express.static(dir));
app.get('*', (_, res) => res.sendFile(join(dir, 'index.html')));  // SPA fallback
app.listen(port, () => console.log(`Listening on ${port}`));
```

Update `package.json`:

```json
"scripts": {
  "start": "node server.js"
}
```

Then deploy to Railway — it will run `npm run build` followed by `npm start`.

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
