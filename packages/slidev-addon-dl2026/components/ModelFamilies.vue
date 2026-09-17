<script setup lang="ts">
/*
 * The three things people mean by "a transformer".
 *
 * Almost every confusion a student has about BERT-versus-GPT dissolves once they
 * see that the architectural difference is *the mask*, not the layer. Same
 * blocks, same attention, same feed-forward network — one family lets every
 * position see every other, one forbids looking forward, and one keeps both and
 * bolts them together. So the mask grid is the first thing on each panel and
 * everything else on the panel is a consequence of it.
 *
 * The ordering is deliberate: encoder-only first because it is the easiest mask
 * to read, encoder-decoder last because it is the 2017 original and by then the
 * room can see it as a combination rather than as a new thing. The "what it
 * cannot do" row is there because that is what actually decides which one a
 * practitioner reaches for.
 */
import { computed, ref } from 'vue'

interface Family {
  key: string
  name: string
  shape: string
  /** 'full' every position sees every position; 'causal' no looking forward. */
  mask: 'full' | 'causal' | 'both'
  trained: string
  good: string
  bad: string
  examples: { name: string; year: number }[]
}

const FAMILIES: Family[] = [
  {
    key: 'enc',
    name: 'Encoder-only',
    shape: 'the encoder stack, on its own',
    mask: 'full',
    trained: 'Mask out 15% of the tokens and predict them from both sides — “masked language modelling”.',
    good: 'Understanding a text you already have in full: classification, sentiment, named entities, retrieval embeddings, reranking.',
    bad: 'Cannot generate. There is no notion of “next”, because every position was trained while seeing the future.',
    examples: [
      { name: 'BERT', year: 2018 },
      { name: 'RoBERTa', year: 2019 },
      { name: 'DeBERTa', year: 2020 },
      { name: 'ModernBERT', year: 2024 },
    ],
  },
  {
    key: 'dec',
    name: 'Decoder-only',
    shape: 'the decoder stack, with the cross-attention removed',
    mask: 'causal',
    trained: 'Predict the next token, over and over, on everything ever written. Every position is a training example, and no labels are needed.',
    good: 'Generation — and, as it turned out, nearly everything else, because any task phrased as text becomes next-token prediction.',
    bad: 'Each position only ever sees its left context, so a pure embedding of a whole sentence is weaker than an encoder’s.',
    examples: [
      { name: 'GPT-2', year: 2019 },
      { name: 'GPT-3', year: 2020 },
      { name: 'Llama', year: 2023 },
      { name: 'everything since', year: 2024 },
    ],
  },
  {
    key: 'encdec',
    name: 'Encoder–decoder',
    shape: 'the 2017 original, both stacks',
    mask: 'both',
    trained: 'Map one sequence to another: translation, summarisation, or a span-corruption objective that rewrites the whole task as text-to-text.',
    good: 'Problems with a clear source and a clear target, where the source should be read bidirectionally and the target written left to right.',
    bad: 'Two stacks to train and serve, and a strict source/target split that a general-purpose chat model does not want.',
    examples: [
      { name: 'the 2017 paper', year: 2017 },
      { name: 'T5', year: 2019 },
      { name: 'BART', year: 2019 },
      { name: 'Whisper', year: 2022 },
    ],
  },
]

const at = ref(1)
const family = computed(() => FAMILIES[at.value])

const N = 5

/** Whether query row i may read key column j, for the small mask picture. */
function visible(i: number, j: number, mask: 'full' | 'causal') {
  return mask === 'full' ? true : j <= i
}
</script>

