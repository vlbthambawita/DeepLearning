<script setup lang="ts">
/*
 * Two questions the "All together" figure on 2025 Lecture 03 slide 22 raised and
 * did not answer.
 *
 * `mode="channels"`: what a filter actually is once the input has depth. The
 * figure showed C_in = 3 going to C_out = 5 with a Σ over the input channels and
 * a brace reading m₁ × m₂ × 3 × 5, which is correct and tells you nothing about
 * which weights produce which output. Stepping the output planes shows the
 * pairing: one filter, itself C_in deep, produces exactly one output plane.
 *
 * `mode="receptive-field"`: why anyone stacks 3×3 convolutions instead of using
 * one big kernel. Nothing in the 2025 deck asked this, and it is the reason
 * every architecture after 2014 looks the way it does.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  cIn?: number
  cOut?: number
  mode?: 'channels' | 'receptive-field'
  /** Kernel size for the receptive-field walk. */
  kernel?: number
  /** How many stacked layers the receptive-field walk may reach. */
  maxDepth?: number
}>(), {
  cIn: 3,
  cOut: 5,
  mode: 'channels',
  kernel: 3,
  maxDepth: 3,
})

/* ---- channels mode ------------------------------------------------------- */

/** Which output plane is in focus; null shows the whole layer. */
const plane = ref<number | null>(null)

function selectPlane(j: number) {
  plane.value = plane.value === j ? null : j
}

function nextPlane() {
  plane.value = plane.value === null ? 0 : (plane.value + 1) % props.cOut
}

/** Offset stacks: index 0 is drawn at the front, so later planes step up-right. */
function stackOffset(i: number, count: number) {
  const step = 7
  return { dx: (count - 1 - i) * step, dy: -(count - 1 - i) * step }
}

const kernelWeights = computed(() => props.kernel * props.kernel * props.cIn)
const layerWeights = computed(() => kernelWeights.value * props.cOut + props.cOut)

/* ---- receptive-field mode ------------------------------------------------ */

const depth = ref(1)

/** One 3×3 layer sees 3 pixels across; each further layer adds k − 1. */
const fieldWidth = computed(() => 1 + depth.value * (props.kernel - 1))
const gridWidth = computed(() => 1 + props.maxDepth * (props.kernel - 1))

/** The equivalent single kernel, and what each option costs in weights. */
const stackedCost = computed(() => depth.value * props.kernel * props.kernel)
const singleCost = computed(() => fieldWidth.value * fieldWidth.value)

function ringOf(r: number, c: number) {
  const centre = (gridWidth.value - 1) / 2
  const reach = Math.max(Math.abs(r - centre), Math.abs(c - centre))
  // Which stacked layer first brings this pixel into view.
  return Math.ceil(reach / ((props.kernel - 1) / 2))
}

const cells = computed(() =>
  Array.from({ length: gridWidth.value * gridWidth.value }, (_, i) => {
    const r = Math.floor(i / gridWidth.value)
    const c = i % gridWidth.value
    return { r, c, ring: ringOf(r, c) }
  }))
</script>

