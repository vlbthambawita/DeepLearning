<script setup lang="ts">
/*
 * Lecture 01 slide 21, "Some applications of DL".
 *
 * The 2025 slide listed nine categories and scattered five pieces of clipart
 * beside them, none tied to a particular category. Here each category arrives
 * with an illustration of what the model actually does — input on the left of
 * the arrow, output on the right — so "computer vision" means something
 * concrete rather than being a word on a list.
 *
 * Driven by Slidev's click count, so the lecturer just presses space. The slide
 * must declare `clicks:` in its frontmatter, because Slidev cannot infer a
 * click total from a component that reads $clicks itself.
 *
 * Illustrations are shapes only — no SVG <text> — so the labels are ordinary
 * HTML and cannot fall out of step with the drawing.
 */
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

interface Application {
  key: string
  name: string
  blurb: string
}

const APPS: Application[] = [
  { key: 'vision', name: 'Computer vision', blurb: 'Finding and outlining objects in images and video — the week 4–5 material.' },
  { key: 'language', name: 'Language', blurb: 'Assistants, translation and summarisation, built on the transformers of week 7.' },
  { key: 'generative', name: 'Generative models', blurb: 'Turning noise or a sentence into an image, a video, or synthetic training data. Weeks 8–9.' },
  { key: 'speech', name: 'Speech and audio', blurb: 'Transcription, synthesis and live translation — sequence models over a waveform.' },
  { key: 'health', name: 'Healthcare', blurb: 'Reading scans, flagging findings, and generating data where real cases are scarce. My own field.' },
  { key: 'autonomy', name: 'Autonomous systems', blurb: 'Self-driving cars, drones and robots: perception feeding control, often with reinforcement learning.' },
  { key: 'science', name: 'Science', blurb: 'Protein structure, weather forecasting, materials discovery — models replacing an expensive simulation.' },
  { key: 'recsys', name: 'Search and recommendation', blurb: 'Ranking what you see next. Quietly the largest deployed use of deep learning.' },
  { key: 'security', name: 'Anomaly and fraud detection', blurb: 'Learning what normal looks like, then flagging what is not.' },
]

const { $clicks } = useSlideContext()

// One category per click, starting with the first already shown.
const index = computed(() => Math.min(Math.max($clicks.value ?? 0, 0), APPS.length - 1))
const active = computed(() => APPS[index.value])
const revealed = (i: number) => i <= index.value
</script>

