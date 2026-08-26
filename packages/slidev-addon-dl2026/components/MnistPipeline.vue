<script setup lang="ts">
/*
 * Lecture 02's worked example: the MLP the students write from scratch this
 * week, drawn end to end.
 *
 * The 2025 slide used a screenshot of the textbook's figure. Redrawing it costs
 * a component and buys three things: it reads at projector size, it inherits the
 * deck's colours in both themes and in the PDF export, and every number on it
 * (784, 50, 10) can be traced back to a shape the students will actually type.
 *
 * The digit is rasterised from three strokes rather than shipped as a bitmap, so
 * the "28 x 28" claim on the slide is literally what is drawn.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Pixels along one side of the input image. */
  size?: number
  hidden?: number
  classes?: number
  /** The digit the diagram follows through the network. */
  label?: number
}>(), {
  size: 28,
  hidden: 50,
  classes: 10,
  label: 7,
})

const inputs = computed(() => props.size * props.size)

/* ---- the input image ----------------------------------------------------- */

/** Shortest distance from a point to a line segment. */
function distToSegment(px: number, py: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2))
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy))
}

/**
 * A hand-written 7: top bar, diagonal, and the continental cross-stroke. Drawn
 * inside the 20x20 box MNIST centres its digits in, with a soft edge so the
 * grid looks like sampled ink rather than like a vector shape.
 */
const STROKES: Array<[number, number, number, number]> = [
  [7.5, 7, 20, 7],
  [20, 7, 11, 22],
  [9.5, 15, 17, 15],
]

const pixels = computed(() => {
  const out: Array<{ x: number, y: number, v: number }> = []
  for (let y = 0; y < props.size; y++) {
    for (let x = 0; x < props.size; x++) {
      let best = Infinity
      for (const [x0, y0, x1, y1] of STROKES)
        best = Math.min(best, distToSegment(x + 0.5, y + 0.5, x0, y0, x1, y1))
      const v = Math.max(0, Math.min(1, 1.6 - best))
      if (v > 0.02)
        out.push({ x, y, v })
    }
  }
  return out
})

/* ---- geometry ------------------------------------------------------------ */

const W = 700
const H = 420

const TILE = { x: 24, y: 196, size: 96 }
const cell = computed(() => TILE.size / props.size)

/** The three column bars: 784 tall, 50 shorter, 10 shortest. */
const BARS = {
  input: { x: 196, y: 150, width: 14, height: 190 },
  hidden: { x: 312, y: 178, width: 14, height: 134 },
  output: { x: 424, y: 200, width: 14, height: 90 },
}

/** One row of the one-hot vector per class. */
const ONEHOT = { x: 150, y: 8, w: 20, cell: 9 }

const onehot = computed(() =>
  Array.from({ length: props.classes }, (_, i) => ({
    i,
    y: ONEHOT.y + i * ONEHOT.cell,
    on: i === props.label,
  })))
</script>

