<script setup lang="ts">
/*
 * The recurrent layer, folded and unrolled — 2025 Lecture 5/6 slides 6, 7 and 9,
 * which were three static book figures of the same thing.
 *
 * Two ideas have to land here and they fight each other on paper. The *folded*
 * picture says there is one layer with one set of weights; the *unrolled*
 * picture says the computation is a chain as long as the sequence. Students who
 * only see the loop think the network has a memory cell; students who only see
 * the chain think there are T layers with T sets of weights. Toggling between
 * the two, with the same three weight labels on both, is the only way I have
 * found to say "same weights, many steps" so that it sticks.
 *
 * Stepping through the unrolled chain prints the actual hidden state from
 * `useRecurrence`, so the sequence x = 1, 0, 1, 0 does the arguing: at t = 2 the
 * input is zero and the state is not.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'
import { DEMO_RNN, rnnForward } from '../composables/useRecurrence'

const props = withDefaults(defineProps<{
  /** Time steps in the unrolled chain. */
  steps?: number
  /** Which picture to open on. The toggle is always available. */
  start?: 'fold' | 'unroll'
  /** Print the hidden state inside each cell. */
  values?: boolean
  /** Show the weight name on every arrow — the parameter-sharing point. */
  weights?: boolean
}>(), {
  steps: 4,
  start: 'fold',
  values: true,
  weights: true,
})

/** x = 1, 0, 1, 0, … — a pulse, so the state between pulses is visibly non-zero. */
const inputs = computed(() =>
  Array.from({ length: props.steps }, (_, i) => [i % 2 === 0 ? 1 : 0]))

const trace = computed(() => rnnForward(inputs.value, DEMO_RNN))

const folded = ref(props.start === 'fold')
/** How many steps of the chain have been computed. -1 = none yet. */
const at = ref(-1)

const cursor = computed(() => Math.min(at.value, props.steps - 1))
const current = computed(() => (cursor.value < 0 ? null : trace.value[cursor.value]))
const done = computed(() => cursor.value >= props.steps - 1)

function step() {
  folded.value = false
  at.value = cursor.value < props.steps - 1 ? cursor.value + 1 : -1
}

const vec = (v: number[]) => v.map(n => num(n)).join(', ')

/* ---- unrolled geometry --------------------------------------------------- */

const PITCH = 118
const LEFT = 58
const BOX_W = 78
const CELL_H = 46
const IO_H = 30
const Y_OUT = 18
const Y_CELL = 92
const Y_IN = 172

const U_WIDTH = computed(() => LEFT + (props.steps - 1) * PITCH + BOX_W + 30)
const U_HEIGHT = 226

const colX = (i: number) => LEFT + i * PITCH
const midX = (i: number) => colX(i) + BOX_W / 2

/* ---- folded geometry ----------------------------------------------------- */

const F_WIDTH = 330
const F_HEIGHT = 226
const F_X = 96
const F_W = 96
const F_CY = Y_CELL
const F_MID = F_CY + CELL_H / 2
</script>

