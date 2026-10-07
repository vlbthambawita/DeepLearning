<script setup lang="ts">
/*
 * "Report an issue" link on every slide. Slidev renders a theme's slide-top.vue
 * layer on top of every slide, so this also reaches title/section/end slides,
 * which have no footer. The link opens a new GitHub issue with the lecture and
 * slide number already in the title and a short template in the body.
 *
 * Hidden outside the live slide view (overview thumbnails, presenter previews)
 * and in print/PDF export, where a link is just noise.
 */
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import config from '../../decks.config.json'

const { $slidev, $page, $renderContext } = useSlideContext()

const visible = computed(() => $renderContext.value === 'slide' && !$slidev.nav.isPrintMode)

const lecture = computed(() => ($slidev.themeConfigs as Record<string, any>)?.lecture ?? '')
const lectureTitle = computed(() => ($slidev.themeConfigs as Record<string, any>)?.lectureTitle ?? '')

const href = computed(() => {
  const slide = $page.value
  const where = lecture.value ? `Lecture ${lecture.value}, slide ${slide}` : `Slide ${slide}`
  const title = `[${where}] `
  const body = [
    `**Lecture:** ${lecture.value}${lectureTitle.value ? ` — ${lectureTitle.value}` : ''}`,
    `**Slide:** ${slide}`,
    `**Link:** ${typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/${slide}` : ''}`,
    '',
    '**What is wrong?**',
    '<!-- e.g. typo, wrong equation, broken figure, unclear explanation -->',
    '',
  ].join('\n')
  const params = new URLSearchParams({ title, body, labels: 'slides' })
  return `https://github.com/${config.repo}/issues/new?${params}`
})
</script>

<template>
  <a
    v-if="visible"
    class="dl-report"
    :href="href"
    target="_blank"
    rel="noopener"
    title="Report a problem with this slide on GitHub"
    @click.stop
  >Report issue</a>
</template>

<style scoped>
.dl-report {
  position: absolute;
  right: 3rem;
  bottom: 0.2rem;
  z-index: 10;
  font-size: 0.6rem;
  letter-spacing: 0.04em;
  color: var(--dl-muted);
  opacity: 0.55;
  text-decoration: none;
  transition: opacity 0.15s, color 0.15s;
}

.dl-report:hover,
.dl-report:focus-visible {
  opacity: 1;
  color: var(--dl-accent);
  text-decoration: underline;
}
</style>
