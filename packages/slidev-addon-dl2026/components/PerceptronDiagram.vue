<script setup lang="ts">
/*
 * Lecture 02 slide 12 — the perceptron, whole, with the error loop closed.
 *
 * The learning rule is stated on this slide as two lines of algebra, and the
 * 2025 deck showed it next to a forward-only schematic: inputs, weights, sum,
 * step, output. That drawing stops exactly where the lecture starts, because it
 * never shows the comparison against y or the path the error takes back to the
 * weights — the part the rule is about.
 *
 * So the diagram here is the complete loop, and it computes. Set the inputs and
 * the true label, read z, ŷ and the error off the diagram, and press Apply
 * update to watch the weights actually move by Δwⱼ = η(y − ŷ)xⱼ. The two cases
 * the next slides work through by hand — correct prediction, wrong prediction —
 * are reachable by moving one control.
 *
 * PerceptronPlayground on the neighbouring slides shows the same rule as
 * geometry; this one shows it as dataflow. They are deliberately different
 * views of one thing.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** Recap use: same diagram, no controls, so it reads as a summary figure. */
  static?: boolean
}>(), { static: false })

const START = { w1: 0.4, w2: -0.3, b: -0.2 }

const x1 = ref(2.0)
const x2 = ref(1.5)
/** The true label for the example currently on the inputs. */
const target = ref<0 | 1>(1)
const eta = ref(0.1)

const w1 = ref(START.w1)
const w2 = ref(START.w2)
const b = ref(START.b)
const applied = ref(0)

const z = computed(() => w1.value * x1.value + w2.value * x2.value + b.value)
const yHat = computed<0 | 1>(() => (z.value >= 0 ? 1 : 0))
const error = computed(() => target.value - yHat.value)
const correct = computed(() => error.value === 0)

const dw1 = computed(() => eta.value * error.value * x1.value)
const dw2 = computed(() => eta.value * error.value * x2.value)
const db = computed(() => eta.value * error.value)

function apply() {
  /*
   * Snapshot first. dw1/dw2/db are computed from `error`, and `error` depends on
   * w1 — so writing w1 before reading dw2 recomputes the prediction mid-update,
   * collapses the error to zero and silently leaves w2 and b untouched. The
   * rule updates every parameter from one error, not from three.
   */
  const [d1, d2, d0] = [dw1.value, dw2.value, db.value]
  w1.value += d1
  w2.value += d2
  b.value += d0
  applied.value++
}

function reset() {
  w1.value = START.w1
  w2.value = START.w2
  b.value = START.b
  applied.value = 0
}

const n = (v: number, p = 2) => v.toFixed(p)
/** "+0.20" rather than "0.20", so a correction reads as a signed change —
 *  except for an exact zero, which "+0.00" only makes harder to read. */
const signed = (v: number, p = 2) => (v === 0 ? v.toFixed(p) : v > 0 ? `+${v.toFixed(p)}` : v.toFixed(p))

/*
 * `lx`/`ly` place each weight label in the gap above its own edge. The three
 * edges converge on Σ, so the free space narrows from left to right: near the
 * inputs there is room for all three labels, further along there is not.
 */
const inputs = computed(() => [
  { y: 66, sym: 'x₁', val: n(x1.value, 1), w: 'w₁', wv: n(w1.value), lx: 90, ly: 64 },
  { y: 112, sym: 'x₂', val: n(x2.value, 1), w: 'w₂', wv: n(w2.value), lx: 90, ly: 107 },
  { y: 158, sym: '1', val: '', w: 'b', wv: n(b.value), lx: 90, ly: 134 },
])
</script>

