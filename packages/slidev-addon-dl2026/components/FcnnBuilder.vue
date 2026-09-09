<script setup lang="ts">
/*
 * The network we build on MNIST, with a price tag on every layer.
 *
 * Two habits this is trying to install. First, that you can read the shape of a
 * tensor off the architecture at any point without running anything — the
 * ledger is the same calculation `print(x.shape)` would have told you, done in
 * advance. Second, that a layer's parameter count is `in x out + out` and
 * nothing more mysterious, so the cost of a design decision is visible while
 * the decision is being made.
 *
 * The sliders exist so the room can find the surprise themselves: widening the
 * first hidden layer costs far more than widening the second, because it is the
 * one wired to all 784 pixels. That observation is what Lecture 04 opens on.
 */
import { computed, ref } from 'vue'

const INPUT = 784
const CLASSES = 10
const BATCH = 64

const h1 = ref(128)
const h2 = ref(64)

const widths = computed(() => {
  const mid = h2.value > 0 ? [h1.value, h2.value] : [h1.value]
  return [INPUT, ...mid, CLASSES]
})

interface Row {
  call: string
  shape: string
  params: number
  detail: string
}

const rows = computed<Row[]>(() => {
  const out: Row[] = [{
    call: 'nn.Flatten()',
    shape: `(${BATCH}, ${INPUT})`,
    params: 0,
    detail: '28 × 28 pixels in a row',
  }]
  const w = widths.value
  for (let i = 0; i < w.length - 1; i++) {
    const inF = w[i]
    const outF = w[i + 1]
    out.push({
      call: `nn.Linear(${inF}, ${outF})`,
      shape: `(${BATCH}, ${outF})`,
      params: inF * outF + outF,
      detail: `${inF} × ${outF} + ${outF}`,
    })
    if (i < w.length - 2) {
      out.push({
        call: 'nn.ReLU()',
        shape: `(${BATCH}, ${outF})`,
        params: 0,
        detail: 'nothing to learn',
      })
    }
  }
  return out
})

const total = computed(() => rows.value.reduce((sum, r) => sum + r.params, 0))

/** Grouped by thousands, written out rather than left to the browser locale. */
function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const megabytes = computed(() => ((total.value * 4) / 1024 / 1024).toFixed(2))

/* ---- the diagram --------------------------------------------------------- */

/*
 * Drawn as HTML pills rather than an SVG chain. An SVG here has to survive
 * being squeezed into whatever column the ledger leaves it, and a scaled-down
 * viewBox takes its labels down with it — at which point the picture is
 * decorative. Pills scale with the deck's own font size instead, so the numbers
 * stay the size everything else on the slide is.
 *
 * Width grows with the square root of the layer size: 784 beside 10 on a linear
 * scale is a wall next to a sliver.
 */
const pills = computed(() => widths.value.map((n, i) => ({
  n,
  width: `${(2.3 + 3.4 * Math.sqrt(n / INPUT)).toFixed(2)}rem`,
  role: i === 0 ? 'input' : i === widths.value.length - 1 ? 'output' : 'hidden',
  /** The operation between this pill and the next one. */
  next: i < widths.value.length - 1
    ? (i < widths.value.length - 2 ? 'Linear → ReLU' : 'Linear')
    : null,
})))

/** Share of the total, for the bar in the ledger. */
const maxParams = computed(() => Math.max(...rows.value.map(r => r.params), 1))

</script>

