<script setup lang="ts">
/*
 * A filter run over a whole small image, so "feature map" stops being a word.
 *
 * This replaces the textbook's dog photograph with an image the room can do the
 * arithmetic on: a 9x9 frame with a bright square in it, and filters whose
 * output is exact integers. The vertical-edge filter answers -27 down the left
 * side of the square, +27 down the right, and 0 everywhere else — including
 * along the square's top and bottom edges, which is the moment students stop
 * believing a filter detects "the object" and start believing it detects one
 * pattern, everywhere at once.
 *
 * Two modes:
 *   single  — one filter, and one output cell's receptive field outlined in the
 *             input, stepped cell by cell.
 *   compare — the same image through every filter at once, no numbers, so the
 *             three feature maps can be read as pictures.
 */
import { computed, ref } from 'vue'
import { conv2d, num, outputSize } from '../composables/useConvolution'
import { BRIGHT_SQUARE, CLASSIC_FILTERS, type NamedFilter } from '../composables/useFilterBank'

const props = withDefaults(defineProps<{
  image?: number[][]
  filters?: NamedFilter[]
  padding?: number
  mode?: 'single' | 'compare'
  /** Print the number inside every cell. Off in compare mode, where it is noise. */
  values?: boolean
}>(), {
  image: () => BRIGHT_SQUARE,
  filters: () => CLASSIC_FILTERS,
  padding: 1,
  mode: 'single',
  values: true,
})

const pick = ref(0)
const filter = computed(() => props.filters[Math.min(pick.value, props.filters.length - 1)])

function run(kernel: number[][]) {
  return conv2d(props.image, kernel, { padding: props.padding, stride: 1 })
}

const result = computed(() => run(filter.value.kernel))
const maps = computed(() => props.filters.map(f => ({ filter: f, result: run(f.kernel) })))

const rows = computed(() => props.image.length)
const cols = computed(() => props.image[0]?.length ?? 0)
const outRows = computed(() => outputSize(rows.value, filter.value.kernel.length, props.padding, 1))

/** Which output cell's receptive field is outlined. -1 = none yet. */
const at = ref(0)
const count = computed(() => result.value.steps.length)
const cursor = computed(() => Math.min(at.value, count.value - 1))
const current = computed(() => (cursor.value < 0 ? null : result.value.steps[cursor.value]))
const done = computed(() => cursor.value >= count.value - 1)

function step() {
  at.value = cursor.value < count.value - 1 ? cursor.value + 1 : 0
}

function choose(i: number) {
  pick.value = i
  at.value = 0
}

/** Is input cell (r, c) inside the window that produced the current output? */
function inField(r: number, c: number) {
  const s = current.value
  if (!s)
    return false
  const pr = r + props.padding
  const pc = c + props.padding
  return pr >= s.top && pr < s.top + filter.value.kernel.length
    && pc >= s.left && pc < s.left + (filter.value.kernel[0]?.length ?? 0)
}

const maxInput = computed(() => Math.max(...props.image.flat().map(Math.abs), 1))

/** Grayscale, because the input is a picture. Ink flips on the light cells. */
function pixelStyle(v: number) {
  const t = Math.abs(v) / maxInput.value
  const lightness = 13 + t * 79
  return {
    background: `hsl(205 10% ${lightness}%)`,
    color: t > 0.55 ? '#101418' : '#e8edf1',
  }
}

/*
 * Feature-map values are signed and the sign is the point: a vertical edge
 * answers +27 one way round and -27 the other. Accent for positive, danger for
 * negative, strength by magnitude — and the triplets are theme variables, so
 * both stay legible on the near-black canvas.
 */
function mapStyle(v: number, scale: number) {
  const t = Math.min(1, Math.abs(v) / scale)
  const alpha = (props.values && props.mode === 'single' ? 0.62 : 0.92) * t
  const ink = v < 0 ? 'var(--dl-fmap-neg)' : 'var(--dl-fmap-pos)'
  return { background: `rgb(${ink} / ${alpha})` }
}

function scaleOf(output: number[][]) {
  return Math.max(...output.flat().map(Math.abs), 1)
}

/** True for the padding that makes the map the same size as the image. */
const sameSize = computed(() => outRows.value === rows.value)

const readout = computed(() => {
  const s = current.value
  if (!s)
    return ''
  const pads = s.taps.filter(t => t.isPad).length
  const tail = pads > 0 ? ` — ${pads} of its ${s.taps.length} taps land on padded zeros` : ''
  return `Y[${s.row}, ${s.col}] = ${num(s.sum)}${tail}`
})
</script>

