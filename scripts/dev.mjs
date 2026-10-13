#!/usr/bin/env node
/**
 * Open a deck in the Slidev dev server.
 *
 *   npm run dev -- lecture-01
 *   npm run dev -- lecture-01 --port 3040
 *   npm run dev -- lecture-01 --class      # the class cut: only `core: true` slides
 *
 * Speaker notes stay in the source and are visible at /presenter — the public
 * build strips them (`--without-notes` in build-site.mjs) unless the deck sets
 * `"publicNotes": true` in decks.config.json.
 */
import { spawnSync } from 'node:child_process'
import { writeClassDeck } from './lib/class-cut.mjs'
import { loadConfig, parseArgs, repoRoot } from './lib/config.mjs'

const args = parseArgs()
const config = loadConfig()

const id = args._[0] ?? config.decks[0].id
const deck = config.decks.find(d => d.id === id)
if (!deck) {
  console.error(`No deck "${id}". Available: ${config.decks.map(d => d.id).join(', ')}`)
  process.exit(1)
}

let entry = deck.entry
if (args.class) {
  // Regenerated on every start; edit slides.md (the `core: true` flags), not class.md.
  const cut = writeClassDeck(deck)
  if (!cut) {
    console.error(`${deck.id} flags no slides \`core: true\` — it has no class cut yet.`)
    process.exit(1)
  }
  entry = cut.path
  console.log(`Class cut: ${cut.slides} of ${cut.of} slides`)
}

const extra = args.port ? ['--port', String(args.port)] : []
console.log(`Opening ${deck.id}${args.class ? ' (class)' : ''} — presenter view at /presenter`)

const result = spawnSync('npx', ['slidev', entry, '--open', ...extra], {
  cwd: repoRoot,
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
