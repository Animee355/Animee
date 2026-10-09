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

    unique = {}
    for item in all_items:
        link = item.get("url", "").strip()
        if not link:
            continue
        unique.setdefault(link, item)
    def sort_key(item):
        try:
            return datetime.fromisoformat(item.get("published", "").replace("Z", "+00:00")).timestamp()
        except Exception:
            return 0
    items = sorted(unique.values(), key=sort_key, reverse=True)[:MAX_ITEMS]
    result = {"checked_at": now.isoformat(), "items": items, "sources": [source for source, _ in FEEDS if any(item.get("source") == source for item in items)]}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(items)} unique stories from {success_count} working feed(s).")
    if errors:
        print("Some sources were unavailable: " + "; ".join(errors))
    return 0

if __name__ == "__main__":
    sys.exit(main())
