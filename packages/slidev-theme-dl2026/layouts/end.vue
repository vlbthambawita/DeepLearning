<script setup lang="ts">
const props = defineProps<{
  email?: string
  next?: string
}>()
</script>

<template>
  <div class="slidev-layout dl-end">
    <div class="dl-end__body">
      <slot />
    </div>
    <div class="dl-rule" />
    <div class="dl-end__meta">
      <span v-if="props.next" class="dl-end__next">Next: {{ props.next }}</span>
      <a v-if="props.email" :href="`mailto:${props.email}`">{{ props.email }}</a>
    </div>
  </div>
</template>

<style scoped>
.dl-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  text-align: center;
}

.dl-end__body :deep(h1) {
  font-size: var(--dl-fs-section);
  margin: 0;
}

.dl-end__meta {
  display: flex;
  gap: 1.4rem;
  font-size: var(--dl-fs-secondary);
  color: var(--dl-muted);
}
</style>