<template>
  <WidgetFrame max-width="44rem">
    <div class="dl-fam">
      <div class="dl-fam__tabs" role="tablist">
        <button
          v-for="(f, i) in FAMILIES"
          :key="f.key"
          type="button"
          role="tab"
          class="dl-fam__tab"
          :class="{ 'is-current': i === at }"
          :aria-selected="i === at"
          @click="at = i"
        >
          <span class="dl-fam__tabname">{{ f.name }}</span>
          <span class="dl-fam__tabshape">{{ f.shape }}</span>
        </button>
      </div>

      <div class="dl-fam__panel">
        <!-- The mask is the difference, so it leads. -->
        <div class="dl-fam__masks">
          <div v-if="family.mask !== 'causal'" class="dl-fam__mask">
            <div class="dl-fam__maskcap">{{ family.mask === 'both' ? 'source' : 'all positions' }}</div>
            <div class="dl-fam__grid">
              <span
                v-for="n in N * N"
                :key="n"
                class="dl-fam__cell"
                :class="{ 'is-on': visible(Math.floor((n - 1) / N), (n - 1) % N, 'full') }"
              />
            </div>
            <div class="dl-fam__maskrole">sees both ways</div>
          </div>

          <div v-if="family.mask !== 'full'" class="dl-fam__mask">
            <div class="dl-fam__maskcap">{{ family.mask === 'both' ? 'target' : 'all positions' }}</div>
            <div class="dl-fam__grid">
              <span
                v-for="n in N * N"
                :key="n"
                class="dl-fam__cell"
                :class="{ 'is-on': visible(Math.floor((n - 1) / N), (n - 1) % N, 'causal') }"
              />
            </div>
            <div class="dl-fam__maskrole">left context only</div>
          </div>

          <div v-if="family.mask === 'both'" class="dl-fam__mask">
            <div class="dl-fam__maskcap">cross</div>
            <div class="dl-fam__grid">
              <span v-for="n in N * N" :key="n" class="dl-fam__cell is-on is-cross" />
            </div>
            <div class="dl-fam__maskrole">target reads all of source</div>
          </div>
        </div>

        <dl class="dl-fam__facts">
          <div>
            <dt>trained by</dt>
            <dd>{{ family.trained }}</dd>
          </div>
          <div>
            <dt>use it for</dt>
            <dd>{{ family.good }}</dd>
          </div>
          <div>
            <dt>cannot</dt>
            <dd>{{ family.bad }}</dd>
          </div>
        </dl>
      </div>

      <div class="dl-fam__examples">
        <span v-for="ex in family.examples" :key="ex.name" class="dl-fam__ex">
          {{ ex.name }}<span class="dl-fam__year">{{ ex.year }}</span>
        </span>
      </div>
    </div>

    <template #readout>
      <template v-if="family.key === 'dec'">
        One stack, one mask, one objective — and it ate the field. Not because it is the most
        expressive of the three, but because “predict the next token” needs <strong>no labelled
        data at all</strong>, so it is the only one of the three whose training set is the
        whole internet.
      </template>
      <template v-else-if="family.key === 'enc'">
        Still the right answer when you have the whole text and want a vector for it. A
        sentence-embedding or reranking model in production today is far more likely to be
        encoder-only than to be a chat model.
      </template>
      <template v-else>
        The original, and the one all three of these descend from. It is still what you want when
        the source and the target are genuinely different things — which is why speech
        recognition and translation kept it long after chat models stopped using it.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-fam {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
}

.dl-fam__tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.dl-fam__tab {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--dl-border);
  border-bottom: 3px solid var(--dl-border);
  border-radius: 5px;
  background: var(--dl-bg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dl-fam__tab:hover {
  border-color: var(--dl-accent);
}

.dl-fam__tab.is-current {
  background: var(--dl-surface);
  border-bottom-color: var(--dl-accent);
}

.dl-fam__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-fam__tabname {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--dl-muted);
}

.dl-fam__tab.is-current .dl-fam__tabname {
  color: var(--dl-accent);
}

.dl-fam__tabshape {
  font-size: 0.68rem;
  line-height: 1.25;
  color: var(--dl-muted);
}

.dl-fam__panel {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.dl-fam__masks {
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
}

.dl-fam__mask {
  text-align: center;
}

.dl-fam__maskcap {
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dl-muted);
  margin-bottom: 0.18rem;
}

.dl-fam__grid {
  display: grid;
  grid-template-columns: repeat(5, 0.62rem);
  gap: 2px;
}

.dl-fam__cell {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 1px;
  border: 1px solid var(--dl-border);
}

.dl-fam__cell.is-on {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
}

.dl-fam__cell.is-cross {
  background: var(--dl-accent-strong);
  border-color: var(--dl-accent-strong);
}

.dl-fam__maskrole {
  margin-top: 0.2rem;
  font-size: 0.6rem;
  color: var(--dl-muted);
  max-width: 5rem;
  line-height: 1.25;
}

.dl-fam__facts {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dl-fam__facts div {
  display: grid;
  grid-template-columns: 4.6rem 1fr;
  gap: 0.6rem;
  align-items: baseline;
}

.dl-fam__facts dt {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dl-muted);
  text-align: right;
}

.dl-fam__facts dd {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--dl-body);
}

.dl-fam__examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding-top: 0.45rem;
  border-top: 1px solid var(--dl-border);
}

.dl-fam__ex {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  padding: 0.12rem 0.5rem;
  border: 1px solid var(--dl-border);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--dl-heading);
  background: var(--dl-surface);
}

.dl-fam__year {
  font-size: 0.66rem;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}
</style>
