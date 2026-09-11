<script setup lang="ts">
/*
 * The LSTM memory block and the GRU, driven rather than described — 2025
 * Lecture 5/6 slides 12 and 13, which were one book screenshot with eleven
 * floating captions pointing at parts of it.
 *
 * The LSTM is drawn as the circuit it is, because the shape of the circuit is
 * the whole argument: the cell state runs straight across the top, touched only
 * by a multiply and an add. Set the forget gate to 1 and the input gate to 0 and
 * `c_t = c_{t-1}` exactly — a number the room can read off the slide, and the
 * reason the gradient survives where a plain RNN's does not.
 *
 * The gates are on sliders rather than computed from x_t. That is deliberate and
 * the readout says so: what a student needs here is what a gate *does* once it
 * has a value, and σ(Wx + Wh + b) is a layer they have known since Lecture 02.
 *
 * The GRU is not drawn as a circuit. Its point is that one interpolation
 * replaces two states, and a blend is far better shown as bars than as wires —
 * the contributions (1−z)h_{t-1} and z·h̃ are then literally two lengths that add
 * up to the answer. Its candidate *is* computed from the reset gate, because the
 * reset gate does nothing visible otherwise.
 */
import { computed, ref, watch } from 'vue'
import { num } from '../composables/useConvolution'
import { gruStep, lstmStep, tanh } from '../composables/useRecurrence'

const props = withDefaults(defineProps<{
  variant?: 'lstm' | 'gru'
}>(), {
  variant: 'lstm',
})

/* ---- state --------------------------------------------------------------- */

const cPrev = ref(0.6)
const f = ref(0.9)
const i = ref(0.4)
const g = ref(0.8)
const o = ref(0.7)

const hPrev = ref(0.6)
const drive = ref(0.5)
const r = ref(1)
const z = ref(0.4)

const lstm = computed(() => lstmStep(cPrev.value, f.value, i.value, g.value, o.value))
const cand = computed(() => tanh(drive.value + 0.9 * r.value * hPrev.value))
const gru = computed(() => gruStep(hPrev.value, z.value, r.value, cand.value))

/* ---- the walk ------------------------------------------------------------ */

interface Stage {
  key: string
  name: string
  /** Which drawn parts stay lit; everything else dims. */
  lit: string[]
  latex: string
  /** The same line with this widget's current numbers in it. */
  numeric: () => string
  note: string
}

const LSTM_STAGES: Stage[] = [
  {
    key: 'forget',
    name: 'forget gate',
    lit: ['cin', 'fgate', 'fmul', 'bus'],
    latex: 'f_t = \\sigma\\!\\left(W_{xf}x_t + W_{hf}h_{t-1} + b_f\\right)',
    numeric: () => `f_t \\cdot c_{t-1} = ${num(f.value)} \\times ${num(cPrev.value)} = ${num(lstm.value.kept)}`,
    note: 'How much of the old cell state survives. 1 keeps all of it, 0 wipes it. Added to the LSTM in 2000 — the original 1997 cell could not forget.',
  },
  {
    key: 'input',
    name: 'input gate',
    lit: ['igate', 'bus'],
    latex: 'i_t = \\sigma\\!\\left(W_{xi}x_t + W_{hi}h_{t-1} + b_i\\right)',
    numeric: () => `i_t = ${num(i.value)}`,
    note: 'How much of the new candidate is allowed in. Note that it decides the amount, not the content.',
  },
  {
    key: 'candidate',
    name: 'candidate',
    lit: ['ggate', 'igmul', 'bus'],
    latex: '\\tilde{c}_t = \\tanh\\!\\left(W_{xc}x_t + W_{hc}h_{t-1} + b_c\\right)',
    numeric: () => `i_t \\cdot \\tilde{c}_t = ${num(i.value)} \\times ${num(g.value)} = ${num(lstm.value.written)}`,
    note: 'The content: what this step would like to write. tanh, so it is signed — the cell state can be pushed down as well as up.',
  },
  {
    key: 'cell',
    name: 'cell state',
    lit: ['cin', 'fmul', 'igmul', 'plus', 'cout'],
    latex: 'c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t',
    numeric: () => `c_t = ${num(lstm.value.kept)} + ${num(lstm.value.written)} = ${num(lstm.value.c)}`,
    note: 'The whole point of the architecture: an addition, not a matrix multiply. Nothing on this path can shrink the gradient by a factor per step.',
  },
  {
    key: 'output',
    name: 'output gate',
    lit: ['ogate', 'bus'],
    latex: 'o_t = \\sigma\\!\\left(W_{xo}x_t + W_{ho}h_{t-1} + b_o\\right)',
    numeric: () => `o_t = ${num(o.value)}`,
    note: 'How much of the cell state to expose. The cell can hold something for fifty steps and show it on exactly one of them.',
  },
  {
    key: 'hidden',
    name: 'hidden state',
    lit: ['cout', 'ctanh', 'hmul', 'hout'],
    latex: 'h_t = o_t \\odot \\tanh(c_t)',
    numeric: () => `h_t = ${num(o.value)} \\times \\tanh(${num(lstm.value.c)}) = ${num(lstm.value.h)}`,
    note: 'What leaves the cell, and the only thing the next layer sees. c_t stays inside.',
  },
]

