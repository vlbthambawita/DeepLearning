<script setup lang="ts">
/*
 * One small emblem per big idea in lecture 06, drawn the same way everywhere
 * that idea appears: its section divider, the overview of the sections, and the
 * recap. The same job `RnnGlyph` does for lecture 05 and `FamilyGlyph` for
 * lecture 07 — students remember the shape before the name.
 *
 *   cut      a chain of recurrent cells with the links between them cut:
 *            delete the recurrence
 *   qkv      one query dot sending lines of different weight to three keys:
 *            attention as a soft lookup
 *   heads    four small fans side by side, each pointing somewhere else:
 *            multi-head attention
 *   block    a sideways mixing bar above a per-position trapezoid, with the
 *            residual wire around both: one transformer block
 *   encdec   two stacks, the right one reading the left: the original
 *            encoder–decoder
 *   decoder  one tall stack under a triangular mask: decoder-only
 *   fork     one trunk splitting into three stacks — plain, accent, and a
 *            pair: encoder-only, decoder-only, encoder–decoder
 *   code     a tensor slab with its (B, T, d) sizes: the PyTorch section
 *   position a word tile plus a sine wave: positional encoding
 *   train    predicted bars beside the one-hot target bar: the loss
 *
 * Opacity goes through `:style`, never a literal `opacity="…"` attribute —
 * UnoCSS attributify would emit a rule that overrides it (see CONTRIBUTING.md).
 */
const props = withDefaults(defineProps<{
  kind: 'cut' | 'qkv' | 'heads' | 'block' | 'encdec' | 'decoder' | 'fork' | 'code' | 'position' | 'train'
  size?: number
  label?: string
}>(), {
  size: 64,
})

/* qkv: the query's weight on each of three keys sets the line's width. */
const QKV = [
  { y: 18, w: 1.2, accent: false },
  { y: 50, w: 6.5, accent: true },
  { y: 82, w: 2.4, accent: false },
]
/* heads: where each of four heads points, as a key index 0..2. */
const HEADS = [0, 2, 1, 2]
/* decoder: lower-triangular mask, 4×4 — row r may look at columns 0..r. */
/* position: one period of a sine, sampled for a polyline. */
const WAVE = Array.from({ length: 25 }, (_, i) => `${10 + i * 3.4},${74 - 14 * Math.sin((i / 24) * 2 * Math.PI)}`).join(' ')
/* train: a prediction over four words, and the one-hot target. */
const PRED = [0.2, 0.55, 0.15, 0.1]
const MASK = Array.from({ length: 16 }, (_, i) => ({ r: Math.floor(i / 4), c: i % 4 }))
</script>

