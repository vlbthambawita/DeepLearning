/**
 * The arithmetic behind the recurrent-network widgets.
 *
 * Kept out of the components for the same reason `useConvolution` is: several
 * widgets have to agree about one forward pass. `RnnUnroll` prints the hidden
 * state at each step, `RnnStepTrace` derives those same numbers line by line,
 * and the parameter-count slides quote them — three implementations of
 * `tanh(W_xh x + W_hh h + b)` would eventually disagree in front of a lecture
 * hall, and the whole point of the worked example is that the room can check it.
 *
 * Everything here is deliberately tiny: one input feature, two hidden units.
 * A student has to be able to do these sums on paper, which rules out the
 * 128-unit layers the code slides actually use.
 */

/* ---- small linear algebra ------------------------------------------------ */

/** Row-major matrix times column vector. */
export function matVec(m: number[][], v: number[]): number[] {
  return m.map(row => row.reduce((sum, w, j) => sum + w * (v[j] ?? 0), 0))
}

export function addVec(...vs: number[][]): number[] {
  const n = Math.max(...vs.map(v => v.length))
  return Array.from({ length: n }, (_, i) => vs.reduce((sum, v) => sum + (v[i] ?? 0), 0))
}

export function zeros(n: number): number[] {
  return Array.from({ length: n }, () => 0)
}

export const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z))
export const tanh = (z: number): number => Math.tanh(z)

/* ---- the plain recurrent layer ------------------------------------------- */

export interface RnnParams {
  /** Input → hidden. Shape (hidden, input). */
  wxh: number[][]
  /** Hidden → hidden, the recurrent weights. Shape (hidden, hidden). */
  whh: number[][]
  /** Hidden → output. Shape (out, hidden). */
  who: number[][]
  bh: number[]
  bo: number[]
}

export interface RnnStep {
  /** 1-based, because the slides talk about "step 1", not "step 0". */
  t: number
  x: number[]
  hPrev: number[]
  /** W_xh x_t — what this step's own input contributes. */
  fromInput: number[]
  /** W_hh h_{t-1} — what the past contributes. */
  fromState: number[]
  /** The pre-activation. */
  z: number[]
  h: number[]
  o: number[]
}

/**
 * The example every RNN slide in this deck runs on.
 *
 * Chosen so that step 2's input is **zero** and its hidden state is not: that
 * single fact is what separates a recurrent layer from a dense one, and it is
 * much more convincing as two numbers on a slide than as a sentence.
 */
export const DEMO_RNN: RnnParams = {
  wxh: [[1], [-0.5]],
  whh: [[0.5, -0.5], [0.5, 0.5]],
  who: [[1, 1]],
  bh: [0, 0],
  bo: [0],
}

/** x = 1, 0, 1, 0 — a pulse, so the decay of the state between pulses is visible. */
export const DEMO_INPUTS: number[][] = [[1], [0], [1], [0]]

export function rnnForward(xs: number[][], p: RnnParams = DEMO_RNN): RnnStep[] {
  const hidden = p.whh.length
  let h = zeros(hidden)
  const out: RnnStep[] = []

  for (const [i, x] of xs.entries()) {
    const hPrev = h
    const fromInput = matVec(p.wxh, x)
    const fromState = matVec(p.whh, hPrev)
    const z = addVec(fromInput, fromState, p.bh)
    h = z.map(tanh)
    out.push({ t: i + 1, x, hPrev, fromInput, fromState, z, h, o: addVec(matVec(p.who, h), p.bo) })
  }

  return out
}

/**
 * Weights in a single recurrent layer.
 *
 * The teaching point is what is *absent*: the sequence length. Doubling T costs
 * nothing, which is the recurrent counterpart of a convolution's parameter count
 * not depending on the image size.
 */
export function rnnParamCount(nIn: number, nHidden: number, nOut = 0): number {
  const recurrent = nIn * nHidden + nHidden * nHidden + nHidden
  return recurrent + (nOut ? nHidden * nOut + nOut : 0)
}

/* ---- gated cells --------------------------------------------------------- */

export interface LstmState {
  /** Forget gate, in (0, 1). */
  f: number
  /** Input gate. */
  i: number
  /** Candidate value, in (-1, 1). */
  g: number
  /** Output gate. */
  o: number
  cPrev: number
  /** c_t = f·c_{t-1} + i·g — an addition, which is the whole point. */
  c: number
  /** h_t = o·tanh(c_t). */
  h: number
  /** f·c_{t-1}: what survived. */
  kept: number
  /** i·g: what was written. */
  written: number
}

export function lstmStep(cPrev: number, f: number, i: number, g: number, o: number): LstmState {
  const kept = f * cPrev
  const written = i * g
  const c = kept + written
  return { f, i, g, o, cPrev, c, h: o * tanh(c), kept, written }
}

export interface GruState {
  /** Update gate: how much of the candidate to take. */
  z: number
  /** Reset gate: how much of the old state the candidate may read. */
  r: number
  /** The candidate, already computed with the reset gate applied. */
  cand: number
  hPrev: number
  h: number
  kept: number
  written: number
}

/**
 * GRU, in Cho et al.'s orientation: z is how much to *update*.
 *
 * `nn.GRU` inverts it — its z multiplies h_{t-1} — so a student reading the
 * PyTorch docs beside this slide sees the gate apparently backwards. The deck
 * says so explicitly rather than quietly picking one.
 */
export function gruStep(hPrev: number, z: number, r: number, cand: number): GruState {
  const kept = (1 - z) * hPrev
  const written = z * cand
  return { z, r, cand, hPrev, h: kept + written, kept, written }
}

/* ---- gradients through time --------------------------------------------- */

/**
 * |∂h_T / ∂h_{T-k}| for k = 0 … steps, for a one-unit recurrent layer.
 *
 * Backpropagation through time multiplies the same recurrent weight once per
 * step it travels, so the gradient reaching k steps back carries a factor of
 * `factor^k`. One number raised to a power is the entire vanishing- and
 * exploding-gradient problem, which is why the widget plots exactly that.
 */
export function decayChain(factor: number, steps: number): number[] {
  return Array.from({ length: steps + 1 }, (_, k) => Math.abs(factor) ** k)
}

/** How far back the gradient is still worth more than `floor` of its start. */
export function usefulHorizon(factor: number, floor = 0.01): number | null {
  const a = Math.abs(factor)
  if (a >= 1)
    return null
  if (a === 0)
    return 0
  return Math.floor(Math.log(floor) / Math.log(a))
}
