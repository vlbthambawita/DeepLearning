import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function loadConfig() {
  const path = join(repoRoot, 'decks.config.json')
  const config = JSON.parse(readFileSync(path, 'utf8'))

  for (const deck of config.decks) {
    deck.dir = join(repoRoot, 'decks', deck.id)
    deck.entry = join(deck.dir, 'slides.md')
    if (!existsSync(deck.entry))
      throw new Error(`decks.config.json lists "${deck.id}" but ${deck.entry} does not exist`)
  }

  return config
}

/**
 * Which decks a command should act on.
 *
 * `published: true` in the manifest is the single source of truth for what the
 * public site contains. `--all` overrides it so CI can typecheck work in
 * progress, and `--only` narrows to one deck for an incremental release.
 */
export function selectDecks(config, { all = false, only = null } = {}) {
  if (only) {
    const deck = config.decks.find(d => d.id === only)
    if (!deck)
      throw new Error(`No deck "${only}" in decks.config.json (have: ${config.decks.map(d => d.id).join(', ')})`)
    return [deck]
  }
  return all ? config.decks : config.decks.filter(d => d.published)
}

/** Minimal flag parser: --key value, --flag, --key=value. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      out._.push(arg)
      continue
    }
    const [key, inlineValue] = arg.slice(2).split(/=(.*)/s)
    if (inlineValue !== undefined) {
      out[key] = inlineValue
    }
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
      out[key] = argv[++i]
    }
    else {
      out[key] = true
    }
  }
  return out
}

/**
 * Normalise a base path for Slidev, which requires a leading *and* trailing
 * slash. Getting this wrong is the classic "blank page on GitHub Pages" bug.
 */
export function normalizeBase(prefix, id) {
  const clean = String(prefix ?? '/').replace(/^\/*/, '/').replace(/\/*$/, '/')
  return `${clean}${id}/`
}
