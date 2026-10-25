#!/usr/bin/env python3
"""Enrich all lexicon entries to CSRadar card format (synonyms/antonyms/examples)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path("/workspace/jre-vocab-bank")
DATA = ROOT / "data" / "lexicon.json"
DOCS = ROOT / "docs" / "data" / "lexicon.json"
REPORT = ROOT / "FORMAT_ALL.md"

# Overlay: term -> {synonyms, antonyms, examples:[{en,zh}], related?}
# Related forms from existing entry are preserved unless we override related here.
E: dict = {}

def add(term, synonyms, antonyms, examples, related=None):
    assert len(synonyms) >= 3 and len(antonyms) >= 3 and len(examples) == 3
    for ex in examples:
        assert ex.get("en") and ex.get("zh")
    entry = {
        "synonyms": synonyms,
        "antonyms": antonyms,
        "examples": examples,
    }
    if related is not None:
        entry["related"] = related
    E[term] = entry

# ---------- batch 1: policy verbs & core gov ----------
add("alleviate",
    ["ease", "relieve", "mitigate"],
    ["aggravate", "worsen", "exacerbate"],
    [
        {"en": "The new housing measures aim to alleviate the shortage of affordable flats.", "zh": "新房屋措施旨在紓緩可負擔單位短缺。"},
        {"en": "Targeted subsidies can alleviate the burden on low-income households.", "zh": "針對性津貼可減輕低收入家庭的負擔。"},
        {"en": "Better traffic management helps alleviate congestion at peak hours.", "zh": "更佳的交通管理有助紓緩繁忙時段擠塞。"},
    ])
add("streamline",
    ["simplify", "rationalise", "reorganise"],
    ["complicate", "bureaucratise", "obstruct"],
    [
        {"en": "The Government will streamline licensing procedures for small businesses.", "zh": "政府將精簡小型企業的發牌程序。"},
        {"en": "A single online portal streamlines applications for multiple permits.", "zh": "一個網上平台理順多項許可申請。"},
        {"en": "Streamlining approval can shorten the time from planning to construction.", "zh": "精簡審批可縮短由規劃至施工的時間。"},
    ])
add("bolster",
    ["strengthen", "reinforce", "support"],
    ["undermine", "weaken", "erode"],
    [
        {"en": "Additional funding will bolster the city's competitiveness in fintech.", "zh": "額外撥款將加強本港金融科技競爭力。"},
        {"en": "Public messaging bolsters community confidence during emergencies.", "zh": "公眾訊息在緊急情況下鞏固社會信心。"},
        {"en": "Skills training bolsters the employability of young people.", "zh": "技能培訓提升青年就業能力。"},
    ])
add("earmark",
    ["allocate", "set aside", "reserve"],
    ["divert", "reallocate away", "withhold"],
    [
        {"en": "The Budget earmarks $2 billion for elderly care services.", "zh": "財政預算案預留二十億元予安老服務。"},
        {"en": "Funds have been earmarked specifically for digital transformation.", "zh": "款項已特別預留給數碼轉型。"},
        {"en": "District councils may earmark grants for community projects.", "zh": "區議會可預留資助予社區項目。"},
    ])
add("facilitate",
    ["enable", "assist", "promote"],
    ["hinder", "impede", "obstruct"],
    [
        {"en": "One-stop centres facilitate access to government services.", "zh": "一站式中心便利市民使用政府服務。"},
        {"en": "Clear guidelines facilitate compliance by industry stakeholders.", "zh": "清晰指引促進業界持份者遵從。"},
        {"en": "Cross-boundary transport links facilitate people flows in the GBA.", "zh": "跨境交通連接促進大灣區人流。"},
    ])
add("embark upon",
    ["commence", "undertake", "launch"],
    ["abandon", "halt", "postpone"],
    [
        {"en": "The Administration will embark upon a comprehensive review of the scheme.", "zh": "當局將展開對該計劃的全面檢討。"},
        {"en": "Schools have embarked upon curriculum reforms in national education.", "zh": "學校已着手進行國民教育課程改革。"},
        {"en": "The city embarked upon a major infrastructure programme last year.", "zh": "本港去年展開大型基建計劃。"},
    ])
add("intensify",
    ["step up", "escalate", "strengthen"],
    ["ease", "reduce", "scale down"],
    [
        {"en": "The department will intensify enforcement against illegal dumping.", "zh": "部門將加大力度打擊非法棄置廢物。"},
        {"en": "Publicity campaigns have been intensified ahead of the vaccination drive.", "zh": "接種運動開展前已加強宣傳。"},
        {"en": "Cross-border cooperation will intensify on financial crime.", "zh": "跨境合作將在金融罪案方面加強。"},
    ])
add("contingency",
    ["emergency plan", "fallback", "backup arrangement"],
    ["routine operation", "business as usual", "certainty"],
    [
        {"en": "Each bureau must maintain an up-to-date contingency plan.", "zh": "每個政策局須備存最新的應變計劃。"},
        {"en": "Contingency stocks of medical supplies are held for epidemics.", "zh": "為應對疫症而儲備醫療物資應急庫存。"},
        {"en": "The drill tested contingency coordination among departments.", "zh": "演習測試了部門之間的應變協調。"},
    ])
add("livelihood",
    ["means of living", "subsistence", "daily welfare"],
    ["hardship", "destitution", "unemployment"],
    [
        {"en": "Livelihood measures remain a priority in the Policy Address.", "zh": "民生措施仍是施政報告的優先事項。"},
        {"en": "Rising rents threaten the livelihood of small shop operators.", "zh": "租金上升威脅小商戶的生計。"},
        {"en": "The package supports the livelihood of grassroots families.", "zh": "措施組合支援基層家庭民生。"},
    ])
add("subsidise",
    ["fund", "underwrite", "sponsor"],
    ["tax", "charge fully", "withdraw support"],
    [
        {"en": "The Government will continue to subsidise public transport fares.", "zh": "政府將繼續補貼公共交通票價。"},
        {"en": "Childcare places are heavily subsidised for eligible families.", "zh": "合資格家庭的託兒名額獲大幅資助。"},
        {"en": "Research and development may be subsidised through matching grants.", "zh": "研發可透過配對資助獲得補貼。"},
    ])
add("means-tested",
    ["income-tested", "needs-based", "asset-checked"],
    ["universal", "non-means-tested", "blanket"],
    [
        {"en": "The allowance is means-tested to target those most in need.", "zh": "該津貼經資產入息審查，以針對最有需要人士。"},
        {"en": "Means-tested benefits reduce leakage to higher-income groups.", "zh": "經審查的福利可減少流向較高收入群組。"},
        {"en": "Applicants must provide documents for means-tested schemes.", "zh": "申請人須為經審查計劃提交證明文件。"},
    ])
add("enhance",
    ["improve", "upgrade", "strengthen"],
    ["weaken", "diminish", "degrade"],
    [
        {"en": "Digital tools enhance the efficiency of public service delivery.", "zh": "數碼工具提升公共服務提供的效率。"},
        {"en": "The reform aims to enhance transparency in procurement.", "zh": "改革旨在提升採購透明度。"},
        {"en": "Training programmes enhance the skills of frontline staff.", "zh": "培訓計劃加強前線人員技能。"},
    ])
add("safeguard",
    ["protect", "defend", "secure"],
    ["endanger", "compromise", "jeopardise"],
    [
        {"en": "Strict controls safeguard national security and public order.", "zh": "嚴格管制維護國家安全與公共秩序。"},
        {"en": "Data privacy safeguards are built into the new system.", "zh": "新制度內建資料私隱保障。"},
        {"en": "The ordinance safeguards the rights of minority shareholders.", "zh": "該條例保障少數股東權益。"},
    ])
add("strengthen",
    ["reinforce", "bolster", "fortify"],
    ["weaken", "undermine", "erode"],
    [
        {"en": "The Government seeks to strengthen the rule of law.", "zh": "政府致力強化法治。"},
        {"en": "Cooperation with Mainland authorities has been strengthened.", "zh": "與內地當局的合作已獲鞏固。"},
        {"en": "Capacity building strengthens institutional resilience.", "zh": "能力建設強化制度韌性。"},
    ])
add("foster",
    ["cultivate", "nurture", "encourage"],
    ["stifle", "discourage", "suppress"],
    [
        {"en": "Policies foster innovation and entrepreneurship among youth.", "zh": "政策培養青年創新與創業精神。"},
        {"en": "Schools foster a sense of national identity.", "zh": "學校培養國民身分認同。"},
        {"en": "Open dialogue fosters trust between government and stakeholders.", "zh": "開放對話促進政府與持份者之間的信任。"},
    ])
add("uphold",
    ["maintain", "defend", "preserve"],
    ["abandon", "violate", "betray"],
    [
        {"en": "Courts uphold the Basic Law and judicial independence.", "zh": "法院維護《基本法》與司法獨立。"},
        {"en": "Officials must uphold integrity and impartiality.", "zh": "官員必須堅持廉潔與公正。"},
        {"en": "The city continues to uphold 'one country, two systems'.", "zh": "本港繼續維護「一國兩制」。"},
    ])
add("consolidate",
    ["strengthen", "unify", "integrate"],
    ["fragment", "disperse", "weaken"],
    [
        {"en": "The merger consolidates overlapping regulatory functions.", "zh": "合併整合重疊的規管職能。"},
        {"en": "Efforts consolidate Hong Kong's role as an international hub.", "zh": "措施鞏固香港作為國際樞紐的角色。"},
        {"en": "Gains from the pilot should be consolidated before scaling up.", "zh": "先導成果應在擴展前先予鞏固。"},
    ])
add("expedite",
    ["accelerate", "hasten", "speed up"],
    ["delay", "slow", "postpone"],
    [
        {"en": "The bureau will expedite land disposal for public housing.", "zh": "政策局將加快公營房屋土地批出。"},
        {"en": "Digital submission expedites the processing of applications.", "zh": "電子遞交加快申請處理。"},
        {"en": "Stakeholders urged the Government to expedite legislative amendments.", "zh": "持份者促請政府從速辦理法例修訂。"},
    ])
add("optimise",
    ["improve", "maximise", "refine"],
    ["waste", "misallocate", "degrade"],
    [
        {"en": "The plan seeks to optimise land use in the urban core.", "zh": "計劃旨在優化市中心土地用途。"},
        {"en": "AI tools help optimise rostering of healthcare staff.", "zh": "人工智能工具有助優化醫護人手編更。"},
        {"en": "Transport routes should be optimised to cut emissions.", "zh": "交通路線應予優化以減排。"},
    ])
add("mitigate",
    ["reduce", "lessen", "alleviate"],
    ["aggravate", "amplify", "exacerbate"],
    [
        {"en": "Green buffers mitigate the impact of new highways on residents.", "zh": "綠化緩衝帶緩解新公路對居民的影響。"},
        {"en": "Risk assessments help mitigate project delays.", "zh": "風險評估有助減輕項目延誤。"},
        {"en": "Insurance schemes mitigate financial losses from extreme weather.", "zh": "保險計劃減輕極端天氣造成的財務損失。"},
    ])

print("batch1", len(E))
Path('/tmp/enrich_partial.json').write_text(json.dumps(E, ensure_ascii=False), encoding='utf-8')
print('saved partial')
