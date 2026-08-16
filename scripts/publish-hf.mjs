#!/usr/bin/env node
/**
 * Upload `dist/` to the Hugging Face Space.
 *
 * Two modes, matching the two tag shapes:
 *
 *   --mode full                 site-vX.Y.Z  → replace the whole Space
 *   --mode deck --only <id>     lecture-XX-vN → replace one deck, leave the rest
 *
 * The full mode passes `--delete "*"` so removed files actually disappear; the
 * incremental mode deliberately does not, because it only ever sees one deck's
 * worth of files and would otherwise wipe every other lecture.
 *
 * Needs the `hf` CLI (`pip install -U huggingface_hub`) and HF_TOKEN in the env.
 *
 *   --dry-run   print the commands without running them
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, parseArgs, repoRoot } from './lib/config.mjs'
import { installErrorHandler } from './lib/fail.mjs'

installErrorHandler()

const args = parseArgs()
const config = loadConfig()

const outDir = join(repoRoot, args.out ?? 'dist')
const repo = args.space ?? config.space
const mode = args.mode ?? 'full'
const dryRun = !!args['dry-run']
const message = args.message ?? `Publish ${mode === 'full' ? 'full site' : args.only} from CI`

if (!existsSync(outDir))
  throw new Error(`${outDir} does not exist — run scripts/build-site.mjs first`)
if (!dryRun && !process.env.HF_TOKEN)
  throw new Error('HF_TOKEN is not set')

/**
 * Make sure the Space exists and is a *static* Space before uploading.
 *
 * `hf upload` will happily create a missing repo, but it creates it with the
 * default SDK — which would give us a Gradio Space serving nothing. Creating it
 * explicitly pins `--space_sdk static`; `--exist-ok` makes this a no-op on every
 * subsequent release.
 */
function ensureSpace() {
  const argv = [
    'repos', 'create', repo,
    '--repo-type', 'space',
    '--space-sdk', 'static',
    '--public',
    '--exist-ok',
  ]
  console.log(`$ hf ${argv.join(' ')}`)
  if (dryRun)
    return

  const result = spawnSync('hf', argv, { cwd: repoRoot, stdio: 'inherit' })
  // A token scoped tightly to one existing repo can be allowed to write to the
  // Space yet forbidden from creating repos, which would fail here for no good
  // reason. The upload that follows is the real test, and it fails loudly, so
  // this stays a warning.
  if (result.status !== 0)
    console.warn(`  could not create/verify the Space (exit ${result.status}) — continuing; the upload will report the real problem`)
}

/** One `hf upload` invocation: local path → path inside the Space repo. */
function upload(localPath, remotePath, { deleteAll = false } = {}) {
  const argv = [
    'upload', repo, localPath, remotePath,
    '--repo-type', 'space',
    '--commit-message', message,
  ]
  if (deleteAll)
    argv.push('--delete', '*')

  console.log(`$ hf ${argv.join(' ')}`)
  if (dryRun)
    return

  const result = spawnSync('hf', argv, { cwd: repoRoot, stdio: 'inherit' })
  if (result.status !== 0)
    throw new Error(`hf upload failed (exit ${result.status})`)
}

ensureSpace()

if (mode === 'full') {
  upload(outDir, '.', { deleteAll: true })
}
else if (mode === 'deck') {
  const id = args.only
  if (!id)
    throw new Error('--mode deck requires --only <deck-id>')

  const deck = config.decks.find(d => d.id === id)
  if (!deck)
    throw new Error(`No deck "${id}" in decks.config.json`)
  // The landing page is rebuilt from `published: true` on every upload. Shipping
  // a deck that is still marked unpublished would put it on the Space with no
  // link to it from the index — publish the flag first.
  if (!deck.published)
    throw new Error(`Deck "${id}" has "published": false in decks.config.json — flip it and commit before tagging a release`)
  if (!existsSync(join(outDir, id)))
    throw new Error(`${join(outDir, id)} does not exist — build the deck first`)

  upload(join(outDir, id), id)
  // The landing page and Space README are regenerated on every build, so they
  // are refreshed alongside the deck.
  upload(join(outDir, 'index.html'), 'index.html')
  upload(join(outDir, 'README.md'), 'README.md')
}
else {
  throw new Error(`Unknown --mode "${mode}" (expected "full" or "deck")`)
}

console.log(dryRun ? '\nDry run — nothing was uploaded.' : `\nPublished to https://huggingface.co/spaces/${repo}`)