const GRU_STAGES: Stage[] = [
  {
    key: 'update',
    name: 'update gate',
    lit: ['z'],
    latex: 'z_t = \\sigma\\!\\left(W_{xz}x_t + W_{hz}h_{t-1} + b_z\\right)',
    numeric: () => `z_t = ${num(z.value)}`,
    note: 'One gate doing the LSTM’s forget and input jobs at once: whatever is not written is kept, by construction.',
  },
  {
    key: 'reset',
    name: 'reset gate',
    lit: ['r', 'cand'],
    latex: 'r_t = \\sigma\\!\\left(W_{xr}x_t + W_{hr}h_{t-1} + b_r\\right)',
    numeric: () => `r_t \\cdot h_{t-1} = ${num(r.value)} \\times ${num(hPrev.value)} = ${num(r.value * hPrev.value)}`,
    note: 'How much of the past the candidate is allowed to read. Drag it to 0: the candidate forgets the sentence so far and answers from this word alone.',
  },
  {
    key: 'candidate',
    name: 'candidate',
    lit: ['cand'],
    latex: '\\tilde{h}_t = \\tanh\\!\\left(W_{xh}x_t + W_{hh}(r_t \\odot h_{t-1}) + b_h\\right)',
    numeric: () => `\\tilde{h}_t = ${num(cand.value)}`,
    note: 'The proposed new state. Same shape as h — there is no second state vector in a GRU.',
  },
  {
    key: 'blend',
    name: 'new state',
    lit: ['kept', 'written', 'hnew'],
    latex: 'h_t = (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde{h}_t',
    numeric: () => `h_t = ${num(1 - z.value)} \\times ${num(hPrev.value)} + ${num(z.value)} \\times ${num(cand.value)} = ${num(gru.value.h)}`,
    note: 'A weighted blend of old and new, and the two weights always sum to 1. Set z to 0 and the state is frozen; set it to 1 and the past is gone.',
  },
]

const stages = computed(() => (props.variant === 'lstm' ? LSTM_STAGES : GRU_STAGES))

/** −1 is the overview: nothing dimmed, nothing claimed. */
const at = ref(-1)
watch(() => props.variant, () => { at.value = -1 })

const stage = computed(() => (at.value < 0 ? null : stages.value[at.value]))
const atEnd = computed(() => at.value >= stages.value.length - 1)

function step() {
  at.value = atEnd.value ? -1 : at.value + 1
}

const lit = (key: string) => (stage.value ? stage.value.lit.includes(key) : true)
const dim = (key: string) => (stage.value ? !stage.value.lit.includes(key) : false)

function cls(key: string) {
  return { 'is-dim': dim(key), 'is-lit': !!stage.value && lit(key) }
}

/* ---- LSTM circuit geometry ----------------------------------------------- */

const W = 580
const H = 272
const HIGHWAY = 46
const GATE_Y = 162
const GATE_W = 56
const GATE_H = 30
const BUS_Y = 236

const X_FMUL = 180
const X_PLUS = 300
const X_IGMUL = 300
const Y_IGMUL = 108
const X_BRANCH = 398
const X_CTANH = 398
const Y_CTANH = 120
const X_HMUL = 470
const X_SIGI = 262
const X_SIGG = 338
const X_SIGO = 470

const NODE_R = 13

/* ---- GRU bar chart geometry ---------------------------------------------- */

