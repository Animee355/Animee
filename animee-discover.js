/* Animee discovery catalog. Public anime metadata; watch links open Anikoto. */
(() => {
  "use strict";
  const API = "https://graphql.anilist.co";
  const watchUrl = (title) => "https://anikoto.cz/search?keyword=" + encodeURIComponent(String(title || "").trim());
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const titleOf = (media) => media?.title?.english || media?.title?.romaji || media?.title?.native || "Untitled anime";
  const cleanText = (value) => String(value || "").replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
  const gql = async (query, variables = {}) => {
    const response = await fetch(API, {
      method: "POST",
      headers: {"Content-Type":"application/json","Accept":"application/json"},
      body: JSON.stringify({query, variables})
    });
    if (!response.ok) throw new Error("Anime catalog service returned " + response.status);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(payload.errors[0].message || "Anime catalog query failed");
    return payload.data;
  };
  const posterCard = (media, extra = "") => {
    const title = escapeHTML(titleOf(media));
    const image = escapeHTML(media?.coverImage?.large || media?.coverImage?.medium || "");
    const url = escapeHTML(watchUrl(titleOf(media)));
    const score = media?.averageScore ? (Number(media.averageScore)/10).toFixed(1) : "";
    const year = media?.seasonYear || media?.startDate?.year || "";
    const format = media?.format ? media.format.replaceAll("_"," ") : "ANIME";
    const genres = (media?.genres || []).slice(0,2).map(escapeHTML).join(" · ");
    return `<article class="discover-anime-card"><a class="discover-poster-link" href="${url}" target="_blank" rel="noopener" aria-label="Find ${title} on Anikoto">${image ? `<img src="${image}" alt="${title}" loading="lazy" decoding="async">` : ""}${score ? `<span class="discover-score">★ ${score}</span>` : ""}</a><div class="discover-anime-info"><h4><a href="${url}" target="_blank" rel="noopener">${title}</a></h4><p>${escapeHTML([format,year].filter(Boolean).join(" · "))}</p>${genres ? `<p>${genres}</p>` : ""}${extra}</div></article>`;
  };
  const showError = (id, message) => { const el=$(id); if(el) el.innerHTML=`<div class="discover-empty">${escapeHTML(message)}<br><a class="discover-text-link" href="https://anikoto.cz/home" target="_blank" rel="noopener">Find anime on Anikoto ↗</a></div>`; };
  const trendingQuery = `query { Page(page:1, perPage:8) { media(type:ANIME, sort:TRENDING_DESC, isAdult:false) { id title { english romaji native } coverImage { large medium } bannerImage siteUrl description(asHtml:false) averageScore trending seasonYear format genres status startDate { year } } } }`;
  const popularQuery = `query { Page(page:1, perPage:10) { media(type:ANIME, sort:POPULARITY_DESC, isAdult:false) { id title { english romaji native } coverImage { large medium } siteUrl averageScore seasonYear format genres startDate { year } } } }`;
  const upcomingQuery = `query { Page(page:1, perPage:10) { media(type:ANIME, status:NOT_YET_RELEASED, sort:POPULARITY_DESC, isAdult:false) { id title { english romaji native } coverImage { large medium } siteUrl averageScore seasonYear format genres startDate { year month day } } } }`;
  const releasingQuery = `query { Page(page:1, perPage:10) { media(type:ANIME, status:RELEASING, sort:TRENDING_DESC, isAdult:false) { id title { english romaji native } coverImage { large medium } averageScore seasonYear format genres startDate { year } } } }`;
  const completedQuery = `query { Page(page:1, perPage:10) { media(type:ANIME, status:FINISHED, sort:POPULARITY_DESC, isAdult:false) { id title { english romaji native } coverImage { large medium } averageScore seasonYear format genres startDate { year } } } }`;
  const airingQuery = `query($from:Int!, $to:Int!) { Page(page:1, perPage:12) { airingSchedules(airingAt_greater:$from, airingAt_lesser:$to, sort:TIME) { airingAt episode media { id title { english romaji native } coverImage { large medium } siteUrl averageScore seasonYear format genres } } } }`;
  function renderSpotlight(items) {
    const el=$("discover-spotlight");
    if(!items?.length){showError("discover-spotlight","Spotlight is temporarily unavailable.");return;}
    let active=0;
    const render=()=>{
      const item=items[active];
      const title=escapeHTML(titleOf(item));
      const description=escapeHTML(cleanText(item.description)||"Discover the story, cast, genres, and details for this anime.");
      const banner=escapeHTML(item.bannerImage||item.coverImage?.large||"");
      const cover=escapeHTML(item.coverImage?.large||"");
      const details=[item.format?.replaceAll("_"," "),item.seasonYear,item.averageScore?`★ ${(item.averageScore/10).toFixed(1)}`:null].filter(Boolean).map(escapeHTML).join(" · ");
      el.innerHTML=`<div class="discover-spotlight-art" style="background-image:url('${banner}')"></div><div class="discover-spotlight-copy"><span class="discover-pill">✦ Featured anime · ${active+1} / ${items.length}</span><h3>${title}</h3><p>${description}</p><div class="discover-spotlight-meta">${details}</div><div class="discover-spotlight-actions"><a class="discover-action" href="${watchUrl(titleOf(item))}" target="_blank" rel="noopener">Watch on Anikoto ↗</a><button class="discover-action secondary" type="button" id="discover-next">${active===items.length-1?"Back to first":"Next spotlight"} →</button></div></div><div class="discover-spotlight-side">${cover?`<img src="${cover}" alt="${title} poster" loading="lazy">`:""}</div>`;
      $("discover-next")?.addEventListener("click",()=>{active=(active+1)%items.length;render();});
    };
    render();
  }
  async function loadAiring() {
    const now=Math.floor(Date.now()/1000);
    try{
      const data=await gql(airingQuery,{from:now-60,to:now+7*24*60*60});
      const schedules=data?.Page?.airingSchedules||[];
      const unique=[]; const seen=new Set();
      for(const schedule of schedules){if(!schedule.media||seen.has(schedule.media.id))continue;seen.add(schedule.media.id);unique.push(schedule);}
      const el=$("discover-airing");
      if(!unique.length){el.innerHTML='<div class="discover-empty">No upcoming episode schedules were found for the next 7 days. Check back soon.</div>';return;}
      el.innerHTML=unique.slice(0,8).map(s=>{
        const when=new Date(s.airingAt*1000);
        const date=when.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
        return posterCard(s.media,`<p class="discover-episode">Episode ${escapeHTML(s.episode)} · ${escapeHTML(date)}</p>`);
      }).join("");
    }catch(e){showError("discover-airing","Episode schedule could not load right now.");}
  }
  async function loadCatalog() {
    try{
      const data=await gql(trendingQuery);
      const items=data?.Page?.media||[];
      renderSpotlight(items.slice(0,6));
      $("discover-trending").innerHTML=items.slice(0,10).map((item,i)=>posterCard(item,`<p class="discover-episode">Trending #${i+1}</p>`)).join("")||'<div class="discover-empty">No trending titles available right now.</div>';
    }catch(e){showError("discover-spotlight","Anime spotlight could not load right now.");showError("discover-trending","Trending titles could not load right now.");}
    try{
      const data=await gql(upcomingQuery);
      const items=data?.Page?.media||[];
      $("discover-upcoming").innerHTML=items.map((item)=>posterCard(item,`<p class="discover-episode">${item.startDate?.year?escapeHTML([item.startDate.year,item.startDate.month,item.startDate.day].filter(Boolean).join("-")):"Release date TBA"}</p>`)).join("")||'<div class="discover-empty">No upcoming titles are listed right now.</div>';
    }catch(e){showError("discover-upcoming","Upcoming anime could not load right now.");}
    try{
      const data=await gql(popularQuery);
      const items=data?.Page?.media||[];
      const el=$("discover-popular");
      if(el) el.innerHTML=items.map((item,i)=>posterCard(item,`<p class="discover-episode">Popularity #${i+1}</p>`)).join("")||'<div class="discover-empty">No popular titles are available right now.</div>';
    }catch(e){showError("discover-popular","Popular anime could not load right now.");}
    try{
      const data=await gql(releasingQuery);
      const items=data?.Page?.media||[];
      const el=$("discover-airing-now");
      if(el) el.innerHTML=items.map(posterCard).join("")||'<div class="discover-empty">No currently airing titles are listed right now.</div>';
    }catch(e){showError("discover-airing-now","Currently airing anime could not load right now.");}
    try{
      const data=await gql(completedQuery);
      const items=data?.Page?.media||[];
      const el=$("discover-completed");
      if(el) el.innerHTML=items.map(posterCard).join("")||'<div class="discover-empty">No completed titles are listed right now.</div>';
    }catch(e){showError("discover-completed","Completed anime could not load right now.");}
  }
  async function searchAnime(event) {
    event?.preventDefault();
    const query=$("discover-query")?.value.trim()||"";
    const genre=$("discover-genre")?.value||"";
    const el=$("discover-results");
    if(!query&&!genre){el.innerHTML='<p class="discover-note">Enter an anime title or choose a genre to browse. Search results will include a direct Anikoto link.</p>';return;}
    el.innerHTML='<div class="discover-loading">Searching the anime catalog…</div>';
    const queryText=`query($search:String, $genres:[String]) { Page(page:1, perPage:15) { media(type:ANIME, search:$search, genre_in:$genres, sort:TRENDING_DESC, isAdult:false) { id title { english romaji native } coverImage { large medium } siteUrl averageScore seasonYear format genres startDate { year } } } }`;
    try{
      const data=await gql(queryText,{search:query||null,genres:genre?[genre]:null});
      const items=data?.Page?.media||[];
      el.innerHTML=items.length
        ? items.map(posterCard).join("")
        : `<div class="discover-empty">No matching titles in the catalog. You can search Anikoto directly for “${escapeHTML(query || genre)}”.<br><a class="discover-action" href="${watchUrl(query || genre)}" target="_blank" rel="noopener">Find and watch on Anikoto ↗</a></div>`;
    }catch(e){el.innerHTML='<div class="discover-empty">Search is temporarily unavailable. Please try again shortly.</div>';}
  }
  $("discover-search-form")?.addEventListener("submit",searchAnime);
  $("discover-genre")?.addEventListener("change",()=>{if($("discover-query")?.value.trim()||$("discover-genre")?.value)searchAnime();});
  $("discover-genre-pills")?.addEventListener("click",(event)=>{const button=event.target.closest("[data-genre]");if(!button)return;const genre=button.dataset.genre;const select=$("discover-genre");if(select){select.value=genre;}const input=$("discover-query");if(input)input.value="";searchAnime();$("discover-results")?.scrollIntoView({behavior:"smooth",block:"start"});});
  $("discover-letters")?.addEventListener("click",(event)=>{const button=event.target.closest("[data-letter]");if(!button)return;const letter=button.dataset.letter;const input=$("discover-query");if(input)input.value=letter;const select=$("discover-genre");if(select)select.value="";searchAnime();$("discover-results")?.scrollIntoView({behavior:"smooth",block:"start"});});
  if($("animee-discover")){loadCatalog();loadAiring();}
})();