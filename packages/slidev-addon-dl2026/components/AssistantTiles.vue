<script setup lang="ts">
/*
 * Lecture 01 slide 10 — References.
 *
 * The books and the PyTorch docs are the references we assign; these three are
 * the references the room already uses. Naming them on the slide is what makes
 * the honesty rule sayable: assistants are allowed, and the assignments ask you
 * to state where you used one.
 *
 * The marks are drawn rather than bitmapped so they stay sharp at any
 * projector resolution and add nothing to the deck's asset size. They are
 * deliberately simplified stand-ins for each vendor's logo, not reproductions.
 */
const claudeSpokes = Array.from({ length: 12 }, (_, i) => (i * 360) / 12)

const tiles = [
  {
    name: 'ChatGPT',
    vendor: 'OpenAI',
    href: 'https://chatgpt.com/',
    mark: 'openai',
    colour: '#10a37f',
  },
  {
    name: 'Gemini',
    vendor: 'Google DeepMind',
    href: 'https://gemini.google.com/',
    mark: 'gemini',
    colour: '#4285f4',
  },
  {
    name: 'Claude',
    vendor: 'Anthropic',
    href: 'https://claude.ai/',
    mark: 'claude',
    colour: '#d97757',
  },
]
</script>

<template>
  <div class="dl-assistants">
    <div class="dl-assistants__label">…and the one you already use</div>

    <div class="dl-assistants__row">
      <a
        v-for="tile in tiles"
        :key="tile.name"
        class="dl-assistant"
        :href="tile.href"
        target="_blank"
        rel="noopener"
      >
        <svg class="dl-assistant__mark" viewBox="0 0 24 24" :style="{ color: tile.colour }" aria-hidden="true">
          <template v-if="tile.mark === 'openai'">
            <g fill="none" stroke="currentColor" stroke-width="1.4">
              <ellipse cx="12" cy="12" rx="9.4" ry="4" />
              <ellipse cx="12" cy="12" rx="9.4" ry="4" transform="rotate(60 12 12)" />
              <ellipse cx="12" cy="12" rx="9.4" ry="4" transform="rotate(120 12 12)" />
            </g>
          </template>
          <template v-else-if="tile.mark === 'gemini'">
            <path
              d="M12 1.6C12.7 8.2 15.8 11.3 22.4 12 15.8 12.7 12.7 15.8 12 22.4 11.3 15.8 8.2 12.7 1.6 12 8.2 11.3 11.3 8.2 12 1.6Z"
              fill="currentColor"
            />
          </template>
          <template v-else>
            <g stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
              <line
                v-for="(angle, i) in claudeSpokes"
                :key="angle"
                x1="12"
                y1="12"
                x2="12"
                :y2="i % 2 === 0 ? 2.2 : 4.6"
                :transform="`rotate(${angle} 12 12)`"
              />
            </g>
          </template>
        </svg>

        <div class="dl-assistant__text">
          <div class="dl-assistant__name">{{ tile.name }}</div>
          <div class="dl-assistant__vendor">{{ tile.vendor }}</div>
        </div>
      </a>
    </div>

    <div class="dl-assistants__rule">
      Fine by me — <strong>say where you used one</strong>. What you cannot hand in is code
      or text you are unable to explain.
    </div>
  </div>
</template>

<style scoped>
.dl-assistants {
  width: 100%;
}

.dl-assistants__label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dl-muted);
  margin-bottom: 0.4rem;
}

.dl-assistants__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
}

.dl-assistant {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--dl-border);
  border-radius: 8px;
  background: var(--dl-surface);
  text-decoration: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.dl-assistant:hover {
  transform: translateY(-2px);
  border-color: var(--dl-accent);
}

.dl-assistant__mark {
  flex: 0 0 auto;
  width: 1.7rem;
  height: 1.7rem;
}

.dl-assistant__name {
  color: var(--dl-heading);
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.2;
}

.dl-assistant__vendor {
  color: var(--dl-muted);
  font-size: 0.74rem;
}

.dl-assistants__rule {
  margin-top: 0.6rem;
  font-size: 0.86rem;
  color: var(--dl-body);
}
</style>
