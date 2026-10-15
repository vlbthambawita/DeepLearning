<script setup lang="ts">
/*
 * The decoder writes one word per step: "je suis étudiant" → "i am a student".
 *
 * Each step shows the output layer's probability over the post's six-word
 * vocabulary, picks the most likely word (greedy decoding), and appends it.
 * The right word for this step is ringed, and its −log p is the step's loss,
 * so the same widget serves the decoding slide and the training slide.
 *
 * `mode="untrained"` gives every word 1/6: the loss is 1.79 per step, and the
 * greedy pick is meaningless (ties go to the first word). Pass
 * `:step="$clicks"` with `clicks: 5` so the PDF export shows each step.
 */
import { computed, ref, watch } from 'vue'
import { num } from '../composables/useConvolution'
import { SOURCE, TARGET, TRAINED, UNTRAINED, VOCAB6, positionLoss } from '../composables/useIllustrated'

const props = withDefaults(defineProps<{
  mode?: 'trained' | 'untrained'
  step?: number
  switchable?: boolean
  /** Show the loss of each step and the running total. */
  loss?: boolean
}>(), {
  mode: 'trained',
  step: 0,
  switchable: true,
  loss: false,
})

const STEPS = TARGET.length
const which = ref(props.mode)
const manual = ref<number | null>(null)
const done = computed(() => Math.min(STEPS, Math.max(0, manual.value ?? props.step)))

watch(() => props.step, () => { manual.value = null })

const table = computed(() => (which.value === 'trained' ? TRAINED : UNTRAINED))

/** The distribution on screen: the step being taken, or the last one when finished. */
const shown = computed(() => Math.min(done.value, STEPS - 1))
const dist = computed(() => table.value[shown.value])
const pick = (d: number[]) => d.indexOf(Math.max(...d))

const written = computed(() => table.value.slice(0, done.value).map(d => VOCAB6[pick(d)]))
const losses = computed(() => table.value.slice(0, done.value).map((d, t) => positionLoss(d, TARGET[t])))
const total = computed(() => losses.value.reduce((a, b) => a + b, 0))

function next() {
  manual.value = done.value >= STEPS ? 0 : done.value + 1
}
</script>

<template>
  <WidgetFrame max-width="44rem">
    <div class="dl-dec">
      <div class="dl-dec__row">
        <span class="dl-dec__label">input</span>
        <span v-for="w in SOURCE" :key="w" class="dl-dec__tok is-src">{{ w }}</span>
        <span class="dl-dec__label ml-3">output so far</span>
        <span class="dl-dec__tok is-start">⟨start⟩</span>
        <span v-for="(w, t) in written" :key="t" class="dl-dec__tok" :class="{ 'is-wrong': w !== VOCAB6[TARGET[t]] }">{{ w }}</span>
      </div>

      <div class="dl-dec__chart">
        <div class="dl-dec__title">
          output position {{ shown + 1 }} — probability of each word
        </div>
        <div v-for="(p, i) in dist" :key="i" class="dl-dec__bar-row">
          <span class="dl-dec__word" :class="{ 'is-target': i === TARGET[shown] }">{{ VOCAB6[i] }}</span>
          <span class="dl-dec__track">
            <span class="dl-dec__fill" :class="{ 'is-pick': i === pick(dist) }" :style="{ width: `${p * 100}%` }" />
          </span>
          <span class="dl-dec__p">{{ p.toFixed(2) }}</span>
        </div>
      </div>

      <div v-if="props.loss" class="dl-dec__loss">
        loss per position:
        <span v-for="(l, t) in losses" :key="t" class="dl-dec__l">{{ num(l) }}</span>
        <span v-if="losses.length" class="dl-dec__total">sum = {{ num(total) }}</span>
      </div>
    </div>

    <template #controls>
      <StepButton :label="done >= STEPS ? 'Start over' : 'Write the next word'" glyph="▸" @click="next" />
      <StepButton
        v-if="props.switchable"
        :label="which === 'trained' ? 'Show an untrained model' : 'Show a trained model'"
        variant="ghost" glyph="⇄" @click="which = which === 'trained' ? 'untrained' : 'trained'"
      />
    </template>

    <template #readout>
      <template v-if="done === 0">
        The encoder has read <em>je suis étudiant</em> once. The decoder starts from ⟨start⟩ and
        writes one word per step. The ringed word is the right answer.
      </template>
      <template v-else-if="done < STEPS">
        Step {{ done }}: the highest bar wins, and <strong>{{ written[done - 1] }}</strong> is
        appended. It is the decoder’s input at the next step.
      </template>
      <template v-else-if="which === 'untrained'">
        Every bar is 1/6, so every pick is a tie and <strong>{{ written.join(' ') }}</strong> means
        nothing. Training has to move the bars.
      </template>
      <template v-else>
        ⟨eos⟩ means “end of sentence”, so decoding stops: <strong>{{ written.join(' ') }}</strong>.
      </template>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-dec {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 36rem;
}

.dl-dec__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
}

.dl-dec__label {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-dec__tok {
  padding: 0.08rem 0.5rem;
  border: 1px solid var(--dl-accent);
  border-radius: 4px;
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-size: 0.86rem;
}

.dl-dec__tok.is-src {
  border-color: var(--dl-border);
  background: var(--dl-surface);
}

.dl-dec__tok.is-start {
  border-style: dashed;
  background: transparent;
  color: var(--dl-muted);
}

.dl-dec__tok.is-wrong {
  border-color: var(--dl-danger);
}

.dl-dec__chart {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dl-dec__title {
  font-size: 0.78rem;
  color: var(--dl-muted);
}

.dl-dec__bar-row {
  display: grid;
  grid-template-columns: 5rem 1fr 2.6rem;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.86rem;
}

.dl-dec__word {
  text-align: right;
  color: var(--dl-body);
  padding: 0 0.3rem;
  border-radius: 999px;
}

.dl-dec__word.is-target {
  outline: 2px solid var(--dl-accent);
  color: var(--dl-heading);
  font-weight: 700;
}

.dl-dec__track {
  height: 0.75rem;
  border-radius: 3px;
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  overflow: hidden;
}

.dl-dec__fill {
  display: block;
  height: 100%;
  background: var(--dl-muted);
  transition: width 0.25s ease;
}

.dl-dec__fill.is-pick {
  background: var(--dl-accent);
}

.dl-dec__p {
  font-variant-numeric: tabular-nums;
  color: var(--dl-heading);
}

.dl-dec__loss {
  font-size: 0.82rem;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-dec__l {
  margin-left: 0.5rem;
  color: var(--dl-heading);
}

.dl-dec__total {
  margin-left: 0.8rem;
  font-weight: 700;
  color: var(--dl-accent-strong);
}
</style>
