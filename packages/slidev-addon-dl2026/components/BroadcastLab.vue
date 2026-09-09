<script setup lang="ts">
/*
 * Broadcasting, as the two-step rule it actually is.
 *
 * PyTorch's own documentation states the rule correctly and unmemorably. The
 * two steps are: line the shapes up from the *right*, then stretch any axis of
 * length 1 to match its partner. Everything else is a `RuntimeError`.
 *
 * So the widget shows both halves at once — the alignment ladder that decides
 * the verdict, and the arithmetic that comes out of it, with the stretched
 * copies drawn as ghosts. The ghosts matter: broadcasting never allocates them,
 * which is why `x + b` on a batch of 64 costs nothing extra.
 *
 * The failing case is on the strip on purpose, with the real error text, so the
 * message is familiar before the lab produces it.
 */
import { computed, ref } from 'vue'
import { formatShape } from '../composables/useTensorLayout'

type Fill = 'grid' | 'row' | 'col' | 'const'

interface Operand {
  dims: number[]
  fill: Fill
}

interface Case {
  tab: string
  a: Operand
  b: Operand
  note: string
}

const CASES: Case[] = [
  {
    tab: '(3,4) + scalar',
    a: { dims: [3, 4], fill: 'grid' },
    b: { dims: [], fill: 'const' },
    note: 'The simplest broadcast: a 0-D tensor has no axes to line up, so it stretches to every position. This is what happens when you write `x / 255`.',
  },
  {
    tab: '(3,4) + (4,)',
    a: { dims: [3, 4], fill: 'grid' },
    b: { dims: [4], fill: 'row' },
    note: 'Aligned from the right, 4 meets 4 and the missing axis is treated as 1, so the row is reused for all three samples. This is exactly how `nn.Linear` adds its bias to a batch.',
  },
  {
    tab: '(3,4) + (3,1)',
    a: { dims: [3, 4], fill: 'grid' },
    b: { dims: [3, 1], fill: 'col' },
    note: 'A length-1 axis stretches. One number per sample, applied across that sample\'s features — how you would scale each row by its own norm.',
  },
  {
    tab: '(3,1) + (1,4)',
    a: { dims: [3, 1], fill: 'col' },
    b: { dims: [1, 4], fill: 'row' },
    note: 'Both operands stretch, and the result is bigger than either of them. Useful, and the classic way to accidentally allocate a huge tensor.',
  },
  {
    tab: '(3,4) + (3,)',
    a: { dims: [3, 4], fill: 'grid' },
    b: { dims: [3], fill: 'row' },
    note: 'Refused. Alignment starts from the right, so the 3 is compared with 4, not with the 3 on the left. `b.unsqueeze(1)` — making it (3,1) — is the fix, and is the previous tab.',
  },
]

const active = ref(1)
const kase = computed(() => CASES[active.value])

const RANK = 2

/** Right-align both shapes and pad with 1s, which is step one of the rule. */
function padded(dims: number[]) {
  return [...Array.from({ length: RANK - dims.length }, () => 1), ...dims]
}

type Verdict = 'match' | 'stretch-a' | 'stretch-b' | 'error'

const ladder = computed(() => {
  const a = padded(kase.value.a.dims)
  const b = padded(kase.value.b.dims)
  return a.map((av, i) => {
    const bv = b[i]
    let verdict: Verdict = 'error'
    if (av === bv)
      verdict = 'match'
    else if (av === 1)
      verdict = 'stretch-a'
    else if (bv === 1)
      verdict = 'stretch-b'
    return {
      axis: i,
      a: av,
      b: bv,
      /** Present only when the shape really has this axis. */
      aGiven: i >= RANK - kase.value.a.dims.length,
      bGiven: i >= RANK - kase.value.b.dims.length,
      verdict,
      out: verdict === 'error' ? null : Math.max(av, bv),
    }
  })
})

const failing = computed(() => ladder.value.find(l => l.verdict === 'error') ?? null)

const outDims = computed(() => (failing.value ? [] : ladder.value.map(l => l.out as number)))

function valueOf(op: Operand, r: number, c: number) {
  const [rows] = padded(op.dims)
  const rr = rows === 1 ? 0 : r
  const cc = padded(op.dims)[1] === 1 ? 0 : c
  switch (op.fill) {
    case 'grid': return 10 * rr + cc
    case 'row': return cc + 1
    case 'col': return 100 * (rr + 1)
    case 'const': return 5
  }
}

