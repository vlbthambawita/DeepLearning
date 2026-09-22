/**
 * The numbers behind lecture 07.
 *
 * One running example serves the whole deck, so that no two widgets can
 * disagree about a figure in front of a lecture hall — the same habit
 * `useAttention.ts` established for lecture 06.
 *
 * The example is **three modes**. It shows up in two guises that are deliberately
 * the same thing:
 *
 *   - as a *distribution* over three bins (§03, §04) — the GAN value function,
 *     the optimal discriminator, and the four divergences, all of which come out
 *     as exact fractions on this example;
 *   - as three *blobs in the plane* (§01, §02, §05) — so an autoencoder's latent
 *     holes, a VAE's filled latent and a diffusion trajectory are all pictures of
 *     the same data.
 *
 * Every number in the deck's speaker notes was produced by the functions below.
 */
import { seededGaussian, seededRandom } from './useRandom'

// ---------------------------------------------------------------------------
// The running example, as a distribution over three bins
// ---------------------------------------------------------------------------

/** The real data: three modes, equally common. */
export const P_REAL = [1 / 3, 1 / 3, 1 / 3]

/** The generator early in training — over-producing mode 2, short on 1 and 3. */
export const Q_START = [0.2, 0.5, 0.3]

/** Two collapsed generators. JS cannot tell them apart; earth-mover can. */
export const Q_COLLAPSE_MID = [0, 1, 0]
export const Q_COLLAPSE_END = [0, 0, 1]

export const MODE_LABELS = ['1', '2', '3']

/** Renormalise a set of non-negative weights, tolerating an all-zero input. */
export function normalise(q: number[]): number[] {
  const total = q.reduce((a, b) => a + b, 0)
  return total > 0 ? q.map(v => v / total) : q.map(() => 1 / q.length)
}

/**
 * The optimal discriminator, D*(x) = P(x) / (P(x) + Q(x)).
 *
 * Goodfellow et al. (2014), Proposition 1. This is the *best possible* classifier
 * against a fixed generator, not the one you actually train — which is the point
 * of the slide: it exists, it is this, and it depends on nothing but the two
 * distributions.
 *
 * On the running example it is exactly 5/8, 2/5, 10/19.
 */
export function optimalD(p: number[], q: number[]): number[] {
  return p.map((pi, i) => (pi + q[i] > 0 ? pi / (pi + q[i]) : 0.5))
}

/**
 * The value function V = E_P[log D(x)] + E_Q[log(1 - D(x))], in nats.
 *
 * Bins where the relevant density is zero contribute nothing: the expectation is
 * taken under that density, so `0 · log 0` is 0 and not NaN.
 */
export function valueFunction(p: number[], q: number[], d: number[]): number {
  let v = 0
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 0)
      v += p[i] * Math.log(Math.max(d[i], 1e-12))
    if (q[i] > 0)
      v += q[i] * Math.log(Math.max(1 - d[i], 1e-12))
  }
  return v
}

// ---------------------------------------------------------------------------
// Four ways to say two distributions differ
// ---------------------------------------------------------------------------

/**
 * All divergences here are in **nats** (natural log).
 *
 * The 2025 deck quotes KL = 0.101 and JS = 0.0248 for this same example, which
 * are the *bits* values — the same quantities divided by ln 2. Nats are what
 * make -log 4 come out of the GAN theorem, so the deck uses them throughout and
 * says so on the slide.
 */
export function kl(p: number[], q: number[]): number {
  let sum = 0
  for (let i = 0; i < p.length; i++) {
    if (p[i] <= 0)
      continue
    // KL is infinite where P has mass and Q has none. A collapsed generator hits
    // this on two of three bins, which is exactly why the GAN objective uses JS
    // and not KL — so it is reported rather than clamped away.
    if (q[i] <= 0)
      return Number.POSITIVE_INFINITY
    sum += p[i] * Math.log(p[i] / q[i])
  }
  return sum
}

/** Jensen–Shannon: symmetric, always finite, and capped at ln 2. */
export function js(p: number[], q: number[]): number {
  const m = p.map((pi, i) => (pi + q[i]) / 2)
  return (kl(p, m) + kl(q, m)) / 2
}

/** Total variation as the 2025 deck defines it: the largest single-bin gap. */
export function tv(p: number[], q: number[]): number {
  return Math.max(...p.map((pi, i) => Math.abs(pi - q[i])))
}

/**
 * Earth-mover (1-Wasserstein) distance on bins spaced one apart.
 *
 * On a line this is the area between the two CDFs, which is both the standard
 * closed form and the reason EM knows something JS does not: moving mass from
 * bin 3 to bin 1 costs twice what moving it to bin 2 costs, because it is twice
 * as far. JS has no notion of "far".
 */
