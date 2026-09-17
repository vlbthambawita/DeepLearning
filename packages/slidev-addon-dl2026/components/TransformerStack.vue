<script setup lang="ts">
/*
 * The 2017 architecture, walked in the order the data actually moves.
 *
 * The figure in *Attention Is All You Need* is the most reproduced diagram in
 * machine learning and one of the least readable, because it shows the whole
 * thing at once and a reader has no idea which arrow to follow first. Every box
 * here is a part the room has already met on its own — embedding, positional
 * encoding, self-attention, the position-wise FFN, the residual block — so the
 * walk is not teaching nine new things. It is assembling nine known things in
 * order, which is a much cheaper thing to ask of a lecture.
 *
 * The two beats that actually need the walk: the encoder runs **once** for the
 * whole source, and the decoder runs **once per output token**, which is where
 * the "transformers are parallel" claim gets its asterisk. And cross-attention
 * is the only place the two stacks touch — queries from the decoder, keys and
 * values from the encoder — which is exactly last week's Bahdanau attention with
 * the recurrence taken out from under it.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  /** Depth quoted on the stack brackets. 6 in the base model. */
  layers?: number
}>(), {
  layers: 6,
})

/* ---- geometry ------------------------------------------------------------ */

const W = 640
const H = 372
const COL_W = 218
const ENC_X = 56
const DEC_X = 366
const BOX_H = 30
const encMid = ENC_X + COL_W / 2
const decMid = DEC_X + COL_W / 2

interface Box {
  id: string
  x: number
  y: number
  label: string
  sub?: string
}

const BOXES: Box[] = [
  { id: 'enc-emb', x: ENC_X, y: 300, label: 'Input embedding', sub: 'one vector per source token' },
  { id: 'enc-sa', x: ENC_X, y: 218, label: 'Self-attention', sub: 'every token sees every token' },
  { id: 'enc-ff', x: ENC_X, y: 180, label: 'Feed-forward', sub: 'each position on its own' },

  { id: 'dec-emb', x: DEC_X, y: 300, label: 'Output embedding', sub: 'what has been written so far' },
  { id: 'dec-sa', x: DEC_X, y: 218, label: 'Masked self-attention', sub: 'no peeking at the future' },
  { id: 'dec-ca', x: DEC_X, y: 180, label: 'Cross-attention', sub: 'Q from here, K and V from the encoder' },
  { id: 'dec-ff', x: DEC_X, y: 142, label: 'Feed-forward' },
  { id: 'dec-lin', x: DEC_X, y: 96, label: 'Linear', sub: 'd → vocabulary size' },
  { id: 'dec-sm', x: DEC_X, y: 58, label: 'Softmax', sub: 'a probability per word in the vocabulary' },
]

/* ---- the walk ------------------------------------------------------------ */

interface Stage {
  title: string
  /** Ids lit at this stage. */
  lit: string[]
  note: string
}

const STAGES: Stage[] = [
  {
    title: 'Embed the source',
    lit: ['enc-in', 'enc-emb'],
    note: 'The source sentence is split into tokens and each one is looked up in an embedding table — the same `nn.Embedding` as last week. Nothing here knows anything about order yet.',
  },
  {
    title: 'Add position',
    lit: ['enc-in', 'enc-emb', 'enc-pe'],
    note: 'A fixed positional vector is added to each embedding. Without it the encoder would treat the sentence as a bag of words, because a weighted sum has no order in it.',
  },
  {
    title: 'Encoder self-attention',
    lit: ['enc-sa'],
    note: 'Every source token attends to every other, in both directions — there is no mask here, because the whole source is available at once. This is the step that makes each vector *contextual*.',
  },
  {
    title: 'Encoder block, ×N',
    lit: ['enc-sa', 'enc-ff', 'enc-stack'],
    note: 'Attention and feed-forward, each wrapped in a residual and a LayerNorm, repeated N times. The output is one vector per source token — not one vector for the whole sentence, which is precisely the bottleneck this architecture removes.',
  },
  {
    title: 'The decoder starts',
    lit: ['dec-in', 'dec-emb', 'dec-pe'],
    note: 'The decoder is fed what has been produced so far, shifted right by one and starting from a begin-of-sequence token. During training that is the true target sentence, so every position trains at once — teacher forcing, exactly as last week.',
  },
  {
    title: 'Masked self-attention',
    lit: ['dec-sa'],
    note: 'The decoder attends to its own output, with position t forbidden from seeing anything after t. Without the mask the model could read the answer off its own input and the loss would collapse to nothing.',
  },
  {
    title: 'Cross-attention',
    lit: ['dec-ca', 'cross'],
    note: 'The only place the two stacks meet. Queries come from the decoder — “what do I need next?” — and keys and values from the encoder’s output. This is last week’s Bahdanau attention, with the recurrence removed from both sides.',
  },
  {
    title: 'Decoder block, ×N',
    lit: ['dec-sa', 'dec-ca', 'dec-ff', 'dec-stack'],
    note: 'Three sub-layers now rather than two, again each with a residual and a norm, again repeated N times.',
  },
  {
    title: 'Predict the next token',
    lit: ['dec-lin', 'dec-sm', 'dec-out'],
    note: 'A linear layer to vocabulary size and a softmax: a probability for every word. Take one, append it, and run the decoder again. The encoder runs once; the decoder runs once per output token — which is where “transformers are parallel” gets its asterisk.',
  },
]

