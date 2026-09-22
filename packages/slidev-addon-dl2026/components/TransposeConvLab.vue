<script setup lang="ts">
/*
 * How a generator makes a small thing bigger, and where the checkerboard comes
 * from.
 *
 * Three panels, left to right, in the order the operation happens: the input,
 * the input with `stride - 1` zeros inserted between every element, and the
 * output of an ordinary convolution over that. Transposed convolution is not a
 * new operation — it is a convolution over a deliberately spread-out input, and
 * seeing the zeros is what makes "fractionally strided" stop being a mystery.
 *
 * The output panel is shaded by *how many kernel taps land on each cell*. When
 * stride divides kernel the interior is flat and the shading is uniform; when it
 * does not, the counts alternate and the panel visibly checks. That pattern is
 * baked into the arithmetic, so a freshly-initialised generator paints it before
 * it has learned anything at all — which is why every DCGAN sample from 2016 has
 * a faint grid in it, and why modern code upsamples then convolves instead.
 *
 * Defaults are DCGAN's own: 4x4 kernel, stride 2, which is the *even* case. Drop
 * the kernel to 3 and the checkerboard appears.
 */
import { computed, ref } from 'vue'
import { transposeCoverage } from '../composables/useGenerative'

const IN_SIZE = 3

const kernel = ref(4)
const stride = ref(2)

const cov = computed(() => transposeCoverage(IN_SIZE, kernel.value, stride.value))

/** The zero-inserted input: where the original values sit, and where zeros do. */
const spread = computed(() => {
  const n = (IN_SIZE - 1) * stride.value + 1
  const cells: { i: number, j: number, live: boolean }[] = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++)
      cells.push({ i, j, live: i % stride.value === 0 && j % stride.value === 0 })
  }
  return { n, cells }
})

/** Panel geometry: every panel keeps the same cell size so sizes are comparable. */
const CELL = 13
const PANEL_GAP = 46
const TOP = 26

function panelX(index: number) {
  const widths = [IN_SIZE, spread.value.n, cov.value.outSize]
  let x = 8
  for (let k = 0; k < index; k++)
    x += widths[k] * CELL + PANEL_GAP
  return x
}

const totalWidth = computed(() =>
  panelX(2) + cov.value.outSize * CELL + 10)

/*
 * Shade an output cell by its tap count.
 *
 * The scale is set by the *interior* range, because that is where the
 * checkerboard lives; edge cells legitimately fall below it in every
 * configuration, so the result is clamped rather than allowed to go negative.
 */
function shade(count: number) {
  const { min, max } = cov.value
  // Even coverage means every interior cell is identical, so there is no range
  // to spread across — render them all mid-tone rather than at the bottom of the
  // scale, where the whole panel would fade out against a dark background.
  if (max === min)
    return count >= min ? 0.62 : 0.3
  return Math.min(Math.max(0.2 + 0.72 * ((count - min) / (max - min)), 0.12), 0.95)
}

const arrowY = computed(() => TOP + (Math.max(IN_SIZE, spread.value.n, cov.value.outSize) * CELL) / 2)
</script>

<template>
  <WidgetFrame max-width="44rem">
    <svg class="dl-tc" :viewBox="`0 0 ${totalWidth} 186`" role="img"
         aria-label="A transposed convolution as zero insertion followed by an ordinary convolution">
      <!-- 1. the input -->
      <text class="dl-tc__cap" :x="panelX(0)" y="16">input {{ IN_SIZE }}×{{ IN_SIZE }}</text>
      <rect
        v-for="n in IN_SIZE * IN_SIZE" :key="`i${n}`"
        class="dl-tc__in"
        :x="panelX(0) + ((n - 1) % IN_SIZE) * CELL"
        :y="TOP + Math.floor((n - 1) / IN_SIZE) * CELL"
        :width="CELL - 1.5" :height="CELL - 1.5"
      />

      <!-- 2. the same input with zeros between it -->
      <text class="dl-tc__cap" :x="panelX(1)" y="16">
        zeros inserted {{ spread.n }}×{{ spread.n }}
      </text>
      <rect
        v-for="(c, n) in spread.cells" :key="`s${n}`"
        class="dl-tc__spread" :class="{ 'is-live': c.live }"
        :x="panelX(1) + c.j * CELL"
        :y="TOP + c.i * CELL"
        :width="CELL - 1.5" :height="CELL - 1.5"
      />

      <!-- 3. the result, shaded by how many taps reached each cell -->
      <text class="dl-tc__cap" :x="panelX(2)" y="16">
        output {{ cov.outSize }}×{{ cov.outSize }}
      </text>
      <template v-for="(row, i) in cov.counts" :key="`r${i}`">
        <rect
          v-for="(c, j) in row" :key="`o${i}-${j}`"
          class="dl-tc__out"
          :x="panelX(2) + j * CELL"
          :y="TOP + i * CELL"
          :width="CELL - 1.5" :height="CELL - 1.5"
          :style="{ opacity: shade(c) }"
        />
      </template>

      <text class="dl-tc__arrow" :x="panelX(1) - PANEL_GAP / 2" :y="arrowY" text-anchor="middle">→</text>
      <text class="dl-tc__arrow" :x="panelX(2) - PANEL_GAP / 2" :y="arrowY" text-anchor="middle">→</text>
      <text class="dl-tc__sub" :x="panelX(1) - PANEL_GAP / 2" :y="arrowY + 15" text-anchor="middle">
        stride {{ stride }}
      </text>
      <text class="dl-tc__sub" :x="panelX(2) - PANEL_GAP / 2" :y="arrowY + 15" text-anchor="middle">
        conv {{ kernel }}×{{ kernel }}
      </text>

      <text class="dl-tc__formula" x="8" y="180">
        ({{ IN_SIZE }} − 1)·{{ stride }} + {{ kernel }} = {{ cov.outSize }}
      </text>
    </svg>

    <template #controls>
      <Slider v-model="kernel" label="kernel" :min="2" :max="5" :step="1" :precision="0" />
      <Slider v-model="stride" label="stride" :min="1" :max="3" :step="1" :precision="0" />
      <StepButton label="DCGAN (4, 2)" variant="ghost" @click="kernel = 4; stride = 2" />
      <StepButton label="The bad one (3, 2)" variant="ghost" @click="kernel = 3; stride = 2" />
    </template>

    <template #readout>
      <span v-if="cov.even">
        Stride {{ stride }} divides kernel {{ kernel }}: every interior cell gets
        {{ cov.min }} taps. No checkerboard.
      </span>
      <span v-else>
        Interior cells get between {{ cov.min }} and {{ cov.max }} taps — a
        {{ (cov.max / cov.min).toFixed(0) }}× difference, laid out in a grid. That
        is the checkerboard, and no weight has been learned yet.
      </span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-tc {
  width: 100%;
  height: 100%;
  max-height: 14rem;
  font-family: inherit;
}

.dl-tc__cap {
  fill: var(--dl-body);
  font-size: 10.5px;
  font-weight: 600;
}

.dl-tc__in {
  fill: var(--dl-accent);
}

.dl-tc__spread {
  fill: var(--dl-border);
}

.dl-tc__spread.is-live {
  fill: var(--dl-accent);
}

.dl-tc__out {
  fill: var(--dl-accent-strong);
}

.dl-tc__arrow {
  fill: var(--dl-muted);
  font-size: 17px;
}

.dl-tc__sub {
  fill: var(--dl-muted);
  font-size: 9px;
}

.dl-tc__formula {
  fill: var(--dl-heading);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
