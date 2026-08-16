<script setup lang="ts">
/*
 * The button widgets use for "take one step", "reset", "run". Kept as one
 * component so every control in the deck has the same hit area and focus ring.
 */
const props = withDefaults(defineProps<{
  label: string
  variant?: 'primary' | 'ghost'
  disabled?: boolean
  /** Shown before the label; use text or an emoji, not an icon font. */
  glyph?: string
}>(), {
  variant: 'primary',
  disabled: false,
})

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="dl-btn"
    :class="`is-${props.variant}`"
    :disabled="props.disabled"
    @click="emit('click')"
  >
    <span v-if="props.glyph" class="dl-btn__glyph" aria-hidden="true">{{ props.glyph }}</span>
    {{ props.label }}
  </button>
</template>

<style scoped>
.dl-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.75rem;
  border-radius: 6px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.dl-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dl-btn:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.is-primary {
  background: var(--dl-accent);
  color: #fff;
}

.is-primary:not(:disabled):hover {
  background: var(--dl-accent-strong);
}

.is-ghost {
  background: transparent;
  border-color: var(--dl-border);
  color: var(--dl-body);
}

.is-ghost:not(:disabled):hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-btn__glyph {
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  font-size: 0.9em;
}
</style>
