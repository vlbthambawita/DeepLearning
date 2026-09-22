<script setup lang="ts">
/*
 * Classifier-free guidance — the one knob everybody who has used an image model
 * has touched, usually without being told what it does.
 *
 * "The prompt" here is *which of the three modes you asked for*. The sampler runs
 * the same DDIM trajectory as `DiffusionLab`, but the score it follows is
 *
 *     ε̃ = ε_uncond + w · (ε_cond − ε_uncond)
 *
 * and w is the slider. Three regimes, all visible, and the readout puts a number
 * on each:
 *
 *   w = 0   the prompt is ignored          12/36 on the asked mode, spread 2.55
 *   w = 1   honest conditional sampling    36/36, spread 0.33 — and the real
 *                                          data's own spread is 0.39
 *   w = 7   the extrapolation that ships   36/36, spread 0.76
 *
 * The third row is the slide. Past w = 1 the sampler is following
 *
 *     ∇ log [ p_cond · (p_cond / p_uncond)^(w−1) ]
 *
 * which is not the score of anything the model was trained on, so the samples
 * stop matching the data's real shape — here by drifting off the mode, in a real
 * image model by coming out over-saturated, high-contrast and same-y. One cause,
 * two symptoms. Saying it this way is worth more than the usual "guidance trades
 * diversity for fidelity", which does not explain why the pictures go wrong.
 */
import { computed, ref } from 'vue'
import type { Point } from '../composables/useGenerative'
import {
  MODE_CENTRES,
  guidedScore,
  noiseSchedule,
  reverseStep,
  startNoise,
} from '../composables/useGenerative'

const { alphaBar, steps } = noiseSchedule()

const mode = ref(0)
const w = ref(1)

const SEEDS = startNoise(36, 8080)

/** Run the whole guided trajectory. Cheap enough to redo on every slider tick. */
const samples = computed<Point[]>(() => {
  let x = SEEDS
  for (let k = steps - 1; k > 0; k--) {
    x = x.map(p =>
      reverseStep(p, alphaBar[k], alphaBar[k - 1], guidedScore(p, alphaBar[k], mode.value, w.value)))
  }
  return x
})

/** Which mode each sample ended up nearest, and how tightly they cluster. */
const stats = computed(() => {
  let onPrompt = 0
  let spread = 0
  const target = MODE_CENTRES[mode.value]
  for (const s of samples.value) {
    const d = MODE_CENTRES.map(c => (c.x - s.x) ** 2 + (c.y - s.y) ** 2)
    if (d.indexOf(Math.min(...d)) === mode.value)
      onPrompt += 1
    spread += Math.hypot(s.x - target.x, s.y - target.y)
  }
  return {
    onPrompt,
    total: samples.value.length,
    spread: spread / samples.value.length,
  }
})

/*
 * What the real data's own spread around a mode centre is, measured the same
 * way, so "too tight" and "too loose" are read against something rather than
 * guessed at. For σ = 0.3 in two dimensions this is σ√(π/2) = 0.376.
 */
const REAL_SPREAD = 0.389

const marks = computed(() => samples.value.map((s) => {
  const d = MODE_CENTRES.map(c => (c.x - s.x) ** 2 + (c.y - s.y) ** 2)
  return { ...s, cls: d.indexOf(Math.min(...d)) === mode.value ? 'asked' : 'other' }
}))

const targets = computed(() =>
  MODE_CENTRES.map((c, k) => ({ ...c, cls: k === mode.value ? 'asked' : 'other' })))
</script>

<template>
  <WidgetFrame max-width="44rem">
    <Plot2D
      :x-domain="[-4, 4]"
      :y-domain="[-2.6, 2.4]"
      :width="470" :height="224"
      :x-ticks="[-4, -2, 0, 2, 4]" :y-ticks="[-2, 0, 2]"
    >
      <PlotPoints
        :points="targets"
        :radius="14"
        :colors="{ asked: 'var(--dl-accent-soft)', other: 'var(--dl-surface)' }"
      />
      <PlotPoints
        :points="marks"
        :radius="4.2"
        :colors="{ asked: 'var(--dl-accent)', other: 'var(--dl-danger)' }"
      />
      <PlotLabel
        :at="[MODE_CENTRES[mode].x, MODE_CENTRES[mode].y]"
        text="asked for"
        :dy="-34" anchor="middle" :dx="0"
        color="var(--dl-accent-strong)"
        bold
      />
    </Plot2D>

    <template #controls>
      <Slider v-model="w" label="guidance scale w" :min="0" :max="8" :step="0.25" :precision="2" />
      <StepButton
        v-for="(c, k) in MODE_CENTRES" :key="k"
        :label="`prompt: mode ${k + 1}`"
        :variant="k === mode ? 'primary' : 'ghost'"
        @click="mode = k"
      />
    </template>

    <template #readout>
      <div class="dl-cfg__out">
        <span>on the mode you asked for: <b>{{ stats.onPrompt }}/{{ stats.total }}</b></span>
        <span>spread around it: <b>{{ stats.spread.toFixed(3) }}</b>
          <span class="dl-cfg__ref">real data: {{ REAL_SPREAD.toFixed(3) }}</span>
        </span>
        <span class="dl-cfg__note">
          {{ w < 0.5
            ? 'w ≈ 0 — the prompt is barely being used'
            : w <= 1.5
              ? 'w ≈ 1 — conditional sampling, and the spread the real data has'
              : 'w > 1 — following a field no data ever had: on-prompt, wrong shape' }}
        </span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-cfg__out {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 1.3rem;
  align-items: baseline;
}

.dl-cfg__out b {
  color: var(--dl-accent);
  font-weight: 700;
}

.dl-cfg__ref {
  color: var(--dl-muted);
  font-weight: 400;
  margin-left: 0.35rem;
}

.dl-cfg__note {
  color: var(--dl-muted);
  font-style: italic;
}
</style>
