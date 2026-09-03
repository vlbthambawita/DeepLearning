<script setup lang="ts">
/*
 * The 2D convolution, one output cell at a time.
 *
 * 2025 Lecture 03 slides 16–18 showed this as three static diagrams: the 8×8
 * schematic, the numeric example, and a fan-out figure of four elementwise
 * products with the answers already filled in. The arithmetic was on the slide
 * but never happened. Here the window moves, the nine products are written out
 * as they are read, and the answer lands in the output grid — which is the one
 * thing a student has to be able to do by hand before writing `nn.Conv2d`.
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { conv2d, num, outputSize } from '../composables/useConvolution'

const props = withDefaults(defineProps<{
  input?: number[][]
  kernel?: number[][]
  padding?: number
  stride?: number
  /** Textbook convolution rather than the cross-correlation PyTorch computes. */
  flip?: boolean
  controls?: Array<'padding' | 'stride' | 'flip'>
  /** Write out the nine products rather than just the sum. */
  terms?: boolean
}>(), {
  input: () => [[2, 1, 2], [5, 0, 1], [1, 7, 3]],
  kernel: () => [[0.5, 0.7, 0.4], [0.3, 0.4, 0.1], [0.5, 1, 0.5]],
  padding: 1,
  stride: 2,
  flip: false,
  controls: () => [],
  terms: true,
})

const padding = ref(props.padding)
const stride = ref(props.stride)
const flip = ref(props.flip)

const result = computed(() => conv2d(props.input, props.kernel, {
  padding: padding.value,
  stride: stride.value,
  flip: flip.value,
}))

const at = ref(-1)
const timer = ref<number | null>(null)

const count = computed(() => result.value.steps.length)
const cursor = computed(() => Math.min(at.value, count.value - 1))
const current = computed(() => (cursor.value < 0 ? null : result.value.steps[cursor.value]))
const done = computed(() => cursor.value >= count.value - 1)

const outRows = computed(() => result.value.output.length)
const outCols = computed(() => result.value.output[0]?.length ?? 0)
const kRows = computed(() => props.kernel.length)
const kCols = computed(() => props.kernel[0]?.length ?? 0)

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
  at.value = -1
}

function step() {
  at.value = cursor.value < count.value - 1 ? cursor.value + 1 : -1
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
  }, 800)
}

const shows = (name: 'padding' | 'stride' | 'flip') => props.controls.includes(name)

function isPad(r: number, c: number) {
  return r < padding.value || r >= padding.value + props.input.length
    || c < padding.value || c >= padding.value + (props.input[0]?.length ?? 0)
}

function inWindow(r: number, c: number) {
  if (!current.value)
    return false
  return r >= current.value.top && r < current.value.top + kRows.value
    && c >= current.value.left && c < current.value.left + kCols.value
}

/** Flat output index, so a cell can be compared against the cursor. */
function outIndex(r: number, c: number) {
  return r * outCols.value + c
}

const expression = computed(() => {
  if (!current.value)
    return ''
  const nonZero = current.value.taps.filter(t => t.x !== 0)
  const terms = nonZero.length === 0
    ? '0'
    : nonZero.map(t => `${num(t.x)}\\times ${num(t.w)}`).join(' + ')
  const head = `Y[${current.value.row},${current.value.col}]`
  return props.terms
    ? `${head} = ${terms} = ${num(current.value.sum)}`
    : `${head} = ${num(current.value.sum)}`
})

const shapeExpr = computed(() => {
  const n = props.input.length
  const m = kRows.value
  return `${n}\\times ${n} \\;\\xrightarrow{\\;p=${padding.value},\\, s=${stride.value}\\;}\\; ${outputSize(n, m, padding.value, stride.value)}\\times ${outCols.value}`
})

/** Only the padded zeros the current window is actually reading are worth naming. */
const padTaps = computed(() => current.value?.taps.filter(t => t.isPad).length ?? 0)
</script>