const CELL = 26
const GAP = 3
const OP_W = 30
const LADDER_H = 62

function gridOf(op: Operand, ox: number, oy: number, outRows: number, outCols: number) {
  const [rows, cols] = padded(op.dims)
  const out: Array<{ x: number, y: number, v: number, ghost: boolean }> = []
  for (let r = 0; r < outRows; r++) {
    for (let c = 0; c < outCols; c++) {
      // A mismatched axis is not broadcast, so it has no cell to draw past its
      // own length — only the length-1 axes get ghosts.
      if ((rows > 1 && r >= rows) || (cols > 1 && c >= cols))
        continue
      const real = (rows > 1 || r === 0) && (cols > 1 || c === 0)
      out.push({
        x: ox + c * (CELL + GAP),
        y: oy + r * (CELL + GAP),
        v: valueOf(op, r, c),
        ghost: !real,
      })
    }
  }
  return out
}

const shapeW = (n: number) => n * CELL + (n - 1) * GAP

const geometry = computed(() => {
  const rows = failing.value ? Math.max(padded(kase.value.a.dims)[0], padded(kase.value.b.dims)[0]) : outDims.value[0]
  const cols = failing.value ? padded(kase.value.a.dims)[1] : outDims.value[1]
  const w = shapeW(cols)
  const x0 = 0
  const x1 = x0 + w + OP_W
  const x2 = x1 + w + OP_W
  return { rows, cols, w, h: rows * CELL + (rows - 1) * GAP, x0, x1, x2 }
})

const gridA = computed(() => gridOf(kase.value.a, geometry.value.x0, LADDER_H, geometry.value.rows, geometry.value.cols))
const gridB = computed(() => gridOf(kase.value.b, geometry.value.x1, LADDER_H, geometry.value.rows, geometry.value.cols))
const gridOut = computed(() => (failing.value
  ? []
  : gridA.value.map((a, i) => ({
      x: geometry.value.x2 + (a.x - geometry.value.x0),
      y: a.y,
      v: a.v + gridB.value[i].v,
    }))))

const view = computed(() => ({
  w: geometry.value.x2 + geometry.value.w + 2,
  h: LADDER_H + geometry.value.h + 6,
}))

const midY = computed(() => LADDER_H + geometry.value.h / 2 + 5)

/** x of each ladder column, right-aligned like the rule itself. */
const LAD_W = 40
const ladderX = (i: number) => 96 + i * LAD_W

const VERDICT_TEXT: Record<Verdict, string> = {
  'match': 'equal',
  'stretch-a': 'stretch A',
  'stretch-b': 'stretch B',
  'error': 'mismatch',
}
</script>

