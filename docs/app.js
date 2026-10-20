/* JRE Vocab Bank — frontend (API + static GitHub Pages) */
(() => {
  const STORAGE_KEY = "jre-vocab-saved-v1";
  const THEME_KEY = "jre-vocab-theme";

  /** @type {{ mode: 'auto' | 'api' | 'static' }} */
  const CONFIG = { mode: "auto" };

  const state = {
    feed: null,
    programmes: null,
    saved: loadSaved(),
    progCategory: "all",
    dataMode: null, // 'api' | 'static' once resolved
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
  }

  async function boot() {
    initNav();
    initTheme();
    initEvents();
    persistSaved();
    await Promise.all([loadFeed(false), loadProgrammes()]);
  }

  boot();
})();
