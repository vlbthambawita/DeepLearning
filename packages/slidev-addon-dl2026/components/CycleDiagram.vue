<script setup lang="ts">
/*
 * The data-curation cycle that sat in the bottom-left of Lecture 01 slide 31,
 * shrunk to near-illegibility beside the main pipeline.
 *
 * Eight steps around a hub, one readable at a time. Given as a component rather
 * than an image because this cycle is the part of the pipeline the group
 * actually does, and it will be referenced again later in the course.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  steps?: string[]
  hub?: string
  size?: number
}>(), {
  steps: () => [
    'Ethical approval',
    'Data access',
    'Querying data',
    'Data de-identification',
    'Data transfer',
    'Quality control',
    'Structure data',
    'Label data',
  ],
  hub: 'Unprocessed data',
  size: 340,
})

const selected = ref(0)

const geometry = computed(() => {
  const c = props.size / 2
  const radius = props.size * 0.36
  return props.steps.map((label, i) => {
    // Start at the top and go clockwise, matching how the original was drawn.
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / props.steps.length
    return {
      i,
      label,
      x: c + radius * Math.cos(angle),
      y: c + radius * Math.sin(angle),
      angle,
    }
  })
})

const centre = computed(() => props.size / 2)

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
    </div>
  </div>
</template>

<style scoped>
.dl-cycle {
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dl-cycle__svg {
  flex: 0 0 auto;
  height: 100%;
  max-height: 100%;
  max-width: 50%;
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
}

.dl-cycle__legend ol {
  margin: 0;
  padding-left: 1.5rem;
  list-style: decimal;
}

.dl-cycle__legend li {
  margin: 0.3rem 0;
  font-size: 1.02rem;
  color: var(--dl-muted);
  cursor: pointer;
  transition: color 0.15s ease;
}

.dl-cycle__legend li.is-selected {
  color: var(--dl-heading);
  font-weight: 600;
}
</style>
