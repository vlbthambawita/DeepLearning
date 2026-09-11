<script setup lang="ts">
/*
 * Where the recurrent connection is allowed to come from — 2025 Lecture 5/6
 * slide 10, which showed three arrows labelled W_hh, W_oh and W_oo on one
 * crowded figure and said nothing about which of them anyone actually uses.
 *
 * Same three, one at a time, plus the two variations every student meets in
 * `nn.RNN`'s constructor and nowhere in the 2025 deck: `num_layers` and
 * `bidirectional`. Stacking and bidirectionality are not new mathematics — they
 * are the same cell, wired twice — and putting all five on one timeline is what
 * makes that obvious.
 */
import { computed, ref } from 'vue'

interface Lane {
  label: string
  /** '→' forward in time, '←' backward. Only bidirectional uses both. */
  arrow?: string
  /** Superscript on the label — the layer number, when there are two. */
  sup?: string
}

interface Row {
  kind: 'in' | 'hidden' | 'out'
  lanes: Lane[]
}

/** A vertical connection within one time step. */
interface Feed { from: [number, number], to: [number, number] }

/** A connection that crosses a time step. */
interface Recur {
  from: [number, number]
  to: [number, number]
  dir: 'fwd' | 'back'
  /** Rendered as W with this subscript, e.g. 'hh'. Empty to draw no label. */
  sub: string
  /**
   * Vertical offset of the wire, in SVG units. Bidirectional draws two
   * recurrences through the same gap; without this they land on top of each
   * other and read as one double-headed arrow between adjacent boxes.
   */
  dy?: number
}

interface Wiring {
  key: string
  name: string
  rows: Row[]
  feeds: Feed[]
  recur: Recur[]
  headline: string
  note: string
}

const IN: Row = { kind: 'in', lanes: [{ label: 'x' }] }
const OUT: Row = { kind: 'out', lanes: [{ label: 'o' }] }
const HID: Row = { kind: 'hidden', lanes: [{ label: 'h' }] }

const PLAIN_FEEDS: Feed[] = [{ from: [2, 0], to: [1, 0] }, { from: [1, 0], to: [0, 0] }]

const WIRINGS: Wiring[] = [
  {
    key: 'hh',
    name: 'hidden → hidden',
    rows: [OUT, HID, IN],
    feeds: PLAIN_FEEDS,
    recur: [{ from: [1, 0], to: [1, 0], dir: 'fwd', sub: 'hh' }],
    headline: 'The standard RNN — and what nn.RNN implements.',
    note: 'The state passed forward is the hidden layer itself, so nothing is lost to the bottleneck of an output layer on the way. This is the only one of the three that is still in common use.',
  },
  {
    key: 'oh',
    name: 'output → hidden',
    rows: [OUT, HID, IN],
    feeds: PLAIN_FEEDS,
    recur: [{ from: [0, 0], to: [1, 0], dir: 'fwd', sub: 'oh' }],
    headline: 'The prediction is fed back in as the next input.',
    note: 'Everything the past contributes has to fit through o — usually far smaller than h. Cheap to train in parallel when the true outputs are known (teacher forcing), which is why generation models still use it.',
  },
  {
    key: 'oo',
    name: 'output → output',
    rows: [OUT, HID, IN],
    feeds: PLAIN_FEEDS,
    recur: [{ from: [0, 0], to: [0, 0], dir: 'fwd', sub: 'oo' }],
    headline: 'The recurrence sits entirely in the output layer.',
    note: 'The hidden layer no longer carries anything across time. Rare on its own; the idea survives inside autoregressive decoders.',
  },
  {
    key: 'stacked',
    name: 'stacked',
    rows: [
      OUT,
      { kind: 'hidden', lanes: [{ label: 'h', sup: '2' }] },
      { kind: 'hidden', lanes: [{ label: 'h', sup: '1' }] },
      IN,
    ],
    feeds: [{ from: [3, 0], to: [2, 0] }, { from: [2, 0], to: [1, 0] }, { from: [1, 0], to: [0, 0] }],
    recur: [
      { from: [2, 0], to: [2, 0], dir: 'fwd', sub: 'hh¹' },
      { from: [1, 0], to: [1, 0], dir: 'fwd', sub: 'hh²' },
    ],
    headline: 'num_layers=2 — the second layer reads the first layer\u2019s sequence of states.',
    note: 'Each layer has its own W. Depth here buys abstraction the same way it does in a CNN — layer 1 sees words, layer 2 sees what layer 1 made of them. Two or three layers is normal; twenty is not.',
  },
  {
    key: 'bidir',
    name: 'bidirectional',
    rows: [
      OUT,
      { kind: 'hidden', lanes: [{ label: 'h', arrow: '→' }, { label: 'h', arrow: '←' }] },
      IN,
    ],
    feeds: [
      { from: [2, 0], to: [1, 0] },
      { from: [2, 0], to: [1, 1] },
      { from: [1, 0], to: [0, 0] },
      { from: [1, 1], to: [0, 0] },
    ],
    recur: [
      { from: [1, 0], to: [1, 0], dir: 'fwd', sub: '', dy: 11 },
      { from: [1, 1], to: [1, 1], dir: 'back', sub: '', dy: -11 },
    ],
    headline: 'bidirectional=True — two separate cells, one reading each way.',
    note: 'Their states are concatenated, so the output size doubles. Only legal when the whole sequence is available at once — it can classify a finished review, and it cannot predict the next word.',
  },
]

