<script setup lang="ts">
/*
 * Why one head is not enough — four heads, one query, four different answers.
 *
 * The argument only works if all four rows are on screen together. Shown one at
 * a time it reads as "here is an attention pattern, and here is another one";
 * stacked, with the same word asking in every row, it reads as "this word needs
 * four different questions answered about it and a single softmax can only
 * answer one", which is the actual reason for multi-head attention.
 *
 * Stop on `it`. Head 1 takes the previous word, head 2 takes the nearby nouns,
 * head 3 takes *cat* — the thing `it` refers to, seven words back — and head 4
 * parks on the first token and contributes nothing. That last row is not a joke:
 * attention sinks on the first token are a well-replicated finding, and a
 * lecture that shows four heads all doing something tidy is teaching a fiction.
 *
 * The weights here are drawn, not trained. The deck says so on the slide; the
 * widget says so in its readout. A four-dimensional toy model does not produce
 * interpretable heads and pretending otherwise would be worse than useless.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'
import { HEADS, LONG_SENTENCE } from '../composables/useAttention'

const props = withDefaults(defineProps<{
  /** Which token asks first. 6 is `it`, the interesting one. */
  query?: number
  /** Total model width, for the concat arithmetic in the footer. */
  dModel?: number
}>(), {
  query: 6,
  dModel: 512,
})

const at = ref(props.query)
/** null = every head at once, which is the view the slide is for. */
const solo = ref<number | null>(null)

const words = LONG_SENTENCE

const heads = computed(() =>
  HEADS.map((h, i) => ({
    ...h,
    index: i,
    weights: h.weights[at.value],
    top: h.weights[at.value].indexOf(Math.max(...h.weights[at.value])),
  })))

const shown = computed(() =>
  solo.value === null ? heads.value : [heads.value[solo.value]])

const dHead = computed(() => Math.round(props.dModel / HEADS.length))

function nextWord() {
  at.value = (at.value + 1) % words.length
}

/** Only positions the causal mask leaves open are drawn, so the row ends where it should. */
function live(i: number) {
  return i <= at.value
}
</script>

<template>
  <WidgetFrame max-width="45rem">
    <div class="dl-mh">
      <!-- The sentence, and which word is asking. -->
      <div class="dl-mh__sentence">
        <span class="dl-mh__label">query</span>
        <button
          v-for="(w, i) in words"
          :key="w + i"
          type="button"
          class="dl-mh__word"
          :class="{ 'is-current': i === at }"
          @click="at = i"
        >{{ w }}</button>
      </div>

      <!-- One row per head: the same question, four different answers. -->
      <div class="dl-mh__rows">
        <div v-for="head in shown" :key="head.name" class="dl-mh__row">
          <button
            type="button"
            class="dl-mh__headname"
            :class="{ 'is-solo': solo === head.index }"
            @click="solo = solo === head.index ? null : head.index"
          >
            <span class="dl-mh__headlabel">{{ head.name }}</span>
            <span class="dl-mh__headreads">{{ head.reads }}</span>
          </button>

          <div class="dl-mh__bars">
            <div
              v-for="(w, i) in head.weights"
              :key="i"
              class="dl-mh__bar"
              :class="{ 'is-top': i === head.top && live(i), 'is-dead': !live(i) }"
              :title="`${words[i]}: ${num(w)}`"
            >
              <span class="dl-mh__fill" :style="{ height: `${live(i) ? w * 100 : 0}%` }" />
            </div>
          </div>

          <div class="dl-mh__reads">
            <template v-if="head.weights[head.top] > 0.4">→ <strong>{{ words[head.top] }}</strong></template>
            <template v-else>→ spread</template>
          </div>
        </div>
      </div>

      <!-- What happens to the four outputs. -->
      <div class="dl-mh__concat">
        <span v-for="head in heads" :key="`c${head.index}`" class="dl-mh__slice">{{ dHead }}</span>
        <span class="dl-mh__op">concat →</span>
        <span class="dl-mh__whole">{{ props.dModel }}</span>
        <span class="dl-mh__op">× W<sub>O</sub> →</span>
        <span class="dl-mh__whole is-out">{{ props.dModel }}</span>
      </div>
    </div>

    <template #controls>
      <StepButton label="Next query word" glyph="▸" @click="nextWord" />
      <StepButton
        v-if="solo !== null" label="All heads" variant="ghost" glyph="▦" @click="solo = null"
      />
    </template>

    <template #readout>
      <template v-if="at === 6">
        <strong>it</strong> asks four questions at once: head 1 takes the word before it, head 2
        the nearby nouns, head 3 goes back seven words to <strong>cat</strong> — what
        <em>it</em> refers to — and head 4 parks on the first token. One softmax puts its mass in
        one place, so one head could answer only one of those.
        <span class="dl-mh__note">
          Head 4 is not a drawing error: heads that sit almost entirely on the first token turn
          up in every trained model. Nothing after <em>it</em> is drawn because this is a
          decoder, which may not look forward — section 03.
        </span>
      </template>
      <template v-else>
        <strong>{{ words[at] }}</strong> asking, four heads answering differently:
        <template v-for="(head, i) in heads" :key="head.name">
          <template v-if="i > 0">, </template>
          {{ head.name }} → <strong>{{ words[head.top] }}</strong>
        </template>.
        Each head is its own W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub> at width
        {{ dHead }} = {{ props.dModel }}/{{ HEADS.length }}, so all
        {{ HEADS.length }} together cost exactly what one head of width
        {{ props.dModel }} would.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-mh {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.dl-mh__sentence {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-wrap: wrap;
}

.dl-mh__label {
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dl-muted);
  margin-right: 0.35rem;
}

