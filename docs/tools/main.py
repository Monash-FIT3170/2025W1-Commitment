import pathlib
import yaml


def define_env(env):
    root = pathlib.Path(env.project_dir)
    data_path = root / "docs" / "data" / "releases.yml"
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