const selected = ref(0)
const wiring = computed(() => WIRINGS[selected.value])

/* ---- geometry ------------------------------------------------------------ */

const STEPS = 3
const PITCH = 142
const LEFT = 64
const BOX_W = 98
const LANE_GAP = 8
const IO_H = 30
const HID_H = 42
const TOP = 16
const SPAN = 220
const HEIGHT = 284
const WIDTH = LEFT + (STEPS - 1) * PITCH + BOX_W + 26

const rows = computed(() => wiring.value.rows)

function rowY(r: number) {
  const n = rows.value.length
  return TOP + (r * SPAN) / Math.max(n - 1, 1)
}

function rowH(r: number) {
  return rows.value[r].kind === 'hidden' ? HID_H : IO_H
}

const colX = (i: number) => LEFT + i * PITCH

/** Left edge of lane `l` of row `r` at time step `i`. */
function laneX(r: number, l: number, i: number) {
  const n = rows.value[r].lanes.length
  const w = (BOX_W - (n - 1) * LANE_GAP) / n
  return colX(i) + l * (w + LANE_GAP)
}

function laneW(r: number) {
  const n = rows.value[r].lanes.length
  return (BOX_W - (n - 1) * LANE_GAP) / n
}

function laneMid(r: number, l: number, i: number) {
  return laneX(r, l, i) + laneW(r) / 2
}

/** Vertical connections, drawn inside one time step. */
function feedPath(f: Feed, i: number) {
  const [fr, fl] = f.from
  const [tr, tl] = f.to
  return {
    x1: laneMid(fr, fl, i),
    y1: rowY(fr) - 2,
    x2: laneMid(tr, tl, i),
    y2: rowY(tr) + rowH(tr) + 5,
  }
}

/**
 * A recurrent connection from step `i` to step `i ± 1`, drawn from the side of
 * one box to the side of the next so the arrow never crosses a box it is not
 * touching.
 */
function recurPath(rec: Recur, i: number) {
  const [fr, fl] = rec.from
  const [tr, tl] = rec.to
  const forward = rec.dir === 'fwd'
  const j = forward ? i + 1 : i - 1
  if (j < 0 || j > STEPS - 1)
    return null

  const fromX = forward ? laneX(fr, fl, i) + laneW(fr) : laneX(fr, fl, i)
  const toX = forward ? laneX(tr, tl, j) - 4 : laneX(tr, tl, j) + laneW(tr) + 4
  const offset = rec.dy ?? 0
  const fromY = rowY(fr) + rowH(fr) / 2 + offset
  const toY = rowY(tr) + rowH(tr) / 2 + offset
  const mid = (fromX + toX) / 2

  return {
    d: `M ${fromX} ${fromY} C ${mid} ${fromY}, ${mid} ${toY}, ${toX} ${toY}`,
    lx: mid,
    ly: Math.min(fromY, toY) - (fromY === toY ? 8 : 4),
  }
}

const recurArrows = computed(() =>
  wiring.value.recur.flatMap((rec, r) =>
    Array.from({ length: STEPS }, (_, i) => {
      const p = recurPath(rec, i)
      return p ? { ...p, sub: rec.sub, key: `${r}-${i}` } : null
    }).filter((x): x is NonNullable<typeof x> => x !== null)))
