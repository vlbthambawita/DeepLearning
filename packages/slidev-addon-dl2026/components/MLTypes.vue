<script setup lang="ts">
/*
 * Lecture 01 slide 24, "Three different types of machine learning".
 *
 * The 2025 slide put four cropped book figures on screen at once, so all three
 * paradigms competed for attention and none was explained. One at a time, each
 * re-drawn, gives the room somewhere to look — and drops four screenshots of
 * Raschka's figures from a deck that is otherwise ours.
 */
import { computed, ref } from 'vue'
import { seededGaussian } from '../composables/useRandom'

const KINDS = [
  { key: 'supervised', name: 'Supervised', blurb: 'Labelled examples in, a predictive model out. The label is the teaching signal.' },
  { key: 'unsupervised', name: 'Unsupervised', blurb: 'No labels at all — structure has to come from the data itself, e.g. clustering.' },
  { key: 'reinforcement', name: 'Reinforcement', blurb: 'An agent acts on an environment and learns from the reward that comes back.' },
] as const

const selected = ref<(typeof KINDS)[number]['key']>('supervised')
const active = computed(() => KINDS.find(k => k.key === selected.value)!)

/** Three well-separated blobs, so "cluster" is visible without any labelling. */
const clusters = computed(() => {
  const gauss = seededGaussian(4242)
  const centres = [[2.2, 6.4], [2.6, 2.4], [6.6, 3.6]]
  return centres.flatMap(([cx, cy], ci) =>
    Array.from({ length: 16 }, () => ({
      x: cx + gauss() * 0.62,
      y: cy + gauss() * 0.62,
      cls: String(ci),
    })))
})

const CLUSTER_COLORS = { 0: 'var(--dl-accent)', 1: 'var(--dl-heading)', 2: 'var(--dl-muted)' }
</script>

<template>
  <div class="dl-mltypes">
    <div class="dl-mltypes__tabs" role="tablist">
      <button
        v-for="k in KINDS"
        :key="k.key"
        type="button"
        role="tab"
        :aria-selected="k.key === selected"
        :class="{ 'is-active': k.key === selected }"
        @click="selected = k.key"
      >{{ k.name }}</button>
    </div>

    <div class="dl-mltypes__stage">
      <!-- Supervised: labelled data trains an algorithm that then predicts. -->
      <svg v-if="selected === 'supervised'" viewBox="0 0 460 200" class="dl-mltypes__svg">
        <defs>
          <marker id="dl-ml-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--dl-muted)" />
          </marker>
        </defs>
        <g class="box">
          <rect x="14" y="14" width="112" height="34" rx="5" />
          <text x="70" y="35">Training data</text>
        </g>
        <g class="box">
          <rect x="14" y="60" width="112" height="34" rx="5" />
          <text x="70" y="81">Labels</text>
        </g>
        <g class="box is-strong">
          <rect x="168" y="34" width="118" height="40" rx="5" />
          <text x="227" y="58">ML algorithm</text>
        </g>
        <g class="box">
          <rect x="168" y="132" width="118" height="36" rx="5" />
          <text x="227" y="154">Predictive model</text>
        </g>
        <g class="box">
          <rect x="14" y="132" width="112" height="36" rx="5" />
          <text x="70" y="154">New data</text>
        </g>
        <g class="box">
          <rect x="326" y="132" width="120" height="36" rx="5" />
          <text x="386" y="154">Predicted labels</text>
        </g>
        <g class="arrows">
          <line x1="128" y1="31" x2="164" y2="48" marker-end="url(#dl-ml-arrow)" />
          <line x1="128" y1="77" x2="164" y2="62" marker-end="url(#dl-ml-arrow)" />
          <line x1="227" y1="76" x2="227" y2="128" marker-end="url(#dl-ml-arrow)" />
          <line x1="128" y1="150" x2="164" y2="150" marker-end="url(#dl-ml-arrow)" />
          <line x1="288" y1="150" x2="322" y2="150" marker-end="url(#dl-ml-arrow)" />
        </g>
      </svg>

      <!-- Unsupervised: the same points, no labels, structure found anyway. -->
      <Plot2D
        v-else-if="selected === 'unsupervised'"
        :x-domain="[0, 9]"
        :y-domain="[0, 9]"
        :width="360"
        :height="210"
        x-label="x₁"
        y-label="x₂"
        :x-ticks="4"
        :y-ticks="4"
      >
        <PlotPoints :points="clusters" :colors="CLUSTER_COLORS" :radius="4.5" :opacity="0.9" />
      </Plot2D>

      <!-- Reinforcement: the agent/environment loop. -->
      <svg v-else viewBox="0 0 460 200" class="dl-mltypes__svg">
        <g class="box is-strong">
          <rect x="286" y="18" width="140" height="42" rx="5" />
          <text x="356" y="44">Environment</text>
        </g>
        <g class="box is-strong">
          <rect x="34" y="140" width="140" height="42" rx="5" />
          <text x="104" y="166">Agent</text>
        </g>
        <g class="arrows">
          <path d="M290,39 L104,39 L104,136" marker-end="url(#dl-ml-arrow2)" />
          <path d="M330,62 L200,62 L200,136" marker-end="url(#dl-ml-arrow2)" />
          <path d="M178,161 L392,161 L392,64" marker-end="url(#dl-ml-arrow2)" />
        </g>
        <defs>
          <marker id="dl-ml-arrow2" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--dl-muted)" />
          </marker>
        </defs>
        <g class="edgelabel">
          <text x="118" y="30">Reward</text>
          <text x="212" y="90">State</text>
          <text x="300" y="180">Action</text>
        </g>
      </svg>
    </div>

    <p class="dl-mltypes__blurb">{{ active.blurb }}</p>
  </div>
</template>

<style scoped>
.dl-mltypes {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dl-mltypes__tabs {
  display: flex;
  gap: 0.4rem;
}

.dl-mltypes__tabs button {
  padding: 0.3rem 0.9rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.88rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-mltypes__tabs button.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-mltypes__stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dl-mltypes__svg {
  width: 100%;
  height: 100%;
  max-height: 100%;
}

.box rect {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1.2;
}

.box.is-strong rect {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.box text {
  fill: var(--dl-heading);
  font-size: 13px;
  text-anchor: middle;
}

.arrows line,
.arrows path {
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  fill: none;
}

.edgelabel text {
  fill: var(--dl-body);
  font-size: 13px;
  font-weight: 600;
}

.dl-mltypes__blurb {
  margin: 0;
  font-size: 1.05rem;
  color: var(--dl-body);
  max-width: 70ch;
}
</style>
