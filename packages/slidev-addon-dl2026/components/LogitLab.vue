<script setup lang="ts">
/*
 * Logits, the probabilities they turn into, and the loss that follows — with
 * the numbers on sliders.
 *
 * The loss table two slides later is four rows of "expects logits" versus
 * "expects probabilities", and the words mean nothing until a student has seen
 * one turn into the other. Here they drag a raw score and watch softmax (or
 * sigmoid) respond, with the loss reading out live.
 *
 * The three demonstrations worth driving in the room:
 *   - **Add 2 to every logit** and nothing happens. Softmax reads *differences*,
 *     so logits are only meaningful relative to each other.
 *   - Widen the gap and confidence rises, but never reaches 1.
 *   - The loss watches exactly one bar — the true class. The others matter only
 *     through the normalisation.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'

const props = withDefaults(defineProps<{
  mode?: 'multiclass' | 'binary'
  classes?: string[]
  logits?: number[]
  /** Index of the correct class; in binary mode, 1 means "positive". */
  trueClass?: number
  /** Slider range for the raw scores. */
  range?: [number, number]
}>(), {
  mode: 'multiclass',
  classes: () => ['cat', 'dog', 'bird'],
  logits: () => [2, 0.5, -1],
  trueClass: 0,
  range: () => [-6, 6],
})

const z = ref<number[]>([...props.logits])
const truth = ref(props.trueClass)

function reset() {
  z.value = [...props.logits]
  truth.value = props.trueClass
}

