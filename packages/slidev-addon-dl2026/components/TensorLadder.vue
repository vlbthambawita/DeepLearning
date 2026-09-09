<script setup lang="ts">
/*
 * What a tensor is, as one object that grows a dimension at a time.
 *
 * Textbooks draw this as four separate pictures — a dot, a row, a grid, a cube
 * — which makes rank look like four different things. It is one thing: a
 * rank-n tensor is a collection of rank-(n-1) tensors, and the picture for each
 * rank contains the picture for the one below it.
 *
 * The cells carry their flat index, not their value, because the fact students
 * need in twenty minutes (`reshape` does not move data) is a fact about that
 * number. Selecting a cell shows the multi-index that reaches it beside the
 * flat position it occupies, which is the whole of row-major order.
 */
import { computed, ref } from 'vue'
import { formatIndex, formatShape, layoutTensor } from '../composables/useTensorLayout'

interface Preset {
  key: string
  tab: string
  dims: number[]
  /** Names for each dimension, outermost first. Falls back to "dim i". */
  labels?: string[]
  torch: string
  caption: string
}

const PRESETS: Preset[] = [
  {
    key: 'scalar',
    tab: '0-D scalar',
    dims: [],
    torch: 'torch.tensor(7.0)',
    caption: 'Rank 0 — a single number with no dimensions at all. Every loss value you print this semester is one of these, which is why `loss.item()` exists.',
  },
  {
    key: 'vector',
    tab: '1-D vector',
    dims: [4],
    labels: ['features'],
    torch: 'torch.tensor([2., 5., 1., 8.])',
    caption: 'Rank 1 — one axis. The four features of a single Iris flower, or the ten logits a classifier produces for a single image.',
  },
  {
    key: 'matrix',
    tab: '2-D matrix',
    dims: [3, 4],
    labels: ['samples', 'features'],
    torch: 'torch.zeros(3, 4)',
    caption: 'Rank 2 — a table. Three samples, four features each: exactly the array `X` from Lecture 02. The first axis is almost always the batch.',
  },
  {
    key: 'cube',
    tab: '3-D',
    dims: [2, 3, 4],
    labels: ['channels', 'height', 'width'],
    torch: 'torch.zeros(2, 3, 4)',
    caption: 'Rank 3 — a stack of matrices. One image is stored this way: channels first, then height, then width. A colour photo is (3, H, W).',
  },
  {
    key: 'batch',
    tab: '4-D batch',
    dims: [2, 1, 4, 4],
    labels: ['batch', 'channels', 'height', 'width'],
    torch: 'images.shape  # (64, 1, 28, 28)',
    caption: 'Rank 4 — a batch of images, and the shape MNIST actually arrives in. Drawn small: the real thing is 64 images of 1 channel and 28x28 pixels.',
  },
]

const props = withDefaults(defineProps<{
  /** Which preset to open on, by key. */
  start?: string
}>(), {
  start: 'scalar',
})

const active = ref(Math.max(0, PRESETS.findIndex(p => p.key === props.start)))
const preset = computed(() => PRESETS[active.value])
const selected = ref<number | null>(null)

const CELL = 24

const layout = computed(() => layoutTensor(preset.value.dims, { cell: CELL, gap: 3, framePad: 5 }))

const numel = computed(() => preset.value.dims.reduce((a, b) => a * b, 1))

/** Room on the left and top for the two axis arrows. */
const MARGIN = { left: 26, top: 24, right: 10, bottom: 10 }

const view = computed(() => ({
  w: layout.value.width + MARGIN.left + MARGIN.right,
  h: layout.value.height + MARGIN.top + MARGIN.bottom,
}))

const cells = computed(() => layout.value.cells.map(c => ({
  ...c,
  x: c.x + MARGIN.left,
  y: c.y + MARGIN.top,
  /* Memory order as a colour ramp: first element pale, last element saturated. */
  tint: numel.value <= 1 ? 0.55 : 0.16 + 0.62 * (c.flat / (numel.value - 1)),
})))

const frames = computed(() => layout.value.frames.map(f => ({
  ...f,
  x: f.x + MARGIN.left,
  y: f.y + MARGIN.top,
})))

/** Text fits in a cell up to about two digits; past 99 the grid gets busy. */
const showFlat = computed(() => numel.value <= 48)

const chips = computed(() => preset.value.dims.map((n, i) => ({
  i,
  n,
  name: preset.value.labels?.[i] ?? `dim ${i}`,
})))

const chosen = computed(() => cells.value.find(c => c.flat === selected.value) ?? null)

function pick(flat: number) {
  selected.value = selected.value === flat ? null : flat
}

function setPreset(i: number) {
  active.value = i
  selected.value = null
}

/** Arrow along the innermost dimension, which `layoutTensor` draws across. */
const colArrow = computed(() => {
  const rank = preset.value.dims.length
  if (rank === 0)
    return null
  const row = cells.value.filter(c => c.y === cells.value[0].y)
  const xs = row.map(c => c.x)
  return {
    x1: Math.min(...xs),
    x2: Math.max(...xs) + CELL,
    y: MARGIN.top - 9,
    label: `dim ${rank - 1}`,
  }
})

/** Arrow down the next dimension out, which is drawn vertically. */
const rowArrow = computed(() => {
  const rank = preset.value.dims.length
  if (rank < 2)
    return null
  const col = cells.value.filter(c => c.x === cells.value[0].x)
  const ys = col.map(c => c.y)
  return {
    y1: Math.min(...ys),
    y2: Math.max(...ys) + CELL,
    x: MARGIN.left - 11,
    label: `dim ${rank - 2}`,
  }
})
</script>

