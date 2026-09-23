/**
 * Tiny pixel images for the slides that need to *show* data rather than
 * describe it: a clean sample, the same sample half-noised, two shifted copies
 * averaged into a blur, a grid of six different samples next to a grid of one
 * sample repeated.
 *
 * Every picture is a 12×12 bitmap plus a deterministic transform, so the live
 * slide, the PDF export and the next reload all show the same pixels. Nothing
 * here is trained — these are illustrations of what the data looks like, and
 * the slides say so where it matters.
 */
import { seededGaussian } from './useRandom'
import { transposeCoverage } from './useGenerative'

export const PIXEL_SIZE = 12

/** '#' is ink, '+' is half ink, anything else is background. */
const BITMAPS: Record<string, string[]> = {
  smiley: [
    '....####....',
    '..##....##..',
    '.#........#.',
    '.#..#..#..#.',
    '#...#..#...#',
    '#..........#',
    '#..........#',
    '#..#....#..#',
    '.#..####..#.',
    '.#........#.',
    '..##....##..',
    '....####....',
  ],
  heart: [
    '............',
    '..##....##..',
    '.####..####.',
    '############',
    '############',
    '############',
    '.##########.',
    '..########..',
    '...######...',
    '....####....',
    '.....##.....',
    '............',
  ],
  star: [
    '.....##.....',
    '.....##.....',
    '....####....',
    '....####....',
    '############',
    '.##########.',
    '..########..',
    '...######...',
    '...######...',
    '..###..###..',
    '..##....##..',
    '.#........#.',
  ],
  house: [
    '.....##.....',
    '....####....',
    '...######...',
    '..########..',
    '.##########.',
    '############',
    '.#........#.',
    '.#.##..##.#.',
    '.#.##..##.#.',
    '.#.....##.#.',
    '.#.....##.#.',
    '.##########.',
  ],
  moon: [
    '....####....',
    '..#####.....',
    '.#####......',
    '.####.......',
    '#####.......',
    '#####.......',
    '#####.......',
    '#####.......',
    '.####.......',
    '.#####......',
    '..#####.....',
    '....####....',
  ],
  tree: [
    '.....##.....',
    '....####....',
    '...######...',
    '..########..',
    '....####....',
    '...######...',
    '..########..',
    '.##########.',
    '.....##.....',
    '.....##.....',
    '.....##.....',
    '....####....',
  ],
}

export const PIXEL_PATTERNS = Object.keys(BITMAPS)

function bitmap(name: string): number[][] {
  const rows = BITMAPS[name] ?? BITMAPS.smiley
  return rows.map(r => [...r].map(c => (c === '#' ? 1 : c === '+' ? 0.5 : 0)))
}

/**
 * The per-cell shading of a transposed convolution's output: how many kernel
 * taps land on each cell, from the same arithmetic `TransposeConvLab` uses.
 * `checker:3:2` is kernel 3, stride 2 — the checkerboard; `checker:4:2` is even.
 */
function checker(kernel: number, stride: number): number[][] {
  // Enough input cells that the 12×12 crop sits entirely in the interior, where
  // every cell has a full neighbourhood and the counts are the artefact itself.
  const { counts } = transposeCoverage(PIXEL_SIZE + kernel, kernel, stride)
  const off = kernel - 1
  const crop = counts.slice(off, off + PIXEL_SIZE).map(r => r.slice(off, off + PIXEL_SIZE))
  const max = Math.max(...crop.flat())
  // Shade into [0.12, 0.62] so an even layer reads as a flat mid-tone, not solid ink.
  return crop.map(r => r.map(v => 0.12 + 0.5 * (v / max)))
}

export interface PixelOptions {
  /** 0 is the clean image, 1 is pure noise — the diffusion mix, x_t = √ᾱ·x + √(1−ᾱ)·ε. */
  noise?: number
  seed?: number
  /** Horizontal shifts to average over. [-1, 1] is "two plausible images, averaged". */
  shifts?: number[]
}

export function pixelImage(pattern: string, opts: PixelOptions = {}): number[][] {
  const { noise = 0, seed = 7, shifts = [0] } = opts
  let base: number[][]
  if (pattern === 'noise') {
    base = Array.from({ length: PIXEL_SIZE }, () => new Array(PIXEL_SIZE).fill(0.5))
  }
  else if (pattern.startsWith('checker:')) {
    const [, k, s] = pattern.split(':').map(Number)
    base = checker(k, s)
  }
  else {
    const img = bitmap(pattern)
    base = img.map((row, i) => row.map((_, j) => {
      let sum = 0
      for (const dx of shifts) {
        const jj = j - dx
        sum += jj >= 0 && jj < PIXEL_SIZE ? img[i][jj] : 0
      }
      return sum / shifts.length
    }))
  }

  const amount = pattern === 'noise' ? 1 : Math.min(Math.max(noise, 0), 1)
  if (amount === 0)
    return base

  const g = seededGaussian(seed)
  const keep = Math.sqrt(1 - amount)
  const mix = Math.sqrt(amount)
  return base.map(row => row.map((v) => {
    // Work in [-1, 1], where the diffusion mix keeps unit variance, then map back.
    const x = keep * (2 * v - 1) + mix * g()
    return Math.min(Math.max((x + 1) / 2, 0), 1)
  }))
}
