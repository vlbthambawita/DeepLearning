<script setup lang="ts">
/*
 * The 1D convolution, driven one output element at a time.
 *
 * This replaces 2025 Lecture 03 slides 10–15, which were six static pictures of
 * the same operation with different values of p and s. One widget with p and s
 * on sliders says the same thing and answers the question the pictures kept
 * raising — "what happens if I change it?" — in the room rather than afterwards.
 *
 * The window is drawn in the padded coordinate system, so padding stops being a
 * separate topic: turn p up and the window simply has somewhere to stand.
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { conv1d, num, outputSize } from '../composables/useConvolution'

const props = withDefaults(defineProps<{
  input?: number[]
  kernel?: number[]
  padding?: number
  stride?: number
  /**
   * Rotate the kernel — textbook convolution instead of the cross-correlation
   * `nn.Conv2d` actually computes. The deck's worked examples come from a book
   * that flips; the code the students write does not.
   */
  flip?: boolean
  /** Which parameters the room may change. */
  controls?: Array<'padding' | 'stride' | 'flip'>
  /** Show the output-size formula with the current numbers substituted in. */
  formula?: boolean
  /** Start with every output computed rather than an empty output row. */
  complete?: boolean
}>(), {
  input: () => [3, 2, 1, 7, 1, 2, 5, 4],
  kernel: () => [0.5, 0.75, 1, 0.25],
  padding: 0,
  stride: 1,
  flip: false,
  controls: () => [],
  formula: false,
  complete: false,
})

const padding = ref(props.padding)
const stride = ref(props.stride)
const flip = ref(props.flip)

const result = computed(() => conv1d(props.input, props.kernel, {
  padding: padding.value,
  stride: stride.value,
  flip: flip.value,
}))

/** How many output elements have been computed. -1 = nothing yet. */
const at = ref(props.complete ? Number.MAX_SAFE_INTEGER : -1)
const timer = ref<number | null>(null)

const count = computed(() => result.value.steps.length)
const cursor = computed(() => Math.min(at.value, count.value - 1))
const current = computed(() => (cursor.value < 0 ? null : result.value.steps[cursor.value]))
const done = computed(() => cursor.value >= count.value - 1)

/** Changing p, s or the flip invalidates every value already on screen. */
watch([padding, stride, flip], () => reset())

function stop() {
  if (timer.value !== null) {
    clearInterval(timer.value)
    timer.value = null
  }
}

onUnmounted(stop)

function reset() {
  stop()
  at.value = props.complete ? count.value - 1 : -1
}

function step() {
  if (cursor.value < count.value - 1)
    at.value = cursor.value + 1
  else
    at.value = -1
}

function play() {
  stop()
  at.value = -1
  timer.value = window.setInterval(() => {
    if (cursor.value >= count.value - 1) {
      stop()
      return
    }
    at.value = cursor.value + 1
  }, 700)
}

const shows = (name: 'padding' | 'stride' | 'flip') => props.controls.includes(name)

/** Where the kernel sits right now, in 1-based CSS grid columns. */
const kernelColumn = computed(() => (current.value ? current.value.start + 1 : 1))

/**
 * Outputs are placed under the middle of the window that produced them, which
 * is what makes a stride visible: turn s up and the output row spreads out.
 */
function outputColumn(i: number) {
  return i * stride.value + Math.ceil(props.kernel.length / 2)
}

const paddedLength = computed(() => result.value.padded.length)

function isPad(i: number) {
  return i < padding.value || i >= padding.value + props.input.length
}

function inWindow(i: number) {
  return current.value !== null && i >= current.value.start && i < current.value.start + props.kernel.length
}

const expression = computed(() => {
  if (!current.value)
    return ''
  const terms = current.value.taps
    .map(t => `${num(t.x)}\\times ${num(t.w)}`)
    .join(' + ')
  return `y[${current.value.index}] = ${terms} = ${num(current.value.sum)}`
})

const sizeExpr = computed(() => {
  const n = props.input.length
  const m = props.kernel.length
  const p = padding.value
  const s = stride.value
  return `o = \\left\\lfloor\\frac{${n} + 2\\times ${p} - ${m}}{${s}}\\right\\rfloor + 1 = ${outputSize(n, m, p, s)}`
})
</script>

