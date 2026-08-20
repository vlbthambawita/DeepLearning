<script setup lang="ts">
/*
 * Lecture 01 slide 29 — Frameworks.
 *
 * The 2025 list (PyTorch, TensorFlow, DGL, PaddlePaddle, MXNet, MATLAB) was one
 * flat row of tensor libraries, two of which are effectively retired. The thing
 * students get wrong is not which library to pick but which *layer* they are
 * working at, so the board is grouped by layer: write the maths, run a language
 * model, wire a model to tools.
 *
 * Starred entries are the ones worth knowing by name. Checked August 2026.
 */
export interface FrameworkEntry {
  name: string
  note: string
  href: string
  /** Worth knowing by name — gets the accent treatment. */
  popular?: boolean
}

const groups: { title: string; layer: string; entries: FrameworkEntry[] }[] = [
  {
    title: 'Deep learning',
    layer: 'Write the maths',
    entries: [
      {
        name: 'PyTorch',
        note: 'What we use all semester, and what over 80% of NeurIPS / ICML / ICLR papers use.',
        href: 'https://pytorch.org/',
        popular: true,
      },
      {
        name: 'JAX + Flax',
        note: 'Functional, compiled to XLA. The research choice for very large scale.',
        href: 'https://docs.jax.dev/',
        popular: true,
      },
      {
        name: 'TensorFlow + Keras 3',
        note: 'Still the backbone of a lot of production ML. Keras 3 runs on any of the three.',
        href: 'https://keras.io/',
      },
      {
        name: 'PyTorch Lightning',
        note: 'PyTorch with the training loop, checkpointing and multi-GPU boilerplate removed.',
        href: 'https://lightning.ai/pytorch-lightning',
      },
    ],
  },
  {
    title: 'LLM',
    layer: 'Run and adapt one',
    entries: [
      {
        name: 'Transformers',
        note: 'Hugging Face: the library and the hub. Load a pretrained model in three lines.',
        href: 'https://huggingface.co/docs/transformers',
        popular: true,
      },
      {
        name: 'vLLM',
        note: 'Serving at throughput — continuous batching, PagedAttention KV cache.',
        href: 'https://docs.vllm.ai/',
        popular: true,
      },
      {
        name: 'Ollama',
        note: 'One command to run an open-weight model on your own machine.',
        href: 'https://ollama.com/',
      },
      {
        name: 'Unsloth',
        note: 'LoRA / QLoRA fine-tuning that fits on the GPU you actually have.',
        href: 'https://unsloth.ai/',
      },
    ],
  },
  {
    title: 'Agentic AI',
    layer: 'Let a model use tools',
    entries: [
      {
        name: 'LangChain / LangGraph',
        note: 'The most widely adopted stack. LangGraph is the stateful, multi-step half.',
        href: 'https://www.langchain.com/',
        popular: true,
      },
      {
        name: 'MCP',
        note: 'Model Context Protocol — the open standard for plugging tools and data into a model.',
        href: 'https://modelcontextprotocol.io/',
        popular: true,
      },
      {
        name: 'CrewAI',
        note: 'Agents with roles that hand work to each other.',
        href: 'https://www.crewai.com/',
      },
      {
        name: 'AutoGen',
        note: "Microsoft Research's framework for conversing multi-agent systems.",
        href: 'https://microsoft.github.io/autogen/',
      },
    ],
  },
]
</script>

<template>
  <div class="dl-fwboard">
    <section v-for="group in groups" :key="group.title" class="dl-fwboard__group">
      <header class="dl-fwboard__head">
        <h3>{{ group.title }}</h3>
        <span>{{ group.layer }}</span>
      </header>

      <a
        v-for="entry in group.entries"
        :key="entry.name"
        class="dl-fw"
        :class="{ 'is-popular': entry.popular }"
        :href="entry.href"
        target="_blank"
        rel="noopener"
      >
        <div class="dl-fw__name">
          <span v-if="entry.popular" class="dl-fw__star" aria-hidden="true">★</span>{{ entry.name }}
        </div>
        <div class="dl-fw__note">{{ entry.note }}</div>
      </a>
    </section>
  </div>
</template>

<style scoped>
.dl-fwboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
}

.dl-fwboard__group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.dl-fwboard__head {
  border-bottom: 1px solid var(--dl-border);
  padding-bottom: 0.2rem;
}

.dl-fwboard__head h3 {
  margin: 0;
  font-size: 1rem;
}

.dl-fwboard__head span {
  display: block;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-fw {
  display: block;
  border-left: 3px solid var(--dl-border);
  padding: 0.25rem 0 0.25rem 0.55rem;
  text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.dl-fw:hover {
  transform: translateX(2px);
  border-left-color: var(--dl-accent);
}

.dl-fw.is-popular {
  border-left-color: var(--dl-accent);
}

.dl-fw__name {
  color: var(--dl-heading);
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.2;
}

.dl-fw__star {
  color: var(--dl-accent);
  font-size: 0.72rem;
  margin-right: 0.25rem;
}

.dl-fw__note {
  color: var(--dl-body);
  font-size: 0.7rem;
  line-height: 1.35;
  margin-top: 0.05rem;
}
</style>
