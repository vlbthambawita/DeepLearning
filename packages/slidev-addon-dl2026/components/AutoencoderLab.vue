<script setup lang="ts">
/*
 * Why an autoencoder is not a generative model.
 *
 * The data is the same three modes the rest of the deck uses, here as blobs in
 * the plane. With a two-dimensional latent the model reconstructs everything
 * perfectly and has learned nothing; with a one-dimensional latent it is forced
 * to find a curve through the data, which is the useful thing an autoencoder
 * does.
 *
 * Then press **Decode a fresh z**. The latent strip along the bottom shows where
 * the training data actually landed: three clumps with two gaps. A z drawn from
 * a gap decodes to a point sitting in empty space — a shape no training example
 * ever had. Nothing in the reconstruction loss ever asked the encoder to *fill*
 * the latent space, only to be invertible on the points it was shown, and that
 * gap is exactly what the VAE's second term is for.
 *
 * The curve is written down rather than trained (see `decode1D`), so the widget
 * is instant and identical every time. The slide says so out loud.
 */
import { computed, ref } from 'vue'
import type { Point } from '../composables/useGenerative'
import {
  decode1D,
  latentCodes,
  latentGaps,
  reconstruct1D,
  sampleData,
} from '../composables/useGenerative'

const props = withDefaults(defineProps<{
  /** Start with the latent big enough to copy the input. */
  latentDim?: 1 | 2
}>(), {
  latentDim: 1,
})

const dim = ref<1 | 2>(props.latentDim)

const data = sampleData(22)
const codes = latentCodes(data)

const recon = computed<Point[]>(() =>
  dim.value === 2 ? data : data.map(reconstruct1D))

/** The decoder's whole output set: a curve, when the latent is one number. */
const curve = computed(() => {
  const out: Point[] = []
  // Stops just past the outermost codes: drawn further, the parabola climbs out
  // of the plot and reads as part of the data rather than as the decoder's range.
  for (let i = 0; i <= 80; i++)
    out.push(decode1D(-1.25 + (2.5 * i) / 80))
  return out
})

/*
 * The z values a student is walked through, in order: two that sit inside a
 * clump and decode to something plausible, then the two widest gaps. Fixed
 * rather than random so the demonstration lands the same way every time, and
 * the gaps are measured off the codes so they cannot drift out of step.
 */
const PROBES = [-1, 0, ...latentGaps(codes)]
const probe = ref(-1)

const z = computed(() => (probe.value >= 0 ? PROBES[probe.value % PROBES.length] : null))
const decoded = computed(() => (z.value === null ? null : decode1D(z.value)))

/** How far the nearest training point is from what this z decoded to. */
const nearest = computed(() => {
  const d = decoded.value
  if (!d)
    return null
  return Math.sqrt(Math.min(...data.map(p => (p.x - d.x) ** 2 + (p.y - d.y) ** 2)))
})

/*
 * A decoded point further from every training example than the cluster spread
 * itself is one no training example ever looked like.
 */
const inHole = computed(() => nearest.value !== null && nearest.value > 0.6)

function nextProbe() {
  probe.value = probe.value + 1
}

function reset() {
  probe.value = -1
}

// --- the latent strip ------------------------------------------------------
const STRIP_W = 420
const STRIP_LEFT = 26

function stripX(v: number) {
  return STRIP_LEFT + ((v + 1.5) / 3) * STRIP_W
}
</script>

<template>
  <WidgetFrame max-width="44rem">
    <div class="dl-ae">
      <Plot2D
        :x-domain="[-3.6, 3.6]"
        :y-domain="[-2.4, 2.4]"
        :width="470" :height="220"
        :x-ticks="[-3, 0, 3]" :y-ticks="[-2, 0, 2]"
      >
        <!-- everything a 1-D decoder can produce, ever -->
        <PlotCurve
          v-if="dim === 1"
          :points="curve"
          color="var(--dl-accent)"
          :width="2"
          :opacity="0.5"
        />
        <PlotPoints :points="data" :radius="3.4" color="var(--dl-muted)" :opacity="0.55" />
        <PlotPoints :points="recon" :radius="3" color="var(--dl-accent)" />

        <template v-if="decoded">
          <PlotPoints
            :points="[{ ...decoded, highlight: true }]"
            :radius="7"
            :color="inHole ? 'var(--dl-danger)' : 'var(--dl-heading)'"
          />
          <PlotLabel
            :at="[decoded.x, decoded.y]"
            :text="`g(${z!.toFixed(2)})`"
            :dy="-14"
            :color="inHole ? 'var(--dl-danger)' : 'var(--dl-heading)'"
            bold
          />
        </template>
      </Plot2D>

      <!-- where the training data's codes actually are -->
      <svg class="dl-ae__strip" viewBox="0 0 470 46" role="img"
           aria-label="The latent codes of every training point, on one axis">
        <line class="dl-ae__axis" :x1="stripX(-1.5)" :x2="stripX(1.5)" y1="26" y2="26" />
        <line
          v-for="(c, i) in codes" :key="i"
          class="dl-ae__tick" :x1="stripX(c)" :x2="stripX(c)" y1="16" y2="26"
        />
        <template v-if="z !== null">
          <line class="dl-ae__probe" :class="{ 'is-hole': inHole }"
                :x1="stripX(z)" :x2="stripX(z)" y1="10" y2="34" />
          <text class="dl-ae__probelab" :class="{ 'is-hole': inHole }"
                :x="stripX(z)" y="44" text-anchor="middle">z = {{ z.toFixed(2) }}</text>
        </template>
        <text class="dl-ae__striplab" x="8" y="30">z</text>
      </svg>
    </div>

    <template #controls>
      <StepButton
        :label="dim === 1 ? 'latent = 1 (undercomplete)' : 'latent = 2 (as wide as the input)'"
        variant="ghost"
        glyph="⇆"
        @click="dim = dim === 1 ? 2 : 1"
      />
      <StepButton label="Decode a fresh z" :disabled="dim !== 1" @click="nextProbe" />
      <StepButton v-if="probe >= 0" label="Clear" variant="ghost" @click="reset" />
    </template>

    <template #readout>
      <span v-if="dim === 2">
        Latent as wide as the input: the reconstruction is exact and the model has
        learned nothing — grey and teal are the same points.
      </span>
      <span v-else-if="z === null">
        Latent codes sit in three clumps with two gaps. Decode a z from a gap and
        see what comes out.
      </span>
      <span v-else-if="inHole">
        z = {{ z.toFixed(2) }} fell in a gap. The nearest real example is
        {{ nearest!.toFixed(2) }} away — this output is not data.
      </span>
      <span v-else>
        z = {{ z.toFixed(2) }} sits inside a clump, so it decodes to something
        plausible — nearest real example {{ nearest!.toFixed(2) }} away.
      </span>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-ae {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
}

.dl-ae__strip {
  width: 100%;
  height: 2.6rem;
  flex: 0 0 auto;
  font-family: inherit;
}

.dl-ae__axis {
  stroke: var(--dl-muted);
  stroke-width: 1.2;
}

.dl-ae__tick {
  stroke: var(--dl-body);
  stroke-width: 1.4;
}

.dl-ae__probe {
  stroke: var(--dl-heading);
  stroke-width: 2.4;
}

.dl-ae__probe.is-hole {
  stroke: var(--dl-danger);
}

.dl-ae__probelab {
  fill: var(--dl-heading);
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.dl-ae__probelab.is-hole {
  fill: var(--dl-danger);
}

.dl-ae__striplab {
  fill: var(--dl-muted);
  font-size: 12px;
  font-style: italic;
}
</style>
