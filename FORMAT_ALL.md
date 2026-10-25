# FORMAT_ALL — lexicon card-format enrichment

Date: 2026-10-25 (Asia/Hong_Kong)

## Counts
- Total entries: **203**
- Already full (CSRadar) before this run: **12**
- Newly enriched to full format: **191**
- CSRadar syn/ant quality upgrades: **11**
- After: every entry has synonyms≥3, antonyms≥3, examples==3 (en+zh)
- `data/lexicon.json` and `docs/data/lexicon.json`: **byte-identical**

## Quality bar applied
- Synonyms: near-synonyms in HK gov/policy/academic register; no morphological padding of the headword as a synonym
- Antonyms: genuine opposites / clear policy contrasts; no empty or filler pairs
- Examples: 3 bilingual exam/gov-register sentences; `example` = first EN

## Hard / note cases
- Proper-noun / programme names (e.g. Greater Bay Area, Belt and Road, CSSA, OALA): antonyms use clear policy contrasts (standalone/isolationism/no safety-net) rather than forced single-word opposites
- Positional pairs (inbound/outbound, outpatient/inpatient, statutory/non-statutory): antonyms are true complements
- `fiscal reserves` antonym used “depleted reserves / fiscal deficit stock / negative reserves” as contrast set

## Sample (non-CSRadar): alleviate
```json
{
  "term": "alleviate",
  "zh": "紓緩；減輕",
  "pos": "v.",
  "related": [
    "alleviation",
    "alleviating"
  ],
  "note": "常見於房屋、貧窮、交通擠塞政策",
  "synonyms": [
    "ease",
    "relieve",
    "mitigate"
  ],
  "antonyms": [
    "exacerbate",
    "aggravate",
    "worsen"
  ],
  "examples": [
    {
      "en": "The new housing measures aim to alleviate the shortage of affordable flats.",
      "zh": "新房屋措施旨在紓緩可負擔單位短缺。"
    },
    {
      "en": "Targeted subsidies can alleviate the burden on low-income households.",
      "zh": "針對性津貼可減輕低收入家庭的負擔。"
    },
    {
      "en": "Better traffic management helps alleviate congestion at peak hours.",
      "zh": "更佳的交通管理有助紓緩繁忙時段擠塞。"
    }
  ],
  "example": "The new housing measures aim to alleviate the shortage of affordable flats."
}
```
