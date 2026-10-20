# GitHub Pages root

This folder is the **GitHub Pages** site root (`Settings → Pages → Deploy from branch → /docs`).

| Path | Role |
|------|------|
| `index.html` / `styles.css` / `app.js` | UI (loads relative `data/*.json` when no local API) |
| `data/feed.json` | RSS + vocab snapshot (refreshed by Actions / `scripts/refresh_feed.py`) |
| `data/lexicon.json` | Seed lexicon copy |
| `data/programmes.json` | Programme glossary copy |

Local preview without `serve.py`:

```bash
cd docs && python3 -m http.server 8765
```

Open http://127.0.0.1:8765/
