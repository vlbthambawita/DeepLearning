<script setup lang="ts">
/*
 * Every PyTorch program you will write this semester, on one picture.
 *
 * The five pieces are usually taught as a list, which loses the one piece of
 * structure that matters: the loop is not a fifth peer sitting beside the
 * others, it is the thing that runs them, in order, once per batch. So the loop
 * is drawn as the box the other four live inside, with the arrow from the
 * optimiser back to the model closing the circuit.
 *
 * Lecture 04 opens by saying its training loop is "unchanged from last week".
 * This diagram is what that sentence refers to, so it is worth the room being
 * able to redraw it from memory.
 *
 * `mode="pillars"` is the other question — what PyTorch actually gives you that
 * NumPy did not — answered in three cards rather than a feature list.
 */
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  mode?: 'pieces' | 'pillars'
}>(), {
  mode: 'pieces',
})

interface Piece {
  key: string
  label: string
  code: string
  job: string
}

const PIECES: Piece[] = [
  {
    key: 'data',
    label: 'Data',
    code: 'train_loader = DataLoader(train_set, batch_size=64, shuffle=True)',
    job: 'Hands you one batch at a time: a tensor of images shaped (64, 1, 28, 28) and a tensor of 64 integer labels. Built once, iterated every epoch.',
  },
  {
    key: 'model',
    label: 'Model',
    code: 'logits = model(images)',
    job: 'An nn.Module. It holds the parameters and defines forward() — what to do with an input. Calling the model runs the forward pass and builds the graph.',
  },
  {
    key: 'loss',
    label: 'Loss',
    code: 'loss = loss_fn(logits, labels)',
    job: 'Turns a batch of predictions into one number. That single 0-D tensor is the thing backward() differentiates, which is why the loss has to be a scalar.',
  },
  {
    key: 'optim',
    label: 'Optimiser',
    code: 'optimiser.step()',
    job: 'Holds a reference to every parameter and knows how to change it given its .grad. SGD subtracts lr times the gradient; Adam does something cleverer.',
  },
  {
    key: 'loop',
    label: 'Loop',
    code: 'for images, labels in train_loader: ...',
    job: 'Runs the four in order — forward, loss, backward, step — once per batch, and clears the gradients before each backward. Four lines that never change.',
  },
]

const selected = ref('loop')
const piece = computed(() => PIECES.find(p => p.key === selected.value) ?? PIECES[4])

const inner = PIECES.slice(0, 4)

interface Pillar {
  title: string
  gives: string
  before: string
}

const PILLARS: Pillar[] = [
  {
    title: 'Tensors, on a GPU',
    gives: 'A NumPy array that can live in GPU memory. Same indexing, same broadcasting, same reshape — one extra method, .to(device).',
    before: 'Last week: NumPy arrays, CPU only. An epoch of MNIST took minutes.',
  },
  {
    title: 'Autograd',
    gives: 'Every operation is recorded, so one call to loss.backward() produces the gradient of the loss with respect to every parameter.',
    before: 'Last week: you derived ∂L/∂w on a slide, by hand, for one loss and one activation.',
  },
  {
    title: 'Layers, losses, data',
    gives: 'nn.Linear, nn.ReLU, nn.CrossEntropyLoss, torch.optim.Adam, DataLoader — the pieces everyone rewrites, written once and tested.',
    before: 'Last week: your own weight initialisation, your own mini-batch shuffling, your own one-hot encoding.',
  },
]
</script>

<template>
  <WidgetFrame v-if="props.mode === 'pieces'" max-width="42rem">
    <div class="dl-pipe">
      <div class="dl-pipe__head">
        <code>for images, labels in train_loader:</code>
        <span>once per batch</span>
      </div>

      <div
        class="dl-pipe__loop"
        :class="{ 'is-selected': selected === 'loop' }"
        tabindex="0"
        role="button"
        aria-label="the training loop"
        @click="selected = 'loop'"
        @keydown.enter.prevent="selected = 'loop'"
        @keydown.space.prevent="selected = 'loop'"
      >
        <div class="dl-pipe__row">
          <template v-for="(p, i) in inner" :key="p.key">
            <button
              type="button"
              class="dl-pipe__box"
              :class="{ 'is-selected': selected === p.key }"
              @click.stop="selected = p.key"
            >
              <strong>{{ p.label }}</strong>
              <code>{{ p.key === 'data' ? 'batch in' : p.key === 'model' ? 'forward' : p.key === 'loss' ? 'backward' : 'step' }}</code>
            </button>
            <span v-if="i < inner.length - 1" class="dl-pipe__arrow" aria-hidden="true">&rarr;</span>
          </template>
        </div>

        <div class="dl-pipe__return">
          <span aria-hidden="true">&larr;</span>
          parameters changed, so the next forward pass differs
        </div>
      </div>
    </div>

    <template #controls>
      <button
        v-for="p in PIECES"
        :key="p.key"
        type="button"
        class="dl-pipe__tab"
        :class="{ 'is-active': selected === p.key }"
        @click="selected = p.key"
      >{{ p.label }}</button>
    </template>

    <template #readout>
      <div class="dl-pipe__code"><code>{{ piece.code }}</code></div>
      <div class="dl-pipe__job">{{ piece.job }}</div>
    </template>
  </WidgetFrame>

  <div v-else class="dl-pillars">
    <div v-for="p in PILLARS" :key="p.title" class="dl-pillars__card">
      <h4>{{ p.title }}</h4>
      <p>{{ p.gives }}</p>
      <p class="is-before">{{ p.before }}</p>
    </div>
  </div>
