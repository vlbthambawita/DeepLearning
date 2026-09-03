<script setup lang="ts">
/*
 * Pooling, and the claim pooling is usually sold with — 2025 Lecture 03 slides
 * 19 and 20.
 *
 * The numbers are the ones from those slides, so the max-pool output is still
 * 8, 5, 6, 3 and the mean-pool output still 3.78, 2.33, 3, 1.22. What the
 * slides could not do is the experiment: slide 20 asserted local invariance by
 * printing two different matrices with the same max-pooled result, which is a
 * claim you have to take on trust. "Nudge the pixels" runs it — every cell that
 * is not its window's maximum moves, and the max output does not, while the
 * mean output does. The asymmetry is the point, and the 2025 deck's phrasing
 * ("pooling introduces local invariance") quietly overstates it for mean-pooling.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'
import { seededRandom } from '../composables/useRandom'

const props = withDefaults(defineProps<{
  input?: number[][]
  /** Pooling window, square. */
  size?: number
  /** Defaults to non-overlapping windows, which is what P_n×n means. */
  stride?: number
  mode?: 'max' | 'mean'
  /** Offer the nudge experiment and both outputs side by side. */
  invariance?: boolean
  seed?: number
}>(), {
  input: () => [
    [2, 1, 7, 1, 2, 5],
    [5, 0, 3, 4, 1, 2],
    [1, 7, 8, 3, 3, 0],
    [0, 3, 2, 0, 1, 1],
    [6, 2, 5, 3, 0, 3],
    [3, 6, 0, 2, 1, 0],
  ],
  size: 3,
  stride: 0,
  mode: 'max',
  invariance: false,
  seed: 4,
})

const mode = ref(props.mode)
const nudges = ref(0)

const step = computed(() => props.stride || props.size)
const rows = computed(() => Math.floor((props.input.length - props.size) / step.value) + 1)
const cols = computed(() => Math.floor(((props.input[0]?.length ?? 0) - props.size) / step.value) + 1)

/** Which pooling window a cell belongs to, or null if the stride skips it. */
function windowOf(r: number, c: number) {
  const wr = Math.floor(r / step.value)
  const wc = Math.floor(c / step.value)
  if (r - wr * step.value >= props.size || c - wc * step.value >= props.size)
    return null
  if (wr >= rows.value || wc >= cols.value)
    return null
  return { wr, wc }
}

function windowCells(wr: number, wc: number, grid: number[][]) {
  const out: Array<{ r: number, c: number, v: number }> = []
  for (let r = 0; r < props.size; r++) {
    for (let c = 0; c < props.size; c++) {
      const rr = wr * step.value + r
      const cc = wc * step.value + c
      out.push({ r: rr, c: cc, v: grid[rr][cc] })
    }
  }
  return out
}

/**
 * The perturbed grid. Every cell that is not its window's maximum is moved by a
 * seeded amount, capped so it cannot overtake the maximum — otherwise the
 * experiment would be rigged in the other direction.
 */
const grid = computed(() => {
  if (nudges.value === 0)
    return props.input.map(row => [...row])

  const rand = seededRandom(props.seed + nudges.value * 977)
  const next = props.input.map(row => [...row])

  for (let wr = 0; wr < rows.value; wr++) {
    for (let wc = 0; wc < cols.value; wc++) {
      const cells = windowCells(wr, wc, props.input)
      const peak = Math.max(...cells.map(c => c.v))
      const winner = cells.find(c => c.v === peak)
      for (const cell of cells) {
        if (cell === winner)
          continue
        const room = peak - cell.v
        if (room <= 0)
          continue
        const delta = Math.min(room - 1, Math.floor(rand() * 4) - 1)
        next[cell.r][cell.c] = Math.max(0, cell.v + delta)
      }
    }
  }
  return next
})

function pooled(grid: number[][], how: 'max' | 'mean') {
  return Array.from({ length: rows.value }, (_, wr) =>
    Array.from({ length: cols.value }, (_, wc) => {
      const values = windowCells(wr, wc, grid).map(c => c.v)
      return how === 'max'
        ? Math.max(...values)
        : values.reduce((a, b) => a + b, 0) / values.length
    }))
}

const output = computed(() => pooled(grid.value, mode.value))
const baseline = computed(() => pooled(props.input, mode.value))

/** Which cell won its window — the one the max-pool output actually reads. */
const winners = computed(() => {
  const set = new Set<string>()
  for (let wr = 0; wr < rows.value; wr++) {
    for (let wc = 0; wc < cols.value; wc++) {
      const cells = windowCells(wr, wc, grid.value)
      const peak = Math.max(...cells.map(c => c.v))
      const winner = cells.find(c => c.v === peak)!
      set.add(`${winner.r}-${winner.c}`)
    }
  }
  return set
})

const moved = computed(() => {
  let n = 0
  for (let r = 0; r < props.input.length; r++) {
    for (let c = 0; c < props.input[r].length; c++) {
      if (grid.value[r][c] !== props.input[r][c])
        n++
    }
  }
  return n
})

const unchanged = computed(() =>
  output.value.flat().every((v, i) => Math.abs(v - baseline.value.flat()[i]) < 1e-9))

