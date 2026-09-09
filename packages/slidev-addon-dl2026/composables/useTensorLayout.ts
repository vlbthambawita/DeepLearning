/**
 * Laying a tensor of any rank out on a flat page.
 *
 * A rank-n tensor is a row (or a column) of rank-(n-1) tensors, so the layout
 * is recursive: place the innermost dimension along x, the next one along y,
 * and keep alternating outwards. The last two dimensions therefore always come
 * out as the matrix a student expects — rows down, columns across — and the
 * dimensions outside them read as groups of matrices.
 *
 * Two widgets need this (`TensorLadder`, `ReshapeLab`) and both need the same
 * flat index per cell, because row-major order is the thing being taught.
 */

export interface TensorCell {
  x: number
  y: number
  w: number
  h: number
  /** Position in memory: the tensor is stored row-major, innermost dim fastest. */
  flat: number
  /** Multi-index, outermost dimension first. */
  index: number[]
}

export interface TensorFrame {
  x: number
  y: number
  w: number
  h: number
  /** 0 for the whole tensor, 1 for its immediate children, and so on. */
  depth: number
}

export interface TensorLayout {
  width: number
  height: number
  cells: TensorCell[]
  frames: TensorFrame[]
}

export interface LayoutOptions {
  /** Side of one element, in SVG user units. */
  cell?: number
  /** Space between neighbouring elements. Outer dimensions get more. */
  gap?: number
  /** Extra room inside a group frame, so the outline clears its contents. */
  framePad?: number
}

/**
 * Which axis dimension `i` of a rank-`rank` tensor is drawn along.
 *
 * Measured from the innermost dimension so that shape (3, 4) is three rows of
 * four whatever it is nested inside: the last dimension is always horizontal.
 */
function axisOf(i: number, rank: number): 'x' | 'y' {
  return (rank - 1 - i) % 2 === 0 ? 'x' : 'y'
}

export function layoutTensor(dims: number[], options: LayoutOptions = {}): TensorLayout {
  const cell = options.cell ?? 22
  const gap = options.gap ?? 3
  const framePad = options.framePad ?? 4

  const rank = dims.length
  const cells: TensorCell[] = []
  const frames: TensorFrame[] = []

  /**
   * Strides in elements, so a cell's flat index is the dot product of its
   * multi-index with this — which is exactly what `t.stride()` reports.
   */
  const strides: number[] = Array.from({ length: rank }, () =>
    1).map((_, i) => dims.slice(i + 1).reduce((a, b) => a * b, 1))

  /** Size of the block drawn for dimensions `depth…rank-1`. */
  function sizeAt(depth: number): { w: number, h: number } {
    if (depth >= rank)
      return { w: cell, h: cell }

    const child = sizeAt(depth + 1)
    const n = dims[depth]
    // Outer dimensions are separated more, so the grouping is visible without
    // relying on the frame outlines alone.
    const step = gap * (1 + (rank - 1 - depth))
    const pad = depth === rank - 1 ? 0 : framePad * 2

    if (axisOf(depth, rank) === 'x')
      return { w: n * child.w + (n - 1) * step + pad, h: child.h + pad }

    return { w: child.w + pad, h: n * child.h + (n - 1) * step + pad }
  }

  function place(depth: number, x: number, y: number, index: number[]) {
    if (depth >= rank) {
      cells.push({
        x,
        y,
        w: cell,
        h: cell,
        flat: index.reduce((sum, v, i) => sum + v * strides[i], 0),
        index: [...index],
      })
      return
    }

    const child = sizeAt(depth + 1)
    const n = dims[depth]
    const step = gap * (1 + (rank - 1 - depth))
    const inset = depth === rank - 1 ? 0 : framePad

    if (depth < rank - 1) {
      const here = sizeAt(depth)
      frames.push({ x, y, w: here.w, h: here.h, depth })
    }

    for (let i = 0; i < n; i++) {
      const dx = axisOf(depth, rank) === 'x' ? i * (child.w + step) : 0
      const dy = axisOf(depth, rank) === 'y' ? i * (child.h + step) : 0
      place(depth + 1, x + inset + dx, y + inset + dy, [...index, i])
    }
  }

  const size = sizeAt(0)
  place(0, 0, 0, [])

  return { width: size.w, height: size.h, cells, frames }
}

/** `(3, 4)` — the way PyTorch prints a shape, including the rank-1 comma. */
export function formatShape(dims: number[]): string {
  if (dims.length === 0)
    return '()'
  if (dims.length === 1)
    return `(${dims[0]},)`
  return `(${dims.join(', ')})`
}

/** `t[1, 2]`, or `t.item()` for a scalar, which has no index to give. */
export function formatIndex(index: number[]): string {
  return index.length === 0 ? 't.item()' : `t[${index.join(', ')}]`
}
