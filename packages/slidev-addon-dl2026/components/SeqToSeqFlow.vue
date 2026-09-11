<script setup lang="ts">
/*
 * The encoder–decoder, and the wall it runs into — 2025 Lecture 5/6 slides 17–20.
 *
 * `mode="bottleneck"` is the argument, and it is made by a slider: lengthen the
 * source sentence and watch the context vector stay exactly the same size. Three
 * words into 256 numbers is generous; forty words into the same 256 numbers is
 * the reason this architecture stopped being the state of the art.
 *
 * `mode="attention"` is the fix, in its original recurrent form (Bahdanau et al.,
 * 2014) — one context vector *per output step*, built as a weighted sum of every
 * encoder state. This is deliberately the last widget in the deck: it is the
 * bridge to the transformer lecture, and the alignment chosen here is
 * non-monotonic ("read" attends to *gelesen*, five words away) so that the
 * weights are visibly doing something a fixed vector could not.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  mode?: 'bottleneck' | 'attention'
  /** Width of the context vector, in numbers. */
  contextDim?: number
}>(), {
  mode: 'bottleneck',
  contextDim: 256,
})

/* ---- the two sentences --------------------------------------------------- */

const LONG_SOURCE = ['Ich', 'habe', 'gestern', 'ein', 'sehr', 'gutes', 'Buch', 'gelesen']

const SOURCE = ['Ich', 'habe', 'ein', 'Buch', 'gelesen']
const TARGET = ['I', 'have', 'read', 'a', 'book']

/**
 * Attention weights, one row per output word.
 *
 * Row 2 is the row worth pausing on: "read" comes from *gelesen*, the last word
 * of the German sentence, which a left-to-right decoder reading one fixed vector
 * has no way to reach for.
 */
const ATTENTION: number[][] = [
  [0.90, 0.05, 0.02, 0.02, 0.01],
  [0.05, 0.85, 0.02, 0.02, 0.06],
  [0.02, 0.10, 0.01, 0.02, 0.85],
  [0.02, 0.02, 0.88, 0.06, 0.02],
  [0.02, 0.02, 0.08, 0.86, 0.02],
]

const length = ref(4)
/** Which output word the decoder is producing. −1 before it starts. */
const at = ref(-1)

const sourceWords = computed(() =>
  props.mode === 'attention' ? SOURCE : LONG_SOURCE.slice(0, length.value))

const atEnd = computed(() => at.value >= TARGET.length - 1)

function step() {
  at.value = atEnd.value ? -1 : at.value + 1
}

const weights = computed(() => (at.value < 0 ? null : ATTENTION[at.value]))

const focus = computed(() => {
  const w = weights.value
  if (!w)
    return null
  const best = w.indexOf(Math.max(...w))
  return { word: SOURCE[best], weight: w[best], index: best }
})

/* ---- geometry ------------------------------------------------------------ */

const W = 580
const H = 254
const MARGIN = 28
const BOX_W = 74
const BOX_H = 34
const Y_DEC = 26
const Y_CTX = 106
const Y_ENC = 184
const CTX_W = 104

function pitch(n: number) {
  return n <= 1 ? 0 : (W - 2 * MARGIN - BOX_W) / (n - 1)
}

function encX(i: number) {
  return MARGIN + i * pitch(sourceWords.value.length)
}

function decX(i: number) {
  return MARGIN + i * pitch(TARGET.length)
}

const encMid = (i: number) => encX(i) + BOX_W / 2
const decMid = (i: number) => decX(i) + BOX_W / 2

const CTX_X = W / 2 - CTX_W / 2
const CTX_MID = W / 2
</script>

