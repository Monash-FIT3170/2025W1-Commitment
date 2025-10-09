import pathlib, yaml, sys

def _as_list(x):
    if not x:
        return []
    if isinstance(x, list):
        return x
    if isinstance(x, dict):
        return [x]
    return []

def define_env(env):
    root = pathlib.Path(env.project_dir)
    ypath = root / "data" / "releases.yml"

    release = {"version": "", "date": "", "notes_url": ""}
    downloads = {"mac": [], "win": [], "linux": []}
    previous = []

    try:
        data = yaml.safe_load(ypath.read_text(encoding="utf-8"))
        latest = data.get("latest") or {}
        release = {
            "version": str(latest.get("version", "")),
            "date": str(latest.get("date", "")),
            "notes_url": str(latest.get("notes_url", "")),
        }
        dl = latest.get("downloads") or {}
        downloads = {
            "mac": _as_list(dl.get("mac")),
            "win": _as_list(dl.get("win")),
            "linux": _as_list(dl.get("linux")),
        }
        previous = data.get("previous") or []
        print(f"[macros] releases loaded from {ypath}", file=sys.stderr)
    except Exception as e:
        print(f"[macros] failed to load {ypath}: {e}", file=sys.stderr)

    env.variables["release"] = release
    env.variables["downloads"] = downloads
    env.variables["previous_releases"] = previous
