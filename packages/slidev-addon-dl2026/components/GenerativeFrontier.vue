<script setup lang="ts">
/*
 * Lecture 01 slide 14 — where text-to-image and text-to-video actually stand.
 *
 * The 2025 deck showed two DALL-E samples and a Google Imagen citation, both of
 * which have been superseded twice over. Tiles instead of screenshots, so the
 * slide can be re-checked in one pass each year and every claim keeps a link.
 *
 * Two teaching points are built into the data rather than left to the notes:
 * Google is the only one of the three vendors shipping in both rows, and
 * OpenAI's video line is a live example of a state-of-the-art model whose
 * product was retired anyway.
 *
 * Checked against vendor announcements, August 2026.
 */
export interface FrontierEntry {
  vendor: 'OpenAI' | 'Google' | 'Anthropic'
  name: string
  note: string
  href?: string
  /** Shipping, or a model whose product line has been withdrawn. */
  state?: 'current' | 'retired' | 'none'
}

const rows: { title: string; hint: string; entries: FrontierEntry[] }[] = [
  {
    title: 'Text → image',
    hint: 'Sentence in, picture out',
    entries: [
      {
        vendor: 'OpenAI',
        name: 'GPT Image 2',
        note: 'Reasons about the prompt before drawing. 2K output, reliable multilingual text.',
        href: 'https://openai.com/index/introducing-chatgpt-images-2-0/',
      },
      {
        vendor: 'Google',
        name: 'Gemini 3 Pro Image',
        note: '"Nano Banana Pro" — up to 4K, multi-reference editing across rounds.',
        href: 'https://deepmind.google/models/gemini-image/',
      },
      {
        vendor: 'Google',
        name: 'Gemini 3.1 Flash Image',
        note: '"Nano Banana 2" — close to Pro quality at Flash speed and cost.',
        href: 'https://ai.google.dev/gemini-api/docs/image-generation',
      },
      {
        vendor: 'Anthropic',
        name: 'No image model',
        note: 'Claude reads images. It does not draw them — Anthropic ships no generator.',
        state: 'none',
      },
    ],
  },
  {
    title: 'Text → video',
    hint: 'Same idea, one more dimension',
    entries: [
      {
        vendor: 'Google',
        name: 'Veo 3.1',
        note: 'Native audio, reference images for character consistency, 4K upscale, scene extension.',
        href: 'https://deepmind.google/models/veo/',
      },
      {
        vendor: 'Google',
        name: 'Veo 3.1 Lite',
        note: 'The same family at a fraction of the cost, for high-volume generation.',
        href: 'https://blog.google/innovation-and-ai/technology/ai/veo-3-1-lite/',
      },
      {
        vendor: 'OpenAI',
        name: 'Sora 2',
        note: 'State of the art, and retired anyway: app closed April 2026, API closing September 2026.',
        href: 'https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation',
        state: 'retired',
      },
      {
        vendor: 'Anthropic',
        name: 'No video model',
        note: 'Nothing in this row either. Not every frontier lab enters every race.',
        state: 'none',
      },
    ],
  },
]

const vendorClass: Record<FrontierEntry['vendor'], string> = {
  OpenAI: 'is-openai',
  Google: 'is-google',
  Anthropic: 'is-anthropic',
}
</script>

<template>
  <div class="dl-frontier">
    <section v-for="row in rows" :key="row.title" class="dl-frontier__row">
      <header class="dl-frontier__head">
        <h3>{{ row.title }}</h3>
        <span>{{ row.hint }}</span>
      </header>

      <div class="dl-frontier__tiles">
        <component
          :is="entry.href ? 'a' : 'div'"
          v-for="entry in row.entries"
          :key="entry.name"
          class="dl-frontier__tile"
          :class="[vendorClass[entry.vendor], `is-${entry.state ?? 'current'}`]"
          :href="entry.href"
          :target="entry.href ? '_blank' : undefined"
          :rel="entry.href ? 'noopener' : undefined"
        >
          <div class="dl-frontier__vendor">{{ entry.vendor }}</div>
          <div class="dl-frontier__name">{{ entry.name }}</div>
          <div class="dl-frontier__note">{{ entry.note }}</div>
        </component>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dl-frontier {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: 100%;
}

.dl-frontier__head {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  margin-bottom: 0.3rem;
}

.dl-frontier__head h3 {
  margin: 0;
  font-size: 1.05rem;
}

.dl-frontier__head span {
  font-size: 0.76rem;
  color: var(--dl-muted);
}

.dl-frontier__tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}

.dl-frontier__tile {
  display: block;
  border: 1px solid var(--dl-border);
  border-top: 3px solid var(--dl-border);
  border-radius: 7px;
  padding: 0.5rem 0.65rem;
  background: var(--dl-surface);
  text-decoration: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

a.dl-frontier__tile:hover {
  transform: translateY(-2px);
}

.dl-frontier__tile.is-openai { border-top-color: #10a37f; }
.dl-frontier__tile.is-google { border-top-color: #4285f4; }
.dl-frontier__tile.is-anthropic { border-top-color: #d97757; }

.dl-frontier__tile.is-none,
.dl-frontier__tile.is-retired {
  background: transparent;
  border-style: dashed;
  border-top-style: solid;
}

.dl-frontier__vendor {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dl-muted);
}

.dl-frontier__name {
  color: var(--dl-heading);
  font-weight: 600;
  font-size: 0.94rem;
  line-height: 1.25;
  margin-top: 0.1rem;
}

.dl-frontier__tile.is-retired .dl-frontier__name,
.dl-frontier__tile.is-none .dl-frontier__name {
  color: var(--dl-muted);
}

.dl-frontier__note {
  color: var(--dl-body);
  font-size: 0.74rem;
  line-height: 1.4;
  margin-top: 0.2rem;
}
</style>