const at = ref(0)
const atEnd = computed(() => at.value >= STAGES.length)
const stage = computed(() => (at.value === 0 ? null : STAGES[at.value - 1]))

function step() {
  at.value = atEnd.value ? 0 : at.value + 1
}

/** Lit while its stage is current, and dimmed but present once passed. */
function state(id: string) {
  if (at.value === 0)
    return 'idle'
  if (stage.value?.lit.includes(id))
    return 'current'
  const seen = STAGES.slice(0, at.value).some(s => s.lit.includes(id))
  return seen ? 'seen' : 'idle'
}
</script>

<template>
  <WidgetFrame max-width="43rem">
    <svg
      class="dl-stack"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="The 2017 encoder-decoder transformer: an encoder stack reading the source sentence and a decoder stack that attends to its own output and to the encoder's"
    >
      <defs>
        <marker id="dl-stack-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- Column spines, drawn first so the boxes sit on top of them. -->
      <line class="dl-stack__spine" :x1="encMid" :y1="336" :x2="encMid" :y2="176" />
      <line class="dl-stack__spine" :x1="decMid" :y1="336" :x2="decMid" :y2="54" marker-end="url(#dl-stack-arrow)" />

      <!-- Repeated-block brackets. -->
      <rect
        class="dl-stack__repeat" :class="`is-${state('enc-stack')}`"
        :x="ENC_X - 12" y="172" :width="COL_W + 24" height="84" rx="8"
      />
      <text class="dl-stack__repeatlabel" :class="`is-${state('enc-stack')}`" :x="ENC_X - 18" y="214" text-anchor="end">×{{ props.layers }}</text>

      <rect
        class="dl-stack__repeat" :class="`is-${state('dec-stack')}`"
        :x="DEC_X - 12" y="134" :width="COL_W + 24" height="122" rx="8"
      />
      <text class="dl-stack__repeatlabel" :class="`is-${state('dec-stack')}`" :x="DEC_X + COL_W + 18" y="198" text-anchor="start">×{{ props.layers }}</text>

      <!-- The one place the two stacks touch. -->
      <path
        class="dl-stack__cross" :class="`is-${state('cross')}`"
        :d="`M ${encMid} 176 V 158 H 320 V 195 H ${DEC_X - 4}`"
        marker-end="url(#dl-stack-arrow)"
      />
      <text class="dl-stack__crosslabel" :class="`is-${state('cross')}`" x="318" y="152" text-anchor="middle">
        K, V from the encoder
      </text>

      <!-- Positional-encoding adders. -->
      <g v-for="pe in [{ id: 'enc-pe', x: encMid }, { id: 'dec-pe', x: decMid }]" :key="pe.id">
        <circle class="dl-stack__add" :class="`is-${state(pe.id)}`" :cx="pe.x" cy="272" r="11" />
        <text class="dl-stack__plus" :x="pe.x" y="277" text-anchor="middle">+</text>
        <text class="dl-stack__pe" :class="`is-${state(pe.id)}`" :x="pe.x - 18" y="276" text-anchor="end">position</text>
      </g>

      <!-- The boxes. -->
      <g v-for="box in BOXES" :key="box.id">
        <rect
          class="dl-stack__box" :class="`is-${state(box.id)}`"
          :x="box.x" :y="box.y" :width="COL_W" :height="BOX_H" rx="5"
        />
        <text
          class="dl-stack__label" :class="`is-${state(box.id)}`"
          :x="box.x + COL_W / 2" :y="box.y + (box.sub ? 14 : 20)" text-anchor="middle"
        >{{ box.label }}</text>
        <text
          v-if="box.sub" class="dl-stack__sub" :class="`is-${state(box.id)}`"
          :x="box.x + COL_W / 2" :y="box.y + 25" text-anchor="middle"
        >{{ box.sub }}</text>
      </g>

      <!-- Ports. -->
      <text class="dl-stack__port" :class="`is-${state('enc-in')}`" :x="encMid" y="350" text-anchor="middle">
        source sentence
      </text>
      <text class="dl-stack__port" :class="`is-${state('dec-in')}`" :x="decMid" y="350" text-anchor="middle">
        output so far, shifted right
      </text>
      <text class="dl-stack__port" :class="`is-${state('dec-out')}`" :x="decMid" y="44" text-anchor="middle">
        probability of every next word
      </text>

      <text class="dl-stack__side" :x="ENC_X" y="18">ENCODER — reads once</text>
      <text class="dl-stack__side" :x="DEC_X" y="18">DECODER — runs once per output token</text>
    </svg>

    <template #controls>
      <StepButton
        :label="atEnd ? 'Start over' : (at === 0 ? 'Walk the architecture' : 'Next step')"
        glyph="▸" @click="step"
      />
    </template>

    <template #readout>
      <template v-if="stage">
        <strong>{{ at }}/{{ STAGES.length }} · {{ stage.title }}</strong> — {{ stage.note }}
      </template>
      <template v-else>
        Six boxes you have already met, arranged into two stacks. Press <em>Walk the
        architecture</em> and follow the data: up the encoder once, then up the decoder once for
        every word it writes.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-stack {
  width: 100%;
  height: 100%;
}

