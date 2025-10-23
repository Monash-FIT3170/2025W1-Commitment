#!/usr/bin/env python3
import re
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]  # points to docs/
MKDOCS = ROOT / "mkdocs.yml"
RELEASES_DIR = ROOT / "docs" / "releases"

START = re.compile(r"^[ \t]*# BEGIN AUTO-RELEASES[ \t]*$", re.M)
END   = re.compile(r"^[ \t]*# END AUTO-RELEASES[ \t]*$", re.M)

def main() -> int:
    if not MKDOCS.exists() or not RELEASES_DIR.exists():
        print("Run from docs/ and generate releases first.", file=sys.stderr); return 1

    yml = MKDOCS.read_text(encoding="utf-8")
    ms, me = START.search(yml), END.search(yml)
    if not ms or not me or me.start() < ms.end():
        print("Missing markers in mkdocs.yml under nav -> Releases.", file=sys.stderr); return 1

    pages = [p for p in RELEASES_DIR.glob("*.md") if p.name != "index.md"]
    pages = sorted(pages, key=lambda p: p.stem, reverse=True)

    lines = ["      - All releases: releases/index.md", *[f"      - {p.stem}: releases/{p.name}" for p in pages]]
    yml_new = yml[:ms.end()] + "\n" + "\n".join(lines) + "\n" + yml[me.start():]
    MKDOCS.write_text(yml_new, encoding="utf-8")
    print(f"Injected {len(pages)} release pages into nav")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
