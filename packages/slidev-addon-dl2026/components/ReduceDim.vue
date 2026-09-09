<script setup lang="ts">
/*
 * `dim` is the axis that disappears.
 *
 * That sentence is the whole content of the widget, and it is the sentence
 * students cannot get from the documentation, which describes `dim` as "the
 * dimension to reduce" — true, and no help in deciding whether an accuracy
 * calculation wants 0 or 1.
 *
 * The result is drawn *along* the axis it came from: reduce over dim 0 and the
 * answers appear underneath their columns; reduce over dim 1 and they appear
 * beside their rows. Aligning them that way means nobody has to hold the
 * orientation in their head, and `argmax(dim=1)` — one predicted class per row
 * of a batch — stops being a line of code to memorise.
 */
import { computed, ref } from 'vue'

const DATA = [
  [3, 8, 1, 6],
  [7, 2, 9, 4],
  [5, 0, 2, 8],
]

const ROWS = DATA.length
const COLS = DATA[0].length

type Op = 'sum' | 'mean' | 'max' | 'argmax'
type Dim = 'none' | 0 | 1

const OPS: Op[] = ['sum', 'mean', 'max', 'argmax']

const op = ref<Op>('sum')
const dim = ref<Dim>(0)
const keepdim = ref(false)

function reduce(values: number[]): number {
  switch (op.value) {
    case 'sum': return values.reduce((a, b) => a + b, 0)
    case 'mean': return values.reduce((a, b) => a + b, 0) / values.length
    case 'max': return Math.max(...values)
    case 'argmax': return values.indexOf(Math.max(...values))
  }
}

/** Slices that collapse into one answer each. */
const groups = computed<number[][]>(() => {
  if (dim.value === 'none')
    return [DATA.flat()]
  if (dim.value === 0)
    return Array.from({ length: COLS }, (_, c) => DATA.map(row => row[c]))
  return DATA.map(row => [...row])
})

const answers = computed(() => groups.value.map(reduce))

/** `keepdim` without a `dim` is a TypeError in PyTorch, so it is ignored here too. */
const keeping = computed(() => keepdim.value && dim.value !== 'none')

const outDims = computed<number[]>(() => {
  if (dim.value === 'none')
    return []
  if (dim.value === 0)
    return keeping.value ? [1, COLS] : [COLS]
  return keeping.value ? [ROWS, 1] : [ROWS]
})

function show(v: number) {
  if (op.value === 'mean')
    return v.toFixed(2)
  return String(v)
}

const CELL = 32
const GAP = 3
const LEFT = 18
const TOP = 16
const OFFSET = 20

const STEP = CELL + GAP
const gridW = COLS * CELL + (COLS - 1) * GAP
const gridH = ROWS * CELL + (ROWS - 1) * GAP

const view = {
  w: LEFT + gridW + OFFSET + CELL + 6,
  h: TOP + gridH + OFFSET + CELL + 6,
}

const source = computed(() => {
  const out: Array<{ r: number, c: number, x: number, y: number, v: number, lit: boolean }> = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const lit = op.value === 'argmax' || op.value === 'max'
        ? (dim.value === 'none'
            ? DATA[r][c] === Math.max(...DATA.flat())
            : dim.value === 0
              ? DATA[r][c] === Math.max(...DATA.map(row => row[c]))
              : DATA[r][c] === Math.max(...DATA[r]))
        : true
      out.push({ r, c, x: LEFT + c * STEP, y: TOP + r * STEP, v: DATA[r][c], lit })
    }
  }
  return out
})

/** Bands showing which slice each answer came from. */
const bands = computed(() => {
  if (dim.value === 'none')
    return [{ x: LEFT - 3, y: TOP - 3, w: gridW + 6, h: gridH + 6 }]
  if (dim.value === 0)
    return Array.from({ length: COLS }, (_, c) => ({ x: LEFT + c * STEP - 2, y: TOP - 3, w: CELL + 4, h: gridH + 6 }))
  return Array.from({ length: ROWS }, (_, r) => ({ x: LEFT - 3, y: TOP + r * STEP - 2, w: gridW + 6, h: CELL + 4 }))
})

const results = computed(() => answers.value.map((v, i) => {
  if (dim.value === 'none')
    return { x: LEFT + gridW + OFFSET, y: TOP + gridH + OFFSET, v }
  if (dim.value === 0)
    return { x: LEFT + i * STEP, y: TOP + gridH + OFFSET, v }
  return { x: LEFT + gridW + OFFSET, y: TOP + i * STEP, v }
}))

/** The keepdim frame: what a length-1 axis looks like when it is not dropped. */
const keepFrame = computed(() => {
  if (!keeping.value)
    return null
  const first = results.value[0]
  const last = results.value[results.value.length - 1]
  return {
    x: first.x - 3,
    y: first.y - 3,
    w: last.x - first.x + CELL + 6,
    h: last.y - first.y + CELL + 6,
  }
})

const call = computed(() => {
  const args: string[] = []
  if (dim.value !== 'none')
    args.push(`dim=${dim.value}`)
  if (keeping.value)
    args.push('keepdim=True')
  return `t.${op.value}(${args.join(', ')})`
})

const NOTE: Record<Op, string> = {
  sum: 'Add up everything along that axis. The axis is gone from the result — that is what reducing means.',
  mean: 'The same collapse, divided by how many elements went into it. This is how a per-batch loss becomes one number.',
  max: 'The largest value along the axis. Note that PyTorch actually returns two things here — the values and their indices.',
  argmax: 'Not the value but its *position*. `logits.argmax(dim=1)` turns a (64, 10) batch of scores into 64 predicted class labels, which is exactly how you score a classifier.',
}

