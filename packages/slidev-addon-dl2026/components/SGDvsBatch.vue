<script setup lang="ts">
/*
 * Lecture 02 slide 23.
 *
 * The slide asserts that stochastic gradient descent is noisier but cheaper.
 * Running both on the same bowl from the same start shows the trade honestly:
 * SGD wanders, and it still gets there — using one example per step instead of
 * all n.
 */
import { computed, ref } from 'vue'
import { seededGaussian } from '../composables/useRandom'

const props = withDefaults(defineProps<{
  optimum?: number
  eta?: number
  start?: number
  /** Examples in the "dataset" — only used to count gradient evaluations. */
  n?: number
  noise?: number
}>(), {
  optimum: 2,
  eta: 0.22,
  start: 5.6,
  n: 500,
  noise: 1.1,
})

const W: [number, number] = [-2.4, 6.4]
const L: [number, number] = [0, 9]

const loss = (w: number) => 0.5 * (w - props.optimum) ** 2 + 0.4
const grad = (w: number) => w - props.optimum

const steps = ref(0)

/**
 * Both paths are recomputed from `steps` rather than accumulated, so the
 * trajectories are identical every time the slide is shown.
 */
const paths = computed(() => {
  const gauss = seededGaussian(90210)
  const batch: number[] = [props.start]
  const sgd: number[] = [props.start]
  for (let i = 0; i < steps.value; i++) {
    batch.push(batch[i] - props.eta * grad(batch[i]))
    // One example gives a noisy estimate of the same gradient.
    sgd.push(sgd[i] - props.eta * (grad(sgd[i]) + gauss() * props.noise))
  }
  return { batch, sgd }
})

const inView = (ws: number[]) => ws.filter(w => w >= W[0] && w <= W[1]).map(w => ({ x: w, y: loss(w) }))

const batchCost = computed(() => steps.value * props.n)
const sgdCost = computed(() => steps.value)
</script>

<template>
  <WidgetFrame max-width="44rem">
    <Plot2D
      :x-domain="W"
      :y-domain="L"
      :width="500"
      :height="290"
      x-label="w"
      y-label="L(w)"
    >
      <PlotCurve :fn="loss" color="var(--dl-border)" :width="3" />
      <PlotPoints :points="inView(paths.batch)" :radius="4" color="var(--dl-accent)" :opacity="0.85" />
      <PlotPoints :points="inView(paths.sgd)" :radius="4" color="var(--dl-danger)" :opacity="0.85" />
    </Plot2D>

    <template #controls>
      <StepButton label="Step" glyph="▶" @click="steps++" />
      <StepButton label="Run 20" variant="ghost" @click="steps += 20" />
      <StepButton label="Reset" variant="ghost" @click="steps = 0" />
    </template>

    <template #readout>
      <div class="dl-sgd__legend">
        <span><i class="dot is-batch" /> full batch — smooth, {{ props.n }} gradients per step</span>
        <span><i class="dot is-sgd" /> stochastic — noisy, 1 gradient per step</span>
      </div>
      <div>
        {{ steps }} step{{ steps === 1 ? '' : 's' }} ·
        gradients evaluated: <strong>{{ batchCost.toLocaleString() }}</strong> vs
        <strong>{{ sgdCost.toLocaleString() }}</strong>
        <span v-if="steps > 0" class="dl-sgd__note">
          — that ratio is the whole argument for SGD on a large dataset.
        </span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-sgd__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-bottom: 0.2rem;
}

.dot {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  margin-right: 0.3rem;
}

.dot.is-batch { background: var(--dl-accent); }
.dot.is-sgd { background: var(--dl-danger); }

.dl-sgd__note {
  color: var(--dl-muted);
}
</style>
