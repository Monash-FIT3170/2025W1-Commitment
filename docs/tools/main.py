import pathlib
import yaml

def define_env(env):
    root = pathlib.Path(env.project_dir)
    data_path = root / "docs" / "data" / "releases.yml"
    data = {}
    if data_path.exists():
        data = yaml.safe_load(data_path.read_text(encoding="utf-8"))
    else: {}
    latest = data.get("latest") or {}
    env.variables["release"] = {
        "version": latest.get("version", ""),
        "date": latest.get("date", ""),
        "notes_url": latest.get("notes_url", "#"),
        "draft": latest.get("draft", False),
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

    def render_platform(title, version, date, notes_url, items):
        rows = []
        if items:
            for it in items:
                dl = f'<a href="{it.get("url","#")}">{it.get("label","Download")}</a>'
                ch = it.get("checksum","")
                if ch:
                    dl += f"<br><code>{ch}</code>"
                note = f'<a href="{notes_url}">Notes</a>' if notes_url else ""
                rows.append(f"<tr><td>{version}</td><td>{date}</td><td>{dl}</td><td>{note}</td></tr>")
        else:
            rows.append('<tr><td colspan="4"></td></tr>')
        return (
            f'### {title}\n\n'
            '<div class="md-typeset__table">\n<table>\n<thead>'
            '<tr><th>Version</th><th>Date</th><th>Download</th><th>Notes</th></tr>'
            '</thead>\n<tbody>\n' + "\n".join(rows) + '\n</tbody>\n</table>\n</div>\n'
        )

    env.macro(render_platform)
