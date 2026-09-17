/**
 * The worked example every attention widget in this deck runs on.
 *
 * Same contract as `useRecurrence`: several widgets have to agree about one
 * forward pass, and a lecture hall is the worst possible place to discover that
 * two of them round differently. `QkvLab` shows the three projections,
 * `AttentionTrace` derives one output vector line by line, and `AttentionMatrix`
 * shows every row at once — all three call in here.
 *
 * Everything is deliberately tiny: four embedding dimensions, two key
 * dimensions, three words. A student has to be able to check these sums on
 * paper, which rules out the d_model = 512 of the real thing.
 *
 * The matrices are hand-picked, not trained. They are chosen so the four
 * embedding coordinates can be *named* — determiner, water, money, thing — and
 * so that the one interesting row of the attention matrix comes out as a number
 * a room can verify in its head. A trained model's coordinates mean nothing
 * nameable; say so when you show this.
 */

/* ---- the toy semantic space --------------------------------------------- */

/** What each embedding coordinate stands for, for teaching purposes only. */
export const AXES = ['det', 'water', 'money', 'thing'] as const

export const D_MODEL = 4
export const D_K = 2

/**
 * Four words, four numbers each.
 *
 * `bank` is deliberately *empty* of sense: all of its mass sits on the "thing"
 * axis, and nothing says whether it is a riverbank or a high-street bank. That
 * is the whole reason the example works — the missing information has to come
 * from a neighbour, and attention is how it gets there.
 */
export const VOCAB: Record<string, number[]> = {
  the: [1, 0, 0, 0],
  river: [0, 2, 0, 1],
  money: [0, 0, 2, 1],
  bank: [0, 0, 0, 2],
}

/**
 * Query projection: *what am I looking for?*
 *
 * Only the "thing" coordinate produces a question, so `the` asks nothing at all
 * and `bank` asks the loudest. A token that asks nothing gets a flat row of
 * attention weights, which is a useful thing for the room to see happen.
 */
export const W_Q: number[][] = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0.5, 0.5],
]

/**
 * Key projection: *what do I advertise?*
 *
 * `river` advertises water, `money` advertises money, and the other two
 * advertise nothing — so they are never what a query matches on.
 */
export const W_K: number[][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [0, 0],
]

/**
 * Value projection: *what do I hand over when I am attended to?*
 *
 * Deliberately **not** equal to `W_K`. The question students ask about
 * query–key–value is always "why do we need both a key and a value", and the
 * answer — what makes me findable is not the same as what I am worth reading —
 * is only visible if the two matrices differ.
 */
export const W_V: number[][] = [
  [0.2, 0.2],
  [1, 0],
  [0, 1],
  [0.3, 0.3],
]

/** The two sentences. Same weights, same word, one neighbour changed. */
export const SENTENCES: Record<SentenceKey, string[]> = {
  river: ['the', 'river', 'bank'],
  money: ['the', 'money', 'bank'],
}

export type SentenceKey = 'river' | 'money'

/**
 * A longer sentence, for the widgets where *length* is the point.
 *
 * Nine words is enough for a causal mask to look like a triangle rather than a
 * corner, and enough for the heads in `MultiHeadLab` to have somewhere to point.
 * Its attention weights are hand-drawn rather than computed — say so.
 */
export const LONG_SENTENCE = ['the', 'cat', 'ate', 'the', 'fish', 'because', 'it', 'was', 'hungry']

/* ---- small linear algebra ------------------------------------------------ */

/** Row vector times matrix: `x @ W`, with W stored row-major as (in, out). */
export function project(x: number[], w: number[][]): number[] {
  const out = w[0].map(() => 0)
  w.forEach((row, i) => row.forEach((weight, j) => {
    out[j] += (x[i] ?? 0) * weight
  }))
  return out
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0)
}

export function scaleVec(v: number[], s: number): number[] {
  return v.map(x => x * s)
}

export function sumVecs(vs: number[][]): number[] {
  const n = Math.max(0, ...vs.map(v => v.length))
  return Array.from({ length: n }, (_, i) => vs.reduce((sum, v) => sum + (v[i] ?? 0), 0))
}