<template>
  <WidgetFrame max-width="52rem">
    <div class="dl-fmap" :class="`is-${props.mode}`">
      <!-- Single mode: image, the filter, and one feature map with a live patch. -->
      <template v-if="props.mode === 'single'">
        <div class="dl-fmap__panel">
          <div class="dl-fmap__title">input image — {{ rows }}×{{ cols }}</div>
          <div class="dl-fmap__grid" :style="{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }">
            <div
              v-for="(v, i) in props.image.flat()"
              :key="`px${i}`"
              class="dl-fmap__cell"
              :class="{ 'is-field': inField(Math.floor(i / cols), i % cols) }"
              :style="pixelStyle(v)"
            >{{ props.values ? num(v) : '' }}</div>
          </div>
        </div>

        <div class="dl-fmap__panel is-kernel">
          <div class="dl-fmap__title">filter w</div>
          <div class="dl-fmap__grid is-w" :style="{ gridTemplateColumns: `repeat(${filter.kernel[0].length}, 2.1rem)` }">
            <div v-for="(v, i) in filter.kernel.flat()" :key="`k${i}`" class="dl-fmap__cell is-weight">{{ num(v) }}</div>
          </div>
          <div class="dl-fmap__arrow" aria-hidden="true">→</div>
        </div>

        <div class="dl-fmap__panel">
          <div class="dl-fmap__title">feature map — {{ outRows }}×{{ outRows }}</div>
          <div class="dl-fmap__grid" :style="{ gridTemplateColumns: `repeat(${result.output[0].length}, var(--cell))` }">
            <div
              v-for="(v, i) in result.output.flat()"
              :key="`y${i}`"
              class="dl-fmap__cell is-out"
              :class="{ 'is-current': cursor === i }"
              :style="mapStyle(v, scaleOf(result.output))"
            >{{ props.values ? num(v) : '' }}</div>
          </div>
        </div>
      </template>

      <!-- Compare mode: same image, every filter, read as pictures. -->
      <template v-else>
        <div class="dl-fmap__panel">
          <div class="dl-fmap__title">input</div>
          <div class="dl-fmap__grid" :style="{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }">
            <div v-for="(v, i) in props.image.flat()" :key="`cx${i}`" class="dl-fmap__cell" :style="pixelStyle(v)" />
          </div>
        </div>

        <div v-for="m in maps" :key="m.filter.id" class="dl-fmap__panel">
          <div class="dl-fmap__title">{{ m.filter.label }}</div>
          <div class="dl-fmap__grid is-w dl-fmap__inline-w" :style="{ gridTemplateColumns: `repeat(${m.filter.kernel[0].length}, 1.25rem)` }">
            <div v-for="(v, i) in m.filter.kernel.flat()" :key="`ck${i}`" class="dl-fmap__cell is-weight is-mini">{{ num(v, 1) }}</div>
          </div>
          <div class="dl-fmap__grid" :style="{ gridTemplateColumns: `repeat(${m.result.output[0].length}, var(--cell))` }">
            <div
              v-for="(v, i) in m.result.output.flat()"
              :key="`cy${i}`"
              class="dl-fmap__cell is-out"
              :style="mapStyle(v, scaleOf(m.result.output))"
            />
          </div>
        </div>
      </template>
    </div>

    <template #controls>
      <template v-if="props.mode === 'single'">
        <StepButton :label="done ? 'Back to the start' : 'Next patch'" glyph="▸" @click="step" />
        <StepButton
          v-for="(f, i) in props.filters"
          :key="f.id"
          :label="f.label"
          :variant="i === pick ? 'primary' : 'ghost'"
          @click="choose(i)"
        />
      </template>
    </template>

    <template #readout>
      <template v-if="props.mode === 'single'">
        <span v-if="readout">
          {{ readout }}. Padding {{ props.padding }}<span v-if="sameSize">, so the feature map is the same size as the image</span>.
        </span>
      </template>
      <template v-else>
        One image, {{ props.filters.length }} filters, {{ props.filters.length }} feature maps.
        Teal is positive, red negative, and strength is magnitude.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-fmap {
  --cell: 1.6rem;
  --dl-fmap-pos: 0 151 167;
  --dl-fmap-neg: 211 47 47;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}

:global(html.dark) .dl-fmap {
  --dl-fmap-pos: 46 201 216;
  --dl-fmap-neg: 255 123 114;
}

/*
 * Four 9-cell grids side by side, and the prose rail is not negotiable: the
 * cells are fixed in rem, so anything larger than this slides *under* the aside
 * rather than shrinking. 0.75rem fits four panels and their gaps beside a 19rem
 * rail on a 16:9 canvas, and compare mode prints no numbers, so a cell only has
 * to be a visible square.
 */
.dl-fmap.is-compare {
  --cell: 0.75rem;
  gap: 1rem;
}

.dl-fmap__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  position: relative;
}

.dl-fmap__panel.is-kernel {
  align-self: center;
  padding: 0 0.4rem;
}

.dl-fmap__title {
  font-size: 0.72rem;
  color: var(--dl-muted);
  text-align: center;
  white-space: nowrap;
}

.dl-fmap__grid {
  display: grid;
  gap: 0;
}

.dl-fmap__inline-w {
  margin-bottom: 0.15rem;
}

.dl-fmap__cell {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.12);
  font-size: 0.6rem;
  font-variant-numeric: tabular-nums;
}

.dl-fmap__cell.is-field {
  border-color: var(--dl-accent);
  box-shadow: inset 0 0 0 2px var(--dl-accent);
  z-index: 1;
}

.dl-fmap__cell.is-out {
  border-color: var(--dl-border);
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-fmap__cell.is-out.is-current {
  box-shadow: inset 0 0 0 2px var(--dl-heading);
  z-index: 1;
}

.dl-fmap__cell.is-weight {
  aspect-ratio: 1;
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  color: var(--dl-accent-strong);
  font-weight: 600;
  font-size: 0.72rem;
}

.dl-fmap__cell.is-weight.is-mini {
  font-size: 0.54rem;
}

.dl-fmap__arrow {
  color: var(--dl-muted);
  font-size: 1.1rem;
  line-height: 1;
}
</style>