export function em(p: number[], q: number[]): number {
  let cp = 0
  let cq = 0
  let cost = 0
  for (let i = 0; i < p.length - 1; i++) {
    cp += p[i]
    cq += q[i]
    cost += Math.abs(cp - cq)
  }
  return cost
}

/** Everything the divergence slide reports about one generator, in one object. */
export function scoreGenerator(p: number[], q: number[]) {
  const d = optimalD(p, q)
  const jsd = js(p, q)
  return {
    d,
    v: valueFunction(p, q, d),
    /** The theorem's prediction, which must equal `v`. */
    vTheory: -Math.log(4) + 2 * jsd,
    tv: tv(p, q),
    klPQ: kl(p, q),
    klQP: kl(q, p),
    js: jsd,
    em: em(p, q),
  }
}

// ---------------------------------------------------------------------------
// The same three modes, as blobs in the plane
// ---------------------------------------------------------------------------

export interface Point { x: number, y: number }

/**
 * Mode centres, placed on a shallow arc.
 *
 * The arc matters: it means a *one-dimensional* latent can order the three modes
 * along it, so the undercomplete autoencoder in §01 has something sensible to
 * learn and its reconstruction curve is visibly a curve rather than a straight
 * line through the middle of everything.
 */
export const MODE_CENTRES: Point[] = [
  { x: -2.3, y: 0.75 },
  { x: 0, y: -1.05 },
  { x: 2.3, y: 0.75 },
]

/*
 * Tight enough that the three modes read as three separate clusters rather than
 * one smear. It matters for §01: the gaps in the autoencoder's latent are only
 * convincing if the clusters they sit between are visibly distinct.
 */
const MODE_SPREAD = 0.3

/**
 * Sample the real data: `perMode` points around each centre.
 *
 * Seeded, because a scatter that reshuffles on reload is impossible to talk over
 * and would make the PDF export disagree with the live slide.
 */
export function sampleData(perMode = 26, seed = 20260301): Point[] {
  const g = seededGaussian(seed)
  const out: Point[] = []
  for (const c of MODE_CENTRES) {
    for (let i = 0; i < perMode; i++)
      out.push({ x: c.x + g() * MODE_SPREAD, y: c.y + g() * MODE_SPREAD })
  }
  return out
}

/**
 * Sample from a *generator* that puts weight `q[k]` on mode `k`.
 *
 * Used to draw mode collapse: with q = [0, 1, 0] every sample lands on the
 * middle blob and the other two are visibly empty.
 */
export function sampleGenerator(q: number[], n = 78, seed = 991): Point[] {
  const w = normalise(q)
  const pick = seededRandom(seed)
  const g = seededGaussian(seed + 7)
  const cum = w.map((_, i) => w.slice(0, i + 1).reduce((a, b) => a + b, 0))
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const u = pick()
    const k = Math.min(cum.findIndex(c => u <= c), MODE_CENTRES.length - 1)
    const c = MODE_CENTRES[Math.max(k, 0)]
    out.push({ x: c.x + g() * MODE_SPREAD, y: c.y + g() * MODE_SPREAD })
  }
  return out
}

// ---------------------------------------------------------------------------
// The autoencoder's curve
// ---------------------------------------------------------------------------

/**
 * The decoder of a one-dimensional autoencoder, written out rather than trained.
 *
 * A network trained on this data with a 1-D bottleneck learns a curve through
 * the three blobs; the parabola through the three centres *is* that curve, to
 * the accuracy anyone can see on a slide. Writing it down keeps the widget
 * deterministic, instant, and honest — the slide says out loud that this is the
 * curve such a model converges to, not a live training run.
 *
 * z is the latent coordinate, and the parabola y = a·z² + c is fitted so that
 * z = -1, 0, 1 land exactly on the three mode centres.
 */
export function decode1D(z: number): Point {
  const x = z * MODE_CENTRES[2].x
  const a = (MODE_CENTRES[2].y - MODE_CENTRES[1].y)
  return { x, y: a * z * z + MODE_CENTRES[1].y }
}

/** The matching encoder: where along the curve does this point sit? */
export function encode1D(p: Point): number {
  return p.x / MODE_CENTRES[2].x
}

/** The reconstruction an undercomplete autoencoder produces for a point. */
export function reconstruct1D(p: Point): Point {
  return decode1D(encode1D(p))
}

