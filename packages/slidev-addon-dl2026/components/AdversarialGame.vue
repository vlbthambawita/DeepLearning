<script setup lang="ts">
/*
 * The widget of lecture 07: the GAN value function, computed on three bins.
 *
 * This is the deck's `AttentionTrace` — the thing a student has to be able to
 * reproduce on paper. Move the generator's three weights and watch:
 *
 *   D*(x) = P(x) / (P(x) + Q(x))          the best classifier that could exist
 *   V(D*, G)                              what the game is worth at that D
 *   -log 4 + 2·JS(P‖Q)                    what the theorem says V must be
 *
 * The last two rows are the point. They agree to every digit shown, for every
 * position of the sliders, and that is the whole argument of the section: a
 * trained discriminator is not a classifier you happen to need, it is a
 * *measurement of a divergence*, and the generator is minimising that divergence.
 *
 * At the default Q = [0.2, 0.5, 0.3] the discriminator comes out as the exact
 * fractions 5/8, 2/5, 10/19, which is why that Q was chosen.
 */
import { computed, ref } from 'vue'
import {
  P_REAL,
  Q_COLLAPSE_MID,
  Q_START,
  normalise,
  scoreGenerator,
} from '../composables/useGenerative'

const props = withDefaults(defineProps<{
  /** Hide the V rows and show only P, Q and D* — for the slide that derives D*. */
  discriminatorOnly?: boolean
  /** Start the generator collapsed onto one mode. */
  collapsed?: boolean
}>(), {
  discriminatorOnly: false,
  collapsed: false,
})

/*
 * Raw, unnormalised weights. The sliders move these and everything downstream
 * reads the normalised version, so a student can push one bin up without having
 * to think about what the other two must do to keep the total at 1.
 */
const raw = ref<number[]>([...(props.collapsed ? Q_COLLAPSE_MID : Q_START)])

const q = computed(() => normalise(raw.value))
const result = computed(() => scoreGenerator(P_REAL, q.value))

/** Do the two ways of computing V agree, to what the readout prints? */
const agrees = computed(() =>
  Math.abs(result.value.v - result.value.vTheory) < 5e-6)

const BAR_W = 42
const GAP = 52
const H = 132
const BASE = 150
const LEFT = 58

function barHeight(p: number) {
  return Math.max(p * H * (1 / 0.62), 0)
}

function groupX(i: number) {
  return LEFT + i * (BAR_W * 2 + GAP)
}

function preset(next: number[]) {
  raw.value = [...next]
}

function fmt(v: number, places = 3) {
  return Number.isFinite(v) ? v.toFixed(places) : '∞'
}
</script>