<template>
  <WidgetFrame :max-width="folded ? '24rem' : '46rem'">
    <!-- One cell with a loop: the network as it is written down. -->
    <svg
      v-if="folded"
      class="dl-unroll"
      :viewBox="`0 0 ${F_WIDTH} ${F_HEIGHT}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A recurrent layer drawn folded: one hidden layer whose output is fed back into itself one time step later"
    >
      <defs>
        <marker id="dl-unroll-arrowf" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <rect class="dl-unroll__io" :x="F_X" :y="Y_IN" :width="F_W" :height="IO_H" rx="4" />
      <text class="dl-unroll__iolabel" :x="F_X + F_W / 2" :y="Y_IN + IO_H / 2 + 4" text-anchor="middle">x</text>
      <line
        class="dl-unroll__feed"
        :x1="F_X + F_W / 2" :y1="Y_IN - 2" :x2="F_X + F_W / 2" :y2="F_CY + CELL_H + 4"
        marker-end="url(#dl-unroll-arrowf)"
      />
      <text v-if="props.weights" class="dl-unroll__w" :x="F_X + F_W / 2 + 8" :y="Y_IN - 12">W<tspan class="dl-unroll__sub" dy="3">xh</tspan></text>

      <rect class="dl-unroll__cell" :x="F_X" :y="F_CY" :width="F_W" :height="CELL_H" rx="6" />
      <text class="dl-unroll__celllabel" :x="F_X + F_W / 2" :y="F_MID + 5" text-anchor="middle">h</text>

      <!-- The loop: out of the right edge and straight back into it. -->
      <path
        class="dl-unroll__loop"
        :d="`M ${F_X + F_W} ${F_MID - 11} C ${F_X + F_W + 62} ${F_MID - 54}, ${F_X + F_W + 62} ${F_MID + 54}, ${F_X + F_W} ${F_MID + 11}`"
        fill="none"
        marker-end="url(#dl-unroll-arrowf)"
      />
      <text v-if="props.weights" class="dl-unroll__w is-loop" :x="F_X + F_W + 52" :y="F_MID - 20">W<tspan class="dl-unroll__sub" dy="3">hh</tspan></text>
      <text class="dl-unroll__delay" :x="F_X + F_W + 52" :y="F_MID + 30">one step
        <tspan :x="F_X + F_W + 52" dy="11">of delay</tspan>
      </text>

      <line
        class="dl-unroll__feed"
        :x1="F_X + F_W / 2" :y1="F_CY - 2" :x2="F_X + F_W / 2" :y2="Y_OUT + IO_H + 4"
        marker-end="url(#dl-unroll-arrowf)"
      />
      <text v-if="props.weights" class="dl-unroll__w" :x="F_X + F_W / 2 + 8" :y="F_CY - 14">W<tspan class="dl-unroll__sub" dy="3">ho</tspan></text>
      <rect class="dl-unroll__io is-out" :x="F_X" :y="Y_OUT" :width="F_W" :height="IO_H" rx="4" />
      <text class="dl-unroll__iolabel" :x="F_X + F_W / 2" :y="Y_OUT + IO_H / 2 + 4" text-anchor="middle">o</text>
    </svg>

    <!-- The same layer, copied once per time step. -->
    <svg
      v-else
      class="dl-unroll"
      :viewBox="`0 0 ${U_WIDTH} ${U_HEIGHT}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`The same recurrent layer unrolled across ${props.steps} time steps, every copy using the same weights`"
    >
      <defs>
        <marker id="dl-unroll-arrowu" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- h_0, the state the chain starts from: zeros, and worth naming. -->
      <line
        class="dl-unroll__state" :class="{ 'is-live': cursor >= 0 }"
        :x1="LEFT - 34" :y1="Y_CELL + CELL_H / 2" :x2="colX(0) - 3" :y2="Y_CELL + CELL_H / 2"
        marker-end="url(#dl-unroll-arrowu)"
      />
      <text class="dl-unroll__h0" :x="LEFT - 38" :y="Y_CELL + CELL_H / 2 + 4" text-anchor="end">0</text>

      <g v-for="i in props.steps" :key="`col${i}`">
        <!-- state in from the previous step -->
        <template v-if="i > 1">
          <line
            class="dl-unroll__state" :class="{ 'is-live': cursor >= i - 1 }"
            :x1="colX(i - 2) + BOX_W" :y1="Y_CELL + CELL_H / 2" :x2="colX(i - 1) - 3" :y2="Y_CELL + CELL_H / 2"
            marker-end="url(#dl-unroll-arrowu)"
          />
          <text v-if="props.weights" class="dl-unroll__w is-shared" :x="(colX(i - 2) + BOX_W + colX(i - 1)) / 2" :y="Y_CELL + CELL_H / 2 - 8" text-anchor="middle">
            W<tspan class="dl-unroll__sub" dy="3">hh</tspan>
          </text>
        </template>

        <rect class="dl-unroll__io" :x="colX(i - 1)" :y="Y_IN" :width="BOX_W" :height="IO_H" rx="4" />
        <text class="dl-unroll__iolabel" :x="midX(i - 1)" :y="Y_IN + IO_H / 2 + 4" text-anchor="middle">
          x<tspan class="dl-unroll__sub" dy="3">{{ i }}</tspan>
          <tspan class="dl-unroll__val" dy="-3"> = {{ inputs[i - 1][0] }}</tspan>
        </text>
        <line
          class="dl-unroll__feed" :class="{ 'is-live': cursor === i - 1 }"
          :x1="midX(i - 1)" :y1="Y_IN - 2" :x2="midX(i - 1)" :y2="Y_CELL + CELL_H + 4"
          marker-end="url(#dl-unroll-arrowu)"
        />
        <text v-if="props.weights" class="dl-unroll__w is-shared" :x="midX(i - 1) + 7" :y="Y_IN - 14">
          W<tspan class="dl-unroll__sub" dy="3">xh</tspan>
        </text>

        <rect
          class="dl-unroll__cell"
          :class="{ 'is-done': cursor >= i - 1, 'is-current': cursor === i - 1 }"
          :x="colX(i - 1)" :y="Y_CELL" :width="BOX_W" :height="CELL_H" rx="6"
        />
        <text class="dl-unroll__celllabel" :x="midX(i - 1)" :y="Y_CELL + (props.values ? 19 : 28)" text-anchor="middle">
          h<tspan class="dl-unroll__sub" dy="3">{{ i }}</tspan>
        </text>
        <text
          v-if="props.values && cursor >= i - 1"
          class="dl-unroll__hval" :x="midX(i - 1)" :y="Y_CELL + 35" text-anchor="middle"
        >{{ vec(trace[i - 1].h) }}</text>

        <line
          class="dl-unroll__feed" :class="{ 'is-live': cursor === i - 1 }"
          :x1="midX(i - 1)" :y1="Y_CELL - 2" :x2="midX(i - 1)" :y2="Y_OUT + IO_H + 4"
          marker-end="url(#dl-unroll-arrowu)"
        />
        <text v-if="props.weights" class="dl-unroll__w is-shared" :x="midX(i - 1) + 7" :y="Y_CELL - 14">
          W<tspan class="dl-unroll__sub" dy="3">ho</tspan>
        </text>
        <rect
          class="dl-unroll__io" :class="{ 'is-out': cursor >= i - 1 }"
          :x="colX(i - 1)" :y="Y_OUT" :width="BOX_W" :height="IO_H" rx="4"
        />
        <text class="dl-unroll__iolabel" :x="midX(i - 1)" :y="Y_OUT + IO_H / 2 + 4" text-anchor="middle">
          o<tspan class="dl-unroll__sub" dy="3">{{ i }}</tspan>
          <tspan v-if="cursor >= i - 1" class="dl-unroll__val" dy="-3"> = {{ num(trace[i - 1].o[0]) }}</tspan>
        </text>

        <text class="dl-unroll__t" :x="midX(i - 1)" :y="U_HEIGHT - 6" text-anchor="middle">t = {{ i }}</text>
      </g>
    </svg>

    <template #controls>
      <StepButton :label="folded ? 'Unroll it' : 'Fold it back'" glyph="⇄" variant="ghost" @click="folded = !folded" />
      <StepButton :label="done && !folded ? 'Start over' : 'Next step'" glyph="▸" @click="step" />
    </template>

    <template #readout>
      <template v-if="folded">
        One layer, one set of weights, one loop. The loop is not a second layer — it is this
        layer reading <strong>its own previous output</strong>, one time step later.
      </template>
      <template v-else-if="current">
        <span class="dl-unroll__eq">
          t = {{ current.t }}:
          W<sub>xh</sub>x = [{{ vec(current.fromInput) }}] +
          W<sub>hh</sub>h<sub>{{ current.t - 1 }}</sub> = [{{ vec(current.fromState) }}]
          → h<sub>{{ current.t }}</sub> = tanh([{{ vec(current.z) }}]) = [<strong>{{ vec(current.h) }}</strong>]
        </span>
        <span v-if="current.x[0] === 0" class="dl-unroll__note">
          The input at this step is <strong>0</strong> — and the state is not. That is the memory.
        </span>
      </template>
      <template v-else>
        {{ props.steps }} copies of one layer. Every W<sub>xh</sub>, every W<sub>hh</sub>, every
        W<sub>ho</sub> on this picture is the <strong>same matrix</strong>. Press
        <strong>Next step</strong>.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-unroll {
  width: 100%;
  height: 100%;
}

