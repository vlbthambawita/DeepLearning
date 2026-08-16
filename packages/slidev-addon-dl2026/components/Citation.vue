<script setup lang="ts">
/*
 * Most figures in Lecture 02 come from Raschka/Liu/Mirjalili, "Machine Learning
 * with PyTorch and Scikit-Learn". Anything reused from a book or a paper gets
 * one of these so attribution travels with the slide.
 */
const props = defineProps<{
  source: string
  url?: string
}>()
</script>

<template>
  <span class="dl-citation">
    <a v-if="props.url" :href="props.url" target="_blank" rel="noopener">{{ props.source }}</a>
    <template v-else>{{ props.source }}</template>
    <slot />
  </span>
</template>

<style scoped>
.dl-citation {
  font-size: var(--dl-fs-citation);
  color: var(--dl-muted);
}

.dl-citation a {
  color: inherit;
  border-bottom: 1px dotted currentColor;
}
</style>
