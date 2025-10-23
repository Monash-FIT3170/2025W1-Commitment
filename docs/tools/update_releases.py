#!/usr/bin/env python3
import os
import json
import re
import urllib.request
import yaml
import hashlib
from typing import Any, Dict, List, Optional, Tuple

REPO = os.environ.get("GH_REPO", "Monash-FIT3170/2025W1-Commitment")
YAML_PATH = os.environ.get("GG_YAML_PATH", "docs/data/releases.yml")
API_ROOT = f"https://api.github.com/repos/{REPO}/releases"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
COMPUTE_SHA = os.environ.get("GG_COMPUTE_SHA", "0").lower() in ("1", "true", "yes")

# platform file patterns
PLAT = {
    "mac":   re.compile(r"\.(dmg|pkg|tar\.gz)$", re.I),
    "win":   re.compile(r"\.(exe|msi)$", re.I),
    "linux": re.compile(r"\.(appimage|deb|rpm)$", re.I),
}
# detect a 64-hex SHA
RE_SHA = re.compile(r"(?P<sha>[A-Fa-f0-9]{64})")
# checksum asset name patterns
RE_CHK_NAME = re.compile(r"(sha256|checksum)(\.txt)?$|\.sha256(\.txt)?$", re.I)

def _headers() -> Dict[str, str]:
    h = {"User-Agent": "gitgauge-updater"}
    if GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return h

def _request(url: str) -> Tuple[bytes, Dict[str, str]]:
    req = urllib.request.Request(url, headers=_headers())
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read(), {k.lower(): v for k, v in r.headers.items()}

def _json(url: str) -> Any:
    body, _ = _request(url)
    return json.loads(body.decode("utf-8"))

def _text(url: str) -> str:
    body, _ = _request(url)
    return body.decode("utf-8", "replace")

def _parse_link_header(link_header: str) -> Dict[str, str]:
    out: Dict[str, str] = {}
    if not link_header:
        return out
    for part in link_header.split(","):
        m = re.search(r'<([^>]+)>\s*;\s*rel="([^"]+)"', part)
        if m:
            out[m.group(2)] = m.group(1)
    return out

def _fetch_all_releases() -> List[Dict[str, Any]]:
    url = f"{API_ROOT}?per_page=100"
    all_rels: List[Dict[str, Any]] = []
    while url:
        body, headers = _request(url)
        page = json.loads(body.decode("utf-8"))
        if isinstance(page, list):
            all_rels.extend(page)
        url = _parse_link_header(headers.get("link", "")).get("next")
    return all_rels

def _parse_sha256(s: str) -> Optional[str]:
    m = RE_SHA.search(s or "")
    return m.group("sha").lower() if m else None

def _compute_sha256(url: str) -> Optional[str]:
    if not COMPUTE_SHA:
        return None
    h = hashlib.sha256()
    req = urllib.request.Request(url, headers=_headers())
    with urllib.request.urlopen(req, timeout=300) as r:
        while True:
            chunk = r.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def _pick_assets(assets: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, str]]]:
    out = {"mac": [], "win": [], "linux": []}
    chk_assets = [a for a in assets if RE_CHK_NAME.search(a.get("name", ""))]

    def checksum_for(bin_name: str, bin_url: str) -> str:
        for c in chk_assets:
            cname = c.get("name", "")
            if cname.startswith(bin_name) or bin_name in cname:
                txt = _text(c["browser_download_url"])
                sha = _parse_sha256(txt)
                if sha:
                    return f"sha256:{sha}"
        sha = _compute_sha256(bin_url)
        return f"sha256:{sha}" if sha else ""

    for a in assets:
        name = a.get("name", "")
        url = a.get("browser_download_url", "")
        for key, rx in PLAT.items():
            if rx.search(name):
                label = {"mac": "macOS", "win": "Windows (x64)", "linux": "Linux"}[key]
                out[key].append({
                    "label": f"{label} — {name}",
                    "url": url,
                    "checksum": checksum_for(name, url)
                })
                break
    return out

def _latest_draft(rels: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    drafts = [r for r in rels if r.get("draft")]
    if drafts:
        drafts.sort(key=lambda r: r.get("updated_at") or r.get("created_at") or "", reverse=True)
        return drafts[0]
    published = [r for r in rels if not r.get("draft")]
    if not published:
        return None
    published.sort(key=lambda r: r.get("published_at") or r.get("created_at") or "", reverse=True)
    return published[0]

def _row(r: Dict[str, Any]) -> Dict[str, Any]:
    tag = r.get("tag_name", "")
    date = (r.get("published_at") or r.get("updated_at") or r.get("created_at") or "")[:10]
    draft = bool(r.get("draft"))
    notes = f"https://github.com/{REPO}/releases" if draft else (r.get("html_url") or f"https://github.com/{REPO}/releases/tag/{tag}")
    return {"version": tag, "date": date, "notes_url": notes, "downloads": _pick_assets(r.get("assets", [])), "draft": draft}

def main() -> int:
    rels = _fetch_all_releases()
    if not rels:
        print("No releases found"); return 1

    latest = _latest_draft(rels)
    if not latest:
        print("No usable releases"); return 1

    latest_row = _row(latest)
    previous = [_row(r) for r in rels if r is not latest]

    # duplicate by version and sort newest first
    by_ver: Dict[str, Dict[str, Any]] = {p["version"]: p for p in previous}
    previous = sorted(by_ver.values(), key=lambda x: (x.get("date") or "", x.get("version") or ""), reverse=True)

    os.makedirs(os.path.dirname(YAML_PATH), exist_ok=True)
    with open(YAML_PATH, "w", encoding="utf-8") as f:
        yaml.safe_dump({"latest": latest_row, "previous": previous}, f, sort_keys=False, allow_unicode=True)

    print(f"Wrote {1+len(previous)} releases; latest={latest_row['version']} (draft={latest_row['draft']})")
    if latest_row["draft"] and not GITHUB_TOKEN:
        print("Note: drafts need GITHUB_TOKEN in CI.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
