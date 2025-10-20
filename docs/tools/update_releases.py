#!/usr/bin/env python3

import os
import json
import re
import urllib.request
import yaml
from datetime import datetime
from typing import Any, Dict, List, Optional


REPO = os.environ.get("GH_REPO", "Monash-FIT3170/2025W1-Commitment")
YAML_PATH = os.environ.get("GG_YAML_PATH", "docs/data/releases.yml")
API = f"https://api.github.com/repos/{REPO}/releases"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")

PLAT = {
    "mac":   re.compile(r"\.(dmg|pkg|tar\.gz)$", re.I),
    "win":   re.compile(r"\.(exe|msi)$", re.I),
    "linux": re.compile(r"\.(appimage|deb|rpm)$", re.I),
}

CHK = re.compile(r"(?P<sha>[A-Fa-f0-9]{64})")

def _headers() -> Dict[str, str]:
    h = {"User-Agent": "gitgauge-updater"}
    if GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return h

def _get(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers=_headers())

    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def _json(url: str) -> Any:
    return json.loads(_get(url).decode("utf-8"))


def _text(url: str) -> str:
    return _get(url).decode("utf-8", "replace")


def _parse_sha256(s: str) -> Optional[str]:
    m = CHK.search(s or "")
    return m.group("sha").lower() if m else None


def _pick_assets(assets: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, str]]]:
    out = {"mac": [], "win": [], "linux": []}

    chk_assets = [a for a in assets if re.search(
        r"(sha256|checksum|\.sha256|\.txt)$", a.get("name", ""), re.I)]

    for a in assets:
        name = a.get("name", "")
        url = a.get("browser_download_url", "")

        for key, rx in PLAT.items():
            if rx.search(name):
                checksum = ""
                rel = next((c for c in chk_assets if name.split(
                    ".")[0] in c.get("name", "")), None)

                if rel:
                    sha = _parse_sha256(_text(rel["browser_download_url"]))

                    if sha:
                        checksum = f"sha256:{sha}"

                label = {
                    "mac":   "macOS",
                    "win":   "Windows (x64)",
                    "linux": "Linux",
                }[key]

                out[key].append({
                    "label": label + f" — {name}",
                    "url": url, "checksum": checksum
                })

                break
    return out


def _latest_release(rels: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    drafts = [r for r in rels if r.get("draft")]
    if drafts:
        drafts.sort(key=lambda r: r.get("updated_at") or r.get("created_at") or "", reverse=True)
        return drafts[0]
    published = [r for r in rels if not r.get("draft")]
    if not published:
        return None
    published.sort(key=lambda r: r.get("published_at") or r.get("created_at") or "", reverse=True)
    return published[0]

def _version_table(r: Dict[str, Any]) -> Dict[str, Any]:
    tag = r.get("tag_name", "")
    date = (r.get("published_at") or r.get("updated_at") or r.get("created_at") or "")[:10]
    is_draft = bool(r.get("draft"))
    notes_url = f"https://github.com/{REPO}/releases" if is_draft else (r.get("html_url") or f"https://github.com/{REPO}/releases/tag/{tag}")
    return {
        "version": tag,
        "date": date,
        "notes_url": notes_url,
        "downloads": _pick_assets(r.get("assets", [])),
        "draft": is_draft,
    }


def main() -> int:
    rels = _json(API)

    if not isinstance(rels, list) or not rels:
        print("No releases found")
        return 1

    latest = _latest_release(rels)

    if not latest:
        print("No published release found")
        return 1
    
    # Build full list: latest + all others into previous
    latest = _version_table(latest)
    previous: List[Dict[str, Any]] = []
    for r in rels:
        if r is latest:
            continue
        previous.append(_version_table(r))
    
    dedup = {}
    for p in previous:
        dedup[p["version"]] = p
    previous = list(dedup.values())
    previous.sort(key=lambda x: (x.get("date") or "", x.get("version") or ""), reverse=True)


    os.makedirs(os.path.dirname(YAML_PATH), exist_ok=True)
    doc = {"latest": latest, "previous": previous}
    with open(YAML_PATH, "w", encoding="utf-8") as f:
        yaml.safe_dump(doc, f, sort_keys=False, allow_unicode=True)

    print(f"Updated {YAML_PATH} with {1+len(previous)} releases; latest={latest['version']} (draft={latest['draft']})")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
