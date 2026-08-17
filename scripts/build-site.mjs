#!/usr/bin/env node
/**
 * Build the published decks plus the landing page into `dist/`.
 *
 * The result is exactly what gets uploaded to the Hugging Face Space, so it
 * deliberately contains no source: no slides.md, no old_slides/, no .github/.
 *
 *   node scripts/build-site.mjs                       # published decks
 *   node scripts/build-site.mjs --all                 # include unpublished (CI)
 *   node scripts/build-site.mjs --only lecture-01     # one deck (incremental release)
 *
 * Every deck is built with a RELATIVE base ("./"), so its assets resolve against
 * whatever URL the deck's own index.html was served from. An absolute base such
 * as "/lecture-01/" only works when the site sits at the host root: the private
 * Hugging Face Space is not served from the root, so every asset 404'd and the
 * deck rendered as a blank page. Relative works at the root and under any
 * prefix, which also makes the GitHub Pages base path a non-issue.
 *
 * The in-deck PDF download button comes from the theme's `download` default
 * ("./slides.pdf"), likewise relative. Run `export-pdf.mjs` after this on
 * anything you actually deploy, or that button 404s.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, parseArgs, repoRoot, selectDecks } from './lib/config.mjs'
import { installErrorHandler } from './lib/fail.mjs'

installErrorHandler()

const args = parseArgs()
const config = loadConfig()

const outDir = join(repoRoot, args.out ?? 'dist')
const decks = selectDecks(config, { all: !!args.all, only: args.only ?? null })

// --only builds into an existing dist without wiping the other decks; a full
// build starts clean so removed decks cannot linger.
if (!args.only && !args['no-clean'])
  rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

console.log(`Building ${decks.length} deck(s) into ${outDir}`)

for (const deck of decks) {
  const deckOut = join(outDir, deck.id)

  const slidevArgs = [
    'slidev',
    'build', deck.entry,
    '--base', './',
    '--out', deckOut,
    '--without-notes',
  ]

  console.log(`\n→ ${deck.id}`)
  const result = spawnSync('npx', slidevArgs, { cwd: repoRoot, stdio: 'inherit' })
  if (result.status !== 0)
    throw new Error(`slidev build failed for ${deck.id} (exit ${result.status})`)
}

writeLanding()
writeSpaceReadme()

console.log(`\nDone. Preview with:  npx vite preview --outDir ${args.out ?? 'dist'}`)

// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]
  ))
}

/**
 * The landing page always lists every *published* deck, even on an incremental
 * `--only` build — otherwise publishing lecture 3 would drop lectures 1 and 2
 * off the index.
 */
function writeLanding() {
  const template = readFileSync(join(repoRoot, 'site', 'index.template.html'), 'utf8')
  const listed = config.decks.filter(d => d.published)

  // Link the file, not the directory. GitHub Pages resolves "lecture-01/" to
  // its index.html; the Hugging Face static Space serves exact paths only and
  // answers a directory request with its own 404 page.
  const cards = listed.length
    ? listed.map(deck => `    <a class="deck" href="${deck.id}/index.html">
      <div class="deck__week">Week ${escapeHtml(deck.week)}</div>
      <div class="deck__title">${escapeHtml(deck.title)}</div>
      ${deck.subtitle ? `<div class="deck__sub">${escapeHtml(deck.subtitle)}</div>` : ''}
      <div class="deck__links"><span>Open slides →</span></div>
    </a>`).join('\n')
    : '    <div class="empty">No lectures published yet.</div>'

  const html = template
    .replaceAll('{{COURSE_CODE}}', escapeHtml(config.course.code))
    .replaceAll('{{COURSE_TITLE}}', escapeHtml(config.course.title))
    .replaceAll('{{COURSE_YEAR}}', escapeHtml(config.course.year))
    .replaceAll('{{INSTRUCTOR}}', escapeHtml(config.course.instructor))
    .replaceAll('{{EMAIL}}', escapeHtml(config.course.email))
    .replaceAll('{{REPO}}', escapeHtml(config.repo))
    .replaceAll('{{BUILD_DATE}}', new Date().toISOString().slice(0, 10))
    .replaceAll('{{DECK_CARDS}}', cards)

  writeFileSync(join(outDir, 'index.html'), html)
  console.log(`\n✓ index.html  (${listed.length} published deck(s) listed)`)
}

/** The Space's own README — its YAML front matter is what makes HF serve it. */
function writeSpaceReadme() {
  const readme = `---
title: ${config.course.title} ${config.course.year} (${config.course.code})
emoji: 🧠
colorFrom: gray
colorTo: blue
sdk: static
app_file: index.html
pinned: false
license: cc-by-4.0
---

# ${config.course.code} — ${config.course.title} ${config.course.year}

Animated, interactive lecture slides for the ${config.course.title} course, built with
[Slidev](https://sli.dev/).

Taught by ${config.course.instructor} (<${config.course.email}>).

This Space contains **built output only**. Source, conversion scripts and the CI/CD
pipeline live at https://github.com/${config.repo} — open a pull request there.
`
  writeFileSync(join(outDir, 'README.md'), readme)
  console.log('✓ README.md  (Hugging Face Space front matter)')
}
