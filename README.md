# Shoshana Over — Bold Site

A second, bolder take on the personal portfolio site — same algae/sustainability substance
as the original, styled after landonorris.com's big-typography, single-accent-color,
editorial sports-brand aesthetic (adapted, not copied, into an algae-appropriate palette).

## Structure

- `index.html` — all page content
- `styles.css` — theme, layout, animations
- `script.js` — nav overlay, scroll-reveal, and the generative "algae swirl" canvas
  background (used full-bleed on dark sections and as placeholder fills inside gallery
  cards that don't have a real photo yet)
- `assets/img/` — the two real research photos currently in use
- `assets/resume/` — downloadable resume PDF

No build step — plain HTML/CSS/JS.

## Local preview

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Adding real photos later

Swap out any `.swirl-card` (a `<canvas class="swirl-canvas-small">` inside a
`.gallery-card`) for a plain `<img>` the same way the two real Research photos are set up,
and update its `.gtag` caption. No other markup changes needed.

## After editing `script.js`

Bump the version query string on its `<script>` tag in `index.html` (e.g. `script.js?v=1`
→ `?v=2`) — GitHub Pages' CDN caches it by filename, so a new version string is needed to
guarantee visitors get the update.

## Deploying (GitHub Pages, free)

Same as the original site: push this folder to its own GitHub repo, enable Pages
(Settings → Pages → Deploy from branch → `main` → `/root`), and it publishes at
`https://<username>.github.io/<repo-name>/`.
