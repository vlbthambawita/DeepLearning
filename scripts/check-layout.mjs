#!/usr/bin/env node
/**
 * Find text that collides with other text or with a figure, and clicks that
 * change nothing on screen.
 *
 * `check-overflow.mjs` only asks whether content is *lost* off the canvas. A
 * slide can pass that and still be unreadable: a label drawn across a box edge,
 * a caption under a figure's corner, two SVG labels printed on top of each
 * other, an absolutely positioned glyph sitting on a heading. And a slide can
 * spend a click on nothing — a `v-click` on an element that was already
 * visible, or a code-highlight step past the last line — which the presenter
 * only discovers in front of the room.
 *
 * For every slide it:
 *   1. walks every click state and screenshots the slide at each one; two
 *      consecutive identical states mean a click revealed nothing (a "dead
 *      click");
 *   2. at the last click state, collects every visible piece of text (HTML text
 *      lines, KaTeX formulas, SVG <text>) and every figure (SVG, images, pixel
 *      pictures, the shapes inside a diagram), and reports
 *        - text overlapping other text,
 *        - HTML text overlapping a figure it is not part of,
 *        - SVG text crossing the edge of a shape in the same diagram (a label
 *          fully inside a box is fine; one straddling its border is not).
 *
 * Usage (against a running `npm run preview`, like check-overflow):
 *
 *   node scripts/check-layout.mjs lecture-07
 *   node scripts/check-layout.mjs lecture-07 --from 30 --to 40
 *   node scripts/check-layout.mjs lecture-07 --no-clicks     # overlap only, faster
 *
 * Exits non-zero if it finds anything.
 */
import { createHash } from 'node:crypto'
import { chromium } from 'playwright-chromium'
import { loadConfig } from './lib/config.mjs'
import { installErrorHandler } from './lib/fail.mjs'

installErrorHandler()

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const opt = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : Number(args[i + 1])
}
const base = (args.find(a => a.startsWith('--base='))?.split('=')[1] ?? 'http://localhost:4173').replace(/\/$/, '')
const optValues = new Set(['--from', '--to'].filter(n => args.includes(n)).map(n => args[args.indexOf(n) + 1]))
const only = args.filter(a => !a.startsWith('--') && !optValues.has(a))
const from = opt('--from', 1)
const to = opt('--to', Infinity)
const checkClicks = !flag('--no-clicks')
const MAX_CLICKS = 24

const config = loadConfig()
const decks = only.length ? config.decks.filter(d => only.includes(d.id)) : config.decks
if (!decks.length)
  throw new Error(`No deck matched ${only.join(', ')}`)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1176, height: 662 } })
page.on('pageerror', () => {})

