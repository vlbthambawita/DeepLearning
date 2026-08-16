<script setup lang="ts">
const props = defineProps<{
  /** Optional small number shown above the section title, e.g. "02". */
  index?: string | number
}>()
</script>

<template>
  <div class="slidev-layout dl-section">
    <div v-if="props.index" class="dl-section__index">{{ props.index }}</div>
    <div class="dl-section__body">
      <slot />
    </div>
    <div class="dl-rule dl-section__rule" />
  </div>
</template>

<style scoped>
.dl-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 4rem;
  background: var(--dl-surface);
}

.dl-section__index {
  font-size: var(--dl-fs-secondary);
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--dl-accent);
  margin-bottom: 0.8rem;
}

.dl-section__body :deep(h1),
.dl-section__body :deep(h2) {
  font-size: var(--dl-fs-section);
  line-height: 1.1;
  margin: 0;
}

.dl-section__body :deep(p) {
  color: var(--dl-muted);
  margin-top: 0.6rem;
  max-width: 46ch;
}

.dl-section__rule {
  margin-top: 1.4rem;
}
</style>
