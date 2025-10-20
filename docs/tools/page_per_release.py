#!/usr/bin/env python3
import os
import pathlib
import yaml
from typing import Dict, Any, List

ROOT = pathlib.Path(__file__).resolve().parents[1]   # points to docs/
DATA = ROOT / "data" / "releases.yml"
OUT  = ROOT / "docs" / "releases" 

def _s(x: str) -> str:
    return x or ""

def _first(items: List[Dict[str, str]]) -> str:
    if not items: return ""
    label = _s(items[0].get("label", "Download"))
    url   = _s(items[0].get("url", "#"))
    return f"[{label}]({url})"

def _row(ver: Dict[str, Any]) -> str:
    v  = _s(ver.get("version", ""))
    d  = _s(ver.get("date", ""))
    dl = ver.get("downloads", {}) or {}
    mac = _first(dl.get("mac") or [])
    win = _first(dl.get("win") or [])
    lin = _first(dl.get("linux") or [])
    notes = _s(ver.get("notes_url", ""))
    notes_link = f"[Notes]({notes})" if notes else ""
    return f"| [{v}](./{v}.md) | {d} | {mac} | {win} | {lin} | {notes_link} |"

def _platform_block(name: str, items: List[Dict[str, str]]) -> str:
    if not items: return ""
    lines = [f"### {name}", ""]
    for it in items:
        label = _s(it.get("label", "Download"))
        url   = _s(it.get("url", "#"))
        chk   = _s(it.get("checksum", "")).strip()
        tail  = f" — `{chk}`" if chk else ""
        lines.append(f"- **{label}** — [Download]({url}){tail}")
    lines.append("")
    return "\n".join(lines)

def _page(ver: Dict[str, Any]) -> str:
    v  = _s(ver.get("version",""))
    d  = _s(ver.get("date",""))
    dr = bool(ver.get("draft", False))
    notes = _s(ver.get("notes_url","#"))
    dl = ver.get("downloads", {}) or {}
    parts = [
        f"# {v}",
        "",
        f"**Release date:** {d}{' _(draft)_' if dr else ''}",
        "",
        f"[View on GitHub]({notes})" if notes else "",
        "",
        _platform_block("macOS",  dl.get("mac")  or []),
        _platform_block("Windows",dl.get("win")  or []),
        _platform_block("Linux",  dl.get("linux")or []),
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

    # Releases index table 
    lines = [
        "# Releases",
        "",
        "| Version | Date | macOS | Windows | Linux | Notes |",
        "|---|---|---|---|---|---|",
    ]
    for v in versions:
        lines.append(_row(v))
    lines.append("")
    lines.append("> Looking for the latest only? See the [Home](../index.md) page.")
    OUT.joinpath("index.md").write_text("\n".join(lines), encoding="utf-8")

    # One page per version
    for v in versions:
        name = v.get("version","")
        if not name:
            continue
        OUT.joinpath(f"{name}.md").write_text(_page(v), encoding="utf-8")

    print(f"Wrote {len(versions)} pages + index")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