.dl-unroll__io {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.dl-unroll__io.is-out {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-unroll__cell {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
  stroke-width: 1.2;
  transition: fill 0.25s ease, stroke 0.25s ease;
}

.dl-unroll__cell.is-done {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-unroll__cell.is-current {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
}

.dl-unroll__celllabel {
  fill: var(--dl-heading);
  font-size: 14px;
  font-weight: 600;
}

.dl-unroll__cell.is-current + .dl-unroll__celllabel {
  fill: #fff;
}

.dl-unroll__hval {
  fill: var(--dl-heading);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

.dl-unroll__iolabel {
  fill: var(--dl-heading);
  font-size: 12.5px;
  font-weight: 600;
}

.dl-unroll__val {
  font-size: 10px;
  font-weight: 400;
  fill: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-unroll__sub {
  font-size: 9px;
  font-weight: 400;
}

.dl-unroll__feed {
  stroke: var(--dl-muted);
  stroke-width: 1.4;
  color: var(--dl-muted);
  transition: stroke 0.2s ease;
}

.dl-unroll__feed.is-live {
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
  color: var(--dl-accent-strong);
}

.dl-unroll__state {
  stroke: var(--dl-border);
  stroke-width: 2;
  color: var(--dl-border);
  transition: stroke 0.2s ease;
}

.dl-unroll__state.is-live {
  stroke: var(--dl-accent-strong);
  color: var(--dl-accent-strong);
}

.dl-unroll__loop {
  stroke: var(--dl-accent);
  stroke-width: 2.2;
  color: var(--dl-accent);
}

.dl-unroll__w {
  fill: var(--dl-muted);
  font-size: 10.5px;
  font-style: italic;
}

/* The three weight names are what is shared; colouring them says so. */
.dl-unroll__w.is-shared,
.dl-unroll__w.is-loop {
  fill: var(--dl-accent);
  font-weight: 600;
}

.dl-unroll__delay {
  fill: var(--dl-muted);
  font-size: 9.5px;
}

.dl-unroll__h0 {
  fill: var(--dl-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.dl-unroll__t {
  fill: var(--dl-muted);
  font-size: 10px;
}

.dl-unroll__eq {
  font-variant-numeric: tabular-nums;
}

.dl-unroll__note {
  display: block;
  margin-top: 0.15rem;
  color: var(--dl-accent);
}
</style>
