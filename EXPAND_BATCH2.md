# Expand batch 2 — CSRadar detailed-analysis terms

**Date:** 2026-10-25 (Asia/Hong_Kong)

## Counts

| Item | Before | After | Δ |
|------|--------|-------|---|
| Lexicon (`data/lexicon.json`) | 192 | 203 | +11 (+ enrich `liaison`) |

`docs/data/lexicon.json` kept identical to `data/lexicon.json`.

## Source

Anson’s **csradar.com**「詞彙詳細解析」screenshots (12 cards). Used as a **learning reference** for term sense, synonyms, and example wording — **not** republishing CSRadar UI, branding, or proprietary content. Entries are rewritten into this repo’s schema (`term` / `zh` / `pos` / `related` / `note` / `example`).

## New lexicon terms (11)

- `malfunction`
- `contravention`
- `allegation`
- `litigation`
- `impartiality`
- `ascertain`
- `regime`
- `attested`
- `paramount`
- `infuse`
- `deterrence`

## Enriched in place (1)

- `liaison` — zh → 聯絡；協調； related merged with connection / coordination / communication / liaise / liaising； note refreshed； added example

## Schema notes

- Traditional Chinese glosses use `；` like existing entries.
- Synonyms (+ useful word-family forms) live in `related`.
- Short JRE / policy usage tip (and brief antonyms) in `note`.
- One strong policy/admin English sentence in optional `example` (UI already renders it when present).
- `regime`: prefer 制度／規管制度 for HK/JRE; political「政權」flagged as secondary in `note`.
- `deterrence`: note also mentions common *a deterrent* nuance.

## How to verify

```bash
python3 -c "import json; print(len(json.load(open('data/lexicon.json'))))"  # 203
cmp data/lexicon.json docs/data/lexicon.json && echo IDENTICAL
```

Static UI: open Pages or `cd docs && python3 -m http.server 8765` → lexicon / 詞彙庫 should list the new terms.

## Publish

```bash
git add data/lexicon.json docs/data/lexicon.json EXPAND_BATCH2.md
git commit -m "vocab: add 11 CSRadar terms + enrich liaison (batch 2)"
git push
```

Pages URL: https://anclh.github.io/jre-vocab-bank/
