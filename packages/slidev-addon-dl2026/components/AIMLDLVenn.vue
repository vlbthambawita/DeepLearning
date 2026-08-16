<script setup lang="ts">
/*
 * Lecture 01 slide 23, "Definition of DL".
 *
 * The nesting is the definition: deep learning is inside machine learning is
 * inside AI. Re-drawn rather than extracted so the three definitions arrive one
 * at a time, and so the slide stops carrying a screenshot of someone else's
 * diagram.
 */
import { computed, ref } from 'vue'

interface Ring {
  key: string
  name: string
  blurb: string
  r: number
  cx: number
  cy: number
  fill: string
}

const RINGS: Ring[] = [
  {
    key: 'ai',
    name: 'Artificial Intelligence',
    blurb: 'Mimicking the intelligence or behavioural pattern of humans, or of any other living entity.',
    r: 118, cx: 130, cy: 130,
    fill: 'var(--dl-ai)',
  },
  {
    key: 'ml',
    name: 'Machine Learning',
    blurb: 'A technique by which a computer learns from data, without being given a complex set of rules — mainly by training a model on a dataset.',
    r: 78, cx: 150, cy: 152,
    fill: 'var(--dl-ml)',
  },
  {
    key: 'dl',
    name: 'Deep Learning',
    blurb: 'A technique for performing machine learning inspired by our brain’s own network of neurons.',
    r: 42, cx: 168, cy: 178,
    fill: 'var(--dl-dl)',
  },
]

const selected = ref('dl')
const active = computed(() => RINGS.find(r => r.key === selected.value)!)
</script>

<template>
  <div class="dl-venn">
    <svg viewBox="0 0 280 280" class="dl-venn__svg" role="img" aria-label="AI contains machine learning contains deep learning">
      <!-- Drawn largest first so the inner rings stay clickable on top. -->
      <g v-for="ring in RINGS" :key="ring.key">
        <circle
          :cx="ring.cx" :cy="ring.cy" :r="ring.r"
          :class="['dl-venn__ring', `is-${ring.key}`, { 'is-active': ring.key === selected }]"
          @click="selected = ring.key"
          @mouseenter="selected = ring.key"
        />
      </g>

      <text :x="RINGS[0].cx" :y="RINGS[0].cy - RINGS[0].r + 22" class="dl-venn__label">AI</text>
      <text :x="RINGS[1].cx" :y="RINGS[1].cy - RINGS[1].r + 20" class="dl-venn__label">ML</text>
      <text :x="RINGS[2].cx" :y="RINGS[2].cy + 5" class="dl-venn__label is-inner">DL</text>
    </svg>

    <div class="dl-venn__detail">
      <div class="dl-venn__chips">
        <button
          v-for="ring in RINGS"
          :key="ring.key"
          type="button"
          :class="{ 'is-selected': ring.key === selected }"
          @click="selected = ring.key"
        >{{ ring.name }}</button>
      </div>
      <p>{{ active.blurb }}</p>
    </div>
  </div>
</template>

<style scoped>
.dl-venn {
  --dl-ai: #7fd3dd;
  --dl-ml: #b9aede;
  --dl-dl: #c2dd52;
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
}

html.dark .dl-venn {
  --dl-ai: #2d7f89;
  --dl-ml: #5f558b;
  --dl-dl: #7f9634;
}

.dl-venn__svg {
  flex: 0 0 15rem;
  max-height: 100%;
}

.dl-venn__ring {
  stroke: var(--dl-heading);
  stroke-width: 1.2;
  cursor: pointer;
  transition: opacity 0.2s ease;
  opacity: 0.55;
}

.dl-venn__ring.is-ai { fill: var(--dl-ai); }
.dl-venn__ring.is-ml { fill: var(--dl-ml); }
.dl-venn__ring.is-dl { fill: var(--dl-dl); }

.dl-venn__ring.is-active {
  opacity: 1;
  stroke-width: 2.5;
}

.dl-venn__label {
  fill: var(--dl-heading);
  font-size: 15px;
  font-weight: 700;
  text-anchor: middle;
  pointer-events: none;
}

.dl-venn__label.is-inner {
  font-size: 17px;
}

.dl-venn__detail {
  flex: 1 1 auto;
  min-width: 0;
}

.dl-venn__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}

.dl-venn__chips button {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--dl-border);
  border-radius: 999px;
  background: transparent;
  font: inherit;
  font-size: 0.82rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-venn__chips button.is-selected {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-venn__detail p {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.5;
  max-width: 44ch;
}
</style>
