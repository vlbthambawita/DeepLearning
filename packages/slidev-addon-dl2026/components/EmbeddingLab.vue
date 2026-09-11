<script setup lang="ts">
/*
 * How a word becomes a vector — 2025 Lecture 5/6 slides 14 and 15, which stated
 * the advantages of an embedding over one-hot in four bullet points and then
 * showed a book figure of the mechanism without connecting the two.
 *
 * `mode="lookup"` puts the one-hot column beside the embedding matrix, aligned
 * row for row, so that "one-hot times E" is visibly *row selection* rather than a
 * matrix product to be taken on trust. That is the fact that makes `nn.Embedding`
 * make sense: it never builds the one-hot vector at all, because there is nothing
 * to multiply.
 *
 * `mode="space"` answers the question the lookup picture always provokes — where
 * do the numbers come from? They are learned, and what they learn is a geometry:
 * the two words that mean the same thing end up in the same place. The
 * coordinates here are hand-written to look like a trained table, and the readout
 * says so; a real one has 100 dimensions and no axis you could name.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'

interface Word {
  word: string
  /** Four learned features. The first two are what the map plots. */
  vec: number[]
  group: 'positive' | 'negative' | 'thing' | 'function'
}

/*
 * Eight words, four dimensions, and the values chosen so the first two columns
 * are readable as "sentiment" and "is a film noun". A trained table has no such
 * columns — but a student cannot see structure in eight rows of noise, and the
 * structure is the point.
 */
const VOCAB: Word[] = [
  { word: 'the', vec: [0.0, 0.0, 0.0, 0.9], group: 'function' },
  { word: 'a', vec: [0.0, 0.1, 0.0, 0.8], group: 'function' },
  { word: 'movie', vec: [0.1, 0.9, 0.1, 0.1], group: 'thing' },
  { word: 'plot', vec: [0.0, 0.8, 0.0, 0.1], group: 'thing' },
  { word: 'ending', vec: [0.0, 0.7, 0.1, 0.1], group: 'thing' },
  { word: 'great', vec: [0.8, 0.1, 0.6, 0.0], group: 'positive' },
  { word: 'brilliant', vec: [0.9, 0.0, 0.8, 0.0], group: 'positive' },
  { word: 'awful', vec: [-0.8, 0.1, 0.6, 0.0], group: 'negative' },
  { word: 'terrible', vec: [-0.9, 0.0, 0.8, 0.0], group: 'negative' },
]

const props = withDefaults(defineProps<{
  mode?: 'lookup' | 'space'
  /** Vocabulary size used for the "at real scale" arithmetic. */
  vocabulary?: number
  /** Embedding width used for the same. */
  dim?: number
  /** Units in the layer that reads the representation, for the one-hot cost. */
  hidden?: number
}>(), {
  mode: 'lookup',
  vocabulary: 20000,
  dim: 64,
  hidden: 128,
})

const selected = ref(5)
const word = computed(() => VOCAB[selected.value])

const fmt = (n: number) => n.toLocaleString('en-US')

/** What the first layer costs if a word arrives as a one-hot vector. */
const onehotWeights = computed(() => props.vocabulary * props.hidden)
/** What it costs if the word arrives as an embedding. */
const embeddingWeights = computed(() => props.vocabulary * props.dim + props.dim * props.hidden)

const GROUP_COLOR: Record<string, string> = {
  positive: 'var(--dl-accent)',
  negative: 'var(--dl-danger)',
  thing: 'var(--dl-heading)',
  function: 'var(--dl-muted)',
}

const points = computed(() => VOCAB.map((w, i) => ({
  x: w.vec[0],
  y: w.vec[1],
  cls: w.group,
  highlight: i === selected.value,
})))
</script>

