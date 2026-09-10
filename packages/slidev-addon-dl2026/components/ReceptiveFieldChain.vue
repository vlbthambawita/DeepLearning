<script setup lang="ts">
/*
 * Where the receptive field actually comes from, drawn as the chain it is.
 *
 * `ConvStackDiagram mode="receptive-field"` shows the *area* one output unit
 * ends up seeing — a square growing on a grid. It never shows why the square
 * grows, and students accept "two 3×3 layers see 5×5" as a fact to memorise
 * rather than a thing they could have worked out. This draws the dependency
 * cone instead: one unit at the top, the three units feeding it one layer down,
 * the five feeding *those*, and so on to the input.
 *
 * Read bottom to top and it is a convolution stack. Read top to bottom and it is
 * the question "what can this one number possibly know about?"
 *
 * `mode="compare"` puts the stack beside the single kernel with the same reach,
 * which is the whole argument for 3×3 in one picture: same cone, fewer weights,
 * one nonlinearity per layer instead of one in total.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** Kernel width, odd. */
  kernel?: number
  /** Layers the slider may reach — also fixes the canvas, so the input row never moves. */
  maxDepth?: number
  /** Layers shown on arrival. */
  depth?: number
  mode?: 'chain' | 'compare'
  /** Channels used for the weight counts in compare mode. */
  channels?: number
}>(), {
  kernel: 3,
  maxDepth: 3,
  depth: 1,
  mode: 'chain',
  channels: 64,
})

const half = computed(() => (props.kernel - 1) / 2)

/** Two spare columns so the widest cone still has grid either side of it. */
const cols = computed(() => 1 + props.maxDepth * (props.kernel - 1) + 2)
const centre = computed(() => (cols.value - 1) / 2)

const depth = ref(Math.min(props.depth, props.maxDepth))
const shown = computed(() => (props.mode === 'compare' ? props.maxDepth : depth.value))

/* ---- geometry ------------------------------------------------------------ */

const CELL = 22
const PITCH = 26
const ROW = 54
const LEFT = 58
const RIGHT = 74
const TOP = 16

const gridWidth = computed(() => cols.value * PITCH)
const panelWidth = computed(() => LEFT + gridWidth.value + RIGHT)
const height = computed(() => TOP + props.maxDepth * ROW + CELL + 26)

function cellX(c: number) {
  return LEFT + c * PITCH + (PITCH - CELL) / 2
}

/**
 * Row 0 is the input and it never moves: it sits on the floor of the canvas,
 * whatever the depth. Adding a layer adds a row *above*, which is what a
 * network does — the picture it looks at stays where it is.
 */
function rowY(r: number) {
  return TOP + (props.maxDepth - r) * ROW
}

/** Cells of row `r` that the single top unit of a `d`-layer stack depends on. */
function seenAt(r: number, d: number) {
  return seenAtK(r, d, props.kernel)
}

function spanAt(r: number, d: number) {
  return 1 + (d - r) * (props.kernel - 1)
}

interface Edge { x1: number, y1: number, x2: number, y2: number }

/** One line per (unit, parent) pair, which is what makes the cone look like a cone. */
function edgesFor(d: number, kernel = props.kernel) {
  const h = (kernel - 1) / 2
  const out: Edge[] = []
  for (let r = d; r >= 1; r--) {
    for (const c of seenAtK(r, d, kernel)) {
      for (let p = c - h; p <= c + h; p++) {
        if (p < 0 || p > cols.value - 1)
          continue
        out.push({
          x1: cellX(c) + CELL / 2,
          y1: rowY(r) + CELL,
          x2: cellX(p) + CELL / 2,
          y2: rowY(r - 1),
        })
      }
    }
  }
  return out
}

