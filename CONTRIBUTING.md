# Working on these slides

## Adding a lecture

```bash
cp -r decks/_template decks/lecture-03
```

Change the three `CHANGE ME` values in `decks/lecture-03/slides.md`, then add an
entry to `decks.config.json`:

```json
{
  "id": "lecture-03",
  "title": "PyTorch for Deep Learning",
  "subtitle": "One line for the landing-page card",
  "week": 3,
  "published": false,
  "notebook": null,
  "source": "old_slides/2025/....pdf"
}
```

Leave `published: false` while you work. `npm run build:all` still builds it, so
CI catches breakage; the landing page and every release path ignore it until the
flag flips.

```bash
npm run dev -- lecture-03      # dev server, presenter view at /presenter
npm run build:all              # build everything, published or not
npm run preview                # serve dist/ at http://localhost:4173
```

## Converting an old deck

```bash
python3 scripts/extract_figures.py --only lecture-03
open old_slides/extracted/lecture-03/contact-sheet.html
```

The contact sheet shows each slide beside the images it contains, and flags
crops that look like equations. Then decide, per figure:

| | |
| --- | --- |
| Text, bullets, dividers | Native markdown with `<v-clicks>` |
| A simple flow or taxonomy | Mermaid, or a component |
| An equation | **Always** retyped as KaTeX — never extracted |
| A photograph or paper figure | Copy into `decks/<id>/figures/`, cite it |
| A concept a widget explains better | A component in the addon |

Copying a figure into the deck is a deliberate act. The extraction script never
does it for you, because most figures in these decks should be re-drawn rather
than shipped — and re-drawing also keeps third-party screenshots off the site.

## Publishing

Tag-driven, so nothing reaches students until you say so.

```bash
git tag lecture-03-v1 && git push origin lecture-03-v1   # one deck
git tag site-v1.1.0   && git push origin site-v1.1.0     # the whole site
```

A per-lecture tag uploads that deck plus a refreshed landing page and leaves
everything else on the Space alone. A `site-` tag rebuilds every published deck
and replaces the Space wholesale. The release workflow also has a manual trigger
with a dry-run option.

Publishing a deck whose manifest entry still says `published: false` is refused —
the landing page would not link to it.

## Things that will catch you out

These each cost real debugging time. They are not obvious from the Slidev docs.

**`<style>` inside a slide is scoped to that slide.** Put a class in a `<style>`
block at the bottom of your markdown, use it on slide 4, and it silently does
nothing. Deck-wide styles go in `decks/<id>/style.css`; anything a second
lecture wants goes in the theme.

**Figures live in `decks/<id>/figures/`, not `public/`.** Vite resolves an
`<img src="./figures/x.png">` in a template as a module import relative to the
markdown, so it hashes and rebases the URL for you. A `public/` asset needs an
absolute path, which then breaks under the GitHub Pages base path.

**A URL passed as a component prop is not rewritten.** Vite only rewrites `src`
attributes it can see in a template. If a component needs an image, pass it
through a slot — that is why `FigureSpotlight` takes `<img>` as its default slot
rather than a `src` prop.

**Inline maths inside a raw HTML block stays literal.** Markdown will not parse
`$...$` inside `<div>…</div>` unless blank lines separate the content from the
tags:

```html
<div class="dl-callout">

Correct: $\eta$ renders.

</div>
```

**Never write `opacity="0.5"` on an SVG element.** UnoCSS attributify scans
source text, so a literal opacity anywhere in the project emits
`[opacity~="0.5"]{opacity:0.005}` — and that CSS rule beats the SVG presentation
attribute. Use `:style="{ opacity }"`.

**Arrow keys belong to Slidev.** It binds them to slide navigation on the
window, so a focused `<input type="range">` will change slides instead of its
own value. `Slider` stops the propagation; any new keyboard control must too.

**Display maths overflows two-column slides.** KaTeX renders display mode at
1.21em. The theme caps it at body size and offers `.dl-math-sm` / `.dl-math-xs`.
If a slide still overflows, it is usually too full — split it rather than
shrinking further.

**Never nest `<v-clicks>` inside a `v-click` element.** Slidev numbers the
children before their container, so the children are "revealed" while the
container is still hidden — the clicks advance the counter and nothing happens
on screen. Reveal the container as a whole, or drop the container's `v-click`.

**Check for overflow before you tag.** Nothing warns you that a slide runs off
the canvas. Open the deck, press `o` for the overview, and look.

## Layouts and components

Layouts: `title`, `section`, `default`, `figure`, `interactive`, `end`. `figure`
has `caption` and `citation` slots; `interactive` has an `aside` rail sized with
`aside-width`.

**Prefer these over Slidev's built-in layouts.** The footer is rendered by each
of our layouts, so a slide using `two-cols-header` or `image-right` silently
loses its page number. For two columns, use `default` with a
`grid grid-cols-2` wrapper, as the template shows. (Moving the footer to a
theme-level `global-bottom.vue` does not work — Slidev only picks that file up
from the project root, and putting it there would mean one copy per deck.)

Components live in `packages/slidev-addon-dl2026/components/` and are available
in every deck without importing. Plot primitives (`Plot2D`, `PlotCurve`,
`PlotPoints`, `PlotLine`, `PlotLabel`) work in data coordinates; `WidgetFrame`
gives a widget its stage, controls and readout.

A new widget should be deterministic (use `seededRandom`, never `Math.random`),
keyboard-operable, readable in both light and dark mode, and legible in the PDF
export — which renders one page per click step.
