<script setup lang="ts">
/*
 * Rosenblatt's perceptron, running for real.
 *
 * Carries Lecture 02 slides 9-16: the formal definition, the decision boundary,
 * the learning rule, both worked examples, the convergence caveat, and the
 * "can you understand this now?" recap — which in the 2025 deck was the same
 * screenshot pasted a second time.
 *
 * Every update the student sees is the actual rule applied to the actual point:
 *   dw = eta (y - yhat) x     db = eta (y - yhat)
 * There is no scripted animation, so the "what if it is not linearly separable"
 * question can be answered by pressing the toggle rather than by assertion.
 *
 * Two things were wrong here and are fixed:
 *
 * - `mode="boundary"` starts before any training, so w and b were all zero and
 *   the slide whose whole subject is the decision boundary drew no boundary at
 *   all. That mode now starts from a boundary that separates the blobs and puts
 *   w1, w2 and b on sliders, so the geometry can be moved by hand.
 *
 * - The "not linearly separable" setting was separable. Two blobs 2 x 0.85
 *   apart with spread 0.62 still admit a separating line, and the perceptron
 *   duly converged on the slide that exists to show it cannot. Checked by
 *   linear programming over 100 seeds: 0.85 is separable for the deck's seed,
 *   0.6 for 23 seeds in 100, 0.45 for 7, and 0.3 for none. Hence 0.3.
 */
import { computed, ref, watch } from 'vue'
import { seededGaussian } from '../composables/useRandom'

