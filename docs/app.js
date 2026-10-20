/* JRE Vocab Bank — frontend (API + static GitHub Pages) */
(() => {
  const STORAGE_KEY = "jre-vocab-saved-v1";
  const THEME_KEY = "jre-vocab-theme";

  /** @type {{ mode: 'auto' | 'api' | 'static' }} */
  const CONFIG = { mode: "auto" };

  const state = {
    feed: null,
    programmes: null,
    q1: null,
    saved: loadSaved(),
    progCategory: "all",
    q1Category: "all",
    dataMode: null, // 'api' | 'static' once resolved
    drillSeed: Date.now(),
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function persistSaved() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved));
    $("#statSaved").textContent = String(Object.keys(state.saved).length);
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightExample(example, span) {
    const safe = escapeHtml(example);
    if (!span) return safe;
    const re = new RegExp(`(${escapeRegExp(span)})`, "i");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function formatDate(pubDate, iso) {
    try {
      const d = iso ? new Date(iso) : new Date(pubDate);
      if (Number.isNaN(d.getTime())) return pubDate || "";
      return (
        d.toLocaleString("zh-HK", {
          timeZone: "Asia/Hong_Kong",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " (香港時間)"
      );
    } catch {
      return pubDate || "";
    }
  }

  function isSaved(term) {
    return Boolean(state.saved[term.toLowerCase()]);
  }

  function toggleSave(card) {
    const key = card.term.toLowerCase();
    if (state.saved[key]) {
      delete state.saved[key];
      toast(`已取消收藏 · Unsaved: ${card.term}`);
    } else {
      state.saved[key] = {
        ...card,
        savedAt: new Date().toISOString(),
      };
      toast(`已收藏 · Saved: ${card.term}`);
    }
    persistSaved();
    renderAllCards();
  }

  function vocabCardHTML(card) {
    const saved = isSaved(card.term);
    const related = (card.related || [])
      .map((r) => `<span class="chip">${escapeHtml(r)}</span>`)
      .join("");
    const src = card.source || {};
    return `
<article class="vocab-card ${saved ? "saved" : ""}" data-term="${escapeHtml(card.term)}">
  <div class="card-top">
    <h4 class="term">${escapeHtml(card.term)}<span class="pos">${escapeHtml(card.pos || "")}</span></h4>
  </div>
  <div class="zh">${escapeHtml(card.zh || "")}</div>
  ${card.note ? `<div class="meta-line">${escapeHtml(card.note)}</div>` : ""}
  ${related ? `<div class="related">${related}</div>` : ""}
  <p class="example">${highlightExample(card.example || "", card.matchedSpan)}</p>
  ${
    src.link
      ? `<div class="source-link">
          <a href="${escapeHtml(src.link)}" target="_blank" rel="noopener">${escapeHtml(src.title || "來源新聞稿")}</a>
          <span class="date">${escapeHtml(formatDate(src.pubDate, src.pubDateIso))}</span>
        </div>`
      : ""
  }
  <div class="card-actions">
    <button type="button" class="btn ${saved ? "" : "primary"} btn-save">${saved ? "★ 已收藏" : "☆ 收藏"}</button>
    ${src.link ? `<a class="btn" href="${escapeHtml(src.link)}" target="_blank" rel="noopener">原文</a>` : ""}
  </div>
</article>`;
  }

  function bindCardActions(container) {
    container.querySelectorAll(".vocab-card").forEach((el) => {
      const term = el.dataset.term;
      const card = findCard(term) || state.saved[term.toLowerCase()];
      const btn = el.querySelector(".btn-save");
      if (btn && card) {
        btn.addEventListener("click", () => toggleSave(card));
      }
    });
  }

  function findCard(term) {
    const feed = state.feed;
    if (!feed) return null;
    const all = [...(feed.todaysPicks || []), ...(feed.matches || [])];
    return all.find((c) => c.term.toLowerCase() === term.toLowerCase()) || null;
  }

  const Q1_CAT_LABELS = {
    all: "全部",
    implications: "影響／後果",
    assessment: "評估／分析",
    recommend: "建議措施",
    monitor: "監察／檢討",
    specificity: "負責方／時限／資源",
    discourse: "論述銜接",
  };

  function phraseCardHTML(item) {
    const key = `q1:${item.id}`;
    const saved = Boolean(state.saved[key.toLowerCase()]);
    const cat = Q1_CAT_LABELS[item.category] || item.category;
    return `
<article class="vocab-card phrase-card ${saved ? "saved" : ""}" data-phrase-id="${escapeHtml(item.id)}">
  <div class="card-top">
    <h4 class="term">${escapeHtml(item.en)}</h4>
    <span class="cat-pill">${escapeHtml(cat)}</span>
  </div>
  <div class="zh">${escapeHtml(item.zh || "")}</div>
  ${item.note ? `<div class="meta-line">${escapeHtml(item.note)}</div>` : ""}
  ${item.example ? `<p class="example">${escapeHtml(item.example)}</p>` : ""}
  <div class="card-actions">
    <button type="button" class="btn ${saved ? "" : "primary"} btn-save-phrase">${saved ? "★ 已收藏" : "☆ 收藏"}</button>
    <button type="button" class="btn btn-copy-phrase">複製句式</button>
  </div>
</article>`;
  }

  function toggleSavePhrase(item) {
    const key = `q1:${item.id}`.toLowerCase();
    if (state.saved[key]) {
      delete state.saved[key];
      toast(`已取消收藏 · ${item.en.slice(0, 40)}`);
    } else {
      state.saved[key] = {
        term: item.en,
        zh: item.zh,
        pos: "Q1 phrase",
        note: item.note || "",
        example: item.example || "",
        related: [item.category],
        phraseId: item.id,
        savedAt: new Date().toISOString(),
      };
      toast(`已收藏句式`);
    }
    persistSaved();
    renderQ1();
    renderSaved();
  }

  function bindPhraseActions(container) {
    container.querySelectorAll(".phrase-card").forEach((el) => {
      const id = el.dataset.phraseId;
      const item = (state.q1?.items || []).find((x) => x.id === id);
      if (!item) return;
      const saveBtn = el.querySelector(".btn-save-phrase");
      const copyBtn = el.querySelector(".btn-copy-phrase");
      if (saveBtn) saveBtn.addEventListener("click", () => toggleSavePhrase(item));
      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          const text = `${item.en}\n${item.zh || ""}`.trim();
          try {
            await navigator.clipboard.writeText(text);
            toast("已複製句式");
          } catch {
            toast("複製失敗 — 請手動選取");
          }
        });
      }
    });
  }

  function renderQ1Filters() {
    const cats = ["all", ...((state.q1?.categories || []).map((c) => c.id))];
    const wrap = $("#q1Filters");
    if (!wrap) return;
    wrap.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" data-cat="${c}" class="${state.q1Category === c ? "active" : ""}">${Q1_CAT_LABELS[c] || c}</button>`
      )
      .join("");
    wrap.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.q1Category = btn.dataset.cat;
        renderQ1Filters();
        renderQ1();
      });
    });
  }

  function renderQ1() {
    const q = ($("#q1Search")?.value || "").trim().toLowerCase();
    let list = state.q1?.items || [];
    if (state.q1Category !== "all") {
      list = list.filter((i) => i.category === state.q1Category);
    }
    if (q) {
      list = list.filter((i) =>
        `${i.en} ${i.zh} ${i.category} ${i.note || ""} ${i.example || ""}`.toLowerCase().includes(q)
      );
    }
    const countEl = $("#q1Count");
    if (countEl) countEl.textContent = `${list.length} 句`;
    const disc = $("#q1Disclaimer");
    if (disc) disc.textContent = state.q1?.disclaimer || "";
    const grid = $("#q1Grid");
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `<div class="empty">沒有符合的句式。</div>`;
      return;
    }
    grid.innerHTML = list.map(phraseCardHTML).join("");
    bindPhraseActions(grid);
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickN(arr, n, rand) {
    const copy = [...arr];
    const out = [];
    while (copy.length && out.length < n) {
      const i = Math.floor(rand() * copy.length);
      out.push(copy.splice(i, 1)[0]);
    }
    return out;
  }

  function weekKey(d = new Date()) {
    // ISO-ish week label in HK
    const hk = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Hong_Kong" }));
    const onejan = new Date(hk.getFullYear(), 0, 1);
    const week = Math.ceil(((hk - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    return `${hk.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  const DRILL_SCENARIOS = [
    {
      title: "Specialist outpatient waiting times",
      para: "Waiting times for certain specialist outpatient clinics have lengthened. Some patients report delayed follow-up, while NGOs highlight uneven district capacity. The Hospital Authority notes manpower strain; LegCo members have asked whether a short-term package is feasible without crowding out other services.",
    },
    {
      title: "Uptake of a means-tested living subsidy",
      para: "A recently enhanced means-tested living subsidy shows subdued uptake among eligible households. Frontline staff cite complex forms and stigma; the bureau cites fiscal prudence. Media coverage has focused on the gap between announced coverage and actual applications.",
    },
    {
      title: "Pilot transitional housing sites",
      para: "Two pilot transitional housing sites are near capacity, while three planned sites face local objection and utility delays. Demand from families on the PRH waiting list remains high. The department must advise on whether to scale up, redesign eligibility, or pause further sites.",
    },
    {
      title: "Cross-bureau digital service bottleneck",
      para: "A one-stop digital portal for licence renewals has uneven uptake. Some departments still require paper originals; SMEs report duplicated uploads. An interdepartmental working group exists but lacks a clear lead and timeline for closing the enforcement and process gaps.",
    },
    {
      title: "Elderly community care shortfall",
      para: "District-based community care places fall short of projected need. Carers report long waiting lists; operators cite recruitment difficulties. A stopgap purchase-of-service arrangement is under discussion, with concern over recurrent cost and quality oversight.",
    },
  ];

  function buildDrillPrompt() {
    const rand = mulberry32(state.drillSeed >>> 0);
    const scenario = DRILL_SCENARIOS[Math.floor(rand() * DRILL_SCENARIOS.length)];
    const picks = state.feed?.todaysPicks || [];
    const matches = state.feed?.matches || [];
    const pool = picks.length ? picks : matches;
    const words = pickN(pool, 5, rand).map((c) => c.term);
    // top up from lexicon-ish match list if short
    while (words.length < 4 && matches.length) {
      const extra = matches[Math.floor(rand() * matches.length)];
      if (extra && !words.includes(extra.term)) words.push(extra.term);
      else break;
    }
    const phrases = pickN(state.q1?.items || [], 3, rand);
    const phraseLines = phrases.map((p) => `• ${p.en}`).join("\n");
    const wordLine = words.length ? words.map((w) => `「${w}」`).join(" · ") : "（詞庫配對載入後會出現）";

    const text = `JRE English Q1 — MINI-DRILL (20–25 minutes)
Week: ${weekKey()} · NOT a full case pack

SCENARIO — ${scenario.title}
${scenario.para}

TASK (internal discussion paper style)
1. Identify TWO problems.
2. State TWO implications (knock-on / fiscal / public confidence / service capacity, etc.).
3. Propose TWO feasible measures — each with WHO (lead dept/officer), WHEN (timeframe), and RESOURCES (manpower/funding) where possible.
4. Use at least FOUR bank items below (mix of words + phrases). Underline or bold them in your draft.

BANK WORDS (from today’s picks / matches)
${wordLine}

BANK PHRASES (Q1句式)
${phraseLines || "• (Q1 phrase bank loading…)"}

LENGTH GUIDE: ~350–500 words. Formal civil-service tone.

AFTERWARDS
• Self-check: problems → implications → measures chain; specificity of who/when/resources.
• Full timed drills: log under Obsidian Personal/Learning/JRE 2026/05-English-Drills/ (Drill log.md).
• This mini-drill is practice only — no need to submit here.`;

    return { text, scenario: scenario.title, wordCount: words.length, phraseCount: phrases.length };
  }

  function renderDrill() {
    const meta = $("#drillMeta");
    const pre = $("#drillPrompt");
    if (!pre) return;
    const d = buildDrillPrompt();
    pre.textContent = d.text;
    if (meta) {
      meta.innerHTML = `<span class="chip">${escapeHtml(weekKey())}</span>
        <span class="chip">${escapeHtml(d.scenario)}</span>
        <span class="chip">${d.wordCount} words · ${d.phraseCount} phrases</span>`;
    }
  }


  function renderPicks() {
    const grid = $("#picksGrid");
    const picks = state.feed?.todaysPicks || [];
    if (!picks.length) {
      grid.innerHTML = `<div class="empty">暫無今日精選 — 請稍後重新擷取，或查看「詞彙卡」全部配對。</div>`;
      return;
    }
    grid.innerHTML = picks.map(vocabCardHTML).join("");
    bindCardActions(grid);
  }

  function renderVocab() {
    const q = ($("#vocabSearch").value || "").trim().toLowerCase();
    let list = state.feed?.matches || [];
    if (q) {
      list = list.filter((c) => {
        const blob = `${c.term} ${c.zh} ${c.pos} ${(c.related || []).join(" ")} ${c.note || ""}`.toLowerCase();
        return blob.includes(q);
      });
    }
    $("#vocabCount").textContent = `${list.length} 張卡`;
    const grid = $("#vocabGrid");
    if (!list.length) {
      grid.innerHTML = `<div class="empty">沒有符合的詞彙卡。</div>`;
      return;
    }
    grid.innerHTML = list.map(vocabCardHTML).join("");
    bindCardActions(grid);
  }

  function renderFeed() {
    const q = ($("#feedSearch").value || "").trim().toLowerCase();
    let items = state.feed?.items || [];
    if (q) {
      items = items.filter((it) =>
        `${it.title} ${it.description}`.toLowerCase().includes(q)
      );
    }
    const list = $("#feedList");
    if (!items.length) {
      list.innerHTML = `<div class="empty">沒有新聞稿。</div>`;
      return;
    }
    list.innerHTML = items
      .map(
        (it) => `
<article class="feed-item">
  <h4><a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.title)}</a></h4>
  <p class="desc">${escapeHtml(it.description)}</p>
  <div class="meta">${escapeHtml(formatDate(it.pubDate, it.pubDateIso))}</div>
</article>`
      )
      .join("");
  }

  const CAT_LABELS = {
    all: "全部",
    housing: "房屋",
    welfare: "福利",
    education: "教育",
    health: "衞生",
    economy: "經濟",
    security: "保安",
    environment: "環境",
  };

  function renderProgFilters() {
    const cats = ["all", ...new Set((state.programmes?.items || []).map((i) => i.category))];
    const wrap = $("#progFilters");
    wrap.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" data-cat="${c}" class="${state.progCategory === c ? "active" : ""}">${CAT_LABELS[c] || c}</button>`
      )
      .join("");
    wrap.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.progCategory = btn.dataset.cat;
        renderProgFilters();
        renderProgrammes();
      });
    });
  }

  function renderProgrammes() {
    const q = ($("#progSearch").value || "").trim().toLowerCase();
    let items = state.programmes?.items || [];
    if (state.progCategory !== "all") {
      items = items.filter((i) => i.category === state.progCategory);
    }
    if (q) {
      items = items.filter((i) =>
        `${i.en} ${i.zh} ${i.abbr} ${i.category}`.toLowerCase().includes(q)
      );
    }
    $("#progCount").textContent = `${items.length} 項`;
    $("#progDisclaimer").textContent =
      state.programmes?.disclaimer ||
      "Starter bank — expand as you revise.";
    const body = $("#progBody");
    body.innerHTML = items
      .map(
        (i) => `
<tr>
  <td><strong>${escapeHtml(i.en)}</strong></td>
  <td>${escapeHtml(i.zh)}</td>
  <td class="abbr">${escapeHtml(i.abbr || "—")}</td>
  <td><span class="cat-pill">${escapeHtml(CAT_LABELS[i.category] || i.category)}</span></td>
</tr>`
      )
      .join("");
  }

  function renderSaved() {
    const list = Object.values(state.saved).sort((a, b) =>
      (a.term || "").localeCompare(b.term || "")
    );
    const grid = $("#savedGrid");
    if (!list.length) {
      grid.innerHTML = `<div class="empty">尚未收藏生字。在詞彙卡按「☆ 收藏」即可。</div>`;
      return;
    }
    grid.innerHTML = list.map(vocabCardHTML).join("");
    bindCardActions(grid);
  }

  function renderAllCards() {
    renderPicks();
    renderVocab();
    renderSaved();
    renderDrill();
  }

  function updateStats() {
    const f = state.feed;
    $("#statItems").textContent = f ? String(f.itemCount ?? 0) : "—";
    $("#statMatches").textContent = f ? String(f.matchCount ?? 0) : "—";
    $("#statLexicon").textContent = f ? String(f.lexiconSize ?? 0) : "—";
    $("#statSaved").textContent = String(Object.keys(state.saved).length);
    const bar = $("#statusBar");
    if (!f) {
      bar.innerHTML = `<span>載入中…</span>`;
      return;
    }
    const parts = [];
    if (state.dataMode === "static") {
      parts.push("靜態快照 · GitHub Pages");
    } else if (state.dataMode === "api") {
      parts.push("即時 API");
    }
    if (f.fetchedAt) {
      try {
        const d = new Date(f.fetchedAt);
        parts.push(
          `擷取：${d.toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })} (香港時間)`
        );
      } catch {
        parts.push(`擷取：${f.fetchedAt}`);
      }
    }
    if (f.cached) parts.push("快取資料");
    if (f.error) parts.push(`<span class="err">${escapeHtml(f.error)}</span>`);
    else parts.push(`來源：${escapeHtml(f.source || "")}`);
    bar.innerHTML = parts.map((p) => `<span>${p}</span>`).join("");
  }

  async function tryFetch(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  }

  /**
   * Prefer /api/* when available (local serve.py); fall back to relative data/*.json for Pages.
   */
  async function loadJson(apiPath, staticPath) {
    const mode = CONFIG.mode;
    if (mode === "static") {
      state.dataMode = "static";
      return tryFetch(staticPath);
    }
    if (mode === "api") {
      state.dataMode = "api";
      return tryFetch(apiPath);
    }
    // auto
    try {
      const data = await tryFetch(apiPath);
      state.dataMode = "api";
      return data;
    } catch {
      const data = await tryFetch(staticPath);
      state.dataMode = "static";
      return data;
    }
  }

  async function loadFeed(refresh = false) {
    $("#statusBar").innerHTML = `<span>正在載入…</span>`;
    try {
      if (refresh && state.dataMode === "api") {
        state.feed = await tryFetch("/api/feed?refresh=1");
        state.dataMode = "api";
        toast("已更新新聞稿");
      } else if (refresh && state.dataMode === "static") {
        // Re-read snapshot (Pages has no live RSS proxy)
        state.feed = await tryFetch("data/feed.json");
        toast("已重新載入靜態快照（每日 Actions 更新）");
      } else {
        state.feed = await loadJson(
          refresh ? "/api/feed?refresh=1" : "/api/feed",
          "data/feed.json"
        );
        if (refresh && state.dataMode === "api") toast("已更新新聞稿");
      }
      updateStats();
      renderAllCards();
      renderFeed();
    } catch (e) {
      $("#statusBar").innerHTML = `<span class="err">載入失敗：${escapeHtml(e.message)}</span>`;
    }
  }

  async function loadProgrammes() {
    const data = await loadJson("/api/programmes", "data/programmes.json");
    // API wraps with { ok, disclaimer, items }; static file is { disclaimer, items }
    state.programmes = data;
    renderProgFilters();
    renderProgrammes();
  }

  async function loadQ1() {
    try {
      const data = await loadJson("/api/q1-phrases", "data/q1_phrases.json");
      state.q1 = {
        disclaimer: data.disclaimer || "",
        categories: data.categories || [],
        items: data.items || [],
      };
      renderQ1Filters();
      renderQ1();
      renderDrill();
    } catch (e) {
      console.warn("Q1 phrases failed", e);
      const grid = $("#q1Grid");
      if (grid) grid.innerHTML = `<div class="empty">未能載入 Q1 句式庫。</div>`;
    }
  }

  function initNav() {
    $$("#nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("#nav button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        $$(".panel").forEach((p) => p.classList.remove("active"));
        $(`#panel-${btn.dataset.panel}`).classList.add("active");
      });
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    $("#btnTheme").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next =
        cur === "light"
          ? "dark"
          : cur === "dark"
            ? "light"
            : matchMedia("(prefers-color-scheme: light)").matches
              ? "dark"
              : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  function initEvents() {
    $("#btnRefresh").addEventListener("click", () => loadFeed(true));
    $("#vocabSearch").addEventListener("input", renderVocab);
    $("#feedSearch").addEventListener("input", renderFeed);
    $("#progSearch").addEventListener("input", renderProgrammes);
    $("#btnExport").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.saved, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `jre-vocab-saved-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      toast("已匯出收藏");
    });
    $("#btnClearSaved").addEventListener("click", () => {
      if (!Object.keys(state.saved).length) return;
      if (!confirm("確定清空全部收藏？")) return;
      state.saved = {};
      persistSaved();
      renderSaved();
      renderAllCards();
      toast("已清空收藏");
    });
    const q1Search = $("#q1Search");
    if (q1Search) q1Search.addEventListener("input", renderQ1);
    const btnCopy = $("#btnCopyDrill");
    if (btnCopy) {
      btnCopy.addEventListener("click", async () => {
        const text = $("#drillPrompt")?.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          toast("已複製迷你練習提示");
        } catch {
          toast("複製失敗 — 請手動選取文字");
        }
      });
    }
    const btnRegen = $("#btnRegenDrill");
    if (btnRegen) {
      btnRegen.addEventListener("click", () => {
        state.drillSeed = (state.drillSeed + 0x9e3779b9) >>> 0;
        renderDrill();
        toast("已重新抽題");
      });
    }
  }

  async function boot() {
    initNav();
    initTheme();
    initEvents();
    persistSaved();
    await Promise.all([loadFeed(false), loadProgrammes(), loadQ1()]);
  }

  boot();
})();
