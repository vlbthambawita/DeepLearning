<script setup lang="ts">
/*
 * Lecture 02 slide 22: standardisation, shown as a formula screenshot beside a
 * before/after plot from the book.
 *
 * Toggling the same points between raw and standardised makes the point the
 * static pair could not: it is the *axes* that change, not the shape of the
 * data — and the reason gradient descent cares is that the raw features have
 * wildly different scales, so one weight dominates every step.
 */
import { computed, ref } from 'vue'
import { seededGaussian } from '../composables/useRandom'

const props = withDefaults(defineProps<{
  points?: number
  seed?: number
}>(), {
  points: 40,
  seed: 20260202,
})

const standardised = ref(false)

/** Deliberately mismatched scales: petal length in cm, then something in mm. */
const raw = computed(() => {
  const gauss = seededGaussian(props.seed)
  return Array.from({ length: props.points }, () => ({
    x: 4.6 + gauss() * 0.8,
    y: 138 + gauss() * 26,
  }))
})

function stats(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return { mean, sd: Math.sqrt(variance) || 1 }
}

const xStats = computed(() => stats(raw.value.map(p => p.x)))
const yStats = computed(() => stats(raw.value.map(p => p.y)))

const shown = computed(() => (standardised.value
  ? raw.value.map(p => ({
      x: (p.x - xStats.value.mean) / xStats.value.sd,
      y: (p.y - yStats.value.mean) / yStats.value.sd,
    }))
  : raw.value))

const xDomain = computed<[number, number]>(() => (standardised.value ? [-3, 3] : [2, 7]))
const yDomain = computed<[number, number]>(() => (standardised.value ? [-3, 3] : [60, 220]))
</script>

<template>
  <WidgetFrame max-width="40rem">
    <Plot2D
      :x-domain="xDomain"
      :y-domain="yDomain"
      :width="440"
      :height="300"
      :x-label="standardised ? 'x₁ (standardised)' : 'x₁ — petal length (cm)'"
      :y-label="standardised ? 'x₂ (standardised)' : 'x₂ (mm)'"
    >
      <PlotPoints :points="shown" :radius="5" color="var(--dl-accent)" :opacity="0.85" />
    </Plot2D>

    <template #controls>
      <StepButton
        :label="standardised ? 'Show raw features' : 'Standardise'"
        :variant="standardised ? 'ghost' : 'primary'"
        @click="standardised = !standardised"
      />
    </template>

    <template #readout>
      <div class="dl-fs__formula">
        <Katex expr="x_j' = \dfrac{x_j - \mu_j}{\sigma_j}" />
      </div>
      <div v-if="standardised">
        Both features now have mean 0 and standard deviation 1 — one shared step size fits both.
      </div>
      <div v-else>
        μ₁ = {{ xStats.mean.toFixed(2) }}, σ₁ = {{ xStats.sd.toFixed(2) }} ·
        μ₂ = {{ yStats.mean.toFixed(1) }}, σ₂ = {{ yStats.sd.toFixed(1) }} —
        <span class="dl-fs__warn">x₂ varies ~{{ Math.round(yStats.sd / xStats.sd) }}× more, so it dominates every gradient step.</span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-fs__formula {
  margin-bottom: 0.2rem;
  font-size: 1rem;
}

.dl-fs__warn {
  color: var(--dl-danger);
}
</style>
