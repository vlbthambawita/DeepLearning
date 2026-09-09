<script setup lang="ts">
/*
 * Why one accuracy number is not an evaluation.
 *
 * Any fully-connected network gets about 98% on MNIST, so the headline number
 * tells a student nothing about their own model — it is the same number whether
 * they normalised the data or not. The 180 mistakes are the interesting part,
 * and they are not spread evenly: 4 and 9 account for 31 of them on their own.
 *
 * Two display decisions, both about honesty. The diagonal is drawn on its own
 * scale, because 981 correct nines next to 16 mistakes would flatten any single
 * colour ramp to the point where every error looks like zero. And the metrics
 * view puts *error counts* on the bars rather than accuracies, because a bar
 * chart of numbers between 0.97 and 0.99 has to start its axis at 0.95 to show
 * anything, and a truncated axis is a lie told with a picture.
 *
 * The counts are a realistic 784-128-64-10 result at 98.2%: plausible, and
 * fixed, so the numbers on the slide are the numbers in the notes.
 */
import { computed, ref } from 'vue'

const COUNTS = [
  [976, 0, 0, 0, 0, 1, 3, 0, 0, 0],
  [0, 1128, 3, 0, 0, 0, 0, 2, 2, 0],
  [2, 3, 1012, 4, 0, 0, 0, 8, 3, 0],
  [0, 0, 4, 988, 0, 9, 0, 0, 6, 3],
  [0, 0, 2, 0, 962, 0, 3, 0, 0, 15],
  [0, 0, 0, 11, 0, 872, 4, 0, 5, 0],
  [5, 2, 0, 0, 2, 6, 943, 0, 0, 0],
  [0, 4, 9, 0, 0, 0, 0, 1007, 0, 8],
  [2, 0, 3, 6, 0, 8, 0, 0, 951, 4],
  [0, 0, 0, 2, 16, 0, 0, 7, 3, 981],
]

const K = 10

const props = withDefaults(defineProps<{
  mode?: 'matrix' | 'metrics'
}>(), {
  mode: 'matrix',
})

const support = COUNTS.map(row => row.reduce((a, b) => a + b, 0))
const predicted = Array.from({ length: K }, (_, c) => COUNTS.reduce((sum, row) => sum + row[c], 0))
const totalN = support.reduce((a, b) => a + b, 0)
const correct = Array.from({ length: K }, (_, i) => COUNTS[i][i]).reduce((a, b) => a + b, 0)

const metrics = Array.from({ length: K }, (_, i) => {
  const tp = COUNTS[i][i]
  const fn = support[i] - tp
  const fp = predicted[i] - tp
  const precision = tp / (tp + fp)
  const recall = tp / (tp + fn)
  return {
    digit: i,
    tp,
    fn,
    fp,
    precision,
    recall,
    f1: (2 * precision * recall) / (precision + recall),
    support: support[i],
  }
})

const worstF1 = Math.min(...metrics.map(m => m.f1))
const maxErrors = Math.max(...metrics.map(m => m.fn + m.fp))

const macro = {
  precision: metrics.reduce((s, m) => s + m.precision, 0) / K,
  recall: metrics.reduce((s, m) => s + m.recall, 0) / K,
  f1: metrics.reduce((s, m) => s + m.f1, 0) / K,
}

/* ---- matrix view --------------------------------------------------------- */

const asPercent = ref(false)
const picked = ref<{ r: number, c: number } | null>({ r: 9, c: 4 })

/** Off-diagonal cells only; the diagonal has its own treatment. */
const maxOff = Math.max(...COUNTS.flatMap((row, r) => row.filter((_, c) => c !== r)))

const CELL = 28
const GAP = 1.5
const PAD_L = 26
const PAD_T = 30

const cells = computed(() => COUNTS.flatMap((row, r) => row.map((v, c) => ({
  r,
  c,
  v,
  x: PAD_L + c * (CELL + GAP),
  y: PAD_T + r * (CELL + GAP),
  diag: r === c,
  /** Row-normalised, which is what "recall" means read across one row. */
  pct: (100 * v) / support[r],
  tint: r === c ? 1 : v / maxOff,
}))))

const view = {
  w: PAD_L + K * (CELL + GAP) + 4,
  h: PAD_T + K * (CELL + GAP) + 20,
}

