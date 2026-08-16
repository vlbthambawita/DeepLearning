#!/usr/bin/env python3
"""Pull every image and a reference render out of the 2025 lecture PDFs.

Output goes to ``old_slides/extracted/<deck-id>/`` — a *staging* area, not the
deck itself. Nothing ships until someone deliberately copies it into
``decks/<deck-id>/public/figures/``. That is the point: the two source decks
hold 91 image placements between them, most of which should be re-drawn as SVG,
Mermaid or KaTeX rather than shipped as raster, and an automatic dump into the
deck would quietly reverse that decision.

Layout of the staging directory::

    old_slides/extracted/lecture-01/
      images/p03-01.jpeg      original bytes, losslessly extracted
      pages/p03.png           200 dpi render of the whole slide, for reference
      figures.json            every image with its placement, size and page text
      contact-sheet.html      open this to see everything at once

Images that look like cropped equations (short, wide, small) are flagged rather
than filtered: Lecture 02 ships roughly 25 of them and every one is meant to be
retyped as KaTeX.

Usage::

    python3 scripts/extract_figures.py                 # every deck with a source
    python3 scripts/extract_figures.py --only lecture-02
    python3 scripts/extract_figures.py --dpi 300
"""

from __future__ import annotations

import argparse
import html
import json
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover
    sys.exit("PyMuPDF is required:  pip install pymupdf")

REPO_ROOT = Path(__file__).resolve().parent.parent

# A crop is "probably an equation" if it is small and wide. Both source decks
# render maths as screenshots between roughly 151x39 and 837x134 px.
EQUATION_MAX_HEIGHT = 160
EQUATION_MIN_ASPECT = 2.5


def load_decks(only: str | None) -> list[dict]:
    config = json.loads((REPO_ROOT / "decks.config.json").read_text())
    decks = [d for d in config["decks"] if d.get("source")]
    if only:
        decks = [d for d in decks if d["id"] == only]
        if not decks:
            sys.exit(f'No deck "{only}" with a "source" in decks.config.json')
    return decks


def looks_like_equation(width: int, height: int) -> bool:
    if height > EQUATION_MAX_HEIGHT:
        return False
    return width / max(height, 1) >= EQUATION_MIN_ASPECT


def extract_deck(deck: dict, dpi: int) -> dict:
    pdf_path = REPO_ROOT / deck["source"]
    if not pdf_path.exists():
        sys.exit(f"Source PDF not found: {pdf_path}")

    out_root = REPO_ROOT / "old_slides" / "extracted" / deck["id"]
    images_dir = out_root / "images"
    pages_dir = out_root / "pages"
    images_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    # An xref reused across slides (Lecture 02 reuses xref 94 three times as a
    # deliberate callback) is written once and referenced by every page that
    # places it.
    written_by_xref: dict[int, str] = {}
    pages: list[dict] = []

    for page_index, page in enumerate(doc):
        page_no = page_index + 1

        render = page.get_pixmap(dpi=dpi)
        render_name = f"p{page_no:02d}.png"
        render.save(pages_dir / render_name)

        entries = []
        for slot, info in enumerate(page.get_images(full=True), start=1):
            xref = info[0]

            if xref in written_by_xref:
                filename = written_by_xref[xref]
                reused = True
            else:
                raw = doc.extract_image(xref)
                filename = f"p{page_no:02d}-{slot:02d}.{raw['ext']}"
                (images_dir / filename).write_bytes(raw["image"])
                written_by_xref[xref] = filename
                reused = False

            raw_meta = doc.extract_image(xref)
            width, height = raw_meta["width"], raw_meta["height"]

            rects = page.get_image_rects(xref)
            placement = None
            coverage = 0.0
            if rects:
                r = rects[0]
                placement = [round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1)]
                coverage = round((r.width * r.height) / (page.rect.width * page.rect.height), 3)

            entries.append({
                "file": f"images/{filename}",
                "xref": xref,
                "reused": reused,
                "width": width,
                "height": height,
                "placement": placement,
                "page_coverage": coverage,
                "likely_equation_crop": looks_like_equation(width, height),
            })

        text = page.get_text().strip()
        pages.append({
            "page": page_no,
            "render": f"pages/{render_name}",
            "text": text,
            "word_count": len(text.split()),
            "image_coverage": round(sum(e["page_coverage"] for e in entries), 3),
            "images": entries,
        })

    manifest = {
        "deck": deck["id"],
        "title": deck["title"],
        "source": deck["source"],
        "page_count": len(pages),
        "page_size_pt": [round(doc[0].rect.width, 1), round(doc[0].rect.height, 1)],
        "unique_images": len(written_by_xref),
        "equation_crops": sum(
            1 for p in pages for e in p["images"] if e["likely_equation_crop"] and not e["reused"]
        ),
        "pages": pages,
    }
    (out_root / "figures.json").write_text(json.dumps(manifest, indent=2))
    (out_root / "contact-sheet.html").write_text(contact_sheet(manifest))
    doc.close()

    return manifest


