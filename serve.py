#!/usr/bin/env python3
"""JRE Vocab Bank — local static + RSS proxy server (stdlib only)."""

from __future__ import annotations

import html
import json
import os
import re
import threading
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
CACHE = ROOT / "cache"
STATIC = ROOT / "docs"
RSS_URL = "https://www.info.gov.hk/gia/rss/general_en.xml"
CACHE_FILE = CACHE / "last_feed.json"
USER_AGENT = "JRE-Vocab-Bank/1.0 (local study tool; +https://www.info.gov.hk)"
DEFAULT_PORT = 8765
CACHE_TTL_SEC = 15 * 60

_lock = threading.Lock()
_state: dict[str, Any] = {
    "lexicon": [],
    "programmes": {},
    "feed": None,
    "fetched_at": None,
    "error": None,
}


class _StripHTML(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self.parts)).strip()


def strip_html(raw: str) -> str:
    raw = html.unescape(raw or "")
    p = _StripHTML()
    try:
        p.feed(raw)
        p.close()
    except Exception:
        return re.sub(r"<[^>]+>", " ", raw)
    return p.text()


def load_seed() -> None:
    with open(DATA / "lexicon.json", encoding="utf-8") as f:
        _state["lexicon"] = json.load(f)
    with open(DATA / "programmes.json", encoding="utf-8") as f:
        _state["programmes"] = json.load(f)


def _word_boundary_pattern(term: str) -> re.Pattern[str]:
    # Prefer phrase / word-ish matches; allow hyphen and apostrophe inside terms.
    escaped = re.escape(term)
    # Soft boundaries: not a letter on either side
    return re.compile(rf"(?<![A-Za-z]){escaped}(?![A-Za-z])", re.IGNORECASE)


def build_matcher(lexicon: list[dict]) -> list[tuple[dict, re.Pattern[str]]]:
    # Longer terms first so "Greater Bay Area" wins over fragments.
    sorted_lex = sorted(lexicon, key=lambda x: len(x["term"]), reverse=True)
    return [(entry, _word_boundary_pattern(entry["term"])) for entry in sorted_lex]


def excerpt_around(text: str, match: re.Match[str], radius: int = 110) -> str:
    start = max(0, match.start() - radius)
    end = min(len(text), match.end() + radius)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = "…" + snippet
    if end < len(text):
        snippet = snippet + "…"
    return snippet


