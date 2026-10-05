<script setup lang="ts">
/*
 * Lecture 05's running example, drawn the same way on every slide that uses it:
 * the review as a row of word tiles, read left to right.
 *
 *   A: "the movie was great"       → positive
 *   B: "the movie was not great"   → negative
 *
 * With `state`, each tile gets the recurrent layer's state after reading that
 * word, as two small bars: the *not*-flag (unit 1, 0 to 1) and the sentiment so
 * far (unit 2, −1 to 1). With `verdict`, the last column is P(positive). Every
 * number comes from `useRecurrence` (`REVIEW_RNN`), so this picture, the step
 * trace and the slides' arithmetic cannot disagree.
 *
 * `upto` reveals the state one word at a time — pass `:upto="$clicks"` so the
 * one-page-per-click PDF export shows real intermediate states. Static SVG, no
 * randomness, theme colours only, legible in both modes.
 */
import { computed } from 'vue'
import { num } from '../composables/useConvolution'
import { REVIEW_A, REVIEW_B, REVIEW_RNN, reviewInputs, rnnForward, sigmoid } from '../composables/useRecurrence'

const props = withDefaults(defineProps<{
  /** 'A', 'B', or an explicit list of words (unknown words embed as [0, 0]). */
  review?: 'A' | 'B' | string[]
  /** Draw the two state bars under each word. */
  state?: boolean
  /** Show P(positive) after the last word. */
  verdict?: boolean
  /** How many words have been read; later tiles are drawn faint. Default: all. */
  upto?: number
  /** Words to mark in the accent colour. */
  highlight?: string | string[]
  /** Width of the drawing in px; tiles shrink to fit long reviews. */
  width?: number
}>(), {
  review: 'B',
  state: false,
  verdict: false,
  width: 520,
})

const words = computed(() => props.review === 'A'
  ? REVIEW_A
  : props.review === 'B' ? REVIEW_B : props.review)

const steps = computed(() => rnnForward(reviewInputs(words.value), REVIEW_RNN))
const read = computed(() => Math.max(0, Math.min(props.upto ?? words.value.length, words.value.length)))
const probability = computed(() => sigmoid(steps.value[steps.value.length - 1].o[0]))
const marked = computed(() => new Set(([] as string[]).concat(props.highlight ?? [])))

/* ---- geometry ------------------------------------------------------------ */

const LEFT = computed(() => (props.state ? 64 : 4))
const VERDICT_W = computed(() => (props.verdict ? 96 : 0))
const GAP = 6
const pitch = computed(() =>
  Math.min(88, (props.width - LEFT.value - VERDICT_W.value - 4) / words.value.length))
const tileW = computed(() => pitch.value - GAP)
const TILE_Y = 6
const TILE_H = 30
const BAR_H = 12
const FLAG_Y = TILE_Y + TILE_H + 12
const MOOD_Y = FLAG_Y + BAR_H + 14
const height = computed(() => (props.state ? MOOD_Y + BAR_H + 6 : TILE_Y + TILE_H + 6))
const fontSize = computed(() => (tileW.value < 50 ? 10 : 13))

const x = (i: number) => LEFT.value + i * pitch.value
</script>