const chosen = computed(() => (picked.value ? cells.value.find(c => c.r === picked.value!.r && c.c === picked.value!.c) ?? null : null))

const chosenText = computed(() => {
  const c = chosen.value
  if (!c)
    return 'Click a cell. A row is one true digit, a column is what the model said.'
  if (c.diag)
    return `${c.v} of the ${support[c.r]} images of a ${c.r} were classified correctly — that is recall for class ${c.r}, ${(100 * c.v / support[c.r]).toFixed(1)}%.`
  if (c.v === 0)
    return `The model never mistook a ${c.r} for a ${c.c}. Most of this matrix is zero, which is the point: the errors live in a handful of cells.`
  return `${c.v} images of a true ${c.r} were predicted as ${c.c}. That is ${(100 * c.v / support[c.r]).toFixed(1)}% of all the ${c.r}s in the test set.`
})

function fmtPct(v: number) {
  return `${(100 * v).toFixed(1)}%`
}

/** Grouped by thousands, written out rather than left to the browser locale. */
function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
</script>

<template>
  <WidgetFrame v-if="props.mode === 'matrix'" max-width="34rem">
    <svg
      class="dl-cm"
      :viewBox="`0 0 ${view.w} ${view.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A 10 by 10 confusion matrix for MNIST"
    >
      <text class="dl-cm__axis" :x="PAD_L + (K * (CELL + GAP)) / 2" :y="12" text-anchor="middle">predicted</text>
      <text
        class="dl-cm__axis"
        :x="10" :y="PAD_T + (K * (CELL + GAP)) / 2"
        text-anchor="middle"
        :transform="`rotate(-90 10 ${PAD_T + (K * (CELL + GAP)) / 2})`"
      >true</text>

      <g class="dl-cm__head">
        <text v-for="c in K" :key="`hc${c}`" :x="PAD_L + (c - 1) * (CELL + GAP) + CELL / 2" :y="PAD_T - 5" text-anchor="middle">{{ c - 1 }}</text>
        <text v-for="r in K" :key="`hr${r}`" :x="PAD_L - 5" :y="PAD_T + (r - 1) * (CELL + GAP) + CELL / 2 + 3.5" text-anchor="end">{{ r - 1 }}</text>
      </g>

      <g class="dl-cm__cells">
        <g
          v-for="cell in cells"
          :key="`${cell.r}-${cell.c}`"
          :class="{ 'is-diag': cell.diag, 'is-zero': cell.v === 0, 'is-picked': picked && picked.r === cell.r && picked.c === cell.c }"
          tabindex="0"
          role="button"
          :aria-label="`true ${cell.r}, predicted ${cell.c}: ${cell.v}`"
          @click="picked = { r: cell.r, c: cell.c }"
          @keydown.enter.prevent="picked = { r: cell.r, c: cell.c }"
          @keydown.space.prevent="picked = { r: cell.r, c: cell.c }"
        >
          <rect
            :x="cell.x" :y="cell.y" :width="CELL" :height="CELL"
            rx="2"
            :style="cell.diag
              ? undefined
              : { fill: `color-mix(in srgb, var(--dl-danger) ${Math.round(cell.tint * 78)}%, var(--dl-surface))` }"
          />
          <text v-if="cell.v > 0" :x="cell.x + CELL / 2" :y="cell.y + CELL / 2 + 3.5" text-anchor="middle">
            {{ asPercent ? (cell.pct < 1 ? cell.pct.toFixed(1) : cell.pct.toFixed(0)) : cell.v }}
          </text>
        </g>
      </g>
    </svg>

    <template #controls>
      <StepButton
        :label="asPercent ? 'row %' : 'counts'"
        :variant="asPercent ? 'primary' : 'ghost'"
        @click="asPercent = !asPercent"
      />
      <StepButton label="the 4/9 pair" variant="ghost" @click="picked = { r: 9, c: 4 }" />
      <StepButton label="clear" variant="ghost" @click="picked = null" />
    </template>

    <template #readout>
      <div class="dl-cm__facts">
        <span>accuracy <strong>{{ fmtPct(correct / totalN) }}</strong></span>
        <span>{{ totalN - correct }} mistakes in {{ fmt(totalN) }} images</span>
      </div>
      <div class="dl-cm__note">{{ chosenText }}</div>
    </template>
  </WidgetFrame>

  <WidgetFrame v-else max-width="42rem">
    <table class="dl-cmm">
      <thead>
        <tr>
          <th>digit</th><th>support</th><th>precision</th><th>recall</th><th>F1</th><th>errors (missed + false)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in metrics" :key="m.digit" :class="{ 'is-worst': m.f1 === worstF1 }">
          <td class="is-digit">{{ m.digit }}</td>
          <td>{{ m.support }}</td>
          <td>{{ m.precision.toFixed(3) }}</td>
          <td>{{ m.recall.toFixed(3) }}</td>
          <td>{{ m.f1.toFixed(3) }}</td>
          <td>
            <span class="dl-cmm__bar"><span :style="{ width: `${(100 * (m.fn + m.fp)) / maxErrors}%` }" /></span>
            <small>{{ m.fn }} + {{ m.fp }}</small>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">macro average</td>
          <td>{{ macro.precision.toFixed(3) }}</td>
          <td>{{ macro.recall.toFixed(3) }}</td>
          <td>{{ macro.f1.toFixed(3) }}</td>
          <td>accuracy {{ fmtPct(correct / totalN) }}</td>
        </tr>
      </tfoot>
    </table>

    <template #readout>
      <div class="dl-cm__note">
        Precision asks "when it said 9, was it right?"; recall asks "of the real 9s, how many did it find?". Class 9 is
        worst on both, and the bar says why: 28 nines missed and 30 other digits wrongly called nine. The bars are
        counts from zero — a bar chart of numbers between 0.97 and 0.99 would need a truncated axis to show anything.
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-cm {
  width: 100%;
  height: 100%;
}