/** seenAt, for an arbitrary kernel width — compare mode needs a wide one. */
function seenAtK(r: number, d: number, kernel: number) {
  const reach = ((kernel - 1) / 2) * (d - r)
  const from = Math.max(0, Math.ceil(centre.value - reach))
  const to = Math.min(cols.value - 1, Math.floor(centre.value + reach))
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

/* ---- the two panels in compare mode -------------------------------------- */

/** The single kernel that reaches as far as the whole stack. */
const bigKernel = computed(() => 1 + props.maxDepth * (props.kernel - 1))

const stackedWeights = computed(() => props.maxDepth * props.kernel * props.kernel)
const singleWeights = computed(() => bigKernel.value * bigKernel.value)

const c = computed(() => props.channels)
const stackedReal = computed(() => stackedWeights.value * c.value * c.value)
const singleReal = computed(() => singleWeights.value * c.value * c.value)
const saving = computed(() => Math.round((1 - stackedReal.value / singleReal.value) * 100))

const fmt = (n: number) => n.toLocaleString('en-US')

/* ---- chain-mode rows ----------------------------------------------------- */

const rows = computed(() =>
  Array.from({ length: shown.value + 1 }, (_, r) => ({
    r,
    y: rowY(r),
    seen: seenAt(r, shown.value),
    span: spanAt(r, shown.value),
    label: r === 0 ? 'input' : `conv ${r}`,
  })).reverse())

const isSeen = (r: number, col: number, d: number, kernel = props.kernel) =>
  seenAtK(r, d, kernel).includes(col)
</script>

<template>
  <WidgetFrame :max-width="props.mode === 'compare' ? '46rem' : '30rem'">
    <!-- One stack, one cone, stepped a layer at a time. -->
    <svg
      v-if="props.mode === 'chain'"
      class="dl-rfc"
      :viewBox="`0 0 ${panelWidth} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`After ${shown} layers of ${props.kernel}×${props.kernel}, one output unit depends on ${spanAt(0, shown)} input pixels`"
    >
      <g class="dl-rfc__edges">
        <line v-for="(e, i) in edgesFor(shown)" :key="`e${i}`" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" />
      </g>

      <g v-for="row in rows" :key="`r${row.r}`">
        <text class="dl-rfc__row" :x="LEFT - 10" :y="row.y + CELL * 0.72" text-anchor="end">{{ row.label }}</text>
        <rect
          v-for="col in cols"
          :key="`c${col}`"
          class="dl-rfc__cell"
          :class="{
            'is-seen': isSeen(row.r, col - 1, shown),
            'is-unit': row.r === shown && col - 1 === centre,
          }"
          :x="cellX(col - 1)" :y="row.y" :width="CELL" :height="CELL" rx="2"
        />
        <text class="dl-rfc__span" :x="LEFT + gridWidth + 10" :y="row.y + CELL * 0.72">
          {{ row.r === shown ? '1 unit' : `${row.span} wide` }}
        </text>
      </g>
    </svg>

    <!-- The stack, beside the one big kernel that reaches just as far. -->
    <svg
      v-else
      class="dl-rfc"
      :viewBox="`0 0 ${panelWidth * 2 + 20} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${props.maxDepth} layers of ${props.kernel}×${props.kernel} against one ${bigKernel}×${bigKernel} layer`"
    >
      <g>
        <text class="dl-rfc__title" :x="panelWidth / 2" :y="rowY(props.maxDepth) - 6" text-anchor="middle">
          {{ props.maxDepth }} × ({{ props.kernel }}×{{ props.kernel }})
        </text>
        <g class="dl-rfc__edges">
          <line v-for="(e, i) in edgesFor(props.maxDepth)" :key="`se${i}`" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" />
        </g>
        <g v-for="row in rows" :key="`sr${row.r}`">
          <text class="dl-rfc__row" :x="LEFT - 10" :y="row.y + CELL * 0.72" text-anchor="end">{{ row.label }}</text>
          <rect
            v-for="col in cols"
            :key="`sc${col}`"
            class="dl-rfc__cell"
            :class="{
              'is-seen': isSeen(row.r, col - 1, props.maxDepth),
              'is-unit': row.r === props.maxDepth && col - 1 === centre,
            }"
            :x="cellX(col - 1)" :y="row.y" :width="CELL" :height="CELL" rx="2"
          />
        </g>
        <text class="dl-rfc__foot" :x="panelWidth / 2" :y="height - 6" text-anchor="middle">
          {{ stackedWeights }} weights per channel pair · {{ props.maxDepth }} ReLUs
        </text>
      </g>

      <!-- Same cone at the input, reached in one hop. -->
      <g :transform="`translate(${panelWidth + 20}, 0)`">
        <text class="dl-rfc__title" :x="panelWidth / 2" :y="rowY(1) - 6" text-anchor="middle">
          1 × ({{ bigKernel }}×{{ bigKernel }})
        </text>
        <g class="dl-rfc__edges">
          <line v-for="(e, i) in edgesFor(1, bigKernel)" :key="`be${i}`" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" />
        </g>
        <g v-for="r in [1, 0]" :key="`br${r}`">
          <text class="dl-rfc__row" :x="LEFT - 10" :y="rowY(r) + CELL * 0.72" text-anchor="end">
            {{ r === 0 ? 'input' : 'conv 1' }}
          </text>
          <rect
            v-for="col in cols"
            :key="`bc${col}`"
            class="dl-rfc__cell"
            :class="{
              'is-seen': isSeen(r, col - 1, 1, bigKernel),
              'is-unit': r === 1 && col - 1 === centre,
            }"
            :x="cellX(col - 1)" :y="rowY(r)" :width="CELL" :height="CELL" rx="2"
          />
        </g>
        <text class="dl-rfc__foot" :x="panelWidth / 2" :y="height - 6" text-anchor="middle">
          {{ singleWeights }} weights per channel pair · 1 ReLU
        </text>
      </g>
    </svg>

    <template #controls>
      <Slider
        v-if="props.mode === 'chain'"
        v-model="depth" label="stacked layers" :min="1" :max="props.maxDepth" :step="1" :precision="0"
      />
    </template>

    <template #readout>
      <template v-if="props.mode === 'chain'">
        The unit at the top reads {{ props.kernel }} units of the row below it. Follow the lines all the
        way down: it depends on <strong>{{ spanAt(0, shown) }}</strong> input pixels.
        {{ shown }} {{ shown === 1 ? 'layer' : 'layers' }} of {{ props.kernel }} →
        1 + {{ shown }}×{{ props.kernel - 1 }} = <strong>{{ spanAt(0, shown) }}</strong>.
      </template>
      <template v-else>
        Identical reach. At {{ c }} channels in and out, the stack costs
        {{ stackedWeights }}·{{ c }}·{{ c }} = <strong>{{ fmt(stackedReal) }}</strong> weights against
        {{ singleWeights }}·{{ c }}·{{ c }} = <strong>{{ fmt(singleReal) }}</strong> — <strong>{{ saving }}%</strong>
        cheaper, and {{ props.maxDepth }} nonlinearities instead of 1.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-rfc {
  width: 100%;
  height: 100%;
}

/*
 * Hairlines, deliberately faint: there are dozens of them and they are meant to
 * read as one cone rather than as a wiring diagram. The colour is an rgb() with
 * an alpha rather than an `opacity` attribute — a literal opacity anywhere in
 * the project makes UnoCSS emit a rule that overrides SVG presentation
 * attributes (see CONTRIBUTING).
 */
.dl-rfc__edges line {
  stroke: rgb(0 151 167 / 0.38);
  stroke-width: 1;
}

:global(html.dark) .dl-rfc__edges line {
  stroke: rgb(46 201 216 / 0.4);
}

.dl-rfc__cell {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 1;
  transition: fill 0.25s ease, stroke 0.25s ease;
}

.dl-rfc__cell.is-seen {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-rfc__cell.is-unit {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
}

.dl-rfc__row {
  fill: var(--dl-body);
  font-size: 11px;
}

.dl-rfc__span {
  fill: var(--dl-muted);
  font-size: 10.5px;
}

.dl-rfc__title {
  fill: var(--dl-heading);
  font-size: 12px;
  font-weight: 600;
}

.dl-rfc__foot {
  fill: var(--dl-muted);
  font-size: 10.5px;
}
</style>
