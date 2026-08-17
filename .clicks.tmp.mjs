import { chromium } from 'playwright-chromium'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

for (const [deck, n] of [['lecture-02', 26], ['lecture-02', 27]]) {
  console.log(`\n${deck} slide ${n}`)
  let prev = null
  for (let c = 0; c <= 4; c++) {
    await page.goto(`http://localhost:4173/${deck}/index.html#/${n}?clicks=${c}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    const s = await page.evaluate(() => {
      const v = [...document.querySelectorAll('.slidev-layout')].find(e => e.getBoundingClientRect().width > 0)
      if (!v) return null
      const lines = [...v.querySelectorAll('.slidev-code .line, pre .line')]
      // Slidev dims non-highlighted lines; capture whichever signal is present.
      const dimmed = lines.filter(l => l.className.includes('dishonored') || l.className.includes('dim') || getComputedStyle(l).opacity !== '1').length
      return { lines: lines.length, dimmed }
    })
    const sig = s ? `${s.lines}/${s.dimmed}` : 'n/a'
    console.log(`  clicks=${c}  code lines=${s?.lines} dimmed=${s?.dimmed}${sig === prev ? '   <-- unchanged' : ''}`)
    prev = sig
  }
}
await browser.close()