/** Everything the overlap check needs, measured inside the page. */
const findOverlaps = n => page.evaluate((slide) => {
  const root = document.querySelector(`.slidev-page-${slide} .slidev-layout`)
  if (!root)
    return { out: ['slide root not found'], counts: '' }
  const out = []

  const memo = new Map()
  const hidden = (el) => {
    if (!el || el === document.body)
      return false
    if (memo.has(el))
      return memo.get(el)
    let h = el.classList?.contains('slidev-vclick-hidden')
    if (!h) {
      const cs = getComputedStyle(el)
      h = cs.display === 'none' || cs.visibility === 'hidden' || Number.parseFloat(cs.opacity) < 0.15
    }
    h = h || hidden(el.parentElement)
    memo.set(el, h)
    return h
  }
  // The 144 cells of a PixelImage are one picture; only its frame is a shape.
  const SHAPES = 'rect:not(.dl-pixel__cell), circle, ellipse, polygon'
  const shapesOf = new Map()
  const shapeBoxes = (svg) => {
    if (!shapesOf.has(svg)) {
      shapesOf.set(svg, [...svg.querySelectorAll(SHAPES)]
        .filter(s => !hidden(s))
        .map(s => ({ s, r: s.getBoundingClientRect() })))
    }
    return shapesOf.get(svg)
  }
  const area = r => Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top)
  const inter = (a, b) => ({
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  })
  const contains = (outer, inner, tol = 1.5) =>
    inner.left >= outer.left - tol && inner.right <= outer.right + tol
    && inner.top >= outer.top - tol && inner.bottom <= outer.bottom + tol
  const clip = s => s.replace(/\s+/g, ' ').trim().slice(0, 36)
  const skip = el => el.closest('.dl-footer, .katex-mathml, .slidev-code-wrapper, [data-lint-skip]')

  // ---- text units ---------------------------------------------------------
  const texts = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement
    if (!node.textContent.trim() || !el || el.closest('svg, .katex') || skip(el) || hidden(el))
      continue
    const range = document.createRange()
    range.selectNodeContents(node)
    for (const r of range.getClientRects()) {
      if (r.width > 1 && r.height > 1)
        texts.push({ r, el, label: clip(node.textContent), kind: 'text' })
    }
  }
  for (const el of root.querySelectorAll('.katex')) {
    if (skip(el) || hidden(el) || el.parentElement.closest('.katex'))
      continue
    const r = el.getBoundingClientRect()
    if (r.width > 1)
      texts.push({ r, el, label: clip(el.querySelector('.katex-mathml annotation')?.textContent ?? 'formula'), kind: 'math' })
  }
  const svgTexts = []
  for (const el of root.querySelectorAll('svg text')) {
    if (skip(el) || hidden(el) || !el.textContent.trim())
      continue
    const r = el.getBoundingClientRect()
    if (r.width > 1)
      svgTexts.push({ r, el, svg: el.ownerSVGElement, label: clip(el.textContent), kind: 'svg-text' })
  }

  // ---- figures ------------------------------------------------------------
  const figures = []
  for (const el of root.querySelectorAll('svg, img, canvas')) {
    if (el.parentElement.closest('svg') || skip(el) || hidden(el))
      continue
    const r = el.getBoundingClientRect()
    if (r.width > 8 && r.height > 8)
      figures.push({ r, el, label: el.getAttribute('aria-label')?.slice(0, 36) ?? el.tagName.toLowerCase() })
  }

  // ---- 1. text over text (HTML text, maths, and SVG labels together) ------
  const all = texts.concat(svgTexts)
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]
      const b = all[j]
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el))
        continue
      const x = area(inter(a.r, b.r))
      if (x > 6 && x > 0.18 * Math.min(area(a.r), area(b.r)))
        out.push(`text over text: “${a.label}” × “${b.label}”`)
    }
  }

  // ---- 2. HTML text over a figure it is not part of -----------------------
  for (const t of texts) {
    for (const f of figures) {
      if (f.el.contains(t.el) || t.el.contains(f.el))
        continue
      const x = area(inter(t.r, f.r))
      if (x > 8 && x > 0.12 * area(t.r)) {
        // An SVG with a lot of empty margin is not a collision unless something is drawn there.
        if (f.el.tagName.toLowerCase() === 'svg') {
          const ink = shapeBoxes(f.el).some(({ r }) => area(inter(r, t.r)) > 4)
            || [...f.el.querySelectorAll('text, path, line')].some(s => !hidden(s) && area(inter(s.getBoundingClientRect(), t.r)) > 4)
          if (!ink)
            continue
        }
        out.push(`text over figure: “${t.label}” × [${f.label}]`)
      }
    }
  }

  // ---- 3. SVG label straddling a shape's edge ------------------------------
  for (const t of svgTexts) {
    for (const { s, r: sr } of shapeBoxes(t.svg)) {
      if (sr.width < 4 || sr.height < 4)
        continue
      const x = area(inter(t.r, sr))
      if (x <= 3 || contains(sr, t.r) || contains(t.r, sr))
        continue
      if (x > 0.12 * area(t.r) || x > 0.5 * area(sr))
        out.push(`label crosses a shape edge: “${t.label}” × <${s.tagName}${s.getAttribute('class') ? `.${s.getAttribute('class').split(' ')[0]}` : ''}>`)
    }
  }

  return { out: [...new Set(out)], counts: `${texts.length} text, ${svgTexts.length} svg-text, ${figures.length} figures` }
}, n)

const problems = []
const hashSlide = async () => createHash('sha1').update(await page.screenshot({ clip: { x: 0, y: 0, width: 1176, height: 662 } })).digest('hex')

for (const deck of decks) {
  const url = `${base}/${deck.id}/index.html`
  const slideNo = () => page.evaluate(() => Number((location.hash.match(/^#\/(\d+)/) ?? [])[1]))
  let total = 0
  for (const probe of [2, 3, 1, 4, 5]) {
    await page.goto(`${url}#/${probe}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    total = await page.evaluate(() =>
      Number(document.querySelector('.dl-footer__right')?.textContent?.match(/\/\s*(\d+)/)?.[1] ?? 0))
    if (total)
      break
  }
  if (!total)
    throw new Error(`Could not read the slide count from ${url}`)

  let checked = 0
  for (let n = Math.max(1, from); n <= Math.min(total, to); n++) {
    await page.goto(`${url}#/${n}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    if (await slideNo() !== n)
      break
    let clicks = 0
    for (let k = 0; k < MAX_CLICKS; k++) {
      await page.keyboard.press('Space')
      await page.waitForTimeout(120)
      if (await slideNo() !== n)
        break
      clicks = await page.evaluate(() => Number((location.hash.match(/clicks=(\d+)/) ?? [0, 0])[1]))
    }

    if (checkClicks && clicks > 0) {
      let prev = null
      for (let k = 0; k <= clicks; k++) {
        await page.goto(`${url}#/${n}?clicks=${k}`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(650)
        const h = await hashSlide()
        if (prev && h === prev)
          problems.push(`${deck.id} slide ${n}: click ${k} of ${clicks} changes nothing on screen`)
        prev = h
      }
    }

    await page.goto(`${url}#/${n}?clicks=${clicks}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(650)
    const { out: found, counts } = await findOverlaps(n)
    for (const p of found)
      problems.push(`${deck.id} slide ${n}: ${p}`)
    if (flag('--verbose'))
      console.log(`  slide ${n}: ${clicks} clicks, ${counts}, ${found.length} overlap(s)`)
    checked++
  }
  console.log(`${deck.id}: ${checked} slides checked for overlap${checkClicks ? ' and dead clicks' : ''}`)
}

await browser.close()

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems)
    console.error(`  ${p}`)
  process.exitCode = 1
}
else {
  console.log('\nNo overlaps, no dead clicks.')
}