def contact_sheet(manifest: dict) -> str:
    """A single page showing every slide next to the images it contains.

    Converting a deck means deciding, per slide, whether a figure is re-drawn,
    retyped or kept. That decision is much faster side by side than by opening
    91 files one at a time.
    """
    rows = []
    for page in manifest["pages"]:
        thumbs = "".join(
            f'<figure class="img{" eq" if img["likely_equation_crop"] else ""}'
            f'{" reused" if img["reused"] else ""}">'
            f'<img src="{html.escape(img["file"])}" loading="lazy">'
            f'<figcaption>{img["width"]}&times;{img["height"]}'
            f'{" · equation?" if img["likely_equation_crop"] else ""}'
            f'{" · reused" if img["reused"] else ""}</figcaption></figure>'
            for img in page["images"]
        ) or '<div class="none">no images</div>'

        preview = html.escape(page["text"][:400]) or "<em>no text</em>"
        rows.append(f"""
    <section class="slide">
      <div class="render">
        <div class="no">{page["page"]}</div>
        <img src="{html.escape(page["render"])}" loading="lazy">
      </div>
      <div class="detail">
        <div class="meta">{page["word_count"]} words · {int(page["image_coverage"] * 100)}% image coverage · {len(page["images"])} image(s)</div>
        <pre>{preview}</pre>
        <div class="imgs">{thumbs}</div>
      </div>
    </section>""")

    return f"""<!doctype html>
<meta charset="utf-8">
<title>{html.escape(manifest["title"])} — extraction contact sheet</title>
<style>
  body {{ font: 14px/1.5 system-ui, sans-serif; margin: 0; padding: 2rem; background: #fafafa; color: #333; }}
  h1 {{ margin: 0 0 .3rem; }}
  .summary {{ color: #777; margin-bottom: 2rem; }}
  .slide {{ display: grid; grid-template-columns: 22rem 1fr; gap: 1.5rem; padding: 1.2rem 0; border-top: 1px solid #ddd; }}
  .render {{ position: relative; }}
  .render img {{ width: 100%; border: 1px solid #ccc; background: #fff; }}
  .no {{ position: absolute; top: -.4rem; left: -.4rem; background: #0097a7; color: #fff; font-weight: 700;
         width: 1.9rem; height: 1.9rem; display: grid; place-items: center; border-radius: 50%; }}
  .meta {{ color: #777; font-size: .85rem; margin-bottom: .5rem; }}
  pre {{ white-space: pre-wrap; background: #fff; border: 1px solid #e4e4e4; padding: .6rem .8rem;
         max-height: 9rem; overflow: auto; font-size: .8rem; margin: 0 0 .8rem; }}
  .imgs {{ display: flex; flex-wrap: wrap; gap: .6rem; }}
  figure {{ margin: 0; max-width: 11rem; }}
  figure img {{ max-width: 100%; border: 1px solid #ccc; background: #fff; display: block; }}
  figcaption {{ font-size: .7rem; color: #888; }}
  figure.eq img {{ border-color: #d32f2f; }}
  figure.eq figcaption {{ color: #d32f2f; }}
  figure.reused img {{ border-style: dashed; }}
  .none {{ color: #bbb; font-style: italic; }}
</style>
<h1>{html.escape(manifest["title"])}</h1>
<p class="summary">
  {manifest["page_count"]} slides · {manifest["unique_images"]} unique images ·
  <strong style="color:#d32f2f">{manifest["equation_crops"]} look like equation crops</strong>
  (retype those as KaTeX) · source: {html.escape(manifest["source"])}
</p>
{"".join(rows)}
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="extract a single deck id, e.g. lecture-02")
    parser.add_argument("--dpi", type=int, default=200, help="dpi for full-page reference renders")
    args = parser.parse_args()

    for deck in load_decks(args.only):
        manifest = extract_deck(deck, args.dpi)
        out = REPO_ROOT / "old_slides" / "extracted" / deck["id"]
        print(
            f'{deck["id"]}: {manifest["page_count"]} slides, '
            f'{manifest["unique_images"]} unique images, '
            f'{manifest["equation_crops"]} likely equation crops'
        )
        print(f"  → {out.relative_to(REPO_ROOT)}/contact-sheet.html")


if __name__ == "__main__":
    main()
