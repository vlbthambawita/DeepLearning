<script setup lang="ts">
/*
 * Lecture 01 slide 15, replacing the 2019–2023 "evolutionary tree" screenshot.
 *
 * Two things the old figure could not do: it stopped in 2023, and it said
 * nothing about architecture — which is the part that matters once week 7
 * introduces the transformer. Here the lanes *are* the architecture, so the
 * shape of the field is the lesson: nearly everything recent is decoder-only,
 * encoder-only survives for retrieval and classification, and encoder-decoder
 * is a deliberate minority.
 *
 * Every plotted model is open-weights with a published paper, and every arXiv
 * id below was checked against arxiv.org and returns the paper named here.
 * Closed frontier models are named in the slide's aside instead: they have no
 * paper to link, and putting an unverifiable release date on a timeline would
 * be worse than leaving them off.
 *
 * Built from HTML rather than SVG so labels cannot drift away from their marks.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface Model {
  name: string
  org: string
  /** YYYY-MM */
  date: string
  lane: string
  note: string
  href: string
  source: string
}

const LANES = [
  { key: 'encoder', label: 'Encoder-only', sub: 'bidirectional; embeddings, retrieval, classification' },
  { key: 'encdec', label: 'Encoder–decoder', sub: 'input encoded once, output generated' },
  { key: 'decoder', label: 'Decoder-only', sub: 'one stack, next-token prediction' },
  { key: 'vlm', label: 'Vision + decoder', sub: 'image encoder feeding a decoder-only LLM' },
]

// Window: roughly the last three years.
const T0 = 2023 + 6 / 12
const T1 = 2026 + 8 / 12

