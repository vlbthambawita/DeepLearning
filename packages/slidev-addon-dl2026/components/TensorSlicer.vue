<script setup lang="ts">
/*
 * Slicing, with the answer drawn next to the expression.
 *
 * Two facts do all the damage in the first lab. An integer index *removes* the
 * axis it addresses; a slice *keeps* it, even when the slice has length one. So
 * `t[1]` and `t[1:2]` select the same six numbers and have different ranks —
 * and a rank mismatch surfaces three lines later as an unreadable broadcast
 * error. Both expressions are on the tab strip, side by side, so the difference
 * is a click rather than a paragraph.
 *
 * Cell values are `10 * row + col`, which means the room can check every answer
 * on the slide without trusting the widget.
 */
import { computed, ref } from 'vue'
import { formatShape, layoutTensor } from '../composables/useTensorLayout'

const ROWS = 4
const COLS = 6

type AxisSpec =
  | { kind: 'int', i: number }
  | { kind: 'slice', a: number, b: number }
  | { kind: 'all' }

interface Example {
  expr: string
  rowSpec: AxisSpec
  colSpec: AxisSpec
  note: string
}

const EXAMPLES: Example[] = [
  {
    expr: 't[1]',
    rowSpec: { kind: 'int', i: 1 },
    colSpec: { kind: 'all' },
    note: 'One integer picks row 1 and the row axis disappears. The result is 1-D — the same thing as `t[1, :]`, which is what PyTorch fills in for you.',
  },
  {
    expr: 't[1:2]',
    rowSpec: { kind: 'slice', a: 1, b: 2 },
    colSpec: { kind: 'all' },
    note: 'The same six numbers as `t[1]`, but a slice keeps its axis, so this is 2-D with a length-1 first dimension. This is the one that bites.',
  },
  {
    expr: 't[:, 2]',
    rowSpec: { kind: 'all' },
    colSpec: { kind: 'int', i: 2 },
    note: 'A colon means "every index along this axis". Column 2 of every row — one number per sample, which is how you pull a single feature out of a batch.',
  },
  {
    expr: 't[1:3, 2:5]',
    rowSpec: { kind: 'slice', a: 1, b: 3 },
    colSpec: { kind: 'slice', a: 2, b: 5 },
    note: 'Slices on both axes: rows 1 and 2, columns 2, 3 and 4. The stop index is never included, so 1:3 is two rows, not three.',
  },
  {
    expr: 't[:, -1]',
    rowSpec: { kind: 'all' },
    colSpec: { kind: 'int', i: COLS - 1 },
    note: 'Negative indices count from the end, so -1 is the last column. Handy, and the reason an off-by-one bug can silently return real numbers.',
  },
  {
    expr: 't[0, 0]',
    rowSpec: { kind: 'int', i: 0 },
    colSpec: { kind: 'int', i: 0 },
    note: 'Both axes indexed with integers, so both disappear: the result is a 0-D tensor. Call `.item()` on it to get a Python float.',
  },
]

const active = ref(0)
const example = computed(() => EXAMPLES[active.value])

function indices(spec: AxisSpec, n: number): number[] {
  if (spec.kind === 'int')
    return [spec.i]
  if (spec.kind === 'all')
    return Array.from({ length: n }, (_, i) => i)
  return Array.from({ length: spec.b - spec.a }, (_, i) => spec.a + i)
}

const rowIdx = computed(() => indices(example.value.rowSpec, ROWS))
const colIdx = computed(() => indices(example.value.colSpec, COLS))

/** An integer index drops its axis; a slice keeps it. That is the whole rule. */
const resultDims = computed(() => {
  const dims: number[] = []
  if (example.value.rowSpec.kind !== 'int')
    dims.push(rowIdx.value.length)
  if (example.value.colSpec.kind !== 'int')
    dims.push(colIdx.value.length)
  return dims
})

const values = computed(() => rowIdx.value.flatMap(r => colIdx.value.map(c => 10 * r + c)))

const CELL = 30
const GAP = 3
const LEFT_W = COLS * CELL + (COLS - 1) * GAP
const LEFT_H = ROWS * CELL + (ROWS - 1) * GAP
const HEAD = 15
const ARROW = 46

const source = computed(() => {
  const out: Array<{ r: number, c: number, x: number, y: number, v: number, on: boolean }> = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push({
        r,
        c,
        x: HEAD + c * (CELL + GAP),
        y: HEAD + r * (CELL + GAP),
        v: 10 * r + c,
        on: rowIdx.value.includes(r) && colIdx.value.includes(c),
      })
    }
  }
  return out
})

const resultLayout = computed(() => layoutTensor(resultDims.value, { cell: CELL, gap: GAP, framePad: 0 }))

