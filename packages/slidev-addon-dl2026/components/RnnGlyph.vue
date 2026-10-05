<script setup lang="ts">
/*
 * One small emblem per big idea in lecture 05, drawn the same way everywhere
 * that idea appears: its section divider, the overview of the sections, and the
 * recap. The same job `FamilyGlyph` does for lecture 07 — students remember the
 * shape before the name, so the shapes never change between slides.
 *
 *   sequence  three word tiles in a row, read left to right
 *   loop      one cell whose output curls back into itself: the state
 *   fade      a chain of arrows, each fainter than the last: the vanishing gradient
 *   gate      a valve on the line: a gated cell decides what passes
 *   map       words as points on a plane: an embedding
 *   shape     a stack of slabs with its three sizes marked: a (B, T, F) tensor
 *   generate  a cell writing one tile, which becomes its next input
 *
 * Opacity goes through `:style`, never a literal `opacity="…"` attribute —
 * UnoCSS attributify would emit a rule that overrides it (see CONTRIBUTING.md).
 */
const props = withDefaults(defineProps<{
  kind: 'sequence' | 'loop' | 'fade' | 'gate' | 'map' | 'shape' | 'generate'
  size?: number
  label?: string
}>(), {
  size: 64,
})

const FADE = [1, 0.62, 0.38, 0.2]
const MAP = [
  { x: 72, y: 26, near: true },
  { x: 82, y: 36, near: true },
  { x: 22, y: 30, near: false },
  { x: 30, y: 72, near: false },
  { x: 64, y: 78, near: false },
]
</script>

<template>
  <figure class="dl-rglyph" :style="{ width: `${props.size}px` }">
    <svg viewBox="0 0 100 100" :width="props.size" :height="props.size" role="img" :aria-label="props.label ?? props.kind">
      <defs>
        <marker :id="`rg-head-${props.kind}`" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 z" class="dl-rglyph__head" />
        </marker>
      </defs>

      <g v-if="props.kind === 'sequence'">
        <rect v-for="k in 3" :key="k" :x="4 + (k - 1) * 32" y="38" width="26" height="24" rx="3" class="dl-rglyph__tile" :class="{ 'is-accent': k === 2 }" />
        <path d="M8 76 H90" class="dl-rglyph__arrow" :marker-end="`url(#rg-head-${props.kind})`" />
      </g>

      <g v-else-if="props.kind === 'loop'">
        <rect x="22" y="36" width="40" height="30" rx="5" class="dl-rglyph__cell" />
        <path d="M62 44 C 92 30, 92 72, 62 58" class="dl-rglyph__loop" :marker-end="`url(#rg-head-${props.kind})`" />
        <path d="M42 90 V70" class="dl-rglyph__arrow" :marker-end="`url(#rg-head-${props.kind})`" />
        <path d="M42 34 V12" class="dl-rglyph__arrow" :marker-end="`url(#rg-head-${props.kind})`" />
      </g>

      <g v-else-if="props.kind === 'fade'">
        <g v-for="(o, k) in FADE" :key="k" :style="{ opacity: o }">
          <rect :x="64 - k * 22" y="34" width="18" height="30" rx="3" class="dl-rglyph__cell" />
          <path v-if="k < FADE.length - 1" :d="`M${63 - k * 22} 49 H${53 - k * 22}`" class="dl-rglyph__grad" :marker-end="`url(#rg-head-${props.kind})`" />
        </g>
        <text x="97" y="55" class="dl-rglyph__t" text-anchor="end">L</text>
      </g>

      <g v-else-if="props.kind === 'gate'">
        <path d="M6 50 H94" class="dl-rglyph__line" />
        <circle cx="50" cy="50" r="15" class="dl-rglyph__valve" />
        <path d="M40 60 L60 40" class="dl-rglyph__stroke" />
        <path d="M50 20 V33" class="dl-rglyph__arrow" :marker-end="`url(#rg-head-${props.kind})`" />
        <text x="50" y="16" class="dl-rglyph__t is-sm" text-anchor="middle">σ</text>
      </g>

      <g v-else-if="props.kind === 'map'">
        <path d="M10 90 H92 M10 90 V8" class="dl-rglyph__axis" />
        <circle v-for="(p, i) in MAP" :key="i" :cx="p.x" :cy="p.y" :r="p.near ? 6 : 5" :class="p.near ? 'dl-rglyph__dot is-accent' : 'dl-rglyph__dot'" />
        <path d="M72 26 L82 36" class="dl-rglyph__stroke is-thin" />
      </g>

      <g v-else-if="props.kind === 'shape'">
        <rect v-for="k in 3" :key="k" :x="22 + (k - 1) * 8" :y="20 + (k - 1) * 8" width="50" height="50" rx="2" class="dl-rglyph__slab" />
        <text x="14" y="58" class="dl-rglyph__t is-sm" text-anchor="middle">B</text>
        <text x="63" y="98" class="dl-rglyph__t is-sm" text-anchor="middle">T</text>
        <text x="88" y="24" class="dl-rglyph__t is-sm" text-anchor="middle">F</text>
      </g>

      <g v-else-if="props.kind === 'generate'">
        <rect x="8" y="34" width="34" height="28" rx="5" class="dl-rglyph__cell" />
        <path d="M42 48 H58" class="dl-rglyph__arrow" :marker-end="`url(#rg-head-${props.kind})`" />
        <rect x="62" y="36" width="28" height="24" rx="3" class="dl-rglyph__tile is-accent" />
        <path d="M76 62 C 76 92, 25 92, 25 66" class="dl-rglyph__loop" :marker-end="`url(#rg-head-${props.kind})`" />
      </g>
    </svg>
    <figcaption v-if="$slots.default" class="dl-rglyph__label"><slot /></figcaption>
  </figure>
</template>

<style scoped>
.dl-rglyph {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
}

.dl-rglyph__tile,
.dl-rglyph__cell,
.dl-rglyph__slab {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
  stroke-width: 2;
}

.dl-rglyph__cell {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-rglyph__tile.is-accent {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-rglyph__slab {
  fill: var(--dl-bg);
}

.dl-rglyph__arrow,
.dl-rglyph__line,
.dl-rglyph__stroke,
.dl-rglyph__axis {
  fill: none;
  stroke: var(--dl-body);
  stroke-width: 2.4;
}

.dl-rglyph__axis {
  stroke: var(--dl-muted);
  stroke-width: 1.6;
}

.dl-rglyph__stroke.is-thin {
  stroke-width: 1.4;
  stroke-dasharray: 3 2;
}

.dl-rglyph__loop {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 2.4;
  stroke-dasharray: 4 3;
}

.dl-rglyph__grad {
  fill: none;
  stroke: var(--dl-danger);
  stroke-width: 2.2;
}

.dl-rglyph__valve {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2.4;
}

.dl-rglyph__dot {
  fill: var(--dl-muted);
}

.dl-rglyph__dot.is-accent {
  fill: var(--dl-accent);
}

.dl-rglyph__head {
  fill: var(--dl-body);
}

.dl-rglyph__t {
  fill: var(--dl-heading);
  font-size: 15px;
  font-weight: 700;
}

.dl-rglyph__t.is-sm {
  font-size: 12px;
  font-weight: 600;
  fill: var(--dl-muted);
}

.dl-rglyph__label {
  margin-top: 0.2rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dl-body);
  text-align: center;
  white-space: nowrap;
}
</style>
