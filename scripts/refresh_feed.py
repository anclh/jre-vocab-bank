#!/usr/bin/env python3
"""Fetch GIA English RSS, match lexicon, write docs/data/feed.json (+ cache).

Usage (from repo root):
  python3 scripts/refresh_feed.py

Also syncs lexicon.json and programmes.json into docs/data/ for GitHub Pages.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import serve  # noqa: E402

DOCS_DATA = ROOT / "docs" / "data"
CACHE_FILE = serve.CACHE_FILE


def sync_seed_to_docs() -> None:
    DOCS_DATA.mkdir(parents=True, exist_ok=True)
    for name in ("lexicon.json", "programmes.json"):
        src = serve.DATA / name
        dst = DOCS_DATA / name
        shutil.copy2(src, dst)
        print(f"Synced {dst.relative_to(ROOT)}")


def main() -> int:
    serve.load_seed()
    serve.CACHE.mkdir(parents=True, exist_ok=True)
    DOCS_DATA.mkdir(parents=True, exist_ok=True)

    sync_seed_to_docs()

    print(f"Fetching {serve.RSS_URL} …")
    payload = serve.fetch_rss(force=True)

    out = DOCS_DATA / "feed.json"
    # Pages snapshot should not claim "live API cache"
    snapshot = dict(payload)
    snapshot["cached"] = True
    if not snapshot.get("ok") and not snapshot.get("items"):
        print(f"ERROR: fetch failed: {snapshot.get('error')}", file=sys.stderr)
        # Still write whatever we have if disk cache was returned
        if not snapshot.get("items"):
            return 1

    out.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {out.relative_to(ROOT)} "
        f"({snapshot.get('itemCount', 0)} items, {snapshot.get('matchCount', 0)} matches)"
    )
    if CACHE_FILE.exists():
        print(f"Cache also at {CACHE_FILE.relative_to(ROOT)}")
    if snapshot.get("error"):
        print(f"Note: {snapshot['error']}")
    return 0 if snapshot.get("items") else 1


if __name__ == "__main__":
    raise SystemExit(main())
