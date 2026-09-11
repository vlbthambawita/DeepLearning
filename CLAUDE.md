# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **not application code** — it is the source for the PGR207 Deep Learning 2026
lecture decks: animated, interactive [Slidev](https://sli.dev/) slides that build to a
static site and publish to a Hugging Face Space. Each lecture is a Markdown file with
embedded Vue components. The 2025 course shipped as Google-Slides PDFs (`old_slides/2025/`);
this repo is the ongoing conversion of those into interactive decks. `PLAN.md` tracks the
conversion strategy slide by slide; `TODO/` holds per-lecture working notes.

## Commands

```bash
npm install
npm run dev -- lecture-01              # dev server; presenter view (speaker notes) at /presenter
npm run dev -- lecture-01 --port 3040
npm run build                          # published decks + landing page → dist/
npm run build:all                      # include decks with "published": false (this is what CI runs)
npm run export -- --only lecture-01    # printable PDF (needs Chromium: npx playwright install chromium)
npm run preview                        # serve dist/ at http://localhost:4173
npm run check -- lecture-01            # overflow/clipping check against a running preview (see below)
npm run check                          # every deck; --dark and --shots <dir> also available
python3 scripts/extract_figures.py --only lecture-02   # pull figures out of a 2025 PDF
```

There is no test suite and no linter. `npm run check` is the closest thing to a test — it
must run against a live `npm run preview` (build first). CI (`.github/workflows/ci.yml`)
only runs `npm run build:all` and asserts `dist/` contains the Space's `index.html`/`README.md`.

## Architecture

**npm workspaces monorepo.** Three moving parts:

- `decks/lecture-XX/slides.md` — one deck per lecture. `figures/` sits beside it (NOT in
  `public/` — see gotchas). `style.css` holds deck-wide CSS. `decks/_template/` is copied to
  start a new deck and is deliberately absent from `decks.config.json` so it never builds.
- `packages/slidev-theme-dl2026/` — the course theme: palette (`styles/vars.css`), the six
  custom layouts, and the footer. Every layout renders the footer itself.
- `packages/slidev-addon-dl2026/` — shared interactive teaching components (`components/*.vue`,
  auto-available in every deck without import) plus `composables/` holding their data/logic.

**`decks.config.json` is the single source of truth.** It lists every deck and, via
`"published": true`, what the public site contains. `scripts/lib/config.mjs` loads it and
`selectDecks()` resolves which decks a command acts on (`--all` overrides `published`,
`--only <id>` narrows to one). All scripts share this lib and a `parseArgs` mini-parser.

**Build → publish pipeline** (`scripts/`, all invoked through `package.json`):
- `build-site.mjs` builds each deck with `--base ./` (relative, so assets resolve under the
  non-root HF Space path) and `--without-notes` (strips speaker notes), then generates the
  landing page from `site/index.template.html` and the Space's `README.md` (its YAML front
  matter is what makes HF serve it as a static Space). A full build wipes `dist/` first; an
  `--only` build writes into the existing `dist/` without clobbering other decks.
- `export-pdf.mjs` renders each deck to `<id>/slides.pdf` (one page per click step).
- `publish-hf.mjs` uploads `dist/` via the `hf` CLI. `--mode full` passes `--delete "*"`
  (replace whole Space); `--mode deck --only <id>` uploads one deck without deleting others.

**Publishing is tag-driven** (`.github/workflows/release.yml`). Nothing reaches students
until a tag is pushed:
- `lecture-01-v1` → rebuilds and uploads that one deck plus a refreshed landing page.
- `site-v1.0.0` → rebuilds every `published: true` deck and replaces the whole Space.
- Publishing a deck still marked `published: false` is refused (the landing page wouldn't link it).
- The workflow also has a manual `workflow_dispatch` trigger with a dry-run option.

## Authoring conventions (read CONTRIBUTING.md — it is the real reference)

`CONTRIBUTING.md` documents the full authoring workflow and a long list of hard-won Slidev
gotchas. The ones most likely to bite:

- **Figures go in `decks/<id>/figures/`, not `public/`.** Vite rewrites `<img src="./figures/x.png">`
  as a hashed module import; a `public/` asset needs an absolute path that breaks under the Pages base.
- **A URL passed as a component *prop* is not rewritten** — only `src` in a template is. Pass
  images through a slot (see `FigureSpotlight`).
- **`<style>` inside a slide is scoped to that slide.** Deck-wide CSS → `decks/<id>/style.css`;
  anything a second deck needs → the theme.
- **Use the custom layouts** (`title`, `section`, `default`, `figure`, `interactive`, `end`),
  not Slidev's built-ins — built-ins drop the footer/page number. `figure`/`interactive` take
  their heading from `heading:`, not `title:` (Slidev claims `title:` for its own metadata).
- **Equations are always retyped as KaTeX**, never shipped as extracted image crops.
- **New widgets must be deterministic** (`seededRandom`, never `Math.random`), keyboard-operable,
  legible in light+dark mode and in the one-page-per-click PDF export.
- Never nest `<v-clicks>` inside a `v-click`; never write literal `opacity="0.5"` on SVG (UnoCSS
  attributify poisons it — use `:style`); a component keyboard control must stop arrow-key
  propagation or Slidev navigates slides instead.