const BAR_X = 196
const BAR_W = 300
const BAR_MID = BAR_X + BAR_W / 2
/** A signed value in −1…1 becomes a bar growing from the centre line. */
const barX = (v: number) => (v >= 0 ? BAR_MID : BAR_MID + (v * BAR_W) / 2)
const barW = (v: number) => (Math.abs(v) * BAR_W) / 2

const GRU_ROWS = computed(() => [
  { key: 'hprev', label: 'h(t−1)', value: hPrev.value, tone: 'old' },
  { key: 'cand', label: 'candidate', value: cand.value, tone: 'new' },
  { key: 'kept', label: 'kept: (1−z)·h(t−1)', value: gru.value.kept, tone: 'old' },
  { key: 'written', label: 'written: z·candidate', value: gru.value.written, tone: 'new' },
  { key: 'hnew', label: 'h(t)', value: gru.value.h, tone: 'result' },
])

/** Rows 2–4 are the blend; the extra 16px is where its separator goes. */
const GRU_ROW_Y = (i: number) => 40 + i * 44 + (i >= 2 ? 16 : 0)
</script>

<template>
  <WidgetFrame max-width="40rem">
    <!-- The LSTM memory block, drawn as a circuit. -->
    <svg
      v-if="props.variant === 'lstm'"
      class="dl-gcell"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="An LSTM memory block: the cell state runs across the top through a multiply by the forget gate and an add of the input gate times the candidate; the hidden state leaves through the output gate"
    >
      <defs>
        <marker id="dl-gcell-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- The cell state: one straight line from edge to edge. -->
      <g class="dl-gcell__highway" :class="cls('cin')">
        <line :x1="26" :y1="HIGHWAY" :x2="X_FMUL - NODE_R" :y2="HIGHWAY" marker-end="url(#dl-gcell-arrow)" />
        <text class="dl-gcell__port" :x="22" :y="HIGHWAY + 4" text-anchor="end">c<tspan class="dl-gcell__sub" dy="3">t−1</tspan></text>
      </g>
      <line class="dl-gcell__highway-seg" :class="cls('fmul')" :x1="X_FMUL + NODE_R" :y1="HIGHWAY" :x2="X_PLUS - NODE_R" :y2="HIGHWAY" marker-end="url(#dl-gcell-arrow)" />
      <g class="dl-gcell__highway" :class="cls('cout')">
        <line :x1="X_PLUS + NODE_R" :y1="HIGHWAY" :x2="W - 60" :y2="HIGHWAY" marker-end="url(#dl-gcell-arrow)" />
        <text class="dl-gcell__port" :x="W - 54" :y="HIGHWAY + 4">c<tspan class="dl-gcell__sub" dy="3">t</tspan></text>
      </g>

      <!-- forget: × on the highway, fed by a sigmoid -->
      <g :class="cls('fmul')">
        <circle class="dl-gcell__node" :cx="X_FMUL" :cy="HIGHWAY" :r="NODE_R" />
        <text class="dl-gcell__op" :x="X_FMUL" :y="HIGHWAY + 5" text-anchor="middle">×</text>
      </g>
      <line class="dl-gcell__wire" :class="cls('fgate')" :x1="X_FMUL" :y1="GATE_Y" :x2="X_FMUL" :y2="HIGHWAY + NODE_R + 4" marker-end="url(#dl-gcell-arrow)" />
      <g :class="cls('fgate')">
        <rect class="dl-gcell__gate" :x="X_FMUL - GATE_W / 2" :y="GATE_Y" :width="GATE_W" :height="GATE_H" rx="5" />
        <text class="dl-gcell__gatelabel" :x="X_FMUL" :y="GATE_Y + 19" text-anchor="middle">σ = {{ num(f) }}</text>
        <text class="dl-gcell__gatename" :x="X_FMUL - 16" :y="GATE_Y - 5" text-anchor="end">f<tspan class="dl-gcell__sub" dy="3">t</tspan></text>
      </g>

      <!-- input × candidate, then + on to the highway -->
      <g :class="cls('igmul')">
        <circle class="dl-gcell__node" :cx="X_IGMUL" :cy="Y_IGMUL" :r="NODE_R" />
        <text class="dl-gcell__op" :x="X_IGMUL" :y="Y_IGMUL + 5" text-anchor="middle">×</text>
        <line class="dl-gcell__wire" :x1="X_IGMUL" :y1="Y_IGMUL - NODE_R" :x2="X_PLUS" :y2="HIGHWAY + NODE_R + 4" marker-end="url(#dl-gcell-arrow)" />
      </g>
      <line class="dl-gcell__wire" :class="cls('igate')" :x1="X_SIGI" :y1="GATE_Y" :x2="X_IGMUL - 9" :y2="Y_IGMUL + 9" marker-end="url(#dl-gcell-arrow)" />
      <line class="dl-gcell__wire" :class="cls('ggate')" :x1="X_SIGG" :y1="GATE_Y" :x2="X_IGMUL + 9" :y2="Y_IGMUL + 9" marker-end="url(#dl-gcell-arrow)" />

      <g :class="cls('igate')">
        <rect class="dl-gcell__gate" :x="X_SIGI - GATE_W / 2" :y="GATE_Y" :width="GATE_W" :height="GATE_H" rx="5" />
        <text class="dl-gcell__gatelabel" :x="X_SIGI" :y="GATE_Y + 19" text-anchor="middle">σ = {{ num(i) }}</text>
        <text class="dl-gcell__gatename" :x="X_SIGI - 16" :y="GATE_Y - 5" text-anchor="end">i<tspan class="dl-gcell__sub" dy="3">t</tspan></text>
      </g>
      <g :class="cls('ggate')">
        <rect class="dl-gcell__gate is-tanh" :x="X_SIGG - GATE_W / 2" :y="GATE_Y" :width="GATE_W" :height="GATE_H" rx="5" />
        <text class="dl-gcell__gatelabel" :x="X_SIGG" :y="GATE_Y + 19" text-anchor="middle">tanh = {{ num(g) }}</text>
        <text class="dl-gcell__gatename" :x="X_SIGG + 16" :y="GATE_Y - 5" text-anchor="start">c̃<tspan class="dl-gcell__sub" dy="3">t</tspan></text>
      </g>

      <g :class="cls('plus')">
        <circle class="dl-gcell__node is-plus" :cx="X_PLUS" :cy="HIGHWAY" :r="NODE_R" />
        <text class="dl-gcell__op" :x="X_PLUS" :y="HIGHWAY + 5" text-anchor="middle">+</text>
      </g>

      <!-- the branch that becomes h_t -->
      <g :class="cls('ctanh')">
        <line class="dl-gcell__wire" :x1="X_BRANCH" :y1="HIGHWAY" :x2="X_BRANCH" :y2="Y_CTANH - 15 - 4" marker-end="url(#dl-gcell-arrow)" />
        <rect class="dl-gcell__gate is-tanh" :x="X_CTANH - GATE_W / 2" :y="Y_CTANH - 15" :width="GATE_W" :height="GATE_H" rx="5" />
        <text class="dl-gcell__gatelabel" :x="X_CTANH" :y="Y_CTANH + 5" text-anchor="middle">tanh</text>
      </g>
      <g :class="cls('hmul')">
        <line class="dl-gcell__wire" :x1="X_CTANH + GATE_W / 2" :y1="Y_CTANH" :x2="X_HMUL - NODE_R - 4" :y2="Y_CTANH" marker-end="url(#dl-gcell-arrow)" />
        <circle class="dl-gcell__node" :cx="X_HMUL" :cy="Y_CTANH" :r="NODE_R" />
        <text class="dl-gcell__op" :x="X_HMUL" :y="Y_CTANH + 5" text-anchor="middle">×</text>
      </g>
      <line class="dl-gcell__wire" :class="cls('ogate')" :x1="X_SIGO" :y1="GATE_Y" :x2="X_SIGO" :y2="Y_CTANH + NODE_R + 4" marker-end="url(#dl-gcell-arrow)" />
      <g :class="cls('ogate')">
        <rect class="dl-gcell__gate" :x="X_SIGO - GATE_W / 2" :y="GATE_Y" :width="GATE_W" :height="GATE_H" rx="5" />
        <text class="dl-gcell__gatelabel" :x="X_SIGO" :y="GATE_Y + 19" text-anchor="middle">σ = {{ num(o) }}</text>
        <text class="dl-gcell__gatename" :x="X_SIGO - 16" :y="GATE_Y - 5" text-anchor="end">o<tspan class="dl-gcell__sub" dy="3">t</tspan></text>
      </g>
      <g :class="cls('hout')">
        <line class="dl-gcell__wire" :x1="X_HMUL + NODE_R" :y1="Y_CTANH" :x2="W - 60" :y2="Y_CTANH" marker-end="url(#dl-gcell-arrow)" />
        <text class="dl-gcell__port" :x="W - 54" :y="Y_CTANH + 4">h<tspan class="dl-gcell__sub" dy="3">t</tspan></text>
      </g>

      <!-- what every gate reads: this step's input and the last hidden state -->
      <g :class="cls('bus')">
        <rect class="dl-gcell__inbox" :x="20" :y="BUS_Y - 15" :width="112" :height="30" rx="5" />
        <text class="dl-gcell__inlabel" :x="76" :y="BUS_Y + 4" text-anchor="middle">x<tspan class="dl-gcell__sub" dy="3">t</tspan><tspan dy="-3">, h</tspan><tspan class="dl-gcell__sub" dy="3">t−1</tspan></text>
        <line class="dl-gcell__bus" :x1="132" :y1="BUS_Y" :x2="X_SIGO" :y2="BUS_Y" />
        <line
          v-for="x in [X_FMUL, X_SIGI, X_SIGG, X_SIGO]" :key="`stub${x}`"
          class="dl-gcell__wire" :x1="x" :y1="BUS_Y" :x2="x" :y2="GATE_Y + GATE_H + 4" marker-end="url(#dl-gcell-arrow)"
        />
      </g>

      <text class="dl-gcell__caption" :x="26" :y="HIGHWAY - 18">the cell state — a multiply and an add, nothing else</text>
    </svg>

    <!-- The GRU, as the interpolation it is. -->
    <svg
      v-else
      class="dl-gcell"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A GRU step shown as bars: the old state and the candidate, each scaled by the update gate, adding up to the new state"
    >
      <line class="dl-gcell__zero" :x1="BAR_MID" :y1="26" :x2="BAR_MID" :y2="H - 26" />
      <text class="dl-gcell__tick" :x="BAR_X" :y="20" text-anchor="middle">−1</text>
      <text class="dl-gcell__tick" :x="BAR_MID" :y="20" text-anchor="middle">0</text>
      <text class="dl-gcell__tick" :x="BAR_X + BAR_W" :y="20" text-anchor="middle">+1</text>

      <g v-for="(row, ri) in GRU_ROWS" :key="row.key" :class="cls(row.key)">
        <text class="dl-gcell__rowlabel" :x="BAR_X - 14" :y="GRU_ROW_Y(ri) + 14" text-anchor="end">{{ row.label }}</text>
        <rect class="dl-gcell__track" :x="BAR_X" :y="GRU_ROW_Y(ri)" :width="BAR_W" :height="20" rx="3" />
        <rect
          class="dl-gcell__bar" :class="`is-${row.tone}`"
          :x="barX(row.value)" :y="GRU_ROW_Y(ri)" :width="barW(row.value)" :height="20" rx="2"
        />
        <text class="dl-gcell__rowval" :x="BAR_X + BAR_W + 12" :y="GRU_ROW_Y(ri) + 14">{{ num(row.value) }}</text>
      </g>

      <line class="dl-gcell__sep" :x1="40" :y1="GRU_ROW_Y(2) - 14" :x2="BAR_X + BAR_W + 40" :y2="GRU_ROW_Y(2) - 14" />
      <text class="dl-gcell__caption" :x="40" :y="GRU_ROW_Y(2) - 20">the blend</text>
    </svg>

    <template #controls>
      <template v-if="props.variant === 'lstm'">
        <Slider v-model="cPrev" label="c(t−1)" :min="-1" :max="1" :step="0.05" />
        <Slider v-model="f" label="forget f" :min="0" :max="1" :step="0.05" />
        <Slider v-model="i" label="input i" :min="0" :max="1" :step="0.05" />
        <Slider v-model="g" label="candidate c̃" :min="-1" :max="1" :step="0.05" />
        <Slider v-model="o" label="output o" :min="0" :max="1" :step="0.05" />
      </template>
      <template v-else>
        <Slider v-model="hPrev" label="h(t−1)" :min="-1" :max="1" :step="0.05" />
        <Slider v-model="drive" label="input drive" :min="-2" :max="2" :step="0.1" :precision="1" />
        <Slider v-model="r" label="reset r" :min="0" :max="1" :step="0.05" />
        <Slider v-model="z" label="update z" :min="0" :max="1" :step="0.05" />
      </template>
      <StepButton :label="atEnd ? 'Start over' : (at < 0 ? 'Walk the cell' : 'Next part')" glyph="▸" @click="step" />
    </template>

    <template #readout>
      <template v-if="stage">
        <div class="dl-gcell__eq dl-math-sm">
          <Katex :expr="stage.latex" />
          <span class="dl-gcell__arrow">→</span>
          <Katex :expr="stage.numeric()" />
        </div>
        <div><strong>{{ stage.name }}.</strong> {{ stage.note }}</div>
      </template>
      <template v-else-if="props.variant === 'lstm'">
        c<sub>t</sub> = {{ num(f) }}×{{ num(cPrev) }} + {{ num(i) }}×{{ num(g) }} =
        <strong>{{ num(lstm.c) }}</strong>, and h<sub>t</sub> = <strong>{{ num(lstm.h) }}</strong>.
        Set <em>f</em> = 1 and <em>i</em> = 0: the cell state passes through untouched, for as many
        steps as you like. The gates here are set directly — in a real cell each is its own
        σ(Wx + Wh + b).
      </template>
      <template v-else>
        h<sub>t</sub> = {{ num(1 - z) }}×{{ num(hPrev) }} + {{ num(z) }}×{{ num(cand) }} =
        <strong>{{ num(gru.h) }}</strong>. Two gates instead of three, one state instead of two, and
        the kept and written shares always sum to 1 — so a GRU cannot forget without writing.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-gcell {
  width: 100%;
  height: 100%;
}

