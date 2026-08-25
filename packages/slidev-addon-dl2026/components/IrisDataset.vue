<script setup lang="ts">
/*
 * Lecture 02 slide 6 — the Iris dataset, as flowers rather than as a matrix.
 *
 * The notation slide that follows needs X, x⁽ⁱ⁾ and y to mean something
 * concrete, and "150 examples, 4 features" does not supply that. So: the three
 * real species, and the four measurements drawn to scale from a real row of the
 * data, on a shared centimetre ruler.
 *
 * Drawing them to scale is the whole point. Setosa's petal is 1.5 × 0.2 cm and
 * virginica's is 5.5 × 2.1 cm, and once those are side by side on one ruler
 * nobody has to be told why petal length is the feature that separates the
 * classes — or why setosa is the easy one and the other two overlap.
 *
 * Photographs arrive through named slots rather than a `src` prop: Vite
 * rewrites `src` attributes it can see in a template, but a URL passed as a
 * prop string is left alone and breaks under a non-root base path. Same reason
 * as FigureSpotlight.
 */
import { computed, ref } from 'vue'

interface Species {
  key: 'setosa' | 'versicolor' | 'virginica'
  /** Botanical name, as the dataset spells it. */
  name: string
  /** Encoded target value used throughout the course. */
  target: 0 | 1 | 2
  /** Index of the representative row, 1-based to match x⁽ⁱ⁾ on the next slide. */
  row: number
  /** sepal length, sepal width, petal length, petal width — centimetres. */
  x: [number, number, number, number]
  /** Photographer and licence. All three photos require attribution. */
  credit: string
}

/*
 * One real row per class, picked as the row nearest that class's mean, so the
 * drawing is representative rather than an outlier. (Row 51 — the first
 * versicolor in the file — has the longest sepal in the entire dataset, which
 * would suggest exactly the wrong thing.)
 */
const SPECIES: Species[] = [
  { key: 'setosa', name: 'Iris setosa', target: 0, row: 8, x: [5.0, 3.4, 1.5, 0.2], credit: 'Radomil, CC BY-SA 3.0' },
  { key: 'versicolor', name: 'Iris versicolor', target: 1, row: 100, x: [5.7, 2.8, 4.1, 1.3], credit: 'Dlanglois, CC BY-SA 3.0' },
  { key: 'virginica', name: 'Iris virginica', target: 2, row: 113, x: [6.8, 3.0, 5.5, 2.1], credit: 'Frank Mayfield, CC BY-SA 2.0' },
]

const FEATURES = ['sepal length', 'sepal width', 'petal length', 'petal width']

const selected = ref<Species['key']>('setosa')
const active = computed(() => SPECIES.find(s => s.key === selected.value)!)

/* ── the scale drawing ─────────────────────────────────────────────────── */

const PX_PER_CM = 22
const BASELINE = 176
const RULER_X = 26
/** 7 cm covers the longest sepal in the dataset (7.9 cm) with room to spare. */
const RULER = [0, 1, 2, 3, 4, 5, 6, 7]

/** A petal outline: pointed at the tip, widest around the middle, rounded at
 *  the base. Drawn upright from `base`, so height is the measured length. */
function petalPath(cx: number, lengthCm: number, widthCm: number) {
  const h = lengthCm * PX_PER_CM
  const w = Math.max(widthCm * PX_PER_CM, 3)
  const tip = BASELINE - h
  return [
    `M${cx},${BASELINE}`,
    `C${cx - w / 2},${BASELINE - h * 0.22} ${cx - w / 2},${BASELINE - h * 0.72} ${cx},${tip}`,
    `C${cx + w / 2},${BASELINE - h * 0.72} ${cx + w / 2},${BASELINE - h * 0.22} ${cx},${BASELINE}`,
    'Z',
  ].join(' ')
}

const parts = computed(() => [
  { key: 'sepal', cx: 100, label: 'sepal', len: active.value.x[0], wide: active.value.x[1] },
  { key: 'petal', cx: 198, label: 'petal', len: active.value.x[2], wide: active.value.x[3] },
].map(p => ({
  ...p,
  d: petalPath(p.cx, p.len, p.wide),
  topY: BASELINE - p.len * PX_PER_CM,
  // The width arrow sits where the outline is actually widest.
  midY: BASELINE - p.len * PX_PER_CM * 0.47,
  halfW: Math.max(p.wide * PX_PER_CM, 3) / 2,
})))
</script>