</script>

<template>
  <WidgetFrame max-width="38rem">
    <svg
      class="dl-wiring"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`Recurrent wiring: ${wiring.name}. ${wiring.headline}`"
    >
      <defs>
        <marker id="dl-wiring-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>

      <!-- Recurrent connections first, so a box always draws over its own wire. -->
      <g class="dl-wiring__recur">
        <template v-for="a in recurArrows" :key="a.key">
          <path :d="a.d" fill="none" marker-end="url(#dl-wiring-arrow)" />
          <text v-if="a.sub" :x="a.lx" :y="a.ly" text-anchor="middle">W<tspan class="dl-wiring__wsub" dy="2.5">{{ a.sub }}</tspan></text>
        </template>
      </g>

      <g v-for="i in STEPS" :key="`col${i}`">
        <line
          v-for="(f, fi) in wiring.feeds"
          :key="`f${fi}`"
          class="dl-wiring__feed"
          v-bind="feedPath(f, i - 1)"
          marker-end="url(#dl-wiring-arrow)"
        />

        <template v-for="(row, r) in rows" :key="`r${r}`">
          <template v-for="(lane, l) in row.lanes" :key="`l${l}`">
            <rect
              class="dl-wiring__box"
              :class="`is-${row.kind}`"
              :x="laneX(r, l, i - 1)" :y="rowY(r)" :width="laneW(r)" :height="rowH(r)" rx="5"
            />
            <text
              class="dl-wiring__label" :class="`is-${row.kind}`"
              :x="laneMid(r, l, i - 1)" :y="rowY(r) + rowH(r) / 2 + 4.5" text-anchor="middle"
            >
              {{ lane.label
              }}<tspan v-if="lane.sup" class="dl-wiring__sup" dy="-4">{{ lane.sup }}</tspan><tspan
                class="dl-wiring__sub" :dy="lane.sup ? 7 : 3"
              >{{ i }}</tspan><tspan v-if="lane.arrow" class="dl-wiring__dir" dy="-3"> {{ lane.arrow }}</tspan>
            </text>
          </template>
        </template>

        <text class="dl-wiring__t" :x="colX(i - 1) + BOX_W / 2" :y="HEIGHT - 6" text-anchor="middle">t = {{ i }}</text>
      </g>
    </svg>

    <template #controls>
      <div class="dl-wiring__tabs">
        <button
          v-for="(w, i) in WIRINGS"
          :key="w.key"
          type="button"
          :class="{ 'is-selected': i === selected }"
          @click="selected = i"
        >{{ w.name }}</button>
      </div>
    </template>

    <template #readout>
      <div><strong>{{ wiring.headline }}</strong></div>
      <div>{{ wiring.note }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-wiring {
  width: 100%;
  height: 100%;
}

.dl-wiring__box {
  stroke-width: 1.2;
  transition: fill 0.2s ease;
}

.dl-wiring__box.is-in {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
}

.dl-wiring__box.is-hidden {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dl-wiring__box.is-out {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.dl-wiring__label {
  font-size: 13px;
  font-weight: 600;
  fill: var(--dl-heading);
}

.dl-wiring__label.is-hidden {
  fill: #fff;
}

.dl-wiring__sub,
.dl-wiring__sup {
  font-size: 9px;
  font-weight: 400;
}

.dl-wiring__dir {
  font-size: 10px;
  font-weight: 400;
}

.dl-wiring__feed {
  stroke: var(--dl-muted);
  stroke-width: 1.4;
  color: var(--dl-muted);
}

.dl-wiring__recur path {
  stroke: var(--dl-accent-strong);
  stroke-width: 2.2;
  color: var(--dl-accent-strong);
}

.dl-wiring__recur text {
  fill: var(--dl-accent-strong);
  font-size: 10.5px;
  font-style: italic;
  font-weight: 600;
}

.dl-wiring__wsub {
  font-size: 8px;
  font-style: normal;
}

.dl-wiring__t {
  fill: var(--dl-muted);
  font-size: 10px;
}

.dl-wiring__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dl-wiring__tabs button {
  padding: 0.28rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--dl-border);
  background: transparent;
  color: var(--dl-body);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.dl-wiring__tabs button:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-wiring__tabs button.is-selected {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
}

.dl-wiring__tabs button:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}
</style>