/**
 * The *aggregate posterior*: every training point's latent code, in one array.
 *
 * This is the slide of §01. It is three clumps around z = -1, 0, 1 with two
 * gaps, and the gaps are why decoding a fresh z produces something that is not
 * data — the encoder was only ever asked to be invertible, never to *fill* the
 * latent space.
 */
export function latentCodes(data: Point[]): number[] {
  return data.map(encode1D)
}

/**
 * The widest empty stretches of the latent axis, widest first.
 *
 * Computed from the codes rather than written down, so the probes a widget
 * offers can never drift out of step with the data they are probing.
 */
export function latentGaps(codes: number[], count = 2): number[] {
  const sorted = [...codes].sort((a, b) => a - b)
  const gaps = sorted.slice(1).map((z, i) => ({ mid: (z + sorted[i]) / 2, width: z - sorted[i] }))
  return gaps.sort((a, b) => b.width - a.width).slice(0, count).map(g => g.mid)
}

/**
 * A VAE's latent, as a function of how hard the KL term is pulling.
 *
 * `beta` = 0 is the plain autoencoder: the codes stay where they are, holes and
 * all. As `beta` grows the aggregate posterior is squeezed toward N(0, 1) and
 * the gaps close — at the cost of codes from different modes being pushed into
 * each other, which is the blurring.
 *
 * The squeeze is a rank transform toward the Gaussian quantiles, which is what
 * a well-trained VAE's aggregate posterior approaches and is monotone, so the
 * ordering of the modes along the latent is never scrambled.
 */
export function vaeLatent(codes: number[], beta: number): number[] {
  const order = codes.map((z, i) => ({ z, i })).sort((a, b) => a.z - b.z)
  const target = new Array<number>(codes.length)
  for (let r = 0; r < order.length; r++) {
    // Gaussian quantile at the rank's plotting position.
    target[order[r].i] = probit((r + 0.5) / order.length)
  }
  const t = Math.min(Math.max(beta, 0), 1)
  return codes.map((z, i) => z * (1 - t) + target[i] * t)
}

/**
 * How much noise the encoder's posterior carries at a given β.
 *
 * A VAE encodes a *distribution*, not a point, and the KL term's whole effect on
 * reconstruction is that it widens that distribution: at β = 0 the code is a
 * point and reconstruction is as sharp as an autoencoder's; as β grows the
 * decoder is asked to reconstruct from a code that has been jittered, so the
 * best it can do is the average of everything that jitter could have meant.
 *
 * That average is the blur. It is not an implementation detail of VAEs — it is
 * the objective working as specified.
 */
export function posteriorSigma(beta: number): number {
  return 0.4 * Math.min(Math.max(beta, 0), 1)
}

/**
 * The decoder that goes with `vaeLatent`: latent coordinate back to a base code.
 *
 * Joint training moves the encoder and the decoder together, so a widget that
 * squeezes the codes and leaves the decoder where it was would be showing a
 * model nobody trained. This is the matching inverse, blended by the same β, so
 * at β = 1 every z the prior can produce lands somewhere the decoder understands
 * and at β = 0 it is the plain autoencoder again.
 */
export function priorToBase(sortedBase: number[], z: number, beta: number): number {
  const t = Math.min(Math.max(beta, 0), 1)
  if (t <= 0)
    return z
  const u = normalCdf(z)
  const idx = Math.min(Math.max(Math.round(u * sortedBase.length - 0.5), 0), sortedBase.length - 1)
  return z * (1 - t) + sortedBase[idx] * t
}

/** Decode a latent coordinate under the β-blended decoder. */
export function decodeVae(sortedBase: number[], z: number, beta: number): Point {
  return decode1D(priorToBase(sortedBase, z, beta))
}

/**
 * KL from the *aggregate posterior* to the prior, on a grid.
 *
 * The aggregate posterior is the mixture of every training point's encoded
 * Gaussian, which is the thing that has to match N(0, 1) for sampling to work —
 * and the thing whose holes make an autoencoder unsamplable. A tiny floor on σ
 * keeps β = 0 drawable as three narrow spikes rather than three infinities.
 */
export function aggregatePosterior(mus: number[], sigma: number, grid: number[]): number[] {
  const s = Math.max(sigma, 0.035)
  return grid.map((z) => {
    let d = 0
    for (const m of mus)
      d += Math.exp((-((z - m) ** 2)) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))
    return d / mus.length
  })
}