const MODELS: Model[] = [
  // --- decoder-only, text ---
  { name: 'Llama 2', org: 'Meta', date: '2023-07', lane: 'decoder', note: 'The release that made strong open weights normal.', href: 'https://arxiv.org/abs/2307.09288', source: 'Llama 2: Open Foundation and Fine-Tuned Chat Models' },
  { name: 'Mistral 7B', org: 'Mistral AI', date: '2023-10', lane: 'decoder', note: 'Sliding-window attention; small models taken seriously.', href: 'https://arxiv.org/abs/2310.06825', source: 'Mistral 7B' },
  { name: 'Llama 3', org: 'Meta', date: '2024-07', lane: 'decoder', note: 'A 405B dense model, trained on ~15T tokens.', href: 'https://arxiv.org/abs/2407.21783', source: 'The Llama 3 Herd of Models' },
  { name: 'Qwen2.5', org: 'Alibaba', date: '2024-12', lane: 'decoder', note: 'Broad open family, strong multilingual coverage.', href: 'https://arxiv.org/abs/2412.15115', source: 'Qwen2.5 Technical Report' },
  { name: 'DeepSeek-V3', org: 'DeepSeek', date: '2024-12', lane: 'decoder', note: 'Mixture-of-experts: 671B parameters, ~37B active per token.', href: 'https://arxiv.org/abs/2412.19437', source: 'DeepSeek-V3 Technical Report' },
  { name: 'DeepSeek-R1', org: 'DeepSeek', date: '2025-01', lane: 'decoder', note: 'Reasoning trained largely by reinforcement learning — week 11–12 material.', href: 'https://arxiv.org/abs/2501.12948', source: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL' },
  { name: 'Gemma 3', org: 'Google', date: '2025-03', lane: 'decoder', note: 'Small open models with long context and image input.', href: 'https://arxiv.org/abs/2503.19786', source: 'Gemma 3 Technical Report' },
  { name: 'Qwen3', org: 'Alibaba', date: '2025-05', lane: 'decoder', note: 'Dense and mixture-of-experts variants in one family.', href: 'https://arxiv.org/abs/2505.09388', source: 'Qwen3 Technical Report' },

  // --- vision encoder + decoder-only ---
  { name: 'Qwen2-VL', org: 'Alibaba', date: '2024-09', lane: 'vlm', note: 'Native dynamic resolution — images are not squashed to a fixed size.', href: 'https://arxiv.org/abs/2409.12191', source: 'Qwen2-VL: Enhancing Vision-Language Model’s Perception of the World at Any Resolution' },
  { name: 'Molmo', org: 'Allen AI', date: '2024-09', lane: 'vlm', note: 'Open weights *and* open data — you can see what it was trained on.', href: 'https://arxiv.org/abs/2409.17146', source: 'Molmo and PixMo: Open Weights and Open Data for State-of-the-Art VLMs' },
  { name: 'Pixtral 12B', org: 'Mistral AI', date: '2024-10', lane: 'vlm', note: 'Vision encoder trained from scratch alongside the language model.', href: 'https://arxiv.org/abs/2410.07073', source: 'Pixtral 12B' },
  { name: 'InternVL3', org: 'Shanghai AI Lab', date: '2025-04', lane: 'vlm', note: 'Multimodal pretraining rather than bolting vision onto a finished LLM.', href: 'https://arxiv.org/abs/2504.10479', source: 'InternVL3: Exploring Advanced Training and Test-Time Recipes' },

  // --- encoder-only ---
  { name: 'ModernBERT', org: 'Answer.AI · LightOn', date: '2024-12', lane: 'encoder', note: 'BERT rebuilt with rotary embeddings and flash attention. Encoders did not die — they went to work in retrieval.', href: 'https://arxiv.org/abs/2412.13663', source: 'Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder' },

  // --- encoder-decoder ---
  { name: 'T5Gemma', org: 'Google', date: '2025-04', lane: 'encdec', note: 'Made by converting a finished decoder-only Gemma into an encoder–decoder.', href: 'https://arxiv.org/abs/2504.06225', source: 'Encoder-Decoder Gemma: Improving the Quality-Efficiency Trade-Off via Adaptation' },
  { name: 'T5Gemma 2', org: 'Google', date: '2025-12', lane: 'encdec', note: 'Adds image input and 128K context to the encoder–decoder line.', href: 'https://arxiv.org/abs/2512.14856', source: 'T5Gemma 2: Seeing, Reading, and Understanding Longer' },
]

function toYear(date: string): number {
  const [y, m] = date.split('-').map(Number)
  return y + (m - 1) / 12
}

/** Horizontal position as a percentage of the window. */
function xPct(date: string): number {
  return ((toYear(date) - T0) / (T1 - T0)) * 100
}

const YEARS = [2024, 2025, 2026]

const laneModels = (key: string) =>
  MODELS.filter(m => m.lane === key).sort((a, b) => toYear(a.date) - toYear(b.date))

const selected = ref<Model | null>(null)
const active = computed(() => selected.value ?? null)

/*
 * Row assignment is measured, not guessed. Releases cluster — four of the
 * decoder-only models land between Dec 2024 and May 2025 — so an odd/even
 * stagger still overlaps. After layout, walk each lane in date order and drop
 * every chip into the first row where it clears the previous one.
 */
const plot = ref<HTMLElement | null>(null)
const laneRows = ref<Record<string, number>>({})
const rowPitch = ref(20)

function layoutChips() {
  const root = plot.value
  if (!root)
    return
  const sample = root.querySelector<HTMLElement>('.dl-models__chip')
  if (sample?.offsetHeight)
    rowPitch.value = sample.offsetHeight + 3

  const rows: Record<string, number> = {}
  for (const track of Array.from(root.querySelectorAll<HTMLElement>('.dl-models__track'))) {
    const width = track.clientWidth
    if (!width)
      continue
    const chips = Array.from(track.querySelectorAll<HTMLElement>('.dl-models__chip'))
      .map(el => ({ el, centre: (Number.parseFloat(el.style.left) / 100) * width }))
      .sort((a, b) => a.centre - b.centre)

    const rightEdge: number[] = []
    for (const { el, centre } of chips) {
      const half = el.offsetWidth / 2
      let row = 0
      while (row < rightEdge.length && centre - half < rightEdge[row] + 6)
        row++
      rightEdge[row] = centre + half
      el.style.top = `${row * rowPitch.value}px`
    }
    rows[track.dataset.lane ?? ''] = Math.max(rightEdge.length, 1)
  }
  laneRows.value = rows
}

let observer: ResizeObserver | null = null
onMounted(async () => {
  await nextTick()
  layoutChips()
  // Fonts land after first paint and change chip widths.
  document.fonts?.ready.then(() => layoutChips())
  observer = new ResizeObserver(() => layoutChips())
  if (plot.value)
    observer.observe(plot.value)
})
onUnmounted(() => observer?.disconnect())
watch(selected, () => nextTick(layoutChips))

function label(date: string) {
  const [y, m] = date.split('-')
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}`
}
</script>

<template>
  <div class="dl-models">
    <div ref="plot" class="dl-models__plot">
      <div v-for="lane in LANES" :key="lane.key" class="dl-models__lane">
        <div class="dl-models__lanelabel">
          <div class="dl-models__lanename">{{ lane.label }}</div>
          <div class="dl-models__lanesub">{{ lane.sub }}</div>
        </div>
        <div
          class="dl-models__track"
          :data-lane="lane.key"
          :style="{ height: `${(laneRows[lane.key] ?? 1) * rowPitch + 4}px` }"
        >
          <button
            v-for="m in laneModels(lane.key)"
            :key="m.name"
            type="button"
            class="dl-models__chip"
            :class="{ 'is-active': active?.name === m.name }"
            :style="{ left: `${xPct(m.date)}%` }"
            @click="selected = m"
            @mouseenter="selected = m"
          >{{ m.name }}</button>
        </div>
      </div>

      <div class="dl-models__axis">
        <span v-for="y in YEARS" :key="y" :style="{ left: `${xPct(`${y}-01`)}%` }">{{ y }}</span>
      </div>
    </div>

    <div class="dl-models__detail">
      <template v-if="active">
        <div class="dl-models__head">
          <strong>{{ active.name }}</strong>
          <span class="dl-models__org">{{ active.org }} · {{ label(active.date) }}</span>
        </div>
        <div class="dl-models__arch">
          {{ LANES.find(l => l.key === active.lane)?.label }}
          <span class="dl-models__archsub">— {{ LANES.find(l => l.key === active.lane)?.sub }}</span>
        </div>
        <p class="dl-models__note">{{ active.note }}</p>
        <a :href="active.href" target="_blank" rel="noopener" class="dl-models__link">{{ active.source }}</a>
      </template>
      <template v-else>
        <p class="dl-models__hint">
          Hover or click any model for its architecture and paper. Every one plotted here is
          open-weights with a published paper.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dl-models {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dl-models__plot {
  flex: 1 1 auto;
  min-height: 0;
}

.dl-models__lane {
  display: grid;
  grid-template-columns: 9.5rem 1fr;
  gap: 0.8rem;
  align-items: center;
  border-top: 1px solid var(--dl-border);
  padding: 0.15rem 0;
}

.dl-models__lanename {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--dl-heading);
}

.dl-models__lanesub {
  font-size: 0.62rem;
  color: var(--dl-muted);
  line-height: 1.25;
}

.dl-models__track {
  position: relative;
  min-height: 1.6rem;
  transition: height 0.15s ease;
}

.dl-models__chip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  padding: 0.05rem 0.3rem;
  border: 1px solid var(--dl-border);
  border-radius: 4px;
  background: var(--dl-surface);
  font: inherit;
  font-size: 0.62rem;
  line-height: 1.35;
  white-space: nowrap;
  color: var(--dl-body);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.dl-models__chip:hover {
  border-color: var(--dl-accent);
}

.dl-models__chip.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent-strong);
  color: #fff;
  font-weight: 600;
}

.dl-models__axis {
  position: relative;
  height: 1rem;
  border-top: 1px solid var(--dl-border);
  margin-left: 10.3rem;
}

.dl-models__axis span {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: var(--dl-muted);
  font-variant-numeric: tabular-nums;
}

.dl-models__detail {
  flex: 0 0 auto;
  min-height: 5.4rem;
  border-left: 3px solid var(--dl-accent);
  background: var(--dl-accent-soft);
  border-radius: 0 6px 6px 0;
  padding: 0.5rem 0.85rem;
}

.dl-models__head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.dl-models__head strong {
  font-size: 1.05rem;
  color: var(--dl-heading);
}

.dl-models__org {
  font-size: 0.78rem;
  color: var(--dl-muted);
}

.dl-models__arch {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--dl-accent-strong);
  margin-top: 0.1rem;
}

.dl-models__archsub {
  font-weight: 400;
  color: var(--dl-muted);
}

.dl-models__note {
  margin: 0.2rem 0 0.25rem;
  font-size: 0.85rem;
  color: var(--dl-body);
}

.dl-models__link {
  font-size: 0.75rem;
  color: var(--dl-accent-strong);
}

.dl-models__hint {
  margin: 0;
  font-size: 0.88rem;
  color: var(--dl-body);
}
</style>
