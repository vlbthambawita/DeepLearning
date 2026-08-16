<script setup lang="ts">
/*
 * Text anchored to a data coordinate, with an optional leader line — the
 * "Initial weight" / "Global loss minimum" annotations that make the loss-bowl
 * figure readable.
 */
import { computed } from 'vue'
import { usePlot } from '../composables/usePlot'

const props = withDefaults(defineProps<{
  at: [number, number]
  text?: string
  /** Pixel offset from the anchor, so the label clears the mark. */
  dx?: number
  dy?: number
  anchor?: 'start' | 'middle' | 'end'
  color?: string
  size?: number
  /** Draw a hairline from the label back to the anchor point. */
  leader?: boolean
  bold?: boolean
}>(), {
  dx: 8,
  dy: -8,
  anchor: 'start',
  size: 12,
  leader: false,
  bold: false,
})

const plot = usePlot()
const anchorPt = computed(() => ({ x: plot.sx(props.at[0]), y: plot.sy(props.at[1]) }))
const textPt = computed(() => ({ x: anchorPt.value.x + props.dx, y: anchorPt.value.y + props.dy }))
</script>

<template>
  <g class="dl-plot-label">
    <line
      v-if="props.leader"
      :x1="anchorPt.x" :y1="anchorPt.y"
      :x2="textPt.x - (props.anchor === 'end' ? -4 : 4)" :y2="textPt.y + 3"
      :stroke="props.color ?? 'var(--dl-muted)'"
      stroke-width="1"
    />
    <text
      :x="textPt.x" :y="textPt.y"
      :text-anchor="props.anchor"
      :fill="props.color ?? 'var(--dl-body)'"
      :font-size="props.size"
      :font-weight="props.bold ? 600 : 400"
    >
      <slot>{{ props.text }}</slot>
    </text>
  </g>
</template>
