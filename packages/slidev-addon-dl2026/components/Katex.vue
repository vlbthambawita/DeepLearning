<script setup lang="ts">
/*
 * Renders a LaTeX string from a component.
 *
 * Markdown slides use Slidev's built-in `$...$`, but a widget whose formula
 * changes with the selected function needs to typeset at runtime — hence this.
 */
import { computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = withDefaults(defineProps<{
  expr: string
  display?: boolean
}>(), {
  display: false,
})

const html = computed(() => {
  try {
    return katex.renderToString(props.expr, {
      displayMode: props.display,
      throwOnError: false,
      output: 'html',
    })
  }
  catch (err) {
    // A malformed formula should show up as visible red text on the slide, not
    // blow up the whole deck mid-lecture.
    return `<span class="dl-katex-error">${props.expr}</span>`
  }
})
</script>

<template>
  <span class="dl-katex" :class="{ 'is-display': props.display }" v-html="html" />
</template>

<style scoped>
.dl-katex :deep(.katex) {
  color: var(--dl-heading);
}

.dl-katex.is-display {
  display: block;
  text-align: center;
}

.dl-katex :deep(.dl-katex-error) {
  color: var(--dl-danger);
  font-family: ui-monospace, monospace;
}
</style>
