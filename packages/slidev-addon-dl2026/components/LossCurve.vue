<script setup lang="ts">
/*
 * −log p, with a marker you can drag along it.
 *
 * Every loss in the table on the next slide is this curve, read at the
 * probability the model gave the right answer. Seeing the shape settles three
 * questions the algebra leaves open: why a confident mistake costs so much more
 * than an unsure one, why the loss has no upper bound, and why the gradient is
 * largest exactly where the model is worst.
 *
 * `branches` draws −log(1 − p) as well, which is the other half of binary
 * cross-entropy: the same curve, mirrored, selected by the label.
 */
import { computed, ref } from 'vue'
import { num } from '../composables/useConvolution'

const props = withDefaults(defineProps<{
  /** Where the marker starts. */
  p?: number
  /** Also draw the y = 0 branch, −log(1 − p). */
  branches?: boolean
  /** Loss values above this are off the top of the plot. */
  yMax?: number
}>(), {
  p: 0.79,
  branches: false,
  yMax: 4,
})

const p = ref(props.p)
/** Which branch of the binary loss the marker follows. */
const label = ref<1 | 0>(1)

const CLIP = 1e-6
const nll = (q: number) => -Math.log(Math.max(q, CLIP))

const positive = (q: number) => Math.min(props.yMax + 1, nll(q))
const negative = (q: number) => Math.min(props.yMax + 1, nll(1 - q))

const loss = computed(() => (props.branches && label.value === 0 ? nll(1 - p.value) : nll(p.value)))
const at = computed<[number, number]>(() => [p.value, Math.min(loss.value, props.yMax)])

/** Landmarks worth naming out loud. Only the middle one gets a label: the
 * bottom-right corner belongs to the draggable marker. */
const marks = computed(() => [
  { x: 1, y: 0, text: '' },
  { x: 0.5, y: nll(0.5), text: 'a coin flip → 0.69' },
])

const doubled = computed(() => nll(Math.max(p.value / 2, CLIP)) - nll(p.value))
</script>

<template>
  <WidgetFrame max-width="34rem">
    <Plot2D
      :x-domain="[0, 1]"
      :y-domain="[0, props.yMax]"
      :width="520"
      :height="300"
      x-label="probability the model gave the true class"
      y-label="loss"
      :x-ticks="[0, 0.25, 0.5, 0.75, 1]"
      :y-ticks="[0, 1, 2, 3, 4]"
    >
      <PlotCurve :fn="positive" color="var(--dl-accent)" :width="3" />
      <PlotCurve v-if="props.branches" :fn="negative" color="var(--dl-danger)" :width="2" dashed />

      <PlotPoints :points="marks.map(m => ({ x: m.x, y: m.y }))" color="var(--dl-muted)" :radius="3.5" />
      <PlotLabel
        v-for="m in marks.filter(m => m.text)"
        :key="m.text"
        :at="[m.x, m.y]" :text="m.text" :dx="-10" :dy="-10" anchor="end" :size="11"
      />

      <PlotPoints :points="[{ x: at[0], y: at[1], highlight: true }]" :radius="6" />
      <PlotLabel :at="at" :text="`${num(p)} → ${num(loss)}`" :dx="12" :dy="-10" bold leader />
    </Plot2D>

    <template #controls>
      <Slider v-model="p" label="p (true class)" :min="0.01" :max="0.99" :step="0.01" :precision="2" />
      <template v-if="props.branches">
        <StepButton label="label y = 1" :variant="label === 1 ? 'primary' : 'ghost'" @click="label = 1" />
        <StepButton label="label y = 0" :variant="label === 0 ? 'primary' : 'ghost'" @click="label = 0" />
      </template>
    </template>

    <template #readout>
      <template v-if="props.branches">
        Binary cross-entropy is these two curves and a switch:
        <strong>−[y log p + (1 − y) log(1 − p)]</strong>. With y = {{ label }} and p = {{ num(p) }} it reads
        <strong>{{ num(loss) }}</strong>.
      </template>
      <template v-else>
        p = {{ num(p) }} costs <strong>{{ num(loss) }}</strong>. Halve that confidence and it costs
        {{ num(doubled) }} more — the same 0.69 every time you halve, because this is a logarithm.
      </template>
    </template>
  </WidgetFrame>
</template>
