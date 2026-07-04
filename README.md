# GEO Tactics Planner

An interactive planner for **GEO (Generative Engine Optimization)** work, built on the
**Seen → Believed → Chosen** framework.

Drag 34 GEO tactics across two boards — **Speed × Risk** and **Risk × Impact** — gate them
by what your team can actually execute (PR / Tech / Content / Brand capability sliders), and
get a **sample KPI for every tactic you place**, each one tied to where the data actually
comes from (an AI visibility tool like Scrunch/Profound, or GA4).

The core idea: visibility is the faceoff, not the goal. Every "Seen" number the planner
surfaces ladders back to one shared **Believed basket** — brand impressions + direct +
newsletter — so a rising visibility line never gets celebrated on its own.

## Live demo

> Once you deploy (see below), drop your URL here:
> **https://YOUR-USERNAME.github.io/geo-tactics-planner/**

## Run it locally

There's no build step. It's one file.

```bash
# just open it
open index.html          # macOS
# or double-click index.html in your file browser
```

React and Babel load from a CDN and the JSX is transpiled in the browser, so the file works
straight off your disk or any static host.

## Deploy it (pick one)

### Option A — GitHub Pages (recommended for open source)

1. Create a new public repo (e.g. `geo-tactics-planner`) and push these files to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick branch **main** and folder **/ (root)**, then **Save**.
5. Wait ~1 minute. Your tool is live at `https://YOUR-USERNAME.github.io/geo-tactics-planner/`.

### Option B — Netlify / Vercel / Cloudflare Pages (fastest)

- **Netlify:** drag the folder onto https://app.netlify.com/drop — live in seconds.
- **Vercel:** `npx vercel` in this folder, or import the repo at vercel.com.
- **Cloudflare Pages:** connect the repo at pages.cloudflare.com, no build command needed.

All three also auto-deploy on every push once connected to the repo.

## Customize

Everything lives in `index.html`:

- **`TACTICS`** — the 34 tactics with their speed / risk / impact scores and capability levels.
- **`KPI`** — the per-tactic sample KPI, stage, and measurability rating.
- **`LEVERS`** — the four capability tracks and their colors.

Edit those arrays/objects to fit your own tactic library. No tooling required.

## Want the faster/production version?

This build transpiles in the browser (a small load-time cost, fine for a tool like this).
If you'd rather ship a compiled bundle, port `index.html` into a Vite + React project and
deploy the `dist/` output the same way — same code, faster first paint.

## Credits

Created by **Wil Reynolds** ([Seer Interactive](https://www.seerinteractive.com)).
Framework: **Seen → Believed → Chosen.**

## License

[MIT](./LICENSE) — free to use, fork, and adapt. Attribution appreciated.