def parse_rss(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    items: list[dict] = []
    for it in root.findall(".//item"):
        title = strip_html(it.findtext("title") or "")
        link = (it.findtext("link") or it.findtext("guid") or "").strip()
        desc = strip_html(it.findtext("description") or "")
        pub = it.findtext("pubDate") or ""
        iso = None
        try:
            if pub:
                dt = parsedate_to_datetime(pub)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                iso = dt.isoformat()
        except Exception:
            iso = None
        items.append(
            {
                "title": title,
                "link": link,
                "description": desc,
                "pubDate": pub,
                "pubDateIso": iso,
            }
        )
    return items


def match_vocab(items: list[dict], lexicon: list[dict]) -> list[dict]:
    matchers = build_matcher(lexicon)
    used_terms: set[str] = set()
    results: list[dict] = []

    for item in items:
        hay = f"{item['title']} {item['description']}"
        for entry, pat in matchers:
            term_key = entry["term"].lower()
            m = pat.search(hay)
            if not m:
                continue
            # One card per term (first / best occurrence across feed)
            if term_key in used_terms:
                continue
            used_terms.add(term_key)
            example = excerpt_around(hay, m)
            results.append(
                {
                    "term": entry["term"],
                    "zh": entry.get("zh", ""),
                    "pos": entry.get("pos", ""),
                    "related": entry.get("related") or [],
                    "note": entry.get("note") or "",
                    "example": example,
                    "matchedSpan": m.group(0),
                    "source": {
                        "title": item["title"],
                        "link": item["link"],
                        "pubDate": item["pubDate"],
                        "pubDateIso": item.get("pubDateIso"),
                    },
                }
            )
    return results


def rarity_score(card: dict) -> float:
    """Higher = better 'today's pick' (longer / rarer-looking terms)."""
    t = card["term"]
    score = len(t) * 1.5
    if " " in t or "-" in t:
        score += 8
    # Penalize ultra-common short verbs a bit
    common = {
        "promote",
        "enhance",
        "implement",
        "strengthen",
        "facilitate",
        "scheme",
        "housing",
        "quota",
    }
    if t.lower() in common:
        score -= 12
    return score


def today_picks(cards: list[dict], items: list[dict], limit: int = 8) -> list[dict]:
    # Prefer matches whose source is "today" (HK calendar) when possible.
    today_hk = datetime.now().astimezone().date()  # box is Asia/Hong_Kong
    todays: list[dict] = []
    others: list[dict] = []
    for c in cards:
        iso = (c.get("source") or {}).get("pubDateIso")
        d = None
        if iso:
            try:
                d = datetime.fromisoformat(iso).astimezone().date()
            except Exception:
                d = None
        if d == today_hk:
            todays.append(c)
        else:
            others.append(c)
    pool = todays if todays else others
    ranked = sorted(pool, key=rarity_score, reverse=True)
    return ranked[:limit]


def build_payload(items: list[dict], lexicon: list[dict], meta: dict) -> dict:
    cards = match_vocab(items, lexicon)
    picks = today_picks(cards, items)
    return {
        "ok": True,
        "source": RSS_URL,
        "fetchedAt": meta.get("fetchedAt"),
        "cached": meta.get("cached", False),
        "itemCount": len(items),
        "matchCount": len(cards),
        "items": items,
        "matches": cards,
        "todaysPicks": picks,
        "lexiconSize": len(lexicon),
        "error": meta.get("error"),
    }


def fetch_rss(force: bool = False) -> dict:
    with _lock:
        now = time.time()
        if (
            not force
            and _state["feed"] is not None
            and _state["fetched_at"]
            and now - _state["fetched_at"] < CACHE_TTL_SEC
        ):
            payload = dict(_state["feed"])
            payload["cached"] = True
            return payload

        # Try disk cache if network fails
        disk: dict | None = None
        if CACHE_FILE.exists():
            try:
                disk = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            except Exception:
                disk = None

        try:
            req = urllib.request.Request(
                RSS_URL,
                headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml, text/xml, */*"},
            )
            with urllib.request.urlopen(req, timeout=25) as resp:
                xml_bytes = resp.read()
            items = parse_rss(xml_bytes)
            fetched_at_iso = datetime.now().astimezone().isoformat()
            payload = build_payload(
                items,
                _state["lexicon"],
                {"fetchedAt": fetched_at_iso, "cached": False, "error": None},
            )
            CACHE.mkdir(parents=True, exist_ok=True)
            CACHE_FILE.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            _state["feed"] = payload
            _state["fetched_at"] = now
            _state["error"] = None
            return payload
        except Exception as e:
            _state["error"] = str(e)
            if disk:
                disk = dict(disk)
                disk["cached"] = True
                disk["error"] = f"Live fetch failed ({e}); serving disk cache."
                _state["feed"] = disk
                _state["fetched_at"] = now
                return disk
            return {
                "ok": False,
                "source": RSS_URL,
                "fetchedAt": None,
                "cached": False,
                "itemCount": 0,
                "matchCount": 0,
                "items": [],
                "matches": [],
                "todaysPicks": [],
                "lexiconSize": len(_state["lexicon"]),
                "error": str(e),
            }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC), **kwargs)

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"[serve] {self.address_string()} {fmt % args}")

    def _send_json(self, obj: Any, status: int = 200) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            self.path = "/index.html"
            return super().do_GET()

        if path == "/api/health":
            return self._send_json(
                {
                    "ok": True,
                    "service": "jre-vocab-bank",
                    "rss": RSS_URL,
                    "lexiconSize": len(_state["lexicon"]),
                    "programmeCount": len((_state["programmes"] or {}).get("items") or []),
                    "hasCache": CACHE_FILE.exists(),
                    "time": datetime.now().astimezone().isoformat(),
                }
            )

        if path == "/api/feed":
            qs = parse_qs(parsed.query)
            force = qs.get("refresh", ["0"])[0] in ("1", "true", "yes")
            return self._send_json(fetch_rss(force=force))

        if path == "/api/lexicon":
            return self._send_json({"ok": True, "items": _state["lexicon"]})

        if path == "/api/programmes":
            return self._send_json({"ok": True, **_state["programmes"]})

        return super().do_GET()


def main() -> None:
    load_seed()
    CACHE.mkdir(parents=True, exist_ok=True)
    port = int(os.environ.get("PORT", DEFAULT_PORT))
    # Warm cache in background so first page load is fast
    threading.Thread(target=lambda: fetch_rss(force=True), daemon=True).start()
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"JRE Vocab Bank → http://127.0.0.1:{port}", flush=True)
    print(f"RSS source: {RSS_URL}", flush=True)
    print("Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