<template>
  <WidgetFrame max-width="54rem">
    <svg viewBox="0 0 660 268" class="dl-pd" role="img"
      aria-label="A perceptron: inputs, weights, summation, unit step, prediction, comparison with the true label, and the error feeding back into the weights">
      <defs>
        <marker id="dl-pd-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--dl-muted)" />
        </marker>
        <marker id="dl-pd-tip-err" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--dl-danger)" />
        </marker>
      </defs>

      <!-- inputs and the weighted edges -->
      <g v-for="i in inputs" :key="i.sym">
        <circle cx="42" :cy="i.y" r="18" class="node" />
        <text x="42" :y="i.val ? i.y - 2 : i.y + 5" class="sym">{{ i.sym }}</text>
        <text v-if="i.val" x="42" :y="i.y + 13" class="sym is-small">{{ i.val }}</text>
        <line x1="60" :y1="i.y" x2="184" y2="112" class="edge" marker-end="url(#dl-pd-tip)" />
        <text :x="i.lx" :y="i.ly" class="wname">{{ i.w }} = <tspan class="is-w">{{ i.wv }}</tspan></text>
      </g>

      <!-- net input -->
      <circle cx="206" cy="112" r="24" class="node is-op" />
      <text x="206" y="120" class="sym is-big">Σ</text>
      <text x="206" y="152" class="cap">net input</text>
      <line x1="230" y1="112" x2="292" y2="112" class="edge" marker-end="url(#dl-pd-tip)" />
      <text x="261" y="102" class="num">z = {{ n(z) }}</text>

      <!-- activation -->
      <circle cx="316" cy="112" r="24" class="node is-op" />
      <path d="M302,120 L316,120 L316,102 L330,102" class="glyph" />
      <text x="316" y="152" class="cap">unit step</text>
      <line x1="340" y1="112" x2="402" y2="112" class="edge" marker-end="url(#dl-pd-tip)" />

      <!-- prediction -->
      <circle cx="426" cy="112" r="22" class="node" :class="{ 'is-fire': yHat === 1 }" />
      <text x="426" y="108" class="sym" :class="{ 'is-inverted': yHat === 1 }">ŷ</text>
      <text x="426" y="123" class="sym is-small" :class="{ 'is-inverted': yHat === 1 }">{{ yHat }}</text>
      <text x="426" y="152" class="cap">prediction</text>
      <line x1="448" y1="112" x2="504" y2="112" class="edge" marker-end="url(#dl-pd-tip)" />

      <!-- the true label, and the comparison -->
      <circle cx="528" cy="42" r="20" class="node is-truth" />
      <text x="528" y="39" class="sym">y</text>
      <text x="528" y="54" class="sym is-small">{{ target }}</text>
      <text x="528" y="20" class="cap">true label</text>
      <line x1="528" y1="62" x2="528" y2="88" class="edge is-err" marker-end="url(#dl-pd-tip-err)" />

      <circle cx="528" cy="112" r="22" class="node is-compare" />
      <text x="528" y="119" class="sym is-err">−</text>
      <text x="528" y="152" class="cap is-err">compare</text>

      <!-- the error, back to the weights -->
      <path
        d="M528,134 L528,214 L146,214 L146,134"
        class="edge is-err"
        fill="none"
        marker-end="url(#dl-pd-tip-err)"
      />
      <text x="340" y="236" class="err-lbl" text-anchor="middle">
        error <tspan class="is-mono">e = y − ŷ = {{ signed(error, 0) }}</tspan>
        · update <tspan class="is-mono">Δwⱼ = η e xⱼ</tspan>, <tspan class="is-mono">Δb = η e</tspan>
      </text>
    </svg>

    <template v-if="!props.static" #controls>
      <Slider v-model="x1" label="x₁" :min="0" :max="5" :step="0.1" :precision="1" class="dl-pd__s" />
      <Slider v-model="x2" label="x₂" :min="0" :max="5" :step="0.1" :precision="1" class="dl-pd__s" />
      <Slider v-model="eta" label="η" :min="0.01" :max="0.5" :step="0.01" class="dl-pd__s" />
      <label class="dl-pd__toggle">
        <input v-model="target" type="checkbox" :true-value="1" :false-value="0">
        true label y = 1
      </label>
      <StepButton label="Apply update" glyph="↺" :disabled="correct" @click="apply" />
      <StepButton label="Reset weights" variant="ghost" @click="reset" />
    </template>

    <template v-if="!props.static" #readout>
      <div v-if="correct" class="dl-pd__verdict">
        <strong>Prediction correct</strong> — <Katex :expr="`y = \\hat{y} = ${target}`" />, so
        <Katex expr="e = 0" /> and every update is zero. The rule learns only from its mistakes.
      </div>
      <div v-else class="dl-pd__verdict is-err">
        <strong>Prediction wrong</strong> —
        <Katex :expr="`\\Delta w_1 = ${n(eta)}\\cdot(${error})\\cdot${n(x1, 1)} = ${signed(dw1)}`" />,
        <Katex :expr="`\\Delta w_2 = ${signed(dw2)}`" />,
        <Katex :expr="`\\Delta b = ${signed(db)}`" />
        <span class="dl-pd__hint">&#32;— no <Katex expr="x" /> in the bias update.</span>
      </div>
      <div class="dl-pd__state">
        <Katex :expr="`w_1 = ${n(w1)},\\; w_2 = ${n(w2)},\\; b = ${n(b)}`" />
        · {{ applied }} update{{ applied === 1 ? '' : 's' }} applied
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-pd {
  width: 100%;
  height: 100%;
}

.node {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.node.is-op {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.node.is-fire {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.node.is-truth,
.node.is-compare {
  stroke: var(--dl-danger);
}

.edge {
  stroke: var(--dl-muted);
  stroke-width: 1.5;
  fill: none;
}

.edge.is-err {
  stroke: var(--dl-danger);
  stroke-dasharray: 5 4;
}

.glyph {
  fill: none;
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sym {
  fill: var(--dl-heading);
  font-size: 13px;
  text-anchor: middle;
  pointer-events: none;
}

.sym.is-big {
  font-size: 20px;
}

.sym.is-small {
  font-size: 11px;
  fill: var(--dl-muted);
}

.sym.is-err {
  fill: var(--dl-danger);
  font-size: 18px;
}

/* ŷ's node turns solid when the neuron fires, so its label inverts with it. */
.sym.is-inverted,
.sym.is-small.is-inverted {
  fill: #fff;
}

.num {
  fill: var(--dl-heading);
  font-size: 11px;
  text-anchor: middle;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.wname {
  fill: var(--dl-muted);
  font-size: 11px;
  text-anchor: middle;
}

.wname .is-w {
  fill: var(--dl-accent-strong);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cap {
  fill: var(--dl-muted);
  font-size: 9.5px;
  text-anchor: middle;
  letter-spacing: 0.04em;
  /* Keep Greek out of these: uppercasing turns a lowercase sigma into a
     summation sign, which is the one symbol this diagram must not confuse. */
  text-transform: uppercase;
}

.cap.is-err {
  fill: var(--dl-danger);
}

.err-lbl {
  fill: var(--dl-danger);
  font-size: 11px;
}

.err-lbl .is-mono {
  fill: var(--dl-heading);
  font-variant-numeric: tabular-nums;
}

.dl-pd__s {
  min-width: 7.5rem;
}

.dl-pd__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.dl-pd__toggle input {
  accent-color: var(--dl-danger);
}

.dl-pd__verdict.is-err {
  color: var(--dl-danger);
}

.dl-pd__hint {
  color: var(--dl-muted);
}

.dl-pd__state {
  margin-top: 0.15rem;
}
</style>
