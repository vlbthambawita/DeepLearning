# PGR207 — Deep Learning 2026

Animated, interactive lecture slides for the Deep Learning course, built with
[Slidev](https://sli.dev/) and published to a static Hugging Face Space.

- **Live:** https://huggingface.co/spaces/DeepLearning-VT/DeepLearning_2026
- **Staging:** GitHub Pages, redeployed on every push to `main`
- **Instructor:** Vajira Thambawita (PhD) — <vajira@simula.no>

The 2025 course shipped as Google-Slides PDFs (kept in `old_slides/2025/`). This
repository is the conversion of those decks into slides that animate, respond to
clicks, and — for the concepts where a picture is not enough — run a real
interactive widget. `PLAN.md` records the full conversion strategy, slide by slide.

## Layout

```
decks/lecture-XX/slides.md         one deck per lecture
decks.config.json                  which decks exist and which are published
packages/slidev-theme-dl2026/      course theme: palette, layouts, footer
packages/slidev-addon-dl2026/      shared interactive teaching components
scripts/                           build, export, publish, figure extraction
site/index.template.html           the landing page shell
old_slides/2025/                   the original PDFs, kept as the source of record
```

## Authoring

```bash
npm install
npm run dev -- lecture-01      # dev server; presenter view at /presenter
npm run build                  # published decks + landing page → dist/
npm run build:all              # include decks still marked published: false
npm run export -- --only lecture-01   # printable PDF (needs Chromium)
npm run preview                # serve dist/ at http://localhost:4173
```

Speaker notes live in the source and show up in the presenter view. They are
stripped from anything public by `--without-notes`.

To pull reference material out of a 2025 PDF:

```bash
python3 scripts/extract_figures.py --only lecture-02
open old_slides/extracted/lecture-02/contact-sheet.html
```

That writes page renders, every embedded image, and a contact sheet into
`old_slides/extracted/` (gitignored). It flags images that look like cropped
equations — Lecture 02 has 21 of them, and every one is meant to be retyped as
KaTeX rather than shipped as a blurry screenshot. Figures only reach the site
when you deliberately copy them into `decks/<id>/public/figures/`.

## Publishing

Publishing is tag-driven, so nothing reaches students until you say so.

| Tag | Effect |
| --- | --- |
| `lecture-01-v1` | Rebuilds **that deck only** and uploads it plus a refreshed landing page. Every other lecture on the Space is untouched. |
| `site-v1.0.0` | Rebuilds every deck marked `published: true` and replaces the whole Space, deleting anything no longer in the build. |

```bash
# publish one lecture
git tag lecture-01-v1 && git push origin lecture-01-v1

# re-sync the whole site
git tag site-v1.0.0 && git push origin site-v1.0.0
```

A deck only goes out once `"published": true` in `decks.config.json`; the publish
script refuses a tag for a deck that is still marked unpublished, because the
landing page would not link to it.

The release workflow also has a manual trigger with a dry-run option, for
rehearsing either path without uploading.

### One-time setup

1. A Hugging Face write token in the repo secret `HF_TOKEN`.
2. GitHub Pages enabled with source *GitHub Actions* (for the staging preview).

The Space itself is created automatically on first release, as `sdk: static`.