<template>
  <div class="dl-apps">
    <ol class="dl-apps__list">
      <li
        v-for="(a, i) in APPS"
        :key="a.key"
        :class="{ 'is-revealed': revealed(i), 'is-current': i === index }"
      >{{ a.name }}</li>
    </ol>

    <div class="dl-apps__stage">
      <svg viewBox="0 0 260 130" class="dl-apps__svg" role="img" :aria-label="active.name">
        <defs>
          <marker id="dl-app-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--dl-muted)" />
          </marker>
        </defs>

        <!-- every illustration reads input → model → output -->
        <line class="flow" x1="112" y1="65" x2="146" y2="65" marker-end="url(#dl-app-arrow)" />

        <!-- Computer vision: a frame with detections -->
        <g v-if="active.key === 'vision'">
          <rect class="panel" x="12" y="24" width="92" height="82" rx="4" />
          <circle class="soft" cx="44" cy="60" r="14" />
          <rect class="soft" x="62" y="66" width="30" height="26" rx="3" />
          <rect class="panel" x="156" y="24" width="92" height="82" rx="4" />
          <circle class="soft" cx="188" cy="60" r="14" />
          <rect class="soft" x="206" y="66" width="30" height="26" rx="3" />
          <rect class="box-hi" x="170" y="42" width="36" height="36" rx="2" />
          <rect class="box-hi is-alt" x="202" y="62" width="38" height="34" rx="2" />
        </g>

        <!-- Language: tokens in, a reply out -->
        <g v-else-if="active.key === 'language'">
          <rect class="panel" x="12" y="30" width="92" height="70" rx="4" />
          <rect class="ink" x="24" y="44" width="52" height="7" rx="3" />
          <rect class="ink" x="24" y="58" width="68" height="7" rx="3" />
          <rect class="ink is-hi" x="24" y="72" width="34" height="7" rx="3" />
          <path class="panel" d="M156,30 H248 a4,4 0 0 1 4,4 V86 a4,4 0 0 1 -4,4 H182 l-10,12 v-12 H156 a4,4 0 0 1 -4,-4 V34 a4,4 0 0 1 4,-4 Z" />
          <rect class="ink is-hi" x="168" y="46" width="60" height="7" rx="3" />
          <rect class="ink is-hi" x="168" y="60" width="44" height="7" rx="3" />
        </g>

        <!-- Generative: noise in, a picture out -->
        <g v-else-if="active.key === 'generative'">
          <rect class="panel" x="12" y="24" width="92" height="82" rx="4" />
          <g class="noise">
            <circle v-for="n in 46" :key="n" :cx="18 + ((n * 37) % 80)" :cy="30 + ((n * 53) % 70)" r="2.1" />
          </g>
          <rect class="panel" x="156" y="24" width="92" height="82" rx="4" />
          <path class="soft" d="M160,96 L186,62 L206,86 L220,70 L244,96 Z" />
          <circle class="hi" cx="228" cy="44" r="9" />
        </g>

        <!-- Speech: a waveform in, text out -->
        <g v-else-if="active.key === 'speech'">
          <rect class="panel" x="12" y="30" width="92" height="70" rx="4" />
          <g class="wave">
            <rect v-for="n in 13" :key="n" :x="20 + (n - 1) * 6.4" :y="65 - (6 + ((n * 13) % 22))" width="3.4" :height="2 * (6 + ((n * 13) % 22))" rx="1.7" />
          </g>
          <rect class="panel" x="156" y="30" width="92" height="70" rx="4" />
          <rect class="ink is-hi" x="168" y="50" width="62" height="7" rx="3" />
          <rect class="ink" x="168" y="64" width="46" height="7" rx="3" />
        </g>

        <!-- Healthcare: a scan with a finding outlined -->
        <g v-else-if="active.key === 'health'">
          <rect class="panel is-dark" x="12" y="24" width="92" height="82" rx="4" />
          <ellipse class="tissue" cx="58" cy="65" rx="34" ry="30" />
          <circle class="lesion" cx="72" cy="54" r="9" />
          <rect class="panel is-dark" x="156" y="24" width="92" height="82" rx="4" />
          <ellipse class="tissue" cx="202" cy="65" rx="34" ry="30" />
          <circle class="lesion" cx="216" cy="54" r="9" />
          <circle class="outline-hi" cx="216" cy="54" r="14" />
        </g>

        <!-- Autonomous systems: a sensed road ahead -->
        <g v-else-if="active.key === 'autonomy'">
          <rect class="panel" x="12" y="24" width="92" height="82" rx="4" />
          <path class="road" d="M34,106 L52,44 L66,44 L84,106 Z" />
          <rect class="soft" x="52" y="52" width="14" height="10" rx="2" />
          <rect class="panel" x="156" y="24" width="92" height="82" rx="4" />
          <path class="road" d="M178,106 L196,44 L210,44 L228,106 Z" />
          <path class="cone" d="M203,100 L176,48 L230,48 Z" />
          <rect class="box-hi" x="192" y="48" width="22" height="16" rx="2" />
        </g>

        <!-- Science: a molecule graph -->
        <g v-else-if="active.key === 'science'">
          <rect class="panel" x="12" y="30" width="92" height="70" rx="4" />
          <g class="chain">
            <line x1="28" y1="80" x2="46" y2="52" />
            <line x1="46" y1="52" x2="68" y2="76" />
            <line x1="68" y1="76" x2="88" y2="50" />
            <circle cx="28" cy="80" r="5" />
            <circle cx="46" cy="52" r="5" />
            <circle cx="68" cy="76" r="5" />
            <circle cx="88" cy="50" r="5" />
          </g>
          <rect class="panel" x="156" y="30" width="92" height="70" rx="4" />
          <g class="chain is-hi">
            <path d="M170,86 C186,40 210,96 238,48" />
            <circle cx="170" cy="86" r="5" />
            <circle cx="196" cy="62" r="5" />
            <circle cx="216" cy="72" r="5" />
            <circle cx="238" cy="48" r="5" />
          </g>
        </g>

        <!-- Search and recommendation: a person, then a ranked list -->
        <g v-else-if="active.key === 'recsys'">
          <rect class="panel" x="12" y="30" width="92" height="70" rx="4" />
          <circle class="soft" cx="58" cy="54" r="11" />
          <path class="soft" d="M36,90 a22,18 0 0 1 44,0 Z" />
          <rect class="panel" x="156" y="24" width="92" height="82" rx="4" />
          <rect class="ink is-hi" x="166" y="36" width="72" height="12" rx="3" />
          <rect class="ink" x="166" y="54" width="60" height="12" rx="3" />
          <rect class="ink" x="166" y="72" width="48" height="12" rx="3" />
          <rect class="ink" x="166" y="90" width="36" height="10" rx="3" />
        </g>

        <!-- Anomaly detection: one point that does not belong -->
        <g v-else>
          <rect class="panel" x="12" y="30" width="92" height="70" rx="4" />
          <g class="dots">
            <circle v-for="n in 22" :key="n" :cx="24 + ((n * 29) % 70)" :cy="42 + ((n * 41) % 48)" r="3" />
          </g>
          <rect class="panel" x="156" y="30" width="92" height="70" rx="4" />
          <g class="dots">
            <circle v-for="n in 22" :key="n" :cx="168 + ((n * 29) % 70)" :cy="42 + ((n * 41) % 48)" r="3" />
          </g>
          <circle class="anomaly" cx="228" cy="52" r="5" />
          <circle class="outline-hi is-danger" cx="228" cy="52" r="12" />
        </g>
      </svg>

      <p class="dl-apps__blurb">{{ active.blurb }}</p>
    </div>
  </div>
