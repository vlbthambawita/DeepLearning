#!/usr/bin/env node
/**
 * Find content that runs off a slide, or gets silently swallowed.
 *
 * CONTRIBUTING says "nothing warns you that a slide runs off the canvas — open
 * the deck, press `o`, and look". This is that check, automated, because three
 * of the four ways a slide can lose content are invisible in the overview too:
 *
 *   1. content past the bottom of the canvas — what the overview does show;
 *   2. content behind the footer, which is absolutely positioned inside the
 *      layout's bottom padding, so it collides without technically overflowing;
 *   3. a code block squeezed by the column flex of the `default` layout, whose
 *      `overflow: hidden` then eats the last lines with no visual cue at all;
 *   4. a formula wider than the `interactive` aside rail, which scrolls out of
 *      sight rather than sticking out.
 *
 * It walks every slide to its last click state, because a `v-clicks` list
 * occupies its full height from the start but a `v-click` container does not.
 *
 * Usage:
 *
 *   npm run build:all
 *   npm run preview &                        # serves dist/ on :4173
 *   node scripts/check-overflow.mjs                       # every deck
 *   node scripts/check-overflow.mjs lecture-04            # one deck
 *   node scripts/check-overflow.mjs lecture-04 --dark
 *   node scripts/check-overflow.mjs --shots out/          # save a PNG per slide
 *
 * Exits non-zero if anything is clipped, so it can gate a release.
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-chromium'
import { loadConfig } from './lib/config.mjs'
import { installErrorHandler } from './lib/fail.mjs'

installErrorHandler()

const args = process.argv.slice(2)
const dark = args.includes('--dark')
const shotIndex = args.indexOf('--shots')
const shotDir = shotIndex === -1 ? null : args[shotIndex + 1]
const base = (args.find(a => a.startsWith('--base='))?.split('=')[1] ?? 'http://localhost:4173').replace(/\/$/, '')
const only = args.filter(a => !a.startsWith('--') && a !== shotDir)

/** Slidev caps a slide at 24 click steps here; well past anything we author. */
const MAX_CLICKS = 24

const config = loadConfig()
const decks = only.length
  ? config.decks.filter(d => only.includes(d.id))
  : config.decks

if (!decks.length)
  throw new Error(`No deck matched ${only.join(', ')}`)

if (shotDir)
  mkdirSync(shotDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  // 1.2x the theme's 980x551 canvas, so text is measured at a realistic size.
  viewport: { width: 1176, height: 662 },
  colorScheme: dark ? 'dark' : 'light',
})

/**
 * The worst overflow on slide `n`, in CSS pixels.
 *
 * Scoped to `.slidev-page-<n>` rather than to whatever layout happens to be
 * visible: Slidev keeps the outgoing slide mounted through the transition, and
 * measuring that one reports another slide's problems against this one.
 */
const measure = n => page.evaluate((slide) => {
  const root = document.querySelector(`.slidev-page-${slide} .slidev-layout`)
    ?? document.querySelector(`.slidev-page-${slide}`)
  if (!root || root.getBoundingClientRect().width < 100)
    return { worst: -1, who: 'no slide rendered' }

  const box = root.getBoundingClientRect()
  const footer = root.querySelector('.dl-footer')
  const floor = footer ? footer.getBoundingClientRect().top - 2 : box.bottom
  let worst = 0
  let who = ''

  for (const el of root.querySelectorAll('*')) {
    // KaTeX draws braces and radicals as inline SVG with enormous path boxes and
    // keeps a clipped MathML copy of every formula. Neither is laid out.
    if (el.closest('svg') || el.closest('.katex-mathml') || el.closest('.dl-footer'))
      continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0)
      continue
    const over = Math.max(r.bottom - floor, r.right - box.right)
    if (over > worst) {
      worst = over
      who = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 44)}`
    }
  }

  // Clipped rather than overflowing: these boxes hide what does not fit.
  for (const el of root.querySelectorAll('.slidev-code-wrapper, .dl-interactive__aside, .dl-widget__readout, .dl-figure__caption')) {
    const cut = Math.max(el.scrollHeight - el.clientHeight, el.scrollWidth - el.clientWidth)
    if (cut > 2 && cut > worst) {
      worst = cut
      who = `clipped inside .${String(el.className).split(' ')[0]}`
    }
  }

  return { worst: Math.round(worst), who }
}, n)

const problems = []
page.on('pageerror', err => {
  // Slidev asks for a wake lock that headless Chromium always refuses.
  if (!String(err).includes('Wake Lock'))
    problems.push(`page error: ${String(err).slice(0, 200)}`)
})

for (const deck of decks) {
  const url = `${base}/${deck.id}/index.html`
  const slideNo = () => page.evaluate(() => Number((location.hash.match(/^#\/(\d+)/) ?? [])[1]))
  let checked = 0

  /*
   * How many slides there are, read off the footer's "n / total". The title and
   * section layouts deliberately render no footer, so this has to look at a few
   * slides before giving up.
   */
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

  for (let n = 1; n <= total; n++) {
    await page.goto(`${url}#/${n}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    if (await page.$('.slidev-layout') === null || await slideNo() !== n)
      break

    // Click state lives in the hash as `#/5?clicks=3`. Walk to the last one.
    let clicks = 0
    for (let k = 0; k < MAX_CLICKS; k++) {
      await page.keyboard.press('Space')
      await page.waitForTimeout(120)
      if (await slideNo() !== n)
        break
      clicks = await page.evaluate(() => Number((location.hash.match(/clicks=(\d+)/) ?? [0, 0])[1]))
    }
    if (clicks > 0) {
      await page.goto(`${url}#/${n}?clicks=${clicks}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(450)
    }

    if (shotDir)
      await page.screenshot({ path: join(shotDir, `${deck.id}-${String(n).padStart(2, '0')}.png`) })

    const { worst, who } = await measure(n)
    if (worst > 4)
      problems.push(`${deck.id} slide ${n}: ${worst}px hidden (${who})`)
    checked = n
  }

  console.log(`${deck.id}: ${checked} slides checked${dark ? ' (dark)' : ''}`)
}

await browser.close()

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems)
    console.error(`  ${p}`)
  process.exitCode = 1
}
else {
  console.log('\nNo slide loses content.')
}
