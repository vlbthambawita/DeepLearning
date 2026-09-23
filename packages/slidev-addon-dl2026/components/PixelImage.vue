<script setup lang="ts">
/*
 * A 12×12 picture of a data sample, drawn in the theme's ink so it reads in
 * light and dark mode and in the PDF export.
 *
 *   <PixelImage pattern="smiley" />                 a clean sample
 *   <PixelImage pattern="smiley" :noise="0.5" />    half-way to noise
 *   <PixelImage pattern="smiley" :shifts="[-1, 1]" />  two plausible images, averaged
 *   <PixelImage pattern="noise" :seed="3" />         a fresh z, shown as an image
 *   <PixelImage pattern="checker:3:2" />             transposed-conv tap counts
 *
 * Inside a hand-drawn <svg>, pass `in-svg` with `x`/`y` and it renders as a <g>,
 * so a diagram's boxes can hold the actual picture:
 *
 *   <PixelImage in-svg :x="8" :y="40" :size="52" pattern="smiley" />
 *
 * Deterministic: the same props always draw the same pixels.
 */
import { computed } from 'vue'
import { PIXEL_SIZE, pixelImage } from '../composables/usePixelImage'

const props = withDefaults(defineProps<{
  pattern?: string
  noise?: number
  seed?: number
  shifts?: number[]
  /** Rendered width in px; the image is square. */
  size?: number
  /** 'ink' for data, 'accent' for something the model produced, 'danger' for a failure. */
  tone?: 'ink' | 'accent' | 'danger'
  label?: string
  /** Render as a <g> inside a parent <svg>, at (x, y) in its user space. */
  inSvg?: boolean
  x?: number
  y?: number
}>(), {
  pattern: 'smiley',
  noise: 0,
  seed: 7,
  size: 56,
  tone: 'ink',
  inSvg: false,
  x: 0,
  y: 0,
})

const scale = computed(() => props.size / (PIXEL_SIZE + 1))

const cells = computed(() => {
  const img = pixelImage(props.pattern, { noise: props.noise, seed: props.seed, shifts: props.shifts })
  const out: { x: number, y: number, v: number }[] = []
  img.forEach((row, i) => row.forEach((v, j) => {
    if (v > 0.02)
      out.push({ x: j, y: i, v })
  }))
  return out
})

const color = computed(() => ({
  ink: 'var(--dl-heading)',
  accent: 'var(--dl-accent)',
  danger: 'var(--dl-danger)',
}[props.tone]))
</script>

<template>
  <g v-if="props.inSvg" :transform="`translate(${props.x} ${props.y}) scale(${scale}) translate(0.5 0.5)`" role="img" :aria-label="props.label ?? props.pattern">
    <rect x="-0.5" y="-0.5" :width="PIXEL_SIZE + 1" :height="PIXEL_SIZE + 1" rx="0.8" class="dl-pixel__bg" />
    <rect
      v-for="c in cells" :key="`${c.x}-${c.y}`"
      :x="c.x" :y="c.y" width="1.02" height="1.02"
      :style="{ fill: color, fillOpacity: c.v }"
    />
    <text v-if="props.label" :x="PIXEL_SIZE / 2" :y="PIXEL_SIZE + 0.5 + 12 / scale" text-anchor="middle" class="dl-pixel__svglabel" :style="{ fontSize: `${11 / scale}px` }">{{ props.label }}</text>
  </g>
  <figure v-else class="dl-pixel" :style="{ width: `${props.size}px` }">
    <svg :viewBox="`-0.5 -0.5 ${PIXEL_SIZE + 1} ${PIXEL_SIZE + 1}`" :width="props.size" :height="props.size" role="img" :aria-label="props.label ?? props.pattern">
      <rect x="-0.5" y="-0.5" :width="PIXEL_SIZE + 1" :height="PIXEL_SIZE + 1" rx="0.8" class="dl-pixel__bg" />
      <rect
        v-for="c in cells" :key="`${c.x}-${c.y}`"
        :x="c.x" :y="c.y" width="1.02" height="1.02"
        :style="{ fill: color, fillOpacity: c.v }"
      />
    </svg>
    <figcaption v-if="props.label" class="dl-pixel__label">{{ props.label }}</figcaption>
  </figure>
</template>

<style scoped>
.dl-pixel {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  vertical-align: middle;
}

.dl-pixel__bg {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 0.12;
}

.dl-pixel__svglabel {
  fill: var(--dl-muted);
}

.dl-pixel__label {
  margin-top: 0.15rem;
  font-size: 0.72rem;
  line-height: 1.15;
  color: var(--dl-muted);
  text-align: center;
  white-space: nowrap;
}
</style>
