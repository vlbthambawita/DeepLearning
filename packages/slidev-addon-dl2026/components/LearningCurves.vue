<script setup lang="ts">
/*
 * The plot you look at to decide whether training worked.
 *
 * A single final accuracy cannot distinguish "the model is too small" from "the
 * model memorised the training set", and those two have opposite fixes. Two
 * curves can, which is the argument for spending a slide on this: the shape of
 * the pair is the diagnosis.
 *
 * The three regimes are generated from closed-form curves rather than measured,
 * because the point is the *shape*, and a real run adds noise that obscures it.
 * A little seeded jitter keeps them from looking like textbook idealisations,
 * and the epoch of lowest validation loss is computed from the data rather than
 * asserted, so the early-stopping marker cannot drift away from the curve.
 */
import { computed, ref } from 'vue'
import { seededRandom } from '../composables/useRandom'

const EPOCHS = 20

type Regime = 'underfit' | 'good' | 'overfit'
type Metric = 'loss' | 'accuracy'

const REGIMES: Array<{ key: Regime, tab: string }> = [
  { key: 'underfit', tab: 'underfitting' },
  { key: 'good', tab: 'about right' },
  { key: 'overfit', tab: 'overfitting' },
]

const regime = ref<Regime>('good')
const metric = ref<Metric>('loss')
const epoch = ref(EPOCHS)

/** Reproducible wobble, so the curves look measured but never move. */
const jitter = (seed: number) => {
  const rand = seededRandom(seed)
  return Array.from({ length: EPOCHS }, () => (rand() - 0.5) * 2)
}

const NOISE = {
  underfit: [jitter(11), jitter(12)],
  good: [jitter(21), jitter(22)],
  overfit: [jitter(31), jitter(32)],
}

function curves(r: Regime, m: Metric) {
  const es = Array.from({ length: EPOCHS }, (_, i) => i + 1)
  const [n0, n1] = NOISE[r]

  const train = es.map((e, i) => {
    const base = m === 'loss'
      ? r === 'underfit' ? 1.30 * Math.exp(-0.34 * e) + 0.70
        : r === 'good' ? 0.36 * Math.exp(-0.28 * e) + 0.048
          : 0.42 * Math.exp(-0.46 * e) + 0.004
      : r === 'underfit' ? 0.805 - 0.30 * Math.exp(-0.34 * e)
        : r === 'good' ? 0.985 - 0.30 * Math.exp(-0.32 * e)
          : 0.999 - 0.34 * Math.exp(-0.52 * e)
    const scale = m === 'loss' ? 0.012 : 0.004
    return { x: e, y: base + n0[i] * scale }
  })

  const val = es.map((e, i) => {
    const base = m === 'loss'
      ? r === 'underfit' ? 1.30 * Math.exp(-0.32 * e) + 0.735
        : r === 'good' ? 0.37 * Math.exp(-0.26 * e) + 0.076
          : 0.34 * Math.exp(-0.50 * e) + 0.061 + 0.0105 * Math.max(0, e - 7) ** 1.35
      : r === 'underfit' ? 0.796 - 0.30 * Math.exp(-0.32 * e)
        : r === 'good' ? 0.977 - 0.30 * Math.exp(-0.30 * e)
          : 0.976 - 0.32 * Math.exp(-0.52 * e) - 0.0018 * Math.max(0, e - 7)
    const scale = m === 'loss' ? 0.014 : 0.005
    return { x: e, y: base + n1[i] * scale }
  })

  return { train, val }
}

const data = computed(() => curves(regime.value, metric.value))

/** Read off the curve, not written down: the marker cannot disagree with it. */
const best = computed(() => {
  const { val } = data.value
  const pick = metric.value === 'loss'
    ? val.reduce((a, b) => (b.y < a.y ? b : a))
    : val.reduce((a, b) => (b.y > a.y ? b : a))
  return pick
})

const yDomain = computed<[number, number]>(() => {
  if (metric.value === 'accuracy')
    return [0, 1]
  const top = Math.max(...data.value.train.map(p => p.y), ...data.value.val.map(p => p.y))
  return [0, Math.ceil(top * 11) / 10]
})

const at = computed(() => ({
  train: data.value.train[epoch.value - 1],
  val: data.value.val[epoch.value - 1],
}))

const gap = computed(() => at.value.val.y - at.value.train.y)

