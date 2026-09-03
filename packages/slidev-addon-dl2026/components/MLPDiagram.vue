<script setup lang="ts">
/*
 * The multilayer network from Lecture 02 slides 25 and 28.
 *
 * Slide 28 listed the learning procedure as three bullets — forward-propagate,
 * compute loss, backpropagate — over a diagram whose 26 arrows were static
 * vector paths. Stepping the phases makes the one thing the bullets cannot
 * convey visible: backpropagation walks the *same* graph in the opposite
 * direction, and the update only happens once the signal has reached the front.
 *
 * `mode="dropout"` is Lecture 04 slide 37, where the same picture answers a
 * different question: what `nn.Dropout(0.5)` does to it. The 2025 CNN deck gave
 * dropout one slide of two static networks side by side, so the thing students
 * actually get wrong — that the two pictures are the *same* network in two
 * modes, and which one `model.eval()` selects — was left implicit. Here it is
 * one network with a switch, and the mask is reseeded on demand so the room can
 * see that "half the units" is a different half every batch.
 *
 * `mode="links"` answers the other question the picture kept dodging: what the
 * lines actually are. Every unit is selectable, and selecting one names the
 * links that feed it — one weight per incoming edge, plus its own bias — beside
 * the net input they add up to. That is the whole content of a layer, and it is
 * the same content whether the layer has three units or three thousand.
 */
import { computed, onUnmounted, ref } from 'vue'
import { seededRandom } from '../composables/useRandom'

const props = withDefaults(defineProps<{
  /** Units per layer, input first. */
  layers?: number[]
  /**
   * 'static' just draws the network; 'procedure' enables the phase walk;
   * 'links' labels the units and lets one be selected to expose its inputs;
   * 'dropout' masks hidden units under a train/eval switch.
   */
  mode?: 'static' | 'procedure' | 'links' | 'dropout'
  width?: number
  height?: number
  labels?: boolean
  /** Dropout probability, for mode="dropout". */
  p?: number
  seed?: number
}>(), {
  layers: () => [4, 6, 5, 3],
  mode: 'procedure',
  width: 520,
  height: 300,
  labels: true,
  p: 0.5,
  seed: 7,
})

type Phase = 'idle' | 'forward' | 'loss' | 'backward' | 'update'

const phase = ref<Phase>('idle')
const frontier = ref(0)
const timer = ref<number | null>(null)

const isLinks = computed(() => props.mode === 'links')
const isDropout = computed(() => props.mode === 'dropout')
const layerCount = computed(() => props.layers.length)

/** Units are large enough to hold their own name only in the links diagram. */
const R = computed(() => (isLinks.value ? 15 : 8))

const nodes = computed(() => {
  const padX = isLinks.value ? 62 : 46
  const padTop = isLinks.value ? 64 : 26
  const padBottom = isLinks.value ? 40 : 26
  const usableW = props.width - padX * 2
  const usableH = props.height - padTop - padBottom
  const maxGap = isLinks.value ? 54 : 40

  return props.layers.map((count, li) => {
    const x = layerCount.value === 1 ? props.width / 2 : padX + (usableW * li) / (layerCount.value - 1)
    return Array.from({ length: count }, (_, ni) => ({
      x,
      // Centre each layer vertically so a 3-unit layer sits opposite the middle
      // of a 6-unit one, rather than both starting at the top.
      y: padTop + usableH / 2 + (ni - (count - 1) / 2) * Math.min(usableH / Math.max(count - 1, 1), maxGap),
      layer: li,
      index: ni,
    }))
  })
})

/** `in`, `h` (or `h1`, `h2`, …) and `out` — the superscript on every symbol. */
function layerTag(li: number) {
  if (li === 0)
    return 'in'
  if (li === layerCount.value - 1)
    return 'out'
  return layerCount.value === 3 ? 'h' : `h${li}`
}

/** The name written inside a unit: x for an input, a for anything computed. */
function unitName(li: number) {
  return li === 0 ? 'x' : 'a'
}

