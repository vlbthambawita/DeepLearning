<script setup lang="ts">
/*
 * Replaces the activation-function table that Lecture 02 slide 30 carried as a
 * 1124x1328 screenshot from Raschka's book.
 *
 * A table tells you sigmoid saturates. Plotting the function against its own
 * derivative shows you *why* that kills the gradient — which is the point the
 * slide is actually making before backpropagation is introduced.
 */
import { computed, ref } from 'vue'

interface Activation {
  key: string
  name: string
  latex: string
  fn: (x: number) => number
  /** Analytic derivative; undefined at kinks is fine, we sample around them. */
  d: (x: number) => number
  yDomain: [number, number]
  note: string
}

const ACTIVATIONS: Activation[] = [
  {
    key: 'sigmoid',
    name: 'Sigmoid',
    latex: '\\sigma(z) = \\dfrac{1}{1 + e^{-z}}',
    fn: z => 1 / (1 + Math.exp(-z)),
    d: (z) => {
      const s = 1 / (1 + Math.exp(-z))
      return s * (1 - s)
    },
    yDomain: [-0.3, 1.3],
    note: 'Squashes to (0, 1). The derivative peaks at just 0.25 and vanishes either side — the origin of the vanishing-gradient problem in deep stacks.',
  },
  {
    key: 'tanh',
    name: 'Tanh',
    latex: '\\tanh(z) = \\dfrac{e^{z} - e^{-z}}{e^{z} + e^{-z}}',
    fn: z => Math.tanh(z),
    d: z => 1 - Math.tanh(z) ** 2,
    yDomain: [-1.4, 1.4],
    note: 'Zero-centred, so gradients do not all share a sign. Still saturates, but its derivative reaches 1 rather than 0.25.',
  },
  {
    key: 'relu',
    name: 'ReLU',
    latex: 'f(z) = \\max(0,\\ z)',
    fn: z => Math.max(0, z),
    d: z => (z > 0 ? 1 : 0),
    yDomain: [-1, 4],
    note: 'No saturation for positive input, so the gradient survives depth. Units with permanently negative input never update — the "dying ReLU".',
  },
  {
    key: 'leaky',
    name: 'Leaky ReLU',
    latex: 'f(z) = \\begin{cases} z & z > 0 \\\\ 0.01z & z \\le 0 \\end{cases}',
    fn: z => (z > 0 ? z : 0.01 * z),
    d: z => (z > 0 ? 1 : 0.01),
    yDomain: [-1, 4],
    note: 'Keeps a small slope below zero so a unit can recover.',
  },
  {
    key: 'step',
    name: 'Unit step',
    latex: '\\phi(z) = \\begin{cases} 1 & z \\ge 0 \\\\ 0 & z < 0 \\end{cases}',
    fn: z => (z >= 0 ? 1 : 0),
    d: () => 0,
    yDomain: [-0.3, 1.3],
    note: 'What the perceptron uses. Its derivative is zero everywhere it exists, which is exactly why gradient descent cannot train it — and why Adaline switches to a linear activation.',
  },
  {
    key: 'linear',
    name: 'Linear',
    latex: 'f(z) = z',
    fn: z => z,
    d: () => 1,
    yDomain: [-4, 4],
    note: "Adaline's activation. Differentiable and convex under MSE, so gradient descent applies — but stacking linear layers still only gives you a linear model.",
  },
]

const selected = ref(ACTIVATIONS[0].key)
const showDerivative = ref(true)
const probe = ref(1.5)

const active = computed(() => ACTIVATIONS.find(a => a.key === selected.value)!)
const value = computed(() => active.value.fn(probe.value))
const slope = computed(() => active.value.d(probe.value))
</script>

<template>
  <WidgetFrame max-width="46rem">
    <Plot2D
      :x-domain="[-6, 6]"
      :y-domain="active.yDomain"
      :width="560"
      :height="300"
      x-label="z (net input)"
      origin-axes
    >
      <PlotCurve
        v-if="showDerivative"
        :key="`d-${active.key}`"
        :fn="active.d"
        color="var(--dl-muted)"
        :width="2"
        dashed
      />
      <PlotCurve :key="active.key" :fn="active.fn" color="var(--dl-accent)" :width="3" />
      <PlotLine
        :from="[probe, active.yDomain[0]]"
        :to="[probe, value]"
        color="var(--dl-border)"
        :width="1.5"
        dashed
      />
      <PlotPoints :points="[{ x: probe, y: value }]" :radius="6" color="var(--dl-accent)" />
    </Plot2D>

    <template #controls>
      <div class="dl-act__tabs" role="tablist">
        <button
          v-for="a in ACTIVATIONS"
          :key="a.key"
          type="button"
          role="tab"
          :aria-selected="a.key === selected"
          :class="{ 'is-active': a.key === selected }"
          @click="selected = a.key"
        >{{ a.name }}</button>
      </div>

      <Slider v-model="probe" label="z" :min="-6" :max="6" :step="0.1" :precision="1" class="dl-act__probe" />

      <label class="dl-act__toggle">
        <input v-model="showDerivative" type="checkbox">
        show derivative
      </label>
    </template>

    <template #readout>
      <div class="dl-act__formula">
        <Katex :expr="active.latex" />
      </div>
      <div class="dl-act__numbers">
        f({{ probe.toFixed(1) }}) = <strong>{{ value.toFixed(3) }}</strong>
        &nbsp;·&nbsp;
        f&prime;({{ probe.toFixed(1) }}) = <strong :class="{ 'is-dead': Math.abs(slope) < 0.02 }">{{ slope.toFixed(3) }}</strong>
        <span v-if="Math.abs(slope) < 0.02" class="dl-act__warn">gradient is effectively dead here</span>
      </div>
      <p class="dl-act__note">{{ active.note }}</p>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-act__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.dl-act__tabs button {
  padding: 0.25rem 0.6rem;
  font: inherit;
  font-size: 0.78rem;
  border: 1px solid var(--dl-border);
  border-radius: 5px;
  background: transparent;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-act__tabs button:hover {
  border-color: var(--dl-accent);
}

.dl-act__tabs button.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-act__probe {
  min-width: 11rem;
}

.dl-act__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.dl-act__toggle input {
  accent-color: var(--dl-accent);
}

.dl-act__formula {
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}

.dl-act__numbers strong {
  color: var(--dl-heading);
}

.dl-act__numbers strong.is-dead {
  color: var(--dl-danger);
}

.dl-act__warn {
  color: var(--dl-danger);
  margin-left: 0.5rem;
}

.dl-act__note {
  margin: 0.35rem 0 0;
  max-width: 60ch;
  line-height: 1.45;
}
</style>
