<script setup lang="ts">
/*
 * Scatter marks. Two shapes are enough to show a binary classification the way
 * the perceptron chapter does: circles for one class, squares for the other.
 */
import { computed } from 'vue'
import { usePlot } from '../composables/usePlot'

export interface PlotPoint {
  x: number
  y: number
  /** Any label; `shapeFor`/`colorFor` map it to an appearance. */
  cls?: string | number
  label?: string
  highlight?: boolean
}

const props = withDefaults(defineProps<{
  points: PlotPoint[]
  radius?: number
  color?: string
  /** Per-class colours, keyed by `cls`. */
  colors?: Record<string, string>
  /** Per-class shapes, keyed by `cls`. */
  shapes?: Record<string, 'circle' | 'square' | 'triangle'>
  opacity?: number
}>(), {
  radius: 5,
  opacity: 1,
})

const plot = usePlot()

const marks = computed(() => props.points.map((p, i) => {
  const key = String(p.cls ?? '')
  return {
    i,
    cx: plot.sx(p.x),
    cy: plot.sy(p.y),
    shape: props.shapes?.[key] ?? 'circle',
    fill: props.colors?.[key] ?? props.color ?? 'var(--dl-accent)',
    highlight: !!p.highlight,
    label: p.label,
  }
}))

function squarePath(cx: number, cy: number, r: number) {
  const s = r * 0.9
  return `M${cx - s},${cy - s} h${s * 2} v${s * 2} h${-s * 2} Z`
}

function trianglePath(cx: number, cy: number, r: number) {
  const s = r * 1.2
  return `M${cx},${cy - s} L${cx + s},${cy + s * 0.8} L${cx - s},${cy + s * 0.8} Z`
}
</script>

<template>
  <!--
    Opacity goes through `style`, never the SVG `opacity` attribute. UnoCSS
    attributify scans source text, so a literal `opacity="0.85"` anywhere in the
    project emits `[opacity~="0.85"]{opacity:0.0085}` — and that CSS rule beats
    the presentation attribute, silently rendering marks all but invisible.
  -->
  <g class="dl-points">
    <g v-for="m in marks" :key="m.i" :style="{ opacity: props.opacity }">
      <circle
        v-if="m.shape === 'circle'"
        :cx="m.cx" :cy="m.cy" :r="props.radius"
        :fill="m.fill"
        :class="{ 'is-highlight': m.highlight }"
      />
      <path
        v-else
        :d="m.shape === 'square' ? squarePath(m.cx, m.cy, props.radius) : trianglePath(m.cx, m.cy, props.radius)"
        :fill="m.fill"
        :class="{ 'is-highlight': m.highlight }"
      />
      <text v-if="m.label" :x="m.cx + props.radius + 4" :y="m.cy + 4">{{ m.label }}</text>
    </g>
  </g>
</template>

<style scoped>
.dl-points .is-highlight {
  stroke: var(--dl-heading);
  stroke-width: 2.5;
  paint-order: stroke;
}

.dl-points text {
  fill: var(--dl-body);
  font-size: 11px;
}
</style>
