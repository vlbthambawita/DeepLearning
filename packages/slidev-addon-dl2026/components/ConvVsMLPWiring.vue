<script setup lang="ts">
/*
 * The two ideas, as wiring — 2025 Lecture 03 slide 6.
 *
 * That slide made both claims in prose: "a single element of a feature map is
 * connected to only a small patch of pixels (compare with MLP)" and "the same
 * weights are used for different patches". The comparison it asks for was never
 * drawn, and the two ideas are independent — you can have local connections
 * that each carry their own weights, which is a real architecture and costs
 * three times what a convolution costs here.
 *
 * So there are three states rather than two, and the distinct-weight count is
 * on screen in all of them. Sparse connectivity cuts the number of *links*;
 * parameter sharing cuts the number of *weights*. Only doing both gets you a
 * convolution.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** Input pixels in the row. */
  inputs?: number
  kernel?: number
  start?: 'full' | 'local' | 'shared'
  width?: number
  height?: number
}>(), {
  inputs: 9,
  kernel: 3,
  start: 'full',
  width: 480,
  height: 190,
})

type Mode = 'full' | 'local' | 'shared'

const mode = ref<Mode>(props.start)
/** Which output unit is spotlit; null shows all of them at once. */
const focus = ref<number | null>(null)

const outCount = computed(() => (mode.value === 'full'
  ? props.inputs
  : props.inputs - props.kernel + 1))

const PAD = 34

function xAt(i: number, count: number) {
  if (count === 1)
    return props.width / 2
  return PAD + ((props.width - PAD * 2) * i) / (count - 1)
}

const inputXs = computed(() => Array.from({ length: props.inputs }, (_, i) => xAt(i, props.inputs)))
const outputXs = computed(() => Array.from({ length: outCount.value }, (_, i) => xAt(i, outCount.value)))

const Y_IN = 34
const Y_OUT = computed(() => props.height - 52)

interface Edge {
  from: number
  to: number
  /** Which distinct weight this link carries; only meaningful in shared mode. */
  tap: number
}

const edges = computed<Edge[]>(() => {
  const out: Edge[] = []
  for (let o = 0; o < outCount.value; o++) {
    if (mode.value === 'full') {
      for (let i = 0; i < props.inputs; i++)
        out.push({ from: i, to: o, tap: -1 })
    }
    else {
      for (let k = 0; k < props.kernel; k++)
        out.push({ from: o + k, to: o, tap: k })
    }
  }
  return out
})

const links = computed(() => edges.value.length)

const weights = computed(() => {
  if (mode.value === 'full')
    return props.inputs * outCount.value
  if (mode.value === 'local')
    return outCount.value * props.kernel
  return props.kernel
})

function isLit(e: Edge) {
  return focus.value === null || e.to === focus.value
}

function nextOutput() {
  focus.value = focus.value === null
    ? 0
    : (focus.value + 1 >= outCount.value ? null : focus.value + 1)
}

/** Changing mode changes how many outputs there are, so the spotlight resets. */
function setMode(next: Mode) {
  mode.value = next
  focus.value = null
}

const CAPTION: Record<Mode, string> = {
  full: 'Fully connected, as in last week\'s network: every output unit reads every pixel, and every one of those links is its own weight.',
  local: 'Sparse connectivity: each output reads a patch of three neighbouring pixels. Far fewer links — but each patch still has its own three weights, so the network must learn the same edge detector separately at every position.',
  shared: 'Parameter sharing on top: every patch uses the *same* three weights. Now there are three numbers to learn, and whatever they detect is detected everywhere. This is a convolution.',
}
</script>

