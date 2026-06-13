from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard-demo.html"


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    js = (ROOT / "app.js").read_text(encoding="utf-8")
    data = (ROOT / "data" / "dashboard-data.json").read_text(encoding="utf-8")

    html = html.replace('<link rel="stylesheet" href="./styles.css" />', f"<style>\n{css}\n</style>")
    html = html.replace(
        '<script src="./app.js" type="module"></script>',
        f"<script>\nwindow.DASHBOARD_DATA = {data};\n</script>\n<script type=\"module\">\n{js}\n</script>",
    )
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