/** Alternating tints so the four windows of the 2025 figure stay legible. */
function tint(r: number, c: number) {
  const w = windowOf(r, c)
  if (!w)
    return 'is-skipped'
  return (w.wr + w.wc) % 2 === 0 ? 'is-even' : 'is-odd'
}
</script>

<template>
  <WidgetFrame max-width="40rem">
    <div class="dl-pool">
      <figure class="dl-pool__panel">
        <figcaption>input</figcaption>
        <div class="dl-grid" :style="{ gridTemplateColumns: `repeat(${props.input[0].length}, 2rem)` }">
          <template v-for="(row, r) in grid" :key="`r${r}`">
            <div
              v-for="(v, c) in row"
              :key="`x${r}-${c}`"
              class="dl-cell"
              :class="[tint(r, c), {
                'is-winner': mode === 'max' && winners.has(`${r}-${c}`),
                'is-moved': grid[r][c] !== props.input[r][c],
              }]"
            >{{ v }}</div>
          </template>
        </div>
      </figure>

      <div class="dl-pool__op">
        <span class="dl-pool__arrow" aria-hidden="true">→</span>
        <span class="dl-pool__opname">P<sub>{{ props.size }}×{{ props.size }}</sub></span>
        <span class="dl-pool__sub">stride {{ step }}</span>
      </div>

      <figure class="dl-pool__panel">
        <figcaption>{{ mode }}-pool</figcaption>
        <div class="dl-grid" :style="{ gridTemplateColumns: `repeat(${cols}, 3rem)` }">
          <template v-for="(row, r) in output" :key="`or${r}`">
            <div
              v-for="(v, c) in row"
              :key="`y${r}-${c}`"
              class="dl-cell is-out"
              :class="{ 'is-changed': nudges > 0 && Math.abs(v - baseline[r][c]) > 1e-9 }"
            >{{ num(v) }}</div>
          </template>
        </div>
      </figure>
    </div>

    <template #controls>
      <StepButton
        :label="mode === 'max' ? 'Switch to mean-pool' : 'Switch to max-pool'"
        variant="ghost"
        @click="mode = mode === 'max' ? 'mean' : 'max'"
      />
      <template v-if="props.invariance">
        <StepButton label="Nudge the pixels" glyph="↯" @click="nudges++" />
        <StepButton v-if="nudges > 0" label="Reset" variant="ghost" @click="nudges = 0" />
      </template>
    </template>

    <template #readout>
      <template v-if="props.invariance && nudges > 0">
        <strong>{{ moved }}</strong> of the {{ props.input.length * props.input[0].length }} input
        pixels moved, and none of them was its window's maximum.
        <template v-if="mode === 'max'">
          <span :class="unchanged ? 'dl-pool__ok' : 'dl-pool__no'">
            The max-pool output did not change at all.</span>
          That is local invariance: max-pooling only reports the strongest response in each
          neighbourhood, so it does not care where in the neighbourhood it was.
        </template>
        <template v-else>
          <span class="dl-pool__no">The mean-pool output changed.</span>
          Averaging reads every pixel, so it is not invariant — the guarantee belongs to
          max-pooling, not to pooling in general.
        </template>
      </template>
      <template v-else>
        {{ props.input.length }}×{{ props.input[0].length }} in,
        {{ rows }}×{{ cols }} out — pooling with stride {{ step }} divides the spatial size
        by {{ step }} and has <strong>no learnable parameters</strong>.
        <template v-if="mode === 'max'">The highlighted cell in each window is the one that survives.</template>
        <template v-else>Every cell in the window contributes equally.</template>
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-pool {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.dl-pool__panel {
  margin: 0;
  text-align: center;
}

.dl-pool__panel figcaption {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dl-heading);
  margin-bottom: 0.35rem;
}

.dl-grid {
  display: grid;
  justify-content: center;
}

.dl-cell {
  height: 2rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--dl-border);
  margin: 0 -1px -1px 0;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-body);
  transition: background 0.25s ease, color 0.25s ease;
}

/* The 2025 figure separated the four windows by tinting them; keep that, since
   it is the only thing showing where one pooling window stops. */
.dl-cell.is-even {
  background: var(--dl-bg);
}

.dl-cell.is-odd {
  background: var(--dl-surface);
}

.dl-cell.is-skipped {
  opacity: 0.3;
}

.dl-cell.is-winner {
  background: var(--dl-accent-soft);
  border-color: var(--dl-accent);
  color: var(--dl-heading);
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.dl-cell.is-moved {
  color: var(--dl-danger);
  font-weight: 600;
}

.dl-cell.is-out {
  border-color: var(--dl-heading);
  color: var(--dl-heading);
  font-weight: 600;
  height: 2.2rem;
}

.dl-cell.is-out.is-changed {
  background: var(--dl-danger);
  border-color: var(--dl-danger);
  color: #fff;
}

.dl-pool__op {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.dl-pool__arrow {
  font-size: 1.3rem;
  color: var(--dl-muted);
}

.dl-pool__opname {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--dl-heading);
}

.dl-pool__sub {
  font-size: 0.72rem;
  color: var(--dl-muted);
}

.dl-pool__ok {
  color: var(--dl-accent);
  font-weight: 600;
}

.dl-pool__no {
  color: var(--dl-danger);
  font-weight: 600;
}
</style>
