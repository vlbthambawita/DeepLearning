<script setup lang="ts">
/*
 * The graph PyTorch builds while you do arithmetic, and what `backward()` then
 * does to it.
 *
 * Lecture 02 derived the gradient of the MSE by hand, one slide of algebra for
 * one loss and one activation. The claim here is that the derivative is a
 * property of the *computation*, so it can be assembled from local derivatives
 * — one per edge — multiplied along the path. Stepping the widget forward then
 * backward over the same picture is the only way to show that the backward pass
 * walks the graph the forward pass just built, in reverse, and that nothing
 * about it is mysterious once every edge carries its own small derivative.
 *
 * The network is one neuron with a squared error, so every number on screen is
 * one the room can check on paper: it is the Adaline of Lecture 02, plus a
 * sigmoid.
 *
 * `mode="accumulate"` drops the graph and keeps the one thing the graph cannot
 * show: `.grad` is added into, never overwritten, so a missing `zero_grad()` is
 * a silent bug rather than an error.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  mode?: 'graph' | 'accumulate'
}>(), {
  mode: 'graph',
})

/* ---- the computation ----------------------------------------------------- */

const X = 2
const TARGET = 1

const w = ref(0.5)
const b = ref(0.1)

const z = computed(() => w.value * X + b.value)
const a = computed(() => 1 / (1 + Math.exp(-z.value)))
const loss = computed(() => (a.value - TARGET) ** 2)

/** Local derivatives, one per edge — the only calculus in the widget. */
const dL_da = computed(() => 2 * (a.value - TARGET))
const da_dz = computed(() => a.value * (1 - a.value))
const dL_dz = computed(() => dL_da.value * da_dz.value)
const dL_dw = computed(() => dL_dz.value * X)
const dL_db = computed(() => dL_dz.value)

const f = (v: number) => v.toFixed(3)

/* ---- stepping ------------------------------------------------------------ */

/*
 * 0 graph only · 1-3 forward · 4-6 backward. Kept as one counter so a single
 * Step button drives the whole thing and the PDF export gets one page per
 * state.
 */
const step = ref(0)
const LAST = 6

const PHASE: Record<number, string> = {
  0: 'The graph, before anything runs. w and b were created with requires_grad=True, so PyTorch will record every operation they take part in.',
  1: 'Forward: z = w·x + b. PyTorch computes the number and, on the side, remembers that z came from a multiply and an add.',
  2: 'Forward: a = σ(z). One more node, one more recorded operation.',
  3: 'Forward done. loss is a 0-D tensor that knows its entire history — that is what grad_fn on it means.',
  4: 'Backward starts at the loss with ∂L/∂L = 1 and takes one step: ∂L/∂a = 2(a − y).',
  5: 'Chain rule along the next edge: ∂L/∂z = ∂L/∂a · ∂a/∂z. Each edge contributes its own local derivative and nothing else.',
  6: 'The leaves. ∂L/∂w = ∂L/∂z · x and ∂L/∂b = ∂L/∂z · 1 land in w.grad and b.grad. Nobody derived them: they were multiplied along the edges.',
}

const forwardTo = computed(() => Math.min(step.value, 3))
const backTo = computed(() => Math.max(0, step.value - 3))

/* ---- geometry ------------------------------------------------------------ */

const NODE_W = 84
const NODE_H = 40

interface Node {
  key: string
  cx: number
  cy: number
  title: string
  value: string | null
  kind: 'const' | 'leaf' | 'op'
  /** `.grad`, shown once the backward pass has reached this leaf. */
  grad?: string | null
}

const nodes = computed<Node[]>(() => [
  { key: 'x', cx: 52, cy: 34, title: 'x', value: f(X), kind: 'const' },
  { key: 'w', cx: 52, cy: 100, title: 'w', value: f(w.value), kind: 'leaf', grad: backTo.value >= 3 ? f(dL_dw.value) : null },
  { key: 'b', cx: 52, cy: 166, title: 'b', value: f(b.value), kind: 'leaf', grad: backTo.value >= 3 ? f(dL_db.value) : null },
  { key: 'z', cx: 210, cy: 100, title: 'z = w·x + b', value: forwardTo.value >= 1 ? f(z.value) : null, kind: 'op' },
  { key: 'a', cx: 348, cy: 100, title: 'a = σ(z)', value: forwardTo.value >= 2 ? f(a.value) : null, kind: 'op' },
  { key: 'y', cx: 348, cy: 34, title: 'y', value: f(TARGET), kind: 'const' },
  { key: 'L', cx: 486, cy: 100, title: 'L = (a − y)²', value: forwardTo.value >= 3 ? f(loss.value) : null, kind: 'op' },
])

const byKey = computed(() => Object.fromEntries(nodes.value.map(n => [n.key, n])) as Record<string, Node>)