.dl-cm__axis {
  font-size: 10px;
  fill: var(--dl-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dl-cm__head text {
  font-size: 10px;
  fill: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-cm__cells rect {
  stroke: var(--dl-border);
  stroke-width: 0.5;
  cursor: pointer;
}

.dl-cm__cells text {
  font-size: 8.5px;
  fill: var(--dl-heading);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.dl-cm__cells g.is-diag rect {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-cm__cells g.is-diag text {
  fill: var(--dl-accent-strong);
  font-weight: 600;
  font-size: 8px;
}

.dl-cm__cells g.is-zero rect {
  fill: var(--dl-bg);
}

.dl-cm__cells g.is-picked rect {
  stroke: var(--dl-heading);
  stroke-width: 2;
}

.dl-cm__cells g:focus-visible rect {
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
}

.dl-cm__cells g:focus {
  outline: none;
}

.dl-cm__facts {
  display: flex;
  gap: 1.4rem;
  margin-bottom: 0.2rem;
}

.dl-cm__facts strong {
  color: var(--dl-accent);
  font-size: 1rem;
}

.dl-cm__note {
  line-height: 1.35;
}

.dl-cmm {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.82rem;
  color: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-cmm th {
  text-align: right;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dl-muted);
  font-weight: 600;
  padding: 0 0.6rem 0.2rem;
  border-bottom: 1px solid var(--dl-border);
}

.dl-cmm th:first-child,
.dl-cmm td:first-child {
  text-align: left;
}

.dl-cmm th:last-child,
.dl-cmm td:last-child {
  text-align: left;
  width: 32%;
}

.dl-cmm td {
  text-align: right;
  padding: 0.1rem 0.6rem;
}

.dl-cmm td.is-digit {
  font-weight: 700;
  color: var(--dl-heading);
}

.dl-cmm tr.is-worst {
  background: var(--dl-accent-soft);
}

.dl-cmm__bar {
  display: inline-block;
  width: 58%;
  height: 0.5rem;
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  border-radius: 2px;
  overflow: hidden;
  vertical-align: middle;
}

.dl-cmm__bar > span {
  display: block;
  height: 100%;
  background: var(--dl-danger);
}

.dl-cmm small {
  font-size: 0.66rem;
  color: var(--dl-muted);
  margin-left: 0.35rem;
}

.dl-cmm tfoot td {
  border-top: 1px solid var(--dl-border);
  padding-top: 0.25rem;
  font-weight: 700;
  color: var(--dl-accent);
}
</style>
