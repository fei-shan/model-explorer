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

The app is a static single-page application and can be deployed to GitHub Pages with one extra configuration step.

**Step 1 — Set the base path.**  
In `vite.config.ts`, add the `base` field matching your repo name:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  base: '/model-explorer/',   // replace with your repo name
})
```

**Step 2 — Build and deploy.**  
Using the [`gh-pages`](https://github.com/tschaub/gh-pages) package:

```bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
```

Or use the GitHub Actions workflow below — create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Step 3 — Enable Pages.**  
In the repository → Settings → Pages, set the source to the `gh-pages` branch.

The app will be live at `https://<your-username>.github.io/model-explorer/`.

> **Note:** React Router uses client-side routing. GitHub Pages does not support fallback routing by default. Add a `404.html` that redirects to `index.html`, or switch the router to `HashRouter` in `src/App.tsx` for full compatibility.

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
