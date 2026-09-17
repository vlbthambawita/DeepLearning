<script setup lang="ts">
/*
 * One block, walked part by part — and the same block rewired the way everything
 * built after about 2019 wires it.
 *
 * The single idea the walk exists to deliver: a block does two different jobs in
 * two different directions. Attention moves information *sideways*, between
 * positions. The feed-forward network moves it *upward*, within one position,
 * and never looks at a neighbour. Students who leave with only "a transformer is
 * attention" cannot explain where two thirds of the parameters went, and cannot
 * read the FFN line in any implementation.
 *
 * Post-LN and pre-LN live in one widget rather than two because the difference
 * is one wire, and a toggle makes that unmissable in a way that two diagrams on
 * two slides does not. It is also the single most consequential change between
 * the 2017 paper and a modern model: post-LN puts a LayerNorm *on* the residual
 * path, so the identity path a residual is supposed to provide is not actually
 * there, and training a deep post-LN stack needs a learning-rate warmup to
 * survive. Pre-LN leaves the path clean and mostly does not.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'post' | 'pre'
  /** Let the room flip between the 2017 and the modern wiring. */
  switchable?: boolean
  /** Start with every part lit rather than walking them. */
  start?: 'walk' | 'whole'
}>(), {
  variant: 'post',
  switchable: true,
  start: 'walk',
})

const wiring = ref<'post' | 'pre'>(props.variant)
const at = ref(0)

/*
 * `start="whole"` lights every part without putting the walk on a step, so the
 * readout opens on the summary of the block rather than on whichever node
 * happens to be last. Pressing the button drops it and starts the walk.
 */
const showAll = ref(props.start === 'whole')

interface Node {
  kind: 'box' | 'add'
  label: string
  sub?: string
  /** What this part is for, in the readout. */
  note: string
  /** Marks the two sub-layers, which get the accent border. */
  sublayer?: boolean
}

const POST: Node[] = [
  {
    kind: 'box',
    label: 'Multi-head self-attention',
    sub: 'positions mix here — and only here',
    note: 'Every position builds a new vector as a weighted sum over every position. This is the only part of the whole architecture where information moves sideways between tokens.',
    sublayer: true,
  },
  {
    kind: 'add',
    label: 'add',
    note: 'The residual connection: the sub-layer’s output is *added* to what came in, not substituted for it. Same trick as a ResNet, and for the same reason — it gives the gradient a path with no matrix on it.',
  },
  {
    kind: 'box',
    label: 'LayerNorm',
    sub: 'per position, across features',
    note: 'Re-centre and re-scale each position’s vector using its own mean and variance. Not BatchNorm: nothing is shared across the batch or across positions, which is what makes it safe with variable-length sequences.',
  },
  {
    kind: 'box',
    label: 'Feed-forward network',
    sub: 'each position alone — 4× wide',
    note: 'Two linear layers with a non-linearity between them, applied to every position separately with the same weights. No token sees another here. This is where two thirds of a block’s parameters live.',
    sublayer: true,
  },
  { kind: 'add', label: 'add', note: 'The second residual, around the feed-forward network.' },
  {
    kind: 'box',
    label: 'LayerNorm',
    sub: 'per position, across features',
    note: 'And normalise again. In the 2017 wiring both norms sit *after* the add — which means they sit on the residual path itself.',
  },
]

const PRE: Node[] = [
  {
    kind: 'box',
    label: 'LayerNorm',
    sub: 'RMSNorm in most modern models',
    note: 'Modern blocks normalise *before* the sub-layer instead of after it. RMSNorm drops the mean-subtraction and the bias and keeps only the rescaling — slightly cheaper, and empirically just as good.',
  },
  {
    kind: 'box',
    label: 'Multi-head self-attention',
    sub: 'grouped-query, rotary positions',
    note: 'Still scaled dot-product attention, unchanged since 2017. What changed around it: position now enters by rotating Q and K (RoPE) rather than by adding a vector at the bottom, and several query heads share one key/value head to shrink the cache.',
    sublayer: true,
  },
  {
    kind: 'add',
    label: 'add',
    note: 'The residual — and note what is *not* on it any more. Nothing stands between the input and this add but the sub-layer’s own output.',
  },
  {
    kind: 'box',
    label: 'LayerNorm',
    sub: 'RMSNorm',
    note: 'Normalise before the feed-forward network, on a copy of the residual stream rather than on the stream itself.',
  },
  {
    kind: 'box',
    label: 'Feed-forward network',
    sub: 'SwiGLU — three matrices, not two',
    note: 'Still position-wise, still wide. The gated variant uses three matrices instead of two, and the hidden width is trimmed (about 8/3 d rather than 4 d) to keep the parameter count level.',
    sublayer: true,
  },
  { kind: 'add', label: 'add', note: 'The second residual. From input to output there is now an unbroken addition-only path through every block in the stack.' },
]

