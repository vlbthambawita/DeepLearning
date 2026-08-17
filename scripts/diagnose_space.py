#!/usr/bin/env python3
"""Report what is actually deployed on the Hugging Face Space.

Runs in CI, where the Hub token lives as a repository secret, and writes a
markdown report so the deployed state can be inspected without anyone handling
the token locally. Prints nothing sensitive: no token value, no headers.

    HF_TOKEN=... python3 scripts/diagnose_space.py diagnostics/space-report.md
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

from huggingface_hub import HfApi, hf_hub_download

REPO = "DeepLearning-VT/DeepLearning_2026"
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "diagnostics/space-report.md")


def main() -> None:
    token = os.environ.get("HF_TOKEN")
    if not token:
        sys.exit("HF_TOKEN is not set")

    api = HfApi(token=token)
    lines: list[str] = ["# Space deployment report", ""]

    # --- metadata -----------------------------------------------------------
    try:
        info = api.space_info(REPO)
        runtime = getattr(info, "runtime", None)
        lines += [
            "## Space",
            "",
            f"- id: `{info.id}`",
            f"- private: `{info.private}`",
            f"- sdk: `{getattr(info, 'sdk', None)}`",
            f"- last modified: `{getattr(info, 'lastModified', None)}`",
            f"- runtime stage: `{getattr(runtime, 'stage', None) if runtime else None}`",
            "",
        ]
    except Exception as exc:  # noqa: BLE001
        lines += ["## Space", "", f"metadata lookup failed: `{exc}`", ""]

    # --- file listing -------------------------------------------------------
    try:
        files = sorted(api.list_repo_files(REPO, repo_type="space"))
    except Exception as exc:  # noqa: BLE001
        files = []
        lines += [f"file listing failed: `{exc}`", ""]

    by_top: dict[str, int] = {}
    for f in files:
        by_top[f.split("/")[0]] = by_top.get(f.split("/")[0], 0) + 1

    lines += [
        "## Files",
        "",
        f"total: **{len(files)}**",
        "",
        "| top-level entry | files |",
        "| --- | --- |",
    ]
    lines += [f"| `{k}` | {v} |" for k, v in sorted(by_top.items())]
    lines += ["", "<details><summary>root-level files</summary>", ""]
    lines += [f"- `{f}`" for f in files if "/" not in f]
    lines += ["", "</details>", ""]

    for deck in ("lecture-01", "lecture-02"):
        deck_files = [f for f in files if f.startswith(f"{deck}/")]
        assets = [f for f in deck_files if "/assets/" in f]
        lines += [
            f"### {deck}",
            "",
            f"- files: **{len(deck_files)}**",
            f"- of which assets: **{len(assets)}**",
            f"- has index.html: **{f'{deck}/index.html' in files}**",
            f"- has slides.pdf: **{f'{deck}/slides.pdf' in files}**",
            "",
        ]

    # --- how the deployed HTML references its assets -------------------------
    lines += ["## Deployed HTML", ""]
    for path in ("index.html", "lecture-01/index.html"):
        try:
            local = hf_hub_download(REPO, path, repo_type="space", token=token)
            html = Path(local).read_text(encoding="utf-8", errors="replace")
            scripts = re.findall(r'<script[^>]+src="([^"]+)"', html)
            links = re.findall(r'<link[^>]+href="([^"]+\.css)"', html)
            decks = re.findall(r'<a class="deck" href="([^"]+)"', html)
            lines += [
                f"### `{path}`",
                "",
                f"- size: {len(html)} bytes",
                f"- script src: {', '.join(f'`{s}`' for s in scripts[:4]) or 'none'}",
                f"- stylesheet href: {', '.join(f'`{s}`' for s in links[:4]) or 'none'}",
                f"- deck links: {', '.join(f'`{s}`' for s in decks) or 'none'}",
                "",
            ]
            # Do the referenced assets actually exist in the repo?
            missing = []
            for ref in scripts + links:
                if ref.startswith("http"):
                    continue
                rel = ref.lstrip("./")
                candidate = rel if "/" not in path else f"{path.rsplit('/', 1)[0]}/{rel}"
                if candidate not in files:
                    missing.append(candidate)
            lines += [f"- referenced assets missing from the repo: {missing or 'none'}", ""]
        except Exception as exc:  # noqa: BLE001
            lines += [f"### `{path}`", "", f"download failed: `{exc}`", ""]

    # --- how the app is actually served and embedded ------------------------
    import urllib.request
    import urllib.error

    def probe(url: str, note: str) -> None:
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "dl2026-diagnostics",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read()
                lines.append(f"- {note}: `{r.status}` `{r.headers.get('content-type')}` "
                             f"{len(body)} bytes")
                return body
        except urllib.error.HTTPError as e:
            lines.append(f"- {note}: `HTTP {e.code}` {e.reason}")
        except Exception as exc:  # noqa: BLE001
            lines.append(f"- {note}: failed `{exc}`")
        return b""

    app_host = "https://deeplearning-vt-deeplearning-2026.static.hf.space"
    lines += ["## Serving layer", ""]
    probe(f"{app_host}/index.html", "app index.html")
    probe(f"{app_host}/lecture-01/index.html", "deck index.html")
    probe(f"{app_host}/lecture-01/assets/index-y1O4_MBz.js", "deck entry bundle")
    lines.append("")

    lines += ["## How the Space page embeds the app", ""]
    page = probe(f"https://huggingface.co/spaces/{REPO}", "Space page HTML")
    html = page.decode("utf-8", "replace")
    iframes = re.findall(r"<iframe[^>]*>", html)
    lines.append(f"- iframe tags found in server HTML: **{len(iframes)}**")
    for tag in iframes[:3]:
        sandbox = re.search(r'sandbox="([^"]*)"', tag)
        src = re.search(r'src="([^"]*)"', tag)
        lines.append(f"  - src: `{src.group(1) if src else None}`")
        lines.append(f"  - sandbox: `{sandbox.group(1) if sandbox else 'ABSENT'}`")
    if not iframes:
        for key in ("sandbox=", "static.hf.space"):
            lines.append(f"- page HTML mentions `{key}`: **{key in html}**")
    lines.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({len(lines)} lines)")


if __name__ == "__main__":
    main()
