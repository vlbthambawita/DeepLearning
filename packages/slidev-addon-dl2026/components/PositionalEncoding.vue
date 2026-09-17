<script setup lang="ts">
/*
 * The hole in the mechanism, and the patch.
 *
 * `mode="blind"` is the demonstration that has to come first: shuffle the
 * sentence and every word's output vector is *identical*. Attention is a
 * weighted sum over a set, and a sum does not care what order it was given. Last
 * week's entire lecture was built on order mattering, so a student who has been
 * paying attention should find this alarming — and the widget is designed so the
 * alarm is a number they can check rather than a claim from the front.
 *
 * `mode="sinusoid"` is the 2017 patch: a fixed vector per position, added to the
 * embedding before the first block. Drawn as a heatmap because the useful
 * property is visual — low dimensions oscillate fast, high dimensions barely
 * move over the whole sentence, so a position is legible at several scales at
 * once, and nothing about it is learned or length-limited.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'
import { SENTENCES, selfAttention } from '../composables/useAttention'

const props = withDefaults(defineProps<{
  mode?: 'blind' | 'sinusoid'
  /** Encoding width for the heatmap. Kept small enough to label. */
  dModel?: number
  positions?: number
}>(), {
  mode: 'blind',
  dModel: 16,
  positions: 12,
})

/* ---- mode="blind" -------------------------------------------------------- */

/*
 * Rotations rather than random shuffles: `bank` lands in a different slot each
 * time, which is the point, and the room can predict what the next press does —
 * a widget that reorders unpredictably invites the suspicion that something else
 * changed too.
 */
const ORDERS = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0],
  [2, 1, 0],
]

const order = ref(0)

const arrangement = computed(() =>
  ORDERS[order.value].map(i => SENTENCES.river[i]))

const scrambled = computed(() => selfAttention(arrangement.value))

/** The same word's output in the original order, to compare against. */
const original = computed(() => selfAttention(SENTENCES.river))

function outFor(word: string, result: ReturnType<typeof selfAttention>) {
  const row = result.rows.find(r => r.word === word)
  return row ? row.out : []
}

const unchanged = computed(() =>
  arrangement.value.every((w) => {
    const a = outFor(w, scrambled.value)
    const b = outFor(w, original.value)
    return a.every((v, i) => Math.abs(v - b[i]) < 1e-9)
  }))

function shuffle() {
  order.value = (order.value + 1) % ORDERS.length
}

/* ---- mode="sinusoid" ----------------------------------------------------- */

/**
 * The 2017 encoding, exactly as published:
 *
 *   PE(pos, 2i)   = sin(pos / 10000^(2i/d))
 *   PE(pos, 2i+1) = cos(pos / 10000^(2i/d))
 *
 * Even columns are sines and odd columns the matching cosines, so a column pair
 * shares a wavelength. Wavelengths run from 2π at the left to 10000·2π at the
 * right, which is why the leftmost columns stripe and the rightmost ones look
 * flat across a short sentence.
 */
const encoding = computed(() =>
  Array.from({ length: props.positions }, (_, pos) =>
    Array.from({ length: props.dModel }, (_, i) => {
      const pair = Math.floor(i / 2)
      const angle = pos / 10000 ** ((2 * pair) / props.dModel)
      return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle)
    })))

/** Which row the readout describes. */
const row = ref<number | null>(null)
</script>