/** Grid KL between the aggregate posterior and N(0, 1). */
export function posteriorGap(mus: number[], sigma: number, span = 3.4, bins = 140): number {
  const grid = Array.from({ length: bins }, (_, i) => -span + (2 * span * (i + 0.5)) / bins)
  const step = (2 * span) / bins
  const q = aggregatePosterior(mus, sigma, grid)
  const total = q.reduce((a, b) => a + b, 0) * step
  let sum = 0
  for (let i = 0; i < bins; i++) {
    const qi = (q[i] * step) / Math.max(total, 1e-12)
    if (qi <= 0)
      continue
    const pi = Math.exp((-grid[i] * grid[i]) / 2) / Math.sqrt(2 * Math.PI) * step
    sum += qi * Math.log(qi / Math.max(pi, 1e-12))
  }
  return sum
}

/** Inverse standard normal CDF — Acklam's rational approximation. */
export function probit(p: number): number {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
    3.754408661907416e+00]
  const pLow = 0.02425
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
    / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/**
 * How far the aggregate posterior is from N(0, 1), as the widget's readout.
 *
 * Binned rather than moment-matched on purpose. An autoencoder's codes can have
 * mean 0 and variance 1 and still be three clumps with two gaps between them —
 * matching the first two moments is not the same as matching the distribution,
 * and it is precisely the gaps that make a sampled z decode to nothing. A
 * histogram against the standard normal is what sees them.
 */
export function latentGaussianGap(codes: number[], bins = 24, span = 3.2): number {
  const width = (2 * span) / bins
  const counts = new Array<number>(bins).fill(0)
  for (const z of codes) {
    const b = Math.floor((z + span) / width)
    if (b >= 0 && b < bins)
      counts[b] += 1
  }
  const total = counts.reduce((a, b) => a + b, 0) || 1

  let sum = 0
  for (let b = 0; b < bins; b++) {
    const lo = -span + b * width
    const target = normalCdf(lo + width) - normalCdf(lo)
    const observed = counts[b] / total
    if (observed <= 0)
      continue
    sum += observed * Math.log(observed / Math.max(target, 1e-9))
  }
  return sum
}

/** Standard normal CDF, via the Abramowitz–Stegun error function. */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2)
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937
    + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? 1 - p : p
}

// ---------------------------------------------------------------------------
// Diffusion over the same three blobs
// ---------------------------------------------------------------------------

/**
 * A linear beta schedule and its cumulative products, as in Ho et al. (2020).
 *
 * `alphaBar[t]` is the ᾱ_t of the closed form
 *
 *     x_t = √ᾱ_t · x_0 + √(1 - ᾱ_t) · ε
 *
 * which is the slide that matters in §05: you can jump to *any* noise level in
 * one step, so training never has to simulate the chain.
 *
 * The defaults end at ᾱ_T = 0.0006, so √ᾱ_T ≈ 0.02 and x_T really is noise —
 * a schedule that stops short leaves the data's shape faintly visible at the
 * top of the chain, and the widget's reverse pass then looks like it is
 * cheating.
 */
export function noiseSchedule(steps = 48, betaStart = 1e-4, betaEnd = 0.28) {
  const beta: number[] = []
  const alphaBar: number[] = []
  let cum = 1
  for (let t = 0; t < steps; t++) {
    const b = betaStart + ((betaEnd - betaStart) * t) / Math.max(steps - 1, 1)
    beta.push(b)
    cum *= 1 - b
    alphaBar.push(cum)
  }
  return { beta, alphaBar, steps }
}

/** One forward jump: corrupt a clean point to noise level t, in one step. */
export function forwardTo(p: Point, alphaBar: number, noise: Point): Point {
  const s = Math.sqrt(alphaBar)
  const n = Math.sqrt(1 - alphaBar)
  return { x: s * p.x + n * noise.x, y: s * p.y + n * noise.y }
}

/**
 * The exact score ∇ₓ log p_t(x) of the noised three-blob mixture.
 *
 * A real diffusion model *learns* this; here it is available in closed form
 * because the data is a Gaussian mixture, so the widget can run a genuine
 * reverse trajectory without training anything. The slide says so: what the
 * network is fitting is this vector field, and nothing else.
 */
export function mixtureScore(x: Point, alphaBar: number, weights = P_REAL): Point {
  const s = Math.sqrt(alphaBar)
  const v = alphaBar * MODE_SPREAD * MODE_SPREAD + (1 - alphaBar)
  const logits = MODE_CENTRES.map((c, k) => {
    const dx = x.x - s * c.x
    const dy = x.y - s * c.y
    return Math.log(Math.max(weights[k], 1e-12)) - (dx * dx + dy * dy) / (2 * v)
  })
  const top = Math.max(...logits)
  const w = logits.map(l => Math.exp(l - top))
  const z = w.reduce((a, b) => a + b, 0)

  let gx = 0
  let gy = 0
  for (let k = 0; k < MODE_CENTRES.length; k++) {
    const r = w[k] / z
    gx += (r * (s * MODE_CENTRES[k].x - x.x)) / v
    gy += (r * (s * MODE_CENTRES[k].y - x.y)) / v
  }
  return { x: gx, y: gy }
}

