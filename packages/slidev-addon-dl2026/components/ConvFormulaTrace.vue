<script setup lang="ts">
/*
 * The index bookkeeping inside y[i] = sum_k x[i+k] w[k], written out.
 *
 * Conv1DLab already shows the window sliding, and students follow it happily —
 * and then cannot read the formula, because nothing on the slide connects the
 * moving picture to the two subscripts. This widget is that connection and
 * nothing else: pick an output, then walk one line at a time from the sum, to
 * the resolved indices, to the numbers, to the answer.
 *
 * The four lines are the four things a student has to do in their head, in the
 * order they have to do them. Every one of them is on screen at once by the end,
 * which is what makes it checkable rather than magic.
 */
import { computed, ref } from 'vue'
import { conv1d, num } from '../composables/useConvolution'

const props = withDefaults(defineProps<{
  input?: number[]
  kernel?: number[]
  /** Kept for completeness; the slide that uses this widget runs at p = 0. */
  padding?: number
  stride?: number
}>(), {
  input: () => [3, 2, 1, 7, 1, 2, 5, 4],
  kernel: () => [0.5, 0.75, 1, 0.25],
  padding: 0,
  stride: 1,
})

const result = computed(() => conv1d(props.input, props.kernel, {
  padding: props.padding,
  stride: props.stride,
}))

const count = computed(() => result.value.steps.length)

/** Which output element we are deriving. */
const index = ref(0)
/** How many of the four derivation lines are showing. */
const line = ref(1)

const current = computed(() => result.value.steps[Math.min(index.value, count.value - 1)])

const LINES = 4

function step() {
  if (line.value < LINES) {
    line.value += 1
    return
  }
  index.value = (index.value + 1) % count.value
  line.value = 1
}

function reset() {
  index.value = 0
  line.value = 1
}

const atEnd = computed(() => index.value === count.value - 1 && line.value === LINES)

const paddedLength = computed(() => result.value.padded.length)

function isPad(i: number) {
  return i < props.padding || i >= props.padding + props.input.length
}

function inWindow(i: number) {
  const s = current.value
  return !!s && i >= s.start && i < s.start + props.kernel.length
}

/** 1-based CSS grid column the kernel currently occupies. */
const kernelColumn = computed(() => (current.value?.start ?? 0) + 1)

/*
 * Each line is built separately so the reveal can stop part-way through, and
 * the aligned environment is closed at whatever line we have reached — KaTeX
 * will not typeset a half-open block.
 */
const derivation = computed(() => {
  const s = current.value
  if (!s)
    return ''
  const i = s.index
  const kMax = props.kernel.length - 1

  const rows = [
    `y[${i}] &= \\sum_{k=0}^{${kMax}} x[i + k]\\, w[k] \\quad \\text{with } i = ${i}`,
    `&= ${s.taps.map((t, k) => `x[${t.at}]\\, w[${k}]`).join(' + ')}`,
    `&= ${s.taps.map(t => `${num(t.x)} \\times ${num(t.w)}`).join(' + ')}`,
    `&= \\mathbf{${num(s.sum)}}`,
  ].slice(0, line.value)

  return `\\begin{aligned} ${rows.join(' \\\\ ')} \\end{aligned}`
})

const CAPTIONS = [
  'the sum, with i fixed — one term per weight, not one per pixel',
  'i + k resolved: the window starts at i and k walks across it',
  'the numbers those indices name',
  'one output element',
]

const caption = computed(() => CAPTIONS[line.value - 1])
</script>

<template>
  <WidgetFrame max-width="44rem">
    <div class="dl-trace">
      <!-- Index ruler, because the whole widget is about which index is which. -->
      <div class="dl-trace__label" />
      <div class="dl-trace__row" :style="{ gridTemplateColumns: `repeat(${paddedLength}, var(--cell))` }">
        <div v-for="(_, i) in result.padded" :key="`i${i}`" class="dl-trace__ruler">{{ i }}</div>
      </div>

      <div class="dl-trace__label">x</div>
      <div class="dl-trace__row" :style="{ gridTemplateColumns: `repeat(${paddedLength}, var(--cell))` }">
        <div
          v-for="(v, i) in result.padded"
          :key="`x${i}`"
          class="dl-trace__cell"
          :class="{ 'is-pad': isPad(i), 'is-window': inWindow(i) }"
        >{{ num(v) }}</div>
      </div>

      <div class="dl-trace__label">w</div>
      <div class="dl-trace__row" :style="{ gridTemplateColumns: `repeat(${paddedLength}, var(--cell))` }">
        <div class="dl-trace__kernel" :style="{ gridColumn: `${kernelColumn} / span ${props.kernel.length}` }">
          <div v-for="(w, k) in result.kernel" :key="`w${k}`" class="dl-trace__cell is-kernel">
            {{ num(w) }}
            <span class="dl-trace__k">k = {{ k }}</span>
          </div>
        </div>
      </div>

      <div class="dl-trace__label" />
      <div class="dl-trace__math dl-math-sm">
        <Katex :expr="derivation" display />
      </div>
    </div>

    <template #controls>
      <StepButton :label="atEnd ? 'Start over' : 'Next step'" glyph="▸" @click="atEnd ? reset() : step()" />
      <StepButton label="Reset" variant="ghost" glyph="↺" @click="reset" />
    </template>

    <template #readout>
      Output <strong>{{ index + 1 }}</strong> of {{ count }}, line {{ line }} of {{ LINES }} — {{ caption }}.
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-trace {
  --cell: 2.4rem;
  display: grid;
  grid-template-columns: 1.4rem 1fr;
  align-items: center;
  gap: 0.35rem 0.5rem;
  width: 100%;
}

.dl-trace__label {
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 600;
  color: var(--dl-heading);
  text-align: right;
}

.dl-trace__row {
  display: grid;
  justify-content: center;
}

.dl-trace__ruler {
  text-align: center;
  font-size: 0.7rem;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-trace__cell {
  position: relative;
  height: 2rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--dl-border);
  margin-right: -1px;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-heading);
  background: var(--dl-bg);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.dl-trace__cell.is-pad {
  color: var(--dl-muted);
  background: var(--dl-surface);
  border-style: dashed;
}

.dl-trace__cell.is-window {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  z-index: 1;
}

.dl-trace__kernel {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--cell);
  transition: grid-column 0.25s ease;
}

.dl-trace__cell.is-kernel {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  font-weight: 600;
  color: var(--dl-accent-strong);
}

/* The k label hangs below its weight, so the two rulers cannot be confused. */
.dl-trace__k {
  position: absolute;
  top: 100%;
  font-size: 0.62rem;
  color: var(--dl-muted);
  white-space: nowrap;
}

.dl-trace__math {
  margin-top: 1.1rem;
  min-height: 6.4rem;
  color: var(--dl-heading);
}

.dl-trace__math :deep(.katex-display) {
  margin: 0;
  text-align: left;
}

.dl-trace__math :deep(.katex-display > .katex) {
  text-align: left;
}
</style>
