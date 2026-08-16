<script setup lang="ts">
/*
 * The 2025 decks had page numbers typed by hand onto three slides and nowhere
 * else. Numbering belongs to the theme, so it lives here and is included by
 * every content layout (but not by title/section/end).
 *
 * Values come from `themeConfig` in the deck headmatter, which is Slidev's
 * supported channel for theme-specific options.
 */
import { computed } from 'vue'
import { useSlideContext, useNav } from '@slidev/client'

const { $slidev } = useSlideContext()
const nav = useNav()

const cfg = computed<Record<string, any>>(() => ($slidev?.themeConfigs ?? {}) as Record<string, any>)
const courseCode = computed(() => cfg.value.courseCode ?? '')
const lecture = computed(() => cfg.value.lecture ?? '')
const lectureTitle = computed(() => cfg.value.lectureTitle ?? '')
</script>

<template>
  <footer class="dl-footer">
    <div class="dl-footer__left">
      <span v-if="courseCode" class="dl-footer__code">{{ courseCode }}</span>
      <span v-if="lecture" class="dl-footer__sep">·</span>
      <span v-if="lecture">Lecture {{ lecture }}</span>
      <span v-if="lectureTitle" class="dl-footer__sep">·</span>
      <span v-if="lectureTitle" class="dl-footer__title">{{ lectureTitle }}</span>
    </div>
    <div class="dl-footer__right">
      {{ nav.currentPage.value }} / {{ nav.total.value }}
    </div>
  </footer>
</template>

<style scoped>
.dl-footer {
  position: absolute;
  left: 3rem;
  right: 3rem;
  bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--dl-muted);
  pointer-events: none;
}

.dl-footer__left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.dl-footer__code {
  color: var(--dl-accent);
  font-weight: 700;
}

.dl-footer__sep {
  opacity: 0.5;
}

.dl-footer__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dl-footer__right {
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
</style>