/**
 * Classifier-free guidance, on the same mixture.
 *
 * Real guidance trains one network to predict ε both with and without the
 * prompt, then extrapolates away from the unconditional prediction:
 *
 *     ε̃ = ε_uncond + w · (ε_cond − ε_uncond)
 *
 * Here "the prompt" is *which of the three modes you asked for*, so the
 * conditional score is the score of a mixture with all its weight on that mode.
 * w = 0 ignores the prompt entirely, w = 1 is honest conditioning, and w > 1 is
 * the extrapolation everyone actually ships — which is why a guidance scale of
 * 7 gives you a picture that is unmistakably *of the prompt* and slightly too
 * saturated to be real.
 */
export function guidedScore(x: Point, alphaBar: number, mode: number, w: number): Point {
  const uncond = mixtureScore(x, alphaBar, P_REAL)
  const onehot = P_REAL.map((_, k) => (k === mode ? 1 : 0))
  const cond = mixtureScore(x, alphaBar, onehot)
  return {
    x: uncond.x + w * (cond.x - uncond.x),
    y: uncond.y + w * (cond.y - uncond.y),
  }
}

/**
 * One DDIM step from noise level `t` to `t-1`.
 *
 * Deterministic on purpose: the trajectory a student watches is the same one
 * every time, and DDIM is what modern samplers actually use. `score` is supplied
 * by the caller so the same stepper drives the plain sampler and the guided one
 * — guidance changes what the network is asked for, never the sampler.
 */
export function reverseStep(
  x: Point,
  alphaBarT: number,
  alphaBarPrev: number,
  score: Point = mixtureScore(x, alphaBarT),
): Point {
  const sigmaT = Math.sqrt(1 - alphaBarT)
  // ε̂ = -σ_t · score, and x̂₀ follows from the closed form.
  const eps = { x: -sigmaT * score.x, y: -sigmaT * score.y }
  const sqrtAb = Math.sqrt(alphaBarT)
  const x0 = {
    x: (x.x - sigmaT * eps.x) / sqrtAb,
    y: (x.y - sigmaT * eps.y) / sqrtAb,
  }
  const sPrev = Math.sqrt(alphaBarPrev)
  const nPrev = Math.sqrt(1 - alphaBarPrev)
  return { x: sPrev * x0.x + nPrev * eps.x, y: sPrev * x0.y + nPrev * eps.y }
}

/** Pure noise to start a reverse trajectory from. */
export function startNoise(n = 48, seed = 5150): Point[] {
  const g = seededGaussian(seed)
  return Array.from({ length: n }, () => ({ x: g(), y: g() }))
}

// ---------------------------------------------------------------------------
// Transposed convolution
// ---------------------------------------------------------------------------

/**
 * Where each output cell of a transposed convolution gets its contributions.
 *
 * Returns, per output cell, how many kernel taps land on it. That count is the
 * whole checkerboard story: when `kernel` is not a multiple of `stride`, the
 * counts alternate across the output, so a freshly-initialised generator paints
 * a grid pattern before it has learned anything at all.
 */
export function transposeCoverage(inSize: number, kernel: number, stride: number) {
  const outSize = (inSize - 1) * stride + kernel
  const counts: number[][] = Array.from({ length: outSize }, () => new Array(outSize).fill(0))
  for (let i = 0; i < inSize; i++) {
    for (let j = 0; j < inSize; j++) {
      for (let a = 0; a < kernel; a++) {
        for (let b = 0; b < kernel; b++)
          counts[i * stride + a][j * stride + b] += 1
      }
    }
  }
  // Edge cells always see fewer taps, in every configuration, and that is just
  // the boundary — not the artefact. The checkerboard is an *interior* property,
  // so the verdict is taken over the cells that have a full neighbourhood.
  const edge = kernel - 1
  const interior: number[] = []
  for (let i = edge; i < outSize - edge; i++) {
    for (let j = edge; j < outSize - edge; j++)
      interior.push(counts[i][j])
  }
  const pool = interior.length ? interior : counts.flat()

  return {
    outSize,
    counts,
    min: Math.min(...pool),
    max: Math.max(...pool),
    /**
     * True when every interior cell sees the same number of taps — which happens
     * exactly when `stride` divides `kernel`. Anything else paints a grid.
     */
    even: Math.min(...pool) === Math.max(...pool),
  }
}
