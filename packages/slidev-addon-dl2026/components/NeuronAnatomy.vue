<script setup lang="ts">
/*
 * Lecture 02 slide 4 — the biological neuron beside the artificial one.
 *
 * Two things were wrong with the first version of this widget and both are
 * fixed here.
 *
 * 1. The biology was a cartoon: three straight "dendrites", a plain ellipse and
 *    a line for an axon. A neuron is a branched arbor feeding a cell body that
 *    tapers into an axon hillock, and an axon that is myelinated in segments
 *    with nodes of Ranvier between them, ending in terminal boutons. That
 *    structure is drawn properly now, because two of the mappings only make
 *    sense once it is visible — the threshold lives at the hillock, and the
 *    all-or-none spike is a property of the axon.
 *
 * 2. The mapping was too coarse and, where it was stated, too confident. The
 *    textbook four-part version (dendrites→inputs, synapse→weight, soma→sum,
 *    axon→output) leaves out the hillock, which is the part the bias actually
 *    corresponds to, and it silently asserts an equivalence that neuroscience
 *    does not support. Every part therefore carries a `breaks` line saying
 *    where the analogy stops holding: dendrites compute before the soma,
 *    summation is leaky and time-dependent, and a real cell codes intensity as
 *    a firing *rate* rather than as one number.
 *
 * Selecting a part highlights it on both sides at once, so the correspondence
 * is something the room can check rather than take on faith.
 */
import { computed, ref } from 'vue'
import { seededRandom } from '../composables/useRandom'

interface Part {
  key: string
  bio: string
  art: string
  note: string
  /** Where the correspondence stops being true. */
  breaks: string
}

const PARTS: Part[] = [
  {
    key: 'dend',
    bio: 'Dendrites',
    art: 'Inputs x₁ … xₘ',
    note: 'A branched arbor collecting signals from thousands of upstream cells. Each arriving signal is one feature value.',
    breaks: 'Dendrites already compute: they filter and non-linearly amplify inputs before the soma ever sees them. An input xⱼ does none of that.',
  },
  {
    key: 'syn',
    bio: 'Synapses',
    art: 'Weights w₁ … wₘ',
    note: 'The junction where one cell contacts the next. Its strength decides how much of a signal gets through, and whether the effect is excitatory or inhibitory — magnitude and sign, which is exactly what wⱼ carries. Training changes the weights; learning changes the synapses.',
    breaks: 'A synapse is chemical, probabilistic and slow to change. A weight is one number, rewritten exactly once per update step.',
  },
  {
    key: 'soma',
    bio: 'Soma (cell body)',
    art: 'Net input z = wᵀx + b',
    note: 'The cell body pools the graded potentials arriving from every dendrite. The artificial neuron sums the weighted inputs.',
    breaks: 'Somatic summation leaks over time — inputs that do not arrive together do not add up. z has no clock and no memory.',
  },
  {
    key: 'hill',
    bio: 'Axon hillock',
    art: 'Bias b (the threshold, moved)',
    note: 'Spikes are initiated here, and only once the membrane potential crosses a threshold. That threshold is what the next slide folds into the left-hand side and renames the bias: fire when z = wᵀx + b ≥ 0.',
    breaks: 'The biological threshold drifts with the cell’s recent history; b is fixed between updates.',
  },
  {
    key: 'axon',
    bio: 'Axon',
    art: 'Activation σ(z)',
    note: 'Once triggered, the action potential is all-or-none — the spike is the same size however far the threshold was exceeded, and the myelin between the nodes of Ranvier only makes it travel faster. That is what the unit step models.',
    breaks: 'The cell reports intensity as a firing *rate* over time, not as a single value — which is nearer a continuous activation than a step. Adaline, two sections from now, is the better analogy.',
  },
  {
    key: 'term',
    bio: 'Axon terminals',
    art: 'Output ŷ, fanned out',
    note: 'One axon branches to contact many downstream cells; one unit’s output is fed to every unit in the next layer.',
    breaks: 'Transmission is chemical and delayed by milliseconds. An edge in a network is an instantaneous multiplication.',
  },
]

const selected = ref('dend')
const active = computed(() => PARTS.find(p => p.key === selected.value)!)
const on = (k: string) => selected.value === k

/*
 * The dendritic arbor, grown rather than hand-drawn.
 *
 * Six trunks leave the soma, each splitting twice into thinner branches, with
 * the branch angle jittered from a fixed seed so the tree looks organic and
 * still renders identically every time the slide is opened.
 */
const SOMA = { x: 176, y: 100 }

/** The arbor is confined to this cone of angles so it never grows back across
 *  the soma and into the axon. Radians, SVG convention: y grows downward. */
const CONE: [number, number] = [1.95, 4.35]

