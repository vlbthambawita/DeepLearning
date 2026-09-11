<script setup lang="ts">
/*
 * The shapes a sequence problem can have — 2025 Lecture 5/6 slide 5, which was
 * a book figure with eight floating captions and no way to tell which caption
 * belonged to which picture.
 *
 * The four recurrent shapes differ in exactly one respect: *which time steps
 * carry an input, and which carry an output*. Drawing them on one timeline with
 * the same cells makes that the only thing that moves, and the first tab —
 * the same picture with the recurrent arrows deleted — is the MLP the course has
 * been using until now, so the comparison the room needs is a click away rather
 * than a lecture away.
 */
import { computed, ref } from 'vue'

interface Task {
  key: string
  name: string
  /** Time steps that consume an input. */
  inputs: number[]
  /** Time steps that emit an output. */
  outputs: number[]
  /** False for the non-recurrent case: no state passes between steps. */
  recurrent: boolean
  /** Where the encoder ends, for the encoder–decoder shape. */
  split?: number
  example: string
  shape: string
  loss: string
}

const STEPS = 5

const TASKS: Task[] = [
  {
    key: 'iid',
    name: 'no recurrence',
    inputs: [0, 1, 2, 3, 4],
    outputs: [0, 1, 2, 3, 4],
    recurrent: false,
    example: 'Ex: five Iris flowers → five class labels. Everything the course has done so far.',
    shape: 'five independent examples',
    loss: 'Shuffle the five columns and nothing changes. That is what IID means.',
  },
  {
    key: 'many-to-one',
    name: 'many → one',
    inputs: [0, 1, 2, 3, 4],
    outputs: [4],
    recurrent: true,
    example: 'Ex: the words of a film review → one sentiment label.',
    shape: 'sequence in, one vector out',
    loss: 'The loss is computed once, at the last step — but the gradient still reaches every step through the state.',
  },
  {
    key: 'one-to-many',
    name: 'one → many',
    inputs: [0],
    outputs: [0, 1, 2, 3, 4],
    recurrent: true,
    example: 'Ex: one image → a caption, generated a word at a time.',
    shape: 'one vector in, sequence out',
    loss: 'Only step 1 has real input; after that the cell is fed its own previous output.',
  },
  {
    key: 'many-to-many',
    name: 'many → many, in step',
    inputs: [0, 1, 2, 3, 4],
    outputs: [0, 1, 2, 3, 4],
    recurrent: true,
    example: 'Ex: video frames → a label per frame. Or words → a part-of-speech tag per word.',
    shape: 'aligned sequences, same length',
    loss: 'One loss term per step, averaged. Step 3 may use everything up to step 3 — and nothing after it.',
  },
  {
    key: 'seq2seq',
    name: 'many → many, delayed',
    inputs: [0, 1, 2],
    outputs: [3, 4],
    recurrent: true,
    split: 3,
    example: 'Ex: a sentence in German → a sentence in English. The lengths need not match.',
    shape: 'encoder, then decoder',
    loss: 'Nothing is emitted until the whole input has been read — because word 1 of the translation can depend on the last word of the source.',
  },
]

const selected = ref(0)
const task = computed(() => TASKS[selected.value])

/* ---- geometry ------------------------------------------------------------ */

const PITCH = 112
const LEFT = 46
const BOX_W = 78
const CELL_H = 42
const IO_H = 34
const Y_OUT = 22
const Y_CELL = 96
const Y_IN = 172

const WIDTH = LEFT + (STEPS - 1) * PITCH + BOX_W + 24
const HEIGHT = 232

const colX = (i: number) => LEFT + i * PITCH
const midX = (i: number) => colX(i) + BOX_W / 2

const has = (list: number[], i: number) => list.includes(i)

/** The encoder/decoder divider sits in the gap before the first decoder step. */
const splitX = computed(() =>
  task.value.split === undefined ? null : colX(task.value.split) - (PITCH - BOX_W) / 2)
</script>

