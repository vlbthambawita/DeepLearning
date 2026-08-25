<script setup lang="ts">
/*
 * Lecture 02 slide 19 — the perceptron and Adaline, drawn as the same network
 * twice.
 *
 * The 2025 deck put two book screenshots side by side and left the room to spot
 * the difference; the first replacement here drew one abstract chain of boxes
 * and moved a marker along it, which lost the network. Both are now full
 * diagrams — inputs fanned in through weights, net input, activation, output,
 * comparison against y, and the error travelling back — laid out on identical
 * columns so that anything that differs is a difference you can see rather than
 * one you have to be told.
 *
 * What actually differs (Raschka's FAQ; Widrow & Hoff 1960):
 *
 *   1. The activation the weights are learned through. The perceptron learns
 *      through the unit step; Adaline learns through a linear (identity)
 *      activation and keeps the step only to turn the final output into a class
 *      label.
 *   2. Therefore where the error is measured — from the thresholded label ŷ, or
 *      from the continuous σ(z) = z before thresholding. That is the one edge
 *      that moves, and it is marked in red in both rows.
 *   3. Therefore whether a loss function exists at all. The perceptron minimises
 *      nothing; Adaline minimises MSE, which is differentiable and convex, so
 *      gradient descent applies.
 *   4. Therefore the update regime: one example at a time and only on mistakes,
 *      versus all n examples at once, every step.
 *
 * Everything after the first item is a consequence of the first, which is why
 * the diagram highlights the activation column and the error tap together.
 */
import { computed, ref } from 'vue'

type Focus = 'both' | 'perceptron' | 'adaline'
const focus = ref<Focus>('both')
const dimmed = (row: 'perceptron' | 'adaline') => focus.value !== 'both' && focus.value !== row

/** Column centres, shared by both rows so the diagrams line up stage by stage. */
const C = { in: 44, sum: 164, act: 276, thr: 382, out: 470, cmp: 556 }

interface Row {
  key: 'perceptron' | 'adaline'
  title: string
  /** Centre line of the row. */
  y: number
  /** y of the horizontal run of the weight-update feedback path. */
  loop: number
  /** Label under the activation node. */
  actCap: string
  /** Label under the threshold node. */
  thrCap: string
  /** The threshold is a real, separate stage only in Adaline. */
  thrGhost: boolean
  /** What the comparison subtracts from y. */
  errExpr: string
}

const ROWS: Row[] = [
  {
    key: 'perceptron',
    title: 'Perceptron — Rosenblatt, 1957',
    y: 84,
    loop: 152,
    actCap: 'unit step σ(z)',
    thrCap: 'already thresholded',
    thrGhost: true,
    errExpr: 'e = y − ŷ',
  },
  {
    key: 'adaline',
    title: 'Adaline — Widrow & Hoff, 1960',
    y: 274,
    loop: 342,
    actCap: 'linear σ(z) = z',
    thrCap: 'unit step — label only',
    thrGhost: false,
    errExpr: 'e = y − σ(z)',
  },
]

const INPUTS = [
  { dy: -30, sym: 'x₁', w: 'w₁' },
  { dy: 0, sym: 'x₂', w: 'w₂' },
  { dy: 30, sym: '1', w: 'b' },
]

/**
 * The one edge that moves: the perceptron taps the error after the threshold,
 * Adaline before it. Everything else in the two rows is identical.
 */
function tapPath(row: Row) {
  if (row.key === 'perceptron')
    return `M${C.out + 20},${row.y} L${C.cmp - 22},${row.y}`
  // Adaline routes over the top of the threshold stage rather than through it.
  const lift = row.y - 44
  return `M${C.act + 24},${row.y} L${C.act + 42},${row.y} L${C.act + 42},${lift} L${C.cmp},${lift} L${C.cmp},${row.y - 22}`
}

const tapDot = (row: Row) => (row.key === 'perceptron'
  ? { x: C.out + 30, y: row.y }
  : { x: C.act + 42, y: row.y })

const readout = computed(() => {
  if (focus.value === 'perceptron') {
    return 'The error is measured from the <b>thresholded</b> label ŷ. The unit step has zero derivative everywhere it has one, so there is no gradient and no loss function to minimise — the rule just nudges the weights whenever it gets an example wrong, one example at a time. It stops only when the data happens to be separated, which is why convergence needs linear separability.'
  }
  if (focus.value === 'adaline') {
    return 'The error is measured from the <b>continuous</b> linear activation, before thresholding. That makes the mean squared error differentiable and convex, so the weights can be moved by gradient descent, computed over all n examples at once. The unit step survives only to turn the final output into a class label — it plays no part in learning.'
  }
  return 'The two networks are the same network. One edge differs: the red tap sits <b>after</b> the threshold in the perceptron and <b>before</b> it in Adaline — and every other difference follows from that.'
})
</script>