<template>
  <WidgetFrame max-width="46rem">
    <div class="dl-conv1d">
      <!-- Input row, in padded coordinates. -->
      <div class="dl-conv1d__label">x<span v-if="padding > 0" class="sup">p</span></div>
      <div class="dl-conv1d__row" :style="{ gridTemplateColumns: `repeat(${paddedLength}, var(--cell))` }">
        <div
          v-for="(v, i) in result.padded"
          :key="`x${i}`"
          class="dl-cell"
          :class="{ 'is-pad': isPad(i), 'is-window': inWindow(i) }"
        >{{ num(v) }}</div>
      </div>

      <!-- Kernel, positioned under the window it is currently reading. -->
      <div class="dl-conv1d__label">w<span v-if="flip" class="sup">r</span></div>
      <div class="dl-conv1d__row" :style="{ gridTemplateColumns: `repeat(${paddedLength}, var(--cell))` }">
        <div
          class="dl-conv1d__kernel"
          :class="{ 'is-parked': current === null }"
          :style="{ gridColumn: `${kernelColumn} / span ${props.kernel.length}` }"
        >
          <div v-for="(w, k) in result.kernel" :key="`w${k}`" class="dl-cell is-kernel">{{ num(w) }}</div>
        </div>
      </div>

      <!-- Output row, each element under the centre of its own window. -->
      <div class="dl-conv1d__label">y</div>
      <div class="dl-conv1d__row" :style="{ gridTemplateColumns: `repeat(${paddedLength}, var(--cell))` }">
        <div
          v-for="(v, i) in result.output"
          :key="`y${i}`"
          class="dl-cell is-out"
          :class="{ 'is-empty': i > cursor, 'is-current': i === cursor }"
          :style="{ gridColumn: outputColumn(i) }"
        >{{ i > cursor ? '' : num(v) }}</div>
      </div>
    </div>

    <template #controls>
      <StepButton :label="done ? 'Start over' : 'Next output'" glyph="▸" @click="step" />
      <StepButton label="Run" variant="ghost" glyph="▶" @click="play" />
      <Slider v-if="shows('padding')" v-model="padding" label="padding p" :min="0" :max="4" :step="1" :precision="0" />
      <Slider v-if="shows('stride')" v-model="stride" label="stride s" :min="1" :max="4" :step="1" :precision="0" />
      <label v-if="shows('flip')" class="dl-conv1d__toggle">
        <input v-model="flip" type="checkbox">
        rotate the kernel first
      </label>
    </template>

    <template #readout>
      <div v-if="current" class="dl-math-sm">
        <Katex :expr="expression" />
      </div>
      <div v-else>
        {{ count }} output {{ count === 1 ? 'element' : 'elements' }} for this
        n = {{ props.input.length }}, m = {{ props.kernel.length }}, p = {{ padding }}, s = {{ stride }}.
        Press <strong>Next output</strong>.
      </div>
      <div v-if="props.formula" class="dl-conv1d__size dl-math-sm">
        <Katex :expr="sizeExpr" />
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-conv1d {
  --cell: 2.5rem;
  display: grid;
  grid-template-columns: 1.6rem 1fr;
  align-items: center;
  gap: 0.5rem 0.5rem;
  width: 100%;
}

.dl-conv1d__label {
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 600;
  color: var(--dl-heading);
  text-align: right;
}

.dl-conv1d__label .sup {
  font-size: 0.7em;
  vertical-align: super;
  font-style: normal;
}

.dl-conv1d__row {
  display: grid;
  justify-content: center;
  min-height: 2.2rem;
}

.dl-cell {
  height: 2.1rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--dl-border);
  margin-right: -1px;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-heading);
  background: var(--dl-bg);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.dl-cell.is-pad {
  color: var(--dl-muted);
  background: var(--dl-surface);
  border-style: dashed;
}

.dl-cell.is-window {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  position: relative;
  z-index: 1;
}

.dl-conv1d__kernel {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--cell);
  transition: grid-column 0.25s ease;
}

.dl-conv1d__kernel.is-parked {
  opacity: 0.55;
}

.dl-cell.is-kernel {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  font-weight: 600;
  color: var(--dl-accent-strong);
}

.dl-cell.is-out {
  border-color: var(--dl-heading);
  font-weight: 600;
}

.dl-cell.is-out.is-empty {
  border-color: var(--dl-border);
  border-style: dashed;
  background: transparent;
}

.dl-cell.is-out.is-current {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
}

.dl-conv1d__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-conv1d__toggle input {
  accent-color: var(--dl-accent);
  cursor: pointer;
}

.dl-conv1d__size {
  margin-top: 0.2rem;
  color: var(--dl-body);
}
</style>
