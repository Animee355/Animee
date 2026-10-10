#!/usr/bin/env python3
"""Refresh Animee's shared news index from public RSS feeds."""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "anime-news.json"
FEEDS = [
    ("Crunchyroll News", "https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss"),
    ("Anime News Network", "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us"),
    ("MyAnimeList News", "https://myanimelist.net/rss/news.xml"),
]
MAX_ITEMS = 60
NS = {"atom": "http://www.w3.org/2005/Atom", "content": "http://purl.org/rss/1.0/modules/content/", "dc": "http://purl.org/dc/elements/1.1/"}

def text_of(parent, paths):
    for path in paths:
        node = parent.find(path, NS)
        if node is not None:
            if node.text and node.text.strip():
                return node.text.strip()
            href = node.attrib.get("href")
            if href:
                return href.strip()
    return ""

def parse_date(value):
    if not value:
        return ""
    try:
        result = parsedate_to_datetime(value)
        if result.tzinfo is None:
            result = result.replace(tzinfo=timezone.utc)
        return result.astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if result.tzinfo is None:
            result = result.replace(tzinfo=timezone.utc)
        return result.astimezone(timezone.utc).isoformat()
    except Exception:
        return ""

def plain_summary(value):
    value = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", value or "", flags=re.I | re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    return re.sub(r"\s+", " ", value).strip()[:260]

def categorize(title, summary):
    text = (title + " " + summary).lower()
    announcement = ("announces", "announcement", "announced", "reveals", "revealed", "confirms", "confirmed", "official", "release date", "premiere date", "new trailer", "new season", "season 2", "season 3", "season 4", "broadcast date", "air date")
    creator = ("interview", "mangaka", "creator", "director", "voice actor", "voice actress", "animator", "animation studio", "studio ", "author", "illustrator", "staff", "producer", "composer", "artist", "industry")
    if any(term in text for term in announcement):
        return "announcement", "Announcements & releases"
    if any(term in text for term in creator):
        return "creator", "Creators & industry"
    return "all", "Latest anime news"

def parse_feed(source, url):
    request = urllib.request.Request(url, headers={"User-Agent": "AnimeeNewsBot/1.0 (+https://animee355.github.io/Animee/)", "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with urllib.request.urlopen(request, timeout=25) as response:
        raw = response.read(4_000_000)
    root = ET.fromstring(raw)
    entries = root.findall(".//item") or root.findall(".//atom:entry", NS)
    found = []
    for entry in entries:
        title = text_of(entry, ["title", "atom:title"])
        link = text_of(entry, ["link", "atom:link"])
        if not link:
            for child in entry.findall("atom:link", NS):
                if child.attrib.get("rel", "alternate") == "alternate":
                    link = child.attrib.get("href", "")
                    if link:
                        break
        summary = text_of(entry, ["description", "summary", "content:encoded", "content", "atom:content"])
        published = text_of(entry, ["pubDate", "published", "updated", "dc:date", "atom:published", "atom:updated"])
        author = text_of(entry, ["author", "dc:creator", "atom:author/atom:name"])
        if not title or not link or not link.startswith(("https://", "http://")):
            continue
        summary = plain_summary(summary)
        category, label = categorize(title, summary)
        found.append({
            "title": plain_summary(title)[:220],
            "url": link,
            "source": source,
            "published": parse_date(published),
            "summary": summary,
            "author": plain_summary(author)[:100],
            "category": category,
            "category_label": label,
        })
    return found

def main():
    all_items = []
    success_count = 0
    errors = []
    for source, url in FEEDS:
        try:
            feed_items = parse_feed(source, url)
            if feed_items:
                success_count += 1
                all_items.extend(feed_items)
            else:
                errors.append(source + ": feed returned no parseable stories")
        except Exception as exc:
            errors.append(source + ": " + str(exc))
    if success_count == 0:
        print("No RSS feeds could be refreshed; preserving existing JSON. " + "; ".join(errors), file=sys.stderr)
        return 1

    now = datetime.now(timezone.utc)
    existing = []
    if OUTPUT.exists():
        try:
            existing = json.loads(OUTPUT.read_text(encoding="utf-8")).get("items", [])
        except Exception:
            existing = []
    for item in existing:
        date = parse_date(item.get("published", ""))
        if not date:
            continue
        try:
            if datetime.fromisoformat(date.replace("Z", "+00:00")) >= now - timedelta(days=14):
                all_items.append(item)
        except Exception:
            pass

    # Sort newest-first before deduplication so the freshest publisher entry wins.
    def sort_key(item):
        try:
            date = parse_date(item.get("published", ""))
            return datetime.fromisoformat(date.replace("Z", "+00:00")).timestamp() if date else 0
        except Exception:
            return 0

    def canonical_url(value):
        from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
        try:
            parts = urlsplit((value or "").strip())
            if parts.scheme not in ("http", "https") or not parts.netloc:
                return ""
            tracking = {"fbclid", "gclid", "mc_cid", "mc_eid"}
            query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
                     if not (k.lower().startswith("utm_") or k.lower() in tracking)]
            path = parts.path.rstrip("/") or "/"
            return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, urlencode(query), ""))
        except Exception:
            return ""

    def normalized_title(value):
        value = unescape(str(value or "")).lower()
        value = re.sub(r"\b(official|breaking|exclusive|watch|video)\b", " ", value)
        return re.sub(r"[^a-z0-9]+", " ", value).strip()

    from difflib import SequenceMatcher
    unique = []
    seen_urls = set()
    seen_titles = []
    for item in sorted(all_items, key=sort_key, reverse=True):
        url = canonical_url(item.get("url", ""))
        title = normalized_title(item.get("title", ""))
        if not url or not title or url in seen_urls:
            continue
        # Exact/near-exact headline matching across publishers avoids repeated stories.
        duplicate = False
        for previous_title in seen_titles:
            if title == previous_title or (min(len(title), len(previous_title)) >= 28 and
                    SequenceMatcher(None, title, previous_title).ratio() >= 0.88):
                duplicate = True
                break
        if duplicate:
            continue
        seen_urls.add(url)
        seen_titles.append(title)
        unique.append(item)
        if len(unique) >= MAX_ITEMS:
            break
    items = unique
    result = {"checked_at": now.isoformat(), "items": items, "sources": [source for source, _ in FEEDS if any(item.get("source") == source for item in items)]}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(items)} unique stories from {success_count} working feed(s).")
    if errors:
        print("Some sources were unavailable: " + "; ".join(errors))
    return 0

if __name__ == "__main__":
    sys.exit(main())
