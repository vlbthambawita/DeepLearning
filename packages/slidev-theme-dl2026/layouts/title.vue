<script setup lang="ts">
/*
 * Opening slide. Lecture 02 of the 2025 course had no branded title slide at
 * all — it opened straight on "Basics of Neural networks" — so every deck now
 * gets the same one from here.
 */
const props = defineProps<{
  courseCode?: string
  lecture?: string | number
  author?: string
  email?: string
  date?: string
}>()
</script>

<template>
  <div class="slidev-layout dl-title">
    <div class="dl-title__eyebrow">
      <span v-if="props.courseCode" class="dl-title__code">{{ props.courseCode }}</span>
      <span v-if="props.lecture" class="dl-title__lecture">Lecture {{ props.lecture }}</span>
    </div>

    <div class="dl-title__body">
      <slot />
    </div>

    <div class="dl-rule dl-title__rule" />

    <div class="dl-title__meta">
      <div v-if="props.author" class="dl-title__author">{{ props.author }}</div>
      <a v-if="props.email" :href="`mailto:${props.email}`" class="dl-title__email">{{ props.email }}</a>
      <div v-if="props.date" class="dl-title__date">{{ props.date }}</div>
    </div>
  </div>
</template>

<style scoped>
.dl-title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 4rem;
  padding-right: 4rem;
}

.dl-title__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.1rem;
  font-size: var(--dl-fs-secondary);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.dl-title__code {
  color: var(--dl-accent);
  font-weight: 700;
}

.dl-title__lecture {
  color: var(--dl-muted);
}

.dl-title__body :deep(h1) {
  font-size: var(--dl-fs-title);
  line-height: 1.05;
  margin: 0;
}

.dl-title__body :deep(p) {
  font-size: var(--dl-fs-body);
  color: var(--dl-muted);
  margin-top: 0.7rem;
  max-width: 34ch;
}

.dl-title__rule {
  margin: 1.6rem 0 1.2rem;
}

.dl-title__meta {
  font-size: var(--dl-fs-secondary);
  line-height: 1.7;
}

.dl-title__author {
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-title__email {
  color: var(--dl-accent);
}

.dl-title__date {
  color: var(--dl-muted);
}
</style>