/**
 * One bias unit per computed layer, sitting above and just left of the layer it
 * feeds — the position the textbook figure uses, and far enough off the column
 * that its own links stay readable.
 */
const biases = computed(() => {
  if (!isLinks.value)
    return []
  const gap = layerCount.value > 1 ? nodes.value[1][0].x - nodes.value[0][0].x : 0
  return props.layers.slice(1).map((_, i) => {
    const li = i + 1
    return { x: nodes.value[li][0].x - gap * 0.3, y: 24, layer: li }
  })
})

/** Stop an edge short of both units so an arrowhead has somewhere to land. */
function trim(x1: number, y1: number, x2: number, y2: number, headRoom: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return {
    x1: x1 + ux * R.value,
    y1: y1 + uy * R.value,
    x2: x2 - ux * (R.value + headRoom),
    y2: y2 - uy * (R.value + headRoom),
  }
}

const edges = computed(() => {
  const headRoom = isLinks.value ? 5 : 0
  const out: Array<{
    x1: number, y1: number, x2: number, y2: number
    from: number, fromIndex: number, toIndex: number, bias: boolean
  }> = []

  for (let li = 0; li < layerCount.value - 1; li++) {
    for (const a of nodes.value[li]) {
      for (const b of nodes.value[li + 1]) {
        out.push({
          ...trim(a.x, a.y, b.x, b.y, headRoom),
          from: li,
          fromIndex: a.index,
          toIndex: b.index,
          bias: false,
        })
      }
    }
  }

  for (const bias of biases.value) {
    for (const b of nodes.value[bias.layer]) {
      out.push({
        ...trim(bias.x, bias.y, b.x, b.y, headRoom),
        from: bias.layer - 1,
        fromIndex: -1,
        toIndex: b.index,
        bias: true,
      })
    }
  }

  return out
})

/* ---- links mode: one unit at a time ------------------------------------- */

/** The selected unit, as a flat position in the list of *computed* units. */
const selected = ref<number | null>(null)

/** Every unit that has inputs — i.e. everything but the input layer. */
const computedUnits = computed(() =>
  nodes.value.slice(1).flat().map(n => ({ layer: n.layer, index: n.index })))

const focus = computed(() => (selected.value === null ? null : computedUnits.value[selected.value]))

function selectUnit(layer: number, index: number) {
  const at = computedUnits.value.findIndex(u => u.layer === layer && u.index === index)
  selected.value = at === -1 || at === selected.value ? null : at
}

function nextUnit() {
  selected.value = selected.value === null
    ? 0
    : (selected.value + 1) % computedUnits.value.length
}

function isIncoming(e: { from: number, toIndex: number }) {
  return focus.value !== null && e.from === focus.value.layer - 1 && e.toIndex === focus.value.index
}

/** Where a weight label sits: near the target, where the fan is widest. */
function labelAt(e: { x1: number, y1: number, x2: number, y2: number }) {
  const t = 0.74
  return { x: e.x1 + (e.x2 - e.x1) * t, y: e.y1 + (e.y2 - e.y1) * t - 4 }
}

/** The net input of the selected unit, written out link by link. */
const focusExpr = computed(() => {
  if (!focus.value)
    return ''
  const { layer, index } = focus.value
  const tag = layerTag(layer)
  const src = unitName(layer - 1)
  const srcTag = layerTag(layer - 1)
  const terms = nodes.value[layer - 1].map(n =>
    `w^{(${tag})}_{${index + 1},${n.index + 1}}\\, ${src}^{(${srcTag})}_{${n.index + 1}}`)
  return `z^{(${tag})}_{${index + 1}} = ${terms.join(' + ')} + b^{(${tag})}_{${index + 1}}`
})

const focusCount = computed(() => (focus.value ? props.layers[focus.value.layer - 1] : 0))

/* ---- dropout mode: one network, two behaviours -------------------------- */

