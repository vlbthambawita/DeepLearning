---
name: lecture-deck
description: Author a PGR207 lecture deck — use whenever the task is building slides for a new lecture, chapter or week, converting a 2025 PDF deck into Slidev, adding or reworking slides in decks/lecture-XX/slides.md, or writing a new teaching widget for the dl2026 addon.
---

# Building a lecture deck

These decks are lectures, not documents. The test for every slide is whether it
does something a handout could not: reveal in an order, respond to a control, or
carry a number the room can check by hand.

## Read before writing anything

1. **`CONTRIBUTING.md`** — "Things that will catch you out" is the real reference.
   Read all of it; each item cost someone real debugging time.
2. **The most recent deck** (`decks/lecture-06/slides.md` at time of writing).
   Match its voice and rhythm, not `_template`'s — the template shows mechanics,
   the shipped decks show the standard.
3. **`TODO/summary_slideset_<prev>.md`** — the concept summary for the lecture
   before yours. The new deck has to pick up exactly where that one stopped.
4. **`PLAN.md` § "Content conversion strategy"** — only if converting a 2025 PDF.

## 1. Fix the through-line first, in `TODO/plan_slideset_XX.md`

Do not open `slides.md` until this exists and the user has seen it:

- **One sentence** saying what the room can do at the end that it could not at
  the start.
- **The hand-off**: what the previous lecture ended on, and how slide 3 picks it
  up. Lecture 06 opens on week 6's two walls and spends the deck knocking down
  the second — that continuity is deliberate.
- **The running example**: one concrete case carried across every section, with
  real numbers the room can verify. Lecture 06 runs "the river bank" through
  four dimensions from §01 to §03, shared by five widgets via
  `composables/useAttention.ts`. A deck without a running example degenerates
  into a list of facts.
- **Sections with a slide budget**, and which one is the lecture (the rest are
  compressible if the session runs late — say so in the speaker notes).
- **The payoff slide**: the one moment the whole deck is built to deliver.

## 2. Scaffold

```bash
cp -r decks/_template decks/lecture-07
```

Change the three `CHANGE ME` values, then add a `decks.config.json` entry with
`"published": false`. `week` is the **teaching week, not the lecture number**
(lecture-05 is week 6, lecture-06 is week 7). `npm run build:all` builds
unpublished decks so CI catches breakage; nothing links them until the flag flips.

Never edit `decks/_template/` while authoring — it is absent from
`decks.config.json` on purpose and exists only to be copied.

## 3. Source material (converting a 2025 deck)

```bash
python3 scripts/extract_figures.py --only lecture-07   # then open the contact sheet
```

Tier every source slide: **A** native markdown + `<v-clicks>` · **B** re-drawn
diagram (Mermaid or hand-authored SVG) · **C** extracted raster, only when
re-drawing would lose meaning · **D** a widget.

Equations are **always** retyped as KaTeX, never shipped as crops — that is what
unlocks term-by-term reveals. Copying a figure in is a deliberate act: the script
never does it for you. Figures go in `decks/<id>/figures/` and get a `<Citation>`.

## 4. Write the slides

Shape of the recent decks — aim here, not at the template:

| | L04 | L05 | L06 |
|---|---|---|---|
| slides | 74 | 65 | 58 |
| sections | 8 | 7 | 7 |
| interactive | 26 | 16 | 13 |
| speaker-note blocks | 65 | 57 | 50 |

### Text budget

Prose on `default` slides has crept up every deck — median words a student has
to *read* (maths, code and speaker notes excluded):

| | L01 | L02 | L03 | L04 | L05 | L06 |
|---|---|---|---|---|---|---|
| `default` median | 27 | 51 | 71 | 78 | 87 | **102** |
| `interactive` aside median | 28 | 54 | 46 | 54 | 53 | 51 |

The asides held; the `default` slides did not. Hold a new deck to the earlier
numbers — **70 words on a `default` slide, 55 in an aside, 40 under a figure** —
and measure rather than guess:

```bash
python3 .claude/skills/lecture-deck/slide-stats.py lecture-07
```

It prints every slide over budget and marks the ones that are `<- words only`.
A slide that trips both is the one to fix first.

### Reach for a picture before more sentences

When a slide runs over, the first move is not to trim adjectives — it is to ask
what the words are describing, and show that instead. Climb this ladder only as
far as the concept needs:

1. **Split the slide.** Two ideas wearing one heading is the most common cause.
2. **A markdown table**, when the content is genuinely a comparison or a ledger
   of shapes (`dl-ledger`).
3. **A diagram** — Mermaid for a flow or taxonomy, hand-authored SVG when the
   arrows carry meaning. Any sentence containing *then*, *feeds into*, *becomes*
   or *is passed to* is describing a diagram.
4. **A widget**, when the point is what happens as something *changes* — a
   parameter, a step, an input. If nothing moves, it does not need to be a widget.

Text that survives the move is the argument the picture cannot make; move
everything else into the speaker notes, which have no budget at all. A
`default` slide that is words-only and over budget should be rare and deliberate.

Rules that hold on every slide:

- **Every slide declares a `layout:`** from the six theme layouts — `title`,
  `section`, `default`, `figure`, `interactive`, `end`. Slidev's built-ins drop
  the footer and page number.
- `figure` and `interactive` take their heading from **`heading:`**, not
  `title:`. Set both when you also want the nav and exported outline to name it.
- `section` slides carry `index: "01"`.
- **Speaker notes on nearly every slide**, in `<!-- -->`: what to say, what the
  room gets wrong every year, what to cut when short on time. They are stripped
  from anything published, so write them for the presenter, not the student.
- Bullets go inside `<v-clicks>`, one idea each. The sentence the room should
  leave with goes in a `<div v-click class="dl-callout">`.
