/**
 * Data for the `transformer-v2` deck, which follows Jay Alammar's
 * *The Illustrated Transformer* (2018) and keeps its three examples:
 *
 *   - "Thinking Machines": self-attention by hand. Two words, d_model = 4,
 *     two heads so d_k = d_v = 2 (the paper: 512, eight heads, 64).
 *   - "The animal didn't cross the street because it was too tired": what
 *     the word *it* reads, with two heads. The weights are drawn, not
 *     trained, and the deck says so.
 *   - "je suis étudiant" → "i am a student": decoding and the loss, over the
 *     post's six-word output vocabulary.
 *
 * Every number the slides print is computed here or re-derived by hand in
 * TODO/plan_slideset_transformer-v2.md. Change one and the slides go stale.
 */
import { dot, project, softmax } from './useAttention'

export const TM_WORDS = ['Thinking', 'Machines'] as const

/** One embedding per word, d_model = 4. */
export const TM_X: number[][] = [
  [1, 0, 1, 0],
  [0, 1, 0, 1],
]

/** 4 × 2 each: one head's projections. */
export const TM_WQ: number[][] = [[1, 0], [0, 1], [0, 1], [0, 0]]
export const TM_WK: number[][] = [[1, 1], [1, 0], [1, 1], [0, 0]]
export const TM_WV: number[][] = [[2, 0], [0, 2], [0, 0], [0, 0]]
export const TM_DK = 2

export interface TmRow {
  word: string
  q: number[]
  raw: number[]
  scaled: number[]
  weights: number[]
  terms: number[][]
  z: number[]
}

export function thinkingMachines() {
  const q = TM_X.map(x => project(x, TM_WQ))
  const k = TM_X.map(x => project(x, TM_WK))
  const v = TM_X.map(x => project(x, TM_WV))
  const rows: TmRow[] = q.map((qi, i) => {
    const raw = k.map(kj => dot(qi, kj))
    const scaled = raw.map(s => s / Math.sqrt(TM_DK))
    const weights = softmax(scaled)
    const terms = v.map((vj, j) => vj.map(n => n * weights[j]))
    const z = terms[0].map((_, d) => terms.reduce((s, t) => s + t[d], 0))
    return { word: TM_WORDS[i], q: qi, raw, scaled, weights, terms, z }
  })
  return { q, k, v, rows }
}

/* ------------------------------------------------------------------ */

export const IT_SENTENCE = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired']
export const IT_QUERY = 7

/**
 * Two drawn heads, one row per query word (11 × 11). Only the row for *it*
 * carries the story; the other rows are plausible, not trained. Each row is
 * normalised at load so it sums to exactly 1.
 */
function normalise(rows: number[][]): number[][] {
  return rows.map((r) => {
    const s = r.reduce((a, b) => a + b, 0)
    return r.map(n => n / s)
  })
}

function local(i: number, peak: number, spread: number[]): number[] {
  return IT_SENTENCE.map((_, j) => (j === i ? peak : (spread[Math.abs(j - i)] ?? 0.02)))
}

/** Head 1: who is *it*? Nouns, and above all *animal*. */
const HEAD_1_RAW: number[][] = IT_SENTENCE.map((_, i) => local(i, 0.4, [0.4, 0.2, 0.08]))
HEAD_1_RAW[IT_QUERY] = [0.05, 0.55, 0.03, 0.03, 0.04, 0.12, 0.04, 0.08, 0.02, 0.02, 0.02]

/** Head 2: what is said about *it*? The description, *tired*. */
const HEAD_2_RAW: number[][] = IT_SENTENCE.map((_, i) => local(i, 0.2, [0.2, 0.3, 0.1]))
HEAD_2_RAW[IT_QUERY] = [0.02, 0.08, 0.02, 0.02, 0.02, 0.03, 0.04, 0.12, 0.10, 0.10, 0.45]

export const IT_HEADS: number[][][] = [normalise(HEAD_1_RAW), normalise(HEAD_2_RAW)]

/* ------------------------------------------------------------------ */

export const VOCAB6 = ['a', 'am', 'i', 'thanks', 'student', '⟨eos⟩'] as const
export const SOURCE = ['je', 'suis', 'étudiant'] as const
/** The target, as indices into VOCAB6: i am a student ⟨eos⟩. */
export const TARGET = [2, 1, 0, 4, 5]

/** A trained model's output, one distribution per output position. */
export const TRAINED: number[][] = [
  [0.08, 0.04, 0.80, 0.03, 0.03, 0.02],
  [0.10, 0.75, 0.05, 0.03, 0.05, 0.02],
  [0.70, 0.05, 0.04, 0.03, 0.15, 0.03],
  [0.05, 0.03, 0.03, 0.02, 0.85, 0.02],
  [0.015, 0.015, 0.015, 0.015, 0.04, 0.90],
]

/** An untrained model: every word equally likely. */
export const UNTRAINED: number[][] = TARGET.map(() => VOCAB6.map(() => 1 / 6))

/** Cross-entropy of one position: −log of the probability on the right word. */
export function positionLoss(dist: number[], target: number): number {
  return -Math.log(dist[target])
}