/** Evaluation is the default, because it is the behaviour students assume. */
const training = ref(false)
const draw = ref(0)

/**
 * Which hidden units are dropped on the current draw. Input and output layers
 * are never masked — dropping an input pixel or a class score is a different
 * technique with a different name, and conflating them is a common misreading
 * of the picture.
 */
const dropped = computed(() => {
  const out = new Set<string>()
  if (!isDropout.value || !training.value)
    return out
  const rand = seededRandom(props.seed + draw.value * 7919)
  for (let li = 1; li < layerCount.value - 1; li++) {
    for (let ni = 0; ni < props.layers[li]; ni++) {
      if (rand() < props.p)
        out.add(`${li}-${ni}`)
    }
  }
  return out
})

function isDroppedUnit(li: number, ni: number) {
  return dropped.value.has(`${li}-${ni}`)
}

/** An edge is cut if either end of it is gone. */
function isCutEdge(e: { from: number, fromIndex: number, toIndex: number, bias: boolean }) {
  if (!isDropout.value || !training.value)
    return false
  return (!e.bias && isDroppedUnit(e.from, e.fromIndex)) || isDroppedUnit(e.from + 1, e.toIndex)
}

const hiddenUnits = computed(() =>
  props.layers.slice(1, -1).reduce((a, b) => a + b, 0))

/* ---- procedure mode: the phase walk ------------------------------------- */

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

