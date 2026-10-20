# First-run verification

**Date:** 2026-10-20 (香港時間 Asia/Hong_Kong)  
**Command:** `python3 serve.py` → http://127.0.0.1:8765  
**Checks:** `curl http://127.0.0.1:8765/api/health` and `curl 'http://127.0.0.1:8765/api/feed?refresh=1'`

## Health

```json
{
  "ok": true,
  "service": "jre-vocab-bank",
  "rss": "https://www.info.gov.hk/gia/rss/general_en.xml",
  "lexiconSize": 141,
  "programmeCount": 60,
  "hasCache": true
}
```

## Feed ingest

| Metric | Value |
|--------|------:|
| RSS items ingested | **100** |
| Vocab matches (unique lexicon hits) | **77** |
| Lexicon size | **141** |
| Programme glossary items | **60** |
| Live fetch error | none |
| Cache written | `cache/last_feed.json` |

## Sample press releases (real feed titles)

1. SFST's opening remarks at APEC Finance Ministers' Meeting 2026 seminars…  
   https://www.info.gov.hk/gia/general/202610/20/P2026102000207.htm
2. First-round matching of Co-prosper HK now open for project proponents to submit proposals  
   https://www.info.gov.hk/gia/general/202610/20/P2026102000238.htm
3. Property owner fined over $250,000 for persistently not complying with removal order  
   https://www.info.gov.hk/gia/general/202610/20/P2026102000214.htm

## Sample matched vocabulary (from today’s feed)

| Term | 中文 | POS | Example excerpt (from RSS) |
|------|------|-----|----------------------------|
| sustainable finance | 可持續金融 | n. phr. | …green and **sustainable finance**. These th… |
| infrastructure | 基礎設施；基建設施 | n. | …development of our financial **infrastructure** ecosystem… |
| facilitate | 促進；便利 | v. | …to **facilitate** dialogue that advances our shared prosperity… |
| enforcement | 執法 | n. | …take stringent **enforcement** action… |
| ordinance | 條例 | n. | …issued under the Buildings **Ordinance** (BO)… |
| conviction | 定罪；判罪 | n. | …maximum penalty upon **conviction** is a fine… |
| prosperity | 繁榮 | n. | …advances our shared **prosperity** across the region… |
| tender | 招標；投標 | n./v. | (matched elsewhere in the same RSS batch) |

## Today’s picks (API `todaysPicks`)

Ranked for study priority on this run: sustainable finance, infrastructure, sustainable, enforcement, prosperity, conviction, stability, ordinance.

## Blockers

None. RSS reachable from the box; browser CORS avoided via server-side proxy in `serve.py`. Static UI (`/`, `/styles.css`, `/app.js`) returned HTTP 200.

## How to re-verify

```bash
cd /workspace/jre-vocab-bank
python3 serve.py
# other terminal:
curl -s http://127.0.0.1:8765/api/health
curl -s 'http://127.0.0.1:8765/api/feed?refresh=1' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['itemCount'], d['matchCount'])"
```