/**
 * Softmax, with the standard max-subtraction.
 *
 * `null` marks a masked position — it takes weight exactly 0 and contributes
 * nothing to the denominator, which is what `-inf` before the exponential does
 * in a real implementation. Representing it as `null` rather than `-Infinity`
 * keeps `NaN` out of the widgets when a whole row is masked.
 */
export function softmax(scores: (number | null)[]): number[] {
  const live = scores.filter((s): s is number => s !== null)
  if (live.length === 0)
    return scores.map(() => 0)

  const max = Math.max(...live)
  const exps = scores.map(s => (s === null ? 0 : Math.exp(s - max)))
  const total = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / total)
}

/* ---- scaled dot-product attention ---------------------------------------- */

export interface AttentionRow {
  /** Index of the querying token. */
  i: number
  word: string
  q: number[]
  /** q · k for every position, before scaling. */
  raw: number[]
  /** The same scores divided by sqrt(d_k). `null` where the mask closed them. */
  scaled: (number | null)[]
  /** softmax of `scaled` — one weight per position, summing to 1. */
  weights: number[]
  /** weight_j · v_j, the term each position contributes to the output. */
  terms: number[][]
  /** The new vector for this position. */
  out: number[]
}

export interface AttentionResult {
  words: string[]
  x: number[][]
  q: number[][]
  k: number[][]
  v: number[][]
  rows: AttentionRow[]
  dk: number
  /** 1 / sqrt(d_k). */
  scale: number
  causal: boolean
}

/**
 * One head of scaled dot-product attention, kept in its long form.
 *
 * A real implementation is `softmax(Q Kᵀ / sqrt(d_k)) V` and computes every row
 * at once. This returns the intermediate quantities per row instead, because
 * every one of them is something a slide points at: the raw dot products, the
 * scaled scores, the weights, and the individual weighted values before they are
 * summed.
 */
export function selfAttention(words: string[], causal = false): AttentionResult {
  const x = words.map(w => VOCAB[w] ?? VOCAB.the)
  const q = x.map(v => project(v, W_Q))
  const k = x.map(v => project(v, W_K))
  const v = x.map(vec => project(vec, W_V))

  const dk = W_K[0].length
  const scale = 1 / Math.sqrt(dk)

  const rows = q.map((qi, i) => {
    const raw = k.map(kj => dot(qi, kj))
    const scaled = raw.map((s, j) => (causal && j > i ? null : s * scale))
    const weights = softmax(scaled)
    const terms = weights.map((w, j) => scaleVec(v[j], w))
    return { i, word: words[i], q: qi, raw, scaled, weights, terms, out: sumVecs(terms) }
  })

  return { words, x, q, k, v, rows, dk, scale, causal }
}

/* ---- what several heads look like ---------------------------------------- */

export interface Head {
  name: string
  /** What the head appears to be tracking, in words. */
  reads: string
  /** One row of weights per query position, over `LONG_SENTENCE`. */
  weights: number[][]
}

/**
 * Four heads over `LONG_SENTENCE`, hand-drawn.
 *
 * These are *not* computed — they are caricatures of patterns that show up
 * repeatedly in published attention visualisations: a positional head, a
 * syntactic head, a coreference head, and one that mostly declines to look
 * anywhere, which is a real and under-advertised finding.
 *
 * Drawn rather than trained because a four-dimensional toy model does not
 * produce interpretable heads, and a slide claiming otherwise would be lying.
 * Every widget that uses this says so on the slide.
 */
