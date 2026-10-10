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
    #animee-live-news button{border:1px solid #315875;border-radius:999px;padding:8px 11px;background:#0b3152;color:#f4f8ff;font:inherit;font-weight:750;cursor:pointer}
    #animee-live-news button:focus-visible,#animee-live-news a:focus-visible{outline:3px solid #75ddff;outline-offset:2px}
    #animee-live-news .an-section{margin-top:18px}
    #animee-live-news .an-section-title{font-size:16px;font-weight:850;margin:0;padding:0 0 7px;border-bottom:1px solid rgba(117,221,255,.3);color:#d8f4ff}
    #animee-live-news .an-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}
    #animee-live-news .an-item{min-width:0;padding:13px;border:1px solid rgba(117,221,255,.22);border-radius:12px;background:rgba(2,13,27,.38)}
    #animee-live-news .an-item h4{font-size:15px;line-height:1.35;margin:0 0 8px;color:#fff}
    #animee-live-news .an-item p{font-size:12px;color:#bfd4e7;margin:0 0 9px;overflow-wrap:anywhere}
    #animee-live-news .an-meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:11px;color:#b8d8ec}
    #animee-live-news .an-item a{color:#8fe5ff;font-weight:800;text-decoration:none}
    #animee-live-news .an-item a:hover{text-decoration:underline}
    #animee-live-news .an-state{color:#d0e5f4;padding:14px 0}
    #animee-live-news .an-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;color:#b8cce0;font-size:11px}
    #animee-live-news .an-disclaimer{margin:10px 0 0;color:#a9c2d7;font-size:11px}
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
      <div><h2 class="an-title" id="animee-news-title">📰 Anime News</h2><p class="an-sub">Fresh stories from anime publishers, studios, creators and the wider industry.</p></div>
      <div class="an-actions">
        <button id="animee-news-refresh" type="button">↻ Refresh</button>
        <button id="animee-news-toggle" type="button" aria-expanded="true">Hide news</button>
      </div>
    </div>
    <div class="an-content">
      <div class="an-state" id="animee-news-state" role="status" aria-live="polite">Loading the latest anime news…</div>
      <div id="animee-news-sections"></div>
      <div class="an-foot"><span id="animee-news-updated">Checking news feed…</span><a href="https://www.crunchyroll.com/news/" target="_blank" rel="noopener noreferrer">Crunchyroll News ↗</a></div>
      <p class="an-disclaimer">Animee links to original publishers. A news report is not necessarily a primary studio announcement; check the linked source for confirmation.</p>
    </div>`;
  const header = document.querySelector("header");
  if (header) header.insertAdjacentElement("afterend", panel);
  else document.body.insertBefore(panel, document.body.firstChild);

  const stateEl = panel.querySelector("#animee-news-state");
  const sectionsEl = panel.querySelector("#animee-news-sections");
  const updatedEl = panel.querySelector("#animee-news-updated");
  const toggleEl = panel.querySelector("#animee-news-toggle");
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
  const normalizeTitle = value => String(value || "").toLowerCase().replace(/&amp;/g,"and").replace(/[^a-z0-9]+/g," ").trim();
  const renderCard = item => {
    const url = safeUrl(item.url);
    if (!url) return "";
    return `<article class="an-item">
      <div class="an-meta"><span>${esc(item.source || "Anime news")}</span></div>
      <h4>${esc(item.title || "Anime news update")}</h4>
      ${item.summary ? `<p>${esc(item.summary)}</p>` : ""}
      <div class="an-meta"><span>${esc(dateLabel(item.published))}</span></div>
      <p style="margin:9px 0 0"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Read original story ↗</a></p>
    </article>`;
  };
  const draw = () => {
    const groups = [
      {key:"all", title:"Latest Anime News", match:item => item.category === "all"},
      {key:"announcement", title:"Announcements & Releases", match:item => item.category === "announcement"},
      {key:"creator", title:"Creators & Industry Updates", match:item => item.category === "creator"}
    ];
    const sections = groups.map(group => {
      const groupItems = items.filter(group.match).slice(0, group.key === "all" ? 6 : 4);
      if (!groupItems.length) return "";
      return `<section class="an-section" aria-labelledby="an-section-${group.key}">
        <h3 class="an-section-title" id="an-section-${group.key}">${group.title}</h3>
        <div class="an-list">${groupItems.map(renderCard).join("")}</div>
      </section>`;
    }).join("");
    sectionsEl.innerHTML = sections;
    if (!sections) {
      stateEl.hidden = false;
      stateEl.textContent = items.length ? "No stories are available in these categories yet." : "The news feed is being prepared. Please check back shortly.";
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
      const seen = new Set();
      items = data.items.filter(item => {
        if (!item || !safeUrl(item.url) || !item.title) return false;
        const key = normalizeTitle(item.title) + "|" + String(item.source || "").toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map(item => {
        const category = ["announcement","creator"].includes(item.category) ? item.category : "all";
        return {...item, category};
      });
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

  panel.querySelector("#animee-news-refresh").addEventListener("click", () => loadNews(true));
  toggleEl.addEventListener("click", () => {
    const collapsed = panel.dataset.collapsed !== "true";
    panel.dataset.collapsed = String(collapsed);
    toggleEl.textContent = collapsed ? "Show news" : "Hide news";
    toggleEl.setAttribute("aria-expanded", String(!collapsed));
  });
  loadNews(true);
  window.setInterval(() => loadNews(false), 5 * 60 * 1000);
})();