const nodes = computed(() => (wiring.value === 'post' ? POST : PRE))

/**
 * Where each residual starts and ends, as node indices. −1 is the block input.
 *
 * This is the whole difference between the two wirings: post-LN's second
 * residual starts after a LayerNorm, pre-LN's starts at a bare add.
 */
const arcs = computed(() =>
  wiring.value === 'post'
    ? [{ from: -1, to: 1 }, { from: 2, to: 4 }]
    : [{ from: -1, to: 2 }, { from: 2, to: 5 }])

const atEnd = computed(() => at.value >= nodes.value.length)

function step() {
  showAll.value = false
  at.value = atEnd.value ? 0 : at.value + 1
}

function flip() {
  wiring.value = wiring.value === 'post' ? 'pre' : 'post'
  at.value = 0
  showAll.value = props.start === 'whole'
}

/** Lit because the walk has reached it, or because the whole block is shown. */
function lit(i: number) {
  return showAll.value || at.value >= i + 1
}

const current = computed(() => (at.value === 0 ? null : nodes.value[at.value - 1]))

/* ---- geometry ------------------------------------------------------------ */

const W = 440
const STEP = 48
const BOX_W = 244
const BOX_X = 132
const BOX_H = 34
const ADD_R = 12
const TOP = 26
const RAIL_X = 72

/** Node 0 sits at the bottom; the block reads upward, as in the paper. */
function nodeY(i: number) {
  return TOP + (nodes.value.length - i) * STEP
}

const INPUT_Y = computed(() => nodeY(-1) + 6)
const OUTPUT_Y = TOP
const H = computed(() => nodeY(-1) + 36)

/** Centre of a node, or the block input when i is −1. */
function centreY(i: number) {
  return i < 0 ? INPUT_Y.value : nodeY(i) + (nodes.value[i].kind === 'add' ? 0 : BOX_H / 2)
}
</script>