<template>
  <svg
    class="dl-mnist"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    :aria-label="`An MNIST image of ${props.label} reshaped to ${inputs} inputs, through a hidden layer of ${props.hidden} units to ${props.classes} outputs`"
  >
    <defs>
      <marker id="dl-mnist-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3.2" orient="auto">
        <path d="M0,0 L7,3.2 L0,6.4 z" class="dl-mnist__head" />
      </marker>
      <marker id="dl-mnist-arrow-fwd" markerWidth="8" markerHeight="8" refX="7" refY="3.2" orient="auto">
        <path d="M0,0 L7,3.2 L0,6.4 z" class="dl-mnist__head is-fwd" />
      </marker>
      <marker id="dl-mnist-arrow-back" markerWidth="8" markerHeight="8" refX="7" refY="3.2" orient="auto">
        <path d="M0,0 L7,3.2 L0,6.4 z" class="dl-mnist__head is-back" />
      </marker>
    </defs>

    <!-- The label path: 7 -> one-hot target vector. -->
    <g class="dl-mnist__label-path">
      <rect x="35" y="33" width="34" height="34" rx="3" class="dl-mnist__box" />
      <text x="52" y="57" text-anchor="middle" class="dl-mnist__digit">{{ props.label }}</text>
      <text x="52" y="86" text-anchor="middle" class="dl-mnist__cap">class label</text>

      <line x1="78" y1="50" x2="138" y2="50" marker-end="url(#dl-mnist-arrow)" class="dl-mnist__arrow" />
      <text x="108" y="41" text-anchor="middle" class="dl-mnist__op">encode</text>

      <g class="dl-mnist__onehot">
        <template v-for="row in onehot" :key="row.i">
          <rect :x="ONEHOT.x" :y="row.y" :width="ONEHOT.w" :height="ONEHOT.cell" :class="{ 'is-on': row.on }" />
          <text :x="ONEHOT.x + ONEHOT.w / 2" :y="row.y + ONEHOT.cell - 2.2" text-anchor="middle" :class="{ 'is-on': row.on }">
            {{ row.on ? 1 : 0 }}
          </text>
          <text :x="ONEHOT.x - 4" :y="row.y + ONEHOT.cell - 2.2" text-anchor="end" class="dl-mnist__idx">{{ row.i }}</text>
        </template>
      </g>
      <text x="178" y="46" class="dl-mnist__cap">one-hot target,</text>
      <text x="178" y="60" class="dl-mnist__cap">{{ props.classes }} entries</text>
    </g>

    <!-- The two directions the same graph is walked in. -->
    <line x1="440" y1="118" x2="176" y2="118" marker-end="url(#dl-mnist-arrow-back)" class="dl-mnist__arrow is-back" />
    <text x="308" y="110" text-anchor="middle" class="dl-mnist__code is-back">.backward() — loss back to every weight</text>

    <line x1="196" y1="392" x2="440" y2="392" marker-end="url(#dl-mnist-arrow-fwd)" class="dl-mnist__arrow is-fwd" />
    <text x="318" y="408" text-anchor="middle" class="dl-mnist__code">.forward() — image to probabilities</text>

    <!-- The data path: image -> 784 -> 50 -> 10. -->
    <g class="dl-mnist__tile">
      <rect :x="TILE.x" :y="TILE.y" :width="TILE.size" :height="TILE.size" class="dl-mnist__box" />
      <rect
        v-for="(p, i) in pixels"
        :key="i"
        :x="TILE.x + p.x * cell"
        :y="TILE.y + p.y * cell"
        :width="cell + 0.4"
        :height="cell + 0.4"
        class="dl-mnist__ink"
        :style="{ opacity: p.v }"
      />
    </g>
    <text :x="TILE.x + TILE.size / 2" y="312" text-anchor="middle" class="dl-mnist__cap">
      {{ props.size }} × {{ props.size }} greyscale image
    </text>

    <line x1="128" y1="244" x2="182" y2="244" marker-end="url(#dl-mnist-arrow)" class="dl-mnist__arrow" />
    <text x="155" y="234" text-anchor="middle" class="dl-mnist__op">reshape</text>

    <rect v-bind="BARS.input" class="dl-mnist__bar" />
    <text :x="BARS.input.x + 7" y="356" text-anchor="middle" class="dl-mnist__cap">{{ inputs }} inputs</text>
    <text :x="BARS.input.x + 7" y="370" text-anchor="middle" class="dl-mnist__sub">one per pixel</text>

    <line x1="218" y1="244" x2="298" y2="244" marker-end="url(#dl-mnist-arrow)" class="dl-mnist__arrow" />
    <text x="258" y="222" text-anchor="middle" class="dl-mnist__op">net input</text>
    <text x="258" y="234" text-anchor="middle" class="dl-mnist__op">+ sigmoid</text>

    <rect v-bind="BARS.hidden" class="dl-mnist__bar is-live" />
    <text :x="BARS.hidden.x + 7" y="356" text-anchor="middle" class="dl-mnist__cap">hidden layer</text>
    <text :x="BARS.hidden.x + 7" y="370" text-anchor="middle" class="dl-mnist__sub">{{ props.hidden }} units</text>

    <line x1="330" y1="244" x2="410" y2="244" marker-end="url(#dl-mnist-arrow)" class="dl-mnist__arrow" />
    <text x="370" y="222" text-anchor="middle" class="dl-mnist__op">net input</text>
    <text x="370" y="234" text-anchor="middle" class="dl-mnist__op">+ sigmoid</text>

    <rect v-bind="BARS.output" class="dl-mnist__bar is-live" />
    <text :x="BARS.output.x + 7" y="356" text-anchor="middle" class="dl-mnist__cap">output layer</text>
    <text :x="BARS.output.x + 7" y="370" text-anchor="middle" class="dl-mnist__sub">{{ props.classes }} units</text>

    <line x1="440" y1="208" x2="492" y2="178" class="dl-mnist__leader" />
    <text x="498" y="170" class="dl-mnist__cap">class-membership</text>
    <text x="498" y="184" class="dl-mnist__cap">probabilities</text>
    <text x="498" y="202" class="dl-mnist__sub">compared with the one-hot</text>
    <text x="498" y="214" class="dl-mnist__sub">target to give the loss</text>

    <text x="498" y="248" class="dl-mnist__count">
      {{ (inputs * props.hidden + props.hidden * props.classes).toLocaleString() }} weights
    </text>
    <text x="498" y="262" class="dl-mnist__sub">
      + {{ (props.hidden + props.classes).toLocaleString() }} biases — every one of them learned
    </text>
  </svg>
</template>

<style scoped>
.dl-mnist {
  width: 100%;
  height: 100%;
}

.dl-mnist__box {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1.2;
}

.dl-mnist__ink {
  fill: var(--dl-heading);
}

.dl-mnist__digit {
  fill: var(--dl-heading);
  font-size: 20px;
}

.dl-mnist__bar {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.2;
}

.dl-mnist__bar.is-live {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dl-mnist__arrow,
.dl-mnist__leader {
  stroke: var(--dl-muted);
  stroke-width: 1.2;
  fill: none;
}

.dl-mnist__leader {
  stroke-dasharray: 3 3;
}

.dl-mnist__head {
  fill: var(--dl-muted);
}

.dl-mnist__head.is-fwd {
  fill: var(--dl-accent);
}

.dl-mnist__head.is-back {
  fill: var(--dl-danger);
}

.dl-mnist__cap {
  fill: var(--dl-body);
  font-size: 11px;
}

.dl-mnist__sub,
.dl-mnist__idx {
  fill: var(--dl-muted);
  font-size: 9px;
}

.dl-mnist__op {
  fill: var(--dl-muted);
  font-size: 10px;
}

.dl-mnist__count {
  fill: var(--dl-heading);
  font-size: 11px;
  font-weight: 600;
}

.dl-mnist__code {
  fill: var(--dl-accent-strong);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
}

.dl-mnist__code.is-back {
  fill: var(--dl-danger);
}

.dl-mnist__arrow.is-back {
  stroke: var(--dl-danger);
  stroke-dasharray: 5 3;
}

.dl-mnist__arrow.is-fwd {
  stroke: var(--dl-accent);
}

.dl-mnist__onehot rect {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1;
}

.dl-mnist__onehot rect.is-on {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-mnist__onehot text {
  fill: var(--dl-body);
  font-size: 7px;
}

.dl-mnist__onehot text.is-on {
  fill: var(--dl-accent-strong);
  font-weight: 700;
}
</style>
