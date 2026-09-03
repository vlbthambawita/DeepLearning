<script setup lang="ts">
/*
 * What one layer costs, as an MLP layer and as a convolution layer.
 *
 * This is the slide the 2025 deck was missing. It opened with "CNNs are
 * inspired by the visual cortex", which is a fact about history rather than a
 * reason, and stated the parameter saving twice in prose ("substantially
 * decrease the number of weights") without ever putting a number on it. The
 * number is the argument: at 224×224×3 the fully-connected layer wants tens of
 * millions of weights and the convolution layer wants a few thousand, and no
 * amount of biological analogy carries the point as well as watching the ratio
 * move while the image gets bigger.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  channels?: number
  hidden?: number
  kernel?: number
  filters?: number
}>(), {
  size: 28,
  channels: 1,
  hidden: 256,
  kernel: 5,
  filters: 32,
})

const size = ref(props.size)
const channels = ref(props.channels)
const hidden = ref(props.hidden)
const kernel = ref(props.kernel)
const filters = ref(props.filters)

const inputs = computed(() => size.value * size.value * channels.value)
const dense = computed(() => inputs.value * hidden.value + hidden.value)
const conv = computed(() => kernel.value * kernel.value * channels.value * filters.value + filters.value)
const ratio = computed(() => dense.value / conv.value)

/**
 * Deliberately linear. A log scale would draw the convolution layer at about
 * half the length of the dense one, which is a far kinder picture than the
 * truth — the whole argument is that the second bar is a sliver. It is floored
 * at 2% so the sliver is still visible on a projector.
 */
function barWidth(value: number) {
  const span = Math.max(dense.value, conv.value, 1)
  return `${Math.max(2, (value / span) * 100)}%`
}

/** 15831 reads as "16 thousand times", not as five digits nobody can hold. */
const ratioLabel = computed(() => {
  const r = ratio.value
  if (r >= 1000)
    return `${(r / 1000).toFixed(1)}k`
  if (r >= 10)
    return String(Math.round(r))
  return r.toFixed(1)
})

const PRESETS = [
  { label: 'MNIST digit', size: 28, channels: 1 },
  { label: 'CIFAR image', size: 32, channels: 3 },
  { label: 'ImageNet photo', size: 224, channels: 3 },
  { label: 'endoscopy frame', size: 384, channels: 3 },
]

function usePreset(p: typeof PRESETS[number]) {
  size.value = p.size
  channels.value = p.channels
}

function big(n: number) {
  if (n >= 1e6)
    return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} M`
  if (n >= 1e4)
    return `${(n / 1e3).toFixed(0)} k`
  return n.toLocaleString('en-US')
}
</script>

<template>
  <WidgetFrame max-width="42rem">
    <div class="dl-budget">
      <div class="dl-budget__presets">
        <button
          v-for="p in PRESETS"
          :key="p.label"
          type="button"
          class="dl-budget__preset"
          :class="{ 'is-active': size === p.size && channels === p.channels }"
          @click="usePreset(p)"
        >{{ p.label }}<span>{{ p.size }}×{{ p.size }}×{{ p.channels }}</span></button>
      </div>

      <div class="dl-budget__row">
        <div class="dl-budget__name">
          fully connected
          <span class="dl-budget__spec">{{ inputs.toLocaleString('en-US') }} inputs → {{ hidden }} units</span>
        </div>
        <div class="dl-budget__track"><span class="dl-budget__bar is-dense" :style="{ width: barWidth(dense) }" /></div>
        <div class="dl-budget__value is-dense">{{ big(dense) }}</div>
      </div>

      <div class="dl-budget__row">
        <div class="dl-budget__name">
          convolution
          <span class="dl-budget__spec">{{ kernel }}×{{ kernel }} kernel, {{ filters }} filters</span>
        </div>
        <div class="dl-budget__track"><span class="dl-budget__bar is-conv" :style="{ width: barWidth(conv) }" /></div>
        <div class="dl-budget__value is-conv">{{ big(conv) }}</div>
      </div>

      <div class="dl-budget__verdict">
        <strong>{{ ratioLabel }}×</strong>
        fewer weights, for a layer that also does not have to relearn the same feature
        in every position.
      </div>
    </div>

    <template #controls>
      <Slider v-model="size" label="image side" :min="28" :max="384" :step="4" :precision="0" unit=" px" />
      <Slider v-model="channels" label="channels" :min="1" :max="3" :step="1" :precision="0" />
      <Slider v-model="hidden" label="hidden units" :min="64" :max="1024" :step="64" :precision="0" />
      <Slider v-model="filters" label="filters" :min="8" :max="64" :step="8" :precision="0" />
    </template>

    <template #readout>
      The fully-connected count is <em>one</em> layer of the network we built last week.
      The convolution count is the whole layer, at every position in the image, for good —
      it does not grow when the image does.
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-budget {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
}

.dl-budget__presets {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: center;
}

.dl-budget__preset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-budget__preset span {
  font-size: 0.68rem;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-budget__preset:hover {
  border-color: var(--dl-accent);
}

.dl-budget__preset.is-active {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-budget__preset:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-budget__row {
  display: grid;
  grid-template-columns: 11rem 1fr 5rem;
  align-items: center;
  gap: 0.7rem;
}

.dl-budget__name {
  display: flex;
  flex-direction: column;
  font-size: 0.86rem;
  color: var(--dl-heading);
  font-weight: 600;
  line-height: 1.25;
}

.dl-budget__spec {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-budget__track {
  height: 1.35rem;
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  border-radius: 3px;
  overflow: hidden;
}

.dl-budget__bar {
  display: block;
  height: 100%;
  transition: width 0.3s ease;
}

.dl-budget__bar.is-dense {
  background: var(--dl-danger);
}

.dl-budget__bar.is-conv {
  background: var(--dl-accent);
}

.dl-budget__value {
  text-align: right;
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dl-budget__value.is-dense {
  color: var(--dl-danger);
}

.dl-budget__value.is-conv {
  color: var(--dl-accent);
}

.dl-budget__verdict {
  text-align: center;
  font-size: 0.95rem;
  color: var(--dl-body);
}

.dl-budget__verdict strong {
  font-size: 1.3rem;
  color: var(--dl-accent);
}
</style>