<template>
  <WidgetFrame max-width="46rem">
    <svg class="dl-gan" viewBox="0 0 470 216" role="img"
         aria-label="Real and generated probability on three modes, with the optimal discriminator under each">
      <!-- baseline -->
      <line class="dl-gan__axis" :x1="LEFT - 26" :x2="446" :y1="BASE" :y2="BASE" />

      <text class="dl-gan__ylab" :x="LEFT - 32" :y="BASE - H + 4" text-anchor="end">0.6</text>
      <text class="dl-gan__ylab" :x="LEFT - 32" :y="BASE + 4" text-anchor="end">0</text>

      <g v-for="(pi, i) in P_REAL" :key="i">
        <!-- the real data: an outline, because it is fixed and not yours to move -->
        <rect
          class="dl-gan__real"
          :x="groupX(i)" :width="BAR_W"
          :y="BASE - barHeight(pi)" :height="barHeight(pi)"
        />
        <text class="dl-gan__val" :x="groupX(i) + BAR_W / 2" :y="BASE - barHeight(pi) - 6" text-anchor="middle">
          {{ pi.toFixed(2) }}
        </text>

        <!-- the generator: solid, and the only thing that moves -->
        <rect
          class="dl-gan__fake"
          :x="groupX(i) + BAR_W + 4" :width="BAR_W"
          :y="BASE - barHeight(q[i])" :height="barHeight(q[i])"
        />
        <text class="dl-gan__val is-fake" :x="groupX(i) + BAR_W * 1.5 + 4" :y="BASE - barHeight(q[i]) - 6" text-anchor="middle">
          {{ q[i].toFixed(2) }}
        </text>

        <text class="dl-gan__mode" :x="groupX(i) + BAR_W + 2" :y="BASE + 18" text-anchor="middle">
          mode {{ i + 1 }}
        </text>

        <!-- the best possible discriminator on this bin -->
        <text class="dl-gan__dstar" :x="groupX(i) + BAR_W + 2" :y="BASE + 42" text-anchor="middle">
          D* = {{ result.d[i].toFixed(3) }}
        </text>
      </g>

      <g class="dl-gan__key">
        <rect class="dl-gan__real" x="300" y="10" width="15" height="11" />
        <text x="322" y="20">real, P</text>
        <rect class="dl-gan__fake" x="376" y="10" width="15" height="11" />
        <text x="398" y="20">generated, Q</text>
      </g>
    </svg>

    <template #controls>
      <Slider v-model="raw[0]" label="Q on mode 1" :min="0" :max="1" :step="0.01" />
      <Slider v-model="raw[1]" label="Q on mode 2" :min="0" :max="1" :step="0.01" />
      <Slider v-model="raw[2]" label="Q on mode 3" :min="0" :max="1" :step="0.01" />
      <StepButton label="Reset" variant="ghost" @click="preset(Q_START)" />
      <StepButton label="Collapse" variant="ghost" @click="preset(Q_COLLAPSE_MID)" />
      <StepButton label="Perfect" variant="ghost" @click="preset(P_REAL)" />
    </template>

    <template #readout>
      <div v-if="!props.discriminatorOnly" class="dl-gan__out">
        <div class="dl-gan__row">
          <span class="dl-gan__name">V(D*, G)</span>
          <span class="dl-gan__num">{{ fmt(result.v, 5) }}</span>
        </div>
        <div class="dl-gan__row">
          <span class="dl-gan__name">−log 4 + 2·JS(P‖Q)</span>
          <span class="dl-gan__num">{{ fmt(result.vTheory, 5) }}</span>
        </div>
        <div class="dl-gan__row is-quiet">
          <span class="dl-gan__name">JS(P‖Q)</span>
          <span class="dl-gan__num">{{ fmt(result.js, 5) }}</span>
          <span class="dl-gan__note">
            {{ agrees ? 'the two rows above are the same number, always' : '' }}
          </span>
        </div>
      </div>
      <div v-else class="dl-gan__out">
        <div class="dl-gan__row is-quiet">
          <span class="dl-gan__name">D* = P / (P + Q)</span>
          <span class="dl-gan__note">
            nothing here was trained — this is the best any discriminator could do
          </span>
        </div>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-gan {
  width: 100%;
  height: 100%;
  max-height: 15rem;
  font-family: inherit;
}

.dl-gan__axis {
  stroke: var(--dl-muted);
  stroke-width: 1.5;
}

.dl-gan__ylab,
.dl-gan__key text {
  fill: var(--dl-muted);
  font-size: 11px;
}

.dl-gan__real {
  fill: none;
  stroke: var(--dl-body);
  stroke-width: 2;
  stroke-dasharray: 4 3;
}

.dl-gan__fake {
  fill: var(--dl-accent);
}

.dl-gan__val {
  fill: var(--dl-body);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.dl-gan__val.is-fake {
  fill: var(--dl-accent);
  font-weight: 600;
}

.dl-gan__mode {
  fill: var(--dl-body);
  font-size: 12.5px;
}

.dl-gan__dstar {
  fill: var(--dl-heading);
  font-size: 13.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dl-gan__out {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  width: 100%;
}

.dl-gan__row {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  font-size: 0.86rem;
  color: var(--dl-heading);
}

.dl-gan__row.is-quiet {
  color: var(--dl-muted);
  font-size: 0.8rem;
}

.dl-gan__name {
  min-width: 11.5rem;
}

.dl-gan__num {
  font-weight: 700;
  color: var(--dl-accent);
  font-variant-numeric: tabular-nums;
  min-width: 5rem;
  text-align: right;
}

.dl-gan__note {
  color: var(--dl-muted);
  font-size: 0.78rem;
  font-weight: 400;
}
</style>