<template>
  <WidgetFrame :max-width="props.mode === 'channels' ? '46rem' : '34rem'">
    <!-- One filter, one output plane. -->
    <svg
      v-if="props.mode === 'channels'"
      class="dl-stack"
      viewBox="0 0 560 250"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`A convolution layer taking ${props.cIn} input channels to ${props.cOut} output channels`"
    >
      <!-- Input planes. -->
      <g class="dl-stack__planes">
        <rect
          v-for="i in props.cIn"
          :key="`in${i}`"
          :x="30 + stackOffset(i - 1, props.cIn).dx"
          :y="70 + stackOffset(i - 1, props.cIn).dy"
          width="82" height="82" rx="2"
        />
      </g>
      <text class="dl-stack__cap" x="71" y="176" text-anchor="middle">input</text>
      <text class="dl-stack__sub" x="71" y="194" text-anchor="middle">C<tspan class="dl-stack__sub2" dy="3">in</tspan><tspan dy="-3"> = {{ props.cIn }}</tspan></text>

      <!-- One kernel stack per output plane, C_in deep. -->
      <g
        v-for="j in props.cOut"
        :key="`k${j}`"
        class="dl-stack__filter"
        :class="{ 'is-focus': plane === j - 1, 'is-dim': plane !== null && plane !== j - 1 }"
        tabindex="0"
        role="button"
        :aria-label="`filter ${j}`"
        @click="selectPlane(j - 1)"
        @keydown.enter.prevent="selectPlane(j - 1)"
        @keydown.space.prevent="selectPlane(j - 1)"
      >
        <rect
          v-for="i in props.cIn"
          :key="`kk${i}`"
          :x="188 + (j - 1) * 32 + stackOffset(i - 1, props.cIn).dx * 0.5"
          :y="96 + stackOffset(i - 1, props.cIn).dy * 0.5"
          width="26" height="26" rx="2"
        />
      </g>
      <text class="dl-stack__cap" x="256" y="176" text-anchor="middle">{{ props.cOut }} filters</text>
      <text class="dl-stack__sub" x="256" y="192" text-anchor="middle">
        each {{ props.kernel }}×{{ props.kernel }}×{{ props.cIn }}
      </text>

      <text class="dl-stack__sigma" x="160" y="122" text-anchor="middle">Σ</text>
      <text class="dl-stack__sub" x="160" y="140" text-anchor="middle">over C<tspan class="dl-stack__sub2" dy="3">in</tspan></text>

      <!-- Output planes: one per filter. -->
      <g class="dl-stack__planes">
        <rect
          v-for="j in props.cOut"
          :key="`out${j}`"
          class="dl-stack__out"
          :class="{ 'is-focus': plane === j - 1, 'is-dim': plane !== null && plane !== j - 1 }"
          :x="404 + stackOffset(j - 1, props.cOut).dx"
          :y="76 + stackOffset(j - 1, props.cOut).dy"
          width="70" height="70" rx="2"
        />
      </g>
      <text class="dl-stack__cap" x="440" y="176" text-anchor="middle">output</text>
      <text class="dl-stack__sub" x="440" y="194" text-anchor="middle">C<tspan class="dl-stack__sub2" dy="3">out</tspan><tspan dy="-3"> = {{ props.cOut }}</tspan></text>

      <path v-if="plane !== null" class="dl-stack__link" :d="`M ${210 + plane * 32} 122 C 300 122, 340 111, 396 111`" />
    </svg>

    <!-- What a stack of small kernels can see. -->
    <div v-else class="dl-field">
      <div
        class="dl-field__grid"
        :style="{ gridTemplateColumns: `repeat(${gridWidth}, 1.5rem)` }"
        role="img"
        :aria-label="`Receptive field after ${depth} layers: ${fieldWidth} by ${fieldWidth} pixels`"
      >
        <span
          v-for="cell in cells"
          :key="`${cell.r}-${cell.c}`"
          class="dl-field__cell"
          :class="{ 'is-seen': cell.ring <= depth, 'is-centre': cell.ring === 0 }"
        />
      </div>
    </div>

    <template #controls>
      <template v-if="props.mode === 'channels'">
        <StepButton label="Next filter" glyph="▸" @click="nextPlane" />
        <StepButton label="Whole layer" variant="ghost" @click="plane = null" />
      </template>
      <template v-else>
        <Slider v-model="depth" label="stacked layers" :min="1" :max="props.maxDepth" :step="1" :precision="0" />
      </template>
    </template>

    <template #readout>
      <template v-if="props.mode === 'channels'">
        <template v-if="plane !== null">
          Filter {{ plane + 1 }} reads <strong>all {{ props.cIn }}</strong> input channels, sums the
          {{ props.cIn }} results, and writes <strong>one</strong> output plane. It holds
          {{ props.kernel }}×{{ props.kernel }}×{{ props.cIn }} = <strong>{{ kernelWeights }}</strong>
          weights plus one bias — and it is the same {{ kernelWeights }} weights at every position.
        </template>
        <template v-else>
          Depth in, depth out: the layer's weights are one tensor of shape
          {{ props.kernel }}×{{ props.kernel }}×{{ props.cIn }}×{{ props.cOut }}, which is
          <strong>{{ layerWeights.toLocaleString('en-US') }}</strong> numbers with the biases.
          Click a filter to see which output plane it owns.
        </template>
      </template>
      <template v-else>
        {{ depth }} stacked {{ props.kernel }}×{{ props.kernel }}
        {{ depth === 1 ? 'layer sees' : 'layers see' }}
        <strong>{{ fieldWidth }}×{{ fieldWidth }}</strong> pixels of the input — the same reach as one
        {{ fieldWidth }}×{{ fieldWidth }} kernel, for
        <strong>{{ stackedCost }}</strong> weights per channel pair instead of
        <strong>{{ singleCost }}</strong>, and with {{ depth }}
        {{ depth === 1 ? 'nonlinearity' : 'nonlinearities' }} instead of one.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-stack {
  width: 100%;
  height: 100%;
}

.dl-stack__planes rect {
  fill: var(--dl-surface);
  stroke: var(--dl-heading);
  stroke-width: 1;
}

.dl-stack__out {
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.dl-stack__out.is-focus {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2;
}

.dl-stack__out.is-dim,
.dl-stack__filter.is-dim {
  opacity: 0.35;
}

.dl-stack__filter rect {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 1;
  cursor: pointer;
}

.dl-stack__filter.is-focus rect {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
}

.dl-stack__filter:focus-visible {
  outline: 2px solid var(--dl-accent);
}

.dl-stack__link {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 1.6;
  stroke-dasharray: 4 3;
}

.dl-stack__cap {
  fill: var(--dl-heading);
  font-size: 12px;
  font-weight: 600;
}

.dl-stack__sub {
  fill: var(--dl-muted);
  font-size: 10.5px;
}

/*
 * Subscripts are a class, not a `font-size` attribute: UnoCSS attributify scans
 * the source text, so a literal `font-size="8"` anywhere in the project emits a
 * CSS rule that beats the SVG presentation attribute — the same trap as
 * `opacity`, and it renders the subscript at full size on top of its own text.
 */
.dl-stack__sub2 {
  font-size: 7.5px;
}

.dl-stack__sigma {
  fill: var(--dl-accent);
  font-size: 22px;
  font-weight: 700;
}

.dl-field {
  display: grid;
  place-items: center;
}

.dl-field__grid {
  display: grid;
  gap: 1px;
}

.dl-field__cell {
  aspect-ratio: 1;
  border: 1px solid var(--dl-border);
  background: var(--dl-bg);
  transition: background 0.25s ease, border-color 0.25s ease;
}

.dl-field__cell.is-seen {
  background: var(--dl-accent-soft);
  border-color: var(--dl-accent);
}

.dl-field__cell.is-centre {
  background: var(--dl-accent);
  border-color: var(--dl-accent-strong);
}
</style>
