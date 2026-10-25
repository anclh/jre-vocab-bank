# JRE 英文時事詞彙庫 (Vocab Bank)

A study app for **Hong Kong JRE English** candidates. It pulls the latest **English** HKSAR press releases from the official GIA RSS feed, matches them against a curated government-style vocabulary lexicon, and presents bilingual learning cards plus a starter EN↔ZH programme glossary.

Inspired by the *idea* of CSRadar’s「英文時事詞彙庫」, but **original UI, copy, and seed data** — not a clone of their branding or proprietary content.

## Quick start (local, live RSS)

```bash
cd jre-vocab-bank
python3 serve.py
```

Open **http://127.0.0.1:8765**

Optional port: `PORT=9000 python3 serve.py`

Requirements: **Python 3.10+**, standard library only (no pip install).

## GitHub Pages (static, no Python at runtime)

The `docs/` folder is a static site. The UI loads `data/feed.json` (and lexicon / programmes) when `/api/*` is unavailable.

### Enable Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` (or `master`) → folder **`/docs`** → Save
3. Site URL will be `https://<user>.github.io/<repo>/`

### Local static preview

```bash
cd docs
python3 -m http.server 8765
```

### Refresh the RSS snapshot

```bash
python3 scripts/refresh_feed.py
```

Writes `docs/data/feed.json` and updates `cache/last_feed.json`. Also syncs `lexicon.json` / `programmes.json` into `docs/data/`.

A GitHub Action (`.github/workflows/refresh-feed.yml`) runs this **daily** and on **workflow_dispatch**, then commits the updated snapshot.

## Features

| Feature | Description |
|--------|-------------|
| Live RSS (local) | `https://www.info.gov.hk/gia/rss/general_en.xml` via `serve.py` |
| Static snapshot (Pages) | Prebuilt `docs/data/feed.json` |
| Vocab cards | EN term · 繁中 gloss · POS · related forms · example excerpt · link to release |
| Today’s picks | Harder / longer matched terms, preferring today’s releases |
| My list | Save cards in `localStorage` · export JSON |
| Programme glossary | ~60 starter HK policy / scheme names EN↔ZH |
| Q1 phrase bank | Discussion-paper frames: implications · assessment · recommend · monitor · who–when–resources · discourse markers |
| Mini-drill | Weekly 20–25 min prompt from today’s picks + Q1 phrases (今日精選 panel) |

See `EXPAND_BATCH2.md` (and `EXPAND_BATCH1.md`) for the latest lexicon / phrase counts. Lexicon ≈ **203** terms.

## API (local `serve.py` only)

- `GET /api/health` — service status
- `GET /api/feed` — RSS items + vocab matches (`?refresh=1` to force)
- `GET /api/lexicon` — full seed lexicon
- `GET /api/programmes` — programme glossary
- `GET /api/q1-phrases` — Q1 discussion-paper phrase bank

## Data files

- `data/lexicon.json` — curated HK gov / civil-service English terms (source of truth)
- `data/q1_phrases.json` — Q1 discussion-paper phrase bank
- `data/programmes.json` — starter「常見政府項目中英文對照表」
- `docs/data/*` — copies + `feed.json` snapshot for Pages
- `cache/last_feed.json` — written by local server / refresh script

## How matching works

1. Fetch English GIA RSS (titles + descriptions, HTML stripped).
2. Scan with word-boundary regex against the lexicon (**longer phrases first**).
3. Each matched term becomes one card with a short source excerpt and press-release link.

## Disclaimer

- Press-release text © HKSAR Government; used here for **personal study** via the public RSS.
- Programme names are a **starter bank** for revision — verify official wording on gov.hk / info.gov.hk.
- Not affiliated with the HKSAR Government or CSRadar.

## Project layout

```
jre-vocab-bank/
├── serve.py                 # local HTTP + live RSS API (serves docs/)
├── scripts/refresh_feed.py  # write docs/data/feed.json from RSS
├── data/                    # seed lexicon + programmes (source)
├── docs/                    # GitHub Pages root
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── data/
│       ├── feed.json
│       ├── lexicon.json
│       ├── q1_phrases.json
│       └── programmes.json
├── cache/                   # local / CI fetch cache
├── static/                  # mirror of frontend (kept in sync)
├── obsidian/                # optional vault templates
├── EXPAND_BATCH1.md         # expansion notes (batch 1)
├── EXPAND_BATCH2.md         # expansion notes (batch 2; latest lexicon count)
└── .github/workflows/refresh-feed.yml
```
