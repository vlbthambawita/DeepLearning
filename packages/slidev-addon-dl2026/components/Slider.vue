<script setup lang="ts">
/*
 * Labelled slider with a live value readout.
 *
 * Keyboard-operable by default (it is a real <input type="range">), which
 * matters because these widgets get driven from a lectern with no mouse.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  min?: number
  max?: number
  step?: number
  /** Decimal places in the readout. */
  precision?: number
  unit?: string
  /** Render the value on a log scale readout, e.g. for learning rates. */
  format?: (value: number) => string
  disabled?: boolean
}>(), {
  min: 0,
  max: 1,
  step: 0.01,
  precision: 2,
  disabled: false,
})

const model = defineModel<number>({ required: true })

const display = computed(() =>
  props.format ? props.format(model.value) : model.value.toFixed(props.precision))
</script>

<template>
  <label class="dl-slider" :class="{ 'is-disabled': props.disabled }">
    <span v-if="props.label" class="dl-slider__label">{{ props.label }}</span>
    <input
      v-model.number="model"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :disabled="props.disabled"
    >
    <output class="dl-slider__value">{{ display }}<span v-if="props.unit" class="dl-slider__unit">{{ props.unit }}</span></output>
  </label>
</template>

<style scoped>
.dl-slider {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.15rem 0.6rem;
  font-size: 0.82rem;
  color: var(--dl-body);
}

.dl-slider.is-disabled {
  opacity: 0.45;
}

.dl-slider__label {
  grid-column: 1;
}

.dl-slider__value {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  min-width: 3.6rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--dl-accent);
}

.dl-slider__unit {
  color: var(--dl-muted);
  font-weight: 400;
  margin-left: 0.1rem;
}

.dl-slider input {
  grid-column: 1;
  width: 100%;
  accent-color: var(--dl-accent);
  cursor: pointer;
}

.dl-slider input:disabled {
  cursor: not-allowed;
}
</style>
