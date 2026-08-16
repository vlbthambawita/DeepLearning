<script setup lang="ts">
/*
 * Lecture 01 slides 4, 5 and 18 are questions put to the room. Rather than
 * showing every prompt at once, reveal them one per click so the room actually
 * answers each one.
 */
const props = defineProps<{
  question: string
  items: string[]
}>()
</script>

<template>
  <div class="dl-poll">
    <div class="dl-poll__question">{{ props.question }}</div>
    <v-clicks>
      <div v-for="item in props.items" :key="item" class="dl-poll__item">
        <span class="dl-poll__bullet">?</span>
        <span>{{ item }}</span>
      </div>
    </v-clicks>
  </div>
</template>

<style scoped>
.dl-poll__question {
  font-size: 1.7rem;
  color: var(--dl-heading);
  font-weight: 600;
  margin-bottom: 1.1rem;
}

.dl-poll__item {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  margin: 0.55rem 0;
  font-size: var(--dl-fs-body);
}

.dl-poll__bullet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--dl-accent-soft);
  color: var(--dl-accent);
  font-size: 0.85rem;
  font-weight: 700;
}
</style>