<template>
  <WidgetFrame max-width="44rem">
    <div class="dl-conv2d">
      <figure class="dl-conv2d__panel">
        <figcaption>X<span v-if="padding > 0" class="sup">p</span></figcaption>
        <div class="dl-grid" :style="{ gridTemplateColumns: `repeat(${result.padded[0].length}, 2.1rem)` }">
          <div
            v-for="(v, i) in result.padded.flat()"
            :key="`x${i}`"
            class="dl-cell"
            :class="{
              'is-pad': isPad(Math.floor(i / result.padded[0].length), i % result.padded[0].length),
              'is-window': inWindow(Math.floor(i / result.padded[0].length), i % result.padded[0].length),
            }"
          >{{ num(v) }}</div>
        </div>
      </figure>

      <div class="dl-conv2d__op" aria-hidden="true">✳</div>

      <figure class="dl-conv2d__panel">
        <figcaption>W<span v-if="flip" class="sup">r</span></figcaption>
        <div class="dl-grid" :style="{ gridTemplateColumns: `repeat(${kCols}, 2.1rem)` }">
          <div v-for="(w, i) in result.kernel.flat()" :key="`w${i}`" class="dl-cell is-kernel">{{ num(w) }}</div>
        </div>
      </figure>

      <div class="dl-conv2d__op" aria-hidden="true">→</div>

      <figure class="dl-conv2d__panel">
        <figcaption>Y</figcaption>
        <div class="dl-grid" :style="{ gridTemplateColumns: `repeat(${outCols}, 2.6rem)` }">
          <template v-for="(row, r) in result.output" :key="`r${r}`">
            <div
              v-for="(v, c) in row"
              :key="`y${r}-${c}`"
              class="dl-cell is-out"
              :class="{ 'is-empty': outIndex(r, c) > cursor, 'is-current': outIndex(r, c) === cursor }"
            >{{ outIndex(r, c) > cursor ? '' : num(v) }}</div>
          </template>
        </div>
      </figure>
    </div>

    <template #controls>
      <StepButton :label="done ? 'Start over' : 'Next cell'" glyph="▸" @click="step" />
      <StepButton label="Run" variant="ghost" glyph="▶" @click="play" />
      <Slider v-if="shows('padding')" v-model="padding" label="padding p" :min="0" :max="3" :step="1" :precision="0" />
      <Slider v-if="shows('stride')" v-model="stride" label="stride s" :min="1" :max="3" :step="1" :precision="0" />
      <label v-if="shows('flip')" class="dl-conv2d__toggle">
        <input v-model="flip" type="checkbox">
        rotate the kernel first
      </label>
    </template>

    <template #readout>
      <div v-if="current" class="dl-math-xs">
        <Katex :expr="expression" />
        <span v-if="padTaps > 0" class="dl-conv2d__note">
          — {{ padTaps }} of the {{ current.taps.length }} taps land on padded zeros, so they contribute nothing.
        </span>
      </div>
      <div v-else class="dl-math-sm">
        <Katex :expr="shapeExpr" />
        <span class="dl-conv2d__note">— {{ count }} output cells to compute. Press <strong>Next cell</strong>.</span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-conv2d {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.dl-conv2d__panel {
  margin: 0;
  text-align: center;
}

.dl-conv2d__panel figcaption {
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 600;
  color: var(--dl-heading);
  margin-bottom: 0.35rem;
}

.dl-conv2d__panel figcaption .sup {
  font-size: 0.7em;
  vertical-align: super;
  font-style: normal;
}

.dl-grid {
  display: grid;
  justify-content: center;
}

.dl-cell {
  height: 2.1rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--dl-border);
  margin: 0 -1px -1px 0;
  font-size: 0.88rem;
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

.dl-conv2d__op {
  font-size: 1.3rem;
  color: var(--dl-muted);
  margin-top: 1.4rem;
}

.dl-conv2d__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-conv2d__toggle input {
  accent-color: var(--dl-accent);
  cursor: pointer;
}

.dl-conv2d__note {
  color: var(--dl-muted);
}
</style>