- Two columns: `default` + `<div class="grid grid-cols-2 gap-10">`.
- Code: ≤ 15 lines, with the shape comments that are the reason it is on a
  slide at all, and a click-range fence:

  ````
  ```python {all|1-2|4-5|all}{lines:true}
  ````
- A `<PollSlide>` for the misconception the cohort makes every year — one per
  section is plenty.
- Theme classes: `dl-callout`, `dl-card`, `dl-ledger`, `dl-tight`, `dl-rule`,
  `dl-secondary`, `dl-wrong`, `dl-prompt`, `dl-reveal`, `dl-math-sm`, `dl-math-xs`.

## 5. Reuse components before building one

```bash
ls packages/slidev-addon-dl2026/components/    # ~70 widgets already exist
```

Stable across decks: `Citation`, `LinkCard`, `PollSlide`, `SyllabusTimeline`,
`WidgetFrame`, `Slider`, `StepButton`, and the plot primitives `Plot2D`,
`PlotCurve`, `PlotPoints`, `PlotLine`, `PlotLabel` (they work in data
coordinates). Everything is auto-registered — never import in a deck.

A new widget must be: deterministic (`seededRandom` from `composables/useRandom.ts`,
never `Math.random`), keyboard-operable **and stop arrow-key propagation** (Slidev
owns the arrow keys), driven off `$clicks` so the one-page-per-click PDF export
captures real states, legible in light and dark mode, and wrapped in
`WidgetFrame` so every widget's controls sit in the same place. Its data and
logic go in `composables/` — a prop default cannot reference a `<script setup>`
constant.

## 6. Verify before saying it is done

```bash
npm run build:all
npm run preview &
npm run check -- lecture-07
npm run check -- lecture-07 --dark
npm run check -- lecture-07 --shots /tmp/deck    # a PNG per slide
```

`check` only catches **vertical** clipping. A widget with a fixed rem grid slides
sideways off the stage and the check says nothing — eyeball those with `--shots`
after any change to cell size or `aside-width`. Also press `o` in the deck for
the overview and look at it.

## 7. Final pass: names, symbols and numbers

Do this over the whole deck at the end, in one sitting — it catches what
slide-by-slide authoring cannot.

**Notation.** `decks/lecture-02` slide "The notation" is the course's canonical
declaration and says so in its notes: rows of $X$ are examples $\mathbf{x}^{(i)}$,
superscript $(i)$ indexes the example, subscript $j$ the feature. The decks are
currently consistent with it — $\eta$ for the learning rate, $^\top$ for
transpose (never `^T` in rendered maths), $\hat{y}$ for a prediction,
$\mathbf{w}$/$\mathbf{b}$ for parameters, $\mathbf{h}_t$ for a hidden state,
$d_k$ / $d_{model}$ for widths. Keep it that way, and check with:

```bash
grep -o '\\mathbf{[^}]*}\|\\hat{[^}]*}\|\\[a-zA-Z]\+\|\b[A-Za-z]_{[^}]*}' decks/lecture-07/slides.md \
 | grep -vE '^\\(left|right|frac|text|begin|end|times|cdot|to|quad|operatorname|sum|prod|in|mathbb|top|sqrt|cdots|ldots|approx|le|ge|neq|langle|rangle)$' \
 | sort | uniq -c | sort -rn
```

Then read the list and confirm, for each symbol:

- It is **introduced before its first use**, in words, on the slide that uses it.
- It means **one thing in this deck**. Across decks a letter may be reused for a
  different quantity when that is the field's own convention ($\alpha$ is never
  the learning rate in these decks; in L05 and L06 it is an attention weight) —
  but say so out loud on the slide where the meaning changes.
- It **matches the code** on the same slide: if the maths says $W_{hh}$, the
  tensor is `W_hh`, not `weights2`.
- It **matches the widget**: axis labels, readouts and legends use the slide's
  symbols, not the component author's internal variable names.

**Names.** Every acronym expanded at first use. One name per concept for the
whole deck — do not let "activation", "non-linearity" and "squashing function"
all appear for the same thing. Variable names in code slides read like the
lecture, not like a scratch script (`logits`, `hidden`, not `x2`, `tmp`).

**Numbers.** Re-check the running example's arithmetic by hand once the deck is
finished; those are the numbers the room will check. Confirm every shape in a
ledger against the code that produces it.

## 8. Close the loop

Write `TODO/summary_slideset_XX.md`: the through-line, the running example with
its actual numbers, and a short per-section account of what each slide is doing
and why. The next deck starts by reading it.

Flip `"published": true` only when the user says so. Publishing is tag-driven —
never push a tag unless asked.

## Pre-flight checklist

- `<style>` inside a slide is scoped to that slide → deck-wide CSS goes in
  `decks/<id>/style.css`; anything a second deck wants goes in the theme.
- Figures live in `decks/<id>/figures/` and are referenced as
  `<img src="./figures/x.png">` — a URL passed as a component **prop** is not
  rewritten by Vite, so pass images through a slot instead.
- `$...$` inside a raw `<div>` stays literal unless blank lines separate the
  content from the tags.
- Never write a literal `opacity="0.5"` on an SVG element — UnoCSS attributify
  poisons it. Use `:style="{ opacity }"`.
- Never nest `<v-clicks>` inside a `v-click` element — the children are numbered
  before their container and the clicks do nothing on screen.
- Display maths in an `interactive` aside pushes the widget off the canvas —
  describe the matrix in words or move it to a `default` slide.
- If a slide overflows after shrinking the maths, it is too full. Split it.
- A symbol that appears on a slide but was never introduced is a bug, the same
  as a broken import.
- `^T` belongs only in speaker notes; rendered maths uses `^\top`.