<template>
  <WidgetFrame max-width="52rem">
    <svg viewBox="0 0 660 386" class="dl-pva" role="img"
      aria-label="The perceptron and Adaline drawn as the same network, differing in where the error is measured">
      <defs>
        <marker id="dl-pva-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--dl-muted)" />
        </marker>
        <marker id="dl-pva-tip-err" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--dl-danger)" />
        </marker>
      </defs>

      <g v-for="r in ROWS" :key="r.key" :class="{ 'is-dim': dimmed(r.key) }" @click="focus = r.key">
        <text :x="C.in - 30" :y="r.y - 62" class="rowhead">{{ r.title }}</text>

        <!-- inputs and weights -->
        <g v-for="i in INPUTS" :key="i.sym">
          <circle :cx="C.in" :cy="r.y + i.dy" r="14" class="node" />
          <text :x="C.in" :y="r.y + i.dy + 5" class="sym">{{ i.sym }}</text>
          <line
            :x1="C.in + 14" :y1="r.y + i.dy" :x2="C.sum - 24" :y2="r.y"
            class="edge" marker-end="url(#dl-pva-tip)"
          />
        </g>
        <text :x="C.in + 62" :y="r.y - 34" class="wlbl">w₁, w₂, b</text>

        <!-- net input -->
        <circle :cx="C.sum" :cy="r.y" r="22" class="node is-op" />
        <text :x="C.sum" :y="r.y + 7" class="sym is-big">Σ</text>
        <text :x="C.sum" :y="r.y + 40" class="cap">net input z</text>
        <line :x1="C.sum + 22" :y1="r.y" :x2="C.act - 26" :y2="r.y" class="edge" marker-end="url(#dl-pva-tip)" />

        <!-- the activation the weights are learned through: the actual difference -->
        <circle :cx="C.act" :cy="r.y" r="24" class="node is-op is-diff" />
        <path v-if="r.key === 'perceptron'" :d="`M${C.act - 14},${r.y + 8} L${C.act},${r.y + 8} L${C.act},${r.y - 10} L${C.act + 14},${r.y - 10}`" class="glyph" />
        <path v-else :d="`M${C.act - 14},${r.y + 10} L${C.act + 14},${r.y - 10}`" class="glyph" />
        <text :x="C.act" :y="r.y + 42" class="cap is-diff">{{ r.actCap }}</text>

        <line :x1="C.act + 24" :y1="r.y" :x2="C.thr - 24" :y2="r.y" class="edge" marker-end="url(#dl-pva-tip)" />

        <!-- threshold: a live stage in Adaline, already spent in the perceptron -->
        <circle :cx="C.thr" :cy="r.y" r="22" class="node" :class="r.thrGhost ? 'is-ghost' : 'is-op'" />
        <path :d="`M${C.thr - 12},${r.y + 7} L${C.thr},${r.y + 7} L${C.thr},${r.y - 9} L${C.thr + 12},${r.y - 9}`" class="glyph" :class="{ 'is-ghost': r.thrGhost }" />
        <text :x="C.thr" :y="r.y + 40" class="cap" :class="{ 'is-ghost': r.thrGhost }">{{ r.thrCap }}</text>

        <line :x1="C.thr + 22" :y1="r.y" :x2="C.out - 18" :y2="r.y" class="edge" marker-end="url(#dl-pva-tip)" />

        <!-- predicted class label -->
        <circle :cx="C.out" :cy="r.y" r="20" class="node" />
        <text :x="C.out" :y="r.y + 6" class="sym">ŷ</text>
        <text :x="C.out" :y="r.y + 38" class="cap">class label</text>

        <!--
          The true label comes in over the shoulder rather than straight down:
          Adaline's error tap has to cross the space directly above the compare
          node on its way from the linear activation.
        -->
        <circle :cx="C.cmp + 38" :cy="r.y - 50" r="17" class="node is-truth" />
        <text :x="C.cmp + 38" :y="r.y - 45" class="sym">y</text>
        <line :x1="C.cmp + 28" :y1="r.y - 37" :x2="C.cmp + 12" :y2="r.y - 22" class="edge is-err" marker-end="url(#dl-pva-tip-err)" />

        <circle :cx="C.cmp" :cy="r.y" r="20" class="node is-compare" />
        <text :x="C.cmp" :y="r.y + 6" class="sym is-err">−</text>
        <text :x="C.cmp + 25" :y="r.y + 4" class="cap is-err is-left">{{ r.errExpr }}</text>

        <!-- where the error is tapped: the one thing that moves -->
        <path :d="tapPath(r)" class="edge is-err" fill="none" marker-end="url(#dl-pva-tip-err)" />
        <circle :cx="tapDot(r).x" :cy="tapDot(r).y" r="5" class="tap" />

        <!-- and back to the weights -->
        <path
          :d="`M${C.cmp},${r.y + 20} L${C.cmp},${r.loop} L${C.in + 62} ${r.loop} L${C.in + 62},${r.y - 26}`"
          class="edge is-err" fill="none" marker-end="url(#dl-pva-tip-err)"
        />
        <text :x="C.in + 210" :y="r.loop + 14" class="looplbl">
          {{ r.key === 'perceptron' ? 'update from one example, only when it is wrong' : 'update from all n examples, every step (gradient descent on MSE)' }}
        </text>
      </g>

      <line x1="16" y1="190" x2="644" y2="190" class="divider" />
    </svg>

    <template #controls>
      <div class="dl-pva__tabs">
        <button type="button" :class="{ 'is-active': focus === 'both' }" @click="focus = 'both'">Both</button>
        <button type="button" :class="{ 'is-active': focus === 'perceptron' }" @click="focus = 'perceptron'">Perceptron</button>
        <button type="button" :class="{ 'is-active': focus === 'adaline' }" @click="focus = 'adaline'">Adaline</button>
      </div>
    </template>

    <template #readout>
      <p v-html="readout" />
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-pva {
  width: 100%;
  height: 100%;
}