interface Edge {
  from: string
  to: string
  /** Local derivative label, revealed on the way back. */
  local: string
  /** Accumulated gradient at the tail of the edge, once it is known. */
  chain?: string
  /** Which backward step reveals this edge. */
  at: number
  tracked: boolean
}

const edges = computed<Edge[]>(() => [
  { from: 'x', to: 'z', local: '', at: 99, tracked: false },
  { from: 'w', to: 'z', local: '∂z/∂w = x', chain: `∂L/∂w = ${f(dL_dw.value)}`, at: 3, tracked: true },
  { from: 'b', to: 'z', local: '∂z/∂b = 1', chain: `∂L/∂b = ${f(dL_db.value)}`, at: 3, tracked: true },
  { from: 'z', to: 'a', local: `∂a/∂z = ${f(da_dz.value)}`, chain: `∂L/∂z = ${f(dL_dz.value)}`, at: 2, tracked: true },
  { from: 'a', to: 'L', local: `∂L/∂a = ${f(dL_da.value)}`, at: 1, tracked: true },
  { from: 'y', to: 'L', local: '', at: 99, tracked: false },
])

/** Edge endpoints on the node borders, so arrows do not run under the boxes. */
function endpoints(e: Edge) {
  const from = byKey.value[e.from]
  const to = byKey.value[e.to]
  const sameRow = Math.abs(from.cy - to.cy) < 4
  return sameRow
    ? { x1: from.cx + NODE_W / 2, y1: from.cy, x2: to.cx - NODE_W / 2, y2: to.cy }
    : { x1: from.cx + NODE_W / 2 - 12, y1: from.cy + (to.cy > from.cy ? NODE_H / 2 : -NODE_H / 2), x2: to.cx - NODE_W / 2, y2: to.cy + (to.cy > from.cy ? -12 : 12) }
}

/* ---- accumulate mode ----------------------------------------------------- */

const calls = ref(0)
const accumulated = computed(() => calls.value * dL_dw.value)
/** Bar length is scaled to three calls, which is as far as the demo goes. */
const barPct = computed(() => Math.min(100, (Math.abs(accumulated.value) / (3 * Math.abs(dL_dw.value) || 1)) * 100))
</script>

<template>
  <WidgetFrame v-if="props.mode === 'graph'" max-width="42rem">
    <svg
      class="dl-ag"
      viewBox="0 0 552 212"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="PHASE[step]"
    >
      <g class="dl-ag__edges">
        <g
          v-for="e in edges"
          :key="`${e.from}-${e.to}`"
          :class="{ 'is-untracked': !e.tracked, 'is-live': e.tracked && backTo >= e.at }"
        >
          <line v-bind="endpoints(e)" />
          <path
            v-if="e.tracked && backTo >= e.at"
            :d="`M ${endpoints(e).x1} ${endpoints(e).y1} l 7 -4 v 8 z`"
          />
          <text
            v-if="e.tracked && backTo >= e.at"
            :x="(endpoints(e).x1 + endpoints(e).x2) / 2"
            :y="(endpoints(e).y1 + endpoints(e).y2) / 2 - 6"
            text-anchor="middle"
          >{{ e.local }}</text>
        </g>
      </g>

      <g class="dl-ag__nodes">
        <g v-for="n in nodes" :key="n.key" :class="[`is-${n.kind}`, { 'is-pending': n.value === null }]">
          <rect :x="n.cx - NODE_W / 2" :y="n.cy - NODE_H / 2" :width="NODE_W" :height="NODE_H" rx="6" />
          <text class="dl-ag__title" :x="n.cx" :y="n.cy - 3" text-anchor="middle">{{ n.title }}</text>
          <text class="dl-ag__value" :x="n.cx" :y="n.cy + 12" text-anchor="middle">{{ n.value ?? '—' }}</text>
          <text v-if="n.grad" class="dl-ag__grad" :x="n.cx" :y="n.cy + NODE_H / 2 + 12" text-anchor="middle">.grad = {{ n.grad }}</text>
        </g>
      </g>

      <text v-if="forwardTo >= 3 && backTo === 0" class="dl-ag__hint" :x="486" :y="152" text-anchor="middle">loss.backward()</text>
    </svg>

    <template #controls>
      <StepButton label="Step" glyph="▸" :disabled="step >= LAST" @click="step = Math.min(LAST, step + 1)" />
      <StepButton label="Reset" variant="ghost" glyph="↺" @click="step = 0" />
      <Slider v-model="w" label="w" :min="-2" :max="2" :step="0.1" />
      <Slider v-model="b" label="b" :min="-1" :max="1" :step="0.1" />
    </template>

    <template #readout>
      <div class="dl-ag__facts">
        <span>{{ step === 0 ? 'ready' : step <= 3 ? `forward ${step}/3` : `backward ${step - 3}/3` }}</span>
        <span v-if="forwardTo >= 3">loss <strong>{{ f(loss) }}</strong></span>
        <span v-if="backTo >= 3">w.grad <strong>{{ f(dL_dw) }}</strong></span>
        <span v-if="backTo >= 3">b.grad <strong>{{ f(dL_db) }}</strong></span>
      </div>
      <div class="dl-ag__note">{{ PHASE[step] }}</div>
    </template>
  </WidgetFrame>

  <WidgetFrame v-else max-width="34rem">
    <div class="dl-acc">
      <div class="dl-acc__row">
        <code>w.grad</code>
        <div class="dl-acc__track">
          <div class="dl-acc__bar" :style="{ width: `${barPct}%` }" />
        </div>
        <strong>{{ calls === 0 ? 'None' : f(accumulated) }}</strong>
      </div>
      <ol class="dl-acc__log">
        <li v-for="i in calls" :key="i">
          loss.backward() <span aria-hidden="true">&rarr;</span> w.grad += {{ f(dL_dw) }}
          <em>= {{ f(i * dL_dw) }}</em>
        </li>
        <li v-if="calls === 0" class="is-empty">w.grad starts as None, not as zero.</li>
      </ol>
    </div>

    <template #controls>
      <StepButton label="loss.backward()" glyph="▸" :disabled="calls >= 3" @click="calls += 1" />
      <StepButton label="optimiser.zero_grad()" variant="ghost" glyph="↺" @click="calls = 0" />
    </template>

    <template #readout>
      <div class="dl-ag__note">
        <template v-if="calls <= 1">
          Press <code>loss.backward()</code> more than once without zeroing in between.
        </template>
        <template v-else>
          {{ calls }} backward calls, {{ calls }}x the gradient. The optimiser will take a step {{ calls }} times too
          large, the loss will not go down, and nothing will raise an error. This is why
          <code>zero_grad()</code> is in the loop.
        </template>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-ag {
  width: 100%;
  height: 100%;
}

