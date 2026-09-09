/**
 * The image and the hand-written filters behind FeatureMapLab.
 *
 * They live here rather than as prop defaults because Vue's `withDefaults`
 * cannot reference bindings declared inside `<script setup>` — and because the
 * numbers matter: the bright square is chosen so that every filter in the bank
 * answers in exact integers a lecture hall can check by hand.
 */

/** A bright 5x5 square on a dark 9x9 frame. Values are 0-9, read as brightness. */
export const BRIGHT_SQUARE: number[][] = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => (r >= 2 && r <= 6 && c >= 2 && c <= 6 ? 9 : 0)))

export interface NamedFilter {
  id: string
  label: string
  kernel: number[][]
}

/**
 * Three of the kernels computer vision hand-wrote for fifty years. On the square
 * above, the edge filters answer 0, ±9, ±18 or ±27 and nothing else, and the
 * blur answers 0-9 — so the feature map can be read aloud.
 */
export const CLASSIC_FILTERS: NamedFilter[] = [
  { id: 'vertical', label: 'vertical edge', kernel: [[1, 0, -1], [1, 0, -1], [1, 0, -1]] },
  { id: 'horizontal', label: 'horizontal edge', kernel: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]] },
  {
    id: 'blur',
    label: 'blur (average)',
    kernel: Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => 1 / 9)),
  },
]
