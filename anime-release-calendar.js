(() => {
  "use strict";
  if (document.getElementById("animee-release-calendar")) return;

  const API = "https://api.jikan.moe/v4/seasons/now?sfw=true&limit=25";
  const css = document.createElement("style");
  css.textContent = `
    #animee-release-calendar{width:min(1200px,calc(100% - 28px));margin:14px auto 20px;padding:18px;background:linear-gradient(145deg,#102d49,#071a2d);color:#f4f8ff;border:1px solid rgba(117,221,255,.24);border-radius:16px;box-shadow:0 10px 26px rgba(0,0,0,.18);font:14px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
    #animee-release-calendar *{box-sizing:border-box}
    #animee-release-calendar .rc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
    #animee-release-calendar h2{margin:0;font-size:clamp(19px,3vw,25px);font-weight:900;color:#fff}
    #animee-release-calendar .rc-sub{margin:4px 0 0;color:#bfd4e7;font-size:12px}
    #animee-release-calendar .rc-local{margin-top:8px;color:#9feaff;font-size:11px}
    #animee-release-calendar .rc-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    #animee-release-calendar button,#animee-release-calendar select,#animee-release-calendar input{border:1px solid #315875;border-radius:9px;padding:8px 10px;background:#0b2036;color:#f4f8ff;font:inherit}
    #animee-release-calendar button{cursor:pointer;font-weight:750}
    #animee-release-calendar button:focus-visible,#animee-release-calendar a:focus-visible,#animee-release-calendar input:focus-visible,#animee-release-calendar select:focus-visible{outline:3px solid #75ddff;outline-offset:2px}
    #animee-release-calendar .rc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
    #animee-release-calendar .rc-card{min-width:0;padding:13px;border:1px solid rgba(117,221,255,.22);border-radius:12px;background:rgba(2,13,27,.42)}
    #animee-release-calendar .rc-card h3{margin:0 0 7px;font-size:15px;line-height:1.35;overflow-wrap:anywhere}
    #animee-release-calendar .rc-card p{margin:0 0 8px;color:#bfd4e7;font-size:12px}
    #animee-release-calendar .rc-card a{color:#8fe5ff;font-weight:800;text-decoration:none}
    #animee-release-calendar .rc-card a:hover{text-decoration:underline}
    #animee-release-calendar .rc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
    #animee-release-calendar .rc-chip{display:inline-block;padding:3px 7px;border-radius:7px;background:#123858;color:#c7f3ff;font-size:10px;font-weight:800}
    #animee-release-calendar .rc-state{padding:16px 0;color:#d0e5f4}
    #animee-release-calendar .rc-foot{margin-top:12px;color:#a9c2d7;font-size:11px}
    @media(max-width:850px){#animee-release-calendar .rc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:540px){#animee-release-calendar{padding:13px}#animee-release-calendar .rc-grid{grid-template-columns:1fr}#animee-release-calendar .rc-tools{width:100%}#animee-release-calendar .rc-tools input{flex:1;min-width:0;width:100%}}
  `;
  document.head.appendChild(css);

  const panel = document.createElement("section");
  panel.id = "animee-release-calendar";
  panel.setAttribute("aria-labelledby", "animee-release-title");
  panel.innerHTML = `
    <div class="rc-head">
      <div>
        <h2 id="animee-release-title">📅 Anime Release Calendar</h2>
        <p class="rc-sub">Browse currently airing anime and their published broadcast schedules.</p>
        <div class="rc-local" id="animee-release-local"></div>
      </div>
      <div class="rc-tools">
        <input id="animee-release-search" type="search" maxlength="80" placeholder="Search anime…" aria-label="Search anime titles">
        <select id="animee-release-day" aria-label="Filter by broadcast day">
          <option value="all">All broadcast days</option>
          <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
          <option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
        </select>
        <button id="animee-release-refresh" type="button">↻ Refresh</button>
      </div>
    </div>
    <div id="animee-release-state" class="rc-state" role="status" aria-live="polite">Loading current-season schedule…</div>
    <div id="animee-release-grid" class="rc-grid"></div>
    <div class="rc-foot">Schedule data provided by Jikan, using MyAnimeList data. Broadcast times and dates can change; check the linked listing or official anime channels before watching. “TBA” means a precise time was not available.</div>
  `;

  const newsPanel = document.getElementById("animee-live-news");
  const header = document.querySelector("body > header");
  if (newsPanel) newsPanel.insertAdjacentElement("afterend", panel);
  else if (header) header.insertAdjacentElement("afterend", panel);
  else document.body.prepend(panel);

  const grid = panel.querySelector("#animee-release-grid");
  const state = panel.querySelector("#animee-release-state");
  const search = panel.querySelector("#animee-release-search");
  const daySelect = panel.querySelector("#animee-release-day");
  const local = panel.querySelector("#animee-release-local");
  let animeItems = [];
  let loading = false;

  function updateLocalTime() {
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "your device timezone";
      local.textContent = "🟢 Local time: " + new Date().toLocaleString(undefined, {weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit"}) + " · " + zone;
    } catch (_) { local.textContent = "Times shown in the timezone available on your device."; }
  }

  function safeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function scheduleText(item) {
    const broadcast = item.broadcast || {};
    const day = broadcast.day || "";
    const time = broadcast.time || "";
    const zone = broadcast.timezone || "";
    const sourceParts = [];
    if (day) sourceParts.push(day);
    if (time) sourceParts.push(time);
    if (zone) sourceParts.push(zone.replace(/_/g, " "));
    const sourceText = sourceParts.length ? sourceParts.join(" · ") : "";
    const localDate = nextBroadcastLocal(day, time, zone);
    if (localDate) return "Your time: " + localDate.toLocaleString(undefined, {weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) + (sourceText ? " · Source: " + sourceText : "");
    if (sourceText) return sourceText;
    const start = safeDate(item.aired && item.aired.from);
    if (start) return "Premiere date: " + start.toLocaleDateString(undefined, {year:"numeric",month:"short",day:"numeric"});
    return "Broadcast time TBA";
  }

  function nextBroadcastLocal(day, time, zone) {
    if (!day || !time || !zone) return null;
    const dayIndex = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(String(day).toLowerCase().replace(/s$/, ""));
    const match = String(time).match(/^(\\d{1,2}):(\\d{2})/);
    if (dayIndex < 0 || !match) return null;
    const wantedHour = Number(match[1]), wantedMinute = Number(match[2]);
    try {
      const fmt = new Intl.DateTimeFormat("en-US", {timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",weekday:"long",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
      const partsOf = date => Object.fromEntries(fmt.formatToParts(date).filter(p => p.type !== "literal").map(p => [p.type,p.value]));
      const now = new Date();
      const current = partsOf(now);
      const currentDay = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(String(current.weekday).toLowerCase());
      let delta = (dayIndex - currentDay + 7) % 7;
      if (delta === 0 && (Number(current.hour) > wantedHour || (Number(current.hour) === wantedHour && Number(current.minute) >= wantedMinute))) delta = 7;
      const base = new Date(Date.UTC(Number(current.year), Number(current.month)-1, Number(current.day)+delta, wantedHour, wantedMinute));
      const target = Date.UTC(base.getUTCFullYear(),base.getUTCMonth(),base.getUTCDate(),wantedHour,wantedMinute);
      let epoch = target;
      for (let i=0;i<4;i++) {
        const shown = partsOf(new Date(epoch));
        const shownAsUTC = Date.UTC(Number(shown.year),Number(shown.month)-1,Number(shown.day),Number(shown.hour),Number(shown.minute));
        epoch += target - shownAsUTC;
      }
      return new Date(epoch);
    } catch (_) { return null; }
  }

  function dateChip(item) {
    const start = safeDate(item.aired && item.aired.from);
    if (start) return "Premiere: " + start.toLocaleDateString(undefined, {month:"short",day:"numeric",year:"numeric"});
    return "Premiere date TBA";
  }

  function render() {
    const term = search.value.trim().toLocaleLowerCase();
    const day = daySelect.value;
    const filtered = animeItems.filter(item => {
      const title = String(item.title || "");
      const titleEnglish = String(item.title_english || "");
      const broadcastDay = item.broadcast && item.broadcast.day || "";
      return (!term || title.toLocaleLowerCase().includes(term) || titleEnglish.toLocaleLowerCase().includes(term))
        && (day === "all" || broadcastDay === day);
    });
    grid.innerHTML = filtered.map(item => {
      const title = item.title_english || item.title || "Untitled anime";
      const score = Number.isFinite(Number(item.score)) && Number(item.score) > 0 ? "⭐ " + Number(item.score).toFixed(1) : "";
      const genres = Array.isArray(item.genres) ? item.genres.slice(0,3).map(g => g.name).filter(Boolean).join(" · ") : "";
      return `<article class="rc-card">
        <div class="rc-meta"><span class="rc-chip">${dateChip(item)}</span>${score ? `<span class="rc-chip">${score}</span>` : ""}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>🕒 ${escapeHtml(scheduleText(item))}</p>
        ${genres ? `<p>${escapeHtml(genres)}</p>` : ""}
        <a href="${validMalUrl(item.url)}" target="_blank" rel="noopener noreferrer">View anime details ↗</a>
      </article>`;
    }).join("");
    if (!filtered.length) {
      state.hidden = false;
      state.textContent = animeItems.length ? "No anime match your search or selected day." : "No schedule entries are available right now. Try Refresh later.";
    } else {
      state.hidden = true;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }

  function validMalUrl(value) {
    try {
      const url = new URL(value);
      return url.hostname === "myanimelist.net" || url.hostname.endsWith(".myanimelist.net") ? url.href : "https://myanimelist.net/anime";
    } catch (_) { return "https://myanimelist.net/anime"; }
  }

  async function load() {
    if (loading) return;
    loading = true;
    state.hidden = false;
    state.textContent = "Loading current-season schedule…";
    try {
      const response = await fetch(API, {headers: {"Accept":"application/json"}});
      if (!response.ok) throw new Error("Schedule service returned " + response.status);
      const data = await response.json();
      animeItems = Array.isArray(data.data) ? data.data.filter(item => item && item.title) : [];
      animeItems.sort((a,b) => {
        const da = safeDate(a.aired && a.aired.from);
        const db = safeDate(b.aired && b.aired.from);
        if (da && db) return da - db;
        if (da) return -1;
        if (db) return 1;
        return String(a.title).localeCompare(String(b.title));
      });
      render();
    } catch (error) {
      console.warn("Animee release calendar unavailable:", error);
      state.hidden = false;
      state.textContent = "The release schedule could not load right now. Please try Refresh in a little while.";
    } finally {
      loading = false;
    }
  }

  search.addEventListener("input", render);
  daySelect.addEventListener("change", render);
  panel.querySelector("#animee-release-refresh").addEventListener("click", load);
  updateLocalTime();
  window.setInterval(updateLocalTime, 1000);
  load();
  window.setInterval(load, 30 * 60 * 1000);
})();