<script setup lang="ts">
/*
 * Every query at once — the T x T grid that *is* the attention layer.
 *
 * `AttentionTrace` derives one row. This is the same arithmetic for all of them,
 * which is what turns three separate dot products into `softmax(QKᵀ/√d_k)V` and
 * makes the parallelism claim visible: nothing in the grid depends on anything
 * else in the grid, so the whole thing is one matrix multiply.
 *
 * Two modes, because the mask is worth showing twice:
 *
 *   mode="weights"  the real 3 x 3, every number computed, causal on or off.
 *                   With the mask on, row `the` collapses to a single 1.00 —
 *                   the first token has nothing to look at but itself.
 *   mode="mask"     nine words, no numbers. The triangle, at a length where it
 *                   looks like a triangle rather than a corner.
 *
 * Rows are queries and columns are keys, and that is stated on the widget rather
 * than left to the caption, because half of any room will otherwise read it the
 * other way round and silently disbelieve everything that follows.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'
import type { SentenceKey } from '../composables/useAttention'
import { LONG_SENTENCE, SENTENCES, selfAttention } from '../composables/useAttention'

const props = withDefaults(defineProps<{
  mode?: 'weights' | 'mask'
  sentence?: SentenceKey
  /** Start with the causal mask applied. */
  causal?: boolean
  /** Offer the causal toggle at all. */
  maskable?: boolean
  switchable?: boolean
}>(), {
  mode: 'weights',
  sentence: 'river',
  causal: false,
  maskable: true,
  switchable: false,
})

const which = ref<SentenceKey>(props.sentence)
const masked = ref(props.causal)
/** Which row the readout is talking about. */
const at = ref<number | null>(null)

const words = computed(() =>
  props.mode === 'mask' ? LONG_SENTENCE : SENTENCES[which.value])

const result = computed(() => selfAttention(SENTENCES[which.value], masked.value))

/** The grid, as plain numbers — computed weights, or 1/0 for the mask picture. */
const grid = computed<number[][]>(() => {
  if (props.mode === 'mask')
    return words.value.map((_, i) => words.value.map((__, j) => (j <= i ? 1 : 0)))
  return result.value.rows.map(r => r.weights)
})

const visibleCount = computed(() =>
  grid.value.reduce((total, row) => total + row.filter(v => v > 0).length, 0))

const cellCount = computed(() => words.value.length ** 2)

const active = computed(() => (at.value === null ? null : result.value.rows[at.value]))

/*
 * Two decimals always, even for 0.50 — `num` drops the trailing zero, and in a
 * grid of weights that makes one column visibly narrower than its neighbours.
 */
function weight(w: number) {
  return w.toFixed(2)
}

function shade(w: number) {
  // Attention weights live in (0, 1) and the interesting ones sit near 0.7, so a
  // linear alpha leaves the whole grid looking uniformly pale. The square root
  // pulls the midtones apart without inventing contrast at the top end.
  return props.mode === 'mask' ? (w > 0 ? 0.55 : 0) : Math.sqrt(w) * 0.92
}
</script>

