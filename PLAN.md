# DL2026 — Animated & Interactive Slidev Course Deck → Hugging Face Space

## Context

The Deep Learning course (**PGR207**, Vajira Thambawita, SimulaMet) currently ships as Google‑Slides‑exported PDFs. Two 2025 decks exist in `old_slides/2025/`:

- **Lecture 01 — Introduction to Deep Learning**, 36 slides, 720×405 pt (exact 16:9), 41 embedded images.
- **Lecture 02 — Basics of Neural Networks**, 32 slides, same geometry, 50 image placements / 47 unique.

Both are static. Lecture 02 is the sharp case: it contains **no vector math at all** — every equation on slides 6, 7, 9, 10, 11, 16, 18, 22, 23 is a small cropped JPEG screenshot (as small as 151×39 px) lifted from Raschka/Liu/Mirjalili, *ML with PyTorch and Scikit‑Learn*. Those crops are blurry when scaled, impossible to animate term‑by‑term, and — since the target is a **public** HF Space — republishing book screenshots is a copyright exposure we should retire rather than carry forward. Neither deck contains a single code snippet, despite the "implement an MLP from scratch" framing.

The goal is a source‑controlled, reproducible pipeline that turns each lecture into an **animated, interactive Slidev deck**, published to the static HF Space **`DeepLearning-VT/DeepLearning_2026`** on demand via a **git tag**, one lecture at a time, with GitHub Pages as a continuously‑updated staging preview.

Decisions already taken (confirmed with the user):

| Decision | Choice |
|---|---|
| Tag strategy | **Both** — `lecture-XX-vN` publishes one deck incrementally; `site-vX.Y.Z` rebuilds and replaces the whole Space |
| Interactivity | **Rich custom widgets** — a shared Vue component library, no in‑browser Python (Pyodide) |
| Theme | **New custom course theme**, carrying the 2025 palette forward |
| Extras | PDF export per lecture, GitHub Pages staging, speaker notes (stripped from the public build), Colab notebook links |

### Environment facts established

- Node **v24.15.0**, npm 11.12.1 present. No pnpm/bun, no Docker, no `gh` CLI, no `huggingface-cli` locally — all HF/GitHub automation runs in CI.
- Slidev CLI latest is **v52.19.0** (requires Node ≥ 20.12) — satisfied.
- PDF tooling: **no poppler / qpdf / ImageMagick**. **PyMuPDF 1.28.0** and **pypdf 6.14.2** are installed — figure extraction must go through PyMuPDF.
- HF org `DeepLearning-VT` ("Deep Learning Course - Vajira Thambawita") exists; the Space URL returns 401, so it is **private or not yet created** — see Prerequisites.
- Repo `vlbthambawita/DeepLearning`, branch `main`, single commit, no Slidev scaffolding.

### Reusable style kernel extracted from the 2025 PDFs

No institutional template, logo, or footer — plain white Google Slides. What is worth keeping:

- Accent **teal `#0097a7`** (hyperlinks + the thin rule under the email on the title slide), body grey **`#595959`**, black headings, red `#ff0000` reserved for "wrong prediction" emphasis, `#eeeeee` table header fill.
- Type scale at 720×405 pt: 52 title / 36 section divider / 25.2 slide title / 18 body / 14 secondary / 9–11.2 citations.
- Arial throughout → substitute a modern sans (Inter or Source Sans 3) at the same scale.
- Branding strings: course code **PGR207**, **Deep Learning**, **Vajira Thambawita (PhD)**, **vajira@simula.no**.

---

## Architecture

### Repository layout

```
DeepLearning/
├─ package.json                      # npm workspaces root + scripts
├─ decks.config.json                 # manifest: id, title, week, published, tags
├─ decks/
│  ├─ lecture-01/
│  │  ├─ slides.md                   # headmatter: theme, addons, routerMode: hash
│  │  ├─ public/figures/*.{png,jpg,svg}
│  │  ├─ components/                 # deck-local one-off Vue components
│  │  └─ notes/                      # speaker notes kept in-source
│  └─ lecture-02/ …
├─ packages/
│  ├─ slidev-theme-dl2026/           # palette, fonts, layouts, footer, title/section slides
│  └─ slidev-addon-dl2026/           # shared interactive Vue components (below)
├─ notebooks/lecture-XX/*.ipynb      # Colab-linked exercises
├─ site/
│  ├─ index.template.html            # landing page shell
│  └─ assets/                        # landing page css/og-image
├─ scripts/
│  ├─ extract_figures.py             # PyMuPDF → decks/<id>/public/figures/
│  ├─ build-site.mjs                 # build published decks + landing + HF README
│  └─ publish-hf.mjs                 # thin wrapper over `hf upload`
├─ .github/workflows/{ci.yml,pages.yml,release.yml}
└─ old_slides/2025/*.pdf             # kept as the source of record
```