const VERDICT: Record<Regime, string> = {
  underfit: 'Both curves are high and nearly flat: the model cannot fit even the data it is shown. Nothing here is a generalisation problem — the fix is a bigger network, a higher learning rate, or more epochs, and no amount of regularisation will help.',
  good: 'Both curves fall and level off together, with a small steady gap. This is what you are aiming for. Training longer will buy very little; the next gain comes from a better model, which for images means Lecture 04.',
  overfit: 'Training loss keeps falling while validation loss turns and climbs. From that turning point on, the network is memorising the training set. Stop at the marked epoch, or add regularisation — and note that training accuracy still looks wonderful throughout.',
}

const fmt = (v: number) => v.toFixed(3)

/*
 * The marker label sits beside its epoch line, which for a monotone curve is
 * the last epoch — and a label anchored `start` there runs off the plot and out
 * of the SVG entirely. Flip it inward past the halfway point.
 */
const labelRight = computed(() => best.value.x > EPOCHS * 0.55)
</script>

<template>
  <WidgetFrame max-width="38rem">
    <Plot2D
      :x-domain="[1, EPOCHS]"
      :y-domain="yDomain"
      :width="520"
      :height="270"
      x-label="epoch"
      :y-label="metric === 'loss' ? 'loss' : 'accuracy'"
      :x-ticks="[1, 5, 10, 15, 20]"
    >
      <PlotLine
        :from="[best.x, yDomain[0]]"
        :to="[best.x, yDomain[1]]"
        color="var(--dl-danger)"
        :width="1.2"
        dashed
      />
      <PlotCurve :points="data.train" color="var(--dl-accent)" :width="2.4" />
      <PlotCurve :points="data.val" color="var(--dl-heading)" :width="2.4" dashed />
      <PlotLine
        :from="[epoch, yDomain[0]]"
        :to="[epoch, yDomain[1]]"
        color="var(--dl-muted)"
        :width="1"
      />
      <PlotLabel
        :at="[best.x, metric === 'loss' ? yDomain[1] : yDomain[0]]"
        :dx="labelRight ? -6 : 6"
        :dy="metric === 'loss' ? 12 : -8"
        :anchor="labelRight ? 'end' : 'start'"
        color="var(--dl-danger)"
        :size="11"
        bold
        :text="`best validation ${metric} — epoch ${best.x}`"
      />
    </Plot2D>

    <template #controls>
      <button
        v-for="r in REGIMES"
        :key="r.key"
        type="button"
        class="dl-lc__tab"
        :class="{ 'is-active': regime === r.key }"
        @click="regime = r.key"
      >{{ r.tab }}</button>
      <span class="dl-lc__sep" aria-hidden="true"></span>
      <StepButton
        :label="metric === 'loss' ? 'loss' : 'accuracy'"
        variant="ghost"
        glyph="⇄"
        @click="metric = metric === 'loss' ? 'accuracy' : 'loss'"
      />
      <Slider v-model="epoch" label="epoch" :min="1" :max="EPOCHS" :step="1" :precision="0" />
    </template>

    <template #readout>
      <div class="dl-lc__legend">
        <span><i class="is-train" />training</span>
        <span><i class="is-val" />validation</span>
        <span>epoch {{ epoch }} — train <strong>{{ fmt(at.train.y) }}</strong>, validation <strong>{{ fmt(at.val.y) }}</strong>,
          gap <strong>{{ (metric === 'loss' ? gap : -gap).toFixed(3) }}</strong></span>
      </div>
      <div class="dl-lc__note">{{ VERDICT[regime] }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-lc__tab {
  padding: 0.24rem 0.66rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-lc__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-lc__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-lc__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-lc__sep {
  width: 1px;
  height: 1.1rem;
  background: var(--dl-border);
}

.dl-lc__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem 1.1rem;
  margin-bottom: 0.2rem;
}

.dl-lc__legend i {
  display: inline-block;
  width: 1.1rem;
  height: 0;
  margin-right: 0.35rem;
  vertical-align: middle;
  border-top-width: 2.4px;
}

.dl-lc__legend i.is-train {
  border-top-style: solid;
  border-top-color: var(--dl-accent);
}

.dl-lc__legend i.is-val {
  border-top-style: dashed;
  border-top-color: var(--dl-heading);
}

.dl-lc__legend strong {
  color: var(--dl-accent);
  font-variant-numeric: tabular-nums;
}

.dl-lc__note {
  line-height: 1.35;
}
</style>