<template>
  <WidgetFrame max-width="44rem">
    <svg
      class="dl-seqtask"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${task.name}: inputs at steps ${task.inputs.map(i => i + 1).join(', ')}, outputs at steps ${task.outputs.map(i => i + 1).join(', ')}`"
    >
      <defs>
        <marker id="dl-seqtask-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- Row labels, so the three rows are never guessed at. -->
      <text class="dl-seqtask__row" :x="LEFT - 12" :y="Y_OUT + IO_H / 2 + 4" text-anchor="end">y</text>
      <text class="dl-seqtask__row" :x="LEFT - 12" :y="Y_CELL + CELL_H / 2 + 4" text-anchor="end">h</text>
      <text class="dl-seqtask__row" :x="LEFT - 12" :y="Y_IN + IO_H / 2 + 4" text-anchor="end">x</text>

      <!-- The state passing from one step to the next: the only new wire in the lecture. -->
      <g v-if="task.recurrent" class="dl-seqtask__state">
        <line
          v-for="i in STEPS - 1"
          :key="`s${i}`"
          :x1="colX(i - 1) + BOX_W" :y1="Y_CELL + CELL_H / 2"
          :x2="colX(i) - 3" :y2="Y_CELL + CELL_H / 2"
          marker-end="url(#dl-seqtask-arrow)"
        />
      </g>

      <g v-for="i in STEPS" :key="`col${i}`">
        <!-- Input -->
        <rect
          class="dl-seqtask__io"
          :class="{ 'is-on': has(task.inputs, i - 1) }"
          :x="colX(i - 1)" :y="Y_IN" :width="BOX_W" :height="IO_H" rx="4"
        />
        <text
          v-if="has(task.inputs, i - 1)"
          class="dl-seqtask__iolabel" :x="midX(i - 1)" :y="Y_IN + IO_H / 2 + 4" text-anchor="middle"
        >x<tspan class="dl-seqtask__sub" dy="3">{{ i }}</tspan></text>

        <line
          v-if="has(task.inputs, i - 1)"
          class="dl-seqtask__feed"
          :x1="midX(i - 1)" :y1="Y_IN - 2" :x2="midX(i - 1)" :y2="Y_CELL + CELL_H + 4"
          marker-end="url(#dl-seqtask-arrow)"
        />

        <!-- The recurrent cell: present at every step, always the same weights. -->
        <rect
          class="dl-seqtask__cell"
          :x="colX(i - 1)" :y="Y_CELL" :width="BOX_W" :height="CELL_H" rx="5"
        />
        <text class="dl-seqtask__celllabel" :x="midX(i - 1)" :y="Y_CELL + CELL_H / 2 + 4" text-anchor="middle">
          h<tspan class="dl-seqtask__sub" dy="3">{{ i }}</tspan>
        </text>

        <!-- Output -->
        <line
          v-if="has(task.outputs, i - 1)"
          class="dl-seqtask__feed"
          :x1="midX(i - 1)" :y1="Y_CELL - 2" :x2="midX(i - 1)" :y2="Y_OUT + IO_H + 4"
          marker-end="url(#dl-seqtask-arrow)"
        />
        <rect
          class="dl-seqtask__io"
          :class="{ 'is-on': has(task.outputs, i - 1), 'is-out': has(task.outputs, i - 1) }"
          :x="colX(i - 1)" :y="Y_OUT" :width="BOX_W" :height="IO_H" rx="4"
        />
        <text
          v-if="has(task.outputs, i - 1)"
          class="dl-seqtask__iolabel" :x="midX(i - 1)" :y="Y_OUT + IO_H / 2 + 4" text-anchor="middle"
        >y<tspan class="dl-seqtask__sub" dy="3">{{ i }}</tspan></text>

        <text class="dl-seqtask__t" :x="midX(i - 1)" :y="HEIGHT - 8" text-anchor="middle">t = {{ i }}</text>
      </g>

      <!-- Encoder | decoder -->
      <g v-if="splitX !== null" class="dl-seqtask__split">
        <line :x1="splitX" :y1="Y_OUT - 8" :x2="splitX" :y2="Y_IN + IO_H + 8" />
        <text :x="splitX - 8" :y="Y_OUT + 4" text-anchor="end">encoder</text>
        <text :x="splitX + 8" :y="Y_OUT + 4" text-anchor="start">decoder</text>
      </g>
    </svg>

    <template #controls>
      <div class="dl-seqtask__tabs">
        <button
          v-for="(t, i) in TASKS"
          :key="t.key"
          type="button"
          :class="{ 'is-selected': i === selected }"
          @click="selected = i"
        >{{ t.name }}</button>
      </div>
    </template>

    <template #readout>
      <div><strong>{{ task.shape }}</strong> — {{ task.example }}</div>
      <div class="dl-seqtask__loss">{{ task.loss }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-seqtask {
  width: 100%;
  height: 100%;
}

.dl-seqtask__io {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.dl-seqtask__io.is-on {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
  stroke-dasharray: none;
}

.dl-seqtask__io.is-out {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-seqtask__cell {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
  stroke-width: 1;
}

.dl-seqtask__celllabel {
  fill: #fff;
  font-size: 14px;
  font-weight: 600;
}

.dl-seqtask__iolabel {
  fill: var(--dl-heading);
  font-size: 13px;
  font-weight: 600;
}

.dl-seqtask__sub {
  font-size: 9px;
  font-weight: 400;
}

.dl-seqtask__feed {
  stroke: var(--dl-muted);
  stroke-width: 1.4;
  color: var(--dl-muted);
}

.dl-seqtask__state line {
  stroke: var(--dl-accent-strong);
  stroke-width: 2.2;
  color: var(--dl-accent-strong);
}

.dl-seqtask__row {
  fill: var(--dl-muted);
  font-size: 12px;
  font-style: italic;
}

.dl-seqtask__t {
  fill: var(--dl-muted);
  font-size: 10px;
}

.dl-seqtask__split line {
  stroke: var(--dl-heading);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.dl-seqtask__split text {
  fill: var(--dl-muted);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dl-seqtask__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dl-seqtask__tabs button {
  padding: 0.28rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--dl-border);
  background: transparent;
  color: var(--dl-body);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.dl-seqtask__tabs button:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-seqtask__tabs button.is-selected {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
}

.dl-seqtask__tabs button:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-seqtask__loss {
  margin-top: 0.15rem;
}
</style>
