<script setup lang="ts">
/*
 * Diffusion on the same three modes the rest of the deck uses.
 *
 * Two directions, one slider.
 *
 *   forward   x_t = √ᾱ_t · x_0 + √(1 - ᾱ_t) · ε
 *             Needs no network and no training. Every frame here is computed in
 *             ONE step from the clean data, never by simulating the chain — which
 *             is the slide of the section: training can jump straight to any
 *             noise level, so it never has to walk 1000 steps to make an example.
 *
 *   reverse   the trajectory a sampler actually follows, DDIM, 48 steps.
 *
 * The vector field toggle is the honest part. A real model *learns* ε̂(x, t); the
 * data here is a Gaussian mixture, so that field is available in closed form
 * (`mixtureScore`) and the widget draws the true one. Nothing is faked and
 * nothing is trained — the room is looking at the exact target the network is
 * fitted to, which is worth saying out loud.
 */
import { computed, ref } from 'vue'
import type { Point } from '../composables/useGenerative'
import {
  forwardTo,
  mixtureScore,
  noiseSchedule,
  reverseStep,
  sampleData,
  startNoise,
} from '../composables/useGenerative'
import { seededGaussian } from '../composables/useRandom'

const props = withDefaults(defineProps<{
  /** Open on the reverse pass rather than the forward one. */
  reverse?: boolean
  /** Draw the noise field the network is trained to predict. */
  field?: boolean
}>(), {
  reverse: false,
  field: false,
})

const { alphaBar, steps } = noiseSchedule()

const direction = ref<'forward' | 'reverse'>(props.reverse ? 'reverse' : 'forward')
const showField = ref(props.field)
const t = ref(props.reverse ? steps - 1 : 0)

const clean = sampleData(20)

/** One fixed ε per point, so moving the slider changes only the noise *level*. */
const EPS: Point[] = (() => {
  const g = seededGaussian(31337)
  return clean.map(() => ({ x: g(), y: g() }))
})()

/*
 * Every forward frame, each computed from x_0 in a single step. Precomputed so
 * scrubbing is instant, but the point stands: `forwardTo` never looks at frame
 * t - 1.
 */
const forwardFrames = computed<Point[][]>(() =>
  alphaBar.map(ab => clean.map((p, i) => forwardTo(p, ab, EPS[i]))))

/*
 * The reverse trajectory, which *does* have to be walked: every step needs the
 * one before it. That asymmetry is why generation is slow and training is not.
 */
const reverseFrames = computed<Point[][]>(() => {
  const frames: Point[][] = new Array(steps)
  let x = startNoise(20)
  frames[steps - 1] = x
  for (let k = steps - 1; k > 0; k--) {
    x = x.map(p => reverseStep(p, alphaBar[k], alphaBar[k - 1]))
    frames[k - 1] = x
  }
  return frames
})

const shown = computed(() =>
  (direction.value === 'forward' ? forwardFrames.value : reverseFrames.value)[t.value])

const ab = computed(() => alphaBar[t.value])

/** The field the network is trained to output: ε̂ = −√(1 − ᾱ_t) · ∇ log p_t. */
const arrows = computed(() => {
  if (!showField.value)
    return []
  const out: { from: [number, number], to: [number, number] }[] = []
  // Constant length: what the room needs to read off this is *which way* the
  // sampler is pushed at each place, and the magnitudes span two orders of
  // magnitude between t = 0 and t = T, which would leave most frames with either
  // invisible arrows or arrows across the whole stage.
  const LEN = 0.6
  for (let gx = -3; gx <= 3; gx += 1.5) {
    for (let gy = -2; gy <= 2; gy += 1.33) {
      // The score points toward higher density, which is the direction that
      // *removes* noise and the direction the sampler moves.
      const s = mixtureScore({ x: gx, y: gy }, ab.value)
      const len = Math.hypot(s.x, s.y)
      if (len < 1e-9)
        continue
      out.push({ from: [gx, gy], to: [gx + (s.x / len) * LEN, gy + (s.y / len) * LEN] })
    }
  }
  return out
})

function jump(to: number) {
  t.value = Math.min(Math.max(to, 0), steps - 1)
}
</script>

<template>
  <WidgetFrame max-width="44rem">
    <Plot2D
      :x-domain="[-4, 4]"
      :y-domain="[-2.8, 2.8]"
      :width="470" :height="252"
      :x-ticks="[-4, -2, 0, 2, 4]" :y-ticks="[-2, 0, 2]"
    >
      <PlotLine
        v-for="(a, i) in arrows" :key="`a${i}`"
        :from="a.from" :to="a.to"
        color="var(--dl-muted)"
        :width="1.2"
        :opacity="0.55"
        arrow
      />
      <PlotPoints :points="shown" :radius="4.2" color="var(--dl-accent)" />
    </Plot2D>

    <template #controls>
      <Slider
        v-model="t"
        :label="direction === 'forward' ? 'noise level t' : 'sampling step t'"
        :min="0" :max="steps - 1" :step="1" :precision="0"
      />
      <StepButton
        :label="direction === 'forward' ? 'forward — add noise' : 'reverse — remove it'"
        variant="ghost"
        glyph="⇄"
        @click="direction = direction === 'forward' ? 'reverse' : 'forward'"
      />
      <StepButton :label="`t = 0`" variant="ghost" @click="jump(0)" />
      <StepButton :label="`t = ${steps - 1}`" variant="ghost" @click="jump(steps - 1)" />
      <StepButton
        :label="showField ? 'hide the field' : 'show the field'"
        variant="ghost"
        @click="showField = !showField"
      />
    </template>

    <template #readout>
      <div class="dl-diff__out">
        <span>t = <b>{{ t }}</b> of {{ steps - 1 }}</span>
        <span>√ᾱ<sub>t</sub> = <b>{{ Math.sqrt(ab).toFixed(3) }}</b> of the image</span>
        <span>√(1−ᾱ<sub>t</sub>) = <b>{{ Math.sqrt(1 - ab).toFixed(3) }}</b> of noise</span>
        <span class="dl-diff__note">
          {{ direction === 'forward'
            ? 'every frame computed from x₀ in one step — no chain simulated'
            : 'each frame needs the one before it — this is why sampling is slow' }}
        </span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-diff__out {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 1.2rem;
  align-items: baseline;
}

.dl-diff__out b {
  color: var(--dl-accent);
  font-weight: 700;
}

.dl-diff__note {
  color: var(--dl-muted);
  font-style: italic;
}
</style>