<template>
  <WidgetFrame max-width="42rem">
    <svg
      class="dl-ladder"
      :viewBox="`0 0 ${view.w} ${view.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`A rank ${preset.dims.length} tensor of shape ${formatShape(preset.dims)}`"
    >
      <rect
        v-for="(f, i) in frames"
        :key="`f${i}`"
        class="dl-ladder__frame"
        :x="f.x" :y="f.y" :width="f.w" :height="f.h"
        rx="4"
        :style="{ opacity: 0.25 + 0.35 * (frames.length - f.depth) / frames.length }"
      />

      <g v-if="colArrow" class="dl-ladder__axis">
        <line :x1="colArrow.x1" :y1="colArrow.y" :x2="colArrow.x2" :y2="colArrow.y" />
        <text :x="(colArrow.x1 + colArrow.x2) / 2" :y="colArrow.y - 5" text-anchor="middle">{{ colArrow.label }}</text>
      </g>
      <g v-if="rowArrow" class="dl-ladder__axis">
        <line :x1="rowArrow.x" :y1="rowArrow.y1" :x2="rowArrow.x" :y2="rowArrow.y2" />
        <text
          :x="rowArrow.x - 5" :y="(rowArrow.y1 + rowArrow.y2) / 2"
          text-anchor="middle"
          :transform="`rotate(-90 ${rowArrow.x - 5} ${(rowArrow.y1 + rowArrow.y2) / 2})`"
        >{{ rowArrow.label }}</text>
      </g>

      <g class="dl-ladder__cells">
        <g
          v-for="c in cells"
          :key="c.flat"
          :class="{ 'is-selected': c.flat === selected }"
          tabindex="0"
          role="button"
          :aria-label="`element ${formatIndex(c.index)}`"
          @click="pick(c.flat)"
          @keydown.enter.prevent="pick(c.flat)"
          @keydown.space.prevent="pick(c.flat)"
        >
          <rect
            :x="c.x" :y="c.y" :width="c.w" :height="c.h"
            rx="3"
            :style="{ fill: `color-mix(in srgb, var(--dl-accent) ${Math.round(c.tint * 100)}%, var(--dl-surface))` }"
          />
          <text v-if="showFlat" :x="c.x + c.w / 2" :y="c.y + c.h / 2 + 4" text-anchor="middle">{{ c.flat }}</text>
        </g>
      </g>
    </svg>

    <template #controls>
      <button
        v-for="(p, i) in PRESETS"
        :key="p.key"
        type="button"
        class="dl-ladder__tab"
        :class="{ 'is-active': i === active }"
        @click="setPreset(i)"
      >{{ p.tab }}</button>
    </template>

    <template #readout>
      <div class="dl-ladder__facts">
        <span><code>t.shape</code> <strong>{{ formatShape(preset.dims) }}</strong></span>
        <span><code>t.ndim</code> <strong>{{ preset.dims.length }}</strong></span>
        <span><code>t.numel()</code> <strong>{{ numel }}</strong></span>
      </div>
      <div v-if="chips.length" class="dl-ladder__chips">
        <span v-for="c in chips" :key="c.i">dim {{ c.i }} = {{ c.n }} <em>{{ c.name }}</em></span>
      </div>
      <div class="dl-ladder__note">
        <template v-if="chosen">
          <code>{{ formatIndex(chosen.index) }}</code> is element <strong>{{ chosen.flat }}</strong> of {{ numel }} in memory — the last index moves fastest.
        </template>
        <template v-else>
          {{ preset.caption }}
        </template>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-ladder {
  width: 100%;
  height: 100%;
}

.dl-ladder__frame {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 1;
  stroke-dasharray: 3 2;
}

.dl-ladder__cells rect {
  stroke: var(--dl-border);
  stroke-width: 0.8;
  cursor: pointer;
  transition: stroke 0.15s ease;
}

.dl-ladder__cells text {
  font-size: 9px;
  fill: var(--dl-body);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.dl-ladder__cells g.is-selected rect {
  stroke: var(--dl-heading);
  stroke-width: 2.4;
}

.dl-ladder__cells g:focus-visible rect {
  stroke: var(--dl-accent-strong);
  stroke-width: 2.4;
}

.dl-ladder__cells g:focus {
  outline: none;
}

.dl-ladder__axis line {
  stroke: var(--dl-muted);
  stroke-width: 0.9;
}

.dl-ladder__axis text {
  font-size: 9px;
  fill: var(--dl-muted);
}

.dl-ladder__tab {
  padding: 0.26rem 0.66rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-ladder__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-ladder__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-ladder__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-ladder__facts {
  display: flex;
  gap: 1.4rem;
  margin-bottom: 0.2rem;
}

.dl-ladder__facts strong {
  color: var(--dl-accent);
  font-size: 1rem;
  margin-left: 0.2rem;
}

.dl-ladder__facts code,
.dl-ladder__note code {
  font-size: 0.78rem;
  background: var(--dl-code-bg);
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
}

.dl-ladder__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.9rem;
  margin-bottom: 0.25rem;
  font-size: 0.76rem;
}

.dl-ladder__chips em {
  color: var(--dl-accent);
  font-style: normal;
}

.dl-ladder__note {
  line-height: 1.35;
}
</style>
