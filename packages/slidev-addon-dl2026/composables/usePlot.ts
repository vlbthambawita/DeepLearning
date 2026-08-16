import type { InjectionKey, Ref } from 'vue'
import { inject } from 'vue'

/**
 * The coordinate transform a `<Plot2D>` hands down to its children.
 *
 * Marks (`PlotCurve`, `PlotPoints`, …) are written in *data* coordinates and
 * converted here, so a widget never has to think in pixels — which matters
 * because these plots are re-used at very different sizes across slides.
 */
export interface PlotScale {
  /** Data x → SVG x. */
  sx: (x: number) => number
  /** Data y → SVG y (flipped: larger y is higher on screen). */
  sy: (y: number) => number
  /** SVG x → data x, for pointer interaction. */
  ix: (px: number) => number
  /** SVG y → data y. */
  iy: (py: number) => number
  xDomain: Ref<[number, number]>
  yDomain: Ref<[number, number]>
  inner: Ref<{ x: number, y: number, width: number, height: number }>
}

export const PLOT_KEY: InjectionKey<PlotScale> = Symbol('dl-plot')

export function usePlot(): PlotScale {
  const plot = inject(PLOT_KEY, null)
  if (!plot)
    throw new Error('This component must be used inside a <Plot2D>')
  return plot
}

/**
 * Tick values at 1/2/5×10^n steps covering a domain.
 *
 * Evenly dividing a domain into n parts gives ticks like 0.3333; students read
 * axes, so the steps need to be numbers a person would choose.
 */
export function niceTicks(min: number, max: number, target = 6): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max)
    return [min]

  const rawStep = (max - min) / Math.max(target, 1)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalised = rawStep / magnitude
  const step = (normalised >= 5 ? 10 : normalised >= 2 ? 5 : normalised >= 1 ? 2 : 1) * magnitude

  const ticks: number[] = []
  const start = Math.ceil(min / step) * step
  // Nudge the end by a fraction of a step so a tick landing exactly on `max`
  // is not dropped by floating-point drift.
  for (let v = start; v <= max + step * 1e-9; v += step)
    ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v)

  return ticks
}

/** Compact tick label: no trailing zeros, no exponent soup at normal scales. */
export function formatTick(value: number): string {
  if (value === 0)
    return '0'
  const abs = Math.abs(value)
  if (abs >= 1e5 || abs < 1e-4)
    return value.toExponential(0)
  return String(Number(value.toFixed(6)))
}
