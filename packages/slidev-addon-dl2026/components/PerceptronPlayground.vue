<script setup lang="ts">
/*
 * Rosenblatt's perceptron, running for real.
 *
 * Carries Lecture 02 slides 7-13: the formal definition, the decision boundary,
 * the learning rule, both worked examples, the convergence caveat, and the
 * "can you understand this now?" recap — which in the 2025 deck was the same
 * screenshot pasted a second time.
 *
 * Every update the student sees is the actual rule applied to the actual point:
 *   dw = eta (y - yhat) x     db = eta (y - yhat)
 * There is no scripted animation, so the "what if it is not linearly separable"
 * question can be answered by pressing the toggle rather than by assertion.
 */
import { computed, ref, watch } from 'vue'
import { seededGaussian } from '../composables/useRandom'

const props = withDefaults(defineProps<{
  /** 'boundary' hides the training controls and just shows w and b at work. */
  mode?: 'boundary' | 'train'
  /** Overlapping classes: the perceptron will never converge. */
  separable?: boolean
  eta?: number
  points?: number
  seed?: number
}>(), {
  mode: 'train',
  separable: true,
  eta: 0.1,
  points: 24,
  seed: 20260101,
})

const DOMAIN: [number, number] = [-1, 7]

interface Sample { x: number, y: number, label: 0 | 1 }

const separable = ref(props.separable)
const eta = ref(props.eta)
const w1 = ref(0)
const w2 = ref(0)
const b = ref(0)
const cursor = ref(0)
const updates = ref(0)
const epochs = ref(0)
const lastTouched = ref<number | null>(null)

/** Two Gaussian blobs. Their separation is the only thing the toggle changes. */
const data = computed<Sample[]>(() => {
  const gauss = seededGaussian(props.seed)
  const spread = 0.62
  const gap = separable.value ? 2.4 : 0.85
  const out: Sample[] = []

  for (let i = 0; i < props.points; i++) {
    const label: 0 | 1 = i % 2 === 0 ? 0 : 1
    const cx = 3 + (label === 1 ? gap : -gap)
    const cy = 3 + (label === 1 ? gap * 0.55 : -gap * 0.55)
    out.push({ x: cx + gauss() * spread, y: cy + gauss() * spread, label })
  }
  return out
})

const netInput = (s: Sample) => w1.value * s.x + w2.value * s.y + b.value
const predict = (s: Sample): 0 | 1 => (netInput(s) >= 0 ? 1 : 0)

const errors = computed(() => data.value.filter(s => predict(s) !== s.label).length)
const converged = computed(() => errors.value === 0 && updates.value > 0)

function reset() {
  w1.value = 0
  w2.value = 0
  b.value = 0
  cursor.value = 0
  updates.value = 0
  epochs.value = 0
  lastTouched.value = null
}

watch(separable, reset)

/** One pass of the rule over the next sample, exactly as the slide states it. */
function step() {
  const i = cursor.value % data.value.length
  const s = data.value[i]
  const error = s.label - predict(s)

  if (error !== 0) {
    w1.value += eta.value * error * s.x
    w2.value += eta.value * error * s.y
    b.value += eta.value * error
    updates.value++
  }

  lastTouched.value = i
  cursor.value++
  if (cursor.value % data.value.length === 0)
    epochs.value++
}

function epoch() {
  const target = data.value.length - (cursor.value % data.value.length)
  for (let i = 0; i < target; i++)
    step()
}

/*
 * The boundary is w1 x + w2 y + b = 0. Solving for y needs w2 != 0, and w2 is
 * exactly 0 at initialisation and whenever the updates happen to cancel — so
 * the vertical case has to be handled rather than divided by.
 */
const boundary = computed<{ from: [number, number], to: [number, number] } | null>(() => {
  const [lo, hi] = DOMAIN
  if (Math.abs(w2.value) > 1e-9) {
    const yAt = (x: number) => -(w1.value * x + b.value) / w2.value
    return { from: [lo, yAt(lo)], to: [hi, yAt(hi)] }
  }
  if (Math.abs(w1.value) > 1e-9) {
    const x = -b.value / w1.value
    return { from: [x, lo], to: [x, hi] }
  }
  return null
})

const plotPoints = computed(() => data.value.map((s, i) => ({
  x: s.x,
  y: s.y,
  cls: predict(s) === s.label ? `ok${s.label}` : 'wrong',
  highlight: i === lastTouched.value,
})))

const COLORS = {
  ok0: 'var(--dl-accent)',
  ok1: 'var(--dl-heading)',
  // The 2025 deck used pure red for a wrong prediction; the semantic survives,
  // the raw #ff0000 does not.
  wrong: 'var(--dl-danger)',
}

const SHAPES = { ok0: 'circle', ok1: 'square', wrong: 'triangle' } as const
</script>

<template>
  <WidgetFrame max-width="44rem">
    <Plot2D
      :x-domain="DOMAIN"
      :y-domain="DOMAIN"
      :width="480"
      :height="330"
      x-label="x₁"
      y-label="x₂"
      :x-ticks="5"
      :y-ticks="5"
    >
      <PlotLine
        v-if="boundary"
        :from="boundary.from"
        :to="boundary.to"
        color="var(--dl-accent-strong)"
        :width="2.5"
      />
      <PlotPoints :points="plotPoints" :colors="COLORS" :shapes="SHAPES" :radius="6" />
    </Plot2D>

    <template #controls>
      <template v-if="props.mode === 'train'">
        <StepButton label="One sample" glyph="▶" :disabled="converged" @click="step" />
        <StepButton label="One epoch" variant="ghost" :disabled="converged" @click="epoch" />
        <StepButton label="Reset" variant="ghost" @click="reset" />
        <Slider v-model="eta" label="learning rate η" :min="0.01" :max="0.5" :step="0.01" class="dl-perc__eta" />
      </template>

      <label class="dl-perc__toggle">
        <input v-model="separable" type="checkbox">
        linearly separable
      </label>
    </template>

    <template #readout>
      <div class="dl-perc__weights">
        <Katex :expr="`w_1 = ${w1.toFixed(2)},\\; w_2 = ${w2.toFixed(2)},\\; b = ${b.toFixed(2)}`" />
      </div>
      <div>
        {{ errors }} misclassified of {{ data.length }} ·
        {{ updates }} weight update{{ updates === 1 ? '' : 's' }} ·
        {{ epochs }} epoch{{ epochs === 1 ? '' : 's' }}
        <span v-if="converged" class="dl-perc__done">converged — no error left to learn from</span>
        <span v-else-if="!separable && epochs >= 3" class="dl-perc__warn">
          still updating: the classes overlap, so the rule never settles
        </span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-perc__eta {
  min-width: 10rem;
}

.dl-perc__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.dl-perc__toggle input {
  accent-color: var(--dl-accent);
}

.dl-perc__weights {
  margin-bottom: 0.15rem;
  font-size: 0.95rem;
}

.dl-perc__done {
  color: var(--dl-accent);
  font-weight: 600;
  margin-left: 0.4rem;
}

.dl-perc__warn {
  color: var(--dl-danger);
  margin-left: 0.4rem;
}
</style>