<template>
  <WidgetFrame max-width="42rem">
    <!-- The sum does not know what order it was given. -->
    <div v-if="props.mode === 'blind'" class="dl-pe">
      <div class="dl-pe__cards">
        <div v-for="(w, i) in arrangement" :key="`${w}${i}`" class="dl-pe__card">
          <div class="dl-pe__slot">position {{ i + 1 }}</div>
          <div class="dl-pe__word">{{ w }}</div>
          <div class="dl-pe__arrow">↓</div>
          <div class="dl-pe__vec">
            <span v-for="(o, d) in outFor(w, scrambled)" :key="d" class="dl-pe__cell">{{ num(o) }}</span>
          </div>
          <div class="dl-pe__was">
            in the original order: [{{ outFor(w, original).map(n => num(n)).join(', ') }}]
          </div>
        </div>
      </div>

      <!-- Nothing to claim until something has actually been reordered. -->
      <div v-if="order > 0" class="dl-pe__verdict" :class="{ 'is-same': unchanged }">
        {{ unchanged ? 'every vector identical' : 'something changed' }}
      </div>
    </div>

    <!-- One fixed vector per position, added before the first block. -->
    <div v-else class="dl-pe dl-pe--heat">
      <div class="dl-pe__heatwrap">
        <div class="dl-pe__heatlabel">dimension →</div>
        <div class="dl-pe__heat">
          <div
            v-for="(values, pos) in encoding"
            :key="pos"
            class="dl-pe__heatrow"
            :class="{ 'is-active': row === pos }"
            @mouseenter="row = pos"
            @mouseleave="row = null"
          >
            <span class="dl-pe__pos">{{ pos }}</span>
            <span
              v-for="(value, i) in values"
              :key="i"
              class="dl-pe__heatcell"
              :class="value >= 0 ? 'is-pos' : 'is-neg'"
              :style="{ opacity: 0.12 + Math.abs(value) * 0.88 }"
              :title="`pos ${pos}, dim ${i}: ${num(value)}`"
            />
          </div>
        </div>
      </div>
    </div>

    <template #controls>
      <StepButton v-if="props.mode === 'blind'" label="Shuffle the words" glyph="⇄" @click="shuffle" />
    </template>

    <template #readout>
      <template v-if="props.mode === 'blind'">
        <template v-if="order === 0">
          The sentence in its written order. Press <em>Shuffle</em> and watch the vectors.
        </template>
        <template v-else>
          <strong>Every word's output vector is exactly what it was.</strong> Attention is a
          weighted sum over a <em>set</em>, and a sum has no order in it — so as far as this layer
          is concerned <em>the river bank</em> and <em>bank river the</em> are the same input.
          Last week's whole lecture was about order mattering.
          <span class="dl-pe__note">
            Permute the input and the outputs permute with it, unchanged. That property is called
            permutation equivariance, and here it is a bug.
          </span>
        </template>
      </template>
      <template v-else-if="row !== null">
        Position <strong>{{ row }}</strong> is the fixed vector
        [{{ encoding[row].slice(0, 4).map(n => num(n)).join(', ') }}, …] — {{ props.dModel }}
        numbers, computed from sines and cosines, <strong>not learned</strong>. It is
        <em>added</em> to the word's embedding, not concatenated, so the width of the model never
        changes.
      </template>
      <template v-else>
        One row per position, {{ props.dModel }} columns wide. Left-hand dimensions oscillate
        once every few positions; right-hand ones barely move across the whole sentence — so the
        same vector carries “which word am I” and “which end of the sentence am I” at once.
        Nothing here is learned, and nothing caps the length: position 5000 has a vector too.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-pe {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
}

.dl-pe__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  width: 100%;
  max-width: 36rem;
}

.dl-pe__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.4rem 0.6rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: var(--dl-surface);
}

.dl-pe__slot {
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-pe__word {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--dl-heading);
  margin-top: 0.1rem;
}

.dl-pe__arrow {
  color: var(--dl-muted);
  font-size: 0.85rem;
  line-height: 1.1;
}

.dl-pe__vec {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.15rem;
}

.dl-pe__cell {
  width: 3.1rem;
  padding: 0.16rem 0;
  text-align: center;
  border: 1px solid var(--dl-accent);
  border-radius: 4px;
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dl-pe__was {
  margin-top: 0.3rem;
  font-size: 0.64rem;
  line-height: 1.3;
  text-align: center;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-pe__verdict {
  padding: 0.2rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--dl-border);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-pe__verdict.is-same {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  color: var(--dl-accent);
  font-weight: 700;
}

/* ---- heatmap ------------------------------------------------------------- */

.dl-pe__heatwrap {
  width: 100%;
  max-width: 30rem;
}

.dl-pe__heatlabel {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dl-muted);
  margin-left: 2rem;
  margin-bottom: 0.2rem;
}

.dl-pe__heat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dl-pe__heatrow {
  display: flex;
  align-items: center;
  gap: 2px;
}

.dl-pe__pos {
  width: 1.7rem;
  text-align: right;
  padding-right: 0.3rem;
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-muted);
}

.dl-pe__heatrow.is-active .dl-pe__pos {
  color: var(--dl-accent);
  font-weight: 700;
}

.dl-pe__heatcell {
  flex: 1 1 0;
  height: 1.15rem;
  border-radius: 2px;
}

/*
 * A diverging pair, not a single ramp: the encoding is signed, and a
 * lightness-only scale makes −0.9 and +0.9 look like the same cell. Teal reads
 * as the accent everywhere else in the deck, so positive keeps it.
 */
.dl-pe__heatcell.is-pos {
  background: var(--dl-accent);
}

.dl-pe__heatcell.is-neg {
  background: var(--dl-danger);
}

.dl-pe__heatrow.is-active .dl-pe__heatcell {
  outline: 1px solid var(--dl-heading);
}

.dl-pe__note {
  display: block;
  margin-top: 0.15rem;
  color: var(--dl-accent);
}
</style>