<template>
  <svg
    class="dl-wordstrip"
    :viewBox="`0 0 ${props.width} ${height}`"
    :style="{ maxWidth: `${props.width}px` }"
    role="img"
    :aria-label="`The review “${words.join(' ')}”${props.verdict ? `, P(positive) = ${num(probability)}` : ''}`"
  >
    <template v-if="props.state">
      <text class="dl-wordstrip__key" :x="LEFT - 8" :y="FLAG_Y + BAR_H - 2" text-anchor="end">not-flag</text>
      <text class="dl-wordstrip__key" :x="LEFT - 8" :y="MOOD_Y + BAR_H - 2" text-anchor="end">sentiment</text>
    </template>

    <g v-for="(w, i) in words" :key="i" :style="{ opacity: i < read ? 1 : 0.35 }">
      <rect
        class="dl-wordstrip__tile"
        :class="{ 'is-marked': marked.has(w) }"
        :x="x(i)" :y="TILE_Y" :width="tileW" :height="TILE_H" rx="4"
      />
      <text
        class="dl-wordstrip__word"
        :x="x(i) + tileW / 2" :y="TILE_Y + TILE_H / 2 + fontSize / 3"
        text-anchor="middle" :style="{ fontSize: `${fontSize}px` }"
      >{{ w }}</text>

      <template v-if="props.state">
        <!-- the not-flag, 0 to 1, grows from the left -->
        <rect class="dl-wordstrip__track" :x="x(i)" :y="FLAG_Y" :width="tileW" :height="BAR_H" rx="2" />
        <rect
          v-if="i < read && steps[i].h[0] > 0.005"
          class="dl-wordstrip__flag"
          :x="x(i)" :y="FLAG_Y" :width="tileW * steps[i].h[0]" :height="BAR_H" rx="2"
        />
        <!-- the sentiment, −1 to 1, grows either way from the middle -->
        <rect class="dl-wordstrip__track" :x="x(i)" :y="MOOD_Y" :width="tileW" :height="BAR_H" rx="2" />
        <rect
          v-if="i < read && Math.abs(steps[i].h[1]) > 0.005"
          :class="steps[i].h[1] > 0 ? 'dl-wordstrip__good' : 'dl-wordstrip__bad'"
          :x="steps[i].h[1] > 0 ? x(i) + tileW / 2 : x(i) + tileW / 2 * (1 + steps[i].h[1])"
          :y="MOOD_Y" :width="tileW / 2 * Math.abs(steps[i].h[1])" :height="BAR_H" rx="2"
        />
        <line class="dl-wordstrip__zero" :x1="x(i) + tileW / 2" :x2="x(i) + tileW / 2" :y1="MOOD_Y - 2" :y2="MOOD_Y + BAR_H + 2" />
      </template>
    </g>

    <g v-if="props.verdict" :style="{ opacity: read === words.length ? 1 : 0.35 }">
      <text class="dl-wordstrip__arrow" :x="props.width - VERDICT_W + 4" :y="TILE_Y + TILE_H / 2 + 5">→</text>
      <rect
        :class="probability >= 0.5 ? 'dl-wordstrip__verdict is-good' : 'dl-wordstrip__verdict is-bad'"
        :x="props.width - VERDICT_W + 24" :y="TILE_Y" :width="VERDICT_W - 26" :height="TILE_H" rx="4"
      />
      <text class="dl-wordstrip__word" :x="props.width - VERDICT_W / 2 + 11" :y="TILE_Y + TILE_H / 2 + 5" text-anchor="middle">
        {{ read === words.length ? num(probability) : '?' }}
      </text>
      <text class="dl-wordstrip__key" :x="props.width - VERDICT_W / 2 + 11" :y="TILE_Y + TILE_H + 14" text-anchor="middle">P(positive)</text>
    </g>
  </svg>
</template>

<style scoped>
.dl-wordstrip {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
  font-family: inherit;
}

.dl-wordstrip__tile {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1.4;
}

.dl-wordstrip__tile.is-marked {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 2;
}

.dl-wordstrip__word {
  fill: var(--dl-heading);
  font-size: 13px;
  font-weight: 600;
}

.dl-wordstrip__key {
  fill: var(--dl-muted);
  font-size: 10px;
}

.dl-wordstrip__track {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 0.8;
}

.dl-wordstrip__flag {
  fill: var(--dl-body);
}

.dl-wordstrip__good {
  fill: var(--dl-accent);
}

.dl-wordstrip__bad {
  fill: var(--dl-danger);
}

.dl-wordstrip__zero {
  stroke: var(--dl-muted);
  stroke-width: 1;
}

.dl-wordstrip__arrow {
  fill: var(--dl-body);
  font-size: 16px;
}

.dl-wordstrip__verdict.is-good {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 1.6;
}

.dl-wordstrip__verdict.is-bad {
  fill: var(--dl-surface);
  stroke: var(--dl-danger);
  stroke-width: 1.6;
}
</style>