/** The arbor is scaled to fit here, leaving the label band below it clear. */
const ARBOR_BOX = { left: 34, top: 34, bottom: 172 }

interface Twig { d: string, w: number, tip: [number, number] | null }

const dendrites = computed<Twig[]>(() => {
  const rand = seededRandom(11)
  const out: Twig[] = []
  let bow = 1

  const grow = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
    const x2 = x + Math.cos(angle) * len
    const y2 = y + Math.sin(angle) * len
    // A control point pushed off the chord perpendicularly, alternating side,
    // so branches bow gently instead of reading as a stick figure. Keep the
    // offset small: a large one curls the twig back on itself.
    bow = -bow
    const cx = (x + x2) / 2 + Math.cos(angle + Math.PI / 2) * len * 0.14 * bow
    const cy = (y + y2) / 2 + Math.sin(angle + Math.PI / 2) * len * 0.14 * bow
    out.push({
      d: `M${x.toFixed(1)},${y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
      w: width,
      tip: depth === 0 ? [x2, y2] : null,
    })

    if (depth === 0)
      return
    const spread = 0.3 + rand() * 0.2
    const clamp = (a: number) => Math.min(Math.max(a, CONE[0]), CONE[1])
    grow(x2, y2, clamp(angle - spread), len * 0.62, width * 0.58, depth - 1)
    grow(x2, y2, clamp(angle + spread), len * 0.58, width * 0.58, depth - 1)
  }

  for (const a of [2.05, 2.5, 2.95, 3.4, 3.85, 4.3])
    grow(SOMA.x + Math.cos(a) * 30, SOMA.y + Math.sin(a) * 24, a, 34, 4.6, 2)

  return out
})

const tips = computed(() => dendrites.value.filter(t => t.tip).map(t => t.tip as [number, number]))

/*
 * Shrink the whole arbor about the soma until its tips clear the panel edge and
 * the label band underneath.
 *
 * Doing it here rather than by hand-tuning the branch lengths means the tree
 * can be regrown — different seed, more trunks, another level of branching —
 * without the outermost twigs silently sliding under the caption.
 */
const arborScale = computed(() => {
  const pad = 6
  const limits = tips.value.map(([x, y]) => Math.min(
    (SOMA.x - ARBOR_BOX.left - pad) / Math.max(SOMA.x - x, 1e-6),
    (SOMA.y - ARBOR_BOX.top - pad) / Math.max(SOMA.y - y, 1e-6),
    (ARBOR_BOX.bottom - pad - SOMA.y) / Math.max(y - SOMA.y, 1e-6),
  ))
  return Math.min(1, ...limits.filter(v => v > 0))
})

const arborTransform = computed(() =>
  `translate(${SOMA.x} ${SOMA.y}) scale(${arborScale.value.toFixed(3)}) translate(${-SOMA.x} ${-SOMA.y})`)

/** Presynaptic boutons from unseen upstream cells, sitting on the outer tips. */
const synapses = computed(() => tips.value.filter((_, i) => i % 3 === 0))

/** Myelin segments; the gaps between them are the nodes of Ranvier. */
const MYELIN = [238, 302, 366, 430]
const NODES = [294, 358, 422]
</script>

<template>
  <WidgetFrame max-width="52rem">
    <svg viewBox="0 0 680 356" class="dl-neuron" role="img" aria-label="A biological neuron above the artificial neuron it inspired">
      <!-- ─────────────────────────  biological  ───────────────────────── -->
      <text x="16" y="16" class="head" text-anchor="start">Biological neuron</text>

      <g class="bio">
        <g :class="{ 'is-on': on('dend') }" @click="selected = 'dend'">
          <!-- Labels stay outside the fitting transform so they keep their size. -->
          <g :transform="arborTransform">
            <path
              v-for="(t, i) in dendrites" :key="i"
              :d="t.d" :stroke-width="t.w" class="process"
            />
          </g>
          <text x="40" y="188" class="lbl">dendrites</text>
        </g>

        <g :class="{ 'is-on': on('syn') }" @click="selected = 'syn'">
          <g :transform="arborTransform">
            <circle v-for="(s, i) in synapses" :key="i" :cx="s[0]" :cy="s[1]" r="4.5" class="bouton" />
          </g>
          <text x="126" y="188" class="lbl">synapses</text>
          <line x1="138" y1="180" x2="128" y2="164" class="leader" />
        </g>

        <g :class="{ 'is-on': on('soma') }" @click="selected = 'soma'">
          <!-- A lumpy closed curve: a cell body is not an ellipse. -->
          <path
            d="M146,90 C147,73 161,64 177,69 C193,63 208,72 210,88 C217,99 212,115 199,122
               C186,131 165,129 154,120 C144,113 141,99 146,90 Z"
            class="soma"
          />
          <circle :cx="SOMA.x" :cy="SOMA.y" r="11" class="nucleus" />
          <circle :cx="SOMA.x + 3" :cy="SOMA.y - 2" r="4" class="nucleolus" />
          <text x="176" y="150" class="lbl" text-anchor="middle">soma</text>
        </g>

        <g :class="{ 'is-on': on('hill') }" @click="selected = 'hill'">
          <path d="M204,82 C218,84 226,90 232,96 L232,106 C226,112 218,118 204,120 Z" class="hillock" />
          <text x="238" y="62" class="lbl">axon hillock</text>
          <line x1="240" y1="66" x2="228" y2="86" class="leader" />
        </g>

        <g :class="{ 'is-on': on('axon') }" @click="selected = 'axon'">
          <line x1="230" y1="101" x2="500" y2="101" class="axon" />
          <rect v-for="x in MYELIN" :key="x" :x="x" y="87" width="56" height="28" rx="13" class="myelin" />
          <text x="360" y="76" class="lbl" text-anchor="middle">myelinated axon</text>
          <text v-for="x in NODES" :key="`n${x}`" :x="x" y="136" class="lbl is-tiny" text-anchor="middle">node</text>
          <line v-for="x in NODES" :key="`l${x}`" :x1="x" y1="127" :x2="x" y2="110" class="leader" />
        </g>

        <g :class="{ 'is-on': on('term') }" @click="selected = 'term'">
          <path d="M500,101 C518,94 532,80 542,66" class="process" stroke-width="3" />
          <path d="M500,101 C522,101 540,101 556,101" class="process" stroke-width="3" />
          <path d="M500,101 C518,108 532,122 542,136" class="process" stroke-width="3" />
          <circle cx="545" cy="63" r="6" class="bouton" />
          <circle cx="559" cy="101" r="6" class="bouton" />
          <circle cx="545" cy="139" r="6" class="bouton" />
          <text x="540" y="168" class="lbl" text-anchor="middle">axon terminals</text>
        </g>

        <!-- The cell this one talks to, kept faint: it is context, not a part. -->
        <path d="M600,44 C588,76 588,126 600,158" class="ghost" />
        <text x="628" y="105" class="lbl is-ghost" text-anchor="middle">next</text>
        <text x="628" y="119" class="lbl is-ghost" text-anchor="middle">neuron</text>
      </g>

      <line x1="16" y1="196" x2="664" y2="196" class="divider" />

      <!-- ─────────────────────────  artificial  ───────────────────────── -->
      <text x="16" y="216" class="head" text-anchor="start">Artificial neuron</text>

      <g class="art">
        <g :class="{ 'is-on': on('dend') }" @click="selected = 'dend'">
          <circle cx="52" cy="248" r="15" class="unit" />
          <text x="52" y="253" class="val">x₁</text>
          <circle cx="52" cy="292" r="15" class="unit" />
          <text x="52" y="297" class="val">x₂</text>
          <circle cx="52" cy="336" r="15" class="unit" />
          <text x="52" y="341" class="val">x₃</text>
        </g>

        <g :class="{ 'is-on': on('syn') }" @click="selected = 'syn'">
          <line x1="67" y1="248" x2="176" y2="285" class="wire" />
          <line x1="67" y1="292" x2="176" y2="292" class="wire" />
          <line x1="67" y1="336" x2="176" y2="299" class="wire" />
          <text x="112" y="258" class="val is-small">w₁</text>
          <text x="112" y="286" class="val is-small">w₂</text>
          <text x="112" y="330" class="val is-small">w₃</text>
        </g>

        <g :class="{ 'is-on': on('hill') }" @click="selected = 'hill'">
          <circle cx="150" cy="240" r="14" class="unit" />
          <text x="150" y="245" class="val">b</text>
          <line x1="161" y1="250" x2="187" y2="272" class="wire" />
        </g>

        <g :class="{ 'is-on': on('soma') }" @click="selected = 'soma'">
          <circle cx="200" cy="292" r="24" class="unit is-op" />
          <text x="200" y="300" class="val is-big">Σ</text>
          <text x="200" y="337" class="val is-small">z = wᵀx + b</text>
        </g>

        <g :class="{ 'is-on': on('axon') }" @click="selected = 'axon'">
          <line x1="224" y1="292" x2="292" y2="292" class="wire" />
          <circle cx="318" cy="292" r="24" class="unit is-op" />
          <!-- A step glyph inside the node, so σ is not just a Greek letter. -->
          <path d="M304,300 L318,300 L318,282 L332,282" class="glyph" />
          <text x="318" y="337" class="val is-small">σ(z)</text>
        </g>

        <g :class="{ 'is-on': on('term') }" @click="selected = 'term'">
          <line x1="342" y1="292" x2="430" y2="292" class="wire" />
          <text x="386" y="282" class="val is-small">ŷ</text>
          <line x1="430" y1="292" x2="530" y2="248" class="wire" />
          <line x1="430" y1="292" x2="530" y2="292" class="wire" />
          <line x1="430" y1="292" x2="530" y2="336" class="wire" />
          <circle cx="545" cy="248" r="15" class="unit" />
          <circle cx="545" cy="292" r="15" class="unit" />
          <circle cx="545" cy="336" r="15" class="unit" />
          <text x="616" y="297" class="val is-small">next layer</text>
        </g>
      </g>
    </svg>

    <template #controls>
      <div class="dl-neuron__tabs">
        <button
          v-for="p in PARTS"
          :key="p.key"
          type="button"
          :class="{ 'is-active': p.key === selected }"
          @click="selected = p.key"
        >{{ p.bio }}</button>
      </div>
    </template>

    <template #readout>
      <p class="dl-neuron__map">
        <strong>{{ active.bio }}</strong> ↔ <strong>{{ active.art }}</strong> — {{ active.note }}
      </p>
      <p class="dl-neuron__breaks">
        <span class="dl-neuron__flag">where the analogy breaks</span> {{ active.breaks }}
      </p>
    </template>
  </WidgetFrame>
</template>

<style scoped>
.dl-neuron {
  width: 100%;
  height: 100%;
}

.head {
  fill: var(--dl-muted);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.divider {
  stroke: var(--dl-border);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.bio > g,
.art > g {
  cursor: pointer;
}

/* Dendrites, axon collaterals and terminal branches — all the same cytoplasm. */
.process {
  stroke: var(--dl-muted);
  fill: none;
  stroke-linecap: round;
  transition: stroke 0.2s ease;
}

.axon {
  stroke: var(--dl-muted);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke 0.2s ease;
}

.myelin {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.soma {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 2;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.nucleus {
  fill: var(--dl-border);
  stroke: var(--dl-muted);
  stroke-width: 1.2;
}

.nucleolus {
  fill: var(--dl-muted);
}

.hillock {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.bouton {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.ghost {
  fill: none;
  stroke: var(--dl-border);
  stroke-width: 3;
}

.wire {
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  fill: none;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.unit {
  fill: var(--dl-surface);
  stroke: var(--dl-muted);
  stroke-width: 1.6;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.unit.is-op {
  fill: var(--dl-accent-soft);
  stroke: var(--dl-accent);
}

.glyph {
  fill: none;
  stroke: var(--dl-accent-strong);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

/*
 * Selection: one rule per mark type, applied to both panels at once.
 *
 * `.process` gets colour only. Its width is a per-path attribute — the arbor
 * tapers from trunk to twig — and a CSS `stroke-width` here would beat that
 * attribute and flatten the whole tree to one thickness on selection.
 */
.is-on .process {
  stroke: var(--dl-accent);
}

.is-on .axon,
.is-on .wire {
  stroke: var(--dl-accent);
  stroke-width: 3;
}

.is-on .soma,
.is-on .hillock,
.is-on .myelin,
.is-on .bouton,
.is-on .unit {
  fill: var(--dl-accent);
  stroke: var(--dl-accent-strong);
}

.is-on .nucleus {
  fill: var(--dl-accent-soft);
}

.is-on .nucleolus {
  fill: var(--dl-accent-strong);
}

.is-on .glyph {
  stroke: #fff;
}

.lbl {
  fill: var(--dl-muted);
  font-size: 11px;
  pointer-events: none;
}

.lbl.is-tiny {
  font-size: 9px;
}

.lbl.is-ghost {
  fill: var(--dl-border);
}

.is-on .lbl {
  fill: var(--dl-accent-strong);
  font-weight: 600;
}

.leader {
  stroke: var(--dl-border);
  stroke-width: 1;
}

.val {
  fill: var(--dl-heading);
  font-size: 12px;
  text-anchor: middle;
  pointer-events: none;
}

.val.is-small {
  fill: var(--dl-muted);
  font-size: 10.5px;
}

.val.is-big {
  font-size: 19px;
}

.is-on .val {
  fill: #fff;
}

/* Text that sits outside a highlighted mark must not go white on the canvas. */
.is-on .val.is-small {
  fill: var(--dl-accent-strong);
  font-weight: 600;
}

.dl-neuron__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.dl-neuron__tabs button {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--dl-border);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  color: var(--dl-body);
  cursor: pointer;
}

.dl-neuron__tabs button.is-active {
  background: var(--dl-accent);
  border-color: var(--dl-accent);
  color: #fff;
  font-weight: 600;
}

.dl-neuron__map,
.dl-neuron__breaks {
  margin: 0;
  line-height: 1.45;
}

.dl-neuron__breaks {
  margin-top: 0.2rem;
}

.dl-neuron__flag {
  color: var(--dl-danger);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  margin-right: 0.35rem;
}
</style>
