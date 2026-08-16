#!/usr/bin/env node
/**
 * Open a deck in the Slidev dev server.
 *
 *   npm run dev -- lecture-01
 *   npm run dev -- lecture-01 --port 3040
 *
 * Speaker notes stay in the source and are visible at /presenter — they are only
 * stripped from the public build (`--without-notes` in build-site.mjs).
 */
import { spawnSync } from 'node:child_process'
import { loadConfig, parseArgs, repoRoot } from './lib/config.mjs'

const args = parseArgs()
const config = loadConfig()

const id = args._[0] ?? config.decks[0].id
const deck = config.decks.find(d => d.id === id)
if (!deck) {
  console.error(`No deck "${id}". Available: ${config.decks.map(d => d.id).join(', ')}`)
  process.exit(1)
}

const extra = args.port ? ['--port', String(args.port)] : []
console.log(`Opening ${deck.id} — presenter view at /presenter`)

const result = spawnSync('npx', ['slidev', deck.entry, '--open', ...extra], {
  cwd: repoRoot,
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