</template>

<style scoped>
/*
 * Drawn in HTML rather than SVG. The five pieces are text first — four labels
 * and a line of code — and text in a scaled viewBox is text whose size is set
 * by however much room the aside rail happens to leave. In HTML it is set by
 * the deck's own font scale, which is the size the room can read.
 */
.dl-pipe {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.dl-pipe__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 0.2rem;
}

.dl-pipe__head code {
  font-size: 0.86rem;
  color: var(--dl-body);
}

.dl-pipe__head span {
  font-size: 0.7rem;
  color: var(--dl-muted);
}

.dl-pipe__loop {
  border: 1.6px dashed var(--dl-border);
  border-radius: 10px;
  padding: 0.9rem 0.8rem 0.7rem;
  cursor: pointer;
}

.dl-pipe__loop.is-selected {
  border-color: var(--dl-accent);
}

.dl-pipe__loop:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-pipe__row {
  display: flex;
  align-items: stretch;
  gap: 0.35rem;
}

.dl-pipe__box {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.7rem 0.3rem;
  border: 1.4px solid var(--dl-border);
  border-radius: 7px;
  background: var(--dl-surface);
  font: inherit;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dl-pipe__box strong {
  font-size: 1.05rem;
  color: var(--dl-heading);
}

.dl-pipe__box code {
  font-size: 0.72rem;
  color: var(--dl-muted);
}

.dl-pipe__box:hover {
  border-color: var(--dl-accent);
}

.dl-pipe__box.is-selected {
  background: var(--dl-accent-soft);
  border-color: var(--dl-accent);
  border-width: 2px;
}

.dl-pipe__box:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-pipe__arrow {
  flex: 0 0 auto;
  align-self: center;
  color: var(--dl-muted);
  font-size: 1.1rem;
}

/*
 * The step -> model edge that closes the circuit, as a dashed rule under the
 * three boxes it spans.
 */
.dl-pipe__return {
  margin: 0.5rem 0 0 25%;
  padding-top: 0.3rem;
  border-top: 1.2px dashed var(--dl-accent);
  font-size: 0.72rem;
  color: var(--dl-muted);
  text-align: center;
}

.dl-pipe__return span {
  color: var(--dl-accent);
  font-size: 0.95rem;
  margin-right: 0.3rem;
}

.dl-pipe__tab {
  padding: 0.24rem 0.66rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-pipe__tab:hover {
  border-color: var(--dl-accent);
  color: var(--dl-accent);
}

.dl-pipe__tab.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-pipe__tab:focus-visible {
  outline: 2px solid var(--dl-accent);
  outline-offset: 2px;
}

.dl-pipe__code {
  margin-bottom: 0.25rem;
}

.dl-pipe__code code {
  font-size: 0.8rem;
  background: var(--dl-code-bg);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  color: var(--dl-accent);
}

.dl-pipe__job {
  line-height: 1.35;
}

/* ---- pillars ------------------------------------------------------------- */

.dl-pillars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
}

.dl-pillars__card {
  border: 1px solid var(--dl-border);
  border-top: 3px solid var(--dl-accent);
  border-radius: 8px;
  padding: 0.8rem 0.9rem;
  background: var(--dl-surface);
}

.dl-pillars__card h4 {
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
  color: var(--dl-heading);
}

.dl-pillars__card p {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  line-height: 1.35;
  color: var(--dl-body);
}

.dl-pillars__card p.is-before {
  margin-bottom: 0;
  padding-top: 0.45rem;
  border-top: 1px dashed var(--dl-border);
  font-size: 0.85rem;
  color: var(--dl-muted);
}
</style>
