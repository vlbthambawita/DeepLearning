<script setup lang="ts">
/*
 * Four ways of saying "these two distributions differ", scored on the same three
 * generators at once.
 *
 * Sizing note: the table is HTML rather than a scaling <svg viewBox>, so it does
 * not shrink to fit on its own. Side by side with the chart it ran wider than an
 * `interactive` stage and slid underneath the aside rail — silently, because
 * `npm run check` only sees vertical clipping. Stacked, the table gets the full
 * width it needs and the chart scales with its viewBox.
 *
 * The table is the argument. Read down the JS column: the generator that
 * collapsed onto mode 2 and the generator that collapsed onto mode 3 get
 * *identical* scores, because Jensen–Shannon only ever asks "how much mass is in
 * the wrong place", never "how far away is it". Read down the EM column and they
 * differ by half again, because earth-mover knows mode 3 is two steps from
 * mode 1 while mode 2 is one.
 *
 * That difference is the entire case for Wasserstein GANs, and it is two lines
 * of arithmetic a student can do in their head.
 *
 * KL is in the table mainly so the room sees it go to infinity the moment the
 * generator drops a mode — which is why nobody trains a GAN on it.
 */
import { computed, ref } from 'vue'
import {
  P_REAL,
  Q_COLLAPSE_END,
  Q_COLLAPSE_MID,
  Q_START,
  scoreGenerator,
} from '../composables/useGenerative'

const CANDIDATES = [
  { key: 'start', label: 'early training', q: Q_START },
  { key: 'mid', label: 'collapsed → mode 2', q: Q_COLLAPSE_MID },
  { key: 'end', label: 'collapsed → mode 3', q: Q_COLLAPSE_END },
] as const

const shown = ref(0)

const scored = computed(() => CANDIDATES.map(c => ({ ...c, s: scoreGenerator(P_REAL, c.q) })))
const current = computed(() => scored.value[shown.value])

/** The two collapsed generators, which JS scores identically. */
const blind = computed(() =>
  Math.abs(scored.value[1].s.js - scored.value[2].s.js) < 1e-9)

const MEASURES = [
  { key: 'tv', name: 'TV', note: 'half the total gap' },
  { key: 'klPQ', name: 'KL(P‖Q)', note: 'infinite if a mode is missed' },
  { key: 'js', name: 'JS(P‖Q)', note: 'what a GAN minimises' },
  { key: 'em', name: 'EM(P, Q)', note: 'what a WGAN minimises' },
] as const

function cell(s: ReturnType<typeof scoreGenerator>, key: typeof MEASURES[number]['key']) {
  const v = s[key]
  return Number.isFinite(v) ? v.toFixed(4) : '∞'
}

const BAR_W = 26
const GAP = 18
const H = 76
const BASE = 94
const LEFT = 22

// Scaled so a fully collapsed generator (all the mass in one bin) reaches the
// top of the stage rather than running off it.
function barHeight(p: number) {
  return Math.max(p * H, 0)
}

function groupX(i: number) {
  return LEFT + i * (BAR_W * 2 + GAP)
}
</script>

<template>
  <WidgetFrame max-width="31rem" controls-first>
    <div class="dl-div">
      <svg class="dl-div__chart" viewBox="0 0 232 120" preserveAspectRatio="xMidYMid meet" role="img"
           :aria-label="`Real data against the generator: ${current.label}`">
        <line class="dl-div__axis" :x1="LEFT - 8" :x2="224" :y1="BASE" :y2="BASE" />
        <g v-for="(pi, i) in P_REAL" :key="i">
          <rect
            class="dl-div__real"
            :x="groupX(i)" :width="BAR_W"
            :y="BASE - barHeight(pi)" :height="barHeight(pi)"
          />
          <rect
            class="dl-div__fake"
            :x="groupX(i) + BAR_W + 3" :width="BAR_W"
            :y="BASE - barHeight(current.q[i])" :height="barHeight(current.q[i])"
          />
          <text class="dl-div__mode" :x="groupX(i) + BAR_W + 1" :y="BASE + 14" text-anchor="middle">
            {{ i + 1 }}
          </text>
        </g>
        <text class="dl-div__cap" x="116" y="116" text-anchor="middle">
          dashed: real P · solid: {{ current.label }}
        </text>
      </svg>

      <table class="dl-div__table">
        <thead>
          <tr>
            <th />
            <th
              v-for="(c, i) in scored" :key="c.key"
              :class="{ 'is-shown': i === shown }"
            >{{ c.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in MEASURES" :key="m.key" :class="{ 'is-blind': blind && (m.key === 'js') }">
            <th scope="row">
              {{ m.name }}
              <span class="dl-div__note">{{ m.note }}</span>
            </th>
            <td
              v-for="(c, i) in scored" :key="c.key"
              :class="{ 'is-shown': i === shown }"
            >{{ cell(c.s, m.key) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #controls>
      <StepButton
        v-for="(c, i) in CANDIDATES" :key="c.key"
        :label="c.label"
        :variant="i === shown ? 'primary' : 'ghost'"
        @click="shown = i"
      />
    </template>

    <template #readout>
      <span v-if="blind">
        JS gives the two collapsed generators the same score. EM does not — and the
        one it calls worse is the one whose mass has further to travel.
      </span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-div {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  width: 100%;
  max-width: 100%;
}

.dl-div__chart {
  flex: 0 0 auto;
  width: 100%;
  height: 5.6rem;
  font-family: inherit;
}

.dl-div__axis {
  stroke: var(--dl-muted);
  stroke-width: 1.2;
}

.dl-div__real {
  fill: none;
  stroke: var(--dl-body);
  stroke-width: 1.8;
  stroke-dasharray: 3 3;
}

.dl-div__fake {
  fill: var(--dl-accent);
}

.dl-div__mode {
  fill: var(--dl-body);
  font-size: 11px;
}

.dl-div__cap {
  fill: var(--dl-muted);
  font-size: 9.5px;
}

.dl-div__table {
  flex: 0 0 auto;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
  font-variant-numeric: tabular-nums;
}

.dl-div__table th,
.dl-div__table td {
  padding: 0.16rem 0.45rem;
  text-align: right;
  border-bottom: 1px solid var(--dl-border);
}

.dl-div__table thead th {
  color: var(--dl-muted);
  font-weight: 600;
  font-size: 0.72rem;
  text-align: right;
}

.dl-div__table tbody th {
  text-align: left;
  font-weight: 600;
  color: var(--dl-heading);
  white-space: nowrap;
}

.dl-div__table td {
  color: var(--dl-body);
}

.dl-div__table .is-shown {
  color: var(--dl-accent);
  font-weight: 700;
}

/* The row the whole widget exists to point at. */
.dl-div__table tr.is-blind td:nth-child(3),
.dl-div__table tr.is-blind td:nth-child(4) {
  background: var(--dl-accent-soft);
}

.dl-div__note {
  display: block;
  font-weight: 400;
  font-size: 0.68rem;
  color: var(--dl-muted);
}
</style>
