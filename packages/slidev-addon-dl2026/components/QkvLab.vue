<script setup lang="ts">
/*
 * Three lenses on one word — the slide that has to land before any arithmetic.
 *
 * The reliable student misconception is that a query, a key and a value are
 * three different *things* the model stores. They are not: they are one vector
 * seen through three learned projections, and the widget is built so that fact
 * is unavoidable — one row of numbers at the top, three boxes below it, and the
 * same `x` feeding all three.
 *
 * The second thing it has to show is that `bank` arrives *empty*. Its embedding
 * puts all of its mass on the "thing" axis and none on water or money, so the
 * sense is genuinely not in the vector. That is what makes the next widget's
 * weighted sum feel necessary rather than decorative.
 *
 * Numbers come from `useAttention`, so this and `AttentionTrace` cannot drift.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'
import type { SentenceKey } from '../composables/useAttention'
import { AXES, SENTENCES, VOCAB, W_K, W_Q, W_V, project } from '../composables/useAttention'

const props = withDefaults(defineProps<{
  sentence?: SentenceKey
  /** Let the room switch sentences. Off for the first outing, on later. */
  switchable?: boolean
}>(), {
  sentence: 'river',
  switchable: false,
})

const which = ref<SentenceKey>(props.sentence)
const words = computed(() => SENTENCES[which.value])

/** Start on `bank`: it is the word with the problem. */
const at = ref(2)

const word = computed(() => words.value[Math.min(at.value, words.value.length - 1)])
const x = computed(() => VOCAB[word.value])

const LENSES = [
  {
    key: 'q',
    name: 'Query',
    symbol: 'q',
    matrix: 'W_Q',
    role: 'what I am looking for',
    weights: W_Q,
  },
  {
    key: 'k',
    name: 'Key',
    symbol: 'k',
    matrix: 'W_K',
    role: 'what I advertise',
    weights: W_K,
  },
  {
    key: 'v',
    name: 'Value',
    symbol: 'v',
    matrix: 'W_V',
    role: 'what I hand over',
    weights: W_V,
  },
] as const

const projections = computed(() =>
  LENSES.map(lens => ({ ...lens, vec: project(x.value, lens.weights) })))

/** True when every projected coordinate is zero — worth saying out loud. */
function isSilent(vec: number[]) {
  return vec.every(v => v === 0)
}

function nextWord() {
  at.value = (at.value + 1) % words.value.length
}

function flip() {
  which.value = which.value === 'river' ? 'money' : 'river'
}
</script>

<template>
  <WidgetFrame max-width="44rem">
    <div class="dl-qkv">
      <!-- One sentence, one word selected. -->
      <div class="dl-qkv__sentence">
        <button
          v-for="(w, i) in words"
          :key="w + i"
          type="button"
          class="dl-qkv__word"
          :class="{ 'is-current': i === at }"
          @click="at = i"
        >{{ w }}</button>
      </div>

      <!-- The one vector everything below is derived from. -->
      <div class="dl-qkv__source">
        <span class="dl-qkv__sourcelabel">x<sub>{{ at + 1 }}</sub></span>
        <span
          v-for="(value, d) in x"
          :key="d"
          class="dl-qkv__coord"
          :class="{ 'is-zero': value === 0 }"
        >
          <span class="dl-qkv__axis">{{ AXES[d] }}</span>
          <span class="dl-qkv__val">{{ num(value) }}</span>
        </span>
      </div>

      <div class="dl-qkv__fan" aria-hidden="true">
        <span v-for="lens in LENSES" :key="lens.key" class="dl-qkv__stem" />
      </div>

      <!-- Three projections of it. -->
      <div class="dl-qkv__lenses">
        <div
          v-for="lens in projections"
          :key="lens.key"
          class="dl-qkv__lens"
          :class="{ 'is-silent': isSilent(lens.vec) }"
        >
          <div class="dl-qkv__lensname">{{ lens.name }}</div>
          <div class="dl-qkv__role">{{ lens.role }}</div>
          <div class="dl-qkv__formula">
            <Katex :expr="`\\mathbf{${lens.symbol}} = \\mathbf{x}\\,${lens.matrix}`" />
          </div>
          <div class="dl-qkv__vec">
            <span v-for="(value, d) in lens.vec" :key="d" class="dl-qkv__cell">{{ num(value) }}</span>
          </div>
          <div v-if="isSilent(lens.vec)" class="dl-qkv__silent">all zero</div>
        </div>
      </div>
    </div>

    <template #controls>
      <StepButton label="Next word" glyph="▸" @click="nextWord" />
      <StepButton
        v-if="props.switchable"
        :label="which === 'river' ? 'Swap river → money' : 'Swap money → river'"
        variant="ghost" glyph="⇄" @click="flip"
      />
    </template>

    <template #readout>
      <strong>{{ word }}</strong> is four numbers, and the three boxes are three
      <strong>learned</strong> projections of those same four numbers — not three stored things.
      <span v-if="word === 'bank'" class="dl-qkv__note">
        Look at x: all of <em>bank</em>’s mass is on <em>thing</em>, and none of it on
        <em>water</em> or <em>money</em>. The sense is not in the vector. Its query asks the
        loudest question in the sentence, and its key advertises nothing — so nobody reads
        <em>bank</em> to find out what a bank is.
      </span>
      <span v-else-if="word === 'the'" class="dl-qkv__note">
        <em>the</em> projects to a zero query and a zero key: it asks nothing and advertises
        nothing. Its row of attention weights will come out flat, and no other word will point
        at it.
      </span>
      <span v-else class="dl-qkv__note">
        <em>{{ word }}</em> advertises exactly the thing <em>bank</em> is about to ask for —
        which is the whole mechanism, and it is one dot product away.
      </span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-qkv {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
}

