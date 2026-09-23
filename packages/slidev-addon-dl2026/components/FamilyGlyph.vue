<script setup lang="ts">
/*
 * One small emblem per generative family, drawn the same way everywhere that
 * family appears in lecture 07: its section divider, the overview of the four
 * losses, the comparison table and the recap. Students remember the shape
 * before the name, so the shapes never change between slides.
 *
 *   cnn        a CNN's arrow (image → label), and the same arrow reversed
 *   ae         two funnels meeting at a narrow code: the bottleneck
 *   vae        the same bottleneck, with a cloud at the middle instead of a point
 *   gan        a generator and a critic, with the critic's verdict looping back
 *   collapse   many starting points, every arrow landing on the same one
 *   diffusion  an image dissolving into noise, and the arrow that undoes it
 *   choose     a balance: no family wins every column
 */
const props = withDefaults(defineProps<{
  kind: 'cnn' | 'ae' | 'vae' | 'gan' | 'collapse' | 'diffusion' | 'choose'
  size?: number
  label?: string
}>(), {
  size: 64,
})

/* Fixed noise dots for the diffusion glyph — no randomness at render time. */
const DOTS = [
  [3, 4], [9, 2], [14, 9], [5, 14], [11, 16], [16, 3], [2, 10], [8, 9], [15, 14], [12, 6],
  [6, 6], [17, 11], [4, 17], [10, 12], [1, 1], [13, 1], [7, 17], [17, 17],
]
const DIFF = [0, 5, 11, 18].map((count, k) => ({ x: 4 + k * 24, solid: 1 - k / 3, dots: DOTS.slice(0, count) }))
</script>

