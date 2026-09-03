<script setup lang="ts">
/*
 * Classification, detection, segmentation — on one image.
 *
 * The 2025 Lecture 03 outline promised "identifying differences in
 * classification, detection and segmentation" and the deck never delivered a
 * slide on it: the distinction had to be inferred from a page of segmentation
 * results near the end. It is worth a widget because the difference is not
 * really about the picture, it is about the *shape of the output* — one number,
 * four numbers and a label, or one label per pixel — and that is what decides
 * what the last layer of the network can be.
 *
 * The image and its mask arrive through slots rather than props: Vite only
 * rewrites asset URLs it can see in a template, so an image passed as a prop
 * would 404 in the built deck.
 */
import { computed, ref } from 'vue'

type Task = 'classification' | 'detection' | 'segmentation'

const props = withDefaults(defineProps<{
  /** Bounding box of the object, in per cent of the frame. */
  bbox?: { x: number, y: number, w: number, h: number }
  label?: string
  /** Side length in pixels of the frame, used for the output-shape arithmetic. */
  pixels?: number
  classes?: number
}>(), {
  bbox: () => ({ x: 13.7, y: 26.1, w: 54.3, h: 73.1 }),
  label: 'polyp',
  pixels: 234,
  classes: 2,
})

const task = ref<Task>('classification')

const TASKS: Task[] = ['classification', 'detection', 'segmentation']

const shape = computed(() => {
  if (task.value === 'classification')
    return `${props.classes}`
  if (task.value === 'detection')
    return `4 + ${props.classes}`
  return `${props.pixels} \\times ${props.pixels}`
})

const numbers = computed(() => {
  if (task.value === 'classification')
    return props.classes
  if (task.value === 'detection')
    return 4 + props.classes
  return props.pixels * props.pixels
})

const EXPLAIN: Record<Task, string> = {
  classification: 'One score per class for the whole frame. "Is there a polyp?" — the answer is a single number, so a fully-connected head over the flattened feature maps is enough.',
  detection: 'A box and a class per object. The head has to emit coordinates, so the output is small but structured — and the count is not fixed in advance, which is what makes detection architectures complicated.',
  segmentation: 'A class for every pixel. The output is as large as the input, so the network cannot end in a fully-connected layer — it has to build the image back up. That is what the next slide is about.',
}
</script>

<template>
  <WidgetFrame max-width="36rem">
    <div class="dl-cvt">
      <div class="dl-cvt__frame">
        <slot />

        <!-- Classification: the whole frame carries one label. -->
        <div v-if="task === 'classification'" class="dl-cvt__whole">
          <span class="dl-cvt__chip">{{ props.label }}</span>
        </div>

        <!-- Detection: where it is, to the nearest rectangle. -->
        <div
          v-else-if="task === 'detection'"
          class="dl-cvt__box"
          :style="{
            left: `${props.bbox.x}%`,
            top: `${props.bbox.y}%`,
            width: `${props.bbox.w}%`,
            height: `${props.bbox.h}%`,
          }"
        >
          <span class="dl-cvt__chip is-tight">{{ props.label }}</span>
        </div>

        <!-- Segmentation: the mask itself, supplied as a slot image. -->
        <div v-else class="dl-cvt__mask">
          <slot name="mask" />
        </div>
      </div>

      <div class="dl-cvt__shape">
        <div class="dl-cvt__shapelabel">output shape</div>
        <div class="dl-math-sm"><Katex :expr="shape" /></div>
        <div class="dl-cvt__count">{{ numbers.toLocaleString('en-US') }} numbers</div>
      </div>
    </div>

    <template #controls>
      <button
        v-for="t in TASKS"
        :key="t"
        type="button"
        class="dl-cvt__tab"
        :class="{ 'is-active': task === t }"
        @click="task = t"
      >{{ t }}</button>
    </template>

    <template #readout>
      {{ EXPLAIN[task] }}
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-cvt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
}

.dl-cvt__frame {
  position: relative;
  width: 16rem;
  max-width: 48vw;
  aspect-ratio: 1;
  border: 1px solid var(--dl-border);
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.dl-cvt__frame :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dl-cvt__whole {
  position: absolute;
  inset: 0;
  border: 3px solid var(--dl-accent);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

.dl-cvt__box {
  position: absolute;
  border: 2px solid var(--dl-accent);
  box-shadow: 0 0 0 9999px rgb(0 0 0 / 22%);
}

.dl-cvt__chip {
  background: var(--dl-accent);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.12rem 0.4rem;
  border-radius: 0 0 4px 0;
}

.dl-cvt__chip.is-tight {
  position: absolute;
  top: -1.15rem;
  left: -2px;
  border-radius: 4px 4px 0 0;
}

.dl-cvt__mask {
  position: absolute;
  inset: 0;
}

.dl-cvt__mask :deep(img) {
  /* The overlay PNG is already teal-on-transparent, so it composites straight
     over the frame without a blend mode — which keeps it identical in the PDF
     export, where blend modes are unreliable. */
  object-fit: cover;
}

.dl-cvt__shape {
  text-align: center;
}

.dl-cvt__shapelabel {
  font-size: 0.75rem;
  color: var(--dl-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.3rem;
}

.dl-cvt__count {
  margin-top: 0.35rem;
  font-size: 0.82rem;
  color: var(--dl-body);
  font-variant-numeric: tabular-nums;
}

.dl-cvt__tab {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-cvt__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-cvt__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-cvt__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}
</style>
