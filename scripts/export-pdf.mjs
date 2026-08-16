#!/usr/bin/env node
/**
 * Export each deck to a printable PDF inside its own dist folder, so the
 * in-deck download button (wired up by `build-site.mjs --with-download`)
 * resolves to `<base>/slides.pdf`.
 *
 * `--with-clicks` renders one page per click step: without it, an animated deck
 * exports as a stack of half-built slides.
 *
 * Requires Chromium:  npx playwright install --with-deps chromium
 *
 *   node scripts/export-pdf.mjs
 *   node scripts/export-pdf.mjs --only lecture-01
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, parseArgs, repoRoot, selectDecks } from './lib/config.mjs'
import { installErrorHandler } from './lib/fail.mjs'

installErrorHandler()

const args = parseArgs()
const config = loadConfig()
const outDir = join(repoRoot, args.out ?? 'dist')
const decks = selectDecks(config, { all: !!args.all, only: args.only ?? null })

for (const deck of decks) {
  const deckOut = join(outDir, deck.id)
  if (!existsSync(deckOut))
    mkdirSync(deckOut, { recursive: true })

  const output = join(deckOut, 'slides.pdf')
  console.log(`\n→ exporting ${deck.id} → ${output}`)

  const run = env => spawnSync('npx', [
    'slidev', 'export', deck.entry,
    '--output', output,
    '--with-clicks',
    '--timeout', String(args.timeout ?? 60000),
  ], { cwd: repoRoot, stdio: 'inherit', env: { ...process.env, ...env } })

  let result = run({})

  // `slidev export` starts a dev server, which wants an inotify watcher. On a
  // busy shared machine that hits ENOSPC long before the disk is full; polling
  // sidesteps it at the cost of some speed, so only fall back on failure.
  if (result.status !== 0 && !process.env.CHOKIDAR_USEPOLLING) {
    console.warn('  export failed — retrying with a polling file watcher')
    result = run({ CHOKIDAR_USEPOLLING: '1' })
  }

  if (result.status !== 0)
    throw new Error(`slidev export failed for ${deck.id} (exit ${result.status})`)
}

console.log('\nDone.')