Package names must follow Slidev conventions (`slidev-theme-*`, `slidev-addon-*`); decks consume them by **relative path** — `theme: ../../packages/slidev-theme-dl2026`, `addons: [../../packages/slidev-addon-dl2026]`. Addons ship `.vue`/`.ts` uncompiled; Slidev compiles them at build time, so there is no separate package build step.

### The one non-obvious build setting: `routerMode: hash`

A Slidev SPA defaults to HTML History routing. On a plain static host (which HF static Spaces are) a deep link such as `…/lecture-02/14` 404s on reload or share — a known Slidev issue on GitHub Pages/nginx. Setting `routerMode: hash` in every deck's headmatter turns slide URLs into `…/lecture-02/#/14`, which any static server resolves. **Every deck headmatter gets this**; without it, every link you paste into the course LMS is a coin flip.

### Manifest — `decks.config.json`

```json
{
  "course": { "code": "PGR207", "year": 2026, "title": "Deep Learning",
              "instructor": "Vajira Thambawita (PhD)", "email": "vajira@simula.no" },
  "space": "DeepLearning-VT/DeepLearning_2026",
  "decks": [
    { "id": "lecture-01", "title": "Introduction to Deep Learning",
      "week": 1, "published": true,  "notebook": "notebooks/lecture-01/intro.ipynb" },
    { "id": "lecture-02", "title": "Basics of Neural Networks",
      "week": 2, "published": false, "notebook": null }
  ]
}
```

`published` is the single source of truth for what appears on the landing page and in a full‑site sync. Publishing lecture N one‑by‑one = flip its flag, commit, tag.

### Build

`scripts/build-site.mjs`, for each deck with `published: true`:

```bash
npx slidev build decks/<id>/slides.md \
    --base /<id>/ --out <abs>/dist/<id> \
    --without-notes --download /<id>/slides.pdf
```

- `--base` **must begin and end with a slash**.
- `--out` is passed as an absolute path to avoid cwd-relative surprises.
- `--without-notes` strips speaker notes from the public build (notes stay in source for the local presenter view, `npm run dev:<id>` → `?presenter`).
- `--download /<id>/slides.pdf` points the in‑deck download button at the PDF produced by the separate export step, so the build itself does not need Playwright.

Then the script writes `dist/index.html` from `site/index.template.html` (deck cards, week numbers, Colab links, last‑updated stamp) and `dist/README.md` with the HF front matter:

```yaml
title: Deep Learning 2026 (PGR207)
emoji: 🧠
colorFrom: cyan
colorTo: gray
sdk: static
app_file: index.html
pinned: false
license: cc-by-4.0
```

We build in CI and upload the **built `dist/`** as the Space contents — we do *not* mirror the GitHub repo and let HF's `app_build_command` build it. That keeps the Space free of source, PDFs, and `old_slides/`, and keeps build failures inside CI where they are visible.

### PDF export (separate job)

```bash
npx playwright install --with-deps chromium
npx slidev export decks/<id>/slides.md --output dist/<id>/slides.pdf --with-clicks
```

`--with-clicks` emits one page per click step, so the animated build degrades into a readable handout. The PDF is also attached to the GitHub Release.

### Publish to HF

`hf` CLI from `huggingface_hub`, authenticated with the `HF_TOKEN` repo secret.

- **Per‑lecture** (tag `lecture-XX-vN`) — build only that deck, then upload the deck folder plus the regenerated landing files, touching nothing else:
  ```bash
  hf upload DeepLearning-VT/DeepLearning_2026 ./dist/lecture-XX lecture-XX --repo-type=space
  hf upload DeepLearning-VT/DeepLearning_2026 ./dist/index.html index.html --repo-type=space
  hf upload DeepLearning-VT/DeepLearning_2026 ./dist/README.md  README.md  --repo-type=space
  ```
- **Full site** (tag `site-vX.Y.Z`) — rebuild every published deck and replace the Space wholesale:
  ```bash
  hf upload DeepLearning-VT/DeepLearning_2026 ./dist . --repo-type=space --delete "*"
  ```

