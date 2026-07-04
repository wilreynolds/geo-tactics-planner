# Embedding the GEO Tactics Planner (no iframe)

This is a **native embed**. The planner renders directly into your page's DOM via a custom
element — no iframe. It sits inside a **shadow root**, so it stays style-isolated (HubSpot's
CSS can't bleed in and break it, and its styles can't leak out onto your page). Height is
natural: the page grows and shrinks with the tool, no resize scripts.

## The whole embed

```html
<geo-tactics-planner></geo-tactics-planner>
<script src="https://YOUR-HOST/geo-planner.js" async></script>
```

That's it. The script self-loads React, defines the element, and mounts. Put the `<script>`
once per page (or site-wide); use as many `<geo-tactics-planner>` tags as you want.

If a CMS ever strips unknown tags, there's a div fallback that behaves identically:

```html
<div data-geo-tactics-planner></div>
<script src="https://YOUR-HOST/geo-planner.js" async></script>
```

---

## Step 1 — Host `geo-planner.js`

Upload `geo-planner.js` anywhere public and copy its URL. On seerinteractive.com's HubSpot:

1. **Marketing → Files and Templates → Files**
2. **Upload** `geo-planner.js`
3. Open the file → **Copy URL** → that's your `src`.

(Or host on a subdomain you control — Cloudflare Pages / Netlify / GitHub Pages — if you'd
rather keep tool assets off the marketing CDN. Any static host works.)

## Step 2 — Drop it on a HubSpot page

In the HubSpot page editor, add a **Custom HTML** module (not plain rich text — rich text can
sanitize scripts) and paste the two-line embed from above with your real URL.

Want the script available on every page without pasting it each time? Add just the
`<script src="…/geo-planner.js" async></script>` line once under
**Settings → Content → Pages → Site Footer HTML**, then you only need the
`<geo-tactics-planner></geo-tactics-planner>` tag wherever you want the tool to appear.

---

## Notes

- **Why this beats an iframe:** it's part of the page (better on mobile, no fixed-height
  awkwardness, inherits page width naturally), while the shadow root still gives you the style
  isolation that made iframes tempting in the first place.
- **React loading:** the widget pulls React 18 from a CDN only if the page doesn't already
  have it. If HubSpot or another script already loaded React 18, it reuses it.
- **Multiple tools per page:** each `<geo-tactics-planner>` tag mounts its own instance.
- **Self-hosting React (optional):** if you don't want the unpkg CDN dependency, swap the two
  CDN URLs at the top of `geo-planner.js` for self-hosted copies of `react.production.min.js`
  and `react-dom.production.min.js`.
- **Open source:** anyone who forks the repo hosts `geo-planner.js` themselves and uses the
  same two-line embed. MIT — see LICENSE.

## Files

- `geo-planner.js` — the embeddable widget (this is what you host + embed).
- `embed-example.html` — a tiny page showing the embed in context. Open it locally to see it.
- `index.html` — a full standalone page (its own demo / open-source landing page).