<template>
  <figure class="dl-tglyph" :style="{ width: `${props.size}px` }">
    <svg viewBox="0 0 100 100" :width="props.size" :height="props.size" role="img" :aria-label="props.label ?? props.kind">
      <defs>
        <marker :id="`tg-head-${props.kind}`" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 z" class="dl-tglyph__head" />
        </marker>
      </defs>

      <g v-if="props.kind === 'cut'">
        <rect v-for="k in 3" :key="k" :x="4 + (k - 1) * 34" y="36" width="24" height="28" rx="4" class="dl-tglyph__cell" />
        <path v-for="k in 2" :key="`l${k}`" :d="`M${28 + (k - 1) * 34} 50 H${38 + (k - 1) * 34}`" class="dl-tglyph__line" />
        <path v-for="k in 2" :key="`x${k}`" :d="`M${29 + (k - 1) * 34} 41 L${37 + (k - 1) * 34} 59 M${37 + (k - 1) * 34} 41 L${29 + (k - 1) * 34} 59`" class="dl-tglyph__cutmark" />
        <path d="M16 90 V68 M50 90 V68 M84 90 V68" class="dl-tglyph__arrow" :marker-end="`url(#tg-head-${props.kind})`" />
      </g>

      <g v-else-if="props.kind === 'qkv'">
        <path v-for="(k, i) in QKV" :key="i" :d="`M22 50 L74 ${k.y}`" class="dl-tglyph__weight" :class="{ 'is-accent': k.accent }" :style="{ strokeWidth: k.w }" />
        <circle cx="18" cy="50" r="10" class="dl-tglyph__dot is-accent" />
        <rect v-for="(k, i) in QKV" :key="`k${i}`" x="74" :y="k.y - 9" width="20" height="18" rx="3" class="dl-tglyph__tile" :class="{ 'is-accent': k.accent }" />
        <text x="18" y="54.5" class="dl-tglyph__t is-inv" text-anchor="middle">q</text>
      </g>

      <g v-else-if="props.kind === 'heads'">
        <g v-for="(to, h) in HEADS" :key="h">
          <circle :cx="14 + h * 24" cy="80" r="6" class="dl-tglyph__dot" :class="{ 'is-accent': h === 0 }" />
          <path :d="`M${14 + h * 24} 74 L${14 + h * 24 + (to - 1) * 9} 30`" class="dl-tglyph__weight" :class="{ 'is-accent': h === 0 }" :style="{ strokeWidth: 3 }" />
        </g>
        <rect v-for="k in 4" :key="`t${k}`" :x="4 + (k - 1) * 24" y="14" width="20" height="14" rx="3" class="dl-tglyph__tile" />
      </g>

      <g v-else-if="props.kind === 'block'">
        <rect x="16" y="54" width="62" height="14" rx="3" class="dl-tglyph__tile is-accent" />
        <path d="M24 61 H70" class="dl-tglyph__line is-thin" />
        <polygon points="26,22 70,22 62,40 34,40" class="dl-tglyph__cell" />
        <path d="M47 94 V70 M47 52 V42 M47 20 V6" class="dl-tglyph__arrow" :marker-end="`url(#tg-head-${props.kind})`" />
        <path d="M47 80 H90 V12 H52" class="dl-tglyph__resid" :marker-end="`url(#tg-head-${props.kind})`" />
      </g>

      <g v-else-if="props.kind === 'encdec'">
        <rect v-for="k in 3" :key="`e${k}`" x="8" :y="14 + (k - 1) * 26" width="30" height="20" rx="3" class="dl-tglyph__tile" />
        <rect v-for="k in 3" :key="`d${k}`" x="62" :y="14 + (k - 1) * 26" width="30" height="20" rx="3" class="dl-tglyph__cell" />
        <path d="M38 24 C 50 24, 50 50, 60 50" class="dl-tglyph__resid" :marker-end="`url(#tg-head-${props.kind})`" />
      </g>

      <g v-else-if="props.kind === 'decoder'">
        <rect v-for="m in MASK" :key="`${m.r}-${m.c}`" :x="30 + m.c * 15" :y="8 + m.r * 15" width="13" height="13" rx="1.5" :class="m.c <= m.r ? 'dl-tglyph__mask is-on' : 'dl-tglyph__mask'" />
        <rect v-for="k in 2" :key="`s${k}`" x="30" :y="70 + (k - 1) * 14" width="58" height="11" rx="2" class="dl-tglyph__cell" />
        <path d="M14 96 V12" class="dl-tglyph__arrow" :marker-end="`url(#tg-head-${props.kind})`" />
      </g>

      <g v-else-if="props.kind === 'fork'">
        <path d="M50 96 V80 M50 80 L16 60 M50 80 V60 M50 80 L84 60" class="dl-tglyph__line" />
        <rect v-for="k in 3" :key="`a${k}`" x="6" :y="6 + (k - 1) * 16" width="20" height="12" rx="2" class="dl-tglyph__tile" />
        <rect v-for="k in 3" :key="`b${k}`" x="40" :y="6 + (k - 1) * 16" width="20" height="12" rx="2" class="dl-tglyph__cell" />
        <rect v-for="k in 3" :key="`c${k}`" x="72" :y="6 + (k - 1) * 16" width="10" height="12" rx="2" class="dl-tglyph__tile" />
        <rect v-for="k in 3" :key="`d${k}`" x="85" :y="6 + (k - 1) * 16" width="10" height="12" rx="2" class="dl-tglyph__cell" />
      </g>

      <g v-else-if="props.kind === 'code'">
        <rect v-for="k in 3" :key="k" :x="24 + (k - 1) * 8" :y="16 + (k - 1) * 8" width="50" height="50" rx="2" class="dl-tglyph__slab" />
        <text x="16" y="54" class="dl-tglyph__t is-sm" text-anchor="middle">B</text>
        <text x="65" y="94" class="dl-tglyph__t is-sm" text-anchor="middle">T</text>
        <text x="90" y="20" class="dl-tglyph__t is-sm" text-anchor="middle">d</text>
      </g>
      <g v-else-if="props.kind === 'position'">
        <rect x="10" y="10" width="80" height="26" rx="4" class="dl-tglyph__tile" />
        <rect v-for="k in 4" :key="k" :x="14 + (k - 1) * 19" y="15" width="15" height="16" rx="2" class="dl-tglyph__cell" />
        <text x="50" y="54" class="dl-tglyph__t" text-anchor="middle">+</text>
        <polyline :points="WAVE" class="dl-tglyph__line" style="stroke: var(--dl-accent)" />
      </g>

      <g v-else-if="props.kind === 'train'">
        <line x1="6" y1="84" x2="94" y2="84" class="dl-tglyph__line is-thin" />
        <rect v-for="(p, i) in PRED" :key="`p${i}`" :x="8 + i * 11" :y="84 - p * 100" width="8" :height="p * 100" class="dl-tglyph__tile" />
        <text x="50" y="58" class="dl-tglyph__t is-sm" text-anchor="middle">vs</text>
        <rect v-for="i in 4" :key="`t${i}`" :x="58 + (i - 1) * 9" :y="i === 2 ? 20 : 82" width="7" :height="i === 2 ? 64 : 2" class="dl-tglyph__cell" />
      </g>
    </svg>
    <figcaption v-if="$slots.default" class="dl-tglyph__label"><slot /></figcaption>
  </figure>
