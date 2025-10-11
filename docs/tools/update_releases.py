#!/usr/bin/env python3
import os, json, re, urllib.request, yaml
from datetime import datetime
from typing import Any, Dict, List, Tuple, Optional

REPO = os.environ.get("GH_REPO", "Monash-FIT3170/2025W1-Commitment")
YAML_PATH = os.environ.get("GG_YAML_PATH", "docs/data/releases.yml")
API = f"https://api.github.com/repos/{REPO}/releases"

PLAT = {
    "mac":   re.compile(r"\.(dmg|pkg|tar\.gz)$", re.I),
    "win":   re.compile(r"\.(exe|msi)$", re.I),
    "linux": re.compile(r"\.(appimage|deb|rpm)$", re.I),
}
CHK = re.compile(r"(?P<sha>[A-Fa-f0-9]{64})")

def _get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "gitgauge-updater"})
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
    chk_assets = [a for a in assets if re.search(r"(sha256|checksum|\.sha256|\.txt)$", a.get("name",""), re.I)]
    for a in assets:
        name = a.get("name", "")
        url = a.get("browser_download_url", "")
        for key, rx in PLAT.items():
            if rx.search(name):
                checksum = ""
                rel = next((c for c in chk_assets if name.split(".")[0] in c.get("name","")), None)
                if rel:
                    sha = _parse_sha256(_text(rel["browser_download_url"]))
                    if sha:
                        checksum = f"sha256:{sha}"
                label = {
                    "mac":   "macOS",
                    "win":   "Windows (x64)",
                    "linux": "Linux",
                }[key]
                out[key].append({"label": label + f" — {name}", "url": url, "checksum": checksum})
                break
    return out

def _latest_release(rels: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    for r in rels:
        if not r.get("draft") and not r.get("prerelease"):
            return r
    return None

def main() -> int:
    rels = _json(API)
    if not isinstance(rels, list) or not rels:
        print("No releases found")
        return 1
    latest = _latest_release(rels)
    if not latest:
        print("No published release found")
        return 1

    tag = latest.get("tag_name", "")
    date = (latest.get("published_at","")[:10]) or datetime.utcnow().strftime("%Y-%m-%d")
    notes_url = latest.get("html_url") or f"https://github.com/{REPO}/releases/tag/{tag}"
    assets = latest.get("assets", [])
    downloads = _pick_assets(assets)

    os.makedirs(os.path.dirname(YAML_PATH), exist_ok=True)
    existing = {}
    if os.path.exists(YAML_PATH):
        with open(YAML_PATH, "r", encoding="utf-8") as f:
            existing = yaml.safe_load(f) or {}

    prev = existing.get("previous") or []
    cur_latest = existing.get("latest") or {}

    if cur_latest.get("version") and cur_latest.get("version") != tag:
        prev_entry = {
            "version": cur_latest.get("version"),
            "date": cur_latest.get("date", ""),
            "downloads": cur_latest.get("downloads") or {},
            "notes_url": cur_latest.get("notes_url", ""),
        }
        prev = [p for p in prev if p.get("version") != prev_entry["version"]]
        prev.insert(0, prev_entry)

    new_doc = {
        "latest": {
            "version": tag,
            "date": date,
            "notes_url": notes_url,
            "downloads": downloads,
        },
        "previous": prev,
    }

    with open(YAML_PATH, "w", encoding="utf-8") as f:
        yaml.safe_dump(new_doc, f, sort_keys=False, allow_unicode=True)

    print(f"Updated {YAML_PATH} -> {tag}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
