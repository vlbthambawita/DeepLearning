<script setup lang="ts">
/*
 * Lecture 02 slides 14 and 15.
 *
 * The two algorithms differ in exactly one place — which signal the error is
 * measured from — and the 2025 deck put both schematics on screen and left the
 * room to spot it. Here the forward chain is drawn once and a marker points at
 * the stage the error taps, so switching tabs moves one thing.
 *
 * Built from HTML boxes rather than SVG: an earlier SVG version rendered its
 * <text> labels at coordinates that did not agree with the shapes, and laying
 * the stages out with flexbox removes that whole class of problem — including
 * in the PDF export.
 */
import { computed, ref } from 'vue'

const mode = ref<'perceptron' | 'adaline'>('perceptron')
const isAdaline = computed(() => mode.value === 'adaline')

/** The forward chain. `tap` marks the stage the error is measured from. */
const stages = computed(() => [
  { key: 'in', label: 'x', sub: 'inputs', kind: 'plain' },
  { key: 'net', label: 'Σ', sub: 'net input z', kind: 'op' },
  {
    key: 'act',
    label: isAdaline.value ? 'z' : 'φ',
    sub: isAdaline.value ? 'linear activation' : 'threshold',
    kind: 'op',
    tap: isAdaline.value,
  },
  {
    key: 'thr',
    label: 'φ',
    sub: 'threshold',
    kind: isAdaline.value ? 'op' : 'ghost',
  },
  { key: 'out', label: 'ŷ', sub: 'predicted label', kind: 'plain', tap: !isAdaline.value },
])
</script>

<template>
  <WidgetFrame max-width="46rem">
    <div class="dl-pva">
      <div class="dl-pva__feedback">
        <span class="dl-pva__err">error = y − <em>(tapped signal)</em></span>
        <span class="dl-pva__update">→ update w, b</span>
      </div>

      <div class="dl-pva__chain">
        <template v-for="(s, i) in stages" :key="s.key">
          <div v-if="i" class="dl-pva__arrow" aria-hidden="true">→</div>
          <div class="dl-pva__stage" :class="[`is-${s.kind}`, { 'is-tap': s.tap }]">
            <div class="dl-pva__node">{{ s.label }}</div>
            <div class="dl-pva__sub">{{ s.sub }}</div>
            <div v-if="s.tap" class="dl-pva__tapmark">error measured here</div>
          </div>
        </template>
      </div>
    </div>

    <template #controls>
      <div class="dl-pva__tabs">
        <button type="button" :class="{ 'is-active': !isAdaline }" @click="mode = 'perceptron'">Perceptron</button>
        <button type="button" :class="{ 'is-active': isAdaline }" @click="mode = 'adaline'">Adaline</button>
      </div>
    </template>

    <template #readout>
      <p v-if="!isAdaline">
        The error compares the true label with the <strong>thresholded prediction</strong>.
        That step function has zero derivative everywhere it exists, so there is no
        gradient to descend.
      </p>
      <p v-else>
        The error compares the true label with the <strong>continuous linear
        activation</strong>, before thresholding. Now the loss is differentiable and
        convex, so gradient descent applies. The threshold survives only to turn the
        output into a class label.
      </p>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-pva {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
  padding: 0 0.5rem;
}

.dl-pva__feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--dl-danger);
  border-radius: 6px;
  font-size: 0.88rem;
  color: var(--dl-danger);
  align-self: center;
}

.dl-pva__err em {
  color: var(--dl-body);
  font-style: italic;
}

.dl-pva__update {
  color: var(--dl-muted);
}

.dl-pva__chain {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0.35rem;
}

.dl-pva__arrow {
  color: var(--dl-muted);
  font-size: 1.2rem;
  line-height: 3.2rem;
  flex: 0 0 auto;
}

.dl-pva__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 5.2rem;
}

.dl-pva__node {
  width: 3.2rem;
  height: 3.2rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1.5px solid var(--dl-muted);
  background: var(--dl-surface);
  font-size: 1.3rem;
  color: var(--dl-heading);
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.is-op .dl-pva__node {
  background: var(--dl-accent-soft);
  border-color: var(--dl-accent);
}

.is-ghost .dl-pva__node {
  opacity: 0.35;
}

.is-tap .dl-pva__node {
  border-color: var(--dl-danger);
  border-width: 2.5px;
}

.dl-pva__sub {
  font-size: 0.72rem;
  color: var(--dl-muted);
  text-align: center;
  max-width: 6.5rem;
}

.is-ghost .dl-pva__sub {
  opacity: 0.35;
}

.dl-pva__tapmark {
  position: absolute;
  top: 100%;
  margin-top: 0.5rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--dl-danger);
  white-space: nowrap;
}

.dl-pva__tabs {
  display: flex;
  gap: 0.4rem;
}

.dl-pva__tabs button {
  padding: 0.3rem 0.9rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.88rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-pva__tabs button.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

p {
  margin: 0;
  max-width: 74ch;
  line-height: 1.5;
}
</style>
