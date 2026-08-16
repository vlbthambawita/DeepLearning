<script setup lang="ts">
/*
 * Lecture 01 slides 10 and 11 — "To learn (1/2)" and "(2/2)".
 *
 * The 2025 deck split a single 12-week plan across two dense tables purely
 * because it would not fit on one slide. As a timeline it fits on one, and the
 * thing students actually want to know — how long each block runs, and what is
 * coming next — is legible instead of being buried in a third table column.
 */
import { computed, ref } from 'vue'

export interface SyllabusEntry {
  section: string
  description: string
  weeks: number[]
}

const props = withDefaults(defineProps<{
  entries?: SyllabusEntry[]
  totalWeeks?: number
  /** Highlight the week the course is currently in. */
  currentWeek?: number | null
}>(), {
  entries: () => [
    {
      section: 'Introduction to DL',
      description: 'Course content, evaluation and exams. What is deep learning, where it is applied, the frameworks, and getting a environment running in Colab or Jupyter.',
      weeks: [1],
    },
    {
      section: 'Basics of Neural Networks',
      description: 'Artificial neurons and neural networks; implementing and training a multilayer network from scratch.',
      weeks: [2],
    },
    {
      section: 'PyTorch for DL',
      description: 'What PyTorch is and why. Tensors for data representation, the PyTorch training pipeline, and an ANN built with it.',
      weeks: [3],
    },
    {
      section: 'Deep Convolutional Neural Networks',
      description: 'What a CNN is and where it applies. Telling classification, detection and segmentation apart. Implementing CNN models in PyTorch.',
      weeks: [4, 5],
    },
    {
      section: 'Recurrent Neural Networks and Transformers',
      description: 'What an RNN is and where it applies; the mechanism, and an implementation in PyTorch. What a transformer is, and the original architecture.',
      weeks: [6, 7],
    },
    {
      section: 'Generative Adversarial Networks',
      description: 'Generative models and autoencoders. Implementing a GAN in Colab, improving synthetic data quality, and the main GAN variants and applications.',
      weeks: [8, 9],
    },
    {
      section: 'Graph Neural Networks / LLMs',
      description: 'Introduction to graph data, graph neural networks and large language models.',
      weeks: [10],
    },
    {
      section: 'Deep Reinforcement Learning',
      description: 'What reinforcement learning is and why. RL algorithm basics, implementations, and deep Q-learning in PyTorch.',
      weeks: [11, 12],
    },
  ],
  totalWeeks: 12,
  currentWeek: null,
})

const selected = ref(0)
const active = computed(() => props.entries[selected.value])

function label(entry: SyllabusEntry) {
  return entry.weeks.length === 1
    ? `Week ${entry.weeks[0]}`
    : `Weeks ${entry.weeks[0]}–${entry.weeks[entry.weeks.length - 1]}`
}
</script>

<template>
  <div class="dl-syllabus">
    <div class="dl-syllabus__track" :style="{ gridTemplateColumns: `repeat(${props.totalWeeks}, 1fr)` }">
      <button
        v-for="(entry, i) in props.entries"
        :key="entry.section"
        type="button"
        class="dl-syllabus__block"
        :class="{ 'is-selected': i === selected }"
        :style="{ gridColumn: `${entry.weeks[0]} / span ${entry.weeks.length}` }"
        :title="entry.section"
        @click="selected = i"
      >
        <span class="dl-syllabus__num">{{ i + 1 }}</span>
      </button>

      <div
        v-if="props.currentWeek"
        class="dl-syllabus__now"
        :style="{ gridColumn: `${props.currentWeek} / span 1` }"
      />
    </div>

    <div class="dl-syllabus__weeks" :style="{ gridTemplateColumns: `repeat(${props.totalWeeks}, 1fr)` }">
      <span v-for="w in props.totalWeeks" :key="w">{{ w }}</span>
    </div>

    <div class="dl-syllabus__detail">
      <div class="dl-syllabus__heading">
        <span class="dl-syllabus__weeklabel">{{ label(active) }}</span>
        <h3>{{ active.section }}</h3>
      </div>
      <p>{{ active.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.dl-syllabus {
  width: 100%;
}

.dl-syllabus__track {
  display: grid;
  gap: 4px;
  align-items: stretch;
  position: relative;
}

.dl-syllabus__block {
  position: relative;
  height: 2.6rem;
  border: 1px solid var(--dl-border);
  border-radius: 5px;
  background: var(--dl-surface);
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.dl-syllabus__block:hover {
  border-color: var(--dl-accent);
  transform: translateY(-2px);
}

.dl-syllabus__block.is-selected {
  background: var(--dl-accent);
  border-color: var(--dl-accent-strong);
}

.dl-syllabus__num {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--dl-muted);
}

.dl-syllabus__block.is-selected .dl-syllabus__num {
  color: #fff;
}

.dl-syllabus__now {
  grid-row: 1;
  border: 2px solid var(--dl-danger);
  border-radius: 5px;
  pointer-events: none;
}

.dl-syllabus__weeks {
  display: grid;
  gap: 4px;
  margin-top: 0.3rem;
  font-size: 0.7rem;
  color: var(--dl-muted);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.dl-syllabus__detail {
  margin-top: 1.2rem;
  min-height: 6.5rem;
}

.dl-syllabus__heading {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
}

.dl-syllabus__weeklabel {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dl-accent);
}

.dl-syllabus__detail h3 {
  margin: 0;
  font-size: 1.45rem;
}

.dl-syllabus__detail p {
  margin: 0.45rem 0 0;
  font-size: 1.05rem;
  max-width: 68ch;
  line-height: 1.5;
}
</style>
