<script setup lang="ts">
/*
 * What the VAE's second term buys, and what it costs.
 *
 * Same data, same decoder curve and the same latent axis as `AutoencoderLab`, so
 * the two slides are visibly about one model with one thing changed. β is the
 * only control: at 0 this *is* the autoencoder, at 1 it is a VAE.
 *
 * Three readouts, and the whole trade-off is visible in all three at once:
 *
 *   β        0.00   0.50   1.00
 *   gap to N(0,1)   0.98   0.07   0.01      ← the latent stops having holes
 *   z landing on data 16/24 19/24  24/24    ← the model becomes samplable
 *   reconstruction  0.39   0.79   1.03      ← and everything goes blurry
 *
 * The second row is the entire reason the VAE exists. The third is the entire
 * reason VAEs look soft, and a student who has moved this slider has met the
 * β-VAE before ever hearing the name.
 *
 * Both mechanisms are the real ones rather than decoration: the codes are
 * squeezed toward the prior *and* each one is widened into a distribution
 * (`posteriorSigma`), which is what forces the decoder to return the average of
 * everything a jittered code could have meant. The average is the blur.
 */
import { computed, ref } from 'vue'
import {
  aggregatePosterior,
  decodeVae,
  latentCodes,
  posteriorGap,
  posteriorSigma,
  probit,
  sampleData,
  vaeLatent,
} from '../composables/useGenerative'
import { seededGaussian } from '../composables/useRandom'

const beta = ref(0)

const data = sampleData(22)
const baseCodes = latentCodes(data)
const sortedBase = [...baseCodes].sort((a, b) => a - b)

/** Where the encoder puts each training point's code at this β. */
const mus = computed(() => vaeLatent(baseCodes, beta.value))
const sigma = computed(() => posteriorSigma(beta.value))

/** How far the aggregate posterior is from the prior we will sample from. */
const gap = computed(() => posteriorGap(mus.value, sigma.value))

/*
 * One fixed jitter per training point, so moving the slider changes the blur
 * and nothing else — a fresh draw on every frame would make the readout dance
 * and the picture untalkable-over.
 */
const JITTER = (() => {
  const g = seededGaussian(4242)
  return baseCodes.map(() => g())
})()

const recon = computed(() =>
  mus.value.map((m, i) => decodeVae(sortedBase, m + sigma.value * JITTER[i], beta.value)))

const reconError = computed(() => {
  let sum = 0
  for (let i = 0; i < data.length; i++)
    sum += Math.hypot(recon.value[i].x - data[i].x, recon.value[i].y - data[i].y)
  return sum / data.length
})

/*
 * Twenty-four z from the prior, taken at fixed quantiles rather than sampled, so
 * the same 24 are tested at every β and the count moves only because the model
 * moved.
 */
const PRIOR_Z = Array.from({ length: 24 }, (_, i) => probit((i + 0.5) / 24))

const priorSamples = computed(() => PRIOR_Z.map((z) => {
  const p = decodeVae(sortedBase, z, beta.value)
  const near = Math.sqrt(Math.min(...data.map(d => (d.x - p.x) ** 2 + (d.y - p.y) ** 2)))
  return { ...p, cls: near > 0.6 ? 'off' : 'on' }
}))

const onData = computed(() => priorSamples.value.filter(s => s.cls === 'on').length)

// --- the latent strip ------------------------------------------------------
const STRIP_W = 404
const STRIP_LEFT = 32
const STRIP_BASE = 46
const SPAN = 3.4
const GRID = Array.from({ length: 120 }, (_, i) => -SPAN + (2 * SPAN * i) / 119)

function stripX(v: number) {
  return STRIP_LEFT + ((v + SPAN) / (2 * SPAN)) * STRIP_W
}

function path(density: number[], scale: number) {
  return `M${GRID.map((z, i) =>
    `${stripX(z).toFixed(1)},${(STRIP_BASE - Math.min(density[i] * scale, 42)).toFixed(1)}`).join('L')}`
}

/** The prior, drawn behind everything as the shape the codes must end up as. */
const priorPath = computed(() =>
  path(GRID.map(z => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI)), 92))

/** Where the codes actually are. At β = 0 this is three spikes and two holes. */
const posteriorPath = computed(() =>
  path(aggregatePosterior(mus.value, sigma.value, GRID), 92))
</script>

<template>
  <WidgetFrame max-width="45rem">
    <div class="dl-vae">
      <Plot2D
        :x-domain="[-4.2, 4.2]"
        :y-domain="[-2.4, 2.6]"
        :width="470" :height="188"
        :x-ticks="[-4, -2, 0, 2, 4]" :y-ticks="[-2, 0, 2]"
      >
        <PlotPoints :points="data" :radius="3.2" color="var(--dl-muted)" :opacity="0.5" />
        <PlotPoints
          :points="priorSamples"
          :radius="4.4"
          :colors="{ on: 'var(--dl-accent)', off: 'var(--dl-danger)' }"
        />
      </Plot2D>

      <svg class="dl-vae__strip" viewBox="0 0 470 58" role="img"
           aria-label="The aggregate posterior over latent codes, against the standard normal prior">
        <path class="dl-vae__prior" :d="priorPath" />
        <path class="dl-vae__post" :d="posteriorPath" />
        <line class="dl-vae__axis" :x1="STRIP_LEFT" :x2="STRIP_LEFT + STRIP_W" :y1="STRIP_BASE" :y2="STRIP_BASE" />
        <text class="dl-vae__lab" x="6" y="50">z</text>
        <text class="dl-vae__lab" :x="stripX(0)" y="56" text-anchor="middle">
          dashed: the N(0, 1) we sample from · solid: where the codes actually are
        </text>
      </svg>
    </div>

    <template #controls>
      <Slider v-model="beta" label="β — how hard the KL term pulls" :min="0" :max="1" :step="0.02" />
      <StepButton label="β = 0 · an autoencoder" variant="ghost" @click="beta = 0" />
      <StepButton label="β = 1 · a VAE" variant="ghost" @click="beta = 1" />
    </template>

    <template #readout>
      <div class="dl-vae__out">
        <span>codes vs N(0, 1): <b>{{ gap.toFixed(3) }}</b></span>
        <span>sampled z landing on real data: <b>{{ onData }}/24</b></span>
        <span>reconstruction error: <b>{{ reconError.toFixed(3) }}</b></span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-vae {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.dl-vae__strip {
  width: 100%;
  height: 3.2rem;
  flex: 0 0 auto;
  font-family: inherit;
}

.dl-vae__axis {
  stroke: var(--dl-muted);
  stroke-width: 1.2;
}

.dl-vae__prior {
  fill: none;
  stroke: var(--dl-body);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.dl-vae__post {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 2.2;
}

.dl-vae__lab {
  fill: var(--dl-muted);
  font-size: 9.5px;
}

.dl-vae__out {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1.4rem;
}

.dl-vae__out b {
  color: var(--dl-accent);
  font-weight: 700;
}
</style>