.dl-qkv__sentence {
  display: flex;
  gap: 0.5rem;
}

.dl-qkv__word {
  padding: 0.2rem 0.85rem;
  border: 1px solid var(--dl-border);
  border-radius: 5px;
  background: var(--dl-bg);
  color: var(--dl-body);
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dl-qkv__word:hover {
  border-color: var(--dl-accent);
}

.dl-qkv__word.is-current {
  background: var(--dl-accent);
  border-color: var(--dl-accent-strong);
  color: #fff;
  font-weight: 600;
}

.dl-qkv__word:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-qkv__source {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.dl-qkv__sourcelabel {
  font-size: 0.92rem;
  font-style: italic;
  font-weight: 600;
  color: var(--dl-heading);
  margin-right: 0.15rem;
}

.dl-qkv__coord {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 3.4rem;
  padding: 0.12rem 0;
  border: 1px solid var(--dl-border);
  border-radius: 4px;
  background: var(--dl-surface);
}

.dl-qkv__coord.is-zero {
  background: transparent;
  border-style: dashed;
}

.dl-qkv__axis {
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  color: var(--dl-muted);
}

.dl-qkv__val {
  font-size: 0.88rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--dl-heading);
}

.dl-qkv__coord.is-zero .dl-qkv__val {
  color: var(--dl-muted);
  font-weight: 400;
}

/* Three stems fanning out of the one vector into the three boxes. */
.dl-qkv__fan {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
  max-width: 34rem;
  height: 0.6rem;
}

.dl-qkv__stem {
  border-left: 1px solid var(--dl-border);
  justify-self: center;
  height: 100%;
}

.dl-qkv__lenses {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
  width: 100%;
}

.dl-qkv__lens {
  border: 1px solid var(--dl-border);
  border-top: 3px solid var(--dl-accent);
  border-radius: 6px;
  padding: 0.4rem 0.6rem 0.5rem;
  background: var(--dl-surface);
  text-align: center;
}

.dl-qkv__lens.is-silent {
  border-top-color: var(--dl-border);
  opacity: 0.72;
}

.dl-qkv__lensname {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--dl-heading);
}

.dl-qkv__role {
  font-size: 0.76rem;
  color: var(--dl-muted);
  min-height: 1.3em;
  line-height: 1.3;
  margin-top: 0.05rem;
}

.dl-qkv__formula {
  margin: 0.3rem 0 0.35rem;
}

.dl-qkv__formula :deep(.katex) {
  font-size: 0.8em;
}

.dl-qkv__vec {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.dl-qkv__cell {
  width: 2.9rem;
  padding: 0.18rem 0;
  border: 1px solid var(--dl-accent);
  border-radius: 4px;
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-size: 0.88rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dl-qkv__lens.is-silent .dl-qkv__cell {
  border-color: var(--dl-border);
  background: transparent;
  color: var(--dl-muted);
  font-weight: 400;
}

.dl-qkv__silent {
  margin-top: 0.2rem;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-qkv__note {
  display: block;
  margin-top: 0.15rem;
  color: var(--dl-accent);
}
</style>
