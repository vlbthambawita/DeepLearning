<script setup lang="ts">
/*
 * The one fact that removes most shape anxiety: reshape moves nothing.
 *
 * A tensor is a flat, contiguous block of numbers plus a shape that says how to
 * read it. Every picture on this widget is drawn from the *same* strip of 24
 * elements; changing the shape changes where the strip is cut, not what is in
 * it. Selecting an element lights it up in both pictures at once, so the room
 * can see element 14 sitting still while the grid around it rearranges.
 *
 * This is also why `-1` works: if the block has 24 elements and you ask for six
 * columns, there is only one number the missing dimension can be.
 */
import { computed, ref } from 'vue'
import { formatShape, layoutTensor } from '../composables/useTensorLayout'

const N = 24

interface Shape {
  /** What the student types. */
  call: string
  dims: number[]
  note: string
}

const SHAPES: Shape[] = [
  {
    call: 't.reshape(24)',
    dims: [24],
    note: 'Flat. This is what `flatten()` gives you, and it is the first thing our MNIST network does to an image: 28 x 28 pixels become a vector of 784.',
  },
  {
    call: 't.reshape(4, 6)',
    dims: [4, 6],
    note: 'Four rows of six. The strip is cut every six elements — element 6 starts row 1 because the last axis is the one that moves fastest.',
  },
  {
    call: 't.reshape(6, 4)',
    dims: [6, 4],
    note: 'Six rows of four. Same 24 numbers, same order in memory, a different reading of them. Nothing was transposed: compare where element 4 sits here and in (4, 6).',
  },
  {
    call: 't.reshape(2, 3, 4)',
    dims: [2, 3, 4],
    note: 'Rank 3 from the same strip: two groups of three rows of four. 2 x 3 x 4 = 24, which is the only condition reshape ever asks of you.',
  },
  {
    call: 't.reshape(-1, 6)',
    dims: [4, 6],
    note: '-1 means "work it out". 24 elements in six columns can only be four rows. Use it for the batch dimension, whose size you often do not want to hardcode.',
  },
  {
    call: 't.reshape(5, 5)',
    dims: [],
    note: 'RuntimeError: shape [5, 5] is invalid for input of size 24. Reshape never invents or discards elements, so the product of the new shape must be exactly 24.',
  },
]

const active = ref(1)
const shape = computed(() => SHAPES[active.value])
const invalid = computed(() => shape.value.dims.length === 0)
const selected = ref<number | null>(null)

const STRIP_CELL = 18
const STRIP_GAP = 2
const GRID_CELL = 26
const STRIP_W = N * STRIP_CELL + (N - 1) * STRIP_GAP
const TOP = 16
const GAP_Y = 40

const layout = computed(() => layoutTensor(shape.value.dims, { cell: GRID_CELL, gap: 3, framePad: 5 }))

const view = computed(() => ({
  w: Math.max(STRIP_W, layout.value.width) + 20,
  h: TOP + STRIP_CELL + GAP_Y + Math.max(layout.value.height, GRID_CELL) + 10,
}))

const stripX = computed(() => (view.value.w - STRIP_W) / 2)
const gridX = computed(() => (view.value.w - layout.value.width) / 2)
const gridY = computed(() => TOP + STRIP_CELL + GAP_Y)

function tint(flat: number) {
  return 0.16 + 0.62 * (flat / (N - 1))
}

const strip = computed(() => Array.from({ length: N }, (_, i) => ({
  flat: i,
  x: stripX.value + i * (STRIP_CELL + STRIP_GAP),
  y: TOP,
})))

const grid = computed(() => layout.value.cells.map(c => ({
  ...c,
  x: c.x + gridX.value,
  y: c.y + gridY.value,
})))

const frames = computed(() => layout.value.frames.map(f => ({
  ...f,
  x: f.x + gridX.value,
  y: f.y + gridY.value,
})))

function pick(flat: number) {
  selected.value = selected.value === flat ? null : flat
}

const chosen = computed(() => (selected.value === null
  ? null
  : grid.value.find(c => c.flat === selected.value) ?? null))
</script>