/* Dimming is how the walk points at things; it must not hide them. */
.is-dim {
  opacity: 0.2;
  transition: opacity 0.25s ease;
}

.is-lit {
  transition: opacity 0.25s ease;
}

.dl-gcell__highway line,
.dl-gcell__highway-seg {
  stroke: var(--dl-accent);
  stroke-width: 3;
  color: var(--dl-accent);
}

.dl-gcell__wire {
  stroke: var(--dl-muted);
  stroke-width: 1.5;
  color: var(--dl-muted);
}

.dl-gcell__bus {
  stroke: var(--dl-border);
  stroke-width: 2;
}

.dl-gcell__node {
  fill: var(--dl-bg);
  stroke: var(--dl-heading);
  stroke-width: 1.5;
}

.dl-gcell__node.is-plus {
  stroke: var(--dl-accent);
}

.dl-gcell__op {
  fill: var(--dl-heading);
  font-size: 14px;
  font-weight: 700;
}

.dl-gcell__gate {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 1.2;
}

.dl-gcell__gate.is-tanh {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
}

.dl-gcell__gatelabel {
  fill: var(--dl-heading);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dl-gcell__gatename {
  fill: var(--dl-heading);
  font-size: 12px;
  font-style: italic;
  font-weight: 600;
}

.dl-gcell__gateval {
  fill: var(--dl-accent-strong);
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dl-gcell__port {
  fill: var(--dl-heading);
  font-size: 13px;
  font-style: italic;
  font-weight: 600;
}

.dl-gcell__sub {
  font-size: 8.5px;
  font-style: normal;
  font-weight: 400;
}

.dl-gcell__inbox {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1;
}

.dl-gcell__inlabel {
  fill: var(--dl-heading);
  font-size: 12px;
  font-style: italic;
  font-weight: 600;
}

.dl-gcell__caption {
  fill: var(--dl-muted);
  font-size: 10.5px;
}

/* ---- GRU bars ---- */

.dl-gcell__zero {
  stroke: var(--dl-muted);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.dl-gcell__sep {
  stroke: var(--dl-border);
  stroke-width: 1;
}

.dl-gcell__tick {
  fill: var(--dl-muted);
  font-size: 10px;
}

.dl-gcell__track {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1;
}

.dl-gcell__bar {
  transition: x 0.15s ease, width 0.15s ease;
}

.dl-gcell__bar.is-old {
  fill: var(--dl-muted);
}

.dl-gcell__bar.is-new {
  fill: var(--dl-accent);
}

.dl-gcell__bar.is-result {
  fill: var(--dl-accent-strong);
}

.dl-gcell__rowlabel {
  fill: var(--dl-heading);
  font-size: 11.5px;
  font-weight: 600;
}

.dl-gcell__rowval {
  fill: var(--dl-body);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.dl-gcell__eq {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}

.dl-gcell__arrow {
  color: var(--dl-muted);
}
</style>