`--delete "*"` is what makes the full‑site tag authoritative; it is deliberately absent from the incremental path. `hf upload` handles LFS/Xet automatically for files over the 10 MB threshold (relevant for click‑expanded PDFs).

### Workflows

| File | Trigger | Does |
|---|---|---|
| `ci.yml` | PR + push to `main` | install, lint/typecheck, `build-site.mjs` for **all** decks (published or not) — catches breakage in unpublished work early. No deploy. |
| `pages.yml` | push to `main`, `workflow_dispatch` | build published decks → deploy to GitHub Pages with `--base /DeepLearning/<id>/`. This is staging; the URL is safe to share with a TA before a real release. |
| `release.yml` | `push: tags: ['lecture-*-v*', 'site-v*']`, plus `workflow_dispatch` with a dry‑run input | parse tag → decide incremental vs full → build → export PDFs → `hf upload` → create a GitHub Release with the PDFs attached. |

Pages needs its own `--base` because it serves from `/DeepLearning/`, whereas the HF Space serves from `/`. `build-site.mjs` takes `--base-prefix` for this.

Optional hardening once the flow is proven: swap `HF_TOKEN` for HF **Trusted Publishers** (GitHub OIDC → short‑lived, repo‑scoped Hub token), removing the long‑lived secret.

---

## Content conversion strategy

Each 2025 slide is classified into one of four tiers. This is the rule that keeps 68 slides from becoming 68 bespoke decisions.

- **Tier A — native markdown.** Text/bullets/dividers → Slidev markdown + `<v-clicks>`. Covers **20 of L01's 36 slides** and 8 of L02's 32.
- **Tier B — re-authored diagram.** Simple flow/taxonomy figures → Mermaid or hand-authored animated SVG. No raster asset retained.
- **Tier C — extracted raster.** Photographs, paper figures, screenshots that cannot be re-drawn → extract losslessly with PyMuPDF, keep as `public/figures/`, present in a `figure` layout with click-through captions.
- **Tier D — interactive component.** Concepts where a widget beats a picture → shared Vue component (list below).

**Equations are always retyped as KaTeX**, never extracted. That is ~25 crops across L02 slides 6, 7, 9, 10, 11, 16, 18, 22, 23 — the single highest‑value piece of manual work in the project, and what unlocks term‑by‑term `v-click` reveals and `magic-move` derivations.

### Lecture 01 — mapping (36 → ~34 slides)

| 2025 slides | Tier | Treatment |
|---|---|---|
| 1 | A | New `title` layout from the theme (PGR207, name, mailto, teal rule) |
| 2, 7, 12, 25, 28, 32, 36 | A | `section` divider layout with a transition |
| 3 "Who am I?" | C | 8‑JPEG collage → extracted, laid out as an animated `v-motion` photo grid |
| 4, 5, 18 | A/D | Audience questions → `<PollSlide>` click‑reveal |
| 6 Outline | A | `<v-clicks>` bullets, each linking to its section |
| 8 Workload | A | Retyped; hours as an animated bar breakdown |
| 9 References | C | Book cover extracted; citations as markdown links |
| 10, 11 "To learn" | D | The two vector tables merge into one `<SyllabusTimeline>` — 12 weeks, clickable, current week highlighted |
| 13–16 (AI images, LLMs) | C | Extract the 1024² DALL·E outputs; 14→15 becomes one slide with a click‑gated reveal (prompt → result) |
| 17, 19–22, 34 | D | Six bare‑URL slides → `<LinkCard>` grid (favicon, title, blurb) — six slides collapse into two |
| 23 Definition of DL | B/D | `<AIMLDLVenn>` animated nesting, IBM citation retained |
| 24 Three types of ML | B | Mermaid taxonomy, animated per branch; Raschka citation retained |
| 26 Applications | C | Extracted photo tiles revealed on click |
| 27 CV categories | D | `<CVTaskDemo>` — one image, toggle classification / detection / segmentation overlays |
| 29, 30 (polyp, ECG) | C | Extract at native resolution (2048×1590, 1440×1036); `figure` layout |
| 31 Main pipeline | B | Mermaid pipeline with the "we learn this step" node highlighted on click |
| 33 Framework logos | C | Extracted logo wall with `v-motion` stagger |
| 35 Hardware | C | Extracted photos |

