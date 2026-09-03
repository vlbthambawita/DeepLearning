/**
 * The arithmetic behind the convolution widgets.
 *
 * Kept out of the components because Conv1DLab, Conv2DLab and CNNArchitecture
 * all have to agree on `outputSize` — the whole point of the output-size slide
 * is that one formula predicts every shape in the deck, and three independent
 * implementations of it would eventually disagree in front of a lecture hall.
 *
 * `flip` is the textbook-convolution / cross-correlation switch. Default is
 * cross-correlation, because that is what `nn.Conv2d` computes and what the
 * students will write. Flipping reproduces the definition in Raschka et al.,
 * which is where the deck's worked examples come from.
 */

/** o = floor((n + 2p - m) / s) + 1, clamped at zero for kernels wider than the input. */
export function outputSize(n: number, m: number, p: number, s: number): number {
  return Math.max(0, Math.floor((n + 2 * p - m) / s) + 1)
}

export function padVector(x: number[], p: number): number[] {
  return [...Array.from({ length: p }, () => 0), ...x, ...Array.from({ length: p }, () => 0)]
}

export function padMatrix(x: number[][], p: number): number[][] {
  if (p === 0)
    return x.map(row => [...row])
  const width = (x[0]?.length ?? 0) + 2 * p
  const zeros = () => Array.from({ length: width }, () => 0)
  return [
    ...Array.from({ length: p }, zeros),
    ...x.map(row => [...Array.from({ length: p }, () => 0), ...row, ...Array.from({ length: p }, () => 0)]),
    ...Array.from({ length: p }, zeros),
  ]
}

export interface Tap {
  /** Index into the *padded* input. */
  at: number
  x: number
  w: number
  /** True when this tap reads a padded zero rather than real data. */
  isPad: boolean
}

export interface Step1D {
  /** Index into the output vector. */
  index: number
  /** Where the window starts in the padded input. */
  start: number
  taps: Tap[]
  sum: number
}

export interface Conv1DResult {
  padded: number[]
  kernel: number[]
  steps: Step1D[]
  output: number[]
}

export interface ConvOptions {
  padding?: number
  stride?: number
  /** Rotate the kernel first — textbook convolution rather than cross-correlation. */
  flip?: boolean
}

export function conv1d(input: number[], kernel: number[], options: ConvOptions = {}): Conv1DResult {
  const { padding = 0, stride = 1, flip = false } = options
  const w = flip ? [...kernel].reverse() : [...kernel]
  const padded = padVector(input, padding)
  const count = outputSize(input.length, kernel.length, padding, stride)

  const steps = Array.from({ length: count }, (_, i) => {
    const start = i * stride
    const taps = w.map((weight, k) => ({
      at: start + k,
      x: padded[start + k] ?? 0,
      w: weight,
      isPad: start + k < padding || start + k >= padding + input.length,
    }))
    return {
      index: i,
      start,
      taps,
      sum: taps.reduce((acc, t) => acc + t.x * t.w, 0),
    }
  })

  return { padded, kernel: w, steps, output: steps.map(s => s.sum) }
}

export interface Step2D {
  row: number
  col: number
  /** Top-left corner of the window in the padded input. */
  top: number
  left: number
  taps: Array<Tap & { r: number, c: number }>
  sum: number
}

export interface Conv2DResult {
  padded: number[][]
  kernel: number[][]
  steps: Step2D[]
  output: number[][]
}

export function conv2d(input: number[][], kernel: number[][], options: ConvOptions = {}): Conv2DResult {
  const { padding = 0, stride = 1, flip = false } = options
  // A 180° rotation, not a transpose: reverse the rows, then each row.
  const w = flip ? [...kernel].reverse().map(row => [...row].reverse()) : kernel.map(row => [...row])
  const padded = padMatrix(input, padding)

  const rows = outputSize(input.length, kernel.length, padding, stride)
  const cols = outputSize(input[0]?.length ?? 0, kernel[0]?.length ?? 0, padding, stride)
  const inRows = input.length
  const inCols = input[0]?.length ?? 0

  const steps: Step2D[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top = r * stride
      const left = c * stride
      const taps = w.flatMap((krow, kr) => krow.map((weight, kc) => {
        const rr = top + kr
        const cc = left + kc
        return {
          r: rr,
          c: cc,
          at: rr * padded[0].length + cc,
          x: padded[rr]?.[cc] ?? 0,
          w: weight,
          isPad: rr < padding || rr >= padding + inRows || cc < padding || cc >= padding + inCols,
        }
      }))
      steps.push({ row: r, col: c, top, left, taps, sum: taps.reduce((acc, t) => acc + t.x * t.w, 0) })
    }
  }

  const output = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => steps[r * cols + c]?.sum ?? 0))

  return { padded, kernel: w, steps, output }
}

/**
 * Numbers on these slides are read aloud, so they are written the way they
 * would be said: 7 rather than 7.00, 0.75 rather than 0.7500000000000001.
 */
export function num(value: number, places = 2): string {
  const rounded = Number(value.toFixed(places))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}
