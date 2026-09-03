<script setup lang="ts">
/*
 * Widget-first slide: the interactive component gets the space, the prose sits
 * in a narrow rail beside it. `aside` is where the teaching point goes so the
 * widget never has to carry the explanation on its own.
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
  /** Width of the prose rail. */
  asideWidth?: string
  /** Put the prose rail on the left instead of the right. */
  asideLeft?: boolean
}>()
</script>

<template>
  <div class="slidev-layout dl-interactive">
    <h1 v-if="props.heading" class="dl-interactive__title">{{ props.heading }}</h1>

    <div class="dl-interactive__grid" :class="{ 'is-aside-left': props.asideLeft }">
      <div class="dl-interactive__stage">
        <slot />
      </div>
      <div class="dl-interactive__aside" :style="{ flexBasis: props.asideWidth ?? '17rem' }">
        <slot name="aside" />
      </div>
    </div>

    <DeckFooter />
  </div>
</template>

<style scoped>
.dl-interactive {
  display: flex;
  flex-direction: column;
}

.dl-interactive__title {
  margin-bottom: 0.7rem;
}

.dl-interactive__grid {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: 1.6rem;
  align-items: stretch;
}

.dl-interactive__grid.is-aside-left {
  flex-direction: row-reverse;
}

.dl-interactive__stage {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dl-interactive__aside {
  flex-grow: 0;
  flex-shrink: 0;
  font-size: var(--dl-fs-secondary);
  overflow-y: auto;
}

.dl-interactive__aside:empty {
  display: none;
}
</style>