<template>
  <WidgetFrame max-width="42rem">
    <svg
      class="dl-s2s"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="props.mode === 'bottleneck'
        ? `An encoder reading ${sourceWords.length} words into one context vector of ${props.contextDim} numbers, which the decoder then reads`
        : 'A decoder that recomputes its context vector at every output step as a weighted sum of every encoder state'"
    >
      <defs>
        <marker id="dl-s2s-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
        <!--
          An attention line's stroke-width carries its weight, and a marker sized
          in stroke-widths would therefore grow to 30px on the heaviest line.
          This one is sized in user units, so every head is the same size.
        -->
        <marker
          id="dl-s2s-tip" viewBox="0 0 8 8" refX="7" refY="4"
          markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- Encoder: one cell per source word, state passed along. -->
      <g v-for="(w, i) in sourceWords" :key="`e${i}`">
        <line
          v-if="i > 0"
          class="dl-s2s__state"
          :x1="encX(i - 1) + BOX_W" :y1="Y_ENC + BOX_H / 2" :x2="encX(i) - 3" :y2="Y_ENC + BOX_H / 2"
          marker-end="url(#dl-s2s-arrow)"
        />
        <rect class="dl-s2s__cell is-enc" :x="encX(i)" :y="Y_ENC" :width="BOX_W" :height="BOX_H" rx="5" />
        <text class="dl-s2s__cellword" :x="encMid(i)" :y="Y_ENC + 22" text-anchor="middle">{{ w }}</text>
      </g>
      <text class="dl-s2s__side" :x="MARGIN" :y="H - 8">encoder — reads German</text>

      <!-- Decoder -->
      <g v-for="(w, i) in TARGET" :key="`d${i}`">
        <line
          v-if="i > 0"
          class="dl-s2s__state"
          :x1="decX(i - 1) + BOX_W" :y1="Y_DEC + BOX_H / 2" :x2="decX(i) - 3" :y2="Y_DEC + BOX_H / 2"
          marker-end="url(#dl-s2s-arrow)"
        />
        <rect
          class="dl-s2s__cell is-dec"
          :class="{ 'is-current': props.mode === 'attention' && at === i, 'is-waiting': props.mode === 'attention' && at >= 0 && at !== i }"
          :x="decX(i)" :y="Y_DEC" :width="BOX_W" :height="BOX_H" rx="5"
        />
        <text
          class="dl-s2s__cellword" :class="{ 'is-current': props.mode === 'attention' && at === i }"
          :x="decMid(i)" :y="Y_DEC + 22" text-anchor="middle"
        >{{ w }}</text>
      </g>
      <text class="dl-s2s__side" :x="MARGIN" :y="16">decoder — writes English</text>

      <!-- One fixed vector, whatever the sentence length. -->
      <template v-if="props.mode === 'bottleneck'">
        <line
          v-for="(w, i) in sourceWords" :key="`in${i}`"
          class="dl-s2s__squeeze"
          :x1="encMid(i)" :y1="Y_ENC - 2" :x2="CTX_MID" :y2="Y_CTX + BOX_H + 5"
          marker-end="url(#dl-s2s-arrow)"
        />
        <line
          v-for="(w, i) in TARGET" :key="`out${i}`"
          class="dl-s2s__squeeze"
          :x1="CTX_MID" :y1="Y_CTX - 2" :x2="decMid(i)" :y2="Y_DEC + BOX_H + 5"
          marker-end="url(#dl-s2s-arrow)"
        />
        <rect class="dl-s2s__ctx" :x="CTX_X" :y="Y_CTX" :width="CTX_W" :height="BOX_H" rx="5" />
        <text class="dl-s2s__ctxlabel" :x="CTX_MID" :y="Y_CTX + 15" text-anchor="middle">context</text>
        <text class="dl-s2s__ctxdim" :x="CTX_MID" :y="Y_CTX + 27" text-anchor="middle">{{ props.contextDim }} numbers</text>
      </template>

      <!-- A fresh context vector per output step, weighted over every encoder state. -->
      <template v-else>
        <template v-if="weights">
          <line
            v-for="(a, i) in weights" :key="`att${i}`"
            class="dl-s2s__att"
            :x1="encMid(i)" :y1="Y_ENC - 2"
            :x2="decMid(at)" :y2="Y_DEC + BOX_H + 5"
            :stroke-width="0.6 + a * 7"
            :style="{ opacity: 0.18 + a * 0.8 }"
            marker-end="url(#dl-s2s-tip)"
          />
          <text
            v-for="(a, i) in weights" :key="`attv${i}`"
            class="dl-s2s__attval" :class="{ 'is-top': i === focus?.index }"
            :x="encMid(i)" :y="Y_ENC - 10" text-anchor="middle"
          >{{ a.toFixed(2) }}</text>
        </template>
        <text v-else class="dl-s2s__hint" :x="W / 2" :y="Y_CTX + 22" text-anchor="middle">
          press Next word — every output step gets its own context vector
        </text>
      </template>
    </svg>

    <template #controls>
      <Slider
        v-if="props.mode === 'bottleneck'"
        v-model="length" label="words in the source sentence" :min="2" :max="LONG_SOURCE.length"
        :step="1" :precision="0"
      />
      <StepButton
        v-else
        :label="atEnd ? 'Start over' : 'Next word'" glyph="▸" @click="step"
      />
    </template>

    <template #readout>
      <template v-if="props.mode === 'bottleneck'">
        {{ sourceWords.length }} words in, and the context vector is
        <strong>{{ props.contextDim }} numbers</strong> — the same {{ props.contextDim }} it was at
        two words, and the same it would be at forty. Everything the decoder will ever know about
        the source has to fit in there, and the first word has to survive
        {{ sourceWords.length - 1 }} more updates before the encoder is done.
      </template>
      <template v-else-if="focus">
        Writing <strong>{{ TARGET[at] }}</strong>: the decoder reads mostly
        <strong>{{ focus.word }}</strong> ({{ focus.weight.toFixed(2) }} of the weight). The context
        for this step is the weighted sum of all {{ SOURCE.length }} encoder states — a different
        vector for every output word.
        <span v-if="at === 2" class="dl-s2s__note">
          “read” comes from <em>gelesen</em>, the <strong>last</strong> word of the German sentence.
          The alignment is not left to right, and nothing told the model that.
        </span>
      </template>
      <template v-else>
        No single context vector. At each output step the decoder scores every encoder state,
        softmaxes the scores into weights, and builds the context it needs right then.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-s2s {
  width: 100%;
  height: 100%;
}