const resultX = computed(() => HEAD + LEFT_W + ARROW)

const result = computed(() => resultLayout.value.cells.map(cell => ({
  ...cell,
  x: cell.x + resultX.value,
  y: cell.y + HEAD + Math.max(0, (LEFT_H - resultLayout.value.height) / 2),
  v: values.value[cell.flat],
})))

const view = computed(() => ({
  w: resultX.value + Math.max(resultLayout.value.width, CELL) + 8,
  h: HEAD + LEFT_H + 8,
}))

const arrowY = computed(() => HEAD + LEFT_H / 2)
</script>

<template>
  <WidgetFrame max-width="44rem">
    <svg
      class="dl-slicer"
      :viewBox="`0 0 ${view.w} ${view.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${example.expr} selects ${values.length} elements and returns shape ${formatShape(resultDims)}`"
    >
      <g class="dl-slicer__head">
        <text v-for="c in COLS" :key="`c${c}`" :x="HEAD + (c - 1) * (CELL + GAP) + CELL / 2" :y="HEAD - 4" text-anchor="middle">{{ c - 1 }}</text>
        <text v-for="r in ROWS" :key="`r${r}`" :x="HEAD - 4" :y="HEAD + (r - 1) * (CELL + GAP) + CELL / 2 + 4" text-anchor="end">{{ r - 1 }}</text>
      </g>

      <g class="dl-slicer__grid">
        <g v-for="cell in source" :key="`${cell.r}-${cell.c}`" :class="{ 'is-on': cell.on }">
          <rect :x="cell.x" :y="cell.y" :width="CELL" :height="CELL" rx="3" />
          <text :x="cell.x + CELL / 2" :y="cell.y + CELL / 2 + 4" text-anchor="middle">{{ cell.v }}</text>
        </g>
      </g>

      <g class="dl-slicer__arrow">
        <line :x1="HEAD + LEFT_W + 10" :y1="arrowY" :x2="resultX - 10" :y2="arrowY" />
        <path :d="`M ${resultX - 10} ${arrowY} l -6 -4 v 8 z`" />
        <text :x="(HEAD + LEFT_W + resultX) / 2" :y="arrowY - 8" text-anchor="middle">{{ example.expr }}</text>
      </g>

      <g class="dl-slicer__grid is-result">
        <g v-for="cell in result" :key="`o${cell.flat}`" class="is-on">
          <rect :x="cell.x" :y="cell.y" :width="cell.w" :height="cell.h" rx="3" />
          <text :x="cell.x + cell.w / 2" :y="cell.y + cell.h / 2 + 4" text-anchor="middle">{{ cell.v }}</text>
        </g>
      </g>
    </svg>

    <template #controls>
      <button
        v-for="(e, i) in EXAMPLES"
        :key="e.expr"
        type="button"
        class="dl-slicer__tab"
        :class="{ 'is-active': i === active }"
        @click="active = i"
      >{{ e.expr }}</button>
    </template>

    <template #readout>
      <div class="dl-slicer__facts">
        <span>result <strong>{{ formatShape(resultDims) }}</strong></span>
        <span>{{ values.length }} element{{ values.length === 1 ? '' : 's' }}</span>
        <span>rank 2 <span aria-hidden="true">&rarr;</span> rank {{ resultDims.length }}</span>
      </div>
      <div class="dl-slicer__note">{{ example.note }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-slicer {
  width: 100%;
  height: 100%;
}

.dl-slicer__head text {
  font-size: 10px;
  fill: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-slicer__grid rect {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 0.8;
  transition: fill 0.15s ease, stroke 0.15s ease;
}

.dl-slicer__grid text {
  font-size: 11px;
  fill: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-slicer__grid g.is-on rect {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 1.4;
}

.dl-slicer__grid g.is-on text {
  fill: var(--dl-heading);
  font-weight: 600;
}

.dl-slicer__arrow line {
  stroke: var(--dl-muted);
  stroke-width: 1;
}

.dl-slicer__arrow path {
  fill: var(--dl-muted);
}

.dl-slicer__arrow text {
  font-size: 12px;
  font-weight: 600;
  fill: var(--dl-accent);
  font-family: var(--slidev-code-font-family, monospace);
}

.dl-slicer__tab {
  padding: 0.24rem 0.6rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font-family: var(--slidev-code-font-family, monospace);
  font-size: 0.78rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-slicer__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-slicer__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-slicer__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-slicer__facts {
  display: flex;
  gap: 1.4rem;
  margin-bottom: 0.2rem;
}

.dl-slicer__facts strong {
  color: var(--dl-accent);
  font-size: 1rem;
}

.dl-slicer__note {
  line-height: 1.35;
}
</style>