.dl-ag__edges line {
  stroke: var(--dl-border);
  stroke-width: 1.4;
  transition: stroke 0.2s ease;
}

.dl-ag__edges g.is-untracked line {
  stroke-dasharray: 3 3;
}

.dl-ag__edges g.is-live line {
  stroke: var(--dl-accent);
  stroke-width: 2;
}

.dl-ag__edges path {
  fill: var(--dl-accent);
}

.dl-ag__edges text {
  font-size: 9.5px;
  fill: var(--dl-accent);
  font-weight: 600;
}

.dl-ag__nodes rect {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1.2;
}

.dl-ag__nodes g.is-leaf rect {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-ag__nodes g.is-const rect {
  fill: var(--dl-bg);
  stroke-dasharray: 3 2;
}

.dl-ag__nodes g.is-pending rect {
  fill: var(--dl-bg);
}

.dl-ag__title {
  font-size: 10.5px;
  fill: var(--dl-heading);
  font-weight: 600;
}

.dl-ag__value {
  font-size: 11px;
  fill: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-ag__nodes g.is-pending .dl-ag__value {
  fill: var(--dl-muted);
}

.dl-ag__grad {
  font-size: 9.5px;
  fill: var(--dl-accent-strong);
  font-weight: 700;
}

.dl-ag__hint {
  font-size: 10px;
  fill: var(--dl-muted);
  font-family: var(--slidev-code-font-family, monospace);
}

.dl-ag__facts {
  display: flex;
  gap: 1.3rem;
  margin-bottom: 0.2rem;
}

.dl-ag__facts strong {
  color: var(--dl-accent);
}

.dl-ag__note {
  line-height: 1.35;
}

.dl-ag__note code,
.dl-acc code {
  font-size: 0.78rem;
  background: var(--dl-code-bg);
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
}

.dl-acc {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.dl-acc__row {
  display: grid;
  grid-template-columns: auto 1fr 5rem;
  align-items: center;
  gap: 0.7rem;
}

.dl-acc__track {
  height: 1.5rem;
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  border-radius: 4px;
  overflow: hidden;
}

.dl-acc__bar {
  height: 100%;
  background: var(--dl-accent);
  transition: width 0.25s ease;
}

.dl-acc__row strong {
  color: var(--dl-accent);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.dl-acc__log {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.82rem;
  color: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-acc__log li {
  margin: 0.1rem 0;
}

.dl-acc__log em {
  color: var(--dl-accent);
  font-style: normal;
  font-weight: 600;
}

.dl-acc__log li.is-empty {
  list-style: none;
  margin-left: -1.2rem;
  color: var(--dl-muted);
}
</style>