.dl-s2s__cell {
  stroke-width: 1.2;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.dl-s2s__cell.is-enc {
  fill: var(--dl-surface);
  stroke: var(--dl-body);
}

.dl-s2s__cell.is-dec {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-s2s__cell.is-waiting {
  fill: var(--dl-bg);
  stroke: var(--dl-border);
}

.dl-s2s__cell.is-current {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
}

.dl-s2s__cellword {
  fill: var(--dl-heading);
  font-size: 13px;
  font-weight: 600;
}

.dl-s2s__cellword.is-current {
  fill: #fff;
}

.dl-s2s__state {
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
  color: var(--dl-accent-strong);
}

.dl-s2s__squeeze {
  stroke: var(--dl-muted);
  stroke-width: 1.3;
  color: var(--dl-muted);
}

.dl-s2s__ctx {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
  stroke-width: 1.5;
}

.dl-s2s__ctxlabel {
  fill: #fff;
  font-size: 12px;
  font-weight: 600;
}

.dl-s2s__ctxdim {
  fill: #fff;
  font-size: 9.5px;
}

.dl-s2s__att {
  stroke: var(--dl-accent);
  color: var(--dl-accent);
  fill: none;
}

.dl-s2s__attval {
  fill: var(--dl-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.dl-s2s__attval.is-top {
  fill: var(--dl-accent-strong);
  font-weight: 700;
}

.dl-s2s__side {
  fill: var(--dl-muted);
  font-size: 10.5px;
  letter-spacing: 0.04em;
}

.dl-s2s__hint {
  fill: var(--dl-muted);
  font-size: 11.5px;
}

.dl-s2s__note {
  display: block;
  margin-top: 0.15rem;
  color: var(--dl-accent);
}
</style>