### Lecture 02 — mapping (32 → ~34 slides, the interactivity‑heavy deck)

| 2025 slides | Tier | Treatment |
|---|---|---|
| 1, 2, 24, 27, 31 | A | Title (unify with L01's title layout — L02 currently has no branded title), outline, dividers |
| 3, 4 (biological neuron, MCP/Rosenblatt history) | D | `<NeuronAnatomy>` morphing biological ↔ artificial neuron; history as a click‑through timeline with the 1943/1957 citations |
| 5, 6 (Iris, notation) | A + KaTeX | Retype the matrix and index notation; Iris table as native markdown, highlight a row on click |
| 7 Formal definition | A + KaTeX | The densest math slide (7 equation crops, 20 words) → KaTeX `z = w^\top x + b`, unit step, revealed term by term |
| 8 Decision boundary | D | Reuse `<PerceptronPlayground>` in "boundary only" mode |
| 9, 10, 11 Learning rule + worked examples | D + KaTeX | `<PerceptronPlayground>` with a step button running Rosenblatt's rule; the two worked examples become guided click‑throughs, red `#ff0000` preserved for the wrong‑prediction case |
| 12 Convergence | C/D | Linear‑separability toggle inside the playground |
| 13 "The big picture" | A | Recap slide, reuses the live component — the callback the PDF made with a duplicated image |
| 14, 15 ADALINE / vs perceptron | D | `<PerceptronVsAdaline>` side‑by‑side, animated diff on the comparison arrow |
| 16–19 Gradient descent + MSE derivation | D + KaTeX | `<GradientDescent1D>` (draggable start, LR slider, animated steps); the MSE derivative as a `magic-move` KaTeX derivation |
| 20 Why Adaline | A | Retyped |
| 21 Learning rate | D | `<LearningRateCompare>` — three LRs running simultaneously |
| 22 Feature scaling | D + KaTeX | `<FeatureScaling>` before/after scatter toggle + standardization formula |
| 23 SGD | D + KaTeX | `<SGDvsBatch>` noisy vs smooth trajectories |
| 25 MLP | D | `<MLPDiagram>` animated SVG — configurable layer sizes |
| 26 One‑hot | D | `<OneHotDemo>` click a class → vector lights up |
| 28 Learning procedure | D | `<MLPDiagram>` in forward→loss→backward mode; the 26 vector arrows become real animation |
| 29 MNIST | C | Extract figure |
| 30 Backpropagation + activation table | D + KaTeX | `<ActivationExplorer>` (function + derivative, hover readout) replaces the 1124×1328 book table screenshot |
| 32 orphan | — | **Drop** — sits after "The End", almost certainly dead content. Confirm before deleting. |
| — | new | **Add 3–4 code slides.** Neither deck has any code. Shiki blocks with click‑ranges (`{1-3|4|all}`) for the perceptron update rule, the MSE loss, and a minimal MLP forward pass, each linked to a Colab notebook. |

### Shared component library — `packages/slidev-addon-dl2026`

Built in dependency order; every one is reused across future lectures 03–12.

**Primitives (build first):** `<Plot2D>` (axes/grid/curve/scatter SVG primitive), `<Slider>`, `<StepButton>`, `<LinkCard>`, `<PollSlide>`, `<Citation>`.

**Concept widgets:** `<PerceptronPlayground>`, `<GradientDescent1D>`, `<LearningRateCompare>`, `<FeatureScaling>`, `<SGDvsBatch>`, `<ActivationExplorer>`, `<MLPDiagram>`, `<OneHotDemo>`, `<NeuronAnatomy>`, `<PerceptronVsAdaline>`, `<AIMLDLVenn>`, `<CVTaskDemo>`, `<SyllabusTimeline>`.

Constraints, so these stay usable rather than merely impressive: pure client‑side (no network), keyboard‑operable, deterministic seeds so a demo repeats identically in the lecture hall, honour Slidev's click count so `$clicks` drives them and the PDF export captures meaningful states, and readable in both light and dark theme.

### Theme — `packages/slidev-theme-dl2026`

Palette and scale from the 2025 extraction above. Layouts: `title`, `section`, `default`, `two-cols-header`, `figure` (caption + citation slot), `interactive` (full‑bleed widget + side note), `quote`, `end`. Footer carries course code, lecture number, and slide number — the 2025 decks had page numbers typed by hand on three slides, which is exactly the kind of thing a theme should own. Light/dark toggle with the teal accent holding in both.

---

## Execution phases

**Phase 0 — pipeline first, content second.** Scaffold workspace, theme skeleton, addon skeleton, `decks.config.json`, `build-site.mjs`, landing page, and all three workflows. Ship a 3‑slide placeholder `lecture-01` and drive it all the way to the live HF Space. *Nothing else starts until a tag produces a working URL* — the deployment path is the part most likely to surprise us, and it is cheapest to debug against a trivial deck.

**Phase 1 — asset extraction.** `scripts/extract_figures.py` using PyMuPDF: `page.get_images(full=True)` + `doc.extract_image(xref)` for lossless originals, `page.get_image_rects(xref)` for placement, `page.get_pixmap(dpi=200)` for full‑page reference renders. Writes `decks/<id>/public/figures/sNN-kk.<ext>` plus a `figures.json` index. Quote the paths — both source filenames misspell "Learning" as "Leaning" and Lecture 02's has a **trailing space before `.pdf`**.

**Phase 2 — theme + primitives.** Finish the theme's layouts and the primitive components. Validate against a handful of real L01 slides.

**Phase 3 — Lecture 01.** Full conversion per the table above. Tag `lecture-01-v1` → live. This is the lower‑risk deck (55% text) and proves the content workflow.

**Phase 4 — Lecture 02 concept widgets.** The 13 concept components, built and unit‑checked standalone before wiring into slides.

**Phase 5 — Lecture 02.** Full conversion, ~25 KaTeX equations retyped, new code slides, Colab notebook. Tag `lecture-02-v1`.

**Phase 6 — templates and handover.** `decks/_template/` for lectures 03–12, a `CONTRIBUTING.md` covering the authoring loop and tag conventions, and `site-v1.0.0` as the first full‑site release.

---

## Prerequisites (user actions — cannot be done from here)

1. **Create/confirm the Space** `DeepLearning-VT/DeepLearning_2026` with **SDK = Static** and visibility **Public** (static Spaces are free; Public makes the source visible, Protected keeps source private while the app stays reachable at the `*.hf.space` URL).
2. **HF access token** with *write* scope on that Space → add as GitHub repo secret **`HF_TOKEN`**. A fine‑grained token scoped to just this Space is preferred.
3. **Enable GitHub Pages** on `vlbthambawita/DeepLearning` with source = *GitHub Actions*.
4. **Confirm** whether L02's post‑"The End" slide 32 ("Single-layer neural network") should be dropped.

## Verification

**Local**
- `npm install && npm run dev:lecture-01` → deck opens; presenter view at `?presenter` shows speaker notes.
- `npm run build` → `dist/{index.html,README.md,lecture-01/…}`.
- `npx vite preview dist` → landing page lists only `published: true` decks; every card opens its deck.
- **Deep‑link check (the one that catches `routerMode`):** open `http://localhost:4173/lecture-02/#/14`, hard‑reload. It must render slide 14, not 404. Repeat against the live Space after the first release.
- `npm run export:lecture-01` → `dist/lecture-01/slides.pdf` with one page per click step; the in‑deck download button resolves.

**CI**
- Open a throwaway PR → `ci.yml` builds all decks including unpublished ones.
- Push to `main` → `pages.yml` publishes staging; confirm the `/DeepLearning/` base path did not break asset URLs.
- `release.yml` via `workflow_dispatch` with dry‑run → build + export run, upload step is skipped.

**Release**
- Tag `lecture-01-v0.1` on the Phase‑0 placeholder → Space rebuilds, `https://huggingface.co/spaces/DeepLearning-VT/DeepLearning_2026` and the direct `*.static.hf.space` URL both serve the landing page and the deck. Confirm the incremental upload left other files untouched (check the Space's Files tab).
- Tag `site-v0.1.0` → full sync; confirm `--delete "*"` removed stale files and did **not** wipe anything wanted.
- Confirm no unintended files (source `.md`, `old_slides/*.pdf`, `.github/`) landed in the Space.

**Content review (per lecture, before its tag)**
- Every slide from the 2025 PDF is accounted for — ported, merged, or explicitly dropped, checked against the mapping tables above.
- Zero equation images remain in `public/figures/`; all math is KaTeX.
- Every retained third‑party figure carries its citation; every Raschka‑derived figure that was re‑authored no longer ships the book screenshot.
- Widgets behave under keyboard nav, in dark mode, and in the exported PDF.
