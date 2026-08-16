<script setup lang="ts">
/*
 * The 2D plotting surface every quantitative widget draws on: the loss bowl,
 * the decision boundary, activation functions, the standardisation scatter.
 *
 * Children position themselves in data coordinates via `usePlot()`. Nothing in
 * here is specific to any one lecture.
 */
import { computed, provide, ref, toRef, useId } from 'vue'
import { PLOT_KEY, formatTick, niceTicks } from '../composables/usePlot'

const props = withDefaults(defineProps<{
  xDomain?: [number, number]
  yDomain?: [number, number]
  /** SVG user-space size. The element itself scales to its container. */
  width?: number
  height?: number
  xLabel?: string
  yLabel?: string
  /** Tick count hint, or explicit tick values. */
  xTicks?: number | number[]
  yTicks?: number | number[]
  grid?: boolean
  /** Draw the axes through the data origin rather than along the edges. */
  originAxes?: boolean
  padding?: { top?: number, right?: number, bottom?: number, left?: number }
}>(), {
  xDomain: () => [0, 1],
  yDomain: () => [0, 1],
  width: 520,
  height: 320,
  xTicks: 6,
  yTicks: 5,
  grid: true,
  originAxes: false,
})

const pad = computed(() => ({
  top: props.padding?.top ?? 14,
  right: props.padding?.right ?? 16,
  bottom: props.padding?.bottom ?? (props.xLabel ? 42 : 28),
  left: props.padding?.left ?? (props.yLabel ? 52 : 40),
}))

const inner = computed(() => ({
  x: pad.value.left,
  y: pad.value.top,
  width: Math.max(props.width - pad.value.left - pad.value.right, 1),
  height: Math.max(props.height - pad.value.top - pad.value.bottom, 1),
}))

const sx = (x: number) => {
  const [a, b] = props.xDomain
  return inner.value.x + ((x - a) / (b - a || 1)) * inner.value.width
}
const sy = (y: number) => {
  const [a, b] = props.yDomain
  return inner.value.y + (1 - (y - a) / (b - a || 1)) * inner.value.height
}
const ix = (px: number) => {
  const [a, b] = props.xDomain
  return a + ((px - inner.value.x) / inner.value.width) * (b - a)
}
const iy = (py: number) => {
  const [a, b] = props.yDomain
  return a + (1 - (py - inner.value.y) / inner.value.height) * (b - a)
}

provide(PLOT_KEY, {
  sx,
  sy,
  ix,
  iy,
  xDomain: toRef(props, 'xDomain') as any,
  yDomain: toRef(props, 'yDomain') as any,
  inner,
})

const xTickValues = computed(() =>
  Array.isArray(props.xTicks) ? props.xTicks : niceTicks(props.xDomain[0], props.xDomain[1], props.xTicks))
const yTickValues = computed(() =>
  Array.isArray(props.yTicks) ? props.yTicks : niceTicks(props.yDomain[0], props.yDomain[1], props.yTicks))

// With originAxes the axis lines sit at data zero when that is inside the
// domain, and fall back to the edge when it is not.
const axisX = computed(() => props.originAxes
  ? sy(Math.min(Math.max(0, props.yDomain[0]), props.yDomain[1]))
  : inner.value.y + inner.value.height)
const axisY = computed(() => props.originAxes
  ? sx(Math.min(Math.max(0, props.xDomain[0]), props.xDomain[1]))
  : inner.value.x)

const svg = ref<SVGSVGElement | null>(null)
const clipId = `dl-plot-clip-${useId()}`

/** Pointer position in data coordinates, for widgets that accept dragging. */
function dataAt(event: PointerEvent): { x: number, y: number } | null {
  const el = svg.value
  if (!el)
    return null
  const rect = el.getBoundingClientRect()
  const px = ((event.clientX - rect.left) / rect.width) * props.width
  const py = ((event.clientY - rect.top) / rect.height) * props.height
  return { x: ix(px), y: iy(py) }
}

defineExpose({ dataAt, sx, sy, ix, iy })
</script>

<template>
  <svg
    ref="svg"
    class="dl-plot"
    :viewBox="`0 0 ${props.width} ${props.height}`"
    preserveAspectRatio="xMidYMid meet"
    role="img"
  >
    <g v-if="props.grid" class="dl-plot__grid">
      <line
        v-for="t in xTickValues" :key="`gx${t}`"
        :x1="sx(t)" :x2="sx(t)"
        :y1="inner.y" :y2="inner.y + inner.height"
      />
      <line
        v-for="t in yTickValues" :key="`gy${t}`"
        :x1="inner.x" :x2="inner.x + inner.width"
        :y1="sy(t)" :y2="sy(t)"
      />
    </g>

    <g class="dl-plot__axes">
      <line :x1="inner.x" :x2="inner.x + inner.width" :y1="axisX" :y2="axisX" />
      <line :x1="axisY" :x2="axisY" :y1="inner.y" :y2="inner.y + inner.height" />
    </g>

    <!--
      Tick *marks* sit on the axis, which may run through the origin; tick
      *labels* always sit on the frame edge. Letting labels follow a
      through-origin axis buries them in the middle of the data and collides the
      two zeros on top of each other.
    -->
    <g class="dl-plot__ticks">
      <template v-for="t in xTickValues" :key="`tx${t}`">
        <line :x1="sx(t)" :x2="sx(t)" :y1="axisX" :y2="axisX + 5" />
        <text :x="sx(t)" :y="inner.y + inner.height + 17" text-anchor="middle">{{ formatTick(t) }}</text>
      </template>
      <template v-for="t in yTickValues" :key="`ty${t}`">
        <line :x1="axisY - 5" :x2="axisY" :y1="sy(t)" :y2="sy(t)" />
        <text :x="inner.x - 9" :y="sy(t) + 4" text-anchor="end">{{ formatTick(t) }}</text>
      </template>
    </g>

    <!--
      Marks are clipped to the plot area. A decision boundary or a diverging
      trajectory legitimately runs off the domain, and without this it paints
      straight across the rest of the slide.
    -->
    <defs>
      <clipPath :id="clipId">
        <rect :x="inner.x" :y="inner.y" :width="inner.width" :height="inner.height" />
      </clipPath>
    </defs>
    <g :clip-path="`url(#${clipId})`">
      <slot />
    </g>

    <!-- Annotations that are allowed to sit outside the axes. -->
    <slot name="overlay" />

    <text
      v-if="props.xLabel"
      class="dl-plot__label"
      :x="inner.x + inner.width / 2" :y="props.height - 6"
      text-anchor="middle"
    >{{ props.xLabel }}</text>
    <text
      v-if="props.yLabel"
      class="dl-plot__label"
      :x="-(inner.y + inner.height / 2)" :y="13"
      text-anchor="middle" transform="rotate(-90)"
    >{{ props.yLabel }}</text>
  </svg>
</template>

<style scoped>
.dl-plot {
  width: 100%;
  height: 100%;
  overflow: visible;
  font-family: inherit;
}

.dl-plot__grid line {
  stroke: var(--dl-border);
  stroke-width: 1;
}

.dl-plot__axes line {
  stroke: var(--dl-muted);
  stroke-width: 1.5;
}

.dl-plot__ticks line {
  stroke: var(--dl-muted);
  stroke-width: 1;
}

.dl-plot__ticks text {
  fill: var(--dl-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.dl-plot__label {
  fill: var(--dl-body);
  font-size: 12px;
}
</style>
