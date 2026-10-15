<script setup lang="ts">
/*
 * Self-attention on "Thinking Machines", in the six steps of Alammar's
 * *The Illustrated Transformer*: make q, k and v; score; divide by √d_k;
 * softmax; weigh the values; add them up.
 *
 * Two words, d_model = 4, d_k = 2, every number small enough to check by hand
 * (see composables/useIllustrated.ts). One column per word, one row per step,
 * so the picture builds downwards the way the post's figure does.
 *
 * Pass `:step="$clicks"` and declare `clicks: 6` on the slide so the
 * one-page-per-click PDF export shows each step. The buttons still work in
 * the live deck; the next slide click hands control back to the deck.
 */
import { computed, ref, watch } from 'vue'
import { num } from '../composables/useConvolution'
import { TM_DK, TM_WORDS, TM_X, thinkingMachines } from '../composables/useIllustrated'

const props = withDefaults(defineProps<{
  /** Which word asks: 0 = Thinking, 1 = Machines. */
  query?: number
  /** Steps shown, 0–6. Usually `$clicks`. */
  step?: number
  switchable?: boolean
}>(), {
  query: 0,
  step: 0,
  switchable: true,
})

const STEPS = 6
const at = ref(props.query)
const manual = ref<number | null>(null)
const line = computed(() => Math.min(STEPS, Math.max(0, manual.value ?? props.step)))

watch(() => props.step, () => { manual.value = null })

const data = thinkingMachines()
const row = computed(() => data.rows[at.value])
const atEnd = computed(() => line.value >= STEPS)

function next() {
  manual.value = atEnd.value ? 0 : line.value + 1
}

function pick(i: number) {
  at.value = i
}

const vec = (v: number[]) => `[${v.map(n => num(n)).join(', ')}]`

const CAPTIONS = [
  'two words, each a vector of four numbers — nothing computed yet',
  'step 1: every word makes a query, a key and a value (x times W_Q, W_K, W_V)',
  `step 2: score — the asking word's query dotted with every key`,
  `step 3: divide each score by √d_k = √${TM_DK}`,
  'step 4: softmax — weights that are positive and add up to 1',
  'step 5: multiply each value by its weight',
  'step 6: add the weighted values — the layer’s output for this word',
]
</script>

