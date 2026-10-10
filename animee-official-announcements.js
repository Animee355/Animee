(() => {
  "use strict";
  if (document.getElementById("animee-official-sources")) return;

  const style = document.createElement("style");
  style.textContent = `
    #animee-official-sources{width:min(1200px,calc(100% - 28px));margin:14px auto 18px;padding:16px;background:linear-gradient(145deg,#102d49,#071a2d);color:#f4f8ff;border:1px solid rgba(117,221,255,.28);border-radius:16px;box-shadow:0 10px 26px rgba(7,55,95,.12);font:14px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
    #animee-official-sources *{box-sizing:border-box}
    #animee-official-sources .ao-title{margin:0;color:#fff;font-size:clamp(18px,3vw,23px);font-weight:900}
    #animee-official-sources .ao-sub{margin:4px 0 12px;color:#bfd4e7;font-size:12px}
    #animee-official-sources .ao-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #animee-official-sources .ao-card{padding:13px;border:1px solid rgba(117,221,255,.22);border-radius:12px;background:rgba(2,13,27,.38);min-width:0}
    #animee-official-sources .ao-card h3{margin:0 0 5px;font-size:15px;color:#fff}
    #animee-official-sources .ao-card p{margin:0 0 10px;font-size:12px;color:#bfd4e7}
    #animee-official-sources .ao-link{display:inline-block;color:#8fe5ff;font-weight:850;text-decoration:none}
    #animee-official-sources .ao-link:hover{text-decoration:underline}
    #animee-official-sources .ao-tag{display:inline-block;margin-bottom:7px;padding:3px 7px;border-radius:999px;border:1px solid rgba(105,230,184,.35);background:rgba(17,103,76,.22);color:#b9f8dc;font-size:10px;font-weight:900;letter-spacing:.04em}
    #animee-official-sources .ao-note{margin:12px 0 0;color:#a9c2d7;font-size:11px}
    @media(max-width:560px){#animee-official-sources{padding:12px}#animee-official-sources .ao-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.id = "animee-official-sources";
  section.setAttribute("aria-labelledby", "animee-official-title");
  section.innerHTML = `
    <h2 class="ao-title" id="animee-official-title">🛡️ Official Anime Announcements</h2>
    <p class="ao-sub">Check primary publisher and production-company channels before treating a sequel, release date, or cast announcement as confirmed.</p>
    <div class="ao-grid">
      <article class="ao-card">
        <span class="ao-tag">OFFICIAL SOURCE</span>
        <h3>Aniplex — Official News</h3>
        <p>Announcements, trailers, cast updates, and news published by Aniplex.</p>
        <a class="ao-link" href="https://www.aniplex.co.jp/news/index.html" target="_blank" rel="noopener noreferrer">Visit Aniplex News ↗</a>
      </article>
      <article class="ao-card">
        <span class="ao-tag">OFFICIAL SOURCE</span>
        <h3>KADOKAWA Animation</h3>
        <p>Official animation portal with news, events, titles, and project updates.</p>
        <a class="ao-link" href="https://kadokawa-anime.com/news/" target="_blank" rel="noopener noreferrer">Visit KADOKAWA Animation News ↗</a>
      </article>
    </div>
    <p class="ao-note">Source transparency: these are official publisher/producer channels, not an automatically synchronized list of every anime announcement. For a specific series, check its own official website or the rights holder’s announcement too. Animee’s separate news feed contains third-party reporting.</p>
  `;

  const newsPanel = document.getElementById("animee-live-news");
  if (newsPanel && newsPanel.parentNode) newsPanel.parentNode.insertBefore(section, newsPanel);
  else {
    const header = document.querySelector("header");
    if (header) header.insertAdjacentElement("afterend", section);
    else document.body.insertBefore(section, document.body.firstChild);
  }
})();