<template>
  <WidgetFrame max-width="40rem">
    <div class="dl-amx" :class="`is-${props.mode}`">
      <div class="dl-amx__axes">
        <span class="dl-amx__axis">rows ask</span>
        <span class="dl-amx__axis is-cols">columns are read</span>
      </div>

      <table class="dl-amx__grid">
        <thead>
          <tr>
            <th />
            <th v-for="(w, j) in words" :key="`h${j}`" class="dl-amx__colhead">{{ w }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(rowWeights, i) in grid"
            :key="`r${i}`"
            :class="{ 'is-active': at === i }"
            @mouseenter="at = i"
            @mouseleave="at = null"
          >
            <th class="dl-amx__rowhead">{{ words[i] }}</th>
            <td
              v-for="(w, j) in rowWeights"
              :key="`c${j}`"
              class="dl-amx__cell"
              :class="{ 'is-blocked': w === 0 && (masked || props.mode === 'mask') }"
            >
              <span class="dl-amx__fill" :style="{ opacity: shade(w) }" />
              <span class="dl-amx__text" :class="{ 'is-strong': w > 0.45 }">
                {{ props.mode === 'mask' ? (w > 0 ? '' : '×') : (w === 0 ? '×' : weight(w)) }}
              </span>
            </td>
            <td v-if="props.mode === 'weights'" class="dl-amx__sum">
              = {{ weight(rowWeights.reduce((a, b) => a + b, 0)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #controls>
      <StepButton
        v-if="props.maskable && props.mode === 'weights'"
        :label="masked ? 'Remove the mask' : 'Apply the causal mask'"
        :variant="masked ? 'ghost' : 'primary'"
        glyph="◺"
        @click="masked = !masked"
      />
      <StepButton
        v-if="props.switchable && props.mode === 'weights'"
        :label="which === 'river' ? 'Swap river → money' : 'Swap money → river'"
        variant="ghost" glyph="⇄" @click="which = which === 'river' ? 'money' : 'river'"
      />
    </template>

    <template #readout>
      <template v-if="props.mode === 'mask'">
        {{ words.length }} words, so {{ cellCount }} cells — and the mask throws away
        <strong>{{ cellCount - visibleCount }}</strong> of them. Position <em>t</em> may read
        positions 1…<em>t</em> and nothing later, so row 1 has one live cell and the last row
        has {{ words.length }}. The scores are still <em>all</em> computed and then set to −∞
        before the softmax: masking saves no work, it only removes the answer.
      </template>
      <template v-else-if="active">
        <strong>{{ active.word }}</strong> spreads its attention as
        [{{ active.weights.map(n => weight(n)).join(', ') }}], and those add to exactly 1 — that is
        the softmax's doing, and it is why the output is an <em>average</em> of values rather
        than a sum that grows with the sentence.
      </template>
      <template v-else-if="masked">
        With the mask on, row <em>the</em> is a single <strong>1.00</strong>: the first token has
        nothing to look at but itself. Every row still sums to 1, because the softmax is taken
        after the blocked scores are set to −∞.
      </template>
      <template v-else>
        Nine numbers, one matrix multiply. No cell depends on any other cell, so every row is
        computed at the same time — which is exactly what a recurrent layer could not do, and
        the reason this architecture won.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-amx {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.dl-amx__axes {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 30rem;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dl-muted);
  margin-bottom: 0.25rem;
}

.dl-amx__grid {
  width: auto;
  border-collapse: separate;
  border-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.dl-amx__grid .dl-amx__colhead,
.dl-amx__grid .dl-amx__rowhead {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--dl-heading);
  padding: 0.1rem 0.3rem;
  white-space: nowrap;
  text-align: center;
}

.dl-amx__grid .dl-amx__rowhead {
  text-align: right;
}

.dl-amx.is-mask .dl-amx__colhead,
.dl-amx.is-mask .dl-amx__rowhead {
  font-size: 0.68rem;
}

.dl-amx__grid .dl-amx__cell {
  position: relative;
  width: 3.5rem;
  height: 2rem;
  border: 1px solid var(--dl-border);
  border-radius: 3px;
  text-align: center;
  overflow: hidden;
}

.dl-amx.is-mask .dl-amx__grid .dl-amx__cell {
  width: 2.2rem;
  height: 1.6rem;
}

/*
 * The theme stretches every table to 100% and gives `th` a filled header band.
 * Neither is right for a matrix: the grid should be exactly as wide as its own
 * cells — otherwise the row-label column absorbs all the slack and the thing
 * stops looking like a matrix — and the labels here are axis ticks, not a
 * header row.
 */
.dl-amx__grid th,
.dl-amx__grid td {
  background: transparent;
  border: none;
  padding: 0;
  box-sizing: border-box;
}

/*
 * The fill is its own absolutely-positioned element rather than a background
 * colour on the cell, because the number has to stay at full contrast while the
 * shading behind it varies — a faded `color` on a pale cell is unreadable from
 * the back of a lecture hall.
 */
.dl-amx__fill {
  position: absolute;
  inset: 0;
  background: var(--dl-accent);
}

.dl-amx__text {
  position: relative;
  font-size: 0.8rem;
  color: var(--dl-heading);
}

.dl-amx__text.is-strong {
  font-weight: 700;
}

.dl-amx__grid .dl-amx__cell.is-blocked {
  border-style: dashed;
}

.dl-amx__cell.is-blocked .dl-amx__text {
  color: var(--dl-muted);
}

.dl-amx__grid .dl-amx__sum {
  padding-left: 0.6rem;
  font-size: 0.75rem;
  color: var(--dl-muted);
  white-space: nowrap;
}

.dl-amx__grid tr.is-active .dl-amx__rowhead {
  color: var(--dl-accent);
}

.dl-amx__grid tr.is-active .dl-amx__cell {
  border-color: var(--dl-accent);
}

/* The empty corner above the row labels, which otherwise takes the header fill. */
.dl-amx__grid thead th:first-child {
  width: 4rem;
}
</style>