<template>
  <WidgetFrame :max-width="props.mode === 'space' ? '34rem' : '40rem'">
    <!-- One-hot beside the table it indexes. -->
    <div v-if="props.mode === 'lookup'" class="dl-emb">
      <div class="dl-emb__grid">
        <div class="dl-emb__head">word</div>
        <div class="dl-emb__head">one-hot</div>
        <div class="dl-emb__head dl-emb__head--wide">E — the embedding matrix, {{ VOCAB.length }} × 4</div>

        <template v-for="(w, i) in VOCAB" :key="w.word">
          <button
            type="button"
            class="dl-emb__word"
            :class="{ 'is-selected': i === selected }"
            @click="selected = i"
          >{{ w.word }}</button>

          <div class="dl-emb__onehot" :class="{ 'is-hot': i === selected }">{{ i === selected ? 1 : 0 }}</div>

          <div class="dl-emb__row" :class="{ 'is-selected': i === selected }">
            <div v-for="(v, d) in w.vec" :key="d" class="dl-emb__cell">{{ num(v) }}</div>
          </div>
        </template>
      </div>

      <div class="dl-emb__result">
        <div class="dl-emb__arrow" aria-hidden="true">→</div>
        <div class="dl-emb__out">
          <div v-for="(v, d) in word.vec" :key="d" class="dl-emb__cell is-out">{{ num(v) }}</div>
        </div>
        <div class="dl-emb__outcap">the vector for<br><strong>{{ word.word }}</strong></div>
      </div>
    </div>

    <!-- The same table, read as a map. -->
    <Plot2D
      v-else
      :x-domain="[-1.15, 1.15]"
      :y-domain="[-0.25, 1.15]"
      :x-ticks="[-1, -0.5, 0, 0.5, 1]"
      :y-ticks="[0, 0.5, 1]"
      x-label="learned dimension 1"
      y-label="learned dimension 2"
      :width="520"
      :height="300"
    >
      <PlotPoints :points="points" :radius="6" :colors="GROUP_COLOR" />
      <PlotLabel
        v-for="(w, i) in VOCAB"
        :key="w.word"
        :at="[w.vec[0], w.vec[1]]"
        :dx="w.vec[0] > 0.3 ? -10 : 10"
        :dy="-9"
        :anchor="w.vec[0] > 0.3 ? 'end' : 'start'"
        :color="GROUP_COLOR[w.group]"
        :bold="i === selected"
        :size="12"
        :text="w.word"
      />
    </Plot2D>

    <template #controls>
      <div v-if="props.mode === 'space'" class="dl-emb__tabs">
        <button
          v-for="(w, i) in VOCAB"
          :key="w.word"
          type="button"
          :class="{ 'is-selected': i === selected }"
          @click="selected = i"
        >{{ w.word }}</button>
      </div>
    </template>

    <template #readout>
      <template v-if="props.mode === 'lookup'">
        The one-hot column has a single 1, in row {{ selected }} — so the product picks
        <strong>row {{ selected }}</strong> of E and nothing else.
        <code>nn.Embedding</code> skips the multiply and indexes the row directly.
        <div class="dl-emb__scale">
          At real scale, {{ fmt(props.vocabulary) }} words into a {{ props.hidden }}-unit layer:
          one-hot needs {{ fmt(props.vocabulary) }} × {{ props.hidden }} =
          <strong>{{ fmt(onehotWeights) }}</strong> weights; a {{ props.dim }}-wide embedding needs
          {{ fmt(props.vocabulary) }} × {{ props.dim }} + {{ props.dim }} × {{ props.hidden }} =
          <strong>{{ fmt(embeddingWeights) }}</strong>.
        </div>
      </template>
      <template v-else>
        Nobody wrote these coordinates — they are weights, trained by the same gradient descent as
        every other layer. <strong>great</strong> and <strong>brilliant</strong> end up beside each
        other because they did the same job in the training reviews; one-hot puts every pair of
        words exactly the same distance apart.
        <div class="dl-emb__scale">
          The axes are named here so the picture is readable. In a real {{ props.dim }}-dimensional
          table no single axis means anything you could name.
        </div>
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-emb {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-variant-numeric: tabular-nums;
}

.dl-emb__grid {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: 0.18rem 0.6rem;
}

.dl-emb__head {
  font-size: 0.68rem;
  color: var(--dl-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: 0.15rem;
}

.dl-emb__head--wide {
  text-transform: none;
  letter-spacing: 0;
}

.dl-emb__word {
  font: inherit;
  font-size: 0.82rem;
  text-align: right;
  padding: 0.1rem 0.35rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-emb__word:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-emb__word.is-selected {
  color: var(--dl-accent-strong);
  font-weight: 700;
}

.dl-emb__word:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 1px;
}

.dl-emb__onehot {
  width: 1.7rem;
  height: 1.4rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--dl-border);
  border-radius: 3px;
  font-size: 0.8rem;
  color: var(--dl-muted);
}

.dl-emb__onehot.is-hot {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 700;
}

.dl-emb__row {
  display: flex;
  gap: 0;
  border-radius: 3px;
  transition: background 0.15s ease;
}

.dl-emb__row.is-selected {
  background: var(--dl-accent-soft);
  box-shadow: 0 0 0 1.5px var(--dl-accent);
}

.dl-emb__cell {
  width: 2.7rem;
  height: 1.4rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--dl-border);
  margin-right: -1px;
  font-size: 0.76rem;
  color: var(--dl-heading);
}

.dl-emb__cell.is-out {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  font-weight: 600;
}

.dl-emb__result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.dl-emb__arrow {
  font-size: 1.3rem;
  color: var(--dl-muted);
}

.dl-emb__out {
  display: flex;
}

.dl-emb__outcap {
  font-size: 0.72rem;
  color: var(--dl-muted);
  text-align: center;
  line-height: 1.3;
}

.dl-emb__scale {
  margin-top: 0.2rem;
}

.dl-emb__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.dl-emb__tabs button {
  padding: 0.22rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--dl-border);
  background: transparent;
  color: var(--dl-body);
  font: inherit;
  font-size: 0.76rem;
  cursor: pointer;
}

.dl-emb__tabs button:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-emb__tabs button.is-selected {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
}

.dl-emb__tabs button:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}
</style>
