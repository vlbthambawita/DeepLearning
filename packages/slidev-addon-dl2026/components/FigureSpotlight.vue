<script setup lang="ts">
/*
 * A retained figure with regions the lecturer can walk through one at a time.
 *
 * Some 2025 figures cannot honestly be re-drawn — the computer-vision task
 * comparison on slide 27 is five photographs with overlays, and redrawing it
 * would mean inventing the photographs. Keeping the raster but dimming
 * everything except the region under discussion gets the animation benefit
 * without pretending we authored the figure.
 *
 * Regions are percentages of the image box, so they survive any resize.
 *
 * The image comes in through the default slot rather than a `src` prop: Vite
 * rewrites `src` attributes it can see in a template, but a URL passed as a
 * prop string is left alone and breaks under a non-root base path.
 */
import { computed, ref } from 'vue'

export interface SpotlightRegion {
  /** Percentages: left, top, width, height. */
  x: number
  y: number
  w: number
  h: number
  label: string
  note?: string
}

const props = withDefaults(defineProps<{
  regions: SpotlightRegion[]
  /** Start with the whole figure visible rather than on region 1. */
  startWide?: boolean
}>(), {
  startWide: true,
})

// -1 means "no spotlight": the whole figure at full brightness.
const index = ref(props.startWide ? -1 : 0)

const active = computed(() => (index.value >= 0 ? props.regions[index.value] : null))

function step(delta: number) {
  const next = index.value + delta
  index.value = next < -1 ? props.regions.length - 1 : next >= props.regions.length ? -1 : next
}
</script>

<template>
  <WidgetFrame>
    <div class="dl-spot">
      <div class="dl-spot__frame">
        <slot />

        <div
          v-for="(r, i) in props.regions"
          :key="i"
          class="dl-spot__region"
          :class="{ 'is-active': i === index, 'is-dimmed': index >= 0 && i !== index }"
          :style="{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }"
          @click="index = i"
        >
          <span class="dl-spot__tag">{{ r.label }}</span>
        </div>
      </div>
    </div>

    <template #controls>
      <StepButton label="Previous" variant="ghost" glyph="◀" @click="step(-1)" />
      <StepButton label="Next" glyph="▶" @click="step(1)" />
      <StepButton v-if="index >= 0" label="Show all" variant="ghost" @click="index = -1" />
    </template>

    <template #readout>
      <span v-if="active"><strong>{{ active.label }}</strong><template v-if="active.note"> — {{ active.note }}</template></span>
      <span v-else>{{ props.regions.length }} categories. Step through them, or click one directly.</span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-spot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/*
 * Sized from its height, not its width. `max-height: 100%` on the image cannot
 * resolve while the frame's own height comes from that same image, so a wide
 * figure grew past the bottom of the slide instead of being letterboxed. Taking
 * the height from the stage and letting the width follow breaks the cycle — and
 * the frame's box stays exactly the image's box, which is what keeps the
 * percentage regions aligned with what they point at.
 */
.dl-spot__frame {
  position: relative;
  display: block;
  height: 100%;
  width: fit-content;
  max-width: 100%;
}

.dl-spot__frame :deep(img) {
  display: block;
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.dl-spot__region {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.dl-spot__region.is-active {
  border-color: var(--dl-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dl-accent) 35%, transparent);
}

/* Dim by covering, not by filtering the image — a CSS filter on the <img>
   would dim the highlighted region too. */
.dl-spot__region.is-dimmed {
  background: color-mix(in srgb, var(--dl-bg) 72%, transparent);
}

.dl-spot__tag {
  position: absolute;
  left: 0;
  bottom: -1.45rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--dl-accent);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.dl-spot__region.is-active .dl-spot__tag {
  opacity: 1;
}
</style>