<template>
  <WidgetFrame max-width="56rem">
    <div class="dl-iris">
      <div class="dl-iris__photos">
        <button
          v-for="s in SPECIES"
          :key="s.key"
          type="button"
          class="dl-iris__card"
          :class="{ 'is-active': s.key === selected }"
          @click="selected = s.key"
        >
          <span class="dl-iris__frame">
            <slot :name="s.key" />
          </span>
          <span class="dl-iris__name">{{ s.name }}</span>
          <span class="dl-iris__target">y = {{ s.target }}</span>
        </button>
      </div>

      <svg viewBox="0 0 292 210" class="dl-iris__scale" role="img"
        :aria-label="`Sepal and petal of ${active.name} drawn to scale`">
        <!-- centimetre ruler -->
        <line :x1="RULER_X" :y1="BASELINE" :x2="RULER_X" :y2="BASELINE - 7 * PX_PER_CM" class="ruler" />
        <template v-for="c in RULER" :key="c">
          <line
            :x1="RULER_X - 4" :x2="RULER_X + 4"
            :y1="BASELINE - c * PX_PER_CM" :y2="BASELINE - c * PX_PER_CM"
            class="ruler"
          />
          <text :x="RULER_X - 7" :y="BASELINE - c * PX_PER_CM + 3.5" class="tick">{{ c }}</text>
        </template>
        <text :x="RULER_X - 7" :y="BASELINE + 16" class="tick">cm</text>

        <line x1="40" :y1="BASELINE" x2="284" :y2="BASELINE" class="baseline" />

        <g v-for="p in parts" :key="p.key" :class="`is-${p.key}`">
          <path :d="p.d" class="organ" />

          <!-- length: a dimension line from the baseline to the tip -->
          <line :x1="p.cx + 34" :y1="BASELINE" :x2="p.cx + 34" :y2="p.topY" class="dim" />
          <line :x1="p.cx + 30" :y1="BASELINE" :x2="p.cx + 38" :y2="BASELINE" class="dim" />
          <line :x1="p.cx + 30" :y1="p.topY" :x2="p.cx + 38" :y2="p.topY" class="dim" />
          <text :x="p.cx + 41" :y="(BASELINE + p.topY) / 2" class="dimlbl">
            <tspan :x="p.cx + 41" dy="-2">{{ p.label }}</tspan>
            <tspan :x="p.cx + 41" dy="12">length</tspan>
            <tspan :x="p.cx + 41" dy="12" class="is-value">{{ p.len.toFixed(1) }} cm</tspan>
          </text>

          <!-- width: a dimension line across the widest part -->
          <line :x1="p.cx - p.halfW" :y1="p.midY" :x2="p.cx + p.halfW" :y2="p.midY" class="dim" />
          <text :x="p.cx" :y="p.midY - 6" class="dimlbl is-centred">
            <tspan :x="p.cx">width</tspan>
            <tspan :x="p.cx" dy="12" class="is-value">{{ p.wide.toFixed(1) }} cm</tspan>
          </text>
        </g>
      </svg>
    </div>

    <template #readout>
      <p class="dl-iris__row">
        <Katex :expr="`\\mathbf{x}^{(${active.row})} = [\\,${active.x.map(v => v.toFixed(1)).join(',\\; ')}\\,]^\\top`" />
        <span class="dl-iris__units">— {{ FEATURES.join(', ') }}, all in cm</span>
      </p>
      <p class="dl-iris__row">
        <Katex :expr="`y^{(${active.row})} = ${active.target}`" />
        <span class="dl-iris__units">— the label for <em>{{ active.name }}</em>, one of three classes, 50 examples each</span>
      </p>
      <!-- All three photographs are share-alike licensed; the credit has to travel with them. -->
      <p class="dl-iris__credit">Photo: {{ active.credit }}, via Wikimedia Commons</p>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-iris {
  display: flex;
  align-items: stretch;
  gap: 1.1rem;
  width: 100%;
  min-width: 0;
}

.dl-iris__photos {
  display: flex;
  gap: 0.6rem;
  flex: 1 1 auto;
  min-width: 0;
}

.dl-iris__card {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.2rem;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dl-iris__frame {
  display: block;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--dl-border);
  filter: saturate(0.55) opacity(0.7);
  transition: filter 0.2s ease, border-color 0.2s ease;
}

.dl-iris__card.is-active .dl-iris__frame {
  filter: none;
  border-color: var(--dl-accent);
}

/*
 * The photo itself comes from the slide, so it is styled through :deep. The
 * source crops are square; 4:5 fills the slide's vertical space better and only
 * trims the sides, which on a centred flower costs nothing.
 */
.dl-iris__frame :deep(img) {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.dl-iris__name {
  font-size: 0.78rem;
  font-style: italic;
  color: var(--dl-muted);
  line-height: 1.25;
}

.dl-iris__card.is-active .dl-iris__name {
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-iris__target {
  font-size: 0.72rem;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-iris__card.is-active .dl-iris__target {
  color: var(--dl-accent);
  font-weight: 600;
}

.dl-iris__scale {
  flex: 0 0 15.5rem;
  align-self: center;
  max-height: 100%;
}

.ruler,
.baseline {
  stroke: var(--dl-border);
  stroke-width: 1;
}

.baseline {
  stroke-dasharray: 3 3;
}

.tick {
  fill: var(--dl-muted);
  font-size: 8px;
  text-anchor: end;
}

.organ {
  stroke-width: 1.5;
  transition: d 0.25s ease;
}

.is-sepal .organ {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.is-petal .organ {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dim {
  stroke: var(--dl-muted);
  stroke-width: 1;
}

.dimlbl {
  fill: var(--dl-muted);
  font-size: 8.5px;
}

.dimlbl.is-centred {
  text-anchor: middle;
}

.dimlbl .is-value {
  fill: var(--dl-heading);
  font-weight: 600;
  font-size: 9.5px;
}

.dl-iris__row {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dl-iris__units {
  color: var(--dl-muted);
}

.dl-iris__credit {
  margin: 0.15rem 0 0;
  font-size: 0.72rem;
  color: var(--dl-muted);
}
</style>