<template>
  <WidgetFrame max-width="46rem">
    <div class="dl-sas">
      <div class="dl-sas__ask">
        <span class="dl-sas__label">asking word</span>
        <button
          v-for="(w, i) in TM_WORDS"
          :key="w"
          type="button"
          class="dl-sas__word"
          :class="{ 'is-current': i === at }"
          :disabled="!props.switchable && i !== at"
          @click="pick(i)"
        >{{ w }}</button>
      </div>

      <table class="dl-sas__grid">
        <thead>
          <tr>
            <th class="dl-sas__rl" />
            <th v-for="(w, j) in TM_WORDS" :key="w" class="dl-sas__col" :class="{ 'is-ask': j === at }">{{ w }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class="dl-sas__rl">embedding x</th>
            <td v-for="(x, j) in TM_X" :key="`x${j}`" class="is-given">{{ vec(x) }}</td>
          </tr>
          <tr :class="{ 'is-hidden': line < 1 }">
            <th class="dl-sas__rl"><span class="dl-sas__n">1</span> query q</th>
            <td v-for="(q, j) in data.q" :key="`q${j}`" :class="{ 'is-ask': j === at }">{{ vec(q) }}</td>
          </tr>
          <tr :class="{ 'is-hidden': line < 1 }">
            <th class="dl-sas__rl">key k</th>
            <td v-for="(k, j) in data.k" :key="`k${j}`">{{ vec(k) }}</td>
          </tr>
          <tr :class="{ 'is-hidden': line < 1 }">
            <th class="dl-sas__rl">value v</th>
            <td v-for="(v, j) in data.v" :key="`v${j}`">{{ vec(v) }}</td>
          </tr>
          <tr :class="{ 'is-hidden': line < 2 }" class="is-step">
            <th class="dl-sas__rl"><span class="dl-sas__n">2</span> score q · k</th>
            <td v-for="(s, j) in row.raw" :key="`s${j}`">{{ num(s) }}</td>
          </tr>
          <tr :class="{ 'is-hidden': line < 3 }" class="is-step">
            <th class="dl-sas__rl"><span class="dl-sas__n">3</span> ÷ √2</th>
            <td v-for="(s, j) in row.scaled" :key="`c${j}`">{{ num(s) }}</td>
          </tr>
          <tr :class="{ 'is-hidden': line < 4 }" class="is-step">
            <th class="dl-sas__rl"><span class="dl-sas__n">4</span> softmax</th>
            <td v-for="(w, j) in row.weights" :key="`w${j}`">
              <div>{{ w.toFixed(2) }}</div>
              <div class="dl-sas__bar"><span :style="{ width: `${w * 100}%` }" /></div>
            </td>
          </tr>
          <tr :class="{ 'is-hidden': line < 5 }" class="is-step">
            <th class="dl-sas__rl"><span class="dl-sas__n">5</span> weight × v</th>
            <td v-for="(t, j) in row.terms" :key="`t${j}`">{{ vec(t) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="dl-sas__out" :class="{ 'is-hidden': line < 6 }">
        <span class="dl-sas__n">6</span>
        <span class="dl-sas__label">sum</span>
        <span>→</span>
        <span class="dl-sas__z">z<sub>{{ at + 1 }}</sub> = {{ vec(row.z) }}</span>
      </div>
    </div>

    <template #controls>
      <StepButton :label="atEnd ? 'Start over' : 'Next step'" glyph="▸" @click="next" />
    </template>

    <template #readout>
      <template v-if="!atEnd">
        {{ CAPTIONS[line] }}.
      </template>
      <template v-else>
        <strong>{{ row.word }}</strong> gives {{ row.weights[at].toFixed(2) }} of its attention to itself
        and {{ row.weights[1 - at].toFixed(2) }} to <strong>{{ TM_WORDS[1 - at] }}</strong>. Its output
        z<sub>{{ at + 1 }}</sub> = {{ vec(row.z) }} is mostly <em>{{ TM_WORDS[row.weights[0] >= row.weights[1] ? 0 : 1] }}</em>’s value.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-sas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
}

.dl-sas__ask {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dl-sas__label {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-sas__word {
  padding: 0.12rem 0.7rem;
  border: 1px solid var(--dl-border);
  border-radius: 5px;
  background: var(--dl-bg);
  color: var(--dl-body);
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
}

.dl-sas__word.is-current {
  background: var(--dl-accent);
  border-color: var(--dl-accent-strong);
  color: #fff;
  font-weight: 600;
}

.dl-sas__word:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-sas__grid {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  max-width: 34rem;
  font-variant-numeric: tabular-nums;
}

.dl-sas__grid th,
.dl-sas__grid td {
  text-align: center;
  padding: 0.1rem 0.25rem;
  font-size: 0.84rem;
  color: var(--dl-heading);
}

.dl-sas__rl {
  width: 8.4rem;
  text-align: right !important;
  font-size: 0.76rem !important;
  font-weight: 500;
  color: var(--dl-muted) !important;
  white-space: nowrap;
}

.dl-sas__col {
  font-weight: 600;
  border-bottom: 2px solid var(--dl-border);
}

.dl-sas__col.is-ask {
  color: var(--dl-accent) !important;
  border-bottom-color: var(--dl-accent);
}

.dl-sas__grid td.is-given {
  color: var(--dl-muted);
}

.dl-sas__grid td.is-ask {
  color: var(--dl-accent-strong);
  font-weight: 700;
}

.dl-sas__grid tr.is-step td {
  font-weight: 600;
}

/* Hidden rows keep their height, so the widget does not grow as the room clicks. */
.is-hidden {
  visibility: hidden;
}

.dl-sas__n {
  display: inline-grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  margin-right: 0.25rem;
  border-radius: 50%;
  background: var(--dl-accent-soft);
  color: var(--dl-accent);
  font-size: 0.62rem;
  font-weight: 700;
  vertical-align: middle;
}

.dl-sas__bar {
  height: 4px;
  width: 80%;
  margin: 0.1rem auto 0;
  border-radius: 2px;
  background: var(--dl-border);
  overflow: hidden;
}

.dl-sas__bar span {
  display: block;
  height: 100%;
  background: var(--dl-accent);
}

.dl-sas__out {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding-top: 0.3rem;
  border-top: 1px solid var(--dl-border);
  width: 100%;
  max-width: 34rem;
  justify-content: center;
}

.dl-sas__z {
  padding: 0.12rem 0.6rem;
  border: 1px solid var(--dl-accent);
  border-radius: 4px;
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
