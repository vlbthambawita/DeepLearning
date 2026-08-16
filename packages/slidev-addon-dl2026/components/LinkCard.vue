<script setup lang="ts">
/*
 * Lecture 01 spent six whole slides (17, 19, 20, 21, 22, 34) on a single bare
 * URL each. Those collapse into grids of these.
 */
const props = defineProps<{
  href: string
  title: string
  blurb?: string
  icon?: string
}>()

const host = props.href.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
</script>

<template>
  <a class="dl-linkcard" :href="props.href" target="_blank" rel="noopener">
    <div v-if="props.icon" class="dl-linkcard__icon">{{ props.icon }}</div>
    <div class="dl-linkcard__text">
      <div class="dl-linkcard__title">{{ props.title }}</div>
      <div v-if="props.blurb" class="dl-linkcard__blurb">{{ props.blurb }}</div>
      <div class="dl-linkcard__host">{{ host }}</div>
    </div>
  </a>
</template>

<style scoped>
.dl-linkcard {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--dl-border);
  border-left: 3px solid var(--dl-accent);
  border-radius: 8px;
  background: var(--dl-surface);
  text-decoration: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.dl-linkcard:hover {
  transform: translateY(-2px);
  border-color: var(--dl-accent);
}

.dl-linkcard__icon {
  /* The deck font (Inter) carries no emoji glyphs, so name the emoji fonts
     explicitly rather than relying on the browser's fallback chain. */
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif;
  font-size: 1.6rem;
  line-height: 1;
}

.dl-linkcard__text {
  min-width: 0;
}

.dl-linkcard__title {
  color: var(--dl-heading);
  font-weight: 600;
  font-size: 1.05rem;
}

.dl-linkcard__blurb {
  color: var(--dl-body);
  font-size: 0.9rem;
  margin-top: 0.15rem;
}

.dl-linkcard__host {
  color: var(--dl-accent);
  font-size: 0.78rem;
  margin-top: 0.3rem;
}
</style>