/** In links mode the unit colouring says what is selected, not what is running. */
function nodeClass(li: number, ni: number) {
  if (isDropout.value)
    return isDroppedUnit(li, ni) ? 'is-dropped' : 'is-kept'
  if (!isLinks.value)
    return `is-${layerState(li)}`
  if (focus.value && focus.value.layer === li && focus.value.index === ni)
    return 'is-active'
  if (focus.value && focus.value.layer - 1 === li)
    return 'is-done'
  return 'is-idle'
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

function layerCaption(li: number) {
  if (li === 0)
    return isLinks.value ? 'input layer (in)' : 'input'
  if (li === layerCount.value - 1)
    return isLinks.value ? 'output layer (out)' : 'output'
  return isLinks.value ? `hidden layer (${layerTag(li)})` : `hidden ${li}`
}
</script>

<template>
  <WidgetFrame :max-width="isLinks ? '48rem' : '42rem'">
    <svg
      class="dl-mlp"
      :class="{ 'is-links': isLinks }"
      :viewBox="`0 0 ${props.width} ${props.height}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Multilayer neural network"
    >
      <defs v-if="isLinks">
        <marker id="dl-mlp-head" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" class="dl-mlp__head" />
        </marker>
        <marker id="dl-mlp-head-on" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" class="dl-mlp__head is-on" />
        </marker>
      </defs>

      <g class="dl-mlp__edges">
        <line
          v-for="(e, i) in edges"
          :key="i"
          :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
          :marker-end="isLinks ? (isIncoming(e) ? 'url(#dl-mlp-head-on)' : 'url(#dl-mlp-head)') : undefined"
          :class="{
            'is-active': !isLinks && e.from === activeEdgeLayer,
            'is-reverse': !isLinks && phase === 'backward',
            'is-bias': e.bias,
            'is-incoming': isLinks && isIncoming(e),
            'is-faded': isLinks && focus !== null && !isIncoming(e),
            'is-cut': isCutEdge(e),
          }"
        />
      </g>

      <!-- Bias units: drawn after the edges so the links leave from behind them. -->
      <g v-if="isLinks" class="dl-mlp__bias">
        <template v-for="b in biases" :key="`b${b.layer}`">
          <circle
            :cx="b.x" :cy="b.y" :r="R"
            :class="{ 'is-active': focus?.layer === b.layer }"
          />
          <text :x="b.x" :y="b.y + 4" text-anchor="middle">
            b<tspan :dy="-5" class="sup">({{ layerTag(b.layer) }})</tspan>
          </text>
        </template>
      </g>

      <g class="dl-mlp__nodes">
        <template v-for="(layer, li) in nodes" :key="li">
          <g v-for="n in layer" :key="`${li}-${n.index}`">
            <circle
              :cx="n.x" :cy="n.y" :r="R"
              :class="nodeClass(li, n.index)"
              :tabindex="isLinks && li > 0 ? 0 : undefined"
              :role="isLinks && li > 0 ? 'button' : undefined"
              :aria-label="isLinks && li > 0 ? `unit ${n.index + 1} of the ${layerCaption(li)}` : undefined"
              @click="isLinks && li > 0 && selectUnit(li, n.index)"
              @keydown.enter.prevent="isLinks && li > 0 && selectUnit(li, n.index)"
              @keydown.space.prevent="isLinks && li > 0 && selectUnit(li, n.index)"
            />
            <text v-if="isLinks" class="dl-mlp__unit" :x="n.x" :y="n.y + 4" text-anchor="middle">
              {{ unitName(li) }}<tspan :dy="2" class="sub">{{ n.index + 1 }}</tspan>
            </text>
          </g>
        </template>
      </g>

      <g v-if="isLinks && focus" class="dl-mlp__weights">
        <template v-for="(e, i) in edges" :key="`w${i}`">
          <text v-if="isIncoming(e)" :x="labelAt(e).x" :y="labelAt(e).y" text-anchor="middle">
            {{ e.bias ? 'b' : 'w' }}<tspan :dy="2" class="sub">{{ e.bias ? e.toIndex + 1 : `${e.toIndex + 1},${e.fromIndex + 1}` }}</tspan>
          </text>
        </template>
      </g>

      <g v-if="props.labels" class="dl-mlp__labels">
        <text v-for="(layer, li) in nodes" :key="`l${li}`" :x="layer[0].x" :y="props.height - 6" text-anchor="middle">
          {{ layerCaption(li) }}
        </text>
      </g>

      <g v-if="phase === 'loss'" class="dl-mlp__loss">
        <text :x="props.width - 14" :y="18" text-anchor="end">loss</text>
      </g>
    </svg>

    <template v-if="props.mode !== 'static'" #controls>
      <template v-if="isDropout">
        <StepButton
          :label="training ? 'Switch to model.eval()' : 'Switch to model.train()'"
          @click="training = !training"
        />
        <StepButton
          label="New mini-batch"
          variant="ghost"
          glyph="↻"
          :disabled="!training"
          @click="draw++"
        />
      </template>
      <template v-else-if="isLinks">
        <StepButton label="Next unit" glyph="▸" @click="nextUnit" />
        <StepButton label="Show the whole network" variant="ghost" @click="selected = null" />
      </template>
      <template v-else>
        <StepButton label="Play a pass" glyph="▶" @click="play" />
        <StepButton label="Step" variant="ghost" @click="() => { stop(); advance() }" />
        <StepButton label="Reset" variant="ghost" @click="reset" />
      </template>
    </template>

    <template v-if="props.mode !== 'static'" #readout>
      <template v-if="isDropout">
        <div v-if="training">
          <strong>Training.</strong> {{ dropped.size }} of the {{ hiddenUnits }} hidden units are
          switched off for this mini-batch, and every link into or out of them is gone with
          them. Each unit is dropped <em>independently</em> with
          <Katex :expr="`p = ${props.p}`" />, so it is about half, not exactly half. Press
          <strong>New mini-batch</strong>: a different set every time, so no unit can rely on
          any particular neighbour being there.
        </div>
        <div v-else>
          <strong>Evaluation.</strong> Every unit is present and nothing is dropped. This is what
          <code>model.eval()</code> selects, and forgetting to call it is why a model can score
          worse on the test set than it did while training.
        </div>
      </template>
      <span v-else-if="!isLinks" :class="{ 'is-live': phase !== 'idle' }">{{ CAPTION[phase] }}</span>
      <template v-else-if="focus">
        <div class="dl-mlp__count">
          This unit has <strong>{{ focusCount }}</strong> incoming links — one weight per unit
          of the previous layer — plus <strong>one bias</strong>. It adds them up:
        </div>
        <Katex :expr="focusExpr" />
        <span class="dl-mlp__then">, then <Katex :expr="`a^{(${layerTag(focus.layer)})}_{${focus.index + 1}} = \\sigma\\bigl(z^{(${layerTag(focus.layer)})}_{${focus.index + 1}}\\bigr)`" /></span>
      </template>
      <span v-else>
        Every unit is joined to <em>every</em> unit of the layer before it, and each of
        those links carries one weight. Click a unit — or press <strong>Next unit</strong> —
        to see the links that feed it.
      </span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-mlp {
  width: 100%;
  height: 100%;
}

