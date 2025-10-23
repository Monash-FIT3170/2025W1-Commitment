#!/usr/bin/env python3
import os
import pathlib
import yaml
from typing import Dict, Any, List

ROOT = pathlib.Path(__file__).resolve().parents[1]   # .../docs
DATA = ROOT / "docs"/ "data" / "releases.yml"
OUT  = ROOT / "docs" / "releases"

PLAT_TITLES = [("mac", "macOS"), ("win", "Windows"), ("linux", "Linux")]

def _s(x: str) -> str:
    return x or ""

def _mk_row(version: str, date: str, label: str, url: str, notes_url: str, checksum: str) -> str:
    dl = f"[{label}]({url})"
    if checksum:
        dl += f" — `{checksum.strip()}`"
    notes = f"[Notes]({notes_url})" if notes_url else ""
    return f"| {version} | {date} | {dl} | {notes} |"

def _rows_for_platform(vlist: List[Dict[str, Any]], key: str, add_spacers: bool) -> List[str]:
    rows: List[str] = []
    for v in vlist:
        ver, date, notes = _s(v.get("version","")), _s(v.get("date","")), _s(v.get("notes_url",""))
        items = (v.get("downloads", {}) or {}).get(key) or []
        for it in items:
            rows.append(_mk_row(ver, date, _s(it.get("label","Download")), _s(it.get("url","#")), notes, _s(it.get("checksum",""))))
        if add_spacers and items:
            rows.append("|  |  |  |  |")
    return rows

def _table(title: str, rows: List[str]) -> str:
    if not rows:
        return ""
    return "\n" \
           "## " + title + "\n\n" + \
           "| Version | Date | Download | Notes |\n" + \
           "|---|---|---|---|\n" + \
           "\n".join(rows) + "\n\n"

def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    data = yaml.safe_load(DATA.read_text(encoding="utf-8")) or {}
    latest = data.get("latest") or {}
    previous = data.get("previous") or []

    prev_filtered = [p for p in previous if (p.get("version") or "") != (latest.get("version") or "")]
    versions_for_index: List[Dict[str, Any]] = ([latest] if latest else []) + prev_filtered
    versions_for_pages: List[Dict[str, Any]] = ([latest] if latest else []) + previous

    parts: List[str] = ["# Releases", ""]
    for key, title in PLAT_TITLES:
        parts.append(_table(title, _rows_for_platform(versions_for_index, key, add_spacers=True)))
    parts.append("> Looking for the latest only? See the [Home](../index.md) page.")
    (OUT / "index.md").write_text("\n".join([p for p in parts if p]), encoding="utf-8")

    for v in versions_for_pages:
        ver = v.get("version","")
        if not ver:
            continue
        body: List[str] = [
            f"# Version: {ver}", "",
            f"**Release date:** {_s(v.get('date',''))}{' _(draft)_' if v.get('draft') else ''}", ""
        ]
        for key, title in PLAT_TITLES:
            rows = _rows_for_platform([v], key, add_spacers=False)
            if rows:
                body.append(_table(title, rows))
        body.append("[Back to Releases](./index.md)")
        (OUT / f"{ver}.md").write_text("\n".join(body), encoding="utf-8")

    print(f"Wrote {len(versions_for_pages)} pages + index into {OUT}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())