<template>
  <WidgetFrame max-width="46rem">
    <div class="dl-fcnn">
      <div class="dl-fcnn__chain" role="img" :aria-label="`A network ${widths.join(' to ')} with ${total} parameters`">
        <template v-for="(p, i) in pills" :key="i">
          <div class="dl-fcnn__pill" :class="`is-${p.role}`" :style="{ width: p.width }">
            {{ p.n }}
          </div>
          <div v-if="p.next" class="dl-fcnn__arrow">
            <span>{{ p.next }}</span>
            <em aria-hidden="true">&rarr;</em>
          </div>
        </template>
      </div>
      <div class="dl-fcnn__roles">
        <span>pixels</span><span>hidden units</span><span>logits, one per digit</span>
      </div>

      <table class="dl-fcnn__ledger">
        <thead>
          <tr><th>layer</th><th>output shape</th><th>parameters</th><th>in × out + out</th></tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" :class="{ 'is-free': r.params === 0 }">
            <td><code>{{ r.call }}</code></td>
            <td><code>{{ r.shape }}</code></td>
            <td class="is-num">{{ r.params === 0 ? '—' : fmt(r.params) }}</td>
            <td>
              <span v-if="r.params > 0" class="dl-fcnn__bar">
                <span :style="{ width: `${(100 * r.params) / maxParams}%` }" />
              </span>
              <small>{{ r.detail }}</small>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td colspan="2">total</td><td class="is-num">{{ fmt(total) }}</td><td>{{ megabytes }} MB in float32</td></tr>
        </tfoot>
      </table>
    </div>

    <template #controls>
      <Slider v-model="h1" label="hidden 1" :min="16" :max="256" :step="16" :precision="0" />
      <Slider v-model="h2" label="hidden 2 (0 = none)" :min="0" :max="128" :step="16" :precision="0" />
    </template>

    <template #readout>
      <div class="dl-fcnn__facts">
        <span><code>sum(p.numel() for p in model.parameters())</code> <strong>{{ fmt(total) }}</strong></span>
      </div>
      <div class="dl-fcnn__note">
        Lecture 02's hand-written MLP had 50 hidden units and {{ fmt(784 * 50 + 50 + 50 * 10 + 10) }} parameters. Widen
        hidden 1 and watch the cost: that layer is wired to all 784 pixels, so it dominates everything else on the table.
      </div>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-fcnn {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dl-fcnn__chain {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
}

.dl-fcnn__pill {
  flex: 0 0 auto;
  text-align: center;
  padding: 0.4rem 0.2rem;
  border-radius: 6px;
  border: 1.5px solid var(--dl-accent);
  background: var(--dl-accent-soft);
  color: var(--dl-heading);
  font-weight: 700;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

.dl-fcnn__pill.is-input {
  border-color: var(--dl-border);
  background: var(--dl-surface);
}

.dl-fcnn__pill.is-output {
  background: var(--dl-accent);
  border-color: var(--dl-accent-strong);
  color: #fff;
}

.dl-fcnn__arrow {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-width: 0;
  color: var(--dl-muted);
  font-size: 0.72rem;
  white-space: nowrap;
}

.dl-fcnn__arrow span {
  font-family: var(--slidev-code-font-family, monospace);
}

.dl-fcnn__arrow em {
  font-style: normal;
  font-size: 1rem;
  color: var(--dl-accent);
}

.dl-fcnn__roles {
  display: flex;
  justify-content: space-between;
  font-size: 0.66rem;
  color: var(--dl-muted);
  margin-bottom: 0.5rem;
}

.dl-fcnn__ledger {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.8rem;
  color: var(--dl-body);
}

.dl-fcnn__ledger th {
  text-align: left;
  font-weight: 600;
  color: var(--dl-muted);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.6rem 0.15rem 0;
  border-bottom: 1px solid var(--dl-border);
}

.dl-fcnn__ledger td {
  padding: 0.12rem 0.6rem 0.12rem 0;
  vertical-align: baseline;
  font-variant-numeric: tabular-nums;
}

.dl-fcnn__ledger td.is-num {
  text-align: right;
  font-weight: 600;
  color: var(--dl-heading);
}

.dl-fcnn__ledger code {
  font-size: 0.78rem;
  color: var(--dl-heading);
}

.dl-fcnn__ledger tr.is-free,
.dl-fcnn__ledger tr.is-free code,
.dl-fcnn__ledger tr.is-free td.is-num {
  color: var(--dl-muted);
}

.dl-fcnn__ledger small {
  color: var(--dl-muted);
  font-size: 0.66rem;
  margin-left: 0.4rem;
  /* Wrapping here makes one row twice as tall as its neighbours. */
  white-space: nowrap;
}

.dl-fcnn__bar {
  display: inline-block;
  width: 16%;
  height: 0.45rem;
  background: var(--dl-surface);
  border: 1px solid var(--dl-border);
  border-radius: 2px;
  overflow: hidden;
  vertical-align: middle;
}

.dl-fcnn__bar > span {
  display: block;
  height: 100%;
  background: var(--dl-accent);
}

.dl-fcnn__ledger tfoot td {
  border-top: 1px solid var(--dl-border);
  padding-top: 0.25rem;
  font-weight: 700;
  color: var(--dl-accent);
}

.dl-fcnn__ledger tfoot td:last-child {
  font-weight: 400;
  color: var(--dl-muted);
  font-size: 0.72rem;
}

.dl-fcnn__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1.2rem;
  margin-bottom: 0.2rem;
}

.dl-fcnn__facts strong {
  color: var(--dl-accent);
}

.dl-fcnn__facts code,
.dl-fcnn__note code {
  font-size: 0.72rem;
  background: var(--dl-code-bg);
  padding: 0.05rem 0.22rem;
  border-radius: 3px;
}

.dl-fcnn__note {
  line-height: 1.35;
}
</style>
