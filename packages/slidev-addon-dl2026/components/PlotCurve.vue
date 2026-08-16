<script setup lang="ts">
/*
 * A function or a polyline drawn in data coordinates.
 *
 *   <PlotCurve :fn="x => 1 / (1 + Math.exp(-x))" />
 *   <PlotCurve :points="trajectory" dashed />
 */
import { computed } from 'vue'
import { usePlot } from '../composables/usePlot'

const props = withDefaults(defineProps<{
  /** Sampled across the plot's x domain. Ignored when `points` is given. */
  fn?: (x: number) => number
  points?: Array<{ x: number, y: number } | [number, number]>
  samples?: number
  color?: string
  width?: number
  dashed?: boolean
  /** Fill the area between the curve and this y value. */
  fillTo?: number
  opacity?: number
}>(), {
  samples: 160,
  width: 2.5,
  dashed: false,
  opacity: 1,
})

const plot = usePlot()

const sampled = computed<Array<{ x: number, y: number }>>(() => {
  if (props.points)
    return props.points.map(p => (Array.isArray(p) ? { x: p[0], y: p[1] } : p))

  if (!props.fn)
    return []

  const [a, b] = plot.xDomain.value
  const n = Math.max(props.samples, 2)
  const out: Array<{ x: number, y: number }> = []
  for (let i = 0; i < n; i++) {
    const x = a + ((b - a) * i) / (n - 1)
    out.push({ x, y: props.fn(x) })
  }
  return out
})

/**
 * Break the path wherever the function is undefined or shoots off the domain,
 * so an asymptote renders as a gap instead of a near-vertical line joining
 * +∞ to −∞.
 */
const segments = computed(() => {
  const [lo, hi] = plot.yDomain.value
  const slack = (hi - lo) * 4
  const out: string[] = []
  let current: string[] = []

  for (const p of sampled.value) {
    const usable = Number.isFinite(p.y) && p.y > lo - slack && p.y < hi + slack
    if (!usable) {
      if (current.length > 1)
        out.push(current.join(' '))
      current = []
      continue
    }
    current.push(`${current.length ? 'L' : 'M'}${plot.sx(p.x).toFixed(2)},${plot.sy(p.y).toFixed(2)}`)
  }
  if (current.length > 1)
    out.push(current.join(' '))
  return out
})

const areaPath = computed(() => {
  if (props.fillTo === undefined || !sampled.value.length)
    return null
  const [lo, hi] = plot.yDomain.value
  const usable = sampled.value.filter(p => Number.isFinite(p.y))
  if (usable.length < 2)
    return null

  const clamp = (y: number) => Math.min(Math.max(y, lo), hi)
  const top = usable.map((p, i) =>
    `${i ? 'L' : 'M'}${plot.sx(p.x).toFixed(2)},${plot.sy(clamp(p.y)).toFixed(2)}`).join(' ')
  const baseY = plot.sy(clamp(props.fillTo)).toFixed(2)
  return `${top} L${plot.sx(usable[usable.length - 1].x).toFixed(2)},${baseY} L${plot.sx(usable[0].x).toFixed(2)},${baseY} Z`
})
</script>

<template>
  <g class="dl-curve">
    <path
      v-if="areaPath"
      :d="areaPath"
      :fill="props.color ?? 'var(--dl-accent)'"
      :opacity="0.12 * props.opacity"
      stroke="none"
    />
    <path
      v-for="(d, i) in segments" :key="i"
      :d="d"
      fill="none"
      :stroke="props.color ?? 'var(--dl-accent)'"
      :stroke-width="props.width"
      :stroke-dasharray="props.dashed ? '6 5' : undefined"
      :opacity="props.opacity"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</template>
