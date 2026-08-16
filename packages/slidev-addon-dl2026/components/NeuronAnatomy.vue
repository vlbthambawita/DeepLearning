<script setup lang="ts">
/*
 * Lecture 02 slides 3 and 4.
 *
 * The 2025 deck showed a photograph of nerve cells and then, two slides later,
 * a schematic of the MCP neuron, leaving the analogy implied. Putting the two
 * side by side with the corresponding parts highlighted together makes the
 * mapping — dendrites to inputs, synapse to weight, soma to net input, axon to
 * output — something the room can check rather than take on faith.
 */
import { computed, ref } from 'vue'

interface Part {
  key: string
  bio: string
  art: string
  note: string
}

const PARTS: Part[] = [
  { key: 'in', bio: 'Dendrites', art: 'Inputs xⱼ', note: 'Signals arriving from other cells become the feature values.' },
  { key: 'w', bio: 'Synapses', art: 'Weights wⱼ', note: 'A synapse’s strength decides how much a signal counts. That strength is what training changes.' },
  { key: 'sum', bio: 'Cell body (soma)', art: 'Net input z = wᵀx + b', note: 'The cell accumulates incoming signal; the neuron sums the weighted inputs.' },
  { key: 'out', bio: 'Axon', art: 'Output σ(z)', note: 'The cell fires — or does not. The unit step is the crudest possible model of that.' },
]

const selected = ref('in')
const active = computed(() => PARTS.find(p => p.key === selected.value)!)
const on = (k: string) => selected.value === k
</script>

<template>
  <WidgetFrame max-width="46rem">
    <svg viewBox="0 0 560 210" class="dl-neuron" role="img" aria-label="Biological neuron beside an artificial neuron">
      <!-- Biological -->
      <text x="130" y="16" class="head">Biological neuron</text>
      <g class="bio">
        <g :class="{ 'is-on': on('in') }" @click="selected = 'in'">
          <path d="M28,60 L74,92 M28,105 L74,100 M28,150 L74,110" class="dendrite" />
        </g>
        <g :class="{ 'is-on': on('w') }" @click="selected = 'w'">
          <circle cx="30" cy="60" r="6" class="synapse" />
          <circle cx="30" cy="105" r="6" class="synapse" />
          <circle cx="30" cy="150" r="6" class="synapse" />
        </g>
        <g :class="{ 'is-on': on('sum') }" @click="selected = 'sum'">
          <ellipse cx="102" cy="102" rx="30" ry="24" class="soma" />
        </g>
        <g :class="{ 'is-on': on('out') }" @click="selected = 'out'">
          <path d="M132,102 L228,102" class="axon" />
          <path d="M228,102 l-8,-6 M228,102 l-8,6" class="axon" />
        </g>
      </g>

      <line x1="270" y1="24" x2="270" y2="186" class="divider" />

      <!-- Artificial -->
      <text x="418" y="16" class="head">Artificial neuron</text>
      <g class="art">
        <g :class="{ 'is-on': on('in') }" @click="selected = 'in'">
          <circle cx="318" cy="62" r="13" class="unit" />
          <text x="318" y="66" class="lbl">x₁</text>
          <circle cx="318" cy="102" r="13" class="unit" />
          <text x="318" y="106" class="lbl">x₂</text>
          <circle cx="318" cy="142" r="13" class="unit" />
          <text x="318" y="146" class="lbl">x₃</text>
        </g>
        <g :class="{ 'is-on': on('w') }" @click="selected = 'w'">
          <line x1="332" y1="64" x2="392" y2="96" class="wire" />
          <line x1="332" y1="102" x2="392" y2="102" class="wire" />
          <line x1="332" y1="140" x2="392" y2="108" class="wire" />
          <text x="356" y="72" class="wlbl">w₁</text>
          <text x="356" y="96" class="wlbl">w₂</text>
          <text x="356" y="136" class="wlbl">w₃</text>
        </g>
        <g :class="{ 'is-on': on('sum') }" @click="selected = 'sum'">
          <circle cx="412" cy="102" r="20" class="unit is-op" />
          <text x="412" y="109" class="lbl big">Σ</text>
        </g>
        <g :class="{ 'is-on': on('out') }" @click="selected = 'out'">
          <line x1="432" y1="102" x2="470" y2="102" class="wire" />
          <circle cx="492" cy="102" r="20" class="unit is-op" />
          <text x="492" y="108" class="lbl big">σ</text>
        </g>
      </g>
    </svg>

    <template #controls>
      <div class="dl-neuron__tabs">
        <button
          v-for="p in PARTS"
          :key="p.key"
          type="button"
          :class="{ 'is-active': p.key === selected }"
          @click="selected = p.key"
        >{{ p.bio }}</button>
      </div>
    </template>

    <template #readout>
      <strong>{{ active.bio }}</strong> ↔ <strong>{{ active.art }}</strong> — {{ active.note }}
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-neuron {
  width: 100%;
  height: 100%;
}

.head {
  fill: var(--dl-muted);
  font-size: 11px;
  text-anchor: middle;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.divider {
  stroke: var(--dl-border);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.bio g,
.art g {
  cursor: pointer;
}

.dendrite,
.axon,
.wire {
  stroke: var(--dl-muted);
  stroke-width: 2;
  fill: none;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.soma,
.synapse,
.unit {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.unit.is-op {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.is-on .dendrite,
.is-on .axon,
.is-on .wire {
  stroke: var(--dl-accent);
  stroke-width: 3;
}

.is-on .soma,
.is-on .synapse,
.is-on .unit {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.lbl {
  fill: var(--dl-heading);
  font-size: 11px;
  text-anchor: middle;
  pointer-events: none;
}

.is-on .lbl {
  fill: #fff;
}

.lbl.big {
  font-size: 16px;
}

.wlbl {
  fill: var(--dl-muted);
  font-size: 10px;
  text-anchor: middle;
  pointer-events: none;
}

.dl-neuron__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dl-neuron__tabs button {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-neuron__tabs button.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}
</style>
