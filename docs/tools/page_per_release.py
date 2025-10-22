#!/usr/bin/env python3
import os
import pathlib
import yaml
from typing import Dict, Any, List

ROOT = pathlib.Path(__file__).resolve().parents[1]   # .../docs
DATA = ROOT / "docs"/ "data" / "releases.yml"
OUT  = ROOT / "docs" / "releases"

def _s(x: str) -> str:
    return x or ""

def _rows_for_version(v: Dict[str, Any]) -> List[str]:
    ver  = _s(v.get("version",""))
    date = _s(v.get("date",""))
    notes = _s(v.get("notes_url",""))
    dl = v.get("downloads", {}) or {}
    rows: List[str] = []

    def add(platform: str, items: List[Dict[str,str]]):
        if not items:
            return
        first = items[0]
        label = _s(first.get("label","Download"))
        url   = _s(first.get("url","#"))
        notes_link = f"[Notes]({notes})" if notes else ""
        rows.append(f"| {ver} | {date} | {platform} | [{label}]({url}) | {notes_link} |")

    add("macOS",   dl.get("mac") or [])
    add("Windows", dl.get("win") or [])
    add("Linux",   dl.get("linux") or [])

    if rows:
        rows.append("|  |  |  |  |  |")  # spacer row between versions
    return rows

def _platform_block(name: str, items: List[Dict[str, str]]) -> str:
    if not items: return ""
    lines = [f"### {name}", ""]
    for it in items:
        label = _s(it.get("label","Download"))
        url   = _s(it.get("url","#"))
        chk   = _s(it.get("checksum","")).strip()
        tail  = f" — `{chk}`" if chk else ""
        lines.append(f"- **{label}** — [Download]({url}){tail}")
    lines.append("")
    return "\n".join(lines)

def _page_for_version(v: Dict[str, Any]) -> str:
    ver  = _s(v.get("version",""))
    date = _s(v.get("date",""))
    draft = bool(v.get("draft", False))
    notes = _s(v.get("notes_url","#"))
    dl = v.get("downloads", {}) or {}
    parts = [
        f"# {ver}",
        "",
        f"**Release date:** {date}{' _(draft)_' if draft else ''}",
        "",
        f"[View on GitHub]({notes})" if notes else "",
        "",
        _platform_block("macOS",   dl.get("mac") or []),
        _platform_block("Windows", dl.get("win") or []),
        _platform_block("Linux",   dl.get("linux") or []),
        "---",
        "[Back to Releases](./index.md)",
        "",
    ]
    return "\n".join([p for p in parts if p is not None])

def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    data = yaml.safe_load(DATA.read_text(encoding="utf-8")) or {}
    latest   = data.get("latest")   or {}
    previous = data.get("previous") or []

    versions: List[Dict[str, Any]] = []
    if latest: versions.append(latest)
    versions.extend(previous)

    lines: List[str] = [
        "# Releases",
        "",
        "| Version | Date | Platform | Download | Notes |",
        "|---|---|---|---|---|",
    ]
    for v in versions:
        lines.extend(_rows_for_version(v))
    lines.append("")
    lines.append("> Looking for the latest only? See the [Home](../index.md) page.")
    OUT.joinpath("index.md").write_text("\n".join(lines), encoding="utf-8")

    for v in versions:
        name = v.get("version","")
        if not name: continue
        OUT.joinpath(f"{name}.md").write_text(_page_for_version(v), encoding="utf-8")

    print(f"Wrote {len(versions)} pages + index")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