<template>
  <WidgetFrame max-width="42rem">
    <svg
      class="dl-bcast"
      :viewBox="`0 0 ${view.w} ${view.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${formatShape(kase.a.dims)} with ${formatShape(kase.b.dims)}`"
    >
      <g class="dl-bcast__ladder">
        <text :x="90" :y="14" text-anchor="end">A {{ formatShape(kase.a.dims) }}</text>
        <text :x="90" :y="30" text-anchor="end">B {{ formatShape(kase.b.dims) }}</text>
        <text :x="90" :y="50" text-anchor="end">result</text>

        <g v-for="l in ladder" :key="l.axis" :class="`is-${l.verdict}`">
          <text :x="ladderX(l.axis)" :y="14" text-anchor="middle" :class="{ 'is-implied': !l.aGiven }">{{ l.aGiven ? l.a : '·' }}</text>
          <text :x="ladderX(l.axis)" :y="30" text-anchor="middle" :class="{ 'is-implied': !l.bGiven }">{{ l.bGiven ? l.b : '·' }}</text>
          <line :x1="ladderX(l.axis) - 13" :y1="36" :x2="ladderX(l.axis) + 13" :y2="36" />
          <text :x="ladderX(l.axis)" :y="50" text-anchor="middle" class="is-out">{{ l.out ?? '✗' }}</text>
          <text :x="ladderX(l.axis)" :y="60" text-anchor="middle" class="is-verdict">{{ VERDICT_TEXT[l.verdict] }}</text>
        </g>
      </g>

      <g class="dl-bcast__cells">
        <g v-for="(c, i) in gridA" :key="`a${i}`" :class="{ 'is-ghost': c.ghost }">
          <rect :x="c.x" :y="c.y" :width="CELL" :height="CELL" rx="3" />
          <text :x="c.x + CELL / 2" :y="c.y + CELL / 2 + 4" text-anchor="middle">{{ c.v }}</text>
        </g>
      </g>

      <text class="dl-bcast__op" :x="geometry.x1 - OP_W / 2" :y="midY" text-anchor="middle">+</text>

      <g class="dl-bcast__cells">
        <g v-for="(c, i) in gridB" :key="`b${i}`" :class="{ 'is-ghost': c.ghost }">
          <rect :x="c.x" :y="c.y" :width="CELL" :height="CELL" rx="3" />
          <text :x="c.x + CELL / 2" :y="c.y + CELL / 2 + 4" text-anchor="middle">{{ c.v }}</text>
        </g>
      </g>

      <text class="dl-bcast__op" :x="geometry.x2 - OP_W / 2" :y="midY" text-anchor="middle">=</text>

      <g v-if="!failing" class="dl-bcast__cells is-out">
        <g v-for="(c, i) in gridOut" :key="`o${i}`">
          <rect :x="c.x" :y="c.y" :width="CELL" :height="CELL" rx="3" />
          <text :x="c.x + CELL / 2" :y="c.y + CELL / 2 + 4" text-anchor="middle">{{ c.v }}</text>
        </g>
      </g>
      <text v-else class="dl-bcast__error" :x="geometry.x2" :y="midY" text-anchor="start">RuntimeError</text>
    </svg>

    <template #controls>
      <button
        v-for="(c, i) in CASES"
        :key="c.tab"
        type="button"
        class="dl-bcast__tab"
        :class="{ 'is-active': i === active, 'is-bad': i === CASES.length - 1 }"
        @click="active = i"
      >{{ c.tab }}</button>
    </template>

    <template #readout>
      <div class="dl-bcast__facts">
        <span v-if="!failing">result <strong>{{ formatShape(outDims) }}</strong></span>
        <span v-else class="dl-bcast__msg">
          The size of tensor a ({{ failing.a }}) must match the size of tensor b ({{ failing.b }}) at non-singleton dimension {{ failing.axis }}
        </span>
      </div>
      <div class="dl-bcast__note">{{ kase.note }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-bcast {
  width: 100%;
  height: 100%;
}

.dl-bcast__ladder text {
  font-size: 11px;
  fill: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-bcast__ladder text.is-implied {
  fill: var(--dl-muted);
}

.dl-bcast__ladder text.is-out {
  font-weight: 700;
  fill: var(--dl-accent);
}

.dl-bcast__ladder text.is-verdict {
  font-size: 7.5px;
  fill: var(--dl-muted);
}

.dl-bcast__ladder line {
  stroke: var(--dl-border);
  stroke-width: 1;
}

.dl-bcast__ladder g.is-error text.is-out,
.dl-bcast__ladder g.is-error text.is-verdict {
  fill: var(--dl-danger);
}

.dl-bcast__cells rect {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 0.8;
}

.dl-bcast__cells text {
  font-size: 10px;
  fill: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-bcast__cells g.is-ghost rect {
  fill: none;
  stroke-dasharray: 3 2;
}

.dl-bcast__cells g.is-ghost text {
  fill: var(--dl-muted);
}

.dl-bcast__cells.is-out rect {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-bcast__cells.is-out text {
  fill: var(--dl-heading);
  font-weight: 600;
}

.dl-bcast__op {
  font-size: 15px;
  fill: var(--dl-muted);
}

.dl-bcast__error {
  font-size: 12px;
  fill: var(--dl-danger);
  font-family: var(--slidev-code-font-family, monospace);
}

.dl-bcast__tab {
  padding: 0.24rem 0.6rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font-family: var(--slidev-code-font-family, monospace);
  font-size: 0.76rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-bcast__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-bcast__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-bcast__tab.is-bad.is-active {
  background: var(--dl-danger);
  border-color: var(--dl-danger);
}

.dl-bcast__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-bcast__facts {
  margin-bottom: 0.2rem;
}

.dl-bcast__facts strong {
  color: var(--dl-accent);
  font-size: 1rem;
}

.dl-bcast__msg {
  color: var(--dl-danger);
  font-family: var(--slidev-code-font-family, monospace);
  font-size: 0.74rem;
}

.dl-bcast__note {
  line-height: 1.35;
}
</style>
