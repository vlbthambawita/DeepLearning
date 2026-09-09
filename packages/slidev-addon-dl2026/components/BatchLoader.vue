<script setup lang="ts">
/*
 * What a DataLoader actually hands the loop.
 *
 * Three things are invisible in the two lines of code that create one, and all
 * three cause questions in the lab: the last batch is usually a different size,
 * `shuffle=True` reshuffles every epoch rather than once, and the number of
 * loop iterations is a consequence of the batch size rather than something you
 * set. A twelve-sample dataset makes all three fit on a slide.
 *
 * The labels are the first twelve of the real MNIST training set, so the digits
 * on screen are the digits a student will see in their own notebook.
 */
import { computed, ref } from 'vue'
import { seededRandom } from '../composables/useRandom'

const LABELS = [5, 0, 4, 1, 9, 2, 1, 3, 1, 4, 3, 5]
const N = LABELS.length

const batchSize = ref(4)
const shuffle = ref(true)
const dropLast = ref(false)
const epoch = ref(1)

/** Fisher-Yates on a seeded generator: a different order per epoch, but the
 * same orders every time the deck is opened. */
const order = computed(() => {
  const idx = Array.from({ length: N }, (_, i) => i)
  if (!shuffle.value)
    return idx
  const rand = seededRandom(epoch.value * 7919 + 13)
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
})

const batches = computed(() => {
  const out: number[][] = []
  for (let i = 0; i < order.value.length; i += batchSize.value)
    out.push(order.value.slice(i, i + batchSize.value))
  if (dropLast.value && out.length && out[out.length - 1].length < batchSize.value)
    out.pop()
  return out
})

const shortLast = computed(() => {
  const last = batches.value[batches.value.length - 1]
  return last && last.length < batchSize.value
})

const dropped = computed(() => N - batches.value.reduce((sum, b) => sum + b.length, 0))

const note = computed(() => {
  if (shortLast.value)
    return `12 does not divide by ${batchSize.value}, so the last batch has only ${batches.value[batches.value.length - 1].length} samples. Never hardcode the batch size inside your model — read it off the tensor instead.`
  if (dropped.value > 0)
    return `drop_last=True threw away ${dropped.value} sample${dropped.value === 1 ? '' : 's'} so every batch is the same size. Fine for training, wrong for evaluation — you would be scoring on less than the whole test set.`
  if (!shuffle.value)
    return 'shuffle=False keeps the dataset order. If the file happens to be sorted by class, every batch is one digit and training will not work. Shuffle the training set, never the test set.'
  return `Press next epoch: the order changes again. shuffle=True reshuffles at the start of every epoch, so the model never sees the same batch composition twice.`
})
</script>

<template>
  <WidgetFrame max-width="40rem">
    <div class="dl-loader">
      <div class="dl-loader__row">
        <span class="dl-loader__side">train_set</span>
        <div class="dl-loader__strip">
          <span v-for="(l, i) in LABELS" :key="i" class="dl-loader__chip is-plain">
            <em>{{ l }}</em><small>{{ i }}</small>
          </span>
        </div>
      </div>

      <div class="dl-loader__row is-batches">
        <span class="dl-loader__side">train_loader</span>
        <div class="dl-loader__batches">
          <div v-for="(batch, bi) in batches" :key="bi" class="dl-loader__batch">
            <div class="dl-loader__batchLabel">iteration {{ bi }}</div>
            <div class="dl-loader__strip">
              <span v-for="i in batch" :key="i" class="dl-loader__chip">
                <em>{{ LABELS[i] }}</em><small>{{ i }}</small>
              </span>
            </div>
          </div>
          <div v-if="dropped > 0" class="dl-loader__batch is-dropped">
            <div class="dl-loader__batchLabel">dropped</div>
            <div class="dl-loader__strip">
              <span v-for="i in order.slice(order.length - dropped)" :key="i" class="dl-loader__chip is-ghost">
                <em>{{ LABELS[i] }}</em><small>{{ i }}</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #controls>
      <Slider v-model="batchSize" label="batch_size" :min="1" :max="6" :step="1" :precision="0" />
      <StepButton
        :label="`shuffle=${shuffle ? 'True' : 'False'}`"
        :variant="shuffle ? 'primary' : 'ghost'"
        @click="shuffle = !shuffle"
      />
      <StepButton
        :label="`drop_last=${dropLast ? 'True' : 'False'}`"
        :variant="dropLast ? 'primary' : 'ghost'"
        @click="dropLast = !dropLast"
      />
      <StepButton label="next epoch" variant="ghost" glyph="↻" :disabled="!shuffle" @click="epoch += 1" />
    </template>

    <template #readout>
      <div class="dl-loader__facts">
        <span>epoch <strong>{{ epoch }}</strong></span>
        <span><code>len(train_loader)</code> <strong>{{ batches.length }}</strong></span>
        <span>a full iteration yields <code>images</code> <strong>({{ batchSize }}, 1, 28, 28)</strong> and <code>labels</code> <strong>({{ batchSize }},)</strong></span>
      </div>
      <div class="dl-loader__note">{{ note }}</div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-loader {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.dl-loader__row {
  display: grid;
  grid-template-columns: 5.6rem 1fr;
  align-items: start;
  gap: 0.6rem;
}

.dl-loader__side {
  font-family: var(--slidev-code-font-family, monospace);
  font-size: 0.76rem;
  color: var(--dl-muted);
  padding-top: 0.35rem;
}

.dl-loader__strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
}

.dl-loader__chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.12rem;
  min-width: 1.9rem;
  justify-content: center;
  padding: 0.16rem 0.2rem;
  border: 1px solid var(--dl-accent);
  border-radius: 4px;
  background: var(--dl-accent-soft);
}

.dl-loader__chip em {
  font-style: normal;
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--dl-heading);
  font-variant-numeric: tabular-nums;
}

.dl-loader__chip small {
  font-size: 0.55rem;
  color: var(--dl-muted);
}

.dl-loader__chip.is-plain {
  border-color: var(--dl-border);
  background: var(--dl-surface);
}

.dl-loader__chip.is-ghost {
  border-style: dashed;
  border-color: var(--dl-border);
  background: transparent;
}

.dl-loader__chip.is-ghost em {
  color: var(--dl-muted);
}

.dl-loader__batches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.7rem;
}

.dl-loader__batch {
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  padding: 0.22rem 0.35rem 0.3rem;
}

.dl-loader__batch.is-dropped {
  border-style: dashed;
}

.dl-loader__batchLabel {
  font-size: 0.6rem;
  color: var(--dl-muted);
  margin-bottom: 0.15rem;
  font-family: var(--slidev-code-font-family, monospace);
}

.dl-loader__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1.2rem;
  margin-bottom: 0.2rem;
}

.dl-loader__facts strong {
  color: var(--dl-accent);
}

.dl-loader__facts code,
.dl-loader__note code {
  font-size: 0.74rem;
  background: var(--dl-code-bg);
  padding: 0.05rem 0.22rem;
  border-radius: 3px;
}

.dl-loader__note {
  line-height: 1.35;
}
</style>