</template>

<style scoped>
.dl-tglyph {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

.dl-tglyph__tile,
.dl-tglyph__slab {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
  stroke-width: 2;
}

.dl-tglyph__slab {
  fill: var(--dl-bg);
}

.dl-tglyph__tile.is-accent,
.dl-tglyph__cell {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2;
}

.dl-tglyph__arrow,
.dl-tglyph__line {
  fill: none;
  stroke: var(--dl-body);
  stroke-width: 2.4;
}

.dl-tglyph__line.is-thin {
  stroke: var(--dl-accent);
  stroke-width: 1.4;
  stroke-dasharray: 3 2;
}

.dl-tglyph__cutmark {
  fill: none;
  stroke: var(--dl-danger);
  stroke-width: 2.6;
}

.dl-tglyph__weight {
  fill: none;
  stroke: var(--dl-muted);
  stroke-linecap: round;
}

.dl-tglyph__weight.is-accent {
  stroke: var(--dl-accent);
}

.dl-tglyph__resid {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 2.2;
  stroke-dasharray: 4 3;
}

.dl-tglyph__mask {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1;
}

.dl-tglyph__mask.is-on {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-tglyph__dot {
  fill: var(--dl-muted);
}

.dl-tglyph__dot.is-accent {
  fill: var(--dl-accent);
}

.dl-tglyph__head {
  fill: var(--dl-body);
}

.dl-tglyph__t {
  fill: var(--dl-heading);
  font-size: 15px;
  font-weight: 700;
}

.dl-tglyph__t.is-inv {
  fill: var(--dl-bg);
  font-size: 13px;
}

.dl-tglyph__t.is-sm {
  font-size: 12px;
  font-weight: 600;
  fill: var(--dl-muted);
}

.dl-tglyph__label {
  margin-top: 0.2rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dl-body);
  text-align: center;
  white-space: nowrap;
}
</style>