<template>
  <figure class="dl-glyph" :style="{ width: `${props.size}px` }">
    <svg viewBox="0 0 100 100" :width="props.size" :height="props.size" role="img" :aria-label="props.label ?? props.kind">
      <defs>
        <marker :id="`gl-head-${props.kind}`" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 z" class="dl-glyph__head" />
        </marker>
      </defs>

      <g v-if="props.kind === 'cnn'">
        <rect x="6" y="14" width="22" height="22" rx="2" class="dl-glyph__box" />
        <polygon points="34,12 62,20 62,30 34,38" class="dl-glyph__net is-muted" />
        <circle cx="76" cy="25" r="7" class="dl-glyph__box" />
        <rect x="72" y="62" width="22" height="22" rx="2" class="dl-glyph__box is-accent" />
        <polygon points="66,60 38,68 38,78 66,86" class="dl-glyph__net" />
        <circle cx="24" cy="73" r="7" class="dl-glyph__dot" />
        <path d="M50 42 V56" class="dl-glyph__arrow" :marker-end="`url(#gl-head-${props.kind})`" />
      </g>

      <g v-else-if="props.kind === 'ae' || props.kind === 'vae'">
        <polygon points="6,18 42,40 42,60 6,82" class="dl-glyph__net" />
        <polygon points="94,18 58,40 58,60 94,82" class="dl-glyph__net" />
        <rect v-if="props.kind === 'ae'" x="44" y="42" width="12" height="16" rx="2" class="dl-glyph__box is-accent" />
        <template v-else>
          <circle cx="50" cy="50" r="15" class="dl-glyph__cloud" />
          <circle cx="50" cy="50" r="5" class="dl-glyph__dot" />
        </template>
      </g>

      <g v-else-if="props.kind === 'gan'">
        <polygon points="4,40 30,46 30,66 4,72" class="dl-glyph__net" />
        <rect x="40" y="46" width="18" height="20" rx="2" class="dl-glyph__box is-accent" />
        <polygon points="68,46 96,40 96,72 68,66" class="dl-glyph__net is-critic" />
        <path d="M31 56 H38" class="dl-glyph__arrow" :marker-end="`url(#gl-head-${props.kind})`" />
        <path d="M59 56 H66" class="dl-glyph__arrow" :marker-end="`url(#gl-head-${props.kind})`" />
        <path d="M82 36 C82 12, 18 12, 18 34" class="dl-glyph__loop" :marker-end="`url(#gl-head-${props.kind})`" />
        <text x="17" y="90" class="dl-glyph__t" text-anchor="middle">G</text>
        <text x="82" y="90" class="dl-glyph__t" text-anchor="middle">D</text>
      </g>

      <g v-else-if="props.kind === 'collapse'">
        <circle v-for="(p, i) in [[14, 16], [10, 50], [16, 84], [40, 10], [40, 90]]" :key="i" :cx="p[0]" :cy="p[1]" r="5" class="dl-glyph__box" />
        <path v-for="(p, i) in [[14, 16], [10, 50], [16, 84], [40, 10], [40, 90]]" :key="`a${i}`" :d="`M${p[0] + 5} ${p[1]} L${74} ${50}`" class="dl-glyph__arrow is-thin" :marker-end="`url(#gl-head-${props.kind})`" />
        <circle cx="82" cy="50" r="9" class="dl-glyph__dot is-danger" />
      </g>

      <g v-else-if="props.kind === 'diffusion'">
        <g v-for="(s, k) in DIFF" :key="k" :transform="`translate(${s.x} 26)`">
          <rect x="0" y="0" width="20" height="20" rx="2" class="dl-glyph__box" />
          <rect x="4" y="4" width="12" height="12" rx="1" class="dl-glyph__solid" :style="{ fillOpacity: s.solid }" />
          <circle v-for="(d, i) in s.dots" :key="i" :cx="d[0] + 1" :cy="d[1] + 1" r="1.3" class="dl-glyph__speck" />
        </g>
        <path d="M86 62 C70 80, 30 80, 14 62" class="dl-glyph__loop" :marker-end="`url(#gl-head-${props.kind})`" />
        <text x="50" y="96" class="dl-glyph__t is-sm" text-anchor="middle">learn to undo</text>
      </g>

      <g v-else-if="props.kind === 'choose'">
        <path d="M50 14 V82 M30 86 H70" class="dl-glyph__stroke" />
        <path d="M14 30 H86" class="dl-glyph__stroke" />
        <path d="M14 30 L4 58 H24 Z M86 30 L76 58 H96 Z" class="dl-glyph__pan" />
        <circle cx="50" cy="14" r="4" class="dl-glyph__dot" />
      </g>
    </svg>
    <figcaption v-if="props.label" class="dl-glyph__label">{{ props.label }}</figcaption>
  </figure>
</template>

<style scoped>
.dl-glyph {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  vertical-align: middle;
}

.dl-glyph__net {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2.4;
}

.dl-glyph__net.is-muted {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
}

.dl-glyph__net.is-critic {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
}

.dl-glyph__box {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
  stroke-width: 2;
}

.dl-glyph__box.is-accent {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-glyph__dot {
  fill: var(--dl-accent);
}

.dl-glyph__dot.is-danger {
  fill: var(--dl-danger);
}

.dl-glyph__cloud {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 1.6;
  stroke-dasharray: 3 2.5;
}

.dl-glyph__solid {
  fill: var(--dl-accent);
}

.dl-glyph__speck {
  fill: var(--dl-body);
}

.dl-glyph__arrow,
.dl-glyph__loop,
.dl-glyph__stroke {
  fill: none;
  stroke: var(--dl-body);
  stroke-width: 2.4;
}

.dl-glyph__arrow.is-thin {
  stroke-width: 1.6;
}

.dl-glyph__loop {
  stroke: var(--dl-accent);
  stroke-dasharray: 4 3;
}

.dl-glyph__head {
  fill: var(--dl-body);
}

.dl-glyph__pan {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2;
}

.dl-glyph__t {
  fill: var(--dl-heading);
  font-size: 15px;
  font-weight: 700;
}

.dl-glyph__t.is-sm {
  font-size: 10px;
  font-weight: 600;
  fill: var(--dl-muted);
}

.dl-glyph__label {
  margin-top: 0.2rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dl-body);
  text-align: center;
  white-space: nowrap;
}
</style>
