/**
 * Seeded pseudo-randomness.
 *
 * Widgets must produce the same picture every time they are opened: a demo that
 * reshuffles its data on reload is impossible to talk over in a lecture, and it
 * would make the PDF export disagree with the live slide.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    // Numerical Recipes LCG — short period, but far beyond what a scatter of a
    // few dozen points needs.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

/** Box–Muller transform, so blobs look like blobs rather than uniform squares. */
export function seededGaussian(seed: number): () => number {
  const rand = seededRandom(seed)
  let spare: number | null = null

  return () => {
    if (spare !== null) {
      const value = spare
      spare = null
      return value
    }
    let u = 0
    let v = 0
    let s = 0
    do {
      u = rand() * 2 - 1
      v = rand() * 2 - 1
      s = u * u + v * v
    } while (s === 0 || s >= 1)

    const scale = Math.sqrt((-2 * Math.log(s)) / s)
    spare = v * scale
    return u * scale
  }
}
