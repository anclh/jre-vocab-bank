# Expand batch 1 — Q1 phrases + analysis lexicon

**Date:** 2026-10-20 (Asia/Hong_Kong)

## Counts

| Item | Before | After | Δ |
|------|--------|-------|---|
| Lexicon (`data/lexicon.json`) | 141 | 192 | +51 |
| Q1 phrase bank (`data/q1_phrases.json`) | 0 | 56 | +56 |
| Feed matches | ~78 (pre-batch) | *(re-run `refresh_feed.py`)* | — |

## Phrase bank by category

- **implications** (影響／後果): 10
- **assessment** (評估／分析): 10
- **recommend** (建議措施): 10
- **monitor** (監察／檢討): 8
- **specificity** (負責方／時限／資源): 8
- **discourse** (論述銜接): 10

## New lexicon terms (51)

Focus: **analysis + measure-specificity** for JRE English Q1 (problems → implications → measures).

- `implication`
- `knock-on effect`
- `cascade`
- `bottleneck`
- `shortfall`
- `uptake`
- `uptake rate`
- `assess`
- `assessment`
- `evaluate`
- `evaluation`
- `prioritise`
- `phase in`
- `scale up`
- `oversight`
- `enforcement gap`
- `service gap`
- `waiting time`
- `fiscal implication`
- `timeframe`
- `timeline`
- `accountable`
- `means test`
- `resource constraint`
- `trade-off`
- `feasibility`
- `cost-effectiveness`
- `interim measure`
- `stopgap`
- `root cause`
- `exacerbate`
- `compound`
- `give rise to`
- `entail`
- `necessitate`
- `warrant`
- `tackle`
- `curb`
- `plug the gap`
- `ring-fence`
- `contingent on`
- `milestone`
- `key performance indicator`
- `benchmark`
- `baseline`
- `lead department`
- `interdepartmental`
- `phased approach`
- `rollout`
- `coverage`
- `underutilisation`

## UI changes

- New nav tab **「Q1句式」** — searchable phrase cards with category filters + save-to-my-list
- **「本週迷你練習」** panel on **今日精選** — generates a 20–25 min mini-drill from weekly picks + Q1 phrases; Copy / Regen buttons
- Files touched: `docs/index.html`, `docs/app.js`, `docs/styles.css` (+ `static/` mirrors)
- `serve.py` exposes `GET /api/q1-phrases`
- `scripts/refresh_feed.py` syncs `q1_phrases.json` into `docs/data/`

## How to verify (static docs UI)

```bash
cd /path/to/jre-vocab-bank
python3 scripts/refresh_feed.py   # updates docs/data/feed.json + syncs seeds
cd docs && python3 -m http.server 8765
```

Open http://127.0.0.1:8765

Checklist:
1. Stats show lexicon ≈ 192
2. Tab **Q1句式** lists ~56 phrases; filters work; search works; 收藏 works
3. **今日精選 → 本週迷你練習** shows a prompt; **複製提示** copies; **重新抽題** changes scenario/bank items
4. No console errors loading `data/q1_phrases.json` / `data/lexicon.json` / `data/feed.json`

## Publish (parent / Mac)

Do **not** push from the box. On Mac:

```bash
cd ~/src/jre-vocab-bank
# sync box changes, then:
python3 scripts/refresh_feed.py
git add -A && git commit -m "Expand batch1: Q1 phrases + analysis lexicon + mini-drill"
git push
```

Pages URL: https://anclh.github.io/jre-vocab-bank/

Vault: copy `obsidian/Drill-mini-template.md` into `Personal/Learning/JRE 2026/05-English-Drills/` if useful; update `英文時事詞彙庫.md` counts if noted there.