<template>
  <WidgetFrame max-width="30rem">
    <svg
      class="dl-blk"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`One transformer block, ${wiring === 'post' ? 'with LayerNorm after each sub-layer as in the 2017 paper' : 'with normalisation before each sub-layer as in modern models'}`"
    >
      <defs>
        <marker id="dl-blk-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- The main path, bottom to top. -->
      <line
        class="dl-blk__spine"
        :x1="BOX_X + BOX_W / 2" :y1="INPUT_Y" :x2="BOX_X + BOX_W / 2" :y2="OUTPUT_Y + 10"
        marker-end="url(#dl-blk-arrow)"
      />

      <text class="dl-blk__port" :x="BOX_X + BOX_W / 2" :y="INPUT_Y + 18" text-anchor="middle">
        in — (T, d) one vector per token
      </text>
      <text class="dl-blk__port" :x="BOX_X + BOX_W / 2" :y="OUTPUT_Y - 6" text-anchor="middle">
        out — (T, d), same shape, ready for the next block
      </text>

      <!-- Residual connections, drawn as a rail down the left. -->
      <path
        v-for="(arc, i) in arcs"
        :key="`arc${i}`"
        class="dl-blk__residual"
        :class="{ 'is-lit': showAll || at > arc.to }"
        :d="`M ${BOX_X + BOX_W / 2 - 4} ${centreY(arc.from)}
             H ${RAIL_X} V ${centreY(arc.to)}
             H ${BOX_X + BOX_W / 2 - ADD_R - 4}`"
        marker-end="url(#dl-blk-arrow)"
      />

      <template v-for="(node, i) in nodes" :key="node.label + i">
        <!-- Sub-layer output joining its add. -->
        <g v-if="node.kind === 'add'">
          <circle
            class="dl-blk__add"
            :class="{ 'is-lit': lit(i), 'is-current': at === i + 1 }"
            :cx="BOX_X + BOX_W / 2" :cy="nodeY(i)" :r="ADD_R"
          />
          <text class="dl-blk__plus" :x="BOX_X + BOX_W / 2" :y="nodeY(i) + 5" text-anchor="middle">+</text>
        </g>
        <g v-else>
          <rect
            class="dl-blk__box"
            :class="{
              'is-lit': lit(i),
              'is-current': at === i + 1,
              'is-sublayer': node.sublayer,
            }"
            :x="BOX_X" :y="nodeY(i)" :width="BOX_W" :height="BOX_H" rx="6"
          />
          <text
            class="dl-blk__label" :class="{ 'is-lit': lit(i) }"
            :x="BOX_X + BOX_W / 2" :y="nodeY(i) + (node.sub ? 15 : 22)" text-anchor="middle"
          >{{ node.label }}</text>
          <text
            v-if="node.sub"
            class="dl-blk__sub" :class="{ 'is-lit': lit(i) }"
            :x="BOX_X + BOX_W / 2" :y="nodeY(i) + 27" text-anchor="middle"
          >{{ node.sub }}</text>
        </g>
      </template>

      <text class="dl-blk__rail" :x="RAIL_X - 8" :y="H / 2" text-anchor="middle" :transform="`rotate(-90 ${RAIL_X - 8} ${H / 2})`">
        residual stream
      </text>
    </svg>

    <template #controls>
      <StepButton
        :label="atEnd && !showAll ? 'Start over' : (at === 0 ? 'Walk the block' : 'Next part')"
        glyph="▸" @click="step"
      />
      <StepButton
        v-if="props.switchable"
        :label="wiring === 'post' ? 'Rewire: modern (pre-LN)' : 'Rewire: 2017 (post-LN)'"
        variant="ghost" glyph="⇄" @click="flip"
      />
    </template>

    <template #readout>
      <template v-if="current">
        <strong>{{ current.label }}</strong> — {{ current.note }}
      </template>
      <template v-else-if="wiring === 'post'">
        The 2017 block: attention, add, normalise, feed-forward, add, normalise. Two sub-layers,
        each wrapped in a residual and a LayerNorm, and the shape at the top is the shape at the
        bottom — which is what lets you stack six of them, or ninety-six.
      </template>
      <template v-else>
        The same two sub-layers, with the normalisation moved <strong>before</strong> each one.
        Now nothing sits on the residual path: from the bottom of the stack to the top there is a
        route made only of additions. Post-LN needs a learning-rate warmup to train deep and
        pre-LN largely does not, which is why essentially every model after GPT-2 is wired this
        way.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-blk {
  width: 100%;
  height: 100%;
}

.dl-blk__spine {
  stroke: var(--dl-border);
  stroke-width: 2;
  color: var(--dl-border);
}

.dl-blk__residual {
  fill: none;
  stroke: var(--dl-border);
  stroke-width: 1.6;
  stroke-dasharray: 4 3;
  color: var(--dl-border);
  transition: stroke 0.2s ease;
}

.dl-blk__residual.is-lit {
  stroke: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-blk__box {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 1.3;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.dl-blk__box.is-sublayer {
  stroke-dasharray: none;
  stroke-width: 1.8;
}

.dl-blk__box.is-lit {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
}

.dl-blk__box.is-current {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2.2;
}

.dl-blk__add {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 1.5;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.dl-blk__add.is-lit {
  stroke: var(--dl-body);
}

.dl-blk__add.is-current {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2.2;
}

.dl-blk__plus {
  fill: var(--dl-heading);
  font-size: 14px;
  font-weight: 700;
}

.dl-blk__label {
  fill: var(--dl-muted);
  font-size: 12.5px;
  font-weight: 600;
  transition: fill 0.2s ease;
}

.dl-blk__label.is-lit {
  fill: var(--dl-heading);
}

.dl-blk__sub {
  fill: var(--dl-muted);
  font-size: 9.5px;
}

.dl-blk__sub.is-lit {
  fill: var(--dl-body);
}

.dl-blk__port {
  fill: var(--dl-muted);
  font-size: 10px;
}

.dl-blk__rail {
  fill: var(--dl-muted);
  font-size: 9.5px;
  letter-spacing: 0.08em;
}
</style>
