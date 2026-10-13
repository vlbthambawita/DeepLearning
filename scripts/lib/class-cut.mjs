/**
 * The class cut: the short deck taught in the 2-hour session, generated from
 * the full self-study deck.
 *
 * A deck is written once, in full (`slides.md`), for students who learn from it
 * on their own. The slides that carry the main flow are flagged `core: true` in
 * their front matter. This module writes `decks/<id>/class.md` holding only:
 *
 *   - the title slide (it also carries the headmatter),
 *   - every slide flagged `core: true`,
 *   - every `section` divider with at least one core slide after it,
 *   - every `end` slide.
 *
 * `slide-stats.py` applies the same rule when it estimates the cut's length;
 * change both together.
 *
 * class.md sits beside slides.md so `./figures/…` paths and the deck's
 * `style.css` resolve exactly as they do for the full deck. It is generated —
 * gitignored, never edited by hand.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseSync } from '@slidev/parser/core'

/** Which slides of a deck go into the class cut (0-based indices). */
export function classCutIndices(markdown, filepath) {
  const { slides } = parseSync(markdown, filepath)
  const core = slides.map(s => s.frontmatter?.core === true)
  const layout = i => slides[i].frontmatter?.layout ?? 'default'

  const keep = []
  for (let i = 0; i < slides.length; i++) {
    if (i === 0 || core[i] || layout(i) === 'end') {
      keep.push(i)
    }
    else if (layout(i) === 'section') {
      for (let j = i + 1; j < slides.length && layout(j) !== 'section'; j++) {
        if (core[j]) {
          keep.push(i)
          break
        }
      }
    }
  }
  return { slides, keep, coreCount: core.filter(Boolean).length }
}

/** How many slides a deck flags `core: true` — 0 means it has no class cut. */
export function coreCount(deck) {
  return classCutIndices(readFileSync(deck.entry, 'utf8'), deck.entry).coreCount
}

/**
 * Write decks/<id>/class.md. Returns its path and size, or null when the deck
 * flags no core slides (then there is no class deck to build).
 */
export function writeClassDeck(deck) {
  const { slides, keep, coreCount: n } = classCutIndices(readFileSync(deck.entry, 'utf8'), deck.entry)
  if (!n)
    return null

  const parts = keep.map((i) => {
    const raw = slides[i].raw.replace(/\s+$/, '')
    if (i === 0)
      return classHeadmatter(raw)
    // A slide with no front matter has no leading separator of its own.
    return raw.startsWith('---') ? raw : `---\n\n${raw}`
  })

  const path = join(deck.dir, 'class.md')
  writeFileSync(path, `${parts.join('\n\n')}\n`)
  return { path, slides: keep.length, of: slides.length }
}

/**
 * The full deck's headmatter, retitled so the browser tab says which version is
 * open. The PDF button points one level up: the class deck is served from
 * <id>/class/, and the PDF students want is the full deck's.
 */
function classHeadmatter(raw) {
  const end = raw.indexOf('\n---', 3)
  let fm = raw.slice(0, end)
  const rest = raw.slice(end)

  fm = fm.replace(/^title:[ \t]*(.+)$/m, (_m, value) => {
    const plain = value.trim().replace(/^(["'])(.*)\1$/, '$2')
    return `title: ${JSON.stringify(`${plain} (class)`)}`
  })
  fm = /^download:/m.test(fm)
    ? fm.replace(/^download:.*$/m, 'download: ../slides.pdf')
    : `${fm}\ndownload: ../slides.pdf`
  return fm + rest
}