<template>
  <WidgetFrame max-width="40rem">
    <svg
      class="dl-wiring"
      :viewBox="`0 0 ${props.width} ${props.height}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="CAPTION[mode]"
    >
      <text class="dl-wiring__side" :x="6" :y="Y_IN + 4">x</text>
      <text class="dl-wiring__side" :x="6" :y="Y_OUT + 4">y</text>

      <g class="dl-wiring__edges">
        <line
          v-for="(e, i) in edges"
          :key="`e${i}`"
          :x1="inputXs[e.from]" :y1="Y_IN + 9"
          :x2="outputXs[e.to]" :y2="Y_OUT - 9"
          :class="[
            mode === 'shared' ? `is-tap${e.tap}` : '',
            { 'is-dim': !isLit(e), 'is-shared': mode === 'shared' },
          ]"
        />
      </g>

      <g class="dl-wiring__units">
        <circle v-for="(x, i) in inputXs" :key="`i${i}`" :cx="x" :cy="Y_IN" r="9" class="is-input" />
        <circle
          v-for="(x, o) in outputXs"
          :key="`o${o}`"
          :cx="x" :cy="Y_OUT" r="9"
          class="is-output"
          :class="{ 'is-focus': focus === o, 'is-dim': focus !== null && focus !== o }"
          tabindex="0"
          role="button"
          :aria-label="`output unit ${o + 1}`"
          @click="focus = focus === o ? null : o"
          @keydown.enter.prevent="focus = focus === o ? null : o"
          @keydown.space.prevent="focus = focus === o ? null : o"
        />
      </g>
    </svg>

    <template #controls>
      <button
        v-for="m in (['full', 'local', 'shared'] as Mode[])"
        :key="m"
        type="button"
        class="dl-wiring__tab"
        :class="{ 'is-active': mode === m }"
        @click="setMode(m)"
      >{{ m === 'full' ? 'fully connected' : m === 'local' ? '+ sparse connectivity' : '+ parameter sharing' }}</button>
      <StepButton label="Next output" variant="ghost" glyph="▸" @click="nextOutput" />
    </template>

    <template #readout>
      <div class="dl-wiring__counts">
        <span><strong>{{ links }}</strong> links</span>
        <span><strong>{{ weights }}</strong> distinct weights</span>
      </div>
      <div>{{ CAPTION[mode] }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-wiring {
  width: 100%;
  height: 100%;
}

.dl-wiring__edges line {
  stroke: var(--dl-muted);
  stroke-width: 0.7;
  transition: stroke 0.2s ease, opacity 0.2s ease;
}

.dl-wiring__edges line.is-shared {
  stroke-width: 1.8;
}

/*
 * In shared mode the three weights are the subject, so they are the only thing
 * on the slide carrying colour. Derived from the accent so both themes hold.
 */
.dl-wiring__edges line.is-tap0 {
  stroke: var(--dl-accent);
}

.dl-wiring__edges line.is-tap1 {
  stroke: color-mix(in srgb, var(--dl-accent) 55%, var(--dl-heading));
}

.dl-wiring__edges line.is-tap2 {
  stroke: color-mix(in srgb, var(--dl-accent) 45%, var(--dl-danger));
}

.dl-wiring__edges line.is-dim {
  stroke: var(--dl-border);
  stroke-width: 0.5;
}

.dl-wiring__units circle {
  stroke-width: 1.2;
  transition: fill 0.2s ease, stroke 0.2s ease, opacity 0.2s ease;
}

.dl-wiring__units circle.is-input {
  fill: var(--dl-surface);
  stroke: var(--dl-heading);
}

.dl-wiring__units circle.is-output {
  fill: var(--dl-bg);
  stroke: var(--dl-accent);
  cursor: pointer;
}

.dl-wiring__units circle.is-output.is-focus {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dl-wiring__units circle.is-output.is-dim {
  opacity: 0.4;
}

.dl-wiring__units circle:focus-visible {
  outline: 2px solid var(--dl-accent);
}

.dl-wiring__side {
  fill: var(--dl-heading);
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
}

.dl-wiring__tab {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-wiring__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-wiring__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-wiring__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-wiring__counts {
  display: flex;
  gap: 1.6rem;
  margin-bottom: 0.25rem;
}

.dl-wiring__counts strong {
  color: var(--dl-accent);
  font-size: 1.05rem;
}
</style>