export const HEADS: Head[] = [
  {
    name: 'head 1',
    reads: 'the previous word',
    weights: [
      [1.00, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.82, 0.18, 0, 0, 0, 0, 0, 0, 0],
      [0.09, 0.80, 0.11, 0, 0, 0, 0, 0, 0],
      [0.04, 0.08, 0.78, 0.10, 0, 0, 0, 0, 0],
      [0.03, 0.05, 0.06, 0.80, 0.06, 0, 0, 0, 0],
      [0.02, 0.04, 0.05, 0.06, 0.78, 0.05, 0, 0, 0],
      [0.02, 0.03, 0.04, 0.04, 0.06, 0.76, 0.05, 0, 0],
      [0.02, 0.03, 0.03, 0.03, 0.04, 0.06, 0.75, 0.04, 0],
      [0.01, 0.02, 0.03, 0.03, 0.04, 0.04, 0.06, 0.73, 0.04],
    ],
  },
  {
    name: 'head 2',
    reads: 'the nearest noun',
    weights: [
      [1.00, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.14, 0.86, 0, 0, 0, 0, 0, 0, 0],
      [0.05, 0.84, 0.11, 0, 0, 0, 0, 0, 0],
      [0.06, 0.10, 0.08, 0.76, 0, 0, 0, 0, 0],
      [0.03, 0.06, 0.05, 0.79, 0.07, 0, 0, 0, 0],
      [0.03, 0.22, 0.09, 0.05, 0.56, 0.05, 0, 0, 0],
      [0.02, 0.31, 0.06, 0.03, 0.50, 0.04, 0.04, 0, 0],
      [0.02, 0.28, 0.05, 0.03, 0.47, 0.04, 0.08, 0.03, 0],
      [0.02, 0.34, 0.05, 0.02, 0.41, 0.03, 0.09, 0.02, 0.02],
    ],
  },
  {
    name: 'head 3',
    reads: 'what a pronoun refers to',
    weights: [
      [1.00, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.50, 0.50, 0, 0, 0, 0, 0, 0, 0],
      [0.33, 0.34, 0.33, 0, 0, 0, 0, 0, 0],
      [0.25, 0.25, 0.25, 0.25, 0, 0, 0, 0, 0],
      [0.20, 0.20, 0.20, 0.20, 0.20, 0, 0, 0, 0],
      [0.10, 0.24, 0.14, 0.08, 0.34, 0.10, 0, 0, 0],
      [0.02, 0.62, 0.03, 0.02, 0.24, 0.03, 0.04, 0, 0],
      [0.03, 0.54, 0.04, 0.02, 0.26, 0.03, 0.05, 0.03, 0],
      [0.02, 0.58, 0.03, 0.02, 0.22, 0.03, 0.07, 0.01, 0.02],
    ],
  },
  {
    name: 'head 4',
    reads: 'almost nothing — it parks on token 1',
    weights: [
      [1.00, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.93, 0.07, 0, 0, 0, 0, 0, 0, 0],
      [0.90, 0.05, 0.05, 0, 0, 0, 0, 0, 0],
      [0.89, 0.04, 0.04, 0.03, 0, 0, 0, 0, 0],
      [0.88, 0.03, 0.03, 0.03, 0.03, 0, 0, 0, 0],
      [0.87, 0.03, 0.03, 0.02, 0.03, 0.02, 0, 0, 0],
      [0.86, 0.03, 0.02, 0.02, 0.03, 0.02, 0.02, 0, 0],
      [0.85, 0.03, 0.02, 0.02, 0.03, 0.02, 0.02, 0.01, 0],
      [0.84, 0.03, 0.02, 0.02, 0.03, 0.02, 0.02, 0.01, 0.01],
    ],
  },
]

/* ---- parameter counts ---------------------------------------------------- */

/**
 * Weights in one multi-head attention sub-layer.
 *
 * Four square matrices — W_Q, W_K, W_V and W_O — so `4 d²`, and the head count
 * does **not** appear: h heads of width d/h cost exactly what one head of width
 * d costs. That is the fact the parameter-count slide is built on.
 */
export function attentionParams(dModel: number, bias = false): number {
  return 4 * dModel * dModel + (bias ? 4 * dModel : 0)
}

/** Weights in the position-wise feed-forward network, which defaults to 4x wide. */
export function ffnParams(dModel: number, dFf = 4 * dModel, bias = true): number {
  return 2 * dModel * dFf + (bias ? dFf + dModel : 0)
}

/**
 * One encoder block: attention + FFN + two LayerNorms.
 *
 * The ratio is the point — the feed-forward network holds two thirds of a
 * block's weights, which surprises everyone who has just spent an hour on
 * attention.
 */
export function blockParams(dModel: number, dFf = 4 * dModel): number {
  return attentionParams(dModel) + ffnParams(dModel, dFf) + 4 * dModel
}