/*
 * Thin rather than pale: at --dl-border these 69 lines vanish on a projector,
 * and the whole point of the picture is that the units are joined.
 */
.dl-mlp__edges line {
  stroke: var(--dl-muted);
  stroke-width: 0.5;
  transition: stroke 0.25s ease, stroke-width 0.25s ease;
}

/*
 * The links diagram is the one slide where the lines *are* the subject, so they
 * are drawn at reading contrast rather than as background texture.
 */
.dl-mlp.is-links .dl-mlp__edges line {
  stroke: var(--dl-muted);
  stroke-width: 0.9;
}

.dl-mlp.is-links .dl-mlp__edges line.is-bias {
  stroke-dasharray: 3 3;
}

.dl-mlp.is-links .dl-mlp__edges line.is-faded {
  stroke: var(--dl-border);
  stroke-width: 0.6;
}

.dl-mlp.is-links .dl-mlp__edges line.is-incoming {
  stroke: var(--dl-accent);
  stroke-width: 2;
}

.dl-mlp__head {
  fill: var(--dl-muted);
}

.dl-mlp__head.is-on {
  fill: var(--dl-accent);
}

.dl-mlp__edges line.is-active {
  stroke: var(--dl-accent);
  stroke-width: 1.8;
}

.dl-mlp__edges line.is-active.is-reverse {
  stroke: var(--dl-danger);
}

.dl-mlp__nodes circle,
.dl-mlp__bias circle {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.5;
  transition: fill 0.25s ease, stroke 0.25s ease;
}

.dl-mlp__nodes circle.is-done,
.dl-mlp__bias circle.is-active {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-mlp__nodes circle.is-active {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dl-mlp__nodes circle.is-kept {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-mlp__nodes circle.is-dropped {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-dasharray: 3 2;
}

.dl-mlp__edges line.is-cut {
  stroke: var(--dl-border);
  stroke-width: 0.35;
  stroke-dasharray: 2 4;
}

.dl-mlp__nodes circle.is-updating {
  fill: var(--dl-heading);
  stroke: var(--dl-heading);
}

.dl-mlp.is-links .dl-mlp__nodes circle[role='button'] {
  cursor: pointer;
}

.dl-mlp__nodes circle:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-mlp__unit,
.dl-mlp__bias text {
  fill: var(--dl-heading);
  font-size: 11px;
  font-style: italic;
  pointer-events: none;
}

/* The selected unit is filled with the accent, so its name has to invert. */
.dl-mlp__nodes circle.is-active + .dl-mlp__unit {
  fill: #fff;
}

.dl-mlp .sub,
.dl-mlp .sup {
  font-size: 7px;
  font-style: normal;
}

.dl-mlp__weights text {
  fill: var(--dl-accent-strong);
  font-size: 9px;
  font-style: italic;
  paint-order: stroke;
  stroke: var(--dl-bg);
  stroke-width: 2.5px;
  stroke-linejoin: round;
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

.dl-mlp__count {
  margin-bottom: 0.15rem;
}

.dl-mlp__then :deep(.katex) {
  font-size: 0.95em;
}

.is-live {
  color: var(--dl-body);
}
</style>
