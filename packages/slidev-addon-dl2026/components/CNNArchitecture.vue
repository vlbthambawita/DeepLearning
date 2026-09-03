<script setup lang="ts">
/*
 * A CNN as a shape ledger — 2025 Lecture 03 slide 25.
 *
 * The original was a book screenshot of the MNIST architecture with the shapes
 * pre-printed underneath. Every one of those shapes is the output-size formula
 * from earlier in the lecture, so here they are computed rather than typed:
 * change the kernel and the whole chain re-derives. That also means the slide
 * cannot drift out of agreement with the formula slide, which is the failure
 * mode of a hand-typed architecture diagram.
 *
 * The parameter bar exists to make one number visible that the screenshot hid:
 * in this architecture the first fully-connected layer holds 98% of the weights.
 * That is the whole argument for what comes after CNNs.
 */
import { computed, ref } from 'vue'
import { num, outputSize } from '../composables/useConvolution'

type Spec =
  | { type: 'input', size: number, channels: number }
  | { type: 'conv', kernel: number, out: number, padding?: number, stride?: number }
  | { type: 'pool', kernel: number, stride?: number, mode?: 'max' | 'mean' }
  | { type: 'flatten' }
  | { type: 'fc', out: number }
  | { type: 'dropout', p: number }

const props = withDefaults(defineProps<{
  layers?: Spec[]
  /** Height in px of the tallest feature-map block. */
  maxBlock?: number
}>(), {
  layers: () => [
    { type: 'input', size: 28, channels: 1 },
    { type: 'conv', kernel: 5, out: 32, padding: 2 },
    { type: 'pool', kernel: 2 },
    { type: 'conv', kernel: 5, out: 64, padding: 2 },
    { type: 'pool', kernel: 2 },
    { type: 'flatten' },
    { type: 'fc', out: 1024 },
    { type: 'fc', out: 10 },
  ],
  maxBlock: 128,
})

interface Stage {
  spec: Spec
  label: string
  detail: string
  /** null once the tensor has been flattened. */
  size: number | null
  channels: number
  units: number
  params: number
  /** How the shape and the parameter count were arrived at. */
  shapeExpr: string
  paramExpr: string
}

const stages = computed<Stage[]>(() => {
  const out: Stage[] = []
  let size = 0
  let channels = 0
  let flat = 0

  for (const spec of props.layers) {
    if (spec.type === 'input') {
      size = spec.size
      channels = spec.channels
      flat = 0
      out.push({
        spec,
        label: 'input',
        detail: `${spec.size}×${spec.size}×${spec.channels}`,
        size,
        channels,
        units: size * size * channels,
        params: 0,
        shapeExpr: '',
        paramExpr: 'The image itself — nothing learned here.',
      })
      continue
    }

    if (spec.type === 'conv') {
      const p = spec.padding ?? 0
      const s = spec.stride ?? 1
      const before = size
      const cIn = channels
      size = outputSize(before, spec.kernel, p, s)
      channels = spec.out
      const params = spec.kernel * spec.kernel * cIn * spec.out + spec.out
      out.push({
        spec,
        label: `conv ${spec.kernel}×${spec.kernel}`,
        detail: `${size}×${size}×${channels}`,
        size,
        channels,
        units: size * size * channels,
        params,
        shapeExpr: `o = \\left\\lfloor\\frac{${before} + 2\\times ${p} - ${spec.kernel}}{${s}}\\right\\rfloor + 1 = ${size}`,
        paramExpr: `${spec.kernel}\\times ${spec.kernel}\\times ${cIn}\\times ${spec.out} + ${spec.out} = ${params.toLocaleString('en-US')}`,
      })
      continue
    }

    if (spec.type === 'pool') {
      const s = spec.stride ?? spec.kernel
      const before = size
      size = outputSize(before, spec.kernel, 0, s)
      out.push({
        spec,
        label: `${spec.mode ?? 'max'}-pool ${spec.kernel}×${spec.kernel}`,
        detail: `${size}×${size}×${channels}`,
        size,
        channels,
        units: size * size * channels,
        params: 0,
        shapeExpr: `o = \\left\\lfloor\\frac{${before} - ${spec.kernel}}{${s}}\\right\\rfloor + 1 = ${size}`,
        paramExpr: 'No learnable parameters — pooling is a fixed function.',
      })
      continue
    }

    if (spec.type === 'flatten') {
      flat = size * size * channels
      out.push({
        spec,
        label: 'flatten',
        detail: `${flat.toLocaleString('en-US')}`,
        size: null,
        channels,
        units: flat,
        params: 0,
        shapeExpr: `${size}\\times ${size}\\times ${channels} = ${flat.toLocaleString('en-US')}`,
        paramExpr: 'A reshape, not a layer. This is the number you get wrong first.',
      })
      continue
    }

    if (spec.type === 'fc') {
      const fanIn = flat
      const params = fanIn * spec.out + spec.out
      flat = spec.out
      out.push({
        spec,
        label: `fully connected`,
        detail: `${spec.out.toLocaleString('en-US')}`,
        size: null,
        channels: 0,
        units: spec.out,
        params,
        shapeExpr: '',
        paramExpr: `${fanIn.toLocaleString('en-US')}\\times ${spec.out.toLocaleString('en-US')} + ${spec.out.toLocaleString('en-US')} = ${params.toLocaleString('en-US')}`,
      })
      continue
    }

    out.push({
      spec,
      label: `dropout p=${spec.p}`,
      detail: `${flat.toLocaleString('en-US')}`,
      size: null,
      channels: 0,
      units: flat,
      params: 0,
      shapeExpr: '',
      paramExpr: 'No parameters — it drops units during training only.',
    })
  }

  return out
})

