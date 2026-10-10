(() => {
  "use strict";
  if (document.getElementById("animee-trending")) return;

  const API = "https://api.jikan.moe/v4/top/anime?filter=airing&limit=10";
  const css = document.createElement("style");
  css.textContent = `
    #animee-trending{width:min(1200px,calc(100% - 28px));margin:14px auto 22px;padding:18px;background:#f4f9ff;color:#10263d;border:1px solid #d6e7f5;border-radius:16px;box-shadow:0 8px 22px rgba(8,42,72,.08);font:14px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
    #animee-trending *{box-sizing:border-box}
    #animee-trending .tr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
    #animee-trending h2{margin:0;font-size:clamp(19px,3vw,25px);font-weight:900;color:#10263d}
    #animee-trending .tr-sub{margin:4px 0 0;color:#526b82;font-size:12px}
    #animee-trending .tr-updated{margin-top:8px;color:#166a86;font-size:11px}
    #animee-trending .tr-tools{display:flex;gap:8px;flex-wrap:wrap}
    #animee-trending input,#animee-trending button{border:1px solid #c6d9e9;border-radius:9px;padding:8px 10px;background:#fff;color:#10263d;font:inherit}
    #animee-trending button{cursor:pointer;font-weight:750}
    #animee-trending input:focus-visible,#animee-trending button:focus-visible,#animee-trending a:focus-visible{outline:3px solid #1786a8;outline-offset:2px}
    #animee-trending .tr-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px}
    #animee-trending .tr-card{min-width:0;overflow:hidden;border:1px solid #d6e7f5;border-radius:12px;background:white}
    #animee-trending .tr-rank{padding:6px 10px;background:#dff3ff;color:#0d526d;font-size:11px;font-weight:900}
    #animee-trending .tr-card img{display:block;width:100%;height:185px;object-fit:cover;background:#e5edf4}
    #animee-trending .tr-content{padding:10px}
    #animee-trending .tr-card h3{margin:0 0 7px;font-size:13px;line-height:1.35;overflow-wrap:anywhere}
    #animee-trending .tr-card p{margin:0 0 8px;color:#526b82;font-size:11px}
    #animee-trending .tr-score{display:inline-block;margin-bottom:8px;padding:3px 7px;border-radius:7px;background:#fff3d4;color:#76500a;font-size:11px;font-weight:900}
    #animee-trending .tr-card a{color:#075f85;font-weight:800;font-size:12px;text-decoration:none}
    #animee-trending .tr-card a:hover{text-decoration:underline}
    #animee-trending .tr-state{padding:16px 0;color:#526b82}
    #animee-trending .tr-foot{margin-top:12px;color:#526b82;font-size:11px}
    @media(max-width:950px){#animee-trending .tr-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:580px){#animee-trending{padding:13px}#animee-trending .tr-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#animee-trending .tr-card img{height:155px}#animee-trending .tr-tools{width:100%}#animee-trending .tr-tools input{min-width:0;flex:1}}
  `;
  document.head.appendChild(css);

  const panel = document.createElement("section");
  panel.id = "animee-trending";
  panel.setAttribute("aria-labelledby", "animee-trending-title");
  panel.innerHTML = `
    <div class="tr-head">
      <div>
        <h2 id="animee-trending-title">🔥 Trending Anime</h2>
        <p class="tr-sub">Top currently airing anime in the provider’s ranking.</p>
        <div class="tr-updated" id="animee-trending-updated"></div>
      </div>
      <div class="tr-tools">
        <input id="animee-trending-search" type="search" maxlength="80" placeholder="Find a title…" aria-label="Search trending anime">
        <button id="animee-trending-refresh" type="button">↻ Refresh</button>
      </div>
    </div>
    <div class="tr-state" id="animee-trending-state" role="status" aria-live="polite">Loading ranking…</div>
    <div class="tr-grid" id="animee-trending-grid"></div>
    <div class="tr-foot">Source: Jikan API using MyAnimeList ranking data. This is a provider ranking of currently airing anime, not a real-time count of Facebook, TikTok, or worldwide views. Rankings can change; check source details for the latest information.</div>
  `;

  const calendar = document.getElementById("animee-release-calendar");
  const news = document.getElementById("animee-live-news");
  const header = document.querySelector("body > header");
  if (calendar) calendar.insertAdjacentElement("afterend", panel);
  else if (news) news.insertAdjacentElement("afterend", panel);
  else if (header) header.insertAdjacentElement("afterend", panel);
  else document.body.prepend(panel);

  const grid = panel.querySelector("#animee-trending-grid");
  const state = panel.querySelector("#animee-trending-state");
  const search = panel.querySelector("#animee-trending-search");
  const updated = panel.querySelector("#animee-trending-updated");
  let entries = [];
  let loading = false;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }

  function sourceUrl(value) {
    try {
      const url = new URL(value);
      return url.hostname === "myanimelist.net" || url.hostname.endsWith(".myanimelist.net") ? url.href : "https://myanimelist.net/anime";
    } catch (_) { return "https://myanimelist.net/anime"; }
  }

  function render() {
    const term = search.value.trim().toLocaleLowerCase();
    const filtered = entries.filter(item => String(item.title || "").toLocaleLowerCase().includes(term) || String(item.title_english || "").toLocaleLowerCase().includes(term));
    grid.innerHTML = filtered.map(item => {
      const title = item.title_english || item.title || "Untitled anime";
      const rank = Number(item.rank);
      const score = Number(item.score);
      const image = item.images && item.images.jpg && item.images.jpg.image_url;
      const safeImage = image && /^https:\/\//i.test(image) ? image : "";
      const episodes = Number(item.episodes);
      const status = item.status || "Status not listed";
      return `<article class="tr-card">
        <div class="tr-rank">${Number.isFinite(rank) && rank > 0 ? "RANK #" + rank : "RANK NOT LISTED"}</div>
        ${safeImage ? `<img src="${escapeHtml(safeImage)}" alt="${escapeHtml(title)} poster" loading="lazy" referrerpolicy="no-referrer">` : ""}
        <div class="tr-content">
          <h3>${escapeHtml(title)}</h3>
          ${Number.isFinite(score) && score > 0 ? `<span class="tr-score">⭐ ${score.toFixed(2)} / 10</span>` : ""}
          <p>${escapeHtml(status)}${Number.isFinite(episodes) && episodes > 0 ? " · " + episodes + " episodes listed" : ""}</p>
          <a href="${sourceUrl(item.url)}" target="_blank" rel="noopener noreferrer">View source ↗</a>
        </div>
      </article>`;
    }).join("");
    state.hidden = filtered.length > 0;
    if (!filtered.length) state.textContent = entries.length ? "No titles match your search." : "The ranking is not available right now. Try Refresh later.";
  }

  async function load() {
    if (loading) return;
    loading = true;
    state.hidden = false;
    state.textContent = "Loading ranking…";
    try {
      const response = await fetch(API, {headers: {"Accept":"application/json"}});
      if (!response.ok) throw new Error("Ranking service returned " + response.status);
      const result = await response.json();
      entries = Array.isArray(result.data) ? result.data.filter(item => item && item.title) : [];
      render();
      updated.textContent = "🟢 Last updated: " + new Date().toLocaleString(undefined, {year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) + " · " + (Intl.DateTimeFormat().resolvedOptions().timeZone || "device local time");
    } catch (error) {
      console.warn("Animee trending ranking unavailable:", error);
      state.hidden = false;
      state.textContent = "Could not load the ranking right now. Please try Refresh in a little while.";
      updated.textContent = "Last successful refresh is not available in this session.";
    } finally {
      loading = false;
    }
  }

  search.addEventListener("input", render);
  panel.querySelector("#animee-trending-refresh").addEventListener("click", load);
  load();
  window.setInterval(load, 30 * 60 * 1000);
})();