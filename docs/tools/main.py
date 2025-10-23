import pathlib
import yaml


def define_env(env):
    root = pathlib.Path(env.project_dir)
    data_path = root / "data" / "releases.yml"
    data = {}

    if data_path.exists():
        data = yaml.safe_load(data_path.read_text(encoding="utf-8")) or {}

    latest = data.get("latest") or {}

    # variables as index.md expects.
    env.variables["release"] = {
        "version": latest.get("version", ""),
        "date": latest.get("date", ""),
        "notes_url": latest.get("notes_url", "#"),
    }

    downloads = latest.get("downloads") or {}

    # Ensure platform keys exist and are lists
    env.variables["downloads"] = {
        "mac": downloads.get("mac") or [],
        "win": downloads.get("win") or [],
        "linux": downloads.get("linux") or [],
    }

    # Add reusable icon macros
    @env.macro
    def check_icon():
        return '<span style="display:inline-flex; align-items:center; gap:6px;"><img src="../../assets/icons/check.png" alt="Yes" width="20" height="20" /> <b> Yes </b> </span>'

    @env.macro
    def cross_icon():
        return '<span style="display:inline-flex; align-items:center; gap:6px;"><img src="../../assets/icons/cross.png" alt="No" width="20" height="20" /> <b> No </b> </span>'
