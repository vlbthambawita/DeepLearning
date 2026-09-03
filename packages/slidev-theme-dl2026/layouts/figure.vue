<script setup lang="ts">
/*
 * For the many 2025 slides that are essentially one figure (Lecture 01 slides
 * 13, 16, 27, 29, 30, 33, 35; Lecture 02 slides 3, 8, 12, 17, 19, 21, 29).
 * The citation slot exists because most of Lecture 02's figures come from
 * Raschka/Liu/Mirjalili and must stay attributed wherever they are reused.
 */
const props = defineProps<{
  /*
   * The heading the room sees.
   *
   * Not `title`: Slidev claims that key for its own slide metadata — the nav,
   * the overview, the exported outline — and never forwards it to the layout, so
   * a slide whose front matter says `title:` renders with no heading at all.
   * Setting both is the useful case: `heading` for the slide, `title` for the
   * navigation.
   */
  heading?: string
  /** Fraction of the slide height the figure may occupy. */
  maxHeight?: string
}>()
</script>

<template>
  <div class="slidev-layout dl-figure">
    <h1 v-if="props.heading" class="dl-figure__title">{{ props.heading }}</h1>

    <div class="dl-figure__canvas" :style="{ maxHeight: props.maxHeight }">
      <slot />
    </div>

    <div class="dl-figure__footer">
      <div class="dl-figure__caption">
        <slot name="caption" />
      </div>
      <div class="dl-figure__citation">
        <slot name="citation" />
      </div>
    </div>

    <DeckFooter />
  </div>
</template>

<style scoped>
.dl-figure {
  display: flex;
  flex-direction: column;
}

.dl-figure__title {
  margin-bottom: 0.8rem;
}

.dl-figure__canvas {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dl-figure__canvas :deep(img),
.dl-figure__canvas :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.dl-figure__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 0.6rem;
}

.dl-figure__caption {
  font-size: var(--dl-fs-secondary);
  color: var(--dl-body);
}

.dl-figure__citation {
  font-size: var(--dl-fs-citation);
  color: var(--dl-muted);
  text-align: right;
  flex-shrink: 0;
}
</style>