/** The shift-invariance demo: same probabilities, completely different logits. */
function shiftAll() {
  z.value = z.value.map(v => Math.min(props.range[1], v + 2))
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

const probs = computed(() => {
  if (props.mode === 'binary') {
    const p = sigmoid(z.value[0])
    return [1 - p, p]
  }
  // Softmax, shifted by the max for the same reason PyTorch does it: exp(700)
  // overflows and the answer is unchanged.
  const m = Math.max(...z.value)
  const e = z.value.map(v => Math.exp(v - m))
  const sum = e.reduce((a, b) => a + b, 0)
  return e.map(v => v / sum)
})

/*
 * Binary mode has two rows and one score. Row 1 is the positive class — the one
 * sigmoid reports — so a caller passing `classes` lists the negative one first.
 */
const labels = computed(() => {
  if (props.mode !== 'binary')
    return props.classes
  return props.classes.length >= 2
    ? [`${props.classes[0]} (y=0)`, `${props.classes[1]} (y=1)`]
    : ['y = 0', 'y = 1']
})

/** Cross-entropy on one example is one term: −log of the true class's probability. */
const loss = computed(() => -Math.log(Math.max(probs.value[truth.value] ?? 1e-12, 1e-12)))

const rows = computed(() => labels.value.map((name, i) => ({
  i,
  name,
  /** Binary mode has one score, and class 0 is its mirror image. */
  z: props.mode === 'binary' ? (i === 1 ? z.value[0] : -z.value[0]) : z.value[i],
  p: probs.value[i],
  isTrue: i === truth.value,
})))

/* ---- bar geometry, in percent of the track ------------------------------- */

const span = computed(() => props.range[1] - props.range[0])
const zeroPct = computed(() => ((0 - props.range[0]) / span.value) * 100)

function zBar(v: number) {
  const w = (Math.abs(v) / span.value) * 100
  return {
    left: `${v >= 0 ? zeroPct.value : zeroPct.value - w}%`,
    width: `${w}%`,
  }
}

const sumOfProbs = computed(() => probs.value.reduce((a, b) => a + b, 0))
</script>

<template>
  <WidgetFrame max-width="40rem">
    <div class="dl-logit">
      <span class="dl-logit__head" />
      <span class="dl-logit__head">raw score <em>z</em> — a logit</span>
      <span class="dl-logit__head">probability</span>
      <span class="dl-logit__head" />

      <template v-for="row in rows" :key="row.i">
        <div class="dl-logit__name" :class="{ 'is-true': row.isTrue }">{{ row.name }}</div>

        <!-- Logits are signed, so the track carries a zero line. -->
        <div class="dl-logit__track">
          <div class="dl-logit__zero" :style="{ left: `${zeroPct}%` }" />
          <div
            class="dl-logit__z"
            :class="{ 'is-neg': row.z < 0 }"
            :style="zBar(row.z)"
          />
          <span class="dl-logit__zval">{{ num(row.z) }}</span>
        </div>

        <div class="dl-logit__track is-prob">
          <div class="dl-logit__p" :class="{ 'is-true': row.isTrue }" :style="{ width: `${row.p * 100}%` }" />
          <span class="dl-logit__pval">{{ num(row.p) }}</span>
        </div>

        <div class="dl-logit__loss">
          <span v-if="row.isTrue">−log {{ num(row.p) }} = <strong>{{ num(loss) }}</strong></span>
          <span v-else class="dl-logit__muted">—</span>
        </div>
      </template>
    </div>

    <template #controls>
      <template v-if="props.mode === 'binary'">
        <Slider v-model="z[0]" label="score z" :min="props.range[0]" :max="props.range[1]" :step="0.25" :precision="2" />
      </template>
      <template v-else>
        <Slider
          v-for="(_, i) in z"
          :key="`s${i}`"
          v-model="z[i]"
          :label="`z(${props.classes[i]})`"
          :min="props.range[0]" :max="props.range[1]" :step="0.25" :precision="2"
        />
        <StepButton label="+2 to every logit" variant="ghost" glyph="↑" @click="shiftAll" />
      </template>

      <StepButton
        v-for="row in rows"
        :key="`t${row.i}`"
        :label="`truth: ${row.name}`"
        :variant="row.isTrue ? 'primary' : 'ghost'"
        @click="truth = row.i"
      />
      <StepButton label="Reset" variant="ghost" glyph="↺" @click="reset" />
    </template>

    <template #readout>
      <template v-if="props.mode === 'binary'">
        One score in, one probability out: <strong>σ({{ num(z[0]) }}) = {{ num(probs[1]) }}</strong>,
        and the other class takes the remaining {{ num(probs[0]) }}. z = 0 is exactly 0.5 — the decision
        threshold. With the label as it stands, the loss is <strong>{{ num(loss) }}</strong>.
      </template>
      <template v-else>
        The {{ z.length }} probabilities sum to {{ num(sumOfProbs) }} — always. Only the
        <strong>{{ labels[truth] }}</strong> bar enters the loss; the others act on it by taking away
        probability. Press <strong>+2 to every logit</strong>: every score moves, nothing else does.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-logit {
  display: grid;
  grid-template-columns: 7.4rem 1fr 1fr 8.5rem;
  align-items: center;
  gap: 0.45rem 0.7rem;
  width: 100%;
  font-size: 0.85rem;
}

/* Header cells are direct grid children — no subgrid, which the PDF export's
   Chromium is not guaranteed to have. */
.dl-logit__head {
  font-size: 0.72rem;
  color: var(--dl-muted);
}

.dl-logit__head em {
  font-style: italic;
}

.dl-logit__name {
  color: var(--dl-body);
  text-align: right;
}

.dl-logit__name.is-true {
  color: var(--dl-heading);
  font-weight: 700;
}

.dl-logit__track {
  position: relative;
  height: 1.5rem;
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  border-radius: 3px;
}

.dl-logit__zero {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--dl-muted);
}

.dl-logit__z {
  position: absolute;
  top: 3px;
  bottom: 3px;
  background: var(--dl-accent);
  border-radius: 2px;
  transition: left 0.12s ease, width 0.12s ease;
}

.dl-logit__z.is-neg {
  background: var(--dl-danger);
}

.dl-logit__p {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 0;
  background: var(--dl-border);
  border-radius: 2px;
  transition: width 0.12s ease;
}

.dl-logit__p.is-true {
  background: var(--dl-accent);
}

.dl-logit__zval,
.dl-logit__pval {
  position: absolute;
  right: 0.35rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.74rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-heading);
}

.dl-logit__loss {
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-heading);
}

.dl-logit__muted {
  color: var(--dl-muted);
}
</style>
