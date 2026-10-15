<script setup lang="ts">
/*
 * What does *it* read? Alammar's sentence, "The animal didn't cross the street
 * because it was too tired", drawn the way his figure draws it: the words
 * twice, the asking word on the right, a line to every word on the left as
 * thick as the attention weight.
 *
 * Two heads. Head 1 resolves the reference (*it* → *animal*), head 2 reads
 * what is said about it (*it* → *tired*). The weights are drawn by hand, not
 * trained — the readout says so — and only the row for *it* carries a story.
 * `head="both"` overlays the two, which is the multi-head slide's picture.
 */
import { computed, ref } from 'vue'
import { IT_HEADS, IT_QUERY, IT_SENTENCE } from '../composables/useIllustrated'

const props = withDefaults(defineProps<{
  head?: 0 | 1 | 'both'
  /** Offer the head buttons. */
  switchable?: boolean
  /** Offer moving the asking word. */
  movable?: boolean
}>(), {
  head: 0,
  switchable: true,
  movable: true,
})

const which = ref<0 | 1 | 'both'>(props.head)
const at = ref(IT_QUERY)

const ROW = 21
const TOP = 16
const KEY_X = 150
const Q_X = 330

const heads = computed(() => (which.value === 'both' ? [0, 1] : [which.value]))

const lines = computed(() => heads.value.flatMap(h => IT_HEADS[h][at.value].map((w, j) => ({
  h,
  j,
  w,
  y: TOP + j * ROW,
}))))

function top(h: number) {
  const row = IT_HEADS[h][at.value]
  const j = row.indexOf(Math.max(...row))
  return { word: IT_SENTENCE[j], w: row[j] }
}

function move(d: number) {
  at.value = (at.value + d + IT_SENTENCE.length) % IT_SENTENCE.length
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.stopPropagation()
    e.preventDefault()
    move(e.key === 'ArrowUp' ? -1 : 1)
  }
}
</script>

<template>
  <WidgetFrame max-width="40rem">
    <svg
      viewBox="0 0 460 250" class="dl-ita" role="img" tabindex="0"
      :aria-label="`Attention of '${IT_SENTENCE[at]}' over the sentence`"
      @keydown="onKey"
    >
      <line
        v-for="l in lines" :key="`${l.h}-${l.j}-${at}`"
        :x1="Q_X - 8" :y1="TOP + at * ROW - 4" :x2="KEY_X + 8" :y2="l.y - 4"
        class="dl-ita__line" :class="{ 'is-h2': l.h === 1 }"
        :style="{ strokeWidth: 0.6 + l.w * 16, opacity: 0.25 + l.w * 1.5 }"
      />
      <text
        v-for="(w, j) in IT_SENTENCE" :key="`k${j}`"
        :x="KEY_X" :y="TOP + j * ROW" text-anchor="end" class="dl-ita__word"
      >{{ w }}</text>
      <text
        v-for="(w, j) in IT_SENTENCE" :key="`q${j}`"
        :x="Q_X" :y="TOP + j * ROW" class="dl-ita__word" :class="{ 'is-ask': j === at }"
        @click="at = j"
      >{{ w }}</text>
      <text x="20" y="245" class="dl-ita__small">read (keys)</text>
      <text :x="Q_X" y="245" class="dl-ita__small">asking (query)</text>
    </svg>

    <template #controls>
      <template v-if="props.switchable">
        <StepButton label="Head 1" :variant="which === 0 ? 'primary' : 'ghost'" @click="which = 0" />
        <StepButton label="Head 2" :variant="which === 1 ? 'primary' : 'ghost'" @click="which = 1" />
        <StepButton label="Both" :variant="which === 'both' ? 'primary' : 'ghost'" @click="which = 'both'" />
      </template>
      <template v-if="props.movable">
        <StepButton label="Previous word" variant="ghost" glyph="↑" @click="move(-1)" />
        <StepButton label="Next word" variant="ghost" glyph="↓" @click="move(1)" />
      </template>
    </template>

    <template #readout>
      <template v-for="h in heads" :key="h">
        <span :class="h === 1 ? 'dl-ita__h2' : 'dl-ita__h1'">Head {{ h + 1 }}</span>:
        <strong>{{ IT_SENTENCE[at] }}</strong> reads <strong>{{ top(h).word }}</strong>
        most ({{ top(h).w.toFixed(2) }}).
      </template>
      <span class="dl-ita__note">Weights drawn by hand to show the idea, not taken from a trained model.</span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-ita {
  width: 100%;
  max-width: 30rem;
  height: auto;
  outline: none;
}

.dl-ita:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-ita__line {
  stroke: var(--dl-accent);
  stroke-linecap: round;
}

.dl-ita__line.is-h2 {
  stroke: var(--dl-k);
}

.dl-ita__word {
  fill: var(--dl-heading);
  font-size: 14px;
  cursor: pointer;
}

.dl-ita__word.is-ask {
  fill: var(--dl-q);
  font-weight: 700;
}

.dl-ita__small {
  fill: var(--dl-muted);
  font-size: 11px;
}

.dl-ita__h2 {
  color: var(--dl-k);
}

.dl-ita__h1 {
  color: var(--dl-accent);
}

/* The lines grow in from the asking word whenever it or the head changes. */
@media (prefers-reduced-motion: no-preference) {
  .dl-ita__line {
    stroke-dasharray: 400;
    animation: dl-ita-draw 0.9s ease-out both;
  }
}

@keyframes dl-ita-draw {
  from { stroke-dashoffset: 400; }
  to { stroke-dashoffset: 0; }
}

.dl-ita__note {
  display: block;
  color: var(--dl-muted);
  font-size: 0.85em;
}
</style>