.dl-mh__word {
  padding: 0.1rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--dl-body);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.dl-mh__word:hover {
  border-color: var(--dl-accent);
}

.dl-mh__word.is-current {
  background: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-mh__word:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 1px;
}

.dl-mh__rows {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dl-mh__row {
  display: grid;
  grid-template-columns: 8.6rem 1fr 4.2rem;
  align-items: center;
  gap: 0.6rem;
}

.dl-mh__headname {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.1rem 0.3rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dl-mh__headname:hover,
.dl-mh__headname.is-solo {
  border-color: var(--dl-accent);
}

.dl-mh__headname:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 1px;
}

.dl-mh__headlabel {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--dl-accent);
}

.dl-mh__headreads {
  font-size: 0.63rem;
  line-height: 1.2;
  color: var(--dl-muted);
}

.dl-mh__bars {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 3px;
  height: 1.75rem;
}

.dl-mh__bar {
  position: relative;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid var(--dl-border);
  background: var(--dl-surface);
  border-radius: 2px 2px 0 0;
}

.dl-mh__bar.is-dead {
  background: transparent;
}

.dl-mh__fill {
  width: 100%;
  background: var(--dl-accent);
  opacity: 0.55;
  border-radius: 2px 2px 0 0;
  transition: height 0.25s ease;
}

.dl-mh__bar.is-top .dl-mh__fill {
  opacity: 1;
}

.dl-mh__reads {
  font-size: 0.78rem;
  color: var(--dl-body);
  white-space: nowrap;
}

.dl-mh__concat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.15rem;
  padding-top: 0.3rem;
  border-top: 1px solid var(--dl-border);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-muted);
}

.dl-mh__slice {
  padding: 0.1rem 0.5rem;
  border: 1px solid var(--dl-border);
  border-radius: 3px;
  background: var(--dl-surface);
}

.dl-mh__op {
  margin: 0 0.2rem;
}

.dl-mh__whole {
  padding: 0.1rem 0.9rem;
  border: 1px solid var(--dl-border);
  border-radius: 3px;
  background: var(--dl-surface);
}

.dl-mh__whole.is-out {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-mh__note {
  display: block;
  margin-top: 0.15rem;
  color: var(--dl-accent);
}
</style>
