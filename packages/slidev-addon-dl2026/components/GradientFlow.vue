<script setup lang="ts">
/*
 * Why a plain RNN cannot learn long-range structure — 2025 Lecture 5/6 slide 11,
 * which asserted "vanishing and exploding gradients" beside a book figure and
 * offered three fixes without ever showing the problem.
 *
 * The problem is one number raised to a power. Backpropagation through time
 * multiplies by the same recurrent weight once per step it travels backwards, so
 * the gradient reaching k steps into the past carries a factor of w^k. Put that
 * on a log axis with w on a slider and the three regimes — vanish, hold,
 * explode — are one drag apart, and the knife-edge at exactly 1 is visibly a
 * knife edge rather than a claim.
 *
 * `mode="gated"` puts the LSTM's cell-state path beside it: the same picture,
 * with the fixed w replaced by a forget gate the network can learn to leave
 * open. That comparison is the entire argument for gating, and it is the reason
 * this widget is reused two sections later rather than a new one being written.
 */
import { computed, ref } from 'vue'
import { decayChain, usefulHorizon } from '../composables/useRecurrence'

const props = withDefaults(defineProps<{
  mode?: 'decay' | 'gated'
  /** How far back through the sequence to plot. */
  steps?: number
  /** Starting recurrent weight. */
  w?: number
  /** Starting forget-gate value, for the gated comparison. */
  forget?: number
  /** Offer the gradient-clipping ceiling. */
  clip?: boolean
}>(), {
  mode: 'decay',
  steps: 25,
  w: 0.6,
  forget: 0.99,
  clip: true,
})

const w = ref(props.w)
const forget = ref(props.forget)
const clipping = ref(false)

/** Clip threshold, as a multiple of one step's gradient. */
const THRESHOLD = 5
const CEILING = Math.log10(THRESHOLD)

const Y_MIN = -12
const Y_MAX = 4

/** log10 of a chain, floored so a zero factor does not produce -Infinity. */
function logChain(factor: number, capped: boolean) {
  return decayChain(factor, props.steps).map((v, k) => {
    const y = v === 0 ? Y_MIN - 1 : Math.log10(v)
    return { x: k, y: capped && y > CEILING ? CEILING : y }
  })
}

const plain = computed(() => logChain(w.value, clipping.value && props.clip))
const gated = computed(() => logChain(forget.value, false))

const regime = computed(() => {
  if (Math.abs(w.value - 1) < 1e-9)
    return 'hold'
  return w.value < 1 ? 'vanish' : 'explode'
})

const at20 = computed(() => Math.abs(w.value) ** Math.min(20, props.steps))
const gatedAt20 = computed(() => Math.abs(forget.value) ** Math.min(20, props.steps))
const horizon = computed(() => usefulHorizon(w.value, 0.01))

const SUPERSCRIPT: Record<string, string> = {
  '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074',
  '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
  '-': '\u207b', '+': '',
}

/**
 * Readable at both ends of a range spanning twenty orders of magnitude.
 *
 * The exponent is written with superscript characters rather than markup, because
 * this string also goes into a slider readout and an aria-label.
 */
function sci(v: number): string {
  if (v === 0)
    return '0'
  const abs = Math.abs(v)
  if (abs >= 0.001 && abs < 10000)
    return String(Number(v.toPrecision(3)))
  const [mantissa, exponent] = v.toExponential(1).split('e')
  return `${mantissa} \u00d7 10${[...exponent].map(c => SUPERSCRIPT[c] ?? c).join('')}`
}
</script>