const total = computed(() => stages.value.reduce((acc, s) => acc + s.params, 0))

/** The step walk: -1 shows the whole chain, otherwise one stage is in focus. */
const at = ref(-1)
const focus = computed(() => (at.value < 0 ? null : stages.value[at.value]))

function select(i: number) {
  at.value = at.value === i ? -1 : i
}

function next() {
  at.value = at.value >= stages.value.length - 1 ? -1 : at.value + 1
}

const maxSize = computed(() => Math.max(...stages.value.map(s => s.size ?? 0), 1))

/** Feature-map blocks are drawn to scale so the downsampling is visible. */
function blockHeight(s: Stage) {
  if (s.size === null)
    return 26
  return Math.max(14, (s.size / maxSize.value) * props.maxBlock)
}

/** Channel count as depth, compressed so 1 → 64 does not become a 64× width. */
function blockWidth(s: Stage) {
  if (s.size === null)
    return 16
  return 10 + Math.log2(s.channels + 1) * 5
}

function share(s: Stage) {
  return total.value === 0 ? 0 : (s.params / total.value) * 100
}

const heaviest = computed(() =>
  stages.value.reduce((best, s) => (s.params > best.params ? s : best), stages.value[0]))
</script>

<template>
  <WidgetFrame max-width="52rem">
    <div class="dl-arch">
      <div class="dl-arch__chain">
        <button
          v-for="(s, i) in stages"
          :key="i"
          type="button"
          class="dl-arch__stage"
          :class="{ 'is-focus': at === i, 'is-dim': at >= 0 && at !== i }"
          @click="select(i)"
        >
          <span class="dl-arch__blocks" :style="{ height: `${props.maxBlock}px` }">
            <span
              class="dl-arch__block"
              :class="`is-${s.spec.type}`"
              :style="{ height: `${blockHeight(s)}px`, width: `${blockWidth(s)}px` }"
            />
          </span>
          <span class="dl-arch__name">{{ s.label }}</span>
          <span class="dl-arch__shape">{{ s.detail }}</span>
        </button>
      </div>

      <div class="dl-arch__bar" role="img" :aria-label="`Parameter share by layer, ${total} in total`">
        <span
          v-for="(s, i) in stages"
          :key="`b${i}`"
          class="dl-arch__slice"
          :class="{ 'is-focus': at === i }"
          :style="{ width: `${share(s)}%` }"
          :title="`${s.label}: ${s.params.toLocaleString('en-US')} parameters`"
        />
      </div>
    </div>

    <template #controls>
      <StepButton label="Next stage" glyph="▸" @click="next" />
      <StepButton label="Whole network" variant="ghost" @click="at = -1" />
    </template>

    <template #readout>
      <template v-if="focus">
        <div>
          <strong>{{ focus.label }}</strong> → output <strong>{{ focus.detail }}</strong>
          <span v-if="focus.shapeExpr" class="dl-math-xs">
            &nbsp; <Katex :expr="focus.shapeExpr" />
          </span>
        </div>
        <div class="dl-arch__params">
          <template v-if="focus.params > 0">
            Parameters: <span class="dl-math-xs"><Katex :expr="focus.paramExpr" /></span>
            — {{ num(share(focus), 1) }}% of the model.
          </template>
          <template v-else>{{ focus.paramExpr }}</template>
        </div>
      </template>
      <template v-else>
        <div>
          <strong>{{ total.toLocaleString('en-US') }}</strong> learnable parameters in total. The bar
          shows where they are: <strong>{{ heaviest.label }}</strong> alone holds
          {{ num(share(heaviest), 0) }}% of them.
        </div>
        <div class="dl-arch__params">
          Every shape below is the output-size formula applied to the shape before it.
          Click a stage to see the arithmetic.
        </div>
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-arch {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;
}

.dl-arch__chain {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.45rem;
}

.dl-arch__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.3rem 0.35rem 0.4rem;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.dl-arch__stage:hover {
  border-color: var(--dl-border);
}

.dl-arch__stage.is-focus {
  border-color: var(--dl-accent);
  background: var(--dl-accent-soft);
}

.dl-arch__stage.is-dim {
  opacity: 0.42;
}

.dl-arch__stage:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 1px;
}

.dl-arch__blocks {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* A feature map: tall while the spatial size is large, wide as channels grow. */
.dl-arch__block {
  display: block;
  border: 1px solid var(--dl-heading);
  background: var(--dl-surface);
  border-radius: 2px;
  transition: height 0.3s ease, width 0.3s ease;
}

.dl-arch__block.is-conv {
  background: var(--dl-accent-soft);
  border-color: var(--dl-accent);
}

.dl-arch__block.is-pool {
  background: var(--dl-surface);
  border-style: dashed;
}

.dl-arch__block.is-flatten,
.dl-arch__block.is-fc,
.dl-arch__block.is-dropout {
  background: var(--dl-table-header);
}

.dl-arch__name {
  font-size: 0.72rem;
  color: var(--dl-body);
  white-space: nowrap;
}

.dl-arch__shape {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--dl-heading);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dl-arch__bar {
  display: flex;
  height: 0.75rem;
  border: 1px solid var(--dl-border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--dl-surface);
}

.dl-arch__slice {
  display: block;
  background: var(--dl-accent);
  border-right: 1px solid var(--dl-bg);
  transition: background 0.2s ease;
}

.dl-arch__slice.is-focus {
  background: var(--dl-accent-strong);
}

.dl-arch__params {
  margin-top: 0.15rem;
}
</style>