</template>

<style scoped>
.dl-apps {
  display: grid;
  grid-template-columns: 15rem 1fr;
  gap: 2rem;
  width: 100%;
  height: 100%;
  min-height: 0;
  align-items: start;
}

.dl-apps__list {
  margin: 0;
  padding-left: 1.4rem;
  list-style: decimal;
}

.dl-apps__list li {
  margin: 0.34rem 0;
  font-size: 1.02rem;
  color: var(--dl-border);
  transition: color 0.25s ease;
}

.dl-apps__list li.is-revealed {
  color: var(--dl-muted);
}

.dl-apps__list li.is-current {
  color: var(--dl-heading);
  font-weight: 600;
}

.dl-apps__stage {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-width: 0;
}

.dl-apps__svg {
  width: 100%;
  max-height: 16rem;
}

.dl-apps__blurb {
  margin: 0;
  font-size: 1.02rem;
  color: var(--dl-body);
  max-width: 62ch;
}

/* --- illustration vocabulary ------------------------------------------- */
.panel {
  fill: var(--dl-surface);
  stroke: var(--dl-border);
  stroke-width: 1.4;
}

.panel.is-dark {
  fill: var(--dl-accent-soft);
}

.flow {
  stroke: var(--dl-muted);
  stroke-width: 1.8;
}

.soft,
.tissue,
.road {
  fill: var(--dl-border);
}

.noise circle,
.dots circle {
  fill: var(--dl-muted);
  opacity: 0.55;
}

.wave rect {
  fill: var(--dl-accent);
}

.ink {
  fill: var(--dl-border);
}

.ink.is-hi {
  fill: var(--dl-accent);
}

.hi {
  fill: var(--dl-accent);
}

.box-hi {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 2.2;
}

.box-hi.is-alt {
  stroke: var(--dl-heading);
}

.lesion {
  fill: var(--dl-muted);
}

.outline-hi {
  fill: none;
  stroke: var(--dl-accent);
  stroke-width: 2.2;
}

.outline-hi.is-danger {
  stroke: var(--dl-danger);
}

.anomaly {
  fill: var(--dl-danger);
}

.cone {
  fill: var(--dl-accent);
  opacity: 0.18;
}

.chain line,
.chain path {
  stroke: var(--dl-muted);
  stroke-width: 2;
  fill: none;
}

.chain circle {
  fill: var(--dl-muted);
}

.chain.is-hi line,
.chain.is-hi path {
  stroke: var(--dl-accent);
}

.chain.is-hi circle {
  fill: var(--dl-accent);
}
</style>
