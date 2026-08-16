<script setup lang="ts">
/*
 * A straight line in data coordinates, optionally arrow-headed.
 *
 * Used for decision boundaries (`<PlotLine :from="..." :to="..." />`) and for
 * the gradient-step arrows in the descent widget.
 */
import { computed, useId } from 'vue'
import { usePlot } from '../composables/usePlot'

const props = withDefaults(defineProps<{
  from: [number, number]
  to: [number, number]
  color?: string
  width?: number
  dashed?: boolean
  arrow?: boolean
  opacity?: number
}>(), {
  width: 2,
  dashed: false,
  arrow: false,
  opacity: 1,
})

const plot = usePlot()
const markerId = `dl-arrow-${useId()}`

const p1 = computed(() => ({ x: plot.sx(props.from[0]), y: plot.sy(props.from[1]) }))
const p2 = computed(() => ({ x: plot.sx(props.to[0]), y: plot.sy(props.to[1]) }))
const stroke = computed(() => props.color ?? 'var(--dl-heading)')
</script>

<template>
  <g class="dl-line" :opacity="props.opacity">
    <defs v-if="props.arrow">
      <marker
        :id="markerId"
        markerWidth="7" markerHeight="7"
        refX="6" refY="3.5"
        orient="auto"
      >
        <path d="M0,0 L7,3.5 L0,7 Z" :fill="stroke" />
      </marker>
    </defs>
    <line
      :x1="p1.x" :y1="p1.y" :x2="p2.x" :y2="p2.y"
      :stroke="stroke"
      :stroke-width="props.width"
      :stroke-dasharray="props.dashed ? '6 5' : undefined"
      :marker-end="props.arrow ? `url(#${markerId})` : undefined"
      stroke-linecap="round"
    />
  </g>
</template>