<template>
  <WidgetFrame max-width="44rem">
    <svg
      class="dl-reshape"
      :viewBox="`0 0 ${view.w} ${view.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`24 elements in memory, read as shape ${formatShape(shape.dims)}`"
    >
      <text class="dl-reshape__caption" :x="stripX" :y="TOP - 5">memory — 24 numbers, contiguous, unchanged by every button below</text>

      <g class="dl-reshape__cells is-strip">
        <g
          v-for="s in strip"
          :key="`s${s.flat}`"
          :class="{ 'is-selected': s.flat === selected }"
          tabindex="0"
          role="button"
          :aria-label="`element ${s.flat}`"
          @click="pick(s.flat)"
          @keydown.enter.prevent="pick(s.flat)"
          @keydown.space.prevent="pick(s.flat)"
        >
          <rect
            :x="s.x" :y="s.y" :width="STRIP_CELL" :height="STRIP_CELL"
            rx="2"
            :style="{ fill: `color-mix(in srgb, var(--dl-accent) ${Math.round(tint(s.flat) * 100)}%, var(--dl-surface))` }"
          />
          <text :x="s.x + STRIP_CELL / 2" :y="s.y + STRIP_CELL / 2 + 3.5" text-anchor="middle">{{ s.flat }}</text>
        </g>
      </g>

      <template v-if="!invalid">
        <g class="dl-reshape__link">
          <line :x1="view.w / 2" :y1="TOP + STRIP_CELL + 8" :x2="view.w / 2" :y2="gridY - 10" />
          <path :d="`M ${view.w / 2} ${gridY - 10} l -4 -6 h 8 z`" />
          <text :x="view.w / 2 + 8" :y="gridY - 16">{{ shape.call }}</text>
        </g>

        <rect
          v-for="(f, i) in frames"
          :key="`f${i}`"
          class="dl-reshape__frame"
          :x="f.x" :y="f.y" :width="f.w" :height="f.h"
          rx="4"
        />

        <g class="dl-reshape__cells">
          <g
            v-for="c in grid"
            :key="`g${c.flat}`"
            :class="{ 'is-selected': c.flat === selected }"
            tabindex="0"
            role="button"
            :aria-label="`element ${c.flat} at index ${c.index.join(', ')}`"
            @click="pick(c.flat)"
            @keydown.enter.prevent="pick(c.flat)"
            @keydown.space.prevent="pick(c.flat)"
          >
            <rect
              :x="c.x" :y="c.y" :width="c.w" :height="c.h"
              rx="3"
              :style="{ fill: `color-mix(in srgb, var(--dl-accent) ${Math.round(tint(c.flat) * 100)}%, var(--dl-surface))` }"
            />
            <text :x="c.x + c.w / 2" :y="c.y + c.h / 2 + 4" text-anchor="middle">{{ c.flat }}</text>
          </g>
        </g>
      </template>

      <text v-else class="dl-reshape__error" :x="view.w / 2" :y="gridY + 30" text-anchor="middle">
        RuntimeError — 5 x 5 = 25, and there are only 24 elements
      </text>
    </svg>

    <template #controls>
      <button
        v-for="(s, i) in SHAPES"
        :key="s.call"
        type="button"
        class="dl-reshape__tab"
        :class="{ 'is-active': i === active, 'is-bad': s.dims.length === 0 }"
        @click="active = i"
      >{{ s.call.replace('t.reshape', '') }}</button>
    </template>

    <template #readout>
      <div class="dl-reshape__facts">
        <span><code>{{ shape.call }}</code></span>
        <span v-if="!invalid">shape <strong>{{ formatShape(shape.dims) }}</strong></span>
        <span v-if="!invalid">numel <strong>{{ shape.dims.reduce((a, b) => a * b, 1) }}</strong></span>
      </div>
      <div class="dl-reshape__note">
        <template v-if="chosen">
          Element <strong>{{ chosen.flat }}</strong> never moved. Under this shape you reach it with
          <code>t[{{ chosen.index.join(', ') }}]</code>.
        </template>
        <template v-else>{{ shape.note }}</template>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-reshape {
  width: 100%;
  height: 100%;
}

.dl-reshape__caption {
  font-size: 9.5px;
  fill: var(--dl-muted);
}

.dl-reshape__cells rect {
  stroke: var(--dl-border);
  stroke-width: 0.8;
  cursor: pointer;
}

.dl-reshape__cells text {
  font-size: 9px;
  fill: var(--dl-body);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.dl-reshape__cells.is-strip text {
  font-size: 8px;
}

.dl-reshape__cells g.is-selected rect {
  stroke: var(--dl-heading);
  stroke-width: 2.4;
}

.dl-reshape__cells g:focus-visible rect {
  stroke: var(--dl-accent-strong);
  stroke-width: 2.4;
}

.dl-reshape__cells g:focus {
  outline: none;
}

.dl-reshape__frame {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 1;
  stroke-dasharray: 3 2;
}

.dl-reshape__link line {
  stroke: var(--dl-muted);
  stroke-width: 1;
}

.dl-reshape__link path {
  fill: var(--dl-muted);
}

.dl-reshape__link text {
  font-size: 11px;
  font-weight: 600;
  fill: var(--dl-accent);
  font-family: var(--slidev-code-font-family, monospace);
}

.dl-reshape__error {
  font-size: 13px;
  fill: var(--dl-danger);
  font-family: var(--slidev-code-font-family, monospace);
}

.dl-reshape__tab {
  padding: 0.24rem 0.6rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font-family: var(--slidev-code-font-family, monospace);
  font-size: 0.78rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-reshape__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-reshape__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-reshape__tab.is-bad.is-active {
  background: var(--dl-danger);
  border-color: var(--dl-danger);
}

.dl-reshape__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-reshape__facts {
  display: flex;
  gap: 1.4rem;
  margin-bottom: 0.2rem;
}

.dl-reshape__facts strong {
  color: var(--dl-accent);
}

.dl-reshape__facts code,
.dl-reshape__note code {
  font-size: 0.78rem;
  background: var(--dl-code-bg);
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
}

.dl-reshape__note {
  line-height: 1.35;
}
</style>