.dl-pva > g {
  cursor: pointer;
  transition: opacity 0.25s ease;
}

.dl-pva > g.is-dim {
  opacity: 0.24;
}

.rowhead {
  fill: var(--dl-heading);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.divider {
  stroke: var(--dl-border);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.node {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.6;
}

.node.is-op {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

/* Placed beside a node rather than under it, where a path would cross it. */
.cap.is-left {
  text-anchor: start;
}

/* The activation column: the one stage whose contents genuinely differ. */
.node.is-diff {
  stroke: var(--dl-accent-strong);
  stroke-width: 2.5;
}

.node.is-ghost {
  fill: none;
  stroke: var(--dl-border);
  stroke-dasharray: 4 3;
}

.node.is-truth,
.node.is-compare {
  stroke: var(--dl-danger);
}

.edge {
  stroke: var(--dl-muted);
  stroke-width: 1.4;
  fill: none;
}

.edge.is-err {
  stroke: var(--dl-danger);
  stroke-width: 1.6;
  stroke-dasharray: 5 4;
}

.tap {
  fill: var(--dl-danger);
  stroke: var(--dl-bg);
  stroke-width: 2;
}

.glyph {
  fill: none;
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.glyph.is-ghost {
  stroke: var(--dl-border);
}

.sym {
  fill: var(--dl-heading);
  font-size: 12px;
  text-anchor: middle;
  pointer-events: none;
}

.sym.is-big {
  font-size: 18px;
}

.sym.is-err {
  fill: var(--dl-danger);
  font-size: 17px;
}

.cap {
  fill: var(--dl-muted);
  font-size: 9.5px;
  text-anchor: middle;
  pointer-events: none;
}

.cap.is-diff {
  fill: var(--dl-accent-strong);
  font-weight: 600;
  font-size: 10.5px;
}

.cap.is-err {
  fill: var(--dl-danger);
}

.cap.is-ghost {
  fill: var(--dl-muted);
  opacity: 0.55;
}

.wlbl {
  fill: var(--dl-muted);
  font-size: 10px;
  text-anchor: middle;
  pointer-events: none;
}

.looplbl {
  fill: var(--dl-danger);
  font-size: 10px;
  text-anchor: middle;
  pointer-events: none;
}

.dl-pva__tabs {
  display: flex;
  gap: 0.4rem;
}

.dl-pva__tabs button {
  padding: 0.3rem 0.9rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.88rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-pva__tabs button.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

p {
  margin: 0;
  max-width: 88ch;
  line-height: 1.45;
}

p :deep(b) {
  color: var(--dl-heading);
}
</style>
