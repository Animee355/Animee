(() => {
  "use strict";
  if (document.getElementById("animee-live-news")) return;

  const css = document.createElement("style");
  css.textContent = `
    #animee-live-news{width:min(1200px,calc(100% - 28px));margin:14px auto 18px;padding:16px;background:linear-gradient(145deg,#102d49,#071a2d);color:#f4f8ff;border:1px solid rgba(7,81,138,.32);border-radius:16px;box-shadow:0 10px 26px rgba(7,55,95,.15);font:14px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
    #animee-live-news *{box-sizing:border-box}
    #animee-live-news .an-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
    #animee-live-news .an-title{margin:0;font-size:clamp(18px,3vw,24px);font-weight:900;color:#fff}
    #animee-live-news .an-sub{color:#bfd4e7;font-size:12px;margin:3px 0 0}
    #animee-live-news .an-actions{display:flex;gap:7px;flex-wrap:wrap}
    #animee-live-news button,#animee-live-news select{border:1px solid #315875;border-radius:999px;padding:8px 11px;background:#0b3152;color:#f4f8ff;font:inherit;font-weight:750;cursor:pointer}
    #animee-live-news button:focus-visible,#animee-live-news select:focus-visible,#animee-live-news a:focus-visible{outline:3px solid #75ddff;outline-offset:2px}
    #animee-live-news .an-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:13px}
    #animee-live-news .an-item{min-width:0;padding:13px;border:1px solid rgba(117,221,255,.22);border-radius:12px;background:rgba(2,13,27,.38)}
    #animee-live-news .an-item h3{font-size:15px;line-height:1.35;margin:7px 0 8px;color:#fff}
    #animee-live-news .an-item p{font-size:12px;color:#bfd4e7;margin:0 0 9px;overflow-wrap:anywhere}
    #animee-live-news .an-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:11px;color:#b8d8ec}
    #animee-live-news .an-tag{display:inline-block;background:#123e60;border:1px solid #2b6387;border-radius:999px;padding:3px 7px;color:#bdeeff;font-size:10px;font-weight:850}
    #animee-live-news .an-item a{color:#8fe5ff;font-weight:800;text-decoration:none}
    #animee-live-news .an-item a:hover{text-decoration:underline}
    #animee-live-news .an-state{color:#d0e5f4;padding:14px 0}
    #animee-live-news .an-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:11px;color:#b8cce0;font-size:11px}
    #animee-live-news .an-disclaimer{margin:10px 0 0;color:#a9c2d7;font-size:11px}
    #animee-live-news .an-rank-section{margin-top:22px;padding-top:17px;border-top:1px solid rgba(117,221,255,.25)}
    #animee-live-news .an-rank-title{margin:0;color:#fff;font-size:18px;font-weight:900}
    #animee-live-news .an-rank-note{margin:4px 0 12px;color:#bfd4e7;font-size:12px}
    #animee-live-news .an-rank-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    #animee-live-news .an-rank-card{display:flex;gap:10px;align-items:center;min-width:0;padding:9px;border:1px solid rgba(117,221,255,.2);border-radius:11px;background:rgba(2,13,27,.38)}
    #animee-live-news .an-rank-card img{width:54px;height:76px;object-fit:cover;border-radius:7px;background:#16354d;flex-shrink:0}
    #animee-live-news .an-rank-copy{min-width:0}
    #animee-live-news .an-rank-card h4{margin:0 0 5px;font-size:12px;line-height:1.35;color:#fff;overflow-wrap:anywhere}
    #animee-live-news .an-rank-card a{color:#8fe5ff;text-decoration:none}
    #animee-live-news .an-rank-card a:hover{text-decoration:underline}
    #animee-live-news .an-rank-meta{color:#bfd4e7;font-size:10px;line-height:1.45}
    #animee-live-news .an-rank-number{font-weight:950;color:#75ddff;margin-right:4px}
    #animee-live-news .an-rank-head{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap}
    #animee-live-news .an-rank-head button{font-size:11px;padding:6px 9px}
    #animee-live-news .an-rank-updated{font-size:10px;color:#a9c2d7;margin-top:9px}
    @media(max-width:520px){#animee-live-news .an-rank-grid{grid-template-columns:1fr}#animee-live-news .an-rank-card img{width:48px;height:68px}}
    #animee-live-news[data-collapsed="true"] .an-content{display:none}
    @media(max-width:800px){#animee-live-news .an-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:520px){#animee-live-news{padding:12px}#animee-live-news .an-list{grid-template-columns:1fr}#animee-live-news .an-item{padding:12px}}
  `;
  document.head.appendChild(css);

  const panel = document.createElement("section");
  panel.id = "animee-live-news";
  panel.setAttribute("aria-labelledby", "animee-news-title");
  panel.innerHTML = `
    <div class="an-head">
      <div><h2 class="an-title" id="animee-news-title">📰 Animee Anime News Live</h2><p class="an-sub">Announcements, anime creators, studios, release dates and industry updates.</p></div>
      <div class="an-actions">
        <select id="animee-news-filter" aria-label="Filter anime news">
          <option value="all">All news</option>
          <option value="announcement">Announcements & releases</option>
          <option value="creator">Creators & industry</option>
        </select>
        <button id="animee-news-refresh" type="button">↻ Refresh</button>
        <button id="animee-news-toggle" type="button" aria-expanded="true">Hide news</button>
      </div>
    </div>
    <div class="an-content">
      <div class="an-state" id="animee-news-state" role="status" aria-live="polite">Loading the latest anime news…</div>
      <div class="an-list" id="animee-news-list"></div>
      <div class="an-foot"><span id="animee-news-updated">Checking news feed…</span><a href="https://www.crunchyroll.com/news/" target="_blank" rel="noopener noreferrer">Crunchyroll News ↗</a></div>
      <p class="an-disclaimer">Animee links to the original publishers. News reports may describe official announcements, but an article is not itself a primary studio announcement. Check the linked source for confirmation.</p>
      <section class="an-rank-section" aria-labelledby="animee-rank-title">
        <div class="an-rank-head"><div><h3 class="an-rank-title" id="animee-rank-title">🏆 Top 10 Popular Anime</h3><p class="an-rank-note">Rankings based on MyAnimeList data via Jikan. Popularity is not the same as weekly viewing figures.</p></div><button id="animee-rank-refresh" type="button">↻ Refresh rankings</button></div>
        <div class="an-rank-grid" id="animee-rank-popular"><div class="an-state">Loading popular anime…</div></div>
        <div class="an-rank-section"><h3 class="an-rank-title">🔥 Top 10 Currently Airing</h3><p class="an-rank-note">Anime ranked in the current airing list.</p><div class="an-rank-grid" id="animee-rank-airing"><div class="an-state">Loading airing anime…</div></div></div>
        <div class="an-rank-section"><h3 class="an-rank-title">🍂 Current Season Anime</h3><p class="an-rank-note">Recent seasonal titles and new releases.</p><div class="an-rank-grid" id="animee-rank-season"><div class="an-state">Loading current season…</div></div></div>
        <p class="an-rank-updated" id="animee-rank-updated">Checking ranking data…</p>
      </section>
    </div>`;
  const header = document.querySelector("header");
  if (header) header.insertAdjacentElement("afterend", panel);
  else document.body.insertBefore(panel, document.body.firstChild);

  const stateEl = panel.querySelector("#animee-news-state");
  const listEl = panel.querySelector("#animee-news-list");
  const updatedEl = panel.querySelector("#animee-news-updated");
  const filterEl = panel.querySelector("#animee-news-filter");
  const toggleEl = panel.querySelector("#animee-news-toggle");
  const popularEl = panel.querySelector("#animee-rank-popular");
  const airingEl = panel.querySelector("#animee-rank-airing");
  const seasonEl = panel.querySelector("#animee-rank-season");
  const rankUpdatedEl = panel.querySelector("#animee-rank-updated");
  let items = [];
  let checkedAt = "";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const dateLabel = value => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "Date unavailable" : d.toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
  };
  const safeUrl = value => {
    try { const u = new URL(value); return ["https:","http:"].includes(u.protocol) ? u.href : ""; }
    catch (_) { return ""; }
  };
  const draw = () => {
    const filter = filterEl.value;
    const visible = items.filter(item => filter === "all" || item.category === filter).slice(0, 12);
    listEl.innerHTML = visible.map(item => {
      const url = safeUrl(item.url);
      if (!url) return "";
      return `<article class="an-item">
        <div class="an-meta"><span class="an-tag">${esc(item.category_label || "Latest news")}</span><span>${esc(item.source || "Anime news")}</span></div>
        <h3>${esc(item.title || "Anime news update")}</h3>
        ${item.summary ? `<p>${esc(item.summary)}</p>` : ""}
        <div class="an-meta"><span>${esc(dateLabel(item.published))}</span></div>
        <p style="margin:9px 0 0"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Read original story ↗</a></p>
      </article>`;
    }).join("");
    if (!visible.length) {
      stateEl.hidden = false;
      stateEl.textContent = items.length ? "No stories match this filter yet. Try All news." : "The news feed is being prepared. Please check back shortly.";
    } else {
      stateEl.hidden = true;
    }
    updatedEl.textContent = checkedAt ? "Feed checked " + dateLabel(checkedAt) + " · refreshes automatically" : "Waiting for the first news update";
  };
  async function loadNews(showLoading = false) {
    if (showLoading && !items.length) { stateEl.hidden = false; stateEl.textContent = "Loading the latest anime news…"; }
    try {
      const url = new URL("anime-news.json", new URL("./", location.href));
      url.searchParams.set("v", String(Math.floor(Date.now() / 60000)));
      const response = await fetch(url.href, {cache:"no-store",headers:{"Accept":"application/json"}});
      if (!response.ok) throw new Error("News feed HTTP " + response.status);
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error("Invalid news feed format");
      items = data.items.filter(item => item && safeUrl(item.url) && item.title);
      checkedAt = data.checked_at || new Date().toISOString();
      draw();
    } catch (error) {
      console.warn("Animee news feed unavailable:", error);
      if (!items.length) {
        stateEl.hidden = false;
        stateEl.textContent = "Anime news is temporarily unavailable. Please try Refresh in a little while.";
      }
      updatedEl.textContent = "Could not refresh the news feed";
    }
  }

  const safeImage = value => {
    try { const u = new URL(value); return u.protocol === "https:" ? u.href : ""; }
    catch (_) { return ""; }
  };
  const drawRankings = data => {
    const renderGroup = (target, entries, emptyText) => {
      if (!Array.isArray(entries) || !entries.length) {
        target.innerHTML = '<div class="an-state">' + esc(emptyText) + '</div>';
        return;
      }
      target.innerHTML = entries.slice(0, 10).map((anime, index) => {
        const url = safeUrl(anime.url);
        const image = safeImage(anime.image);
        if (!url) return "";
        const meta = [];
        if (anime.score) meta.push("⭐ " + Number(anime.score).toFixed(2));
        if (anime.year) meta.push(String(anime.year));
        if (anime.episodes) meta.push(String(anime.episodes) + " eps");
        if (anime.members) meta.push(Number(anime.members).toLocaleString() + " members");
        return '<article class="an-rank-card">' +
          (image ? '<img loading="lazy" src="' + esc(image) + '" alt="" referrerpolicy="no-referrer">' : '') +
          '<div class="an-rank-copy"><h4><span class="an-rank-number">#' + (index + 1) + '</span><a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(anime.title || "Anime title") + '</a></h4>' +
          '<div class="an-rank-meta">' + esc(meta.join(" · ") || anime.status || "View details") + '</div></div></article>';
      }).join("");
    };
    renderGroup(popularEl, data.popular, "Popular anime rankings are temporarily unavailable.");
    renderGroup(airingEl, data.airing, "Currently airing rankings are temporarily unavailable.");
    renderGroup(seasonEl, data.season, "Current season rankings are temporarily unavailable.");
    rankUpdatedEl.textContent = data.updated_at ? "Ranking data last updated " + dateLabel(data.updated_at) + " · data source: MyAnimeList via Jikan API" : "Ranking update time unavailable";
  };
  const mapJikanItems = payload => (payload.data || []).slice(0, 10).map(anime => ({
    title: anime.title_english || anime.title || anime.title_japanese || "Anime title",
    url: anime.url || "",
    image: ((anime.images || {}).webp || {}).large_image_url || (((anime.images || {}).jpg || {}).image_url || ""),
    score: anime.score || null,
    members: anime.members || null,
    episodes: anime.episodes || null,
    status: anime.status || "",
    year: anime.year || (((anime.aired || {}).prop || {}).from || {}).year || null
  })).filter(anime => safeUrl(anime.url));
  async function fetchLiveRankings() {
    const cacheKey = "animee-live-top10-v1";
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached && cached.savedAt && Date.now() - cached.savedAt < 30 * 60 * 1000 && cached.data) return cached.data;
    } catch (_) {}
    const endpoints = [
      ["popular", "https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=10"],
      ["airing", "https://api.jikan.moe/v4/top/anime?filter=airing&limit=10"],
      ["season", "https://api.jikan.moe/v4/seasons/now?limit=10"]
    ];
    const result = {updated_at:new Date().toISOString(),source:"MyAnimeList data via Jikan API"};
    for (let i = 0; i < endpoints.length; i++) {
      const [key, endpoint] = endpoints[i];
      if (i) await new Promise(resolve => window.setTimeout(resolve, 1200));
      const response = await fetch(endpoint, {headers:{"Accept":"application/json"}});
      if (!response.ok) throw new Error("Jikan " + key + " HTTP " + response.status);
      result[key] = mapJikanItems(await response.json());
    }
    try { localStorage.setItem(cacheKey, JSON.stringify({savedAt:Date.now(),data:result})); } catch (_) {}
    return result;
  }
  async function loadRankings() {
    try {
      const url = new URL("anime-top10.json", new URL("./", location.href));
      url.searchParams.set("v", String(Math.floor(Date.now() / 60000)));
      const response = await fetch(url.href, {cache:"no-store",headers:{"Accept":"application/json"}});
      if (!response.ok) throw new Error("Anime rankings HTTP " + response.status);
      let data = await response.json();
      if (!(data.popular || []).length || !(data.airing || []).length || !(data.season || []).length) {
        try {
          data = await fetchLiveRankings();
        } catch (fallbackError) {
          console.warn("Direct anime ranking refresh unavailable:", fallbackError);
        }
      }
      drawRankings(data);
    } catch (error) {
      console.warn("Animee rankings unavailable:", error);
      try {
        drawRankings(await fetchLiveRankings());
      } catch (_) {
        rankUpdatedEl.textContent = "Could not refresh rankings. Please try again later.";
      }
    }
  }

  filterEl.addEventListener("change", draw);
  panel.querySelector("#animee-news-refresh").addEventListener("click", () => loadNews(true));
  panel.querySelector("#animee-rank-refresh").addEventListener("click", loadRankings);
  toggleEl.addEventListener("click", () => {
    const collapsed = panel.dataset.collapsed !== "true";
    panel.dataset.collapsed = String(collapsed);
    toggleEl.textContent = collapsed ? "Show news" : "Hide news";
    toggleEl.setAttribute("aria-expanded", String(!collapsed));
  });
  loadNews(true);
  loadRankings();
  window.setInterval(() => loadNews(false), 5 * 60 * 1000);
  window.setInterval(loadRankings, 5 * 60 * 1000);
})();