.dl-stack__spine {
  stroke: var(--dl-border);
  stroke-width: 2;
  color: var(--dl-border);
}

.dl-stack__box {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 1.3;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.dl-stack__box.is-seen {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
}

.dl-stack__box.is-current {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2.2;
}

.dl-stack__label {
  fill: var(--dl-muted);
  font-size: 11.5px;
  font-weight: 600;
  transition: fill 0.2s ease;
}

.dl-stack__label.is-seen,
.dl-stack__label.is-current {
  fill: var(--dl-heading);
}

.dl-stack__sub {
  fill: var(--dl-muted);
  font-size: 8.8px;
}

.dl-stack__sub.is-current {
  fill: var(--dl-accent-strong);
}

.dl-stack__repeat {
  fill: none;
  stroke: var(--dl-border);
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
  transition: stroke 0.2s ease;
}

.dl-stack__repeat.is-current {
  stroke: var(--dl-accent);
}

.dl-stack__repeatlabel {
  fill: var(--dl-muted);
  font-size: 11px;
  font-weight: 700;
}

.dl-stack__repeatlabel.is-current {
  fill: var(--dl-accent);
}

.dl-stack__cross {
  fill: none;
  stroke: var(--dl-border);
  stroke-width: 1.6;
  color: var(--dl-border);
  transition: stroke 0.2s ease;
}

.dl-stack__cross.is-seen {
  stroke: var(--dl-body);
  color: var(--dl-body);
}

.dl-stack__cross.is-current {
  stroke: var(--dl-accent);
  color: var(--dl-accent);
  stroke-width: 2.2;
}

.dl-stack__crosslabel {
  fill: var(--dl-muted);
  font-size: 9px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.dl-stack__crosslabel.is-seen,
.dl-stack__crosslabel.is-current {
  opacity: 1;
}

.dl-stack__crosslabel.is-current {
  fill: var(--dl-accent);
  font-weight: 700;
}

.dl-stack__add {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
  stroke-width: 1.4;
}

.dl-stack__add.is-seen {
  stroke: var(--dl-body);
}

.dl-stack__add.is-current {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2.2;
}

.dl-stack__plus {
  fill: var(--dl-heading);
  font-size: 12px;
  font-weight: 700;
}

.dl-stack__pe {
  fill: var(--dl-muted);
  font-size: 9px;
}

.dl-stack__pe.is-current {
  fill: var(--dl-accent);
  font-weight: 700;
}

.dl-stack__port {
  fill: var(--dl-muted);
  font-size: 10px;
  transition: fill 0.2s ease;
}

.dl-stack__port.is-current {
  fill: var(--dl-accent);
  font-weight: 700;
}

.dl-stack__side {
  fill: var(--dl-muted);
  font-size: 9.5px;
  letter-spacing: 0.09em;
}
</style>
