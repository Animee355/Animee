# ANIMEE SEO and Anime News Plan

Primary website: https://animee.animeepages.workers.dev/

## SEO metadata updated
- Home: ANIMEE | Anime News, Videos & Fan Community
- Anime library: Anime Video Library & Official Trailers | ANIMEE
- Community: Anime Community & Fan Profiles | ANIMEE
- Community feed: Anime Fan Discussions & Community Feed | ANIMEE

Each page should keep its existing canonical URL on the Cloudflare Worker domain. Metadata changes alone do not guarantee rankings; Google chooses snippets based on the query and page content.

## Keyword map (ideas, not search-volume estimates)
1. Homepage / brand
   - ANIMEE anime
   - anime news and announcements
   - anime fan community
2. Anime library
   - official anime trailers
   - anime video library
   - legal anime streaming options
3. Community profiles
   - anime community
   - meet anime fans
   - anime fan profiles
4. Community feed
   - anime fan discussions
   - anime opinions and recommendations
   - anime community posts

Use these phrases naturally in headings and visible page copy. Do not repeat keywords unnaturally. Use Search Console > Performance > Search results to replace guesses with actual query data over time.

## News publishing workflow
For each news article:
1. Confirm the announcement from an official publisher, studio, production committee, broadcaster, or streaming service. Use reputable reporting as a second source for context.
2. Write a clear, specific headline that includes the anime title and the actual news.
3. Lead with what happened, who announced it, and the announcement date.
4. Include useful details such as release date, region, platform, confirmed cast/crew, and what remains unconfirmed.
5. Add a source link and a visible publication/update date. Do not copy another outlet's article; write an original summary.
6. Add a relevant internal link to the anime library or community, and link the article from the homepage/news section.
7. After publishing a real, accessible article URL, add it to sitemap.xml and request indexing in Search Console if appropriate.

Suggested recurring article types:
- Official anime release-date announcements
- New trailer breakdowns based on details actually shown
- Confirmed cast and staff announcements
- Seasonal anime watch guides, clearly dated and updated
- Legal streaming availability by region, with provider links

## Four-week starter calendar
- Week 1: Seasonal anime guide for the current season; list only titles, dates, and platforms verified from official sources.
- Week 2: One official trailer announcement with a concise explanation of confirmed details.
- Week 3: A cast, staff, or release-date announcement, based on an official source.
- Week 4: An evergreen beginner guide to finding official trailers and legal streaming options.

Aim for one useful, well-sourced article each week rather than thin daily posts. Do not invent breaking news or use images/video without permission.

## Technical SEO checklist
- Keep one canonical URL per page, all on the Worker domain.
- Keep the sitemap and robots.txt on the same primary domain.
- Ensure all indexable pages are linked by ordinary crawlable <a href> links.
- Keep a unique title, description, and visible H1 for each page.
- Check mobile rendering, HTTP status, and Google URL Inspection after deployments.
- The current known sitemap contains four pages. Update it only when a new, live page is actually published.
- Recheck the live site after deployment: GitHub commits do not prove that Cloudflare Worker, GitHub Pages, and Render have all deployed the same revision.

## Next reporting loop
Every 2–4 weeks, review Search Console impressions, clicks, CTR, average position, and queries. Improve pages with impressions but low CTR; add content only where it answers a real user question.
