<script setup lang="ts">
/*
 * The multilayer network from Lecture 02 slides 25 and 28.
 *
 * Slide 28 listed the learning procedure as three bullets — forward-propagate,
 * compute loss, backpropagate — over a diagram whose 26 arrows were static
 * vector paths. Stepping the phases makes the one thing the bullets cannot
 * convey visible: backpropagation walks the *same* graph in the opposite
 * direction, and the update only happens once the signal has reached the front.
 */
import { computed, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** Units per layer, input first. */
  layers?: number[]
  /** 'static' just draws the network; 'procedure' enables the phase walk. */
  mode?: 'static' | 'procedure'
  width?: number
  height?: number
  labels?: boolean
}>(), {
  layers: () => [4, 6, 5, 3],
  mode: 'procedure',
  width: 520,
  height: 300,
  labels: true,
})

type Phase = 'idle' | 'forward' | 'loss' | 'backward' | 'update'

const phase = ref<Phase>('idle')
const frontier = ref(0)
const timer = ref<number | null>(null)

const layerCount = computed(() => props.layers.length)

const nodes = computed(() => {
  const padX = 46
  const padY = 26
  const usableW = props.width - padX * 2
  const usableH = props.height - padY * 2

  return props.layers.map((count, li) => {
    const x = layerCount.value === 1 ? props.width / 2 : padX + (usableW * li) / (layerCount.value - 1)
    return Array.from({ length: count }, (_, ni) => ({
      x,
      // Centre each layer vertically so a 3-unit layer sits opposite the middle
      // of a 6-unit one, rather than both starting at the top.
      y: padY + usableH / 2 + (ni - (count - 1) / 2) * Math.min(usableH / Math.max(count - 1, 1), 40),
      layer: li,
      index: ni,
    }))
  })
})

const edges = computed(() => {
  const out: Array<{ x1: number, y1: number, x2: number, y2: number, from: number }> = []
  for (let li = 0; li < layerCount.value - 1; li++) {
    for (const a of nodes.value[li]) {
      for (const b of nodes.value[li + 1])
        out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, from: li })
    }
  }
  return out
})

/** Which layer boundary the signal is crossing right now, if any. */
const activeEdgeLayer = computed(() => {
  if (phase.value === 'forward')
    return frontier.value - 1
  if (phase.value === 'backward')
    return frontier.value
  return -1
})

function layerState(li: number): 'idle' | 'active' | 'done' | 'updating' {
  if (phase.value === 'update')
    return 'updating'
  if (phase.value === 'forward')
    return li < frontier.value ? 'done' : li === frontier.value ? 'active' : 'idle'
  if (phase.value === 'backward')
    return li > frontier.value ? 'done' : li === frontier.value ? 'active' : 'idle'
  if (phase.value === 'loss')
    return li === layerCount.value - 1 ? 'active' : 'done'
  return 'idle'
}

function stop() {
  if (timer.value !== null) {
    clearInterval(timer.value)
    timer.value = null
  }
}

onUnmounted(stop)

function reset() {
  stop()
  phase.value = 'idle'
  frontier.value = 0
}

/** One tick of the procedure; also what the manual "Step" button calls. */
function advance() {
  switch (phase.value) {
    case 'idle':
      phase.value = 'forward'
      frontier.value = 0
      break
    case 'forward':
      if (frontier.value < layerCount.value - 1)
        frontier.value++
      else
        phase.value = 'loss'
      break
    case 'loss':
      phase.value = 'backward'
      frontier.value = layerCount.value - 1
      break
    case 'backward':
      if (frontier.value > 0)
        frontier.value--
      else
        phase.value = 'update'
      break
    case 'update':
      reset()
      break
  }
}

function play() {
  stop()
  reset()
  advance()
  timer.value = window.setInterval(() => {
    advance()
    if (phase.value === 'idle')
      stop()
  }, 620)
}

const CAPTION: Record<Phase, string> = {
  idle: 'Ready. One pass = forward-propagate, compute the loss, backpropagate, then update.',
  forward: 'Forward-propagating the training patterns through the network.',
  loss: 'Comparing the output with the label to compute the loss.',
  backward: 'Backpropagating the loss — the same graph, walked in reverse.',
  update: 'Updating every weight and bias from its own partial derivative.',
}
</script>

<template>
  <WidgetFrame max-width="42rem">
    <svg
      class="dl-mlp"
      :viewBox="`0 0 ${props.width} ${props.height}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Multilayer neural network"
    >
      <g class="dl-mlp__edges">
        <line
          v-for="(e, i) in edges"
          :key="i"
          :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
          :class="{ 'is-active': e.from === activeEdgeLayer, 'is-reverse': phase === 'backward' }"
        />
      </g>

      <g class="dl-mlp__nodes">
        <template v-for="(layer, li) in nodes" :key="li">
          <circle
            v-for="n in layer"
            :key="`${li}-${n.index}`"
            :cx="n.x" :cy="n.y" r="8"
            :class="`is-${layerState(li)}`"
          />
        </template>
      </g>

      <g v-if="props.labels" class="dl-mlp__labels">
        <text v-for="(layer, li) in nodes" :key="`l${li}`" :x="layer[0].x" :y="props.height - 6" text-anchor="middle">
          {{ li === 0 ? 'input' : li === layerCount - 1 ? 'output' : `hidden ${li}` }}
        </text>
      </g>

      <g v-if="phase === 'loss'" class="dl-mlp__loss">
        <text :x="props.width - 14" :y="18" text-anchor="end">loss</text>
      </g>
    </svg>

    <template v-if="props.mode === 'procedure'" #controls>
      <StepButton label="Play a pass" glyph="▶" @click="play" />
      <StepButton label="Step" variant="ghost" @click="() => { stop(); advance() }" />
      <StepButton label="Reset" variant="ghost" @click="reset" />
    </template>

    <template v-if="props.mode === 'procedure'" #readout>
      <span :class="{ 'is-live': phase !== 'idle' }">{{ CAPTION[phase] }}</span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-mlp {
  width: 100%;
  height: 100%;
}

.dl-mlp__edges line {
  stroke: var(--dl-border);
  stroke-width: 1;
  transition: stroke 0.25s ease, stroke-width 0.25s ease;
}

.dl-mlp__edges line.is-active {
  stroke: var(--dl-accent);
  stroke-width: 1.8;
}

.dl-mlp__edges line.is-active.is-reverse {
  stroke: var(--dl-danger);
}

.dl-mlp__nodes circle {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.5;
  transition: fill 0.25s ease, stroke 0.25s ease;
}

.dl-mlp__nodes circle.is-done {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-mlp__nodes circle.is-active {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dl-mlp__nodes circle.is-updating {
  fill: var(--dl-heading);
  stroke: var(--dl-heading);
}

.dl-mlp__labels text {
  fill: var(--dl-muted);
  font-size: 11px;
}

.dl-mlp__loss text {
  fill: var(--dl-danger);
  font-size: 13px;
  font-weight: 600;
}

.is-live {
  color: var(--dl-body);
}
</style>
