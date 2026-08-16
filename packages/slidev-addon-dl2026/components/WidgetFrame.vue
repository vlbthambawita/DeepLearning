<script setup lang="ts">
/*
 * Common shell for the interactive widgets: a stage that takes the available
 * space, a control strip underneath, and an optional readout line.
 *
 * Having one frame means a student who has learned to drive one widget can
 * drive all of them — controls are always in the same place.
 */
const props = withDefaults(defineProps<{
  /** Constrains the stage so a plot does not stretch to absurd proportions. */
  maxWidth?: string
  /** Put the controls above the stage instead of below. */
  controlsFirst?: boolean
}>(), {
  maxWidth: '100%',
})
</script>

<template>
  <div class="dl-widget" :style="{ maxWidth: props.maxWidth }" :class="{ 'is-controls-first': props.controlsFirst }">
    <div class="dl-widget__stage">
      <slot />
    </div>

    <div class="dl-widget__controls">
      <slot name="controls" />
    </div>

    <div class="dl-widget__readout">
      <slot name="readout" />
    </div>
  </div>
</template>

<style scoped>
.dl-widget {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dl-widget.is-controls-first {
  flex-direction: column-reverse;
  justify-content: flex-end;
}

.dl-widget__stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dl-widget__controls {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.2rem;
}

.dl-widget__controls:empty,
.dl-widget__readout:empty {
  display: none;
}

.dl-widget__readout {
  flex: 0 0 auto;
  font-size: 0.82rem;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}
</style>