const DIM_NOTE = computed(() => {
  if (dim.value === 'none')
    return 'No dim at all: every axis collapses and you get a 0-D tensor.'
  if (keeping.value)
    return `keepdim=True keeps dim ${dim.value} as a length-1 axis, so the result still has rank 2 and still broadcasts against the original.`
  return `dim=${dim.value} means dim ${dim.value} disappears. What is left is ${dim.value === 0 ? `one answer per column, ${COLS} of them` : `one answer per row, ${ROWS} of them`}.`
})
</script>

<template>
  <WidgetFrame max-width="34rem">
    <svg
      class="dl-reduce"
      :viewBox="`0 0 ${view.w} ${view.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${call} on a 3 by 4 tensor`"
    >
      <rect
        v-for="(b, i) in bands"
        :key="`b${i}`"
        class="dl-reduce__band"
        :x="b.x" :y="b.y" :width="b.w" :height="b.h"
        rx="4"
      />

      <g class="dl-reduce__head">
        <text v-for="c in COLS" :key="`hc${c}`" :x="LEFT + (c - 1) * STEP + CELL / 2" :y="TOP - 6" text-anchor="middle">{{ c - 1 }}</text>
        <text v-for="r in ROWS" :key="`hr${r}`" :x="LEFT - 6" :y="TOP + (r - 1) * STEP + CELL / 2 + 4" text-anchor="end">{{ r - 1 }}</text>
      </g>

      <g class="dl-reduce__cells">
        <g v-for="cell in source" :key="`${cell.r}-${cell.c}`" :class="{ 'is-dim': !cell.lit }">
          <rect :x="cell.x" :y="cell.y" :width="CELL" :height="CELL" rx="3" />
          <text :x="cell.x + CELL / 2" :y="cell.y + CELL / 2 + 4" text-anchor="middle">{{ cell.v }}</text>
        </g>
      </g>

      <rect v-if="keepFrame" class="dl-reduce__keep" :x="keepFrame.x" :y="keepFrame.y" :width="keepFrame.w" :height="keepFrame.h" rx="4" />

      <g class="dl-reduce__cells is-result">
        <g v-for="(res, i) in results" :key="`r${i}`">
          <rect :x="res.x" :y="res.y" :width="CELL" :height="CELL" rx="3" />
          <text :x="res.x + CELL / 2" :y="res.y + CELL / 2 + 4" text-anchor="middle">{{ show(res.v) }}</text>
        </g>
      </g>
    </svg>

    <template #controls>
      <button
        v-for="o in OPS"
        :key="o"
        type="button"
        class="dl-reduce__tab"
        :class="{ 'is-active': op === o }"
        @click="op = o"
      >{{ o }}</button>
      <span class="dl-reduce__sep" aria-hidden="true"></span>
      <button
        v-for="d in (['none', 0, 1] as Dim[])"
        :key="`d${d}`"
        type="button"
        class="dl-reduce__tab"
        :class="{ 'is-active': dim === d }"
        @click="dim = d"
      >{{ d === 'none' ? 'no dim' : `dim=${d}` }}</button>
      <StepButton
        :label="keeping ? 'keepdim=True' : 'keepdim=False'"
        :variant="keeping ? 'primary' : 'ghost'"
        :disabled="dim === 'none'"
        @click="keepdim = !keepdim"
      />
    </template>

    <template #readout>
      <div class="dl-reduce__facts">
        <span><code>{{ call }}</code></span>
        <span>shape <strong>{{ outDims.length === 0 ? '()' : `(${outDims.join(', ')})` }}</strong></span>
      </div>
      <div class="dl-reduce__note">{{ DIM_NOTE }} {{ NOTE[op] }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-reduce {
  width: 100%;
  height: 100%;
}

.dl-reduce__band {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 0.7;
  stroke-dasharray: 3 2;
}

.dl-reduce__head text {
  font-size: 10px;
  fill: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-reduce__cells rect {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 0.9;
}

.dl-reduce__cells text {
  font-size: 12px;
  fill: var(--dl-heading);
  font-variant-numeric: tabular-nums;
}

.dl-reduce__cells g.is-dim rect {
  fill: var(--dl-bg);
}

.dl-reduce__cells g.is-dim text {
  fill: var(--dl-muted);
}

.dl-reduce__cells.is-result rect {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dl-reduce__cells.is-result text {
  fill: #fff;
  font-weight: 700;
  font-size: 11px;
}

.dl-reduce__keep {
  fill: none;
  stroke: var(--dl-heading);
  stroke-width: 1.2;
  stroke-dasharray: 4 2;
}

.dl-reduce__tab {
  padding: 0.24rem 0.6rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font-family: var(--slidev-code-font-family, monospace);
  font-size: 0.76rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-reduce__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-reduce__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-reduce__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-reduce__sep {
  width: 1px;
  height: 1.1rem;
  background: var(--dl-border);
}

.dl-reduce__facts {
  display: flex;
  gap: 1.4rem;
  margin-bottom: 0.2rem;
}

.dl-reduce__facts strong {
  color: var(--dl-accent);
  font-size: 1rem;
}

.dl-reduce__facts code {
  font-size: 0.8rem;
  background: var(--dl-code-bg);
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
}

.dl-reduce__note {
  line-height: 1.35;
}
</style>
