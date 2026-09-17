<script setup lang="ts">
/*
 * One output vector of one attention head, derived one line at a time.
 *
 * This is the deck's `RnnStepTrace` — the widget a student has to be able to
 * reproduce on paper before anything else in the lecture is worth teaching. Five
 * lines, three words, and every number checkable in your head:
 *
 *   score    q·k        0     2      0
 *   scale    ÷ √2       0     1.41   0
 *   softmax             0.16  0.67   0.16
 *   weigh    w·v        …
 *   sum      → out      [1.68, 0.33]
 *
 * Two decisions worth defending. The keys and values are shown *before* the walk
 * starts, greyed, because the argument is "the query is new at this step and the
 * keys and values are not" — hiding them makes the weighted sum look like it
 * appears from nowhere. And the sentence swap is on the same widget rather than
 * a second one: the payoff of the whole section is that pressing one button
 * changes `bank`'s output from [1.68, 0.33] to [0.33, 1.68] with every weight in
 * the model held fixed.
 */
import { computed, ref, watch } from 'vue'
import { num } from '../composables/useConvolution'
import type { SentenceKey } from '../composables/useAttention'
import { SENTENCES, selfAttention } from '../composables/useAttention'

const props = withDefaults(defineProps<{
  sentence?: SentenceKey
  /** Which token is asking. Defaults to `bank`, the one with the problem. */
  query?: number
  /** Offer the river/money swap. */
  switchable?: boolean
  causal?: boolean
}>(), {
  sentence: 'river',
  query: 2,
  switchable: true,
  causal: false,
})

const which = ref<SentenceKey>(props.sentence)
const at = ref(props.query)
const line = ref(0)

const LINES = 5

const result = computed(() => selfAttention(SENTENCES[which.value], props.causal))
const words = computed(() => result.value.words)
const row = computed(() => result.value.rows[Math.min(at.value, words.value.length - 1)])

/** Largest weight in the current row — the one the readout talks about. */
const focus = computed(() => {
  const w = row.value.weights
  const best = w.indexOf(Math.max(...w))
  return { index: best, word: words.value[best], weight: w[best] }
})

const atEnd = computed(() => line.value >= LINES)

function step() {
  line.value = atEnd.value ? 0 : line.value + 1
}

function pick(i: number) {
  at.value = i
  line.value = 0
}

function flip() {
  which.value = which.value === 'river' ? 'money' : 'river'
}

// Swapping the sentence mid-derivation would leave line 5 showing an output
// computed from the other sentence's values for one frame.
watch(which, () => { line.value = 0 })

/** Two decimals always, so the softmax row's columns line up. */
function weight(w: number) {
  return w.toFixed(2)
}

const STAGES = [
  'press Next step — the keys and values are already here, the query is what is new',
  'the query: one vector, and the only thing about this step that is new',
  'score it against every key — one dot product per position, including its own',
  'divide by √d_k, so the softmax does not saturate once d_k gets large',
  'softmax: the scores become weights that are positive and sum to exactly 1',
  'multiply each value by its weight and add them up — that is the new vector',
]

const caption = computed(() => STAGES[line.value])
</script>