<template>
  <WidgetFrame max-width="34rem">
    <Plot2D
      :x-domain="[0, props.steps]"
      :y-domain="[Y_MIN, Y_MAX]"
      :x-ticks="[0, 5, 10, 15, 20, 25]"
      :y-ticks="[-12, -9, -6, -3, 0, 3]"
      x-label="time steps back through the sequence"
      y-label="log₁₀ of the gradient's size"
      :width="520"
      :height="290"
    >
      <!-- Unity: the gradient neither grows nor shrinks. -->
      <PlotLine :from="[0, 0]" :to="[props.steps, 0]" color="var(--dl-muted)" :width="1.2" dashed />

      <PlotLine
        v-if="clipping && props.clip && props.mode === 'decay'"
        :from="[0, CEILING]" :to="[props.steps, CEILING]"
        color="var(--dl-danger)" :width="1.2" dashed
      />

      <PlotCurve
        :points="plain"
        :color="props.mode === 'gated' ? 'var(--dl-danger)' : 'var(--dl-accent)'"
        :width="2.6"
      />
      <PlotCurve v-if="props.mode === 'gated'" :points="gated" color="var(--dl-accent)" :width="2.6" />

      <PlotLabel
        v-if="props.mode === 'gated'"
        :at="[props.steps, gated[props.steps].y]" :dx="-6" :dy="-10" anchor="end"
        color="var(--dl-accent)" text="LSTM cell state — multiplied by the forget gate" :size="11" bold
      />
      <PlotLabel
        v-if="props.mode === 'gated'"
        :at="[props.steps, Math.min(Math.max(plain[props.steps].y, Y_MIN + 1), Y_MAX - 1)]"
        :dx="-6" :dy="22" anchor="end"
        color="var(--dl-danger)" text="plain RNN — multiplied by W" :size="11" bold
      />
      <PlotLabel
        v-if="clipping && props.clip && props.mode === 'decay'"
        :at="[1, CEILING]" :dx="4" :dy="-6"
        color="var(--dl-danger)" :text="`clipped at ${THRESHOLD}×`" :size="11"
      />
    </Plot2D>

    <template #controls>
      <Slider v-model="w" label="recurrent weight W" :min="0.2" :max="1.6" :step="0.05" :precision="2" />
      <Slider v-if="props.mode === 'gated'" v-model="forget" label="forget gate f" :min="0.8" :max="1" :step="0.005" :precision="3" />
      <label v-if="props.clip && props.mode === 'decay'" class="dl-gflow__toggle">
        <input v-model="clipping" type="checkbox">
        gradient clipping
      </label>
    </template>

    <template #readout>
      <template v-if="props.mode === 'gated'">
        Twenty steps back, the plain recurrence has multiplied by
        <strong>{{ sci(at20) }}</strong>; the cell state, by <strong>{{ sci(gatedAt20) }}</strong>.
        Push <em>f</em> to 1.000 and the factor is exactly <strong>1</strong> — the gradient reaches
        the start of the sequence undamaged.
      </template>
      <template v-else-if="regime === 'vanish'">
        <strong>Vanishing.</strong> Twenty steps back the gradient carries a factor of
        {{ w.toFixed(2) }}<sup>20</sup> = <strong>{{ sci(at20) }}</strong>. It is still worth 1% of
        its original size about <strong>{{ horizon }}</strong> steps back — past that, the end of the
        sentence cannot teach the weights that read its beginning.
      </template>
      <template v-else-if="regime === 'hold'">
        <strong>The knife edge.</strong> At exactly 1 the gradient neither shrinks nor grows. Nothing
        keeps a trained weight there, and this is one number out of a whole matrix.
      </template>
      <template v-else>
        <strong>Exploding.</strong> {{ w.toFixed(2) }}<sup>20</sup> = <strong>{{ sci(at20) }}</strong>,
        and by step {{ props.steps }} it is {{ sci(Math.abs(w) ** props.steps) }}. One long sequence
        and the update overshoots — the loss goes to NaN in a single batch.
        <template v-if="props.clip">
          Tick <strong>gradient clipping</strong>: the ceiling caps it. Notice it does nothing at all
          to the vanishing end.
        </template>
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-gflow__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-gflow__toggle input {
  accent-color: var(--dl-accent);
  cursor: pointer;
}
</style>
