<script setup lang="ts">
/*
 * The loss bowl from Lecture 02 slides 16-19, made steppable.
 *
 * The 2025 slide showed a static picture with an arrow labelled "Gradient" and
 * asked the room to imagine the descent. Here the arrow is the actual update,
 * the tangent is the actual derivative, and the learning-rate slider reaches
 * far enough that the run visibly diverges — which is slide 21's point ("why do
 * we need a good learning rate?") demonstrated rather than asserted.
 *
 * Loss is Adaline's, halved exactly as the lecture notes it:
 *   L(w) = 1/2 (w - w*)^2 + floor      dL/dw = w - w*
 * so the second derivative is 1 and the run diverges for eta > 2 — a threshold
 * the slider deliberately crosses.
 */
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  /** Location of the minimum. */
  optimum?: number
  floor?: number
  start?: number
  eta?: number
  maxSteps?: number
}>(), {
  optimum: 2,
  floor: 0.4,
  start: 5.2,
  eta: 0.35,
  maxSteps: 40,
})

const W_DOMAIN: [number, number] = [-2.4, 6.4]
const L_DOMAIN: [number, number] = [0, 9]

const eta = ref(props.eta)
const start = ref(props.start)
const trajectory = ref<number[]>([props.start])

const loss = (w: number) => 0.5 * (w - props.optimum) ** 2 + props.floor
const grad = (w: number) => w - props.optimum

const current = computed(() => trajectory.value[trajectory.value.length - 1])
const currentGrad = computed(() => grad(current.value))
const steps = computed(() => trajectory.value.length - 1)

// A run that has left the plot entirely is not "still descending", and saying
// so is the whole lesson of the too-large learning rate.
const diverged = computed(() =>
  Math.abs(current.value) > 1e3 || Math.abs(current.value - props.optimum) > 40)
const settled = computed(() => Math.abs(currentGrad.value) < 1e-3)

function reset() {
  trajectory.value = [start.value]
}

watch(start, reset)
watch(eta, reset)

function step() {
  if (trajectory.value.length > props.maxSteps || diverged.value || settled.value)
    return
  const w = current.value
  trajectory.value = [...trajectory.value, w - eta.value * grad(w)]
}

function run() {
  for (let i = 0; i < 25; i++)
    step()
}

/** Each hop drawn as an arrow along the curve, so the path is legible at a glance. */
const hops = computed(() => {
  const out: Array<{ from: [number, number], to: [number, number] }> = []
  const [lo, hi] = W_DOMAIN
  for (let i = 1; i < trajectory.value.length; i++) {
    const a = trajectory.value[i - 1]
    const c = trajectory.value[i]
    if (a < lo || a > hi || c < lo || c > hi)
      continue
    out.push({ from: [a, loss(a)], to: [c, loss(c)] })
  }
  return out
})

/** Tangent at the current weight — the gradient the update is reading. */
const tangent = computed(() => {
  const w = current.value
  if (!Number.isFinite(w))
    return null
  const span = 1.1
  const at = (x: number) => loss(w) + currentGrad.value * (x - w)
  return { from: [w - span, at(w - span)] as [number, number], to: [w + span, at(w + span)] as [number, number] }
})

const visited = computed(() =>
  trajectory.value
    .filter(w => w >= W_DOMAIN[0] && w <= W_DOMAIN[1])
    .map(w => ({ x: w, y: loss(w) })))
</script>

<template>
  <WidgetFrame max-width="44rem">
    <Plot2D
      :x-domain="W_DOMAIN"
      :y-domain="L_DOMAIN"
      :width="500"
      :height="310"
      x-label="w"
      y-label="L(w)"
    >
      <PlotCurve :fn="loss" color="var(--dl-accent)" :width="3" />

      <PlotLine
        v-if="tangent && !diverged"
        :from="tangent.from"
        :to="tangent.to"
        color="var(--dl-muted)"
        :width="1.5"
        dashed
      />

      <PlotLine
        v-for="(h, i) in hops"
        :key="i"
        :from="h.from"
        :to="h.to"
        color="var(--dl-heading)"
        :width="1.8"
        arrow
        :opacity="0.35 + (0.65 * (i + 1)) / hops.length"
      />

      <PlotPoints :points="visited" :radius="4" color="var(--dl-heading)" :opacity="0.55" />
      <PlotPoints
        v-if="!diverged"
        :points="[{ x: current, y: loss(current) }]"
        :radius="7"
        color="var(--dl-accent-strong)"
      />
      <PlotLabel :at="[props.optimum, props.floor]" :dy="26" anchor="middle" :dx="0" text="global minimum" leader />
    </Plot2D>

    <template #controls>
      <StepButton label="Step" glyph="▶" :disabled="diverged || settled" @click="step" />
      <StepButton label="Run" variant="ghost" :disabled="diverged || settled" @click="run" />
      <StepButton label="Reset" variant="ghost" @click="reset" />
      <Slider v-model="eta" label="learning rate η" :min="0.05" :max="2.4" :step="0.05" class="dl-gd__ctl" />
      <Slider v-model="start" label="starting w" :min="-2" :max="6" :step="0.1" :precision="1" class="dl-gd__ctl" />
    </template>

    <template #readout>
      <div class="dl-gd__math">
        <Katex :expr="`w := w - \\eta \\frac{\\partial L}{\\partial w} = ${current.toFixed(3)} - ${eta.toFixed(2)} \\times (${currentGrad.toFixed(3)})`" />
      </div>
      <div>
        step {{ steps }} · L(w) = <strong>{{ Number.isFinite(loss(current)) ? loss(current).toFixed(4) : '∞' }}</strong>
        <span v-if="diverged" class="dl-gd__bad">η is too large — the update overshoots and the loss climbs away</span>
        <span v-else-if="settled" class="dl-gd__ok">gradient is zero: nothing left to update</span>
        <span v-else-if="eta < 0.12" class="dl-gd__slow">η is small — correct direction, but it will take many steps</span>
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-gd__ctl {
  min-width: 10.5rem;
}

.dl-gd__math {
  margin-bottom: 0.15rem;
  font-size: 0.95rem;
}

.dl-gd__bad {
  color: var(--dl-danger);
  font-weight: 600;
  margin-left: 0.4rem;
}

.dl-gd__ok {
  color: var(--dl-accent);
  font-weight: 600;
  margin-left: 0.4rem;
}

.dl-gd__slow {
  color: var(--dl-muted);
  margin-left: 0.4rem;
}
</style>
