(() => {
  "use strict";
  if (document.getElementById("animee-confirmed-tracker")) return;

  const section = document.createElement("section");
  section.id = "animee-confirmed-tracker";
  section.setAttribute("aria-labelledby", "animee-confirmed-tracker-title");

  const style = document.createElement("style");
  style.textContent = `
    #animee-confirmed-tracker{width:min(1200px,calc(100% - 28px));margin:14px auto 18px;padding:16px;background:linear-gradient(145deg,#092b43,#06182b);color:#f4f8ff;border:1px solid rgba(111,220,255,.28);border-radius:16px;box-shadow:0 10px 26px rgba(7,55,95,.12);font:14px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
    #animee-confirmed-tracker *{box-sizing:border-box}
    #animee-confirmed-tracker .act-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
    #animee-confirmed-tracker h2{margin:0;color:#fff;font-size:clamp(19px,3vw,24px);font-weight:900}
    #animee-confirmed-tracker .act-intro{margin:5px 0 13px;color:#bfd4e7;font-size:12px;max-width:820px}
    #animee-confirmed-tracker .act-controls{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 12px}
    #animee-confirmed-tracker .act-filter{border:1px solid rgba(135,206,235,.38);border-radius:999px;background:#102f49;color:#eaf7ff;padding:7px 12px;font-weight:800;cursor:pointer}
    #animee-confirmed-tracker .act-filter[aria-pressed="true"]{background:#b7edff;color:#08223a;border-color:#b7edff}
    #animee-confirmed-tracker .act-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #animee-confirmed-tracker .act-card{padding:14px;border:1px solid rgba(117,221,255,.22);border-radius:12px;background:rgba(2,13,27,.4);min-width:0}
    #animee-confirmed-tracker .act-status{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;background:rgba(27,133,91,.2);border:1px solid rgba(105,230,184,.35);color:#b9f8dc;font-size:10px;font-weight:900;letter-spacing:.04em}
    #animee-confirmed-tracker .act-card h3{margin:8px 0 5px;color:#fff;font-size:16px;line-height:1.35}
    #animee-confirmed-tracker .act-detail{margin:0 0 8px;color:#a7e8ff;font-weight:800;font-size:12px}
    #animee-confirmed-tracker .act-card p{margin:0 0 10px;color:#d0deeb;font-size:12px}
    #animee-confirmed-tracker .act-meta{margin:0 0 9px;color:#9fb9ce;font-size:11px}
    #animee-confirmed-tracker .act-source{color:#8fe5ff;font-weight:850;text-decoration:none}
    #animee-confirmed-tracker .act-source:hover{text-decoration:underline}
    #animee-confirmed-tracker .act-foot{margin:12px 0 0;color:#9fb9ce;font-size:11px}
    #animee-confirmed-tracker .act-empty{padding:14px;color:#bfd4e7}
    @media(max-width:620px){#animee-confirmed-tracker{padding:12px}#animee-confirmed-tracker .act-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  section.innerHTML = `
    <div class="act-head"><h2 id="animee-confirmed-tracker-title">📅 Confirmed Anime Announcements Tracker</h2></div>
    <p class="act-intro">Track confirmed sequels, new series, and release windows using directly linked official announcements. “TBA” means the linked source does not state a release date.</p>
    <div class="act-controls" role="group" aria-label="Filter announcements">
      <button type="button" class="act-filter" data-filter="all" aria-pressed="true">All</button>
      <button type="button" class="act-filter" data-filter="Confirmed" aria-pressed="false">Confirmed</button>
      <button type="button" class="act-filter" data-filter="upcoming" aria-pressed="false">Upcoming dates</button>
      <button type="button" class="act-filter" data-filter="Released" aria-pressed="false">Already released</button>
    </div>
    <div class="act-grid" aria-live="polite"><p class="act-empty">Loading verified entries…</p></div>
    <p class="act-foot">Source policy: only items with a direct official publisher/production-company announcement are listed here. This is a curated tracker, not an exhaustive live feed. Last data update: <span class="act-updated">—</span>.</p>
  `;

  const newsPanel = document.getElementById("animee-live-news");
  if (newsPanel && newsPanel.parentNode) newsPanel.parentNode.insertBefore(section, newsPanel);
  else {
    const header = document.querySelector("header");
    if (header) header.insertAdjacentElement("afterend", section);
    else document.body.insertBefore(section, document.body.firstChild);
  }

  const grid = section.querySelector(".act-grid");
  const updated = section.querySelector(".act-updated");
  let items = [];
  let currentFilter = "all";
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
  const formatDate = value => {
    if (!value) return "";
    const parsed = new Date(value + "T12:00:00Z");
    return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
      year:"numeric",month:"short",day:"numeric",timeZone:"UTC"
    }).format(parsed);
  };

  function render() {
    const visible = items.filter(item => {
      if (currentFilter === "all") return true;
      if (currentFilter === "upcoming") return item.date_iso && item.date_iso >= new Date().toISOString().slice(0,10) && item.status !== "Released";
      return item.status === currentFilter;
    });
    section.querySelectorAll(".act-filter").forEach(button =>
      button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter))
    );
    if (!visible.length) {
      grid.innerHTML = '<p class="act-empty">No entries match this filter right now.</p>';
      return;
    }
    grid.innerHTML = visible.map(item => {
      const sourceUrl = /^https:\/\//i.test(item.source_url || "") ? item.source_url : "";
      const label = item.status === "Released" ? "PREMIERED / RELEASED" : "OFFICIALLY CONFIRMED";
      const date = item.date_value ? '<div class="act-detail">' + escapeHTML(item.date_label || "Date") + ': ' + escapeHTML(item.date_value) + '</div>' : "";
      return '<article class="act-card">' +
        '<span class="act-status">✓ ' + label + '</span>' +
        '<h3>' + escapeHTML(item.title) + '</h3>' +
        date +
        '<p>' + escapeHTML(item.status_detail || "") + '</p>' +
        '<p>' + escapeHTML(item.synopsis || "") + '</p>' +
        '<div class="act-meta">Announcement date: ' + escapeHTML(formatDate(item.announcement_date) || "Not listed") + '</div>' +
        (sourceUrl ? '<a class="act-source" href="' + escapeHTML(sourceUrl) + '" target="_blank" rel="noopener noreferrer">Source: ' + escapeHTML(item.source_name || "Official announcement") + ' ↗</a>' : '<span class="act-meta">Official source link unavailable</span>') +
      '</article>';
    }).join("");
  }

  section.querySelectorAll(".act-filter").forEach(button => button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  }));

  fetch("./animee-confirmed-announcements.json", { cache: "no-store" })
    .then(response => { if (!response.ok) throw new Error("Announcement data could not be loaded"); return response.json(); })
    .then(data => {
      items = Array.isArray(data.items) ? data.items.filter(item =>
        item && typeof item.title === "string" && item.confidence === "official" &&
        /^https:\/\//i.test(item.source_url || "")
      ) : [];
      updated.textContent = formatDate(data.updated_at) || "not provided";
      render();
    })
    .catch(() => {
      grid.innerHTML = '<p class="act-empty">The tracker could not load its data. Please refresh the page later.</p>';
    });
})();
