<script setup lang="ts">
/*
 * h_t = tanh(W_xh x_t + W_hh h_{t-1} + b), taken apart one line at a time.
 *
 * The same job `ConvFormulaTrace` does for the convolution, and for the same
 * reason: `RnnUnroll` shows the chain and students follow it happily, then
 * cannot read the equation, because nothing on the slide connects the picture to
 * the two matrices. Line 3 is the one that matters — the input's contribution
 * and the past's contribution, side by side as two vectors, before they are
 * added. Once a student can produce that line they can hand-run an RNN.
 *
 * The numbers come from `useRecurrence`, so this widget and the unrolled chain
 * cannot drift apart, and the sequence is x = 1, 0, 1, 0 so that step 2 makes
 * the point on its own: zero input, non-zero state.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'
import { DEMO_RNN, rnnForward } from '../composables/useRecurrence'

const props = withDefaults(defineProps<{
  steps?: number
}>(), {
  steps: 4,
})

const inputs = computed(() =>
  Array.from({ length: props.steps }, (_, i) => [i % 2 === 0 ? 1 : 0]))

const trace = computed(() => rnnForward(inputs.value, DEMO_RNN))

/** Which time step we are deriving. */
const index = ref(0)
/** How many of the four lines are showing. */
const line = ref(1)

const LINES = 4

const current = computed(() => trace.value[Math.min(index.value, props.steps - 1)])
const atEnd = computed(() => index.value === props.steps - 1 && line.value === LINES)

function step() {
  if (line.value < LINES) {
    line.value += 1
    return
  }
  index.value = (index.value + 1) % props.steps
  line.value = 1
}

function reset() {
  index.value = 0
  line.value = 1
}

/* ---- LaTeX helpers ------------------------------------------------------- */

const col = (v: number[]) => `\\begin{bmatrix}${v.map(x => num(x)).join(' \\\\ ')}\\end{bmatrix}`
const mat = (m: number[][]) => `\\begin{bmatrix}${m.map(r => r.map(x => num(x)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`

const derivation = computed(() => {
  const s = current.value
  const t = s.t

  const rows = [
    `h_{${t}} &= \\tanh\\!\\left(W_{xh}\\,x_{${t}} + W_{hh}\\,h_{${t - 1}} + b_h\\right)`,
    `&= \\tanh\\!\\left(${mat(DEMO_RNN.wxh)}${col(s.x)} + ${mat(DEMO_RNN.whh)}${col(s.hPrev)}\\right)`,
    `&= \\tanh\\!\\left(${col(s.fromInput)} + ${col(s.fromState)}\\right)`,
    `&= \\tanh${col(s.z)} = \\mathbf{${col(s.h)}}`,
  ].slice(0, line.value)

  return `\\begin{aligned} ${rows.join(' \\\\[4pt] ')} \\end{aligned}`
})

const CAPTIONS = [
  'one rule, and it is the same rule at every step — only x and h carry a t',
  'the numbers: the same two matrices as every other step, and b = 0 here',
  'what this step’s input brought, beside what everything before it brought',
  'add them, squash with tanh — and that is the state the next step will read',
]

const caption = computed(() => CAPTIONS[line.value - 1])
</script>

<template>
  <WidgetFrame max-width="42rem">
    <div class="dl-rtrace">
      <!-- The sequence, with the step being derived marked. -->
      <div class="dl-rtrace__strip">
        <div class="dl-rtrace__key">x</div>
        <div
          v-for="(x, i) in inputs"
          :key="`x${i}`"
          class="dl-rtrace__cell"
          :class="{ 'is-current': i === index }"
        >{{ x[0] }}</div>
      </div>

      <div class="dl-rtrace__strip">
        <div class="dl-rtrace__key">h</div>
        <div
          v-for="(s, i) in trace"
          :key="`h${i}`"
          class="dl-rtrace__cell is-state"
          :class="{ 'is-current': i === index, 'is-empty': i > index || (i === index && line < LINES) }"
        >{{ i > index || (i === index && line < LINES) ? '' : `${num(s.h[0])}, ${num(s.h[1])}` }}</div>
      </div>

      <div class="dl-rtrace__math">
        <Katex :expr="derivation" display />
      </div>
    </div>

    <template #controls>
      <StepButton :label="atEnd ? 'Start over' : 'Next line'" glyph="▸" @click="atEnd ? reset() : step()" />
      <StepButton label="Reset" variant="ghost" glyph="↺" @click="reset" />
    </template>

    <template #readout>
      Step <strong>{{ current.t }}</strong> of {{ props.steps }}, line {{ line }} of {{ LINES }} —
      {{ caption }}.
      <span v-if="line === LINES">
        The output is then o<sub>{{ current.t }}</sub> = W<sub>ho</sub>h<sub>{{ current.t }}</sub> =
        <strong>{{ num(current.o[0]) }}</strong>.
      </span>
      <span v-if="line === LINES && current.x[0] === 0" class="dl-rtrace__note">
        x<sub>{{ current.t }}</sub> = 0, and h<sub>{{ current.t }}</sub> ≠ 0. Every number in it came
        from earlier steps.
      </span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-rtrace {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
}

.dl-rtrace__strip {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.dl-rtrace__key {
  width: 1.2rem;
  text-align: right;
  font-size: 0.95rem;
  font-style: italic;
  font-weight: 600;
  color: var(--dl-heading);
}

.dl-rtrace__cell {
  width: 4.9rem;
  height: 1.8rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--dl-border);
  border-radius: 3px;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-heading);
  background: var(--dl-bg);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.dl-rtrace__cell.is-state {
  font-size: 0.7rem;
}

.dl-rtrace__cell.is-empty {
  border-style: dashed;
  background: transparent;
}

.dl-rtrace__cell.is-current {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  font-weight: 600;
}

/*
 * Two decisions, both forced by measurement rather than taste.
 *
 * The size: three of the four rows are a 2x1 matrix tall, and at the theme's
 * `dl-math-xs` the finished derivation is 279px against a 368px stage — it fits,
 * but it touches the heading above and the buttons below. One notch smaller and
 * there is 18px of air at each end.
 *
 * The reserved height: 9.7rem is the height of the *finished* derivation, not the
 * current one. Sizing to the current line makes the whole widget — strips,
 * buttons and readout — walk down the slide on every press, which is impossible
 * to talk over from a lectern.
 */
.dl-rtrace__math :deep(.katex) {
  font-size: 0.66em;
}

.dl-rtrace__math {
  margin-top: 0.7rem;
  min-height: 9.7rem;
  color: var(--dl-heading);
}

.dl-rtrace__math :deep(.katex-display) {
  margin: 0;
}

.dl-rtrace__note {
  display: block;
  margin-top: 0.15rem;
  color: var(--dl-accent);
}
</style>
