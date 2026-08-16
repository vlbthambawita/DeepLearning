<script setup lang="ts">
/*
 * Lecture 02 slide 26, "To know: one-hot representation".
 *
 * Clicking a class and watching exactly one component light up is the whole
 * idea, and it takes one interaction rather than a paragraph.
 */
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  classes?: string[]
}>(), {
  classes: () => ['setosa', 'versicolor', 'virginica'],
})

const selected = ref(0)
</script>

<template>
  <WidgetFrame max-width="34rem">
    <div class="dl-onehot">
      <div class="dl-onehot__choices">
        <button
          v-for="(name, i) in props.classes"
          :key="name"
          type="button"
          :class="{ 'is-selected': i === selected }"
          @click="selected = i"
        >
          <span class="dl-onehot__index">y = {{ i }}</span>
          <span class="dl-onehot__name">{{ name }}</span>
        </button>
      </div>

      <div class="dl-onehot__arrow" aria-hidden="true">→</div>

      <div class="dl-onehot__vector">
        <div
          v-for="(name, i) in props.classes"
          :key="name"
          class="dl-onehot__cell"
          :class="{ 'is-hot': i === selected }"
        >{{ i === selected ? 1 : 0 }}</div>
      </div>
    </div>

    <template #readout>
      One output unit per class. The label is a position, not a magnitude — encoding
      the three classes as 0, 1, 2 would tell the network that virginica is
      "twice" versicolor.
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-onehot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
}

.dl-onehot__choices {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.dl-onehot__choices button {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.9rem;
  color: var(--dl-body);
  cursor: pointer;
  text-align: left;
}

.dl-onehot__choices button:hover {
  border-color: var(--dl-accent);
}

.dl-onehot__choices button.is-selected {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-onehot__index {
  font-variant-numeric: tabular-nums;
  color: var(--dl-muted);
  font-size: 0.8rem;
}

.dl-onehot__arrow {
  font-size: 1.6rem;
  color: var(--dl-muted);
}

.dl-onehot__vector {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.35rem;
  border-left: 2px solid var(--dl-heading);
  border-right: 2px solid var(--dl-heading);
}

.dl-onehot__cell {
  width: 2.6rem;
  height: 2.1rem;
  display: grid;
  place-items: center;
  border-radius: 4px;
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  color: var(--dl-muted);
  background: var(--dl-surface);
  transition: background 0.2s ease, color 0.2s ease;
}

.dl-onehot__cell.is-hot {
  background: var(--dl-accent);
  color: #fff;
  font-weight: 700;
}
</style>
