<script setup lang="ts">
/*
 * The data-curation cycle that sat in the bottom-left of Lecture 01 slide 31,
 * shrunk to near-illegibility beside the main pipeline.
 *
 * Eight steps around a hub, one readable at a time. Given as a component rather
 * than an image because this cycle is the part of the pipeline the group
 * actually does, and it will be referenced again later in the course.
 *
 * Each step carries its own explanation: the names alone ("data access",
 * "quality control") sound like formalities, and the point of the slide is that
 * they are not. The selected step's detail replaces the list's own line, so the
 * legend stays one screen tall however long the explanations get.
 */
import { computed, ref } from 'vue'

export interface CycleStep {
  label: string
  /** What the step actually involves, and why it is not free. */
  detail: string
}

const props = withDefaults(defineProps<{
  steps?: CycleStep[]
  hub?: string
  size?: number
}>(), {
  steps: () => [
    {
      label: 'Ethical approval',
      detail: 'A protocol to a research ethics committee: what you collect, from whom, why, for how long, and who may see it. Months, not weeks — and nothing else can start until it lands.',
    },
    {
      label: 'Data access',
      detail: 'A data-processing agreement with the hospital or registry that holds the data. Legal, not technical: who is controller, who is processor, where the data may physically sit.',
    },
    {
      label: 'Querying data',
      detail: 'Selecting the actual cohort from a clinical system — inclusion and exclusion criteria, date ranges, which modality. Done with a domain expert, or the cohort is quietly wrong.',
    },
    {
      label: 'Data de-identification',
      detail: 'Strip names, IDs and dates — including the ones hidden in DICOM headers, file names and burnt into pixels. One missed identifier can undo the whole approval.',
    },
    {
      label: 'Data transfer',
      detail: 'Moving it to where you may compute on it: encrypted transfer, an approved storage location, access logs. Terabytes over a hospital network takes longer than you expect.',
    },
    {
      label: 'Quality control',
      detail: 'Find the corrupt files, duplicates, wrong-modality scans and empty studies before they become training data. Expect to lose a real fraction of what you received.',
    },
    {
      label: 'Structure data',
      detail: 'One consistent layout: folder convention, file format, resolution, a manifest that maps every sample to its metadata. This is what makes the dataset reusable by the next person.',
    },
    {
      label: 'Label data',
      detail: 'Clinicians annotate — the expensive step. Write the labelling protocol, measure agreement between annotators, and adjudicate where they disagree.',
    },
  ],
  hub: 'Unprocessed data',
  size: 340,
})

const selected = ref(0)

const geometry = computed(() => {
  const c = props.size / 2
  const radius = props.size * 0.36
  return props.steps.map((step, i) => {
    // Start at the top and go clockwise, matching how the original was drawn.
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / props.steps.length
    return {
      i,
      label: step.label,
      detail: step.detail,
      x: c + radius * Math.cos(angle),
      y: c + radius * Math.sin(angle),
      angle,
    }
  })
})

const centre = computed(() => props.size / 2)
const active = computed(() => props.steps[selected.value])

/** Arc between consecutive steps, so the cycle reads as a direction. */
function arcTo(i: number) {
  const from = geometry.value[i]
  const to = geometry.value[(i + 1) % props.steps.length]
  const r = props.size * 0.36
  return `M${from.x.toFixed(1)},${from.y.toFixed(1)} A${r},${r} 0 0 1 ${to.x.toFixed(1)},${to.y.toFixed(1)}`
}
</script>

<template>
  <div class="dl-cycle">
    <svg :viewBox="`0 0 ${props.size} ${props.size}`" class="dl-cycle__svg" role="img" aria-label="Data curation cycle">
      <defs>
        <marker id="dl-cycle-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--dl-border)" />
        </marker>
      </defs>

      <path
        v-for="(_, i) in props.steps"
        :key="`arc${i}`"
        :d="arcTo(i)"
        class="dl-cycle__arc"
        marker-end="url(#dl-cycle-arrow)"
      />

      <circle :cx="centre" :cy="centre" :r="props.size * 0.15" class="dl-cycle__hub" />
      <text :x="centre" :y="centre - 4" class="dl-cycle__hublabel">{{ props.hub.split(' ')[0] }}</text>
      <text :x="centre" :y="centre + 12" class="dl-cycle__hublabel">{{ props.hub.split(' ').slice(1).join(' ') }}</text>

      <g
        v-for="node in geometry"
        :key="node.i"
        class="dl-cycle__node"
        :class="{ 'is-selected': node.i === selected }"
        @click="selected = node.i"
        @mouseenter="selected = node.i"
      >
        <circle :cx="node.x" :cy="node.y" r="17" />
        <text :x="node.x" :y="node.y + 5">{{ node.i + 1 }}</text>
      </g>
    </svg>

    <div class="dl-cycle__legend">
      <ol>
        <li
          v-for="node in geometry"
          :key="node.i"
          :class="{ 'is-selected': node.i === selected }"
          @click="selected = node.i"
          @mouseenter="selected = node.i"
        >{{ node.label }}</li>
      </ol>

      <div class="dl-cycle__detail">
        <div class="dl-cycle__detailhead">
          <span class="dl-cycle__step">Step {{ selected + 1 }}</span>
          <h3>{{ active.label }}</h3>
        </div>
        <p>{{ active.detail }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dl-cycle {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dl-cycle__svg {
  flex: 0 0 auto;
  height: 100%;
  max-height: 100%;
  max-width: 38%;
}

.dl-cycle__arc {
  fill: none;
  stroke: var(--dl-border);
  stroke-width: 1.5;
}

.dl-cycle__hub {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
  stroke-width: 1.5;
}

.dl-cycle__hublabel {
  fill: var(--dl-body);
  font-size: 11px;
  text-anchor: middle;
}

.dl-cycle__node circle {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.5;
  cursor: pointer;
  transition: fill 0.15s ease, stroke 0.15s ease;
}

.dl-cycle__node text {
  fill: var(--dl-body);
  font-size: 12px;
  font-weight: 700;
  text-anchor: middle;
  pointer-events: none;
}

.dl-cycle__node.is-selected circle {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.dl-cycle__node.is-selected text {
  fill: #fff;
}

.dl-cycle__legend {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  gap: 1.4rem;
  align-items: flex-start;
}

.dl-cycle__legend ol {
  margin: 0;
  padding-left: 1.3rem;
  list-style: decimal;
  flex: 0 0 auto;
}

.dl-cycle__legend li {
  margin: 0.15rem 0;
  font-size: 0.92rem;
  color: var(--dl-muted);
  cursor: pointer;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.dl-cycle__legend li.is-selected {
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-cycle__detail {
  flex: 1 1 auto;
  min-width: 0;
  border-left: 3px solid var(--dl-accent);
  background: var(--dl-surface);
  border-radius: 0 8px 8px 0;
  padding: 0.7rem 0.9rem;
}

.dl-cycle__detailhead {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.dl-cycle__step {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dl-accent);
}

.dl-cycle__detail h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.2;
}

.dl-cycle__detail p {
  margin: 0.4rem 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--dl-body);
}
</style>