const props = withDefaults(defineProps<{
  /** 'boundary' hides the training controls and puts w and b on sliders. */
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
const isBoundaryMode = computed(() => props.mode === 'boundary')

interface Sample { x: number, y: number, label: 0 | 1 }

/*
 * In boundary mode there is no learning, so the weights have to start
 * somewhere: x1 + x2 = 6 runs through the middle of the two blobs and
 * classifies all 24 points correctly, which is the picture the slide is about.
 */
const START = { w1: 1, w2: 1, b: -6 }

const separable = ref(props.separable)
const eta = ref(props.eta)
const w1 = ref(isBoundaryMode.value ? START.w1 : 0)
const w2 = ref(isBoundaryMode.value ? START.w2 : 0)
const b = ref(isBoundaryMode.value ? START.b : 0)
const cursor = ref(0)
const updates = ref(0)
const epochs = ref(0)
const lastTouched = ref<number | null>(null)

/** Two Gaussian blobs. Their separation is the only thing the toggle changes. */
const data = computed<Sample[]>(() => {
  const gauss = seededGaussian(props.seed)
  const spread = 0.62
  const gap = separable.value ? 2.4 : 0.3
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
  w1.value = isBoundaryMode.value ? START.w1 : 0
  w2.value = isBoundaryMode.value ? START.w2 : 0
  b.value = isBoundaryMode.value ? START.b : 0
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

/*
 * The half-plane where the neuron fires, shaded.
 *
 * PlotCurve's `fillTo` fills between a function and a constant y, so the region
 * above or below the boundary comes out of the same primitive that draws it —
 * no polygon clipping. Only defined when the boundary is not vertical.
 */
const firingRegion = computed(() => {
  if (Math.abs(w2.value) < 1e-9)
    return null
  return {
    fn: (x: number) => -(w1.value * x + b.value) / w2.value,
    // z > 0 above the line exactly when w2 > 0.
    fillTo: w2.value > 0 ? DOMAIN[1] : DOMAIN[0],
  }
})

/**
 * "fires" / "does not fire" placed in whichever opposite corners the two
 * half-planes actually occupy, so the labels follow the sliders.
 */
const regionLabels = computed(() => {
  const [lo, hi] = DOMAIN
  const inset = 0.5
  const corners: Array<[number, number]> = [[hi - inset, hi - inset], [lo + inset, lo + inset]]
  const z = corners.map(([x, y]) => w1.value * x + w2.value * y + b.value)
  if (z[0] * z[1] >= 0)
    return []
  return corners.map((at, i) => ({
    at,
    text: z[i] >= 0 ? 'σ(z) = 1' : 'σ(z) = 0',
    anchor: (i === 0 ? 'end' : 'start') as 'end' | 'start',
  }))
})

const plotPoints = computed(() => data.value.map((s, i) => ({
  x: s.x,
  y: s.y,
  cls: predict(s) === s.label ? `ok${s.label}` : 'wrong',
  highlight: i === lastTouched.value,
})))

/* ── the step function, and the data seen through it ───────────────────── */

/**
 * Every 2-D point collapses to one number, z, and the unit step cuts that
 * number line at zero. Drawing the samples at (z, σ(z)) puts the scatter and
 * the activation in the same picture: a mark sitting on the wrong level is a
 * misclassification, and it is the same mark that shows red in the scatter.
 */
const zValues = computed(() => data.value.map(netInput))

const zDomain = computed<[number, number]>(() => {
  const zs = zValues.value
  const span = Math.max(Math.max(...zs.map(Math.abs)), 1) * 1.15
  return [-span, span]
})

const stepSegments = computed(() => {
  const [lo, hi] = zDomain.value
  return { off: [[lo, 0], [0, 0]] as Array<[number, number]>, on: [[0, 1], [hi, 1]] as Array<[number, number]> }
})

const stepPoints = computed(() => data.value.map((s, i) => ({
  x: zValues.value[i],
  y: predict(s),
  cls: predict(s) === s.label ? `ok${s.label}` : 'wrong',
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
  <WidgetFrame :max-width="isBoundaryMode ? '52rem' : '44rem'">
    <div class="dl-perc__panes">
      <Plot2D
        :x-domain="DOMAIN"
        :y-domain="DOMAIN"
        :width="isBoundaryMode ? 400 : 480"
        :height="330"
        x-label="x₁"
        y-label="x₂"
        :x-ticks="5"
        :y-ticks="5"
      >
        <PlotCurve
          v-if="firingRegion"
          :fn="firingRegion.fn"
          :fill-to="firingRegion.fillTo"
          color="var(--dl-accent)"
          :width="0"
        />
        <PlotLine
          v-if="boundary"
          :from="boundary.from"
          :to="boundary.to"
          color="var(--dl-accent-strong)"
          :width="2.5"
        />
        <PlotPoints :points="plotPoints" :colors="COLORS" :shapes="SHAPES" :radius="6" />
        <PlotLabel
          v-for="(l, i) in regionLabels" :key="i"
          :at="l.at" :text="l.text" :anchor="l.anchor" :dx="0" :dy="0"
          color="var(--dl-muted)" :size="11"
        />
      </Plot2D>

      <Plot2D
        v-if="isBoundaryMode"
        :x-domain="zDomain"
        :y-domain="[-0.3, 1.3]"
        :width="280"
        :height="330"
        x-label="z = w₁x₁ + w₂x₂ + b"
        y-label="σ(z)"
        :x-ticks="4"
        :y-ticks="[0, 1]"
      >
        <PlotCurve :points="stepSegments.off" color="var(--dl-accent-strong)" :width="2.5" />
        <PlotCurve :points="stepSegments.on" color="var(--dl-accent-strong)" :width="2.5" />
        <PlotLine :from="[0, 0]" :to="[0, 1]" color="var(--dl-accent-strong)" :width="1.5" dashed />
        <PlotPoints :points="stepPoints" :colors="COLORS" :shapes="SHAPES" :radius="4" :opacity="0.6" />
      </Plot2D>
    </div>

    <template #controls>
      <template v-if="isBoundaryMode">
        <Slider v-model="w1" label="w₁" :min="-2" :max="2" :step="0.05" class="dl-perc__w" />
        <Slider v-model="w2" label="w₂" :min="-2" :max="2" :step="0.05" class="dl-perc__w" />
        <Slider v-model="b" label="b" :min="-9" :max="9" :step="0.1" :precision="1" class="dl-perc__w" />
        <StepButton label="Reset" variant="ghost" @click="reset" />
      </template>
      <template v-else>
        <StepButton label="One sample" glyph="▶" :disabled="converged" @click="step" />
        <StepButton label="One epoch" variant="ghost" :disabled="converged" @click="epoch" />
        <StepButton label="Reset" variant="ghost" @click="reset" />
        <Slider v-model="eta" label="learning rate η" :min="0.01" :max="0.5" :step="0.01" class="dl-perc__eta" />

        <label class="dl-perc__toggle">
          <input v-model="separable" type="checkbox">
          linearly separable
        </label>
      </template>
    </template>

    <template #readout>
      <div class="dl-perc__weights">
        <Katex :expr="`w_1 = ${w1.toFixed(2)},\\; w_2 = ${w2.toFixed(2)},\\; b = ${b.toFixed(2)}`" />
      </div>
      <div v-if="isBoundaryMode">
        The line is where <Katex expr="z = 0" />; the shaded side is where the neuron fires ·
        {{ errors }} of {{ data.length }} points on the wrong side
      </div>
      <div v-else>
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
.dl-perc__panes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dl-perc__eta {
  min-width: 10rem;
}

.dl-perc__w {
  min-width: 7.5rem;
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