<template>
  <WidgetFrame max-width="44rem">
    <div class="dl-att">
      <!-- Who is asking. -->
      <div class="dl-att__query">
        <span class="dl-att__qlabel">query</span>
        <button
          v-for="(w, i) in words"
          :key="w + i"
          type="button"
          class="dl-att__word"
          :class="{ 'is-current': i === at }"
          @click="pick(i)"
        >{{ w }}</button>
        <span v-if="line >= 1" class="dl-att__qvec">
          q = [{{ row.q.map(n => num(n)).join(', ') }}]
        </span>
      </div>

      <table class="dl-att__grid">
        <thead>
          <tr>
            <th class="dl-att__rowlabel" />
            <th v-for="(w, i) in words" :key="w + i" class="dl-att__col" :class="{ 'is-focus': line >= 4 && i === focus.index }">
              {{ w }}
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Present from the start: these are not recomputed per query. -->
          <tr class="dl-att__given">
            <th class="dl-att__rowlabel">key</th>
            <td v-for="(kv, i) in result.k" :key="`k${i}`">[{{ kv.map(n => num(n)).join(', ') }}]</td>
          </tr>
          <tr class="dl-att__given">
            <th class="dl-att__rowlabel">value</th>
            <td v-for="(vv, i) in result.v" :key="`v${i}`">[{{ vv.map(n => num(n)).join(', ') }}]</td>
          </tr>

          <tr v-if="line >= 2" class="dl-att__step">
            <th class="dl-att__rowlabel"><span class="dl-att__n">1</span> q · k</th>
            <td v-for="(s, i) in row.raw" :key="`s${i}`">{{ num(s) }}</td>
          </tr>
          <tr v-if="line >= 3" class="dl-att__step">
            <th class="dl-att__rowlabel"><span class="dl-att__n">2</span> ÷ √d<sub>k</sub></th>
            <td v-for="(s, i) in row.scaled" :key="`c${i}`">
              {{ s === null ? '−∞' : num(s) }}
            </td>
          </tr>
          <tr v-if="line >= 4" class="dl-att__step is-weights">
            <th class="dl-att__rowlabel"><span class="dl-att__n">3</span> softmax</th>
            <td v-for="(w, i) in row.weights" :key="`w${i}`">
              <div class="dl-att__weight">{{ weight(w) }}</div>
              <div class="dl-att__bar"><span :style="{ width: `${w * 100}%` }" /></div>
            </td>
          </tr>
          <tr v-if="line >= 5" class="dl-att__step">
            <th class="dl-att__rowlabel"><span class="dl-att__n">4</span> w · v</th>
            <td v-for="(t, i) in row.terms" :key="`t${i}`">[{{ t.map(n => num(n)).join(', ') }}]</td>
          </tr>
        </tbody>
      </table>

      <!-- Height reserved whether or not line 5 is showing, so the widget does
           not walk down the slide as the room clicks through it. -->
      <div class="dl-att__out" :class="{ 'is-empty': line < LINES }">
        <template v-if="line >= LINES">
          <span class="dl-att__n">5</span>
          <span class="dl-att__sum">sum</span>
          <span class="dl-att__arrow">→</span>
          <span class="dl-att__outlabel">{{ row.word }}′ =</span>
          <span class="dl-att__outvec">
            <span v-for="(o, d) in row.out" :key="d" class="dl-att__outcell">{{ num(o) }}</span>
          </span>
        </template>
      </div>
    </div>

    <template #controls>
      <StepButton :label="atEnd ? 'Start over' : 'Next step'" glyph="▸" @click="step" />
      <StepButton
        v-if="props.switchable"
        :label="which === 'river' ? 'Swap river → money' : 'Swap money → river'"
        variant="ghost" glyph="⇄" @click="flip"
      />
    </template>

    <template #readout>
      <template v-if="line < LINES">
        Line {{ line }} of {{ LINES }} — {{ caption }}.
      </template>
      <template v-else>
        <strong>{{ row.word }}</strong> reads <strong>{{ focus.word }}</strong> with
        {{ weight(focus.weight) }} of its attention, and comes out as
        [{{ row.out.map(n => num(n)).join(', ') }}].
        <span v-if="row.word === 'bank'" class="dl-att__note">
          Press <em>Swap</em>. The four matrices do not change and neither does the word — only
          its neighbour does — and <em>bank</em>’s output flips to
          [{{ [...row.out].reverse().map(n => num(n)).join(', ') }}]. That is what “contextual”
          means, and it is the entire reason this mechanism exists.
        </span>
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-att {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
}

.dl-att__query {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dl-att__qlabel {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dl-muted);
  margin-right: 0.1rem;
}

.dl-att__word {
  padding: 0.14rem 0.7rem;
  border: 1px solid var(--dl-border);
  border-radius: 5px;
  background: var(--dl-bg);
  color: var(--dl-body);
  font: inherit;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dl-att__word:hover {
  border-color: var(--dl-accent);
}

.dl-att__word.is-current {
  background: var(--dl-accent);
  border-color: var(--dl-accent-strong);
  color: #fff;
  font-weight: 600;
}

.dl-att__word:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-att__qvec {
  margin-left: 0.4rem;
  font-size: 0.82rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--dl-accent);
}

.dl-att__grid {
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
  /* Fixed so the columns do not resize as longer numbers appear line by line. */
  table-layout: fixed;
  width: 100%;
  max-width: 34rem;
}

.dl-att__grid th,
.dl-att__grid td {
  text-align: center;
  padding: 0.16rem 0.2rem;
  font-size: 0.85rem;
  color: var(--dl-heading);
}

.dl-att__rowlabel {
  width: 6.2rem;
  text-align: right !important;
  font-size: 0.78rem !important;
  font-weight: 500;
  color: var(--dl-muted) !important;
  white-space: nowrap;
}

.dl-att__n {
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

.dl-att__col {
  font-size: 0.9rem !important;
  font-weight: 600;
  border-bottom: 2px solid var(--dl-border);
  padding-bottom: 0.2rem !important;
}

.dl-att__col.is-focus {
  color: var(--dl-accent) !important;
  border-bottom-color: var(--dl-accent);
}

.dl-att__given td {
  color: var(--dl-muted);
  font-size: 0.76rem;
}

.dl-att__step td {
  font-weight: 600;
}

.dl-att__weight {
  font-weight: 700;
}

.dl-att__bar {
  height: 4px;
  margin: 0.1rem auto 0;
  width: 84%;
  border-radius: 2px;
  background: var(--dl-border);
  overflow: hidden;
}

.dl-att__bar span {
  display: block;
  height: 100%;
  background: var(--dl-accent);
  transition: width 0.25s ease;
}

.dl-att__out {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.2rem;
  margin-top: 0.15rem;
  padding-top: 0.3rem;
  border-top: 1px solid var(--dl-border);
  width: 100%;
  max-width: 34rem;
  justify-content: center;
}

.dl-att__out.is-empty {
  border-top-color: transparent;
}

.dl-att__sum {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-att__arrow {
  color: var(--dl-muted);
}

.dl-att__outlabel {
  font-size: 0.95rem;
  font-style: italic;
  font-weight: 600;
  color: var(--dl-heading);
}

.dl-att__outvec {
  display: flex;
  gap: 0.3rem;
}

.dl-att__outcell {
  width: 3.6rem;
  padding: 0.16rem 0;
  text-align: center;
  border: 1px solid var(--dl-accent);
  border-radius: 4px;
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-size: 0.92rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dl-att__note {
  display: block;
  margin-top: 0.15rem;
  color: var(--dl-accent);
}
</style>
