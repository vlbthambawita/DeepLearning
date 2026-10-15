<script setup lang="ts">
/*
 * A dot that travels along a path, for use inside a hand-drawn `<svg>`:
 * "the data goes this way". Put it next to the arrow it rides on, with the
 * same `d`:
 *
 *   <path class="dl-dg-arrow is-q" d="M10 50 H200" />
 *   <FlowDot path="M10 50 H200" role="q" />
 *
 * SMIL `animateMotion` rather than CSS, because it moves in the SVG's own
 * user units however the diagram is scaled. `delay` starts the dot part-way
 * along (a negative begin), so a dot never sits at the SVG origin waiting,
 * and several dots on one path spread out instead of bunching.
 *
 * Renders nothing under prefers-reduced-motion — the arrow underneath still
 * says everything. The PDF export catches the dot somewhere on its path,
 * which reads as a still.
 */
const props = withDefaults(defineProps<{
  path: string
  /** Seconds for one trip. */
  dur?: number
  /** Seconds already travelled at the start: spreads several dots out. */
  delay?: number
  role?: 'q' | 'k' | 'v' | 'enc' | 'dec' | 'pos' | 'accent' | 'body'
  r?: number
}>(), {
  dur: 1.8,
  delay: 0,
  role: 'accent',
  r: 4.5,
})

const reduce = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const fill = props.role === 'body' ? 'var(--dl-body)' : `var(--dl-${props.role})`
</script>

<template>
  <circle v-if="!reduce" :r="props.r" class="dl-flowdot" :style="{ fill }">
    <animateMotion
      :path="props.path" :dur="`${props.dur}s`" :begin="`-${props.delay}s`"
      repeatCount="indefinite" calcMode="paced"
    />
  </circle>
</template>

<style scoped>
.dl-flowdot {
  stroke: var(--dl-bg);
  stroke-width: 1.5;
}
</style>
