---
theme: dl2026
addons:
  - dl2026
title: Transformers
info: PGR207 Deep Learning 2026 — Lecture 06
author: Vajira Thambawita
routerMode: hash
transition: slide-left
mdc: true
themeConfig:
  courseCode: PGR207
  lecture: "06"
  lectureTitle: Transformers
layout: title
courseCode: PGR207
lecture: "06"
email: vajira@simula.no
---

# Transformers

Last week's network could look anywhere, but it had to read in order. Delete
the reading-in-order part and almost nothing is lost. Everything since 2017 is
built on that idea.

<div class="mt-6 flex items-center gap-6">
  <TransformerGlyph kind="cut" :size="110">read in order</TransformerGlyph>
  <span class="text-3xl" style="color: var(--dl-accent)">→</span>
  <TransformerGlyph kind="block" :size="110">look everywhere</TransformerGlyph>
</div>

<!--
One session. The arc: last week's attention was a bolt-on to a recurrent model;
this week it is the entire layer, and the recurrence is gone.

The two pictures are this deck's first two emblems. On the left, a chain of
recurrent cells with the links between them cut: that is section 00, "delete the
recurrence". On the right, one transformer block: a sideways mixing bar, a small
per-position network above it, and the dashed residual wire around both. Do not
explain the block yet; say "by the end of section 02 you can draw this
yourself".

Section 01 is the lecture. Everything else can be compressed if you are running
late, but a room that leaves without being able to compute one attention output
by hand has not learned anything they can build on. Budget forty minutes for
query, key and value, and do not apologise for it.

The running example is three words — "the river bank" — and the payoff arrives
on the "Same word, same weights, different neighbour" slide: the same weights
and the same word, one neighbour changed, and the output vector swaps ends. Set
it up properly on "The sentence we will use all lecture" so that payoff lands.

Say at the start that this lecture stops at the architecture. How one of these
is actually trained, at what cost, and what happens when you make it very large
is next week.
-->

---
layout: interactive
core: true
heading: Where we are
title: Where we are
aside-width: 15rem
---

<SyllabusTimeline :current-week="7" />

::aside::

Same block as last week, second of three.

Week 6 built the recurrent network and ended on the two things it cannot do.
Today is the architecture that does both. Next week is what happens when you
make it very large.

<!--
The point: this is one continuous story and not three lectures that happen to
be adjacent. The transformer is not a new idea bolted onto week 6 — it is week
6's last slide, taken seriously.

On screen: the course timeline, one tile per week, with week 7 highlighted.
Point at the block that covers weeks 6, 7 and 8 — recurrent networks,
transformers and large language models. Week 6 is behind us, week 7 is today,
week 8 is next.

About one minute. Do not open the other blocks; the only thing to land is where
today sits between last week and next week.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: Where we are"
---

# In words: Where we are

<div class="dl-describe">

- The strip is the course plan, one tile per week. The highlighted tile is
  week 7, today.
- Weeks 6, 7 and 8 form one block: recurrent networks, transformers, and large
  language models (LLMs).
- Week 6 built the recurrent network. It ended on two things that network
  cannot do well.
- Today's architecture, the transformer, solves both of them.
- Next week takes the same architecture and makes it very large.

This lecture continues last week's story. It is not a fresh start.

</div>

<!--
Revision slide for the timeline. Give the room fifteen seconds, or skip it in
the lecture if time is short — it is here for students reading the deck later.
-->

---
layout: section
index: "00"
---

# Delete the recurrence

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="cut" :size="190" /></div>

<!--
Section 00, about twelve minutes. Do not linger on the divider; the next slide
does the work.

The glyph: three recurrent cells whose links are cut, each now with its own
arrow upward. It is the whole section in one picture — remove the chain, and
every position can be processed on its own, at the same time.

What this section has to land, in order: last week's two walls, the 2017 move
that removed the recurrence, and the one-sentence description of a transformer
(mix across positions, then process each position alone).
-->

---
layout: default
core: true
title: Where last week stopped
---

# Where last week stopped

We built a recurrent encoder–decoder and hit two walls (hard limits).
Attention removed only one of them.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 680 220" class="dl-diagram" role="img" aria-label="Wall one: the encoder squeezes the source into one vector c, and attention lines fix it. Wall two: a chain of 200 states, each waiting for the one before">
  <defs>
    <marker id="l6s0-walls-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="8" y="16">wall one — the bottleneck</text>
  <rect class="dl-dg-box" x="8" y="120" width="46" height="34" rx="4" />
  <rect class="dl-dg-box" x="72" y="120" width="46" height="34" rx="4" />
  <rect class="dl-dg-box" x="136" y="120" width="46" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="31" y="142" text-anchor="middle">h₁</text>
  <text class="dl-dg-lab is-sm" x="95" y="142" text-anchor="middle">h₂</text>
  <text class="dl-dg-lab is-sm" x="159" y="142" text-anchor="middle">h₃</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M54 137 H70" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M118 137 H134" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M182 137 H202" />
  <rect class="dl-dg-box" x="204" y="124" width="30" height="26" rx="3" />
  <text class="dl-dg-lab is-sm" x="219" y="142" text-anchor="middle">c</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M234 137 H254" />
  <rect class="dl-dg-box is-accent" x="256" y="120" width="46" height="34" rx="4" />
  <rect class="dl-dg-box is-accent" x="316" y="120" width="30" height="34" rx="4" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M302 137 H314" />
  <text class="dl-dg-small" x="95" y="174" text-anchor="middle">encoder</text>
  <text class="dl-dg-small" x="219" y="174" text-anchor="middle">one vector</text>
  <text class="dl-dg-small" x="301" y="174" text-anchor="middle">decoder</text>
  <g v-click>
    <path class="dl-dg-line" d="M331 118 C 290 40, 70 40, 31 118" />
    <path class="dl-dg-line" d="M331 118 C 300 60, 125 60, 95 118" />
    <path class="dl-dg-line" d="M331 118 C 310 80, 180 80, 159 118" />
    <text class="dl-dg-small is-good" x="8" y="204">attention fixed it: a fresh weighted sum at every step</text>
  </g>
  <line class="dl-dg-split" x1="360" y1="8" x2="360" y2="212" />
  <text class="dl-dg-small" x="378" y="16">wall two — no parallelism</text>
  <rect class="dl-dg-box" x="378" y="120" width="42" height="34" rx="4" />
  <rect class="dl-dg-box" x="436" y="120" width="42" height="34" rx="4" />
  <rect class="dl-dg-box" x="494" y="120" width="42" height="34" rx="4" />
  <rect class="dl-dg-box" x="552" y="120" width="42" height="34" rx="4" />
  <rect class="dl-dg-box" x="610" y="120" width="54" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="399" y="142" text-anchor="middle">h₁</text>
  <text class="dl-dg-lab is-sm" x="457" y="142" text-anchor="middle">h₂</text>
  <text class="dl-dg-lab is-sm" x="515" y="142" text-anchor="middle">h₃</text>
  <text class="dl-dg-lab is-sm" x="573" y="142" text-anchor="middle">…</text>
  <text class="dl-dg-lab is-sm" x="637" y="142" text-anchor="middle">h₂₀₀</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M420 137 H434" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M478 137 H492" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M536 137 H550" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-walls-head)" d="M594 137 H608" />
    <text class="dl-dg-small" x="378" y="182">200 tokens = 200 steps in a row</text>
  <g v-click>
    <rect class="dl-dg-box is-bad" x="370" y="110" width="302" height="54" rx="6" />
    <text class="dl-dg-small is-bad" x="378" y="208">attention on top leaves this chain in place</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

Two walls, one fix. This lecture removes the chain itself.

</div>

<!--
The point: five minutes of recap, and make it a recap of the *argument* rather
than of the equations. The room needs the last content slide of week 6 in their
head — the one that says no amount of hardware shortens the chain.

On screen, left half: last week's encoder–decoder. The encoder reads the source
into states h1, h2, h3, and in the plain version the decoder sees only one fixed
vector c. Right half: the recurrent chain on its own. h_t needs h_(t-1), so a
200-token input is 200 matrix multiplies, one after another. The batch
parallelises; time cannot.

Click: the three curved lines appear. That is attention — at every output step
the decoder scores every encoder state, softmaxes the scores and takes a
weighted sum. A fresh context every step, so nothing has to be summarised in
advance. Wall one is gone.

Click 2: the red dashed box around the chain. Attention did nothing about wall
two, because the recurrence was still underneath it.

Click 3: the callout. Two walls, one fix — and the second wall is what this
lecture is about.

If anyone is missing week 6: the one sentence they need is that attention means
"score every position, softmax the scores, take a weighted sum of the values".
That is all of it, and this lecture re-derives it from scratch anyway.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Where last week stopped"
---

# In words: Where last week stopped

<div class="dl-describe">

The picture shows last week's recurrent encoder–decoder and its two walls
(hard limits).

- **Left, wall one.** The encoder read the source into states $\mathbf{h}_1, \mathbf{h}_2, \mathbf{h}_3$.
  The plain decoder saw only one fixed vector, $c$. Everything had to squeeze
  through that one box.
- **Attention fixed wall one.** The curved lines let each decoder step score
  every encoder state and take a weighted sum. That gives a fresh context at
  every step.
- **Right, wall two.** Each state $\mathbf{h}_t$ needs the one before it. So 200
  tokens means 200 steps in a row.
- Attention sat on top of this chain, so wall two stayed.

So the goal of this lecture is to remove the chain completely.

</div>

<!--
Revision slide. Give the room thirty seconds to read, then ask: which wall is
still standing, and why did attention not touch it?
-->

---
layout: default
core: true
title: The move
---

# The move

Last week's attention was a **passenger** on a recurrent model that did the
real work.

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 680 200" class="dl-diagram" style="max-width: 34rem" role="img" aria-label="Left: attention sits on top of a recurrent chain. Right: the chain is gone and the words the, river, bank connect directly through attention">
  <defs>
    <marker id="l6s0-move-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="8" y="16">last week — attention on top</text>
  <circle class="dl-dg-op" cx="95" cy="48" r="16" />
  <text class="dl-dg-lab is-sm" x="95" y="53" text-anchor="middle">Σ</text>
  <text class="dl-dg-small" x="120" y="52">weighted sum</text>
  <path class="dl-dg-line" d="M85 61 L31 128" />
  <path class="dl-dg-line" d="M95 64 L99 128" />
  <path class="dl-dg-line" d="M105 61 L167 128" />
  <rect class="dl-dg-box" x="8" y="130" width="46" height="30" rx="4" />
  <rect class="dl-dg-box" x="76" y="130" width="46" height="30" rx="4" />
  <rect class="dl-dg-box" x="144" y="130" width="46" height="30" rx="4" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-move-head)" d="M54 145 H74" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-move-head)" d="M122 145 H142" />
  <text class="dl-dg-small" x="31" y="184" text-anchor="middle">the</text>
  <text class="dl-dg-small" x="99" y="184" text-anchor="middle">river</text>
  <text class="dl-dg-small" x="167" y="184" text-anchor="middle">bank</text>
  <text class="dl-dg-small" x="200" y="150">the chain does the work</text>
  <line class="dl-dg-split" x1="340" y1="8" x2="340" y2="192" />
  <g v-click>
    <text class="dl-dg-small is-good" x="360" y="16">2017 — keep the weighted sum, delete the chain</text>
    <path class="dl-dg-line" d="M415 128 Q460 92 505 128" />
    <path class="dl-dg-line" d="M505 128 Q550 92 595 128" />
    <path class="dl-dg-line" d="M415 128 Q505 46 595 128" />
    <rect class="dl-dg-box is-accent" x="380" y="130" width="70" height="30" rx="4" />
    <rect class="dl-dg-box is-accent" x="470" y="130" width="70" height="30" rx="4" />
    <rect class="dl-dg-box is-accent" x="560" y="130" width="70" height="30" rx="4" />
    <text class="dl-dg-in" x="415" y="150" text-anchor="middle">the</text>
    <text class="dl-dg-in" x="505" y="150" text-anchor="middle">river</text>
    <text class="dl-dg-in" x="595" y="150" text-anchor="middle">bank</text>
    <text class="dl-dg-small" x="505" y="184" text-anchor="middle">all positions at once — nothing waits</text>
  </g>
</svg>
</div>

<div v-click class="dl-tight">

- They removed the RNN (recurrent neural network) as a test. Translation
  quality went **up**.

</div>

<div v-click class="mt-2 dl-callout">

**Attention Is All You Need** (Vaswani et al., 2017): keep the weighted sum,
delete everything it was bolted to.

</div>

<div class="mt-1">
  <Citation source="Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser & Polosukhin, Attention Is All You Need (2017)" url="https://arxiv.org/abs/1706.03762" />
</div>

<!--
The point: the 2017 paper kept last week's weighted sum and threw away the
recurrent model it was attached to. No recurrence, no convolution: every layer
is attention, then a small per-position network.

On screen, left: last week's design. A chain of recurrent states does the work,
and attention sits on top as a passenger, reading from every state. The arrows
between the boxes are the chain that makes every step wait.

Click: the right panel. The same three words, "the river bank", with no arrows
between them. Each word connects to every other word through attention only.
Nothing in a layer waits for anything else in the layer, so the whole sequence
is processed at once.

Click 2: the experimental result. This is the bullet worth saying slowly. The
paper is usually taught as a bold architectural leap; it reads much more like an
ablation that got out of hand. They were trying to make translation train faster
on the hardware they had, and quality went up.

Click 3: the callout — the title is not a slogan, it is the result.

Twelve hours on eight P100s for the base model. The reason that number mattered
is that it is what made everything after it affordable.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: The move"
---

# In words: The move

<div class="dl-describe">

- **Left: last week's design.** A recurrent chain does the work. Attention sits
  on top as a passenger and reads from every state.
- **Right: the 2017 design**, from *Attention Is All You Need* (Vaswani et al.).
  The chain is gone. Each word connects to every other word through attention only.
- With no chain, no position waits for another. The whole sentence is processed
  at once.
- The authors removed the recurrent neural network (RNN) as an experiment.
  Translation quality went up, not down.

Keep the weighted sum and delete what it was attached to. Every later model
builds on that idea.

</div>

<!--
Revision slide. Thirty seconds to read; ask the room what "nothing waits" buys
on a graphics card.
-->

---
layout: default
core: true
title: What a transformer is
---

# What a transformer is

A stack of identical blocks. Each block does exactly two things.

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 680 250" class="dl-diagram" style="max-width: 36rem" role="img" aria-label="One transformer block on the river bank: attention mixes the three positions sideways, then the same small network processes each position alone, and the block repeats N times">
  <defs>
    <marker id="l6s0-what-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box is-accent" x="120" y="204" width="90" height="30" rx="4" />
  <rect class="dl-dg-box is-accent" x="280" y="204" width="90" height="30" rx="4" />
  <rect class="dl-dg-box is-accent" x="440" y="204" width="90" height="30" rx="4" />
  <text class="dl-dg-in" x="165" y="224" text-anchor="middle">the</text>
  <text class="dl-dg-in" x="325" y="224" text-anchor="middle">river</text>
  <text class="dl-dg-in" x="485" y="224" text-anchor="middle">bank</text>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M165 202 V174" />
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M325 202 V174" />
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M485 202 V174" />
    <rect class="dl-dg-fill" x="110" y="130" width="430" height="42" rx="6" />
    <path class="dl-dg-line" d="M165 168 L325 134 M325 168 L165 134 M325 168 L485 134 M485 168 L325 134 M165 168 L485 134 M485 168 L165 134" />
    <text class="dl-dg-in" x="8" y="148">sideways</text>
    <text class="dl-dg-small" x="8" y="164">mix positions</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M165 128 V104" />
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M325 128 V104" />
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M485 128 V104" />
    <polygon class="dl-dg-net" points="125,102 205,102 193,58 137,58" />
    <polygon class="dl-dg-net" points="285,102 365,102 353,58 297,58" />
    <polygon class="dl-dg-net" points="445,102 525,102 513,58 457,58" />
    <text class="dl-dg-small" x="165" y="85" text-anchor="middle">same net</text>
    <text class="dl-dg-small" x="325" y="85" text-anchor="middle">same net</text>
    <text class="dl-dg-small" x="485" y="85" text-anchor="middle">same net</text>
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M165 56 V26" />
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M325 56 V26" />
    <path class="dl-dg-arrow" marker-end="url(#l6s0-what-head)" d="M485 56 V26" />
    <text class="dl-dg-in" x="8" y="76">upward</text>
    <text class="dl-dg-small" x="8" y="92">each position alone</text>
  </g>
  <g v-click>
    <path class="dl-dg-line is-muted" d="M572 56 H584 V172 H572" />
    <text class="dl-dg-lab" x="594" y="114">× N</text>
    <text class="dl-dg-small" x="594" y="134">6 … 96 blocks</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

Mix across positions, then process each position on its own. Repeat. The rest
of the lecture is detail.

</div>

<!--
The point: give them this sentence before any mathematics, and write it on the
board — mix across positions, then think about each position separately.

On screen: one block working on the three words of the running example, "the
river bank". Read it from the bottom up.

Click: the shaded band and its crossing lines. That is attention, the sideways
step. Every position builds a new vector by looking at every other position and
taking a weighted average of what it finds. It is the only place in the whole
architecture where information moves between tokens.

Click 2: the three trapezoids. Every position is then pushed through the same
two-layer network, alone, with no idea its neighbours exist. "Same net" is
literal: one set of weights, used at every position. This is where two thirds of
the parameters live.

Click 3: the bracket. The block repeats — six times in the original model,
ninety-six in very large ones.

Click 4: the callout. The "two thirds of the parameters" line always gets a
reaction, and it should — students arrive believing a transformer is attention
with some plumbing. It is closer to the reverse. The "What a block costs" slide
does the arithmetic.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: What a transformer is"
---

# In words: What a transformer is

<div class="dl-describe">

A transformer is a stack of identical blocks. The picture shows one block
working on "the river bank". Read it from the bottom up.

1. **Sideways (the shaded band).** Each position looks at every position and
   takes a weighted average of what it finds. This is the only place where
   words exchange information.
2. **Upward (the trapezoids).** Each position then goes through the same small
   two-layer network, alone. About two thirds of the parameters live here.
3. **Repeat (the bracket).** The original model stacks 6 blocks. Very large
   models stack 96.

In one sentence: first mix information between positions, then work on every
position separately.

</div>

<!--
Revision slide. Thirty seconds to read. The one sentence to leave with is the
last line; everything in sections 01 and 02 fills in one of the two steps.
-->

---
layout: default
core: true
title: "Poll: which wall attention solves"
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="Which of last week's two walls does attention, on its own, solve?"
  :items="[
    'The bottleneck — one fixed vector for the whole source',
    'The lack of parallelism across time',
    'Both of them',
    'Neither — it needs the recurrence to work at all',
  ]"
/>

</div>
<div class="mt-10">

<svg viewBox="0 0 260 150" class="dl-diagram" role="img" aria-label="Attention as a weighted sum sitting on top of a recurrent chain of three states">
  <defs>
    <marker id="l6s0-poll-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <circle class="dl-dg-op" cx="130" cy="28" r="14" />
  <text class="dl-dg-lab is-sm" x="130" y="33" text-anchor="middle">Σ</text>
  <text class="dl-dg-small" x="152" y="32">attention</text>
  <path class="dl-dg-line" d="M121 39 L35 92" />
  <path class="dl-dg-line" d="M130 42 L125 92" />
  <path class="dl-dg-line" d="M139 39 L215 92" />
  <rect class="dl-dg-box" x="10" y="94" width="50" height="28" rx="4" />
  <rect class="dl-dg-box" x="100" y="94" width="50" height="28" rx="4" />
  <rect class="dl-dg-box" x="190" y="94" width="50" height="28" rx="4" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-poll-head)" d="M60 108 H98" />
  <path class="dl-dg-arrow" marker-end="url(#l6s0-poll-head)" d="M150 108 H188" />
  <text class="dl-dg-small" x="130" y="142" text-anchor="middle">the recurrent chain underneath</text>
</svg>

</div>
</div>

<div v-click class="mt-4 dl-reveal">

The bottleneck only

</div>

<div v-click class="mt-2 dl-secondary">

The recurrent chain was still underneath, so time stayed sequential.

</div>

<!--
The point: attention and parallelism are two separate moves, and only the second
needs the recurrence gone.

On screen beside the question: last week's set-up in miniature. The circle is
attention, a weighted sum reading from every state; the boxes and arrows below
are the recurrent chain it sits on.

Hands up for each before revealing.

Click: the answer — the bottleneck only. Attention replaces the one fixed vector
with a fresh weighted sum at every step.

Click 2: why. The chain in the sketch is still there, so each state still waits
for the one before.

Option 3 is the popular wrong answer and it is worth naming why: attention and
parallelism get taught together so often that students fuse them. They are two
separate moves, made three years apart. Option 4 is wrong because this lecture
shows attention working with no recurrence at all.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: which wall attention solves"
---

# In words: which wall attention solves

<div class="dl-describe">

- The poll asks which of last week's two walls attention removes on its own.
- **The answer is the bottleneck only.** Attention replaces the single fixed
  vector with a fresh weighted sum at every output step.
- It does not give parallelism. In the sketch, attention (the circle) still sits
  on top of the recurrent chain. Each state still waits for the one before it.
- "Both" is the common wrong answer. Attention and parallelism are often taught
  together, but they are two separate steps.

Today's point: attention does not need the recurrence. Remove the chain, and the
second wall falls too.

</div>

<!--
Revision slide for the poll. Fifteen seconds; it closes section 00.
-->

---
layout: section
index: "01"
---

# Query, key, value

A dictionary lookup, made soft.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="qkv" :size="190" /></div>

<!--
Section 01 is the lecture. Never cut it; budget about forty minutes. The glyph:
one query dot sending lines of different weight to three keys. The thickest
line goes to the key it matches best. That picture is attention as a soft
lookup, and it comes back on the recap.

By the end of the section the room should be able to compute one attention
output by hand from the river-bank numbers, and say why all the rows can be
computed at the same time.
-->

---
layout: default
core: true
title: Start from a lookup
---

# Start from a lookup

<div class="grid grid-cols-[1fr_1.05fr] gap-8 mt-1 items-start">
<div class="dl-tight">

A Python dictionary finds the **exact** key and hands back its value.

```python
store = {"river": "waterside", "money": "financial"}
store["river"]   # → 'waterside'  one winner
store["stream"]  # → KeyError     nothing at all
```

<v-clicks>

- What you bring: the **query**
- What each entry advertises: its **key**
- What you get back: its **value**

</v-clicks>

</div>
<div>

<svg viewBox="0 0 320 232" class="dl-diagram" style="max-height: 16rem" role="img" aria-label="Top: a dictionary query river matches one key exactly and returns one value. Bottom: an attention query is compared with every key, and every value is blended by how well its key matched">
  <defs>
    <marker id="l6s1-lookup" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="4" y="14">dictionary</text>
  <rect class="dl-dg-box" x="4" y="34" width="64" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="36" y="52" text-anchor="middle" style="font-style: italic">river</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s1-lookup)" d="M70 40 L110 35" />
  <rect class="dl-dg-box is-accent" x="114" y="24" width="64" height="22" rx="3" />
  <text class="dl-dg-small" x="146" y="39" text-anchor="middle">river</text>
  <rect class="dl-dg-box" x="114" y="52" width="64" height="22" rx="3" />
  <text class="dl-dg-small" x="146" y="67" text-anchor="middle">money</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s1-lookup)" d="M180 35 H218" />
  <rect class="dl-dg-box is-accent" x="222" y="24" width="90" height="22" rx="3" />
  <text class="dl-dg-small" x="267" y="39" text-anchor="middle">waterside</text>
  <text class="dl-dg-small" x="114" y="92">exact match: one winner</text>
  <g v-click>
    <line class="dl-dg-split" x1="4" y1="104" x2="316" y2="104" />
    <text class="dl-dg-small is-good" x="4" y="122">attention</text>
    <path class="dl-dg-line is-muted" d="M40 176 L116 145" :style="{ strokeWidth: 1.5 }" />
    <path class="dl-dg-line" d="M40 176 L116 173" :style="{ strokeWidth: 6 }" />
    <path class="dl-dg-line is-muted" d="M40 176 L116 201" :style="{ strokeWidth: 2.5 }" />
    <circle class="dl-dg-dot is-accent" cx="30" cy="176" r="12" />
    <text x="30" y="181" text-anchor="middle" style="fill: var(--dl-bg); font-size: 13px; font-weight: 700">q</text>
    <rect class="dl-dg-box" x="116" y="134" width="50" height="22" rx="3" />
    <rect class="dl-dg-box is-accent" x="116" y="162" width="50" height="22" rx="3" />
    <rect class="dl-dg-box" x="116" y="190" width="50" height="22" rx="3" />
    <text class="dl-dg-small" x="141" y="149" text-anchor="middle">key 1</text>
    <text class="dl-dg-small" x="141" y="177" text-anchor="middle">key 2</text>
    <text class="dl-dg-small" x="141" y="205" text-anchor="middle">key 3</text>
    <rect class="dl-dg-box" x="176" y="134" width="54" height="22" rx="3" />
    <rect class="dl-dg-box is-accent" x="176" y="162" width="54" height="22" rx="3" />
    <rect class="dl-dg-box" x="176" y="190" width="54" height="22" rx="3" />
    <text class="dl-dg-small" x="203" y="149" text-anchor="middle">value 1</text>
    <text class="dl-dg-small" x="203" y="177" text-anchor="middle">value 2</text>
    <text class="dl-dg-small" x="203" y="205" text-anchor="middle">value 3</text>
    <path class="dl-dg-line is-muted" d="M230 145 L262 170" :style="{ strokeWidth: 1.5 }" />
    <path class="dl-dg-line" d="M230 173 L262 173" :style="{ strokeWidth: 6 }" />
    <path class="dl-dg-line is-muted" d="M230 201 L262 176" :style="{ strokeWidth: 2.5 }" />
    <rect class="dl-dg-box is-accent" x="262" y="160" width="52" height="26" rx="4" />
    <text class="dl-dg-small" x="288" y="177" text-anchor="middle">blend</text>
    <text class="dl-dg-small" x="116" y="228">similarity: every value, weighted</text>
  </g>
</svg>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Attention is this lookup made **soft**: it matches by *similarity*, and returns a
blend of **every** value.

</div>

<!--
This is the framing that makes the three names stop being arbitrary, and it is
worth the ninety seconds. Every student in the room has written store[k] a
thousand times.

The picture, top half: the dictionary. The query "river" matches exactly one
key, the highlighted one, and you get exactly one value back. "stream" matches
nothing, so you get a KeyError.

Clicks 1 to 3: name the three roles as the bullets arrive — the query is what
you bring, the key is what each entry advertises, the value is what you get
back.

Click 4: the bottom half appears. Same three roles, but the query is compared
with every key, and the line thickness is how well each one matched. Every
value flows into the blend, weighted by that match.

Click 5: the callout. Name the two changes, because everything else follows
from them:
  hard match  -> similarity score
  one winner  -> a weighted average of all of them

Both changes exist for the same reason: a hard lookup is not differentiable, and
you cannot backpropagate through a KeyError.

Class cut: about 3 minutes.
-->

---
layout: default
title: "In words: Start from a lookup"
---

# In words: Start from a lookup

<div class="dl-describe">

The slide compares two ways to look something up.

- **Top picture: a Python dictionary.** The query *river* must match a key
  exactly. One key wins, and you get its one value, *waterside*. A query with no
  exact match, like *stream*, gets an error.
- **Bottom picture: attention.** The query is compared with every key. The
  thickness of each line shows how well that key matches.
- All the values are then mixed into one blend. Values whose keys matched best
  count the most.
- Remember the three roles. The **query** is what you ask. The **key** is what an
  entry advertises. The **value** is what it hands back.

</div>

<!--
The point: the dictionary analogy, in full sentences, for revision. Give the room
twenty seconds, or skip it in the lecture if short on time — this slide is for
reading afterwards.
-->

---
layout: default
core: true
title: Three roles, one vector
---

# Three roles, one vector

Each token makes all three from **the same** vector $\mathbf{x}$, through three
**learned** matrices: $\mathbf{q} = \mathbf{x}W_Q$, $\mathbf{k} = \mathbf{x}W_K$,
$\mathbf{v} = \mathbf{x}W_V$.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 520 196" class="dl-diagram" style="max-height: 14rem" role="img" aria-label="One token vector x passes through three learned matrices W_Q, W_K and W_V and becomes a query, a key and a value">
  <defs>
    <marker id="l6s1-roles" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box is-accent" x="10" y="74" width="70" height="46" rx="4" />
  <text class="dl-dg-lab" x="45" y="103" text-anchor="middle">x</text>
  <text class="dl-dg-small" x="45" y="138" text-anchor="middle">one token</text>
  <path class="dl-dg-arrow" d="M80 97 C 110 97, 110 34, 140 34" marker-end="url(#l6s1-roles)" />
  <path class="dl-dg-arrow" d="M80 97 H140" marker-end="url(#l6s1-roles)" />
  <path class="dl-dg-arrow" d="M80 97 C 110 97, 110 160, 140 160" marker-end="url(#l6s1-roles)" />
  <polygon class="dl-dg-net" points="146,16 206,24 206,44 146,52" />
  <polygon class="dl-dg-net" points="146,79 206,87 206,107 146,115" />
  <polygon class="dl-dg-net" points="146,142 206,150 206,170 146,178" />
  <text class="dl-dg-in" x="174" y="39" text-anchor="middle">W<tspan baseline-shift="sub" style="font-size: 9px">Q</tspan></text>
  <text class="dl-dg-in" x="174" y="102" text-anchor="middle">W<tspan baseline-shift="sub" style="font-size: 9px">K</tspan></text>
  <text class="dl-dg-in" x="174" y="165" text-anchor="middle">W<tspan baseline-shift="sub" style="font-size: 9px">V</tspan></text>
  <path class="dl-dg-arrow" d="M206 34 H238" marker-end="url(#l6s1-roles)" />
  <path class="dl-dg-arrow" d="M206 97 H238" marker-end="url(#l6s1-roles)" />
  <path class="dl-dg-arrow" d="M206 160 H238" marker-end="url(#l6s1-roles)" />
  <rect class="dl-dg-box" x="244" y="20" width="44" height="28" rx="3" />
  <rect class="dl-dg-box" x="244" y="83" width="44" height="28" rx="3" />
  <rect class="dl-dg-box" x="244" y="146" width="44" height="28" rx="3" />
  <text class="dl-dg-lab" x="266" y="40" text-anchor="middle">q</text>
  <text class="dl-dg-lab" x="266" y="103" text-anchor="middle">k</text>
  <text class="dl-dg-lab" x="266" y="166" text-anchor="middle">v</text>
  <text class="dl-dg-lab is-sm" x="302" y="39">query: what am I looking for?</text>
  <text class="dl-dg-lab is-sm" x="302" y="102">key: what do I advertise?</text>
  <text class="dl-dg-lab is-sm" x="302" y="165">value: what do I hand over?</text>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

Three **projections** of one vector, not three stored things. Every token is a
query, a key and a value at once.

</div>

<!--
The picture: one token's vector x on the left, three learned matrices in the
middle (the trapezoids), and the three short vectors they produce on the right.
Each output answers a different question, written beside it. The query is
scored against everyone's key; the value is what gets averaged into the output.

Click: the callout is the misconception to kill early. Students hear "keys and
values" and picture a stored table that the queries are looked up in. There is
no table: the keys and values are computed from the very tokens that are also
doing the querying. Every token is all three at once — including when it looks
at itself. Self-attention always includes the diagonal, and a surprising number
of people assume a token is excluded from its own row.

W_Q, W_K and W_V are the only new parameters in the layer, and they learn the
usual way, by gradient descent.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Three roles, one vector"
---

# In words: Three roles, one vector

<div class="dl-describe">

- The box **x** on the left is one token's vector.
- It goes through three different learned matrices, $W_Q$, $W_K$ and $W_V$ (the
  trapezoids). Each one gives a different short vector.
- The **query** $\mathbf{q}$ says what this token is looking for. It is compared
  with every token's key.
- The **key** $\mathbf{k}$ says what this token advertises, so that others can
  find it.
- The **value** $\mathbf{v}$ is what this token hands over when another token
  attends to it. Values are averaged into the output.
- Every token plays all three roles at once, even when it looks at itself.
  $W_Q$, $W_K$ and $W_V$ are the only new learned parameters.

</div>

<!--
The point: one vector, three projections, three jobs. Twenty seconds of reading
time; skip in the lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: The sentence we will use all lecture
---

# The sentence we will use all lecture

<div class="grid grid-cols-[1.3fr_1fr] gap-8 mt-2 items-start">
<div>

<svg viewBox="0 0 420 184" class="dl-diagram" style="max-height: 14rem" role="img" aria-label="The three words of the river bank, each with a bar chart of its four embedding numbers: the is 1 0 0 0, river is 0 2 0 1, bank is 0 0 0 2">
  <rect class="dl-dg-box" x="10" y="8" width="112" height="28" rx="4" />
  <rect class="dl-dg-box" x="150" y="8" width="112" height="28" rx="4" />
  <rect class="dl-dg-box is-accent" x="290" y="8" width="112" height="28" rx="4" />
  <text class="dl-dg-lab is-sm" x="66" y="27" text-anchor="middle" style="font-style: italic">the</text>
  <text class="dl-dg-lab is-sm" x="206" y="27" text-anchor="middle" style="font-style: italic">river</text>
  <text class="dl-dg-lab is-sm" x="346" y="27" text-anchor="middle" style="font-style: italic">bank</text>
  <line class="dl-dg-split" x1="10" y1="150" x2="122" y2="150" />
  <line class="dl-dg-split" x1="150" y1="150" x2="262" y2="150" />
  <line class="dl-dg-split" x1="290" y1="150" x2="402" y2="150" />
  <text class="dl-dg-small" x="24" y="166" text-anchor="middle">det</text>
  <text class="dl-dg-small" x="52" y="180" text-anchor="middle">water</text>
  <text class="dl-dg-small" x="80" y="166" text-anchor="middle">money</text>
  <text class="dl-dg-small" x="108" y="180" text-anchor="middle">thing</text>
  <text class="dl-dg-small" x="164" y="166" text-anchor="middle">det</text>
  <text class="dl-dg-small" x="192" y="180" text-anchor="middle">water</text>
  <text class="dl-dg-small" x="220" y="166" text-anchor="middle">money</text>
  <text class="dl-dg-small" x="248" y="180" text-anchor="middle">thing</text>
  <text class="dl-dg-small" x="304" y="166" text-anchor="middle">det</text>
  <text class="dl-dg-small" x="332" y="180" text-anchor="middle">water</text>
  <text class="dl-dg-small" x="360" y="166" text-anchor="middle">money</text>
  <text class="dl-dg-small" x="388" y="180" text-anchor="middle">thing</text>
  <g v-click>
    <rect class="dl-dg-bar" x="14" y="110" width="20" height="40" />
    <text class="dl-dg-small" x="24" y="104" text-anchor="middle">1</text>
    <rect class="dl-dg-bar" x="182" y="70" width="20" height="80" />
    <text class="dl-dg-small" x="192" y="64" text-anchor="middle">2</text>
    <rect class="dl-dg-bar" x="238" y="110" width="20" height="40" />
    <text class="dl-dg-small" x="248" y="104" text-anchor="middle">1</text>
  </g>
  <g v-click>
    <rect class="dl-dg-bar is-q" x="378" y="70" width="20" height="80" />
    <text class="dl-dg-small" x="388" y="64" text-anchor="middle">2</text>
  </g>
</svg>

</div>
<div class="dl-tight">

Four embedding numbers per word. We pretend they mean **det** (a word like
*the*), **water**, **money** and **thing**.

<div v-click class="mt-3 dl-callout">

*bank* is a thing, and **nothing else**. Nothing says riverbank or high-street
bank.

</div>

<div v-click class="mt-3">

So the sense has to come from a neighbour. Attention is how it gets there.

</div>

</div>
</div>

<div v-click class="mt-3 dl-secondary">

Hand-picked numbers, so you can check the arithmetic. Real coordinates have no
names.

</div>

<!--
Spend a minute here. The whole section pays off only if they accept that "bank"
genuinely does not contain the answer.

The picture: three word tiles — the running example, drawn the same way all
section, with bank highlighted because bank is the word that asks. Under each
tile, its embedding as four bars, one per named axis.

Before the first click, ask the room what "bank" means. You will get both
senses, which is the point: they cannot tell either, from the word alone.

Click: the bars for "the" (only det) and "river" (a thing, and watery — 2 on
water, 1 on thing).

Click 2: bank's bars. Everything on "thing", nothing else.

Click 3: the callout — bank arrives empty of sense.

Click 4: so the information has to come from a neighbour.

Click 5: the honesty caveat at the bottom is not optional. Say it out loud —
dimension 2 is not "water" in any real model, and a student who leaves believing
otherwise will misread every attention visualisation they ever see.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: The sentence we will use all lecture"
---

# In words: The sentence we will use all lecture

<div class="dl-describe">

- The running example is "the river bank". Each bar chart is one word's embedding: four numbers, one bar each. We pretend
  the four positions mean det (a word like *the*), water, money and thing.
- *the* = $[1, 0, 0, 0]$: only the det bar.
- *river* = $[0, 2, 0, 1]$: a thing, and watery.
- *bank* = $[0, 0, 0, 2]$: only the thing bar. Its own vector does not say which
  kind of bank it is.
- So the meaning of *bank* must come from a neighbour, here *river*. Attention
  is the mechanism that moves it there.
- The numbers are chosen by hand, so the arithmetic can be done by hand. Real
  embeddings have no named axes.

</div>

<!--
The point: the running example and why bank is the interesting word. Twenty
seconds; skip in the lecture if short on time — this slide is for revision.
-->

---
layout: interactive
core: true
heading: Three lenses on one word
title: Three lenses on one word
aside-width: 17rem
---

<QkvLab />

::aside::

Press **Next word**. One vector, three projections of it.

<v-clicks>

- *the* — zero query, zero key. Asks nothing, advertises nothing
- *river* advertises **water**
- *bank* asks the loudest question, and advertises nothing

</v-clicks>

<div v-click class="mt-2 dl-callout">

Nobody reads *bank* to learn what a bank is.

</div>

<!--
Walk all three words. The one to stop on is "the": its query and key are both
zero, so its attention row will come out perfectly flat and no other word will
ever point at it. That is a stopword, learned rather than listed.

Click 1 to 3: one bullet per word as you step the widget to it — the, river,
bank. Click 4: the callout.

The question that always comes: why does bank's key advertise nothing? Because
in this toy model the "thing" axis carries no sense to offer. In a real model a
word's key advertises plenty — this is a caricature, and the caricature is doing
a job.

If asked whether W_Q, W_K, W_V are shared across positions: yes, one set per
head for the whole sequence. Exactly the weight-sharing argument from weeks 4
and 5, a third time.

Class cut: about 4 minutes. In the full slides, for self-study, it is followed by "Why a key and a value are different things".
-->

---
layout: default
title: "In words: Three lenses on one word"
---

# In words: Three lenses on one word

<div class="dl-describe">

- The widget takes one word's embedding and multiplies it by $W_Q$, $W_K$ and
  $W_V$. The three results are that word's query, key and value.
- *the*: query $[0, 0]$ and key $[0, 0]$. It asks nothing and advertises
  nothing, so no word will match on it.
- *river*: key $[2, 0]$. It advertises the water axis.
- *bank*: query $[1, 1]$, the largest query, and key $[0, 0]$. It asks the most
  and advertises nothing.
- So *bank* needs information and *river* offers it. Nobody looks at *bank* to
  learn what a bank is.

</div>

<!--
The point: the three projections of each word, with the numbers from the widget.
Twenty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
title: Why a key and a value are different things
---

# Why a key and a value are different things

The question every year: *if both come from $\mathbf{x}$, why two matrices?*

<div class="grid grid-cols-[1.2fr_1fr] gap-8 mt-3 items-start">
<div>

<svg viewBox="0 0 400 210" class="dl-diagram" style="max-height: 15rem" role="img" aria-label="River's key is a book's spine label, 2 0, which makes it findable; river's value is the book's contents, 2.3 0.3, which is what it hands over">
  <defs>
    <marker id="l6s1-book" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="6" y="90" width="70" height="28" rx="4" />
  <text class="dl-dg-lab is-sm" x="41" y="109" text-anchor="middle" style="font-style: italic">river</text>
  <g v-click>
    <path class="dl-dg-arrow" d="M76 98 C 104 98, 104 52, 136 52" marker-end="url(#l6s1-book)" />
    <text class="dl-dg-small" x="96" y="66" text-anchor="middle">W<tspan baseline-shift="sub" style="font-size: 8px">K</tspan></text>
    <rect class="dl-dg-fill" x="142" y="12" width="30" height="80" rx="3" />
    <text class="dl-dg-in" x="157" y="56" text-anchor="middle" transform="rotate(-90 157 52)">water</text>
    <text class="dl-dg-in" x="186" y="44">key = [2, 0]</text>
    <text class="dl-dg-small" x="186" y="62">the spine label: findable</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" d="M76 110 C 104 110, 104 158, 136 158" marker-end="url(#l6s1-book)" />
    <text class="dl-dg-small" x="96" y="150" text-anchor="middle">W<tspan baseline-shift="sub" style="font-size: 8px">V</tspan></text>
    <rect class="dl-dg-box" x="142" y="128" width="30" height="62" rx="2" />
    <rect class="dl-dg-box" x="174" y="128" width="30" height="62" rx="2" />
    <path class="dl-dg-split" d="M147 142 H167 M147 152 H167 M147 162 H167 M147 172 H162 M179 142 H199 M179 152 H199 M179 162 H199 M179 172 H194" />
    <text class="dl-dg-in" x="216" y="154">value = [2.3, 0.3]</text>
    <text class="dl-dg-small" x="216" y="172">the contents: handed over</text>
  </g>
</svg>

</div>
<div class="dl-tight">

<div v-click class="dl-callout">

*What makes me worth finding* and *what I am worth reading* are different
questions. So the model learns different answers.

</div>

<div v-click class="mt-3 dl-secondary">

Setting $W_K = W_V$ still works, slightly worse. Some efficient variants do
exactly that.

</div>

</div>
</div>

<!--
This slide exists because the question is guaranteed and because "they're just
different projections" is a non-answer that students correctly find
unsatisfying.

The picture is a library book, made from river's own numbers.

Click: the top branch. River's key, [2, 0], is the label on the spine. It is
short, and it says what the book is about — water — so that bank's query can
find it.

Click 2: the bottom branch. River's value, [2.3, 0.3], is what is inside the
book: what river hands over once it has been found. A useful spine label is not
what you want to read.

Click 3: the callout — two different questions, so two matrices.

Click 4: tying them works, slightly worse. Some efficient variants deliberately
do exactly that.

The library metaphor holds up well. Push it one step if the room is engaged: the
query is the sentence you say to the librarian, and it is in the same language
as the spine labels, not the same language as the contents. That is why q and k
must share a dimension and v need not.
-->

---
layout: default
title: "In words: Why a key and a value are different things"
---

# In words: Why a key and a value are different things

<div class="dl-describe">

- **Top**, a library book's spine: *river*'s key, made with $W_K$, is $[2, 0]$. It makes the book easy to find, here by the word "water".
- **Bottom:** *river*'s value, made with $W_V$, is $[2.3, 0.3]$. It is what is
  inside the book: what *river* hands over once *bank* has found it.
- A good spine label is short and says what the book is about. That is not what
  you want to read. So the two jobs get two different matrices.
- Using one matrix for both ($W_K = W_V$) still works, but slightly worse.

</div>

<!--
The point: why keys and values need separate matrices. Twenty seconds; skip in
the lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: Four steps, and that is the whole mechanism
---

# Four steps, and that is the whole mechanism

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 620 132" class="dl-diagram" style="max-height: 11rem" role="img" aria-label="Four boxes in a row — score, scale, softmax, mix — with the bank row after each: 0 2 0, then 0 1.41 0, then 0.16 0.67 0.16, then a new vector for bank">
  <defs>
    <marker id="l6s1-steps" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="10" y="12">the bank row of "the river bank"</text>
  <g v-click>
    <rect class="dl-dg-box" x="10" y="22" width="130" height="40" rx="4" />
    <text class="dl-dg-lab is-sm" x="75" y="47" text-anchor="middle">1 · score</text>
    <text class="dl-dg-in" x="75" y="90" text-anchor="middle">0, 2, 0</text>
    <text class="dl-dg-small" x="75" y="110" text-anchor="middle">q · k, every key</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" d="M140 42 H162" marker-end="url(#l6s1-steps)" />
    <rect class="dl-dg-box" x="166" y="22" width="130" height="40" rx="4" />
    <text class="dl-dg-lab is-sm" x="231" y="47" text-anchor="middle">2 · scale</text>
    <text class="dl-dg-in" x="231" y="90" text-anchor="middle">0, 1.41, 0</text>
    <text class="dl-dg-small" x="231" y="110" text-anchor="middle">÷ √2</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" d="M296 42 H318" marker-end="url(#l6s1-steps)" />
    <rect class="dl-dg-box" x="322" y="22" width="130" height="40" rx="4" />
    <text class="dl-dg-lab is-sm" x="387" y="47" text-anchor="middle">3 · softmax</text>
    <text class="dl-dg-in" x="387" y="90" text-anchor="middle">0.16, 0.67, 0.16</text>
    <text class="dl-dg-small" x="387" y="110" text-anchor="middle">positive, sum to 1</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" d="M452 42 H474" marker-end="url(#l6s1-steps)" />
    <rect class="dl-dg-box is-accent" x="478" y="22" width="130" height="40" rx="4" />
    <text class="dl-dg-lab is-sm" x="543" y="47" text-anchor="middle">4 · mix</text>
    <text class="dl-dg-in" x="543" y="90" text-anchor="middle">new vector for bank</text>
    <text class="dl-dg-small" x="543" y="110" text-anchor="middle">weighted sum of values</text>
  </g>
</svg>
</div>

<div class="dl-tight mt-2">

The score $e_{ij} = \mathbf{q}_i \cdot \mathbf{k}_j$ is large when query $i$ and
key $j$ point the same way. $d_k$ is the key width.

</div>

<div v-click class="mt-3 dl-callout">

Score, scale, softmax, mix. Steps 1, 3 and 4 are last week's attention. Step 2 is
new, and it is one division.

</div>

<!--
Write the four words on the board and leave them there for the rest of the
lecture: score, scale, softmax, mix. Every widget that follows is one of these
four.

The picture: four boxes, one per step, and under each the bank row of "the
river bank" after that step. The mix box deliberately has no number yet — the
"One output vector, five lines" derives it (in class, ask the room for it here).

Click: score. Bank's query dotted with every key gives 0, 2, 0. A big dot
product means the two vectors point the same way; only river advertised
anything.

Click 2: scale. Divide by the square root of d_k, here 2, so the scores do not
grow with the width of the model. 2 becomes 1.41.

Click 3: softmax. Positive weights that sum to 1, one per position: 0.16, 0.67,
0.16.

Click 4: mix. The weighted sum of the values is bank's new vector.

Click 5: say the continuity explicitly. Last week's slide was score, softmax,
weighted sum, and a student who noticed that should be told they were right —
the only genuinely new thing in this lecture is *where the scores come from*,
which is now a dot product between two learned projections instead of a small
MLP (multilayer perceptron).

Class cut: about 2 minutes. In the full slides, for self-study, it is followed by "One output vector, five lines".
-->

---
layout: default
title: "In words: Four steps, and that is the whole mechanism"
---

# In words: Four steps, and that is the whole mechanism

<div class="dl-describe">

Read the picture left to right. Each box is one step, and the numbers under it
are the row for *bank* after that step.

1. **Score.** Dot the asking word's query with every key. For *bank* this gives
   0, 2, 0. Only *river* matches.
2. **Scale.** Divide each score by $\sqrt{d_k}$. Here $d_k = 2$, so 2 becomes 1.41.
3. **Softmax.** Turn the scores into weights that are positive and add up to 1:
   0.16, 0.67, 0.16.
4. **Mix.** Add up the values, each times its weight. The result is *bank*'s new
   vector.

Only step 2 is new compared with last week's attention.

</div>

<!--
The point: the four steps, with the bank numbers, as one list to remember.
Twenty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: interactive
heading: One output vector, five lines
title: One output vector, five lines
aside-width: 18rem
---

<AttentionTrace />

::aside::

*bank* asks. Keys and values exist; the **query** is new.

<v-clicks>

- **score** — 0, **2**, 0. Only *river* advertised anything
- **scale** — divide by $\sqrt{2}$
- **softmax** — 0.16, **0.67**, 0.16
- **mix** — two thirds of *river*, a little of the rest

</v-clicks>

<div v-click class="mt-2 dl-callout">

Line 5 is the one to be able to produce unaided.

</div>

<!--
This is the most important widget in the deck. Do not rush it and do not skip it
because the numbers are small — nobody who cannot do this can read an attention
implementation.

Clicks 1 to 4: one bullet per line of the widget — score, scale, softmax, mix.
Walk lines 1 to 4 yourself, then stop and hand line 5 to the room: given weights
0.16, 0.67, 0.16 and values [0.2, 0.2], [2.3, 0.3], [0.6, 0.6], what is the
output? Let them do the multiplication. The answer is [1.68, 0.33].

Click 5: the callout — line 5 is the skill to leave with.

Two things to point at while you are here. The weights sum to exactly 1, which
is why the output is an average rather than something that grows with sentence
length. And "bank" attends 0.16 to itself — the diagonal is always in the sum.

Do not press Swap yet. That is the next slide and it deserves its own beat.
-->

---
layout: default
title: "In words: One output vector, five lines"
---

# In words: One output vector, five lines

<div class="dl-describe">

The widget computes *bank*'s new vector in five lines.

1. **Score:** *bank*'s query $[1, 1]$ dotted with the keys $[0, 0]$, $[2, 0]$,
   $[0, 0]$ gives 0, 2, 0.
2. **Scale:** divide by $\sqrt{2}$, giving 0, 1.41, 0.
3. **Softmax:** the weights are 0.16, 0.67 and 0.16, which add up to 1.
4. **Mix:** $0.16 \times [0.2, 0.2] + 0.67 \times [2.3, 0.3] + 0.16 \times [0.6, 0.6]$.
5. **Output:** $[1.68, 0.33]$. About two thirds of it is *river*'s value.

*bank* also gives 0.16 to itself. A token always attends to itself too.

</div>

<!--
The point: the full worked example, line by line, so a student can redo it on
paper. Thirty seconds, or skip in the lecture if short on time — this slide is
for revision.
-->

---
layout: interactive
core: true
heading: Same word, same weights, different neighbour
title: Same word, same weights, different neighbour
aside-width: 18rem
---

<AttentionTrace :query="2" />

::aside::

Walk to line 5, then press **Swap river → money**.

<v-clicks>

- The model did not change — same $W_Q$, $W_K$, $W_V$
- *bank* is the same word, with the same embedding
- Its output goes $[1.68,\, 0.33] \to [0.33,\, 1.68]$

</v-clicks>

<div v-click class="mt-2 dl-callout">

Sense is not in the word. It is assembled, per sentence, by the layer.

</div>

<!--
This is the payoff of the section. Build it properly: get to line 5, read the
output aloud, ask the room to predict what pressing Swap will do, then press it.

Clicks 1 to 3: the three bullets, as you point at the widget — same weights,
same word, a different output. Click 4: the callout.

The word "contextual" is worth defining here, because students meet it constantly
and rarely get a definition. A word2vec embedding gives "bank" one vector for
life. A transformer gives it a vector per sentence. That difference is this
slide, and it is the difference between 2013 NLP and 2018 NLP.

If someone asks whether the input embedding is now useless: no — it is what the
query and key are computed *from*. Context does not replace the word, it resolves
it.

Class cut: about 4 minutes. In the full slides, for self-study, it is followed by "Why divide by the square root" and "Reading the equation: scaled scores".
-->

---
layout: default
title: "In words: Same word, same weights, different neighbour"
---

# In words: Same word, same weights, different neighbour

<div class="dl-describe">

- The widget runs the same computation on a second sentence, "the money bank".
  Only the middle word changed.
- $W_Q$, $W_K$ and $W_V$ are the same. *bank*'s embedding is the same, so its
  query $[1, 1]$ is the same.
- *money* advertises the money axis: its key is $[0, 2]$. So *bank*'s scores
  are again 0, 2, 0, and its weights again 0.16, 0.67, 0.16.
- But *money* hands over a different value. So *bank*'s output becomes
  $[0.33, 1.68]$ instead of $[1.68, 0.33]$.
- The meaning of a word is not stored in the word. The layer builds it from the
  neighbours, separately in each sentence.

</div>

<!--
The point: the payoff of the section, written out. Twenty seconds; skip in the
lecture if short on time — this slide is for revision.
-->

---
layout: default
title: Why divide by the square root
---

# Why divide by the square root

<div class="grid grid-cols-2 gap-8 mt-1 items-start">
<div class="dl-tight">

<v-clicks>

- A dot product of two $d_k$-wide vectors adds up $d_k$ terms. Its size grows
  like $\sqrt{d_k}$
- At $d_k = 64$: about **8×** bigger than at $d_k = 1$
- Big scores **saturate** the softmax: one weight near 1, the rest near 0

</v-clicks>

<div v-click class="mt-3 dl-callout">

A saturated softmax has **near-zero gradient**. The layer stops learning where to
look, and nothing warns you.

</div>

</div>
<div>

<svg viewBox="0 0 330 150" class="dl-diagram" style="max-height: 11rem" role="img" aria-label="Softmax of scores 0 2 0 gives weights 0.11 0.79 0.11; the same scores eight times bigger, 0 16 0, give 0.00 1.00 0.00 — saturated">
  <text class="dl-dg-small" x="10" y="12">scores 0, 2, 0</text>
  <line class="dl-dg-split" x1="10" y1="112" x2="150" y2="112" />
  <rect class="dl-dg-bar" x="18" y="103" width="32" height="9" />
  <rect class="dl-dg-bar is-q" x="64" y="49" width="32" height="63" />
  <rect class="dl-dg-bar" x="110" y="103" width="32" height="9" />
  <text class="dl-dg-small" x="34" y="98" text-anchor="middle">0.11</text>
  <text class="dl-dg-small" x="80" y="44" text-anchor="middle">0.79</text>
  <text class="dl-dg-small" x="126" y="98" text-anchor="middle">0.11</text>
  <text class="dl-dg-small" x="34" y="128" text-anchor="middle">the</text>
  <text class="dl-dg-small" x="80" y="128" text-anchor="middle">river</text>
  <text class="dl-dg-small" x="126" y="128" text-anchor="middle">bank</text>
  <g v-click>
    <text class="dl-dg-small is-bad" x="180" y="12">× 8 → 0, 16, 0</text>
    <line class="dl-dg-split" x1="180" y1="112" x2="320" y2="112" />
    <rect class="dl-dg-bar is-bad" x="234" y="32" width="32" height="80" />
    <text class="dl-dg-small" x="204" y="106" text-anchor="middle">0.00</text>
    <text class="dl-dg-small" x="250" y="27" text-anchor="middle">1.00</text>
    <text class="dl-dg-small" x="296" y="106" text-anchor="middle">0.00</text>
    <text class="dl-dg-small" x="204" y="128" text-anchor="middle">the</text>
    <text class="dl-dg-small" x="250" y="128" text-anchor="middle">river</text>
    <text class="dl-dg-small" x="296" y="128" text-anchor="middle">bank</text>
    <text class="dl-dg-small is-bad" x="250" y="146" text-anchor="middle">saturated</text>
  </g>
</svg>

<div v-click class="mt-1 dl-math-sm">

$$ \alpha_{ij} = \operatorname{softmax}_j\!\left(\frac{\mathbf{q}_i \cdot \mathbf{k}_j}{\sqrt{d_k}}\right) $$

</div>

<div v-click class="dl-secondary">

$d_k = 64$ in the 2017 model, so the divisor is **8**.

</div>

</div>
</div>

<!--
The vanishing-gradient story from week 5, in a new costume: something saturates,
its derivative goes to zero, learning stops. Third time this term. Name the
pattern.

The picture: softmax weights as bars over the three words. Left, the bank scores
0, 2, 0 with no scaling — 0.11, 0.79, 0.11, already peaked. Right, the same
scores eight times bigger, the size they reach at d_k = 64.

Clicks 1 to 3: the three bullets. A dot product is a sum of d_k terms, so it
grows with the width; at 64 it is about eight times bigger; big scores
saturate the softmax.

Click 4: the callout — a saturated softmax has near-zero gradient everywhere,
and nothing warns you.

Click 5: the right-hand bars. 0, 16, 0 gives 0.00, 1.00, 0.00 — one weight
takes everything.

Click 6: the formula, which the next slide reads symbol by symbol.

Click 7: d_k = 64 in the 2017 model, so the division is by 8. One constant, and
the whole reason the mechanism is called *scaled* dot-product attention.

The paper's own footnote is the argument: if q and k have independent components
with mean 0 and variance 1, their dot product has mean 0 and variance d_k, so
the standard deviation is sqrt(d_k). Dividing by sqrt(d_k) puts the variance back
to 1.

Worth stating that this is not a subtle refinement — without it, deep models with
wide heads simply do not train.
-->

---
layout: default
title: "Reading the equation: scaled scores"
---

# Reading the equation: scaled scores

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $i$ | query index | the asking token, $1, \dots, T$ | 3 (*bank*) |
| $j$ | key index | the token read, $1, \dots, T$ | 2 (*river*) |
| $\mathbf{q}_i$ | query | $\mathbf{x}_i W_Q$, $d_k$ numbers ($W_Q$ learned) | $[1, 1]$ |
| $\mathbf{k}_j$ | key | $\mathbf{x}_j W_K$, same shape | $[2, 0]$ |
| $\cdot$ | dot product | multiply pairwise, then add | 2 |
| $d_k$ | key width | set by hand | 2 (paper: 64) |
| $\sqrt{d_k}$ | square root | the divisor | 1.41 |
| $\operatorname{softmax}_j$ | softmax over $j$ | positive weights, row sums to 1 | |
| $\alpha_{ij}$ | attention weight | share of $j$ in $i$'s output | 0.67 |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" class="dl-diagram" role="img" aria-label="The bank row. Scores 0, 2, 0. Divided by root 2: 0, 1.41, 0. After softmax: 0.16, 0.67, 0.16" style="width: 100%; height: auto">
  <text v-for="(h, c) in ['the', 'river', 'bank']" :key="'h' + c" :x="113 + c * 64" y="16" text-anchor="middle" style="fill: var(--dl-muted); font-size: 11px; font-style: italic">{{ h }}</text>
  <g v-for="(row, r) in [['q · k', ['0', '2', '0']], ['÷ √2', ['0', '1.41', '0']], ['softmax', ['0.16', '0.67', '0.16']]]" :key="r">
    <text x="72" :y="45 + r * 42" text-anchor="end" style="fill: var(--dl-muted); font-size: 11px">{{ row[0] }}</text>
    <g v-for="(v, c) in row[1]" :key="c">
      <rect :x="86 + c * 64" :y="25 + r * 42" width="54" height="32" rx="3" :style="r === 2 && c === 1 ? 'fill: var(--dl-accent-soft); stroke: var(--dl-accent); stroke-width: 1.5' : 'fill: var(--dl-surface); stroke: var(--dl-border); stroke-width: 1.5'" />
      <text :x="113 + c * 64" :y="46 + r * 42" text-anchor="middle" style="fill: var(--dl-heading); font-size: 13px">{{ v }}</text>
    </g>
  </g>
</svg>

<div v-click class="dl-callout">

$\mathbf{q}_3 \cdot \mathbf{k}_2 = 1 \times 2 + 1 \times 0 = 2$, and $2 / \sqrt{2} = 1.41$

$\alpha_{32} = e^{1.41} / (e^{0} + e^{1.41} + e^{0}) = 4.11 / 6.11 = 0.67$

</div>

</div>
</div>

<!--
This is the bank row from the AttentionTrace widget on "One output vector, five
lines", with every symbol named. Nothing new in the numbers — 0, 2, 0, then
0.16, 0.67, 0.16.

Clicks 1 to 9: one legend row per click, from the indices down to alpha. Click
10: the worked arithmetic in the callout.

Walk the indices first. i is the token that asks (row of the attention matrix),
j the token being read (column). In "the river bank", bank is token 3 and river
is token 2, so the 0.67 is alpha_32. T is the number of tokens, 3 here.

Say which parts are learned: W_Q and W_K, so the queries and keys. d_k is a
choice made by hand. The softmax and the square root are fixed operations with
nothing to learn.

The subscript j on softmax says which way it normalises: along a row, over every
token j that i could read. That is why each row sums to 1 and the columns do
not.

The check for the room: bank's query is [0, 0, 0, 2] times W_Q = [1, 1]. River's
key is [0, 2, 0, 1] times W_K = [2, 0]. The other two keys are [0, 0].

Without the division the softmax of 0, 2, 0 is 0.11, 0.79, 0.11 — more peaked
even at d_k = 2. At d_k = 64 raw scores are about eight times bigger than at
d_k = 1, so the softmax saturates hard; dividing by 8 undoes exactly that.
-->

---
layout: default
title: "In words: Why divide by the square root"
---

# In words: Why divide by the square root

<div class="dl-describe">

- A score is a dot product: $d_k$ products added together. Wider keys give
  bigger scores, typically growing like $\sqrt{d_k}$.
- The left bars are the softmax of the scores 0, 2, 0: weights 0.11, 0.79, 0.11.
  The right bars use the same scores eight times bigger, 0, 16, 0. The weights
  become 0.00, 1.00, 0.00.
- That softmax is **saturated**. Its gradient is almost zero, so the layer stops
  learning where to look.
- The fix is $\alpha_{ij} = \operatorname{softmax}_j(\mathbf{q}_i \cdot \mathbf{k}_j / \sqrt{d_k})$.
  Dividing by $\sqrt{d_k}$ cancels the growth.
- For *bank* ($d_k = 2$): $2 / \sqrt{2} = 1.41$, and the weight on *river* is
  0.67.
- In the 2017 model, $d_k = 64$, so the divisor is 8.

</div>

<!--
The point: covers both "Why divide by the square root" and its "Reading the
equation" slide — why the scaling exists and what the formula computes. Thirty
seconds; skip in the lecture if short on time — this slide is for revision.
-->

---
layout: interactive
core: true
heading: Every query at once
title: Every query at once
aside-width: 18rem
---

<AttentionMatrix :maskable="false" switchable />

::aside::

All three rows. Rows **ask**, columns **are read**.

<v-clicks>

- *the* asks nothing, so its row is flat: 0.33 each
- *bank*'s row is the one we just derived
- Every row sums to **1**

</v-clicks>

<div v-click class="mt-2 dl-callout">

No cell depends on another, so all nine are computed **at the same time**. The
wall comes down.

</div>

<!--
The callout is the sentence the whole lecture has been walking towards, so say
it deliberately and point at the grid while you do.

Clicks 1 to 3: the three bullets — the flat row for "the", bank's row, every row
summing to 1. Click 4: the callout.

Compare it out loud with last week's picture: an RNN computes h_1, then h_2, then
h_3, and cannot start h_2 early. This grid is one matrix multiply. A GPU fills it
in one shot whether the sentence is three words or three thousand.

Hovering a row puts that row's numbers in the readout. The flat row for "the" is
worth pausing on: a token with a zero query gets a uniform average of the whole
sentence, which is a perfectly sensible thing for a stopword to do.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: Every query at once"
---

# In words: Every query at once

<div class="dl-describe">

- The grid is the full attention matrix for "the river bank". Each row is a word
  asking with its query. Each column is a word being read through its key.
- Row *the*: its query is zero, so every score is 0. The weights are flat, 0.33
  each.
- Row *river*: weights 0.25, 0.50, 0.25.
- Row *bank*: 0.16, 0.67, 0.16, the row from the five-line derivation.
- Every row adds up to 1.
- No cell needs any other cell. So all nine are computed at the same time, in
  one matrix multiply. A recurrent network had to compute its states one after
  another, so this removes last week's second wall.

</div>

<!--
The point: the whole matrix, and why it means parallel computation. Twenty
seconds; skip in the lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: The whole layer, in one line
---

# The whole layer, in one line

Stack the queries into $Q$, the keys into $K$ and the values into $V$, one row
per token. $T$ is the number of tokens. The four steps become one line:

<div class="mt-1">

$$ \operatorname{Attention}(Q, K, V) = \operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V $$

</div>

<div class="flex justify-center">
<svg viewBox="0 0 520 124" class="dl-diagram" style="max-height: 8.6rem" role="img" aria-label="Q, T by d_k, times K transpose, d_k by T, gives a T by T grid of scores; divide and softmax gives T by T weights; times V, T by d_v, gives the T by d_v output">
  <defs>
    <marker id="l6s1-layer" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-click>
    <rect class="dl-dg-box" x="10" y="18" width="24" height="72" rx="2" />
    <text class="dl-dg-lab is-sm" x="22" y="12" text-anchor="middle">Q</text>
    <text class="dl-dg-small" x="22" y="108" text-anchor="middle">T × d_k</text>
    <text class="dl-dg-lab is-sm" x="48" y="58" text-anchor="middle">×</text>
    <rect class="dl-dg-box" x="62" y="18" width="72" height="24" rx="2" />
    <text class="dl-dg-lab is-sm" x="98" y="12" text-anchor="middle">Kᵀ</text>
    <text class="dl-dg-small" x="98" y="58" text-anchor="middle">d_k × T</text>
    <text class="dl-dg-lab is-sm" x="148" y="58" text-anchor="middle">=</text>
    <rect class="dl-dg-box" x="162" y="18" width="72" height="72" rx="2" />
    <text class="dl-dg-lab is-sm" x="198" y="12" text-anchor="middle">1 · scores</text>
    <text class="dl-dg-small" x="198" y="108" text-anchor="middle">T × T</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" d="M236 54 H282" marker-end="url(#l6s1-layer)" />
    <text class="dl-dg-small" x="259" y="44" text-anchor="middle">2 · ÷ √d_k</text>
    <text class="dl-dg-small" x="259" y="72" text-anchor="middle">3 · softmax</text>
    <rect class="dl-dg-box is-accent" x="288" y="18" width="72" height="72" rx="2" />
    <text class="dl-dg-lab is-sm" x="324" y="12" text-anchor="middle">weights</text>
    <text class="dl-dg-small" x="324" y="108" text-anchor="middle">T × T</text>
    <text class="dl-dg-small" x="324" y="121" text-anchor="middle">rows sum to 1</text>
  </g>
  <g v-click>
    <text class="dl-dg-lab is-sm" x="374" y="58" text-anchor="middle">×</text>
    <rect class="dl-dg-box" x="388" y="18" width="24" height="72" rx="2" />
    <text class="dl-dg-lab is-sm" x="400" y="12" text-anchor="middle">V</text>
    <text class="dl-dg-small" x="400" y="108" text-anchor="middle">T × d_v</text>
    <text class="dl-dg-lab is-sm" x="430" y="58" text-anchor="middle">=</text>
    <rect class="dl-dg-box is-accent" x="452" y="18" width="24" height="72" rx="2" />
    <text class="dl-dg-lab is-sm" x="464" y="12" text-anchor="middle">4 · output</text>
    <text class="dl-dg-small" x="464" y="108" text-anchor="middle">T × d_v</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

Two matrix multiplies and a softmax. Every transformer is this line.

</div>

<!--
Map each symbol back to the widget as you reveal it. The students have just seen
all four steps as numbers; this slide's only job is to convince them that the
scary line in the paper is those four steps written compactly.

The picture draws every matrix with its shape: tall and thin is T rows of a few
numbers, the square is T by T.

Click: step 1. Q is (T, d_k) and K transpose is (d_k, T), so QK^T is a (T, T)
grid of scores — every query against every key at once.

Click 2: steps 2 and 3. Divide by sqrt(d_k), then softmax along each row, so
every row of weights sums to 1.

Click 3: step 4. The (T, T) weights times V, which is (T, d_v), give the (T, d_v)
output — one new vector per token. d_v is the value width.

Click 4: the callout — two matrix multiplies and a softmax.

Have the room confirm the T x T — it is the shape that comes back to bite in
section 02.

Class cut: about 2 minutes. In the full slides, for self-study, it is followed by "Poll: where self-attention's keys come from".
-->

---
layout: default
title: "In words: The whole layer, in one line"
---

# In words: The whole layer, in one line

<div class="dl-describe">

The equation does all four steps for every word at once. $Q$, $K$ and $V$ hold
the queries, keys and values, one row per token. $T$ counts the tokens.

1. $Q$ ($T \times d_k$) times $K^\top$ ($d_k \times T$) gives a $T \times T$ grid
   of scores: every query against every key.
2. Every score is divided by $\sqrt{d_k}$.
3. Softmax runs along each row, so every row of weights adds up to 1.
4. The weights ($T \times T$) times $V$ ($T \times d_v$) give the output: one new
   vector per token, $T \times d_v$.

For "the river bank", $T = 3$, so the grid of scores is $3 \times 3$.

</div>

<!--
The point: the one-line formula, step by step, with shapes. Twenty seconds; skip
in the lecture if short on time — this slide is for revision.
-->

---
layout: default
title: "Poll: where self-attention's keys come from"
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="In self-attention over one sentence, where do the keys come from?"
  :items="[
    'A separate memory the model has stored from training',
    'The previous layer\'s output for every token in this same sentence',
    'The decoder, one per output step',
    'The positional encoding',
  ]"
/>

</div>
<div class="mt-8">

<svg viewBox="0 0 240 190" class="dl-diagram" role="img" aria-label="The query of bank looks for keys; after the answer, arrows show each key coming from one of the three words of the same sentence">
  <defs>
    <marker id="l6s1-poll" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <circle class="dl-dg-dot is-accent" cx="120" cy="22" r="12" />
  <text x="120" y="27" text-anchor="middle" style="fill: var(--dl-bg); font-size: 13px; font-weight: 700">q</text>
  <path class="dl-dg-line is-muted" d="M112 32 L46 76 M120 34 L120 76 M128 32 L194 76" />
  <rect class="dl-dg-box" x="22" y="80" width="48" height="26" rx="3" />
  <rect class="dl-dg-box" x="96" y="80" width="48" height="26" rx="3" />
  <rect class="dl-dg-box" x="170" y="80" width="48" height="26" rx="3" />
  <text class="dl-dg-lab is-sm" x="46" y="98" text-anchor="middle">k ?</text>
  <text class="dl-dg-lab is-sm" x="120" y="98" text-anchor="middle">k ?</text>
  <text class="dl-dg-lab is-sm" x="194" y="98" text-anchor="middle">k ?</text>
  <g v-click="3">
    <path class="dl-dg-arrow" d="M46 150 V112" marker-end="url(#l6s1-poll)" />
    <path class="dl-dg-arrow" d="M120 150 V112" marker-end="url(#l6s1-poll)" />
    <path class="dl-dg-arrow" d="M194 150 V112" marker-end="url(#l6s1-poll)" />
    <rect class="dl-dg-box" x="14" y="152" width="64" height="26" rx="4" />
    <rect class="dl-dg-box" x="88" y="152" width="64" height="26" rx="4" />
    <rect class="dl-dg-box is-accent" x="162" y="152" width="64" height="26" rx="4" />
    <text class="dl-dg-lab is-sm" x="46" y="170" text-anchor="middle" style="font-style: italic">the</text>
    <text class="dl-dg-lab is-sm" x="120" y="170" text-anchor="middle" style="font-style: italic">river</text>
    <text class="dl-dg-lab is-sm" x="194" y="170" text-anchor="middle" style="font-style: italic">bank</text>
  </g>
</svg>

</div>
</div>

<div v-click="1" class="mt-4 dl-reveal">

The same sentence

</div>

<div v-click="2" class="mt-2 dl-secondary">

Queries, keys and values all come from the **same** words: that is the *self*.

</div>

<!--
The sketch: bank's query looking for keys, with the source of the keys left as
a question mark. Ask the room before the first click.

Click: the answer, the same sentence. Click 2: why — self means one source for
queries, keys and values. Click 3: the sketch fills in. Each key comes from one
of the three words of this same sentence, the previous layer's output for that
token.

Option 1 is the one to draw out. It is what "the model looks things up" suggests
to a student who has met retrieval systems, and it is wrong in an instructive
way: there is no store, and nothing persists between sentences.

This also sets up cross-attention cleanly — once they are sure self-attention
means one source, "queries from here, keys from there" is an obvious variation
rather than a new mechanism.
-->

---
layout: default
title: "In words: Where self-attention's keys come from"
---

# In words: Where self-attention's keys come from

<div class="dl-describe">

- In self-attention over one sentence, the keys come from **the same sentence**. Each key is the previous layer's output
  for one token, multiplied by $W_K$.
- In the picture, *bank*'s query looks at three keys. After the answer, arrows
  show that each key is made from one of the three words below it. The queries
  and values come from the same three words.
- There is no stored memory from training. Nothing is kept from one sentence to
  the next.
- That is what *self* means: one sequence gives the queries, the keys and the
  values. Cross-attention, in section 03, takes them from two different places.

</div>

<!--
The point: the poll's answer and why the wrong options are wrong, for revision.
Twenty seconds; skip in the lecture if short on time.
-->

---
layout: section
index: "02"
---

# From one head to one block

Many heads, one block.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="block" :size="190" /></div>

<!--
Section 02 turns the single attention computation from section 01 into one
complete transformer block: several heads, position information, the
feed-forward network, and the residual and LayerNorm wrappers that let blocks
stack. The glyph is the block: a sideways mixing bar, a small per-position
network above it, and the residual wire running around both. It comes back on
the recap.

About 25 minutes. Multi-head attention, the feed-forward network and the two
wrappers are the core. If you are short on time, compress the two cost slides
at the end to their callouts.
-->

---
layout: default
core: true
title: One softmax can only point at one thing
---

# One softmax can only point at one thing

To read *it*, the model needs several answers at once.

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 240" class="dl-diagram" style="max-height: 12rem" role="img" aria-label="The sentence the cat ate the fish because it was hungry. One softmax arc from it lands on cat; dashed lines mark three other questions: nearby noun, previous word, which clause">
  <path class="dl-dg-grad is-good" d="M476 128 Q296 20 116 128" style="stroke-width: 4" />
  <text class="dl-dg-small is-good" x="296" y="54" text-anchor="middle">one softmax: most weight on one word</text>
  <g v-for="(w, i) in ['the', 'cat', 'ate', 'the', 'fish', 'because', 'it', 'was', 'hungry']" :key="i">
    <rect :class="i === 6 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="12 + i * 72" y="130" width="64" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" :x="44 + i * 72" y="150" text-anchor="middle">{{ w }}</text>
  </g>
  <g v-click>
    <path class="dl-dg-loss" d="M116 162 V188" />
    <text class="dl-dg-small" x="116" y="202" text-anchor="middle">what it refers to</text>
    <path class="dl-dg-loss" d="M332 162 V188" />
    <text class="dl-dg-small" x="332" y="202" text-anchor="middle">nearby noun</text>
    <path class="dl-dg-loss" d="M404 162 V216" />
    <text class="dl-dg-small" x="404" y="230" text-anchor="middle">previous word</text>
    <path class="dl-dg-loss" d="M374 172 H634" />
    <text class="dl-dg-small" x="560" y="190" text-anchor="middle">which clause</text>
  </g>
</svg>
</div>

<div class="grid grid-cols-2 gap-8 mt-1">

<div v-click class="dl-callout">

A softmax puts its weight in **one** place. Four questions need four sets of
weights.

</div>

<div v-click>

So run attention **several times side by side**, each copy with its own
$W_Q$, $W_K$, $W_V$. Each copy is a **head**.

</div>

</div>

<!--
Derive multi-head attention rather than announcing it, the same way last week
derived the gates. The need has to be felt before the fix is introduced.

On screen: the sentence as a row of word boxes, with *it* highlighted. The solid
arc is one softmax for *it*, and its weight lands on *cat*. Ask the room what
else *it* needs to know before you click. You will get at least two answers.

Click: the dashed lines appear, one per question — what *it* refers to (cat), a
nearby noun (fish), the previous word (because), and which clause it sits in
(the bracket under "because it was hungry").

Click 2: the callout. The softmax weights add up to 1, so one set of weights
can only express one relationship well. Spreading the weight over four places
blurs all four answers.

Click 3: the fix. The word "head" has no deeper meaning. It is one independent
copy of the mechanism with its own three matrices.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: One softmax can only point at one thing"
---

# In words: One softmax can only point at one thing

<div class="dl-describe">

- The word boxes spell out the sentence. The solid arc is one softmax for *it*. Its weights add up to 1, so
  most of the weight lands on one word: *cat*.
- The dashed lines are other questions *it* needs answered: a nearby noun, the
  previous word, and the clause it sits in.
- One set of weights cannot point at four places at once. Spreading the weight
  would blur the four answers together.
- The fix is to run attention several times side by side. Each copy has its own
  $W_Q$, $W_K$ and $W_V$, and is called a head.

</div>

<!--
Revision slide: the reason multi-head attention exists. Give the room 30
seconds to read it, or skip it in the lecture if short on time.
-->

---
layout: interactive
core: true
heading: Four heads, one question each
title: Four heads, one question each
aside-width: 17rem
---

<MultiHeadLab />

::aside::

*it* is asking. Four heads, four different answers.

<v-clicks>

- **head 1** — the previous word
- **head 3** — five words back, to *cat*
- **head 4** — parks on token 1 and does nothing

</v-clicks>

<div v-click class="mt-2 dl-callout">

Head 4 is not a drawing error. Nearly-dead heads are in every model anyone has
looked inside.

</div>

<!--
The point: with four heads, one word can get four different answers at once.
Say plainly that these weights are drawn, not trained — a four-dimensional toy
model produces nothing interpretable, and claiming otherwise would be a lie the
students could not detect. The patterns are caricatures of things that do show
up repeatedly in published attention maps.

On screen: one row per head, each row showing that head's weights over the
sentence for the current query word. Start on *it*.

Click: head 1 puts 0.76 on *because*, the word just before *it*.

Click 2: head 3 puts 0.62 on *cat*, five words back — the word *it* refers to.
Head 2, not in the list, splits between *fish* (0.50) and *cat* (0.31).

Click 3: head 4 puts 0.86 on the first *the* and gathers almost nothing.

Click 4: the callout. "Attention sinks" — heads that dump most of their mass on
the first token — are a robust finding, and they matter practically: they are
why you cannot simply evict the first tokens from a KV cache.

Press Next query word a couple of times so they see the rows change together.

Class cut: about 4 minutes. In the full slides, for self-study, it is followed by "Heads are free".
-->

---
layout: default
title: "In words: Four heads, one question each"
---

# In words: Four heads, one question each

<div class="dl-describe">

The widget shows four heads reading the same sentence. Each row holds one head's
weights over the words.

- Stop on *it* and read down the rows. Each head looks somewhere else.
- Head 1 puts 0.76 on *because*, the previous word.
- Head 2 splits its weight between the nearby nouns *fish* (0.50) and *cat* (0.31).
- Head 3 puts 0.62 on *cat*, the word *it* refers to.
- Head 4 puts 0.86 on the first word and gathers almost nothing. Real models have
  heads like this too.

These weights were drawn by hand, not trained. The takeaway: each head answers
a different question about the same word.

</div>

<!--
Revision slide for the multi-head widget. Give the room 30 seconds; skip in the
lecture if short on time.
-->

---
layout: default
title: Heads are free
---

# Heads are free

Eight heads do **not** cost eight times one head. Each head is **narrower**.

<div class="grid grid-cols-2 gap-8 mt-2 items-start">
<div>

<svg viewBox="0 0 300 250" class="dl-diagram" role="img" aria-label="An input 512 wide is projected and cut into 8 heads of 64; the 8 outputs are concatenated back to 512 and mixed by W_O into a 512-wide output" style="max-height: 16rem">
  <defs>
    <marker id="l6s2-heads-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="22" y="214" width="256" height="24" rx="3" />
  <text class="dl-dg-small" x="150" y="230" text-anchor="middle">input: 512</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-heads-arrow)" d="M150 212 V190" />
  <g v-for="k in 8" :key="k">
    <rect class="dl-dg-box is-accent" :x="22 + (k - 1) * 32.3" y="156" width="30" height="30" rx="3" />
    <text class="dl-dg-small" :x="37 + (k - 1) * 32.3" y="175" text-anchor="middle">64</text>
  </g>
  <text class="dl-dg-small" x="150" y="148" text-anchor="middle">8 heads × 64</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-heads-arrow)" d="M150 136 V118" />
  <rect class="dl-dg-box" x="22" y="90" width="256" height="24" rx="3" />
  <text class="dl-dg-small" x="150" y="106" text-anchor="middle">8 × 64 = 512</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-heads-arrow)" d="M150 88 V70" />
  <polygon class="dl-dg-net" points="110,66 190,66 200,42 100,42" />
  <text class="dl-dg-in" x="150" y="59" text-anchor="middle">W_O</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-heads-arrow)" d="M150 40 V30" />
  <rect class="dl-dg-box" x="22" y="4" width="256" height="24" rx="3" />
  <text class="dl-dg-small" x="150" y="20" text-anchor="middle">output: 512</text>
</svg>

</div>
<div>

<div v-click>
<div class="dl-math-sm">

$$ \operatorname{MHA}(X) = \left[\operatorname{head}_1 \,\|\, \cdots \,\|\, \operatorname{head}_h\right] W_O $$

</div>
<div class="dl-secondary">

Multi-head attention (MHA) of $X$, one row per token. $h$ heads, 8 here;
$\operatorname{head}_i$ is head $i$'s output. $\|$: side by side.

</div>
</div>

<div v-click class="mt-3 dl-callout">

Four $d \times d$ matrices — $W_Q$, $W_K$, $W_V$, $W_O$ — so $4d^2$ weights,
**whatever $h$ is**.

</div>

<div v-click class="mt-3 dl-secondary">

At $d = 512$: $4 \times 512^2 = 1\,048\,576$, for any $h$.

</div>

</div>
</div>

<!--
The point: the number of heads changes how the width is split, not how many
weights there are. The parameter-count invariance surprises people.

On screen, read the diagram bottom to top. The input is 512 numbers per token.
After the projections it is cut into eight heads of 64 (d_k = d_v = 512 / 8 =
64). Each head runs attention at width 64. The eight outputs are put side by
side, 8 x 64 = 512 again, and W_O mixes them.

Click: the equation. MHA(X) is the eight head outputs concatenated, then
multiplied by W_O.

Click 2: four square matrices in total, so 4d^2 weights whatever h is. In an
implementation there is not even a loop: W_Q is one (d, d) matrix, and the
heads are made by reshaping its output into (h, d/h). The slide "Self-attention,
written out" shows exactly that line.

Click 3: the number, 4 x 512^2 = 1 048 576.

W_O is the part most summaries omit. Without it the concatenated output is just
eight independent blocks of 64 numbers with no communication between them, and
the residual stream would have no way to combine what different heads found.

If asked how many heads to use: h such that d/h is 64 or 128 is the near-universal
convention, and the answer has more to do with GPU tiling than with linguistics.
-->

---
layout: default
title: "In words: Heads are free"
---

# In words: Heads are free

<div class="dl-describe">

The diagram follows one multi-head attention layer from bottom to top.

- The input has $d = 512$ numbers per token.
- The projections $W_Q$, $W_K$, $W_V$ are cut into 8 heads. Each head works at
  width 64, because $512 / 8 = 64$.
- The 8 head outputs are placed side by side: $8 \times 64 = 512$.
- $W_O$ then mixes the heads back together into one 512-wide output.
- The layer always has four $d \times d$ matrices, whatever the number of heads.
  At $d = 512$ that is $4 \times 512^2 = 1\,048\,576$ weights.

Takeaway: more heads means narrower heads, not more weights.

</div>

<!--
Revision slide for the head arithmetic. Give the room 30 seconds; skip in the
lecture if short on time.
-->

---
layout: interactive
core: true
heading: Attention does not know what order the words came in
title: Attention does not know what order the words came in
aside-width: 18rem
---

<PositionalEncoding mode="blind" />

::aside::

Press **Shuffle the words**, then read the vectors.

<v-clicks>

- Every word's output is **exactly** what it was
- A weighted sum is a sum over a **set**. A set has no order
- *the river bank* and *bank river the* look the same

</v-clicks>

<div v-click class="mt-2 dl-callout">

Last week's lecture was about order. We have just thrown it away.

</div>

<!--
The point: attention alone cannot see word order. This should feel like a
problem, so let it. Shuffle once, let the room read the numbers themselves, and
wait.

Click: every word's output vector is unchanged, only moved to its new place.

Click 2: why. Each output is a weighted sum over all the words, and a sum does
not care about order.

Click 3: so "the river bank" and "bank river the" are the same input to this
layer.

Click 4: the callout. An RNN got order at no extra cost, because it read in
order. That was the same property that made it impossible to parallelise. We
deleted the recurrence; this is the price.

The technical name is permutation equivariance: permute the input and the outputs
permute with it, otherwise unchanged. For a set of points that is a feature —
it is why the same machinery works on graphs and point clouds. For a sentence it
is a bug.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: Attention does not know what order the words came in"
---

# In words: Attention does not know what order the words came in

<div class="dl-describe">

The widget shows each word's output vector from one attention layer. The button
shuffles the order of the words.

- After a shuffle, every word gets exactly the same output as before. Only its
  place in the list changes.
- The reason: each output is a weighted sum over all the words. A sum gives the
  same answer in any order.
- So, to attention alone, *the river bank* and *bank river the* are the same input.
- A recurrent network knew the order because it read one word at a time.
  Deleting the recurrence removed that knowledge.

Takeaway: the model needs another way to know where each word is.

</div>

<!--
Revision slide for the order problem. Give the room 30 seconds; skip in the
lecture if short on time.
-->

---
layout: interactive
core: true
heading: So put the position into the vector
title: So put the position into the vector
aside-width: 18rem
---

<PositionalEncoding mode="sinusoid" :d-model="16" :positions="12" />

::aside::

One fixed vector per position, **added** to the embedding before block one.

<v-clicks>

- Left dimensions flip fast; right ones barely move
- So one vector carries *which word* and *which end* at once
- Sines and cosines. **Nothing learned**, no maximum length

</v-clicks>

<div v-click class="mt-2 dl-callout">

Added, not concatenated — the model never gets wider.

</div>

<!--
The point: give every position its own fixed vector and add it to the word's
embedding, so order is back in the input. Hover a row to put its first numbers
in the readout.

Click: the left columns change quickly from one position to the next; the right
columns change slowly.

Click 2: together, fast and slow columns give every position a different
pattern, so one vector says which word and where it is.

Click 3: the formula, if anyone wants it: PE(pos, 2i) = sin(pos / 10000^(2i/d))
and the cosine for the odd index. Wavelengths run from 2π to 10000·2π, so the
left columns are a fast clock and the right columns a slow one — the same trick
as the hands of a watch.

Click 4: added, not concatenated. Concatenating would spend model width on
something that is the same for every sentence. Adding works because the
embedding space is large and mostly empty, and the model can learn to keep the
two apart.

Why not just learn a position embedding? You can, and BERT and GPT-2 both do.
Learned embeddings cannot extrapolate past the longest training sequence, which
is exactly the problem RoPE later solves properly — see "Position, done
properly".

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: So put the position into the vector"
---

# In words: So put the position into the vector

<div class="dl-describe">

The widget shows 12 positions as rows and 16 dimensions as columns. Each row is
the position vector for that place in the sentence.

- The numbers come from sines and cosines. Nothing is learned.
- The left columns change quickly from row to row. The right columns change slowly.
- Read together, the fast and slow columns give every position its own pattern.
- This vector is **added** to the word's embedding before the first block. The
  vector does not get any wider.

Takeaway: after the addition, one vector says both which word it is and where it
sits in the sentence.

</div>

<!--
Revision slide for positional encoding. Give the room 30 seconds; skip in the
lecture if short on time.
-->

---
layout: default
core: true
title: The other half of the block
---

# The other half of the block

After attention mixes the positions, each position goes through the **same small
network, alone**:

<div class="mt-1">

$$ \operatorname{FFN}(\mathbf{x}) = W_2\,\phi\!\left(W_1\mathbf{x} + \mathbf{b}_1\right) + \mathbf{b}_2 $$

</div>

<div class="grid grid-cols-2 gap-8 mt-1 dl-tight">
<div>

<v-clicks>

- Two linear layers and a non-linearity: lecture 02's MLP (multilayer perceptron)
- **Position-wise**: no token sees another
- Wide in the middle: $d_{\text{ff}} = 4d = 2048$

</v-clicks>

<div v-click class="mt-2 dl-secondary">

$2 \times 512 \times 2048 = 2\,097\,152$ weights, against 1.05 M for attention:
**two thirds of the block.**

</div>

</div>
<div>

<svg viewBox="0 0 600 170" class="dl-diagram" role="img" aria-label="The words the, river and bank each go up through their own copy of the same feed-forward network; there are no arrows between the columns">
  <defs>
    <marker id="l6s2-ffn-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="(w, i) in ['the', 'river', 'bank']" :key="i">
    <rect class="dl-dg-box" :x="50 + i * 200" y="138" width="100" height="28" rx="4" />
    <text class="dl-dg-lab is-sm" :x="100 + i * 200" y="157" text-anchor="middle">{{ w }}</text>
    <path class="dl-dg-arrow" marker-end="url(#l6s2-ffn-arrow)" :d="'M' + (100 + i * 200) + ' 136 V120'" />
    <polygon class="dl-dg-net" :points="(80 + i * 200) + ',116 ' + (120 + i * 200) + ',116 ' + (160 + i * 200) + ',80 ' + (120 + i * 200) + ',44 ' + (80 + i * 200) + ',44 ' + (40 + i * 200) + ',80'" />
    <text class="dl-dg-in" :x="100 + i * 200" y="85" text-anchor="middle">FFN</text>
    <path class="dl-dg-arrow" marker-end="url(#l6s2-ffn-arrow)" :d="'M' + (100 + i * 200) + ' 42 V24'" />
    <rect class="dl-dg-box is-accent" :x="60 + i * 200" y="2" width="80" height="20" rx="4" />
  </g>
</svg>

<div v-click class="mt-2 dl-callout">

Attention decides **what to gather**. This decides **what to do with it**.

</div>

</div>
</div>

<!--
This slide is routinely skipped and it should not be. A student who thinks a
transformer is only attention cannot explain the parameter count, cannot read an
implementation, and is missing the part that most interpretability work now
points at as the store of factual knowledge.

On screen: the equation, and three words of the running example, each going up
through its own copy of the same network. The copies share their weights. There
are no arrows between the columns: nothing moves between positions here.

Click: two linear layers with a non-linearity between them — the MLP from
lecture 02.

Click 2: "position-wise" made concrete. It is a Linear layer applied to a
(B, T, d) tensor, which PyTorch broadcasts over the first two dimensions
automatically. There is no loop and there is no mixing.

Click 3: wide in the middle. Why 4x: no principled reason. It is what the paper
used and what stuck.

Click 4: the weight count, 2 x 512 x 2048 = 2 097 152, twice the attention
sub-layer.

Click 5: the callout. Attention gathers; the FFN processes what was gathered.
"Reading the equation: the feed-forward network" reads it symbol by symbol.

Class cut: about 2 minutes. In the full slides, for self-study, it is followed by "Reading the equation: the feed-forward network".
-->

---
layout: default
title: "Reading the equation: the feed-forward network"
---

# Reading the equation: the feed-forward network

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $\mathbf{x}$ | input | one token's vector, $d$ numbers | $[1, 2]$ |
| $d$ | model width | $d_{\text{model}}$, set by hand | 2 (paper: 512) |
| $d_{\text{ff}}$ | hidden width | set by hand, usually $4d$ | 3 (paper: 2048) |
| $W_1$ | first weights | $d_{\text{ff}} \times d$, learned | rows $(1, 0), (0, 1), (1, -1)$ |
| $\mathbf{b}_1$ | first bias | $d_{\text{ff}}$ numbers, learned | $[0, -1, 0]$ |
| $\phi$ | activation | ReLU: $\max(0, \cdot)$, per number | $-1 \to 0$ |
| $W_2$ | second weights | $d \times d_{\text{ff}}$, learned | rows $(1, 1, 1), (0, 1, 2)$ |
| $\mathbf{b}_2$ | second bias | $d$ numbers, learned | $[0.5, 0]$ |
| $\operatorname{FFN}$ | feed-forward network | same shape out as in | $[2.5, 1]$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" class="dl-diagram" role="img" aria-label="Two numbers 1, 2 go in. After the first layer: 1, 1, minus 1. After ReLU: 1, 1, 0. After the second layer: 2.5, 1" style="width: 100%; height: auto">
  <g v-for="(col, c) in [['x', ['1', '2']], ['W₁x + b₁', ['1', '1', '−1']], ['φ', ['1', '1', '0']], ['FFN(x)', ['2.5', '1']]]" :key="c">
    <text :x="34 + c * 77" y="142" text-anchor="middle" style="fill: var(--dl-muted); font-size: 11px">{{ col[0] }}</text>
    <g v-for="(v, r) in col[1]" :key="r">
      <rect :x="12 + c * 77" :y="(col[1].length === 2 ? 34 : 14) + r * 40" width="44" height="32" rx="3" :style="(c === 2 && r === 2) || c === 3 ? 'fill: var(--dl-accent-soft); stroke: var(--dl-accent); stroke-width: 1.5' : 'fill: var(--dl-surface); stroke: var(--dl-border); stroke-width: 1.5'" />
      <text :x="34 + c * 77" :y="(col[1].length === 2 ? 55 : 35) + r * 40" text-anchor="middle" style="fill: var(--dl-heading); font-size: 13px">{{ v }}</text>
    </g>
  </g>
  <path v-for="c in [0, 1, 2]" :key="'a' + c" :d="'M ' + (60 + c * 77) + ' 70 h 22'" style="fill: none; stroke: var(--dl-body); stroke-width: 1.8" />
</svg>

<div v-click class="dl-callout">

$W_1\mathbf{x} + \mathbf{b}_1 = [1,\ 2,\ 1 - 2] + [0, -1, 0] = [1, 1, -1]$

$W_2\,[1, 1, 0] + \mathbf{b}_2 = [2, 1] + [0.5, 0] = [2.5, 1]$

</div>

</div>
</div>

<!--
A toy with two numbers per token and a hidden layer of three, so the arithmetic
fits on the slide. The real one is 512 in, 2048 in the middle, 512 out. The toy
breaks the 4x rule only to stay small; nothing else changes.

Say which parts are learned: both weight matrices and both biases. d and d_ff
are set by hand. phi is a fixed function with nothing to learn — ReLU in the
2017 paper. Later models use GELU (Gaussian error linear unit) or SwiGLU, as
"What else changed inside the block" shows.

Walk it left to right. First layer, row by row: 1*1 + 0*2 = 1, then 0*1 + 1*2
= 2, then 1*1 - 1*2 = -1. Add b1 = [0, -1, 0]: [1, 1, -1]. ReLU sets the
negative number to 0: [1, 1, 0]. Second layer: 1 + 1 + 0 = 2 and 0 + 1 + 0 =
1, then add b2 = [0.5, 0]: [2.5, 1].

The equation is written for a single token as a column vector. In code the
whole (B, T, d) tensor goes through at once and the matrix sits on the right,
x @ W1 — same numbers, transposed bookkeeping.

Output shape equals input shape. That is what lets the residual add in "Two wrappers that make it
stackable" work.
-->

---
layout: default
title: "In words: The other half of the block"
---

# In words: The other half of the block

<div class="dl-describe">

This covers the feed-forward network (FFN) and its equation.

- The diagram shows *the*, *river* and *bank*. Each goes up through its own copy
  of the same small network. The copies share their weights.
- There are no arrows between the columns. No token sees another here, because
  attention already did the mixing.
- The FFN is two linear layers with a ReLU between them. It widens each vector
  from 512 to 2048 numbers, then narrows it back to 512.
- Worked example: $\mathbf{x} = [1, 2]$ becomes $[1, 1, -1]$, then $[1, 1, 0]$
  after ReLU, then $[2.5, 1]$.

Takeaway: attention gathers information; the FFN works on what was gathered.

</div>

<!--
Revision slide covering "The other half of the block" and its equation slide.
Give the room 30 seconds; skip in the lecture if short on time.
-->

---
layout: default
core: true
title: Two wrappers that make it stackable
---

# Two wrappers that make it stackable

Each sub-layer is wrapped the same way, so blocks can be stacked.

<div class="grid grid-cols-[0.9fr_1.1fr] gap-8 mt-2 items-start">
<div>

<svg viewBox="0 0 240 300" class="dl-diagram" role="img" aria-label="Input x goes up two paths: through the sub-layer, and a copy unchanged. The two are added at a plus sign, then LayerNorm, giving an output of the same shape" style="max-height: 17rem">
  <defs>
    <marker id="l6s2-wrap-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="95" y="264" width="50" height="28" rx="4" />
  <text class="dl-dg-lab" x="120" y="284" text-anchor="middle">x</text>
  <path class="dl-dg-grad is-good" marker-end="url(#l6s2-wrap-arrow)" d="M120 262 V150" style="stroke-width: 2.4" />
  <text class="dl-dg-small is-good" x="112" y="214" text-anchor="end">x copied,</text>
  <text class="dl-dg-small is-good" x="112" y="228" text-anchor="end">unchanged</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-wrap-arrow)" d="M120 244 H190 V214" />
  <rect class="dl-dg-box is-accent" x="146" y="172" width="88" height="40" rx="4" />
  <text class="dl-dg-small" x="190" y="196" text-anchor="middle">sub-layer</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-wrap-arrow)" d="M190 170 V136 H136" />
  <circle class="dl-dg-op" cx="120" cy="136" r="13" />
  <text class="dl-dg-lab is-sm" x="120" y="141" text-anchor="middle">+</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-wrap-arrow)" d="M120 122 V104" />
  <rect class="dl-dg-box" x="60" y="72" width="120" height="30" rx="4" />
  <text class="dl-dg-small" x="120" y="91" text-anchor="middle">LayerNorm</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s2-wrap-arrow)" d="M120 70 V40" />
  <text class="dl-dg-small" x="120" y="30" text-anchor="middle">same shape out</text>
</svg>

</div>
<div class="dl-tight">

### Residual

<v-clicks>

- $\mathbf{x} + \operatorname{SubLayer}(\mathbf{x})$: **add**, never replace
- A gradient path with no matrix on it, as in a ResNet

</v-clicks>

### LayerNorm

<v-clicks>

- Re-centre and re-scale **each position's own vector**
- Not BatchNorm: nothing is shared across the batch or across time

</v-clicks>

<div v-click class="mt-3 dl-callout">

Same shape in, **same shape out**. That is why blocks stack.

</div>

</div>
</div>

<!--
The point: two wrappers around every sub-layer — a residual add and a
LayerNorm — keep the shape fixed and the gradients healthy, so blocks can be
stacked ninety-six deep.

On screen, read the diagram from the bottom. x goes two ways: through the
sub-layer (attention or the feed-forward network), and straight up as an
unchanged copy. The two meet at the plus sign, then LayerNorm.

Click: the residual, x + SubLayer(x). The sub-layer proposes an edit to a
running stream rather than a new vector. The "residual stream" reading is worth
planting, because the interpretability literature is written in it: a vector per
position running the height of the model, with each sub-layer reading from it
and adding something back.

Click 2: the gradient path. Last week's additive-path argument, third
appearance — LSTM cell state, ResNet skip, transformer residual. Same idea each
time: give the gradient a route with no repeated multiplication on it.

Click 3: LayerNorm works on each position's vector across its features.

Click 4: why not BatchNorm. This is a real exam-type question. BatchNorm's
statistics depend on the other examples in the batch, which is untenable when
sequences have different lengths and at inference with batch 1.

Click 5: the callout — same shape in, same shape out.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Two wrappers that make it stackable"
---

# In words: Two wrappers that make it stackable

<div class="dl-describe">

Read the diagram from the bottom. The input $\mathbf{x}$ goes up two paths.

- One path goes through the sub-layer: attention or the feed-forward network.
- The other path copies $\mathbf{x}$ unchanged. At the + sign the two are added:
  $\mathbf{x} + \operatorname{SubLayer}(\mathbf{x})$.
- The sub-layer only proposes a change. It never replaces $\mathbf{x}$.
- The copy has no matrix on it, so gradients flow back along it easily, as in a ResNet.
- LayerNorm then re-centres and re-scales each position's vector on its own.
  Unlike BatchNorm, it never mixes examples or time steps.

Takeaway: the output has the same shape as the input, so identical blocks can be
stacked.

</div>

<!--
Revision slide for the residual and LayerNorm wrappers. Give the room 30
seconds; skip in the lecture if short on time.
-->

---
layout: interactive
core: true
heading: The block, assembled
title: The block, assembled
aside-width: 17rem
---

<TransformerBlock variant="post" :switchable="false" />

::aside::

Press **Walk the block**. Six parts, all of them already met.

<v-clicks>

- attention — the **only** sideways step
- add — the residual
- norm
- feed-forward — each position alone
- add, norm

</v-clicks>

<div v-click class="mt-2 dl-callout">

Same shape at the top as at the bottom. Stack it.

</div>

<!--
The point: every part of the block has now been met, and this widget puts them
in order. Walk all six and read the readout aloud for each; it carries the
detail so the aside does not have to.

Click: attention. The thing to point at repeatedly: only this box moves
information sideways. Everything else in the block — and, in fact, everything
else in the entire architecture — operates on one position at a time.

Click 2: add, the residual from "Two wrappers that make it stackable".

Click 3: norm, the LayerNorm.

Click 4: the feed-forward network, each position alone.

Click 5: add and norm again, around the feed-forward network.

Click 6: the callout — the shape at the top equals the shape at the bottom.

This is the 2017 wiring, with the norms after the adds. Do not mention pre-LN
yet; section 04 flips the toggle and the contrast is much sharper if they have
not seen it coming.

Class cut: about 4 minutes. In the full slides, for self-study, it is followed by "What a block costs".
-->

---
layout: default
title: "In words: The block, assembled"
---

# In words: The block, assembled

<div class="dl-describe">

The widget draws one transformer block as six steps, read from bottom to top.

1. **Attention**: every position looks at every other position. This is the only
   step that moves information between words.
2. **Add**: the residual adds the input back.
3. **Norm**: LayerNorm re-scales each position's vector.
4. **Feed-forward**: each position goes through the small network alone.
5. **Add** and 6. **norm** again, around the feed-forward network.

The vectors leave the top with the same shape they had at the bottom.

Takeaway: a block is attention plus a small network, each wrapped in add and
norm. Because the shape is kept, the same block can be stacked again and again.

</div>

<!--
Revision slide for the assembled block. Give the room 30 seconds; skip in the
lecture if short on time.
-->

---
layout: default
title: What a block costs
---

# What a block costs

One encoder block at $d = 512$, $d_{\text{ff}} = 2048$, to scale:

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 640 140" class="dl-diagram" role="img" aria-label="Bars to scale: attention 1 048 576 weights, feed-forward 2 097 152, two LayerNorms 2 048; one encoder block about 3.15 million">
  <text class="dl-dg-small" x="190" y="24" text-anchor="end">attention, 4d²</text>
  <rect class="dl-dg-bar" x="200" y="10" width="180" height="20" rx="3" />
  <text class="dl-dg-small" x="388" y="24">1 048 576</text>
  <text class="dl-dg-small" x="190" y="59" text-anchor="end">feed-forward, 2·d·d_ff</text>
  <rect class="dl-dg-bar" x="200" y="45" width="360" height="20" rx="3" />
  <text class="dl-dg-small" x="568" y="59">2 097 152</text>
  <text class="dl-dg-small" x="190" y="94" text-anchor="end">two LayerNorms, 4d</text>
  <rect class="dl-dg-bar" x="200" y="80" width="2" height="20" />
  <text class="dl-dg-small" x="210" y="94">2 048</text>
  <g v-click>
    <line class="dl-dg-split" x1="200" y1="110" x2="630" y2="110" />
    <text class="dl-dg-small is-good" x="200" y="130">one encoder block: 3 147 776 ≈ 3.15 M</text>
  </g>
</svg>
</div>

<div class="dl-tight mt-2">

<v-clicks>

- $T$ **does not appear**: six words or six thousand, the same weights
- Six encoder blocks ≈ 18.9 M; six decoder blocks ≈ 25.2 M

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

Add a 37 000-word shared embedding at 512 wide (18.9 M). Then the 2017 base
model's **65 M** is accounted for.

</div>

<!--
The point: a student who can rebuild a published parameter count from the
architecture understands the architecture.

On screen: the three parts of one encoder block as bars drawn to scale. The
feed-forward bar is exactly twice the attention bar; the LayerNorm bar is a
sliver.

Click: the total, 1 048 576 + 2 097 152 + 2 048 = 3 147 776, about 3.15 M.

Click 2: the sequence length T is not in any of these formulas. This is the
third appearance of the same observation — a convolution's count does not
contain H and W, a recurrent layer's does not contain T, and neither does this.
Weight sharing always buys it.

Click 3: six encoder blocks are 18.9 M. A decoder block has a second attention
sub-layer and a third LayerNorm, so six of them are 25.2 M.

Click 4: do the last line as arithmetic on the board: 18.9 + 25.2 + 18.9 = 63,
and the paper says 65 million. The gap is biases and the final norms.

The embedding being 29% of the model here, against 93% in last week's classifier,
is worth a remark: as models grow, the embedding stops being the story.
-->

---
layout: default
title: "In words: What a block costs"
---

# In words: What a block costs

<div class="dl-describe">

The bars compare the weights in one encoder block, drawn to scale at $d = 512$
and $d_{\text{ff}} = 2048$.

- Attention has four $d \times d$ matrices: $1\,048\,576$ weights.
- The feed-forward network has two $d \times d_{\text{ff}}$ matrices:
  $2\,097\,152$ weights. Its bar is twice as long.
- The two LayerNorms have only $2\,048$ weights.
- One block holds about 3.15 M weights. The sentence length $T$ appears nowhere.
- Six encoder blocks (18.9 M), six decoder blocks (25.2 M) and the shared
  embedding (18.9 M) give 63 M. Biases and final norms make up the rest of the
  paper's 65 M.

Takeaway: two thirds of each block's weights sit in the feed-forward network.

</div>

<!--
Revision slide for the parameter count. Give the room 30 seconds; skip in the
lecture if short on time.
-->

---
layout: default
core: true
title: The bill for looking everywhere
---

# The bill for looking everywhere

The score matrix is $T \times T$: every position scores every position.

<div class="grid grid-cols-2 gap-8 mt-2 items-start">
<div>

<svg viewBox="0 0 330 200" class="dl-diagram" role="img" aria-label="Score grids: 4 words give a 4 by 4 grid of 16 scores; 8 words give an 8 by 8 grid of 64 scores, four times as many" style="max-height: 15rem">
  <text class="dl-dg-small" x="10" y="16">query × key</text>
  <rect v-for="i in 16" :key="'a' + i" class="dl-dg-box is-accent" :x="10 + ((i - 1) % 4) * 18" :y="30 + Math.floor((i - 1) / 4) * 18" width="16" height="16" rx="2" />
  <text class="dl-dg-small" x="10" y="122">T = 4: 16 scores</text>
  <g v-click>
    <rect v-for="i in 64" :key="'b' + i" class="dl-dg-box" :x="160 + ((i - 1) % 8) * 18" :y="30 + Math.floor((i - 1) / 8) * 18" width="16" height="16" rx="2" />
    <text class="dl-dg-small" x="160" y="190">T = 8: 64 scores, 4 ×</text>
  </g>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

- 512 tokens → 262 144 scores **per head, per layer**

</v-clicks>

<div v-click class="mt-3 dl-callout">

An RNN took $T$ steps, one after another. Attention takes $T^2$, all at once:
more work, far less waiting.

</div>

<div v-click class="mt-3 dl-secondary">

Caveat: the feed-forward network grows like $T d^2$, attention like $T^2 d$. At
$T = d = 512$, attention is not yet the expensive part.

</div>

</div>
</div>

<!--
The point: attention's cost grows with the square of the length, and that is
the price of looking everywhere at once.

On screen: the left grid is the score matrix for four words, one cell per
query–key pair, 16 cells.

Click: the right grid, eight words and 64 cells. Double the length and the
attention work goes up four times.

Click 2: at 512 tokens that is 512^2 = 262 144 scores, per head, per layer.

Click 3: the trade we made. An RNN's T sequential steps became T^2 parallel
ones. GPUs are built for exactly that shape.

Click 4: the caveat, which is usually left out and leaves students believing
attention is the bottleneck at every scale. It is not — at short context the
FFN dominates, and the crossover is around T = 4d.

Both halves matter. The quadratic cost is real and it is why context length was
the central engineering fight of 2020-2024.

Memory is worse than compute here: the T x T matrix has to exist per head per
layer. That is what FlashAttention attacks — not by changing the mathematics but
by never materialising the matrix. See "What else changed inside the block".

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: The bill for looking everywhere"
---

# In words: The bill for looking everywhere

<div class="dl-describe">

The grids are attention score matrices. Each row is a query position, each
column a key position, and each cell one score.

- With $T = 4$ words there are 16 scores. With $T = 8$ there are 64.
- Doubling the length gives four times the work.
- At 512 tokens that is $512^2 = 262\,144$ scores, for each head in each layer.
- An RNN needed $T$ steps, one after the other. Attention needs $T^2$ steps, but
  a GPU can run them all at once.
- The feed-forward network grows like $T d^2$. So attention is only the larger
  cost once $T$ is several times $d$.

Takeaway: attention trades more total work for no waiting.

</div>

<!--
Revision slide for the quadratic cost. Give the room 30 seconds; skip in the
lecture if short on time.
-->

---
layout: section
index: "03"
---

# The original transformer

One stack reads, one stack writes.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="encdec" :size="190" /></div>

<!--
Section 03 puts the block from section 02 into the model the 2017 paper actually
built: an encoder stack that reads the source sentence and a decoder stack that
writes the translation. The glyph is that shape: two stacks, the right one
reading the left through a single wire.

About fifteen minutes. This section is compressible if you are running late:
keep the walk through the architecture and the poll on teacher forcing, and say
the parameter table in one sentence.
-->

---
layout: default
core: true
title: Two stacks
---

# Two stacks

The 2017 paper is a **translation** model. One stack reads the source; the
other writes the target.

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 620 240" class="dl-diagram is-sm-h" role="img" aria-label="An encoder stack reads the source tokens and outputs one vector per token; a decoder stack with three sub-layers reads the encoder output through cross-attention">
  <defs>
    <marker id="l6s3-a1" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g>
    <text class="dl-dg-small" x="140" y="14" text-anchor="middle">one vector per source token</text>
    <rect v-for="k in 3" :key="`eo${k}`" class="dl-dg-box is-accent" :x="88 + (k - 1) * 38" y="22" width="26" height="22" rx="3" />
    <rect class="dl-dg-fill is-muted is-dashed" x="40" y="70" width="200" height="110" rx="6" />
    <text class="dl-dg-small" x="52" y="86">encoder, 6 blocks</text>
    <rect class="dl-dg-box" x="60" y="94" width="160" height="30" rx="4" />
    <text class="dl-dg-in" x="140" y="114" text-anchor="middle">feed-forward</text>
    <rect class="dl-dg-box" x="60" y="134" width="160" height="30" rx="4" />
    <text class="dl-dg-in" x="140" y="154" text-anchor="middle">self-attention, no mask</text>
    <rect v-for="k in 3" :key="`ei${k}`" class="dl-dg-box" :x="88 + (k - 1) * 38" y="206" width="26" height="22" rx="3" />
    <text class="dl-dg-small" x="80" y="221" text-anchor="end">source</text>
    <path class="dl-dg-arrow" marker-end="url(#l6s3-a1)" d="M140 204 V184" />
    <path class="dl-dg-arrow" marker-end="url(#l6s3-a1)" d="M140 68 V48" />
  </g>
  <g v-click>
    <rect class="dl-dg-fill is-dashed" x="380" y="50" width="210" height="130" rx="6" />
    <text class="dl-dg-small" x="392" y="66">decoder, 6 blocks</text>
    <rect class="dl-dg-box" x="398" y="72" width="174" height="28" rx="4" />
    <text class="dl-dg-in" x="485" y="91" text-anchor="middle">feed-forward</text>
    <rect class="dl-dg-box is-accent" x="398" y="106" width="174" height="28" rx="4" />
    <text class="dl-dg-in" x="485" y="125" text-anchor="middle">cross-attention</text>
    <rect class="dl-dg-box" x="398" y="140" width="174" height="28" rx="4" />
    <text class="dl-dg-in" x="485" y="159" text-anchor="middle">masked self-attention</text>
    <rect v-for="k in 3" :key="`di${k}`" class="dl-dg-box" :x="428 + (k - 1) * 38" y="206" width="26" height="22" rx="3" />
    <text class="dl-dg-small" x="420" y="221" text-anchor="end">target so far</text>
    <path class="dl-dg-arrow" marker-end="url(#l6s3-a1)" d="M485 204 V184" />
    <path class="dl-dg-arrow" marker-end="url(#l6s3-a1)" d="M485 48 V26" />
    <text class="dl-dg-small" x="497" y="22">next word</text>
  </g>
  <g v-click>
    <path class="dl-dg-line" marker-end="url(#l6s3-a1)" d="M192 33 H310 V120 H394" />
    <text class="dl-dg-small is-good" x="318" y="84">K and V</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

One vector per source token: last week's bottleneck is gone. Nothing has to be
summarised in advance.

</div>

<!--
The point: the 2017 model is two stacks of the blocks from section 02. The
encoder reads the source once. The decoder writes the target, and it reads the
encoder only through cross-attention.

On screen: the left stack is the encoder. Its six blocks each have two
sub-layers, self-attention without a mask and a feed-forward network. Its output,
at the top, is one vector per source token, not one vector for the sentence.

Click: the decoder appears. It also has six blocks, but each has three
sub-layers: masked self-attention over what it has written so far,
cross-attention, and the feed-forward network. Three sub-layers catches people
who have only ever seen the paper's figure; count them here.

Click 2: the wire. The encoder's output vectors become the keys and values of
every decoder block's cross-attention. It is the only place the two stacks meet.

Click 3: the callout ties the two lectures together and it is worth pausing on.
The recurrent encoder-decoder had to compress the source into one fixed vector,
because the decoder could only be handed one thing. Here the decoder can attend,
so the encoder simply hands over everything.

About three minutes.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Two stacks"
---

# In words: Two stacks

<div class="dl-describe">

The original transformer translates a sentence with two stacks of blocks.

- **The left stack is the encoder.** It reads the source once. Each of its six
  blocks has self-attention with no mask, then a feed-forward network.
- **Its output is one vector per source token**, the row at the top. Nothing is
  squeezed into a single vector.
- **The right stack is the decoder.** It writes the target, one word at a time.
  Its six blocks have three sub-layers: masked self-attention, cross-attention,
  feed-forward.
- **The wire labelled "K and V" is cross-attention**, the only link between the
  stacks.

Remember: two stacks, one wire, and no bottleneck.

</div>

<!--
A description slide for revision. Give the room thirty seconds to read it, or
skip it in the lecture if short on time.
-->

---
layout: interactive
core: true
heading: The architecture, step by step
title: The architecture, step by step
aside-width: 17rem
---

<TransformerStack :layers="6" />

::aside::

Press **Walk the architecture** and follow the data: nine steps, no new boxes.

<v-clicks>

- up the encoder **once**
- then up the decoder **once per word it writes**
- cross-attention is the only wire between them

</v-clicks>

<div v-click class="mt-2 dl-callout">

The famous figure, in the order the data actually moves.

</div>

<!--
The point: the paper's figure is hard to read because it shows everything at
once and gives no clue which arrow comes first. The widget walks it in the order
the data moves. This is the slide the 2025 deck had as a single screenshot.

The widget: press Walk the architecture and step through nine stages. Embed the
source; add position; encoder self-attention; the encoder block repeated N times;
the decoder starts from the target shifted right by one; masked self-attention;
cross-attention; the decoder block repeated N times; predict the next token with
a linear layer and a softmax over the vocabulary.

Click: the encoder runs once, for the whole source sentence.

Click 2: the decoder runs once per word it writes. Step 9 is the one to dwell on.
The parallelism people credit transformers with is real in the encoder, and real
when training the decoder. It is gone at generation time, where you are back to
one token at a time.

Click 3: cross-attention is the only wire between the stacks. Point at it in the
widget.

Click 4: the callout. That asymmetry between training and generation is the whole
reason the KV cache exists: see "What generation actually costs" in section 04.

About four minutes.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: The architecture, step by step"
---

# In words: The architecture, step by step

<div class="dl-describe">

The widget walks the original transformer in nine steps, in the order the data moves.

1. The source tokens are embedded, and a position vector is added to each.
2. They go up the encoder **once**: self-attention, then feed-forward, six times.
3. The decoder starts from the words written so far.
4. It applies masked self-attention, then cross-attention into the encoder output,
   then feed-forward, six times.
5. A linear layer and a softmax give a probability for every word in the vocabulary.

Then one word is chosen, appended, and the decoder runs again. The encoder runs
once; the decoder runs **once per word it writes**.

</div>

<!--
A description slide for revision. Thirty seconds; skip in the lecture if short
on time.
-->

---
layout: interactive
core: true
heading: The mask, and why the loss collapses without it
title: The mask, and why the loss collapses without it
aside-width: 18rem
---

<AttentionMatrix :causal="true" />

::aside::

Position $t$ may read positions $1 \ldots t$ only.

<v-clicks>

- Row *the* becomes **1.00**: it can only see itself
- Rows still sum to 1: the softmax comes **after** the $-\infty$
- The button takes the mask off and puts it back

</v-clicks>

<div v-click class="mt-2 dl-callout">

Without the mask, the model reads the answer off its own input.

</div>

<!--
The point: the decoder's self-attention is masked, so position t cannot see any
position after t. The widget shows the real three-by-three weights for "the river
bank" with the mask on.

On screen: rows are queries, columns are keys. The crossed-out cells above the
diagonal are the blocked ones.

Click: row "the" is a single 1.00. The first token has nothing to look at but
itself.

Click 2: every row still sums to 1. The blocked scores are set to minus infinity
before the softmax, so they get weight zero and the rest share the whole 1.

Click 3: press the button to take the mask off, then put it back. The upper
triangle fills in with real weights.

Click 4: why it matters. Without the mask, the word to predict is in the input,
and the model copies it. The loss falls to nearly zero and nothing is learned.

What it buys, which is not obvious: because position t is independent of
everything after t, a whole target sentence trains in one forward pass. Every
position is a training example, and none can cheat. That is teacher forcing
from week 5, made parallel. The RNN version had to run T steps to get T training
signals.

The detail students get wrong: masking does not skip the computation. Every
score is computed, then the forbidden ones are set to -inf before the softmax.
It saves no work; it only removes the answer.

Class cut: about 4 minutes. In the full slides, for self-study, it is followed by "Cross-attention is last week's slide", "The model they actually trained" and "Poll: how many decoder passes teacher forcing needs".
-->

---
layout: default
title: "In words: The mask, and why the loss collapses without it"
---

# In words: The mask, and why the loss collapses without it

<div class="dl-describe">

The grid shows the decoder's attention weights for "the river bank" with the
causal mask on.

- **Rows are the words asking, columns the words read.** A crossed cell is blocked.
- **Position $t$ reads only positions $1$ to $t$.** So row *the* puts all its
  weight, **1.00**, on itself.
- **Blocked scores become $-\infty$ before the softmax.** They get weight zero,
  and each row still sums to 1.
- **Without the mask, each word could see the word it must predict.** The model
  would copy it, and the loss would collapse.

The mask removes the answer from the input, so every position trains at once.

</div>

<!--
A description slide for revision. Thirty seconds to read; skip in the lecture if
short on time.
-->

---
layout: default
title: Cross-attention is last week's slide
---

# Cross-attention is last week's slide

Self-attention takes $Q$, $K$ and $V$ from **one** stack. Cross-attention uses **two**.

$$ \operatorname{Attention}(\underbrace{Q}_{\text{decoder}},\; \underbrace{K,\; V}_{\text{encoder}}) $$

<div class="grid grid-cols-2 gap-8 mt-1 dl-tight">
<div>

<svg viewBox="0 0 300 160" class="dl-diagram" style="max-height: 9.5rem" role="img" aria-label="One decoder query sends lines of different strength to three encoder outputs, which serve as keys and values">
  <rect v-for="k in 3" :key="`s${k}`" class="dl-dg-box" x="196" :y="8 + (k - 1) * 48" width="96" height="36" rx="4" />
  <text v-for="k in 3" :key="`st${k}`" class="dl-dg-in" x="244" :y="31 + (k - 1) * 48" text-anchor="middle">K, V {{ k }}</text>
  <text class="dl-dg-small" x="244" y="156" text-anchor="middle">encoder output</text>
  <g v-click>
    <path class="dl-dg-line is-muted" d="M74 75 L194 26" :style="{ strokeWidth: 1.4 }" />
    <path class="dl-dg-line" d="M74 75 L194 74" :style="{ strokeWidth: 5 }" />
    <path class="dl-dg-line is-muted" d="M74 75 L194 122" :style="{ strokeWidth: 2.4 }" />
  </g>
  <rect class="dl-dg-box is-accent" x="6" y="57" width="68" height="36" rx="4" />
  <text class="dl-dg-in" x="40" y="80" text-anchor="middle">Q</text>
</svg>

</div>
<div>

<v-clicks>

- Decoder query: *what does the next word need?*
- Encoder: one key and value per source token
- Score, softmax, weighted sum: Bahdanau's 2014 attention

</v-clicks>

<div v-click class="mt-2 dl-callout">

What is new: a **scaled dot product** score, and no recurrence on either side.

</div>

</div>
</div>

<!--
The point: cross-attention is the same attention as before. Only the source of
its inputs changes: the queries come from the decoder, the keys and values from
the encoder's output.

On screen: the accent box on the left is one decoder position's query Q (the
equation's underbrace says it comes from the decoder). The
three boxes on the right are encoder outputs, each giving a key and a value. The
line widths are the attention weights; they are drawn for illustration, not
computed.

Click: the lines appear. The query scores every key, the softmax turns scores
into weights, and the output is the weighted sum of the values.

Click 2 to Click 4: the three bullets. The decoder asks what it needs for the
word it is about to write; the encoder answers with one key and value per source
token; and the recipe is exactly Bahdanau's 2014 alignment. Put last week's
German-English widget back on screen mentally: "read" attending to "gelesen" five
words away. That picture is a cross-attention map.

Click 5: what changed since last week is only the score, now a scaled dot
product, and the missing recurrence on both sides.

After click 5, say it out loud (it is on the next slide in words): the encoder's
K and V are computed once and reused for every output token. A good check of
understanding: ask why the encoder's K and V can be reused, but the decoder's
queries cannot.

If someone asks whether cross-attention is masked: no. The whole source is
available from the start; there is nothing to hide.
-->

---
layout: default
title: "In words: Cross-attention is last week's slide"
---

# In words: Cross-attention is last week's slide

<div class="dl-describe">

Cross-attention is ordinary attention with inputs from two places.

- **The query $Q$ comes from the decoder**, the accent box on the left. It asks
  what the next word needs.
- **The keys $K$ and values $V$ come from the encoder**, one pair per source token.
- **The lines are the attention weights.** Score each key, take a softmax, then a
  weighted sum of the values. This is Bahdanau's 2014 attention.
- **Two things are new:** the score is a scaled dot product, and neither side is
  recurrent.

The encoder's $K$ and $V$ are computed once and reused for every output word.

</div>

<!--
A description slide for revision. Thirty seconds; skip in the lecture if short
on time.
-->

---
layout: default
title: The model they actually trained
---

# The model they actually trained

<div class="grid grid-cols-[1.25fr_1fr] gap-8 items-start">
<div class="dl-ledger mt-1">

| | base | big |
| --- | --- | --- |
| blocks per stack $N$ | 6 | 6 |
| model width $d_{\text{model}}$ | 512 | 1024 |
| heads $h$ | 8 | 16 |
| head width $d_k = d_v$ | 64 | 64 |
| feed-forward width $d_{\text{ff}}$ | 2048 | 4096 |

</div>
<div>

<svg viewBox="0 0 260 190" class="dl-diagram" role="img" aria-label="Bars drawn to scale: 65 million versus 213 million parameters, 12 versus 84 hours of training on 8 GPUs">
  <text class="dl-dg-small" x="0" y="12">parameters, millions</text>
  <rect class="dl-dg-bar" x="40" y="22" width="52" height="22" />
  <rect class="dl-dg-bar is-q" x="40" y="50" width="170" height="22" />
  <text class="dl-dg-small" x="0" y="37">base</text>
  <text class="dl-dg-small" x="0" y="65">big</text>
  <text class="dl-dg-small" x="98" y="37">65</text>
  <text class="dl-dg-small" x="216" y="65">213</text>
  <text class="dl-dg-small" x="0" y="112">training hours, 8 GPUs</text>
  <rect class="dl-dg-bar" x="40" y="122" width="24" height="22" />
  <rect class="dl-dg-bar is-q" x="40" y="150" width="170" height="22" />
  <text class="dl-dg-small" x="0" y="137">base</text>
  <text class="dl-dg-small" x="0" y="165">big</text>
  <text class="dl-dg-small" x="70" y="137">12</text>
  <text class="dl-dg-small" x="216" y="165">84</text>
</svg>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Twelve hours on eight GPUs beat every recurrent translation system of its day.

</div>

<div v-click class="mt-2 dl-secondary">

$d_k = 64$ in both: head width fixed, head **count** growing. Still true today.

</div>

<!--
The point: the real sizes of the two models in the 2017 paper, and how cheap the
base model was to train.

On screen: the table gives the sizes, using the symbols from section 02. The bars
on the right are drawn to scale. Parameters: 65 million for base, 213 million for
big. Training time on eight GPUs: 12 hours for base, 3.5 days, which is 84 hours,
for big.

Click: the 12-hour figure is the one to leave them with. Recurrent systems of
comparable quality took days to weeks to train, because they could not use the
hardware in parallel. The architecture's advantage was never only accuracy.

Click 2: point at d_k = 64 in both columns. The big model doubles the width by
doubling the number of heads, not their width. It is still 64 or 128 in models a
thousand times larger, which is worth noticing: almost nothing else about the
architecture survived unchanged.

About two minutes.
-->

---
layout: default
title: "In words: The model they actually trained"
---

# In words: The model they actually trained

<div class="dl-describe">

The 2017 paper trained two sizes of the same architecture, "base" and "big".

- **Both have $N = 6$ blocks per stack and head width $d_k = 64$.**
- **Big doubles the rest:** width $d_{\text{model}}$ 512 → 1024, heads 8 → 16,
  feed-forward width 2048 → 4096.
- **The bars are drawn to scale.** Base has 65 million parameters, big has 213 million.
- **Base trained in 12 hours on 8 GPUs; big in 84 hours (3.5 days).**

Two things to remember. The model was cheap to train, because it uses the
hardware in parallel. And it grows by adding heads, not by widening them.

</div>

<!--
A description slide for revision. Thirty seconds; skip in the lecture if short
on time.
-->

---
layout: default
title: "Poll: how many decoder passes teacher forcing needs"
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="Training on a 100-token target sentence, how many forward passes through the decoder does teacher forcing need?"
  :items="[
    '100 — one per output token',
    '1 — the mask makes all 100 positions independent',
    '2 — one forward, one backward',
    '100 at training time and 1 at generation time',
  ]"
/>

</div>
<div class="mt-8">

<svg viewBox="0 0 240 150" class="dl-diagram" role="img" aria-label="A 100-token target sentence enters the decoder; how many passes are needed?">
  <rect class="dl-dg-net" x="40" y="14" width="160" height="44" rx="6" />
  <text class="dl-dg-in" x="120" y="41" text-anchor="middle">decoder</text>
  <rect v-for="k in 4" :key="k" class="dl-dg-box" :x="18 + (k - 1) * 36" y="96" width="28" height="22" rx="3" />
  <text class="dl-dg-small" x="166" y="111">…</text>
  <rect class="dl-dg-box" x="186" y="96" width="36" height="22" rx="3" />
  <text class="dl-dg-small" x="204" y="111" text-anchor="middle">100</text>
  <path class="dl-dg-arrow" d="M120 92 V62" />
  <text class="dl-dg-small" x="120" y="138" text-anchor="middle">target sentence</text>
  <text class="dl-dg-lab is-sm" x="132" y="82">passes = ?</text>
</svg>

</div>
</div>

<div v-click class="mt-2 dl-reveal">

One

</div>

<div v-click class="mt-2 dl-secondary">

The mask lets all 100 positions train in one pass. Generation still needs 100.

</div>

<!--
The point: the mask is not only a correctness device. It is what makes training
parallel over the sequence, which is the whole economic argument for the
architecture.

On screen: a 100-token target sentence going into the decoder, and the question
of how many passes that takes.

Click: the answer, one.

Click 2: why. Position t cannot see past t, so all 100 positions are computed in
the same pass, and each is still a fair next-token prediction. Generation is the
opposite: token 37 does not exist until it has been sampled.

Option 4 is the most instructive wrong answer: it is exactly backwards. A student
who picks it has the right two facts attached to the wrong ends. Option 3 mixes
up the backward pass with the forward passes the question asks about.

Two minutes; this is the single most useful thing in section 03.
-->

---
layout: default
title: "In words: How many decoder passes teacher forcing needs"
---

# In words: How many decoder passes teacher forcing needs

<div class="dl-describe">

The poll asked how many decoder passes it takes to train on a 100-token target.
The answer is **one**.

- **In training, the whole target sentence is the decoder's input.** This is
  teacher forcing.
- **The mask stops position $t$ from seeing anything after $t$.** So each position
  is still a fair next-token prediction.
- **All 100 positions are therefore computed together, in one pass.**
- **Generation is the opposite: 100 passes, one per token.** A token does not
  exist until it has been sampled.

Training is parallel over the sequence; generation is not.

</div>

<!--
A description slide for revision. Thirty seconds; skip in the lecture if short
on time.
-->
---
layout: section
index: "04"
---

# Modern transformers

What changed since 2017, and what did not.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="decoder" :size="190" /></div>

<!--
Section 04 has one message: the families, the wiring and the engineering all
moved, but the attention mechanism from section 01 did not. The glyph is a
single tall stack under a triangular mask — the decoder-only model that took
over.

About fifteen minutes. This section is compressible: if time is short, do "The
architecture forked three ways", "What generation actually costs" and "What did
not change", and leave the rest for reading.
-->

---
layout: interactive
core: true
heading: The architecture forked three ways
title: The architecture forked three ways
aside-width: 17rem
---

<ModelFamilies />

::aside::

One paper, three descendants. The difference is **the mask**, not the layer.

<v-clicks>

- **encoder-only** — sees both ways, cannot generate
- **decoder-only** — left context only, generates
- **encoder–decoder** — the 2017 original, both

</v-clicks>

<div v-click class="mt-2 dl-callout">

Same blocks, same attention. Click through all three.

</div>

<!--
The mask-is-the-difference framing is the one to hammer. Students arrive thinking
BERT and GPT are different architectures. They are the same architecture with
different training objectives, and the objective is what forces the mask.

Click: encoder-only. Every position sees every other, so it understands a whole
text well but has no notion of "next" and cannot generate.

Click 2: decoder-only. The mask forbids looking forward, so each position sees
only its left context — exactly what generation needs.

Click 3: encoder–decoder, the 2017 original. Both stacks, joined by
cross-attention.

Click 4: open each panel in the widget and point at its mask grid first.

Ask which family a sentence-embedding model for search should be, and why. The
answer is encoder-only, and the reason — you have the whole text and want one
vector for it — is exactly the mask.

Whisper being encoder-decoder is a nice detail: audio in, text out, two genuinely
different modalities, so having two separate stacks is worth it.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: The architecture forked three ways"
---

# In words: The architecture forked three ways

<div class="dl-describe">

- The 2017 transformer has three descendants, and they all use the same block.
- Each panel of the widget starts with a mask grid. A filled cell means "this position may look at that one".
- **Encoder-only** fills the whole grid. Every word sees every other word, so it reads a text well but cannot write one.
- **Decoder-only** fills only the lower triangle. Each word sees itself and the words before it, so it can generate the next word.
- **Encoder–decoder** keeps both stacks, as in the original paper.
- Remember: the families differ in the mask they train with, not in the layer.

</div>

<!--
Revision slide. Give the room 30 seconds to read it, then move on. Skip it in
the lecture if short on time — it is here for students working through the deck
alone.
-->

---
layout: default
core: true
title: Why decoder-only took over
---

# Why decoder-only took over

Not the most expressive design. The one with the most **training data**.

<div class="grid grid-cols-2 gap-8 mt-2 dl-tight">
<div>

<svg viewBox="0 0 400 190" class="dl-diagram" role="img" aria-label="Five words of text give four next-word training examples: each word predicts the word after it">
  <defs>
    <marker id="l6s4-next" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="6" y="24">predicts the next word</text>
  <g v-for="(w, i) in ['river', 'bank', 'was', 'flooded']" :key="'p' + i">
    <rect class="dl-dg-fill" :x="6 + i * 78" y="36" width="70" height="30" rx="4" />
    <text class="dl-dg-in" :x="41 + i * 78" y="56" text-anchor="middle">{{ w }}</text>
    <path class="dl-dg-arrow" marker-end="url(#l6s4-next)" :d="`M${41 + i * 78} 128 V72`" />
  </g>
  <g v-for="(w, i) in ['the', 'river', 'bank', 'was', 'flooded']" :key="'t' + i">
    <rect class="dl-dg-box" :x="6 + i * 78" y="130" width="70" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" :x="41 + i * 78" y="150" text-anchor="middle">{{ w }}</text>
  </g>
  <text class="dl-dg-small is-good" x="6" y="182">5 words of text → 4 training examples, no labels</text>
</svg>

</div>
<div>

<v-clicks>

- Next-token prediction needs **no labels**: any text is training data
- **Every position** is an example, so one document gives thousands
- Any task written as text becomes next-token prediction
- One stack instead of two: simpler to scale and to serve

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

The design that won was the one whose training data was free.

</div>

<!--
The point: decoder-only did not win because it is the most expressive of the
three. It won because of what it can train on. Resist teaching next week's
lecture here; the one sentence they need is the callout.

The picture: five words of ordinary text along the bottom. Above each word is
the word that follows it — that is the target. Five words give four training
examples, and nobody had to write a label.

Click: no labels, so the training set is every text ever written.

Click 2: every position is a training example. This is under-appreciated:
masked language modelling trains on the 15% of tokens it masked, next-token
prediction on essentially 100% of them. That is a several-fold difference in
signal per unit of compute, before anything about scale.

Click 3: translation, summarising, answering and writing code can all be phrased
as "continue this text".

Click 4: one stack instead of two is simpler to scale and to serve.

Click 5: the callout. Then say that how it is trained, and at what scale, is next week.

If someone asks whether encoder-only models are obsolete: no. Retrieval and
reranking in production are still full of them, and ModernBERT in 2024 exists
precisely because that niche did not go away.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Why decoder-only took over"
---

# In words: Why decoder-only took over

<div class="dl-describe">

- The picture shows ordinary text along the bottom: "the river bank was flooded".
- Each arrow points from a word to the word after it. That next word is the target the model must predict.
- So five words of text give four training examples. Nobody had to label anything.
- Any text can be used this way, and every position in it is an example.
- Many tasks can be written as "continue this text", so one objective covers them all.
- Remember: decoder-only won because its training data costs nothing, not because the layer is better.

</div>

<!--
Revision slide. Give the room 30 seconds to read it. Skip in the lecture if
short on time.
-->

---
layout: interactive
core: true
heading: One wire moved, and deep stacks started training
title: One wire moved, and deep stacks started training
aside-width: 19rem
---

<TransformerBlock variant="pre" start="whole" />

::aside::

Press **Rewire**. One difference: where the normalisation sits.

<v-clicks>

- **post-LN** (LayerNorm after, 2017) — norm *after* the add, **on** the residual path
- **pre-LN** (modern) — norm *before* the sub-layer, on a copy
- So bottom to top is now additions only

</v-clicks>

<div v-click class="mt-2 dl-callout">

Post-LN needs a warmup to train deep. Pre-LN does not.

</div>

<!--
Flip it back and forth a few times while talking. The whole content of the slide
is one box moving past one circle, and it is genuinely the most consequential
change in the block since 2017.

Click: post-LN, the 2017 wiring. The LayerNorm sits after the add, so it is on
the residual path itself.

Click 2: pre-LN, the modern wiring. The norm moves before the sub-layer and acts
on a copy; the residual path is left alone.

Click 3: so from the bottom of the stack to the top, the residual path is
additions only.

Click 4: the callout. The mechanism: a residual is supposed to provide an
identity path so the gradient can travel without being multiplied. Put a
LayerNorm on that path and it is not an identity any more, and gradient
magnitudes at the bottom of a deep post-LN stack go badly wrong at
initialisation. Warmup (starting with a tiny learning rate) is the workaround;
moving the norm is the fix.

Anyone who has tried to train a deep transformer from scratch and watched it
diverge in the first hundred steps has met this.

Class cut: about 4 minutes. In the full slides, for self-study, it is followed by "What else changed inside the block", "Position, done properly" and "What generation actually costs".
-->

---
layout: default
title: "In words: One wire moved, and deep stacks started training"
---

# In words: One wire moved, and deep stacks started training

<div class="dl-describe">

- The widget draws one transformer block. The **Rewire** button switches between the 2017 wiring and the modern one.
- In the 2017 wiring (post-LN), the LayerNorm comes after each add. It sits on the residual path itself.
- In the modern wiring (pre-LN), the LayerNorm comes before each sub-layer. It works on a copy, and the residual path is untouched.
- So in a pre-LN stack, the path from bottom to top is only additions. The gradient can travel down it without being rescaled.
- Remember: a deep post-LN stack needs a learning-rate warmup to train. A pre-LN stack does not.

</div>

<!--
Revision slide. Give the room 30 seconds, or skip it in the lecture if short on
time.
-->

---
layout: default
title: What else changed inside the block
---

# What else changed inside the block

<div class="grid grid-cols-[15rem_1fr] gap-6 mt-1">
<div>

<svg viewBox="0 0 260 330" class="dl-diagram" role="img" aria-label="A modern pre-norm block; numbered badges mark the six parts that changed since 2017, and the attention formula at its core is unchanged">
  <defs>
    <marker id="l6s4-blk" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <path class="dl-dg-arrow" marker-end="url(#l6s4-blk)" d="M110 322 V292 M110 262 V244 M110 150 V142 M110 121 V120 M110 92 V82 M110 46 V40 M110 19 V4" />
  <path class="dl-dg-grad is-good" marker-end="url(#l6s4-blk)" d="M110 306 H232 V130 H122" />
  <path class="dl-dg-grad is-good" marker-end="url(#l6s4-blk)" d="M110 136 H244 V28 H122" />
  <rect class="dl-dg-box" x="60" y="264" width="100" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="110" y="282" text-anchor="middle">RMSNorm</text>
  <rect class="dl-dg-net" x="30" y="150" width="160" height="92" rx="6" />
  <text class="dl-dg-lab is-sm" x="110" y="170" text-anchor="middle">attention</text>
  <rect class="dl-dg-op" x="40" y="180" width="140" height="28" rx="4" />
  <text class="dl-dg-in" x="110" y="199" text-anchor="middle">softmax(QKᵀ/√dₖ)·V</text>
  <text class="dl-dg-small" x="110" y="230" text-anchor="middle">rotate Q and K</text>
  <circle class="dl-dg-op" cx="110" cy="130" r="9" />
  <text class="dl-dg-lab is-sm" x="110" y="135" text-anchor="middle">+</text>
  <rect class="dl-dg-box" x="60" y="94" width="100" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="110" y="112" text-anchor="middle">RMSNorm</text>
  <rect class="dl-dg-net" x="45" y="48" width="130" height="32" rx="6" />
  <text class="dl-dg-lab is-sm" x="110" y="69" text-anchor="middle">SwiGLU network</text>
  <circle class="dl-dg-op" cx="110" cy="28" r="9" />
  <text class="dl-dg-lab is-sm" x="110" y="33" text-anchor="middle">+</text>
  <g v-for="b in [[1, 277], [1, 107], [4, 165], [6, 194], [2, 226], [3, 64]]" :key="b.join('-')">
    <circle class="dl-dg-fill" cx="14" :cy="b[1]" r="10" />
    <text class="dl-dg-in" x="14" :y="b[1] + 4.5" text-anchor="middle">{{ b[0] }}</text>
  </g>
  <circle class="dl-dg-fill" cx="196" cy="64" r="10" />
  <text class="dl-dg-in" x="196" y="68.5" text-anchor="middle">5</text>
</svg>

</div>
<div>

<div class="dl-ledger">

| # | 2017 | a model trained today |
| --- | --- | --- |
| 1 | LayerNorm, after | **RMSNorm**, before |
| 2 | sinusoids added at the bottom | **RoPE**, rotating $Q$ and $K$ |
| 3 | ReLU | **SwiGLU** |
| 4 | 8 heads, each with its own $K,V$ | **grouped-query** |
| 5 | biases everywhere | **no biases** |
| 6 | plain matrix multiplies | **FlashAttention** |

</div>

<div v-click class="mt-3 dl-callout">

Six changes, and **none of them touch** $\operatorname{softmax}(QK^\top/\sqrt{d_k})V$,
the formula from "One output vector, five lines".

</div>

</div>
</div>

<!--
The callout is the point of the slide and of the section. Everything in the
table is an engineering refinement around a core that did not change.

The picture is a modern block, drawn bottom to top in the pre-norm wiring from
the previous slide. The numbered badges mark where each change in the table
lives. The box in the middle of the attention layer is the formula from section
01, and no badge points at it.

Go across the rows at whatever depth the room wants; none of them is essential.
Why each one happened:
1. RMSNorm (root-mean-square normalisation), moved before the sub-layer: trains
   deeper, slightly cheaper.
2. RoPE (rotary position embedding), rotating Q and K: relative position, and it
   extrapolates — next slide.
3. SwiGLU instead of ReLU: consistently better, at the price of three matrices
   instead of two.
4. Grouped-query attention: shrinks the inference cache — "What generation
   actually costs".
5. Biases dropped: no measurable loss.
6. FlashAttention: never builds the T x T matrix.

If time is short, do RoPE and grouped-query and skip the rest — those two are
the ones a student will actually meet in a config file.

FlashAttention is worth one sentence: it is not a different attention, it is the
same attention computed in tiles so the T x T matrix never exists in memory.
Same numbers, several times faster, far less memory.

Click: the callout.
-->

---
layout: default
title: "In words: What else changed inside the block"
---

# In words: What else changed inside the block

<div class="dl-describe">

The drawing is a modern block, bottom to top. Each numbered badge marks one change from the table:

1. RMSNorm (root-mean-square normalisation), placed before each sub-layer, trains deeper and is slightly cheaper.
2. RoPE (rotary position embedding) rotates $Q$ and $K$. It gives relative position and handles longer texts.
3. SwiGLU replaces ReLU. It works consistently better and uses three matrices.
4. Grouped-query attention shrinks the cache kept during generation.
5. Dropping the biases costs no measurable quality.
6. FlashAttention never builds the full $T \times T$ matrix.

The box at the centre has no badge: the attention formula itself never changed.

</div>

<!--
Revision slide. Give the room 30 seconds to read it, or skip it in the lecture.
-->

---
layout: default
title: Position, done properly
---

# Position, done properly

<div class="grid grid-cols-2 gap-8 mt-2 dl-tight">
<div>

<svg viewBox="0 0 330 200" class="dl-diagram" style="max-height: 11rem" role="img" aria-label="RoPE: a key and a query rotated by 15 degrees per position; at positions 2 and 5, and again at 6 and 9, the angle between them is the same 45 degrees">
  <defs>
    <marker id="l6s4-rot" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <g>
    <path class="dl-dg-grad" d="M80 130 H160" />
    <path class="dl-dg-line is-muted" marker-end="url(#l6s4-rot)" d="M80 130 L140.6 95" />
    <path class="dl-dg-line" marker-end="url(#l6s4-rot)" d="M80 130 L98.1 62.4" />
    <path class="dl-dg-arrow" d="M104.2 116 A28 28 0 0 0 87.2 103" />
    <text class="dl-dg-in" x="110" y="96">3θ</text>
    <text class="dl-dg-small" x="146" y="96">k, pos 2</text>
    <text class="dl-dg-small" x="84" y="54">q, pos 5</text>
    <text class="dl-dg-small" x="80" y="160" text-anchor="middle">positions 2 and 5</text>
  </g>
  <g v-click>
    <path class="dl-dg-grad" d="M245 130 H325" />
    <path class="dl-dg-line is-muted" marker-end="url(#l6s4-rot)" d="M245 130 L245 60" />
    <path class="dl-dg-line" marker-end="url(#l6s4-rot)" d="M245 130 L195.5 80.5" />
    <path class="dl-dg-arrow" d="M245 102 A28 28 0 0 0 225.2 110.2" />
    <text class="dl-dg-in" x="230" y="84" text-anchor="middle">3θ</text>
    <text class="dl-dg-small" x="250" y="56">k, pos 6</text>
    <text class="dl-dg-small" x="160" y="74">q, pos 9</text>
    <text class="dl-dg-small" x="245" y="160" text-anchor="middle">positions 6 and 9</text>
  </g>
  <text class="dl-dg-small" x="165" y="188" text-anchor="middle">θ = 15° per position; the gap is 3θ = 45° in both</text>
</svg>

</div>
<div>

<v-clicks>

- Added at the bottom, position has to **survive every block**
- The model needs **relative** position: *three words before me*, not *word 412*
- **RoPE** (rotary position embedding): **rotate** each query and key by an angle set by its position
- The dot product then depends only on the **difference** of positions

</v-clicks>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Relative position comes from the geometry, inside every attention layer. Every
major open model since Llama uses it.

</div>

<div class="mt-2">
  <Citation source="Su et al., RoFormer: Enhanced Transformer with Rotary Position Embedding (2021)" url="https://arxiv.org/abs/2104.09864" />
</div>

<!--
The one-line intuition: rotating both vectors by the same amount does not change
the angle between them, so only the difference in rotation survives the dot
product. That is relative position, straight from the geometry.

The picture: a key (grey) and a query (accent), both starting along the dashed
line for clarity. Each is rotated by 15 degrees per position. At positions 2
and 5 the key turns 30 degrees and the query 75, so the angle between them is
45 degrees — three positions apart, 3 theta.

Click: the right panel moves both words four positions later, to 6 and 9. Both
vectors turn further, but the gap is still 45 degrees. The dot product only sees
the gap.

Click 2 to 4: the bullets. A sinusoid added at the bottom has to survive every
block to still mean anything. Learned position embeddings also cannot go past
the longest sentence they were trained on. RoPE is applied inside every
attention layer, so it cannot fade.

Click 5: the callout.

Do not derive it. The room needs to know what RoPE is for and why "rotary"
appears in every model card they will read.

The extrapolation claim needs a caveat if anyone presses: RoPE extrapolates
better than learned embeddings, not perfectly. Long-context models still need
interpolation tricks on top.
-->

---
layout: default
title: "In words: Position, done properly"
---

# In words: Position, done properly

<div class="dl-describe">

- Adding a position signal once, at the bottom, has two problems. It must survive every block, and it says "word 412" rather than "three words back".
- RoPE (rotary position embedding) instead rotates each query and key by an angle that grows with its position.
- In the picture, each position adds 15°. At positions 2 and 5, the key turns 30° and the query 75°. The gap is 45°.
- At positions 6 and 9, both turn further, but the gap is still 45°.
- A dot product only sees that gap. So attention sees relative position, in every layer.

</div>

<!--
Revision slide. Give the room 30 seconds to read it, or skip it in the lecture.
-->

---
layout: default
title: What generation actually costs
---

# What generation actually costs

Token 501 attends to tokens 1–500. Their keys and values were already computed
for token 500.

<div class="grid grid-cols-2 gap-8 mt-2 dl-tight">
<div>

<svg viewBox="0 0 330 230" class="dl-diagram" role="img" aria-label="The key-value cache grows by one column per generated token; with grouped-query attention four query heads share one key-value head">
  <g v-for="(t, r) in [3, 4, 5]" :key="'s' + t">
    <text class="dl-dg-small" x="4" :y="40 + r * 40">step {{ t }}</text>
    <rect v-for="c in t" :key="c" :class="c === t ? 'dl-dg-fill' : 'dl-dg-fill is-muted'" :x="44 + (c - 1) * 30" :y="22 + r * 40" width="26" height="26" rx="3" />
    <text class="dl-dg-small is-good" :x="56 + t * 30" :y="40 + r * 40">1 new query</text>
  </g>
  <text class="dl-dg-small" x="44" y="146">grey: cached keys and values · accent: computed now</text>
  <g v-click>
    <circle v-for="h in 4" :key="h" class="dl-dg-dot is-accent" :cx="40 + (h - 1) * 34" cy="178" r="7" />
    <path v-for="h in 4" :key="'l' + h" class="dl-dg-arrow" :d="`M${40 + (h - 1) * 34} 185 L91 205`" />
    <rect class="dl-dg-fill is-muted" x="74" y="205" width="34" height="20" rx="3" />
    <text class="dl-dg-small" x="91" y="219" text-anchor="middle">K, V</text>
    <text class="dl-dg-small" x="180" y="182">4 query heads</text>
    <text class="dl-dg-small" x="180" y="198">share 1 key/value head</text>
    <text class="dl-dg-small is-good" x="180" y="216">cache ÷ 4</text>
  </g>
</svg>

</div>
<div>

<v-clicks>

- **KV (key–value) cache**: keep every layer's keys and values
- Each new token computes **one** query and reuses the rest
- Cost per new token falls from $O(T^2)$ to $O(T)$

</v-clicks>

<div v-click class="mt-2 dl-callout">

The cache is **enormous**: layers × heads × tokens × $d_k$ × 2, per sequence.
At long context it fills the GPU, not the weights.

</div>

</div>
</div>

<!--
This is the slide that connects the architecture to why serving these models is
hard, and it is the one industry cares most about.

The picture: three generation steps. At step 3 the model has keys and values
for tokens 1 and 2 already (grey) and computes only the new token's (accent).
Each step adds one column. The new token needs one query, and it reads every
cached column.

Click to Click 3: the bullets. Without the cache, every step recomputes
attention for every earlier token, so the cost per new token grows with T
squared. With the cache it grows with T.

Click 4: the callout. The arithmetic if the room wants it: Llama-2-7B has 32
layers and 32 heads at d_k = 128, so per token per sequence the cache is
32 x 32 x 128 x 2 x 2 bytes, about 512 KB. At 4096 tokens that is 2 GB for one
conversation. Multiply by the number of concurrent users.

Click 5: the bottom of the picture. Grouped-query attention keeps all the query
heads but lets groups of them share one key/value head. The cache shrinks by
the group size; quality barely moves. With 8 key/value heads instead of 32 it
is four times smaller. That is why it is in essentially every model released
since 2023.
-->

---
layout: default
title: "In words: What generation actually costs"
---

# In words: What generation actually costs

<div class="dl-describe">

- A model writes one token at a time. Each new token attends to every earlier token.
- The keys and values of earlier tokens do not change. So the model keeps them in a **KV (key–value) cache**.
- In the picture, grey cells are cached and the accent cell is new. Each step adds one column and needs only one new query.
- The cache costs memory: layers × heads × tokens × $d_k$ × 2, for every sequence.
- With grouped-query attention, four query heads share one key/value head, so the cache is four times smaller.
- Remember: at long context, the cache, not the weights, fills the GPU.

</div>

<!--
Revision slide. Give the room 30 seconds to read it, or skip it in the lecture.
-->

---
layout: default
core: true
title: The same block, more of it
---

# The same block, more of it

<div class="dl-ledger dl-ledger--scale mt-1">

| | year | blocks | $d_{\text{model}}$ | heads | context | parameters |
| --- | --- | --- | --- | --- | --- | --- |
| Transformer base | 2017 | 6 | 512 | 8 | 512 | 65 M |
| BERT base | 2018 | 12 | 768 | 12 | 512 | 110 M |
| GPT-2 XL | 2019 | 48 | 1600 | 25 | 1024 | 1.5 B |
| GPT-3 | 2020 | 96 | 12288 | 96 | 2048 | 175 B |
| Llama 3.1 70B | 2024 | 80 | 8192 | 64 | 128 k | 70 B |

</div>

<div class="grid grid-cols-2 gap-6 mt-2">
<div>

<svg viewBox="0 0 480 140" class="dl-diagram" style="max-height: 8rem" role="img" aria-label="Each model drawn as a rectangle with width proportional to d_model and height proportional to the number of blocks; the growth is mostly in width">
  <text class="dl-dg-small" x="4" y="12">width = d_model · height = blocks</text>
  <rect class="dl-dg-fill is-muted" x="10" y="94.4" width="6.2" height="5.6" />
  <rect class="dl-dg-fill is-muted" x="75" y="88.8" width="9.4" height="11.2" />
  <rect class="dl-dg-fill is-muted" x="135" y="55" width="19.5" height="45" />
  <rect class="dl-dg-fill" x="190" y="10" width="150" height="90" />
  <rect class="dl-dg-fill" x="360" y="25" width="100" height="75" />
  <path class="dl-dg-split" d="M4 100 H476" />
  <text class="dl-dg-small" x="13" y="118" text-anchor="middle">2017</text>
  <text class="dl-dg-small" x="80" y="118" text-anchor="middle">BERT</text>
  <text class="dl-dg-small" x="145" y="118" text-anchor="middle">GPT-2 XL</text>
  <text class="dl-dg-small" x="265" y="118" text-anchor="middle">GPT-3</text>
  <text class="dl-dg-small" x="410" y="118" text-anchor="middle">Llama 3.1</text>
</svg>

</div>
<div>

<div v-click class="dl-callout">

Deeper, wider, longer — and the **same block**.

</div>

<div v-click class="mt-2 dl-secondary">

Context grew 250-fold, so the $T^2$ cost grew too. Faster kernels and caching
kept it affordable.

</div>

</div>
</div>

<!--
The picture draws each model as a rectangle: its width is d_model, its height
is the number of blocks, both to scale against GPT-3. Read across: the
rectangles get much wider and only somewhat taller.

Read down the "blocks" column and then down the "parameters" column: depth grew
about 13x and parameters about 1000x, so most of the growth is width, not depth.
Students usually assume the reverse.

Click: the callout. No replacement for the block has won in eight years; the
growth came from more compute. Several proposed replacements for attention have
been published every year since 2017 and the vanilla block is still what gets
trained. Mamba and the state-space family are the most serious current
challenge, and they are worth one sentence if asked — recurrent models with a
parallelisable scan, which is the RNN's advantage back without the RNN's
sequential training.

Click 2: context went from 512 to 128 k tokens, about 250-fold, so the T^2 cost
from "The bill for looking everywhere" grew too. Engineering kept it affordable:
faster kernels, cached keys, cheaper positions. Attention itself was not
replaced.

Class cut: about 2 minutes. In the full slides, for self-study, it is followed by "What did not change".
-->

---
layout: default
title: "In words: The same block, more of it"
---

# In words: The same block, more of it

<div class="dl-describe">

- The table lists five models from 2017 to 2024. All of them stack the same block.
- In the picture, each rectangle is one model. Its width is $d_{\text{model}}$ and its height is the number of blocks.
- Depth grew from 6 to at most 96 blocks, about 13 times more.
- Parameters grew from 65 M to 175 B, about 1000 times more. So most of the growth is width.
- Context grew from 512 to 128 k tokens. The $T^2$ cost of attention grew with it.
- Remember: the block stayed the same. Compute and engineering did the growing.

</div>

<!--
Revision slide. Give the room 30 seconds to read it, or skip it in the lecture.
-->

---
layout: default
title: What did not change
---

# What did not change

<div class="grid grid-cols-[17rem_1fr] gap-8 mt-1">
<div>

<svg viewBox="0 0 300 340" class="dl-diagram" role="img" aria-label="The attention layer as a flow of six numbered steps: projections, scaled dot product, softmax, weighted sum, add and normalise, position-wise network">
  <defs>
    <marker id="l6s4-same" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="100" y="6" width="80" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="140" y="24" text-anchor="middle">token x</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s4-same)" d="M140 32 L74 54 M140 32 V54 M140 32 L226 54" />
  <rect class="dl-dg-fill" x="44" y="56" width="56" height="24" rx="4" />
  <rect class="dl-dg-fill" x="122" y="56" width="56" height="24" rx="4" />
  <rect class="dl-dg-fill" x="202" y="56" width="56" height="24" rx="4" />
  <text class="dl-dg-in" x="72" y="73" text-anchor="middle">q</text>
  <text class="dl-dg-in" x="150" y="73" text-anchor="middle">k</text>
  <text class="dl-dg-in" x="230" y="73" text-anchor="middle">v</text>
  <path class="dl-dg-arrow" marker-end="url(#l6s4-same)" d="M72 80 L110 102 M150 80 V102 M230 80 V202 M140 130 V152 M140 178 V202 M140 230 V252 M140 280 V302" />
  <rect class="dl-dg-op" x="60" y="104" width="160" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="140" y="122" text-anchor="middle">q · k / √dₖ</text>
  <rect class="dl-dg-op" x="80" y="154" width="120" height="24" rx="4" />
  <text class="dl-dg-lab is-sm" x="140" y="171" text-anchor="middle">softmax</text>
  <rect class="dl-dg-op" x="50" y="204" width="200" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="140" y="222" text-anchor="middle">Σ weight × v</text>
  <rect class="dl-dg-box" x="80" y="254" width="120" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="140" y="272" text-anchor="middle">add &amp; norm</text>
  <path class="dl-dg-grad is-good" marker-end="url(#l6s4-same)" d="M180 19 H286 V267 H202" />
  <rect class="dl-dg-net" x="50" y="304" width="180" height="30" rx="6" />
  <text class="dl-dg-lab is-sm" x="140" y="324" text-anchor="middle">position-wise network</text>
  <g v-for="b in [[1, 68], [2, 117], [3, 166], [4, 217], [5, 267], [6, 319]]" :key="b[0]">
    <circle class="dl-dg-fill" cx="16" :cy="b[1]" r="10" />
    <text class="dl-dg-in" x="16" :y="b[1] + 4.5" text-anchor="middle">{{ b[0] }}</text>
  </g>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

1. **Query, key, value**: three projections of every token
2. A **dot product** score, divided by $\sqrt{d_k}$
3. A **softmax** over positions: positive weights that sum to 1
4. A **weighted sum of values** as the output
5. **Residual** and **normalise** around every sub-layer
6. A **position-wise network** holding most of the parameters

</v-clicks>

<div v-click class="mt-4 dl-callout">

A 2017 attention implementation still runs, unchanged, inside a model trained
this year.

</div>

</div>
</div>

<!--
Read the list slowly. This is the summary of the whole lecture and it is
deliberately the same list as section 01 and section 02.

The picture is the attention layer drawn as one flow, top to bottom, with a
numbered badge for each line of the list. The dashed accent line is the
residual: the input goes around the attention and is added back in.

Click to Click 6: one step each. Projections into q, k and v; the score q · k
divided by the square root of d_k; the softmax that makes the weights positive
and sum to 1; the weighted sum of the values; add and normalise; then the
position-wise network that holds most of the parameters.

Click 7: the callout. Say the thing the table on "The same block, more of it"
implies: the reason to teach the 2017 paper in 2026 is not history. It is that
the mechanism is still the mechanism, and a student who understands these six
lines can read any model released this year.
-->

---
layout: default
title: "In words: What did not change"
---

# In words: What did not change

<div class="dl-describe">

The picture is one attention layer, read from top to bottom. Each badge matches a line of the list:

1. Each token is projected three times, into a query $q$, a key $k$ and a value $v$.
2. A query and a key are compared with a dot product, divided by $\sqrt{d_k}$.
3. A softmax turns those scores into positive weights that sum to 1.
4. The output is the weighted sum of the values.
5. The input is added back (the residual) and the result is normalised.
6. A position-wise network then works on each token alone.

Remember: these six steps are the same in 2017 and today.

</div>

<!--
Revision slide that closes the section. Give the room 30 seconds to read it,
then move on to the PyTorch section.
-->
---
layout: section
index: "05"
---

# In PyTorch

Everything you computed by hand, as code.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="code" :size="190" /></div>

<!--
Section 05: the lecture's mechanism turned into PyTorch, so the lab can start
from working code. Nothing new is introduced here; every line maps to a slide
the room has already seen.

The glyph: a tensor slab with its three sizes, B, T and d. It is the shape every
code slide in this section passes around.

About fifteen minutes. If short on time, show "The mechanism is one function
call", "A block, and a stack" and "Four bugs, and what each one looks like", and
leave the rest for the lab.
-->

---
layout: default
core: true
title: The mechanism is one function call
---

# The mechanism is one function call

```python {all|1-4|6|8-9|all}{lines:true}
import torch
import torch.nn.functional as F

q, k, v = (torch.randn(32, 8, 128, 64) for _ in range(3))   # (B, heads, T, d_k)

out = F.scaled_dot_product_attention(q, k, v, is_causal=True)

print(out.shape)          # torch.Size([32, 8, 128, 64])
#  scores (32, 8, 128, 128) are never built — that is what FlashAttention buys
```

<div class="grid grid-cols-[1fr_1fr] gap-6 mt-2 items-center">
<div>

<svg class="dl-diagram" viewBox="0 0 440 130" role="img" aria-label="q, k and v, each of shape 32 by 8 by 128 by 64, go into one attention call that scales, masks, applies softmax and multiplies by v. The output has the same shape. The scores tensor, 32 by 8 by 128 by 128, is drawn dashed in red: it is never stored.">
  <defs>
    <marker id="l6s5-a1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="dl-dg-head" /></marker>
  </defs>
  <rect x="4" y="8" width="70" height="24" rx="3" class="dl-dg-box" />
  <text x="39" y="25" class="dl-dg-lab is-sm" text-anchor="middle">q</text>
  <rect x="4" y="38" width="70" height="24" rx="3" class="dl-dg-box" />
  <text x="39" y="55" class="dl-dg-lab is-sm" text-anchor="middle">k</text>
  <rect x="4" y="68" width="70" height="24" rx="3" class="dl-dg-box" />
  <text x="39" y="85" class="dl-dg-lab is-sm" text-anchor="middle">v</text>
  <text x="44" y="112" class="dl-dg-small" text-anchor="middle">(32, 8, 128, 64)</text>
  <path d="M78 50 H122" class="dl-dg-arrow" marker-end="url(#l6s5-a1)" />
  <rect x="126" y="26" width="176" height="48" rx="6" class="dl-dg-op" />
  <text x="214" y="46" class="dl-dg-lab is-sm" text-anchor="middle">attention</text>
  <text x="214" y="64" class="dl-dg-small" text-anchor="middle">scale, mask, softmax, @ v</text>
  <rect x="144" y="88" width="140" height="38" rx="4" class="dl-dg-box is-bad" />
  <text x="214" y="103" class="dl-dg-small is-bad" text-anchor="middle">scores (32, 8, 128, 128)</text>
  <text x="214" y="119" class="dl-dg-small is-bad" text-anchor="middle">never stored</text>
  <path d="M306 50 H340" class="dl-dg-arrow" marker-end="url(#l6s5-a1)" />
  <rect x="344" y="38" width="70" height="24" rx="3" class="dl-dg-box is-accent" />
  <text x="379" y="55" class="dl-dg-lab is-sm" text-anchor="middle">out</text>
  <text x="384" y="80" class="dl-dg-small" text-anchor="middle">(32, 8, 128, 64)</text>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

- Scaling, the mask and the softmax all happen inside; `is_causal=True` is the triangle
- A fused kernel never stores the $T \times T$ scores
- Heads are a **batch dimension**: `(B, heads, T, d_k)`

</v-clicks>

</div>
</div>

<!--
The point: in practice the whole attention mechanism is one library call. Show
this before the hand-written version, so the room knows the hand-written version
is for understanding, not for production. Nobody should write their own
softmax(QK^T / sqrt(d_k)) in real code.

On screen: the code above, and a sketch below it. In the sketch, q, k and v go
into one attention box, and the output comes out with the same shape. The red
dashed box is the scores tensor, which the fused kernel never stores.

Click 1 (lines 1-4): three random tensors of shape (32, 8, 128, 64). That is
batch 32, 8 heads, 128 tokens, 64 numbers per head.

Click 2 (line 6): the call. is_causal=True applies the triangular mask, so no
position can see a later one.

Click 3 (lines 8-9): the output shape equals the input shape. The comment says
the (32, 8, 128, 128) scores are never built. That is the FlashAttention kernel
from the modern-transformers section.

Click 4: back to the whole code. Then the three bullets, one per click: what is
inside the call, why the T × T matrix never exists, and the shape convention.

The shape (B, h, T, d_k) is the thing to memorise. The heads sit between batch
and time so the whole thing is one batched matrix multiply.

Depth: pass an explicit attn_mask instead of is_causal when you have padding as
well as causality. You have to combine the two masks yourself, which is the most
common source of silent errors in hand-written transformer code.

Class cut: about 3 minutes. In the full slides, for self-study, it is followed by "Self-attention, written out", "A block, and a stack" and "Or use the one in the box".
-->

---
layout: default
---

# In words: The mechanism is one function call

<div class="dl-describe">

The slide shows that the whole attention mechanism is one PyTorch function.

- **Reading the sketch:** q, k and v go into one attention box. The red dashed
  box is the scores tensor.
- **What the call does:** it scales the scores, applies the mask and the softmax,
  and multiplies by v. With `is_causal=True`, no position sees a later one.
- **The shapes:** q, k, v and the output are all `(32, 8, 128, 64)`: batch,
  heads, tokens, width per head.
- **The saving:** a fused kernel never stores the `(32, 8, 128, 128)` scores.

Remember the shape `(B, heads, T, d_k)`: the heads act like extra batch entries.

</div>

<!--
The point: the attention you computed by hand is one library call, and its
shape convention puts the heads next to the batch. Give the room about 30
seconds to read. Skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
title: Self-attention, written out
---

# Self-attention, written out

```python {all|5-6|10-11|12|13-14|all}{lines:true}
class SelfAttention(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.h, self.dk = n_heads, d_model // n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)   # W_Q, W_K, W_V
        self.proj = nn.Linear(d_model, d_model, bias=False)      # W_O

    def forward(self, x):                                  # (B, T, d)
        B, T, d = x.shape
        q, k, v = self.qkv(x).split(d, dim=-1)             # three of (B, T, d)
        q, k, v = (t.view(B, T, self.h, self.dk).transpose(1, 2) for t in (q, k, v))
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True)
        y = y.transpose(1, 2).reshape(B, T, d)             # heads back together
        return self.proj(y)                                # (B, T, d)
```

<svg class="dl-diagram mt-1" viewBox="0 0 820 64" style="max-width: 46rem;" role="img" aria-label="The shape of x through the layer: (B, T, d), then three tensors of (B, T, d) after qkv and split, then (B, h, T, d_k) after view and transpose, then (B, h, T, d_k) after attention, then (B, T, d) after merging the heads and the output projection.">
  <defs>
    <marker id="l6s5-a2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="dl-dg-head" /></marker>
  </defs>
  <rect x="2" y="4" width="120" height="30" rx="3" class="dl-dg-box" />
  <text x="62" y="24" class="dl-dg-in" text-anchor="middle">x (B, T, d)</text>
  <path d="M124 19 H168" class="dl-dg-arrow" marker-end="url(#l6s5-a2)" />
  <text x="146" y="54" class="dl-dg-small" text-anchor="middle">qkv, split</text>
  <rect x="172" y="4" width="120" height="30" rx="3" class="dl-dg-box" />
  <text x="232" y="24" class="dl-dg-in" text-anchor="middle">3 × (B, T, d)</text>
  <path d="M294 19 H338" class="dl-dg-arrow" marker-end="url(#l6s5-a2)" />
  <text x="316" y="54" class="dl-dg-small" text-anchor="middle">view, transpose</text>
  <rect x="342" y="4" width="120" height="30" rx="3" class="dl-dg-box is-accent" />
  <text x="402" y="24" class="dl-dg-in" text-anchor="middle">(B, h, T, d_k)</text>
  <path d="M464 19 H508" class="dl-dg-arrow" marker-end="url(#l6s5-a2)" />
  <text x="486" y="54" class="dl-dg-small" text-anchor="middle">attention</text>
  <rect x="512" y="4" width="120" height="30" rx="3" class="dl-dg-box is-accent" />
  <text x="572" y="24" class="dl-dg-in" text-anchor="middle">(B, h, T, d_k)</text>
  <path d="M634 19 H678" class="dl-dg-arrow" marker-end="url(#l6s5-a2)" />
  <text x="656" y="54" class="dl-dg-small" text-anchor="middle">merge, W_O</text>
  <rect x="682" y="4" width="120" height="30" rx="3" class="dl-dg-box" />
  <text x="742" y="24" class="dl-dg-in" text-anchor="middle">(B, T, d)</text>
</svg>

<div v-click class="mt-1 dl-secondary">

The heads are a **reshape**, not a loop. Eight heads cost what one would.

</div>

<!--
The point: the whole multi-head layer fits in fourteen lines, and every line is
something the room has already seen on an earlier slide.

On screen: the class, and below it a shape strip. The strip follows x through
the layer: (B, T, d) in, three copies after qkv and split, (B, h, T, d_k) once
the heads are split out (the two accent boxes), and (B, T, d) out again.

Click 1 (lines 5-6): one Linear makes Q, K and V at once. It holds the three
matrices from "Three roles, one vector", stacked. One big matrix multiply is
faster than three small ones; mathematically it is the same. A second Linear is
W_O. bias=False is the modern convention from the table on "What else changed
inside the block".

Click 2 (lines 10-11): split into q, k, v, each (B, T, d). Then the reshape:
(B, T, d) becomes (B, T, h, d_k), and the transpose makes it (B, h, T, d_k).
Walk this one carefully; it is the only line that is not obvious. The transpose
puts the heads next to the batch, so the matrix multiply treats them as
independent problems.

Click 3 (line 12): the library call from the previous code slide, with the
causal mask.

Click 4 (lines 13-14): undo the reshape, (B, h, T, d_k) back to (B, T, d), and
apply W_O. The output has the same shape as the input.

Click 5: the note. The heads are a reshape, not a Python loop, so eight heads
cost about what one head would.

This is nanoGPT's CausalSelfAttention, minus the dropout. Point them at it.
-->

---
layout: default
---

# In words: Self-attention, written out

<div class="dl-describe">

The slide shows a multi-head self-attention layer in fourteen lines.

1. One `Linear` layer makes Q, K and V together. A second one, `proj`, is $W_O$.
2. The input `x` is `(B, T, d)`. The `qkv` layer and `split` give three tensors of that shape.
3. Then `view` and `transpose` split the width into heads: `(B, h, T, d_k)`.
4. The library call computes attention with the causal mask.
5. The heads are put back together into `(B, T, d)`, and `proj` mixes them.

Read the strip from left to right: the output shape equals the input shape.
No Python loop runs over the heads.

</div>

<!--
The point: multi-head attention is a reshape around one function call. Give the
room about 30 seconds to read. Skip in the lecture if short on time — this slide
is for revision.
-->

---
layout: default
title: A block, and a stack
---

# A block, and a stack

<div class="grid grid-cols-[1fr_15rem] gap-4 items-center">
<div>

```python {all|4-8|11-12|15|all}{lines:true}
class Block(nn.Module):
    def __init__(self, d_model, n_heads, d_ff):
        super().__init__()
        self.n1 = nn.LayerNorm(d_model)
        self.attn = SelfAttention(d_model, n_heads)
        self.n2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(nn.Linear(d_model, d_ff), nn.GELU(),
                                nn.Linear(d_ff, d_model))

    def forward(self, x):
        x = x + self.attn(self.n1(x))      # pre-LN: normalise the copy…
        x = x + self.ff(self.n2(x))        # …never the residual stream itself
        return x

model = nn.Sequential(*[Block(512, 8, 2048) for _ in range(6)])
```

</div>
<div>

<svg class="dl-diagram" viewBox="0 0 230 290" role="img" aria-label="One pre-LN block, read from the bottom. The residual stream x runs straight up. A copy branches off, goes through a norm and attention, and is added back at the first plus sign. A second copy goes through a norm and the feed-forward network and is added back at the second plus sign. Six of these blocks make the stack.">
  <defs>
    <marker id="l6s5-a3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="dl-dg-head" /></marker>
  </defs>
  <path d="M30 280 V214" class="dl-dg-line" />
  <path d="M30 198 V104" class="dl-dg-line" />
  <path d="M30 88 V22" class="dl-dg-line" marker-end="url(#l6s5-a3)" />
  <text x="44" y="282" class="dl-dg-in">x</text>
  <text x="44" y="22" class="dl-dg-small">× 6 blocks</text>
  <circle cx="30" cy="206" r="8" class="dl-dg-op" />
  <text x="30" y="210.5" class="dl-dg-lab is-sm" text-anchor="middle">+</text>
  <circle cx="30" cy="96" r="8" class="dl-dg-op" />
  <text x="30" y="100.5" class="dl-dg-lab is-sm" text-anchor="middle">+</text>
  <path d="M30 256 H62" class="dl-dg-arrow" />
  <rect x="62" y="244" width="50" height="24" rx="3" class="dl-dg-box" />
  <text x="87" y="261" class="dl-dg-small" text-anchor="middle">norm</text>
  <path d="M112 256 H124" class="dl-dg-arrow" />
  <polygon points="124,242 220,242 212,270 132,270" class="dl-dg-net" />
  <text x="172" y="261" class="dl-dg-small" text-anchor="middle">attention</text>
  <path d="M172 242 V206 H42" class="dl-dg-arrow" marker-end="url(#l6s5-a3)" />
  <path d="M30 146 H62" class="dl-dg-arrow" />
  <rect x="62" y="134" width="50" height="24" rx="3" class="dl-dg-box" />
  <text x="87" y="151" class="dl-dg-small" text-anchor="middle">norm</text>
  <path d="M112 146 H124" class="dl-dg-arrow" />
  <polygon points="124,132 220,132 212,160 132,160" class="dl-dg-net" />
  <text x="172" y="151" class="dl-dg-small" text-anchor="middle">feed-forward</text>
  <path d="M172 132 V96 H42" class="dl-dg-arrow" marker-end="url(#l6s5-a3)" />
</svg>

</div>
</div>

<div v-click class="mt-2 dl-secondary">

`x = x + sublayer(norm(x))`, twice. This is the pre-LN (layer norm first) block
from "One wire moved, and deep stacks started training". `nn.Sequential` is the stack.

</div>

<!--
The point: a whole transformer block is two lines of forward code, and a stack
is one more line. The room can now build the architecture from scratch.

On screen: the code on the left, and on the right the block drawn from the
bottom up. The accent line is the residual stream, x. Each branch takes a copy,
normalises it, runs a sub-layer on it, and adds the result back at a plus sign.
The stream itself is never normalised.

Click 1 (lines 4-8): the parts. Two LayerNorms, the SelfAttention class from the
previous code slide, and a two-layer feed-forward network, 512 to 2048 to 512.

Click 2 (lines 11-12): read the two forward lines aloud as English. Normalise a
copy, run the sub-layer on the copy, add the result back to the stream. Then
again with the feed-forward network. These are the two branches in the sketch.

Click 3 (line 15): six blocks in an nn.Sequential. That is the whole stack.

Click 4: back to the whole code, then the note: this is the pre-LN wiring from
"One wire moved, and deep stacks started training".

Post-LN would be x = self.n1(x + self.attn(x)), and the difference is exactly the
widget's toggle on that slide. Write both on the board side by side if there is
time.

Depth: GELU rather than ReLU because that is what BERT and GPT-2 used, and what
most non-gated models still use. SwiGLU needs three matrices and does not fit
the Sequential, which is why it is not here.
-->

---
layout: default
---

# In words: A block, and a stack

<div class="dl-describe">

The slide shows one transformer block in PyTorch, and a stack of six blocks.

- **Reading the sketch:** start at the bottom. The accent line is the residual stream `x`.
- **First branch:** a copy of `x` is normalised and goes through attention. The
  result is added back at the first plus sign.
- **Second branch:** the same, with the feed-forward network, at the second plus sign.
- **In code:** each branch is one line, `x = x + sublayer(norm(x))`.
- **The stack:** six `Block(512, 8, 2048)` objects inside `nn.Sequential`.

This is the pre-LN wiring: the norm acts on the copy, never on the stream itself.

</div>

<!--
The point: a block is two residual branches, and a stack is a list of blocks.
Give the room about 30 seconds to read. Skip in the lecture if short on time —
this slide is for revision.
-->

---
layout: default
title: Or use the one in the box
---

# Or use the one in the box

```python {all|1-3|5|7-8|all}{lines:true}
layer = nn.TransformerEncoderLayer(d_model=512, nhead=8, dim_feedforward=2048,
                                   batch_first=True,    # (B, T, d), not (T, B, d)
                                   norm_first=True)     # pre-LN, not the default

encoder = nn.TransformerEncoder(layer, num_layers=6)

out = encoder(src, src_key_padding_mask=pad_mask)       # (B, T, 512) → (B, T, 512)
print(sum(p.numel() for p in encoder.parameters()))     # 18 914 304
```

<div class="grid grid-cols-[1fr_1fr] gap-6 mt-2 items-center">
<div>

<svg class="dl-diagram" viewBox="0 0 420 120" role="img" aria-label="An input of shape (B, T, 512) goes into a stack of six encoder layers and comes out with the same shape. The stack has 18 914 304 parameters.">
  <defs>
    <marker id="l6s5-a4" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="dl-dg-head" /></marker>
  </defs>
  <rect x="2" y="36" width="96" height="28" rx="3" class="dl-dg-box" />
  <text x="50" y="55" class="dl-dg-in" text-anchor="middle">(B, T, 512)</text>
  <path d="M100 50 H136" class="dl-dg-arrow" marker-end="url(#l6s5-a4)" />
  <rect v-for="k in 6" :key="k" x="142" :y="4 + (k - 1) * 15" width="134" height="12" rx="2" class="dl-dg-fill" />
  <text x="209" y="112" class="dl-dg-small" text-anchor="middle">6 encoder layers</text>
  <path d="M280 50 H316" class="dl-dg-arrow" marker-end="url(#l6s5-a4)" />
  <rect x="320" y="36" width="96" height="28" rx="3" class="dl-dg-box is-accent" />
  <text x="368" y="55" class="dl-dg-in" text-anchor="middle">(B, T, 512)</text>
  <text x="368" y="84" class="dl-dg-small" text-anchor="middle">18 914 304</text>
  <text x="368" y="98" class="dl-dg-small" text-anchor="middle">parameters</text>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

- `batch_first=True`: the same trap as last week's `nn.LSTM` (long short-term memory)
- `norm_first=True`: the default is the 2017 wiring, which needs warmup
- The count matches "What a block costs": **18.9 M**

</v-clicks>

</div>
</div>

<!--
The point: PyTorch ships a ready-made encoder layer, and two of its keyword
arguments default to the wrong thing for a modern model. Neither produces an
error.

On screen: the code, and a sketch of what it builds. A (B, T, 512) input goes
through six stacked encoder layers and comes out with the same shape. The stack
has 18 914 304 parameters.

Click 1 (lines 1-3): one layer, 512 wide, 8 heads, a 2048-wide feed-forward
network. batch_first=True makes the input (B, T, d). norm_first=True makes it
pre-LN.

Click 2 (line 5): six copies of that layer, stacked.

Click 3 (lines 7-8): run it with a padding mask, and count the parameters.

Click 4: back to the whole code. Then the three bullets, one per click.

batch_first: without it PyTorch reads the batch dimension as time, the same
silent failure as nn.LSTM last week. norm_first: the default is the 2017 post-LN
wiring, which needs a learning-rate warmup to train deep. The count: 18 914 304
is the 18.9 M the room computed by hand on "What a block costs", to the number.
Have them run the print; matching a number derived by hand is the most
convincing five seconds available.

Depth: most people writing transformers today do not use these classes. They
write the fourteen lines from "Self-attention, written out", or they load a
pretrained model from Hugging Face. nn.TransformerEncoderLayer is a reasonable
middle.
-->

---
layout: default
---

# In words: Or use the one in the box

<div class="dl-describe">

The slide shows PyTorch's ready-made encoder layer, `nn.TransformerEncoderLayer`.

- **Reading the sketch:** a `(B, T, 512)` input goes through six stacked layers.
  The output has the same shape.
- **Two settings to change:** `batch_first=True` puts the batch first, as
  `(B, T, d)`. `norm_first=True` gives the pre-LN wiring.
- **Why it matters:** both defaults are wrong for a modern model, and neither one
  gives an error message.
- **The check:** the printed count is 18 914 304 parameters. That is the 18.9 M
  from "What a block costs".

Always set both keyword arguments when you use this class.

</div>

<!--
The point: the built-in layer works, but two of its defaults silently give the
old wiring and the wrong shape. Give the room about 30 seconds to read. Skip in
the lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: Shapes, end to end
---

# Shapes, end to end

<div class="grid grid-cols-[1fr_12rem] gap-6 items-center">
<div class="dl-ledger">

| step | shape | what it is |
| --- | --- | --- |
| `ids` | `(32, 128)` | token ids, padded |
| `embed(ids)` + position | `(32, 128, 512)` | added: same width |
| `qkv(x)` | `(32, 128, 1536)` | Q, K, V in one tensor |
| reshape | `(32, 8, 128, 64)` | heads as batch |
| $QK^\top$ | `(32, 8, 128, 128)` | **the scores** |
| weights @ V | `(32, 8, 128, 64)` | output per head |
| merged + $W_O$ | `(32, 128, 512)` | residual stream |
| `head(x)` | `(32, 128, 50257)` | logit per vocabulary entry |

</div>
<div>

<svg class="dl-diagram" viewBox="0 0 200 224" role="img" aria-label="The scores tensor drawn to scale by area. At 128 tokens it is a tiny square of 4.2 million numbers in the corner. At 2048 tokens it is the large square, 1.07 billion numbers, 256 times the area.">
  <rect x="20" y="20" width="160" height="160" class="dl-dg-fill is-muted is-dashed" />
  <rect x="20" y="20" width="10" height="10" class="dl-dg-fill" />
  <text x="20" y="13" class="dl-dg-small is-good">T = 128: 4.2 M (corner)</text>
  <text x="100" y="198" class="dl-dg-small" text-anchor="middle">T = 2048: 1.07 billion</text>
</svg>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Only the scores grow with $T$ **twice**. That row is the long-context problem.

</div>

<!--
The point: follow one batch through the whole model, and see that only one
tensor grows with the square of the sequence length.

On screen: the ledger on the left, one row per step. On the right, the scores
tensor drawn to scale by area. The tiny accent square in the corner is the
scores at T = 128: 32 × 8 × 128 × 128 = 4 194 304, about 4.2 M numbers. The
large dashed square is the same tensor at T = 2048: 32 × 8 × 2048 × 2048 =
1 073 741 824, about 1.07 billion. The sequence is 16 times longer, so the side
is 16 times longer and the area is 256 times larger.

Walk the ledger top to bottom. Token ids (32, 128). The embedding plus position
keeps the width at 512, because the two are added. qkv makes 1536 = 3 × 512.
The reshape gives (32, 8, 128, 64), heads as a batch dimension. The scores are
(32, 8, 128, 128). Weights times V is back to 64 per head. Merging the heads
and applying W_O gives (32, 128, 512), the residual stream again. The output
head gives 50 257 logits, one per vocabulary entry, at every position.

Click: the callout. Every other row grows with T once. The scores row grows with
T twice, and that is the long-context problem.

Lecture 04 and lecture 05 both ended their code section on a shape ledger. Same
habit, and this one has a punchline.

The check to run before writing any training loop:
    x = torch.randint(0, 50257, (32, 128))
    print(model(x).shape)      # torch.Size([32, 128, 50257])

Depth: the last row is a logit per position, not per sequence. A decoder-only
model predicts a next token at every position at once, which is what makes
training parallel.

Class cut: about 2 minutes. In the full slides, for self-study, it is followed by "Four bugs, and what each one looks like".
-->

---
layout: default
---

# In words: Shapes, end to end

<div class="dl-describe">

The slide follows one batch of 32 sequences of 128 tokens through the model.

- **Reading the ledger:** each row is one step and its tensor shape.
- **Most rows keep the width:** 512, or 8 heads of 64.
- **The scores row is different:** `(32, 8, 128, 128)` has the sequence length $T$ twice.
- **Reading the squares:** they are drawn to scale by area. At 128 tokens the
  scores hold about 4.2 M numbers. At 2048 tokens they hold about 1.07 billion.
- **The last row:** 50 257 logits for every position, one per vocabulary entry.

A 16 times longer sequence makes the scores 256 times larger: long context is expensive.

</div>

<!--
The point: only the scores tensor grows with the square of the sequence length.
Give the room about 30 seconds to read. Skip in the lecture if short on time —
this slide is for revision.
-->

---
layout: default
title: Four bugs, and what each one looks like
---

# Four bugs, and what each one looks like

<div class="grid grid-cols-2 gap-4 dl-tight">
<div v-click class="dl-card">

<svg class="dl-diagram" viewBox="0 0 220 60" style="max-height: 3.6rem;" role="img" aria-label="A training loss that falls almost to zero within a few steps.">
  <path class="dl-dg-line is-muted" d="M8 4 V54 H214" style="stroke-width: 1.2;" />
  <path class="dl-dg-line is-bad" d="M10 10 C 30 50, 50 52, 210 53" style="stroke-width: 2.4;" />
  <text x="212" y="44" class="dl-dg-small is-bad" text-anchor="end">loss near 0</text>
</svg>

**No causal mask.** Loss near zero, gibberish output.

</div>
<div v-click class="dl-card">

<svg class="dl-diagram" viewBox="0 0 220 60" style="max-height: 3.6rem;" role="img" aria-label="The shape (B, T) is read as (T, B): batch and time swap places.">
  <rect x="10" y="14" width="76" height="30" rx="3" class="dl-dg-box" />
  <text x="48" y="34" class="dl-dg-in" text-anchor="middle">(B, T)</text>
  <path d="M92 29 H128" class="dl-dg-arrow is-bad" style="stroke: var(--dl-danger);" />
  <rect x="134" y="14" width="76" height="30" rx="3" class="dl-dg-box is-bad" />
  <text x="172" y="34" class="dl-dg-in" text-anchor="middle">(T, B)</text>
</svg>

**`batch_first` left out.** Batch read as time.

</div>
<div v-click class="dl-card">

<svg class="dl-diagram" viewBox="0 0 220 60" style="max-height: 3.6rem;" role="img" aria-label="One token sends attention to three real tokens and, wrongly, to two pad tokens.">
  <rect v-for="k in 3" :key="k" :x="6 + (k - 1) * 42" y="34" width="36" height="20" rx="3" class="dl-dg-box" />
  <rect v-for="k in 2" :key="`p${k}`" :x="132 + (k - 1) * 42" y="34" width="36" height="20" rx="3" class="dl-dg-box is-bad" />
  <text x="150" y="48" class="dl-dg-small is-bad" text-anchor="middle">pad</text>
  <text x="192" y="48" class="dl-dg-small is-bad" text-anchor="middle">pad</text>
  <circle cx="24" cy="8" r="5" class="dl-dg-dot is-accent" />
  <path d="M24 13 L24 33 M24 13 L66 33 M24 13 L108 33" class="dl-dg-line" style="stroke-width: 1.6;" />
  <path d="M24 13 L150 33 M24 13 L192 33" class="dl-dg-line is-bad" style="stroke-width: 1.6;" />
</svg>

**Padding mask forgotten.** Weight on pad tokens.

</div>
<div v-click class="dl-card">

<svg class="dl-diagram" viewBox="0 0 220 60" style="max-height: 3.6rem;" role="img" aria-label="A training loss that falls at first, then shoots up: the deep stack diverges.">
  <path class="dl-dg-line is-muted" d="M8 4 V54 H214" style="stroke-width: 1.2;" />
  <path class="dl-dg-line is-bad" d="M10 20 C 40 34, 70 40, 100 40 C 130 40, 150 30, 170 6" style="stroke-width: 2.4;" />
  <text x="212" y="44" class="dl-dg-small is-bad" text-anchor="end">diverges</text>
</svg>

**`norm_first` left as default.** Post-LN: diverges without warmup.

</div>
</div>

<div v-click class="mt-3 dl-callout">

Three of the four give **no error message**. A loss that looks *too good* is the
first symptom of bug one.

</div>

<!--
The point: this slide is the lab's FAQ, written in advance. It mirrors the
"Four bugs" slide from last week, and three of these four give no error message
at all.

On screen: four cards, one per click. Each card has a small sketch of the
symptom you would see, and one sentence naming the bug.

Click 1: no causal mask in a language model. The red curve falls almost to
zero within minutes, and generation is gibberish. The model learned to copy the
next token from its own input. The tell: if next-token loss on natural text
drops under about 1.0 in the first epoch of a small model, the mask is wrong.

Click 2: batch_first left out. The two boxes show (B, T) being read as (T, B).
No error. PyTorch reads your batch dimension as time, exactly as nn.LSTM did
last week.

Click 3: padding mask forgotten. The accent dot is one token; its red lines go
to the pad tokens. No error. Every short sequence in the batch gets a worse
vector. Padding and causality are two different masks, and you have to combine
them yourself. is_causal=True does not know about your padding.

Click 4: norm_first left as the default. That is post-LN, and a deep stack
diverges in the first few hundred steps unless you add a warmup schedule. The
red curve falls, then shoots up.

Click 5: the callout. Three of the four give no error message. A training loss
that looks too good is the first symptom of bug one, and the only cheap symptom
you get.
-->

---
layout: default
---

# In words: Four bugs, and what each one looks like

<div class="dl-describe">

The slide lists four common bugs in transformer code, with their symptoms.

1. **No causal mask:** the loss drops almost to zero, but generation is gibberish.
   The model copies the next token from its input.
2. **`batch_first` left out:** PyTorch reads the batch as time. There is no error.
3. **Padding mask forgotten:** attention puts weight on pad tokens. There is no error.
4. **`norm_first` left as the default:** the old post-LN wiring. A deep stack
   diverges early unless you add a warmup.

Three of the four bugs give no error message. A loss that looks too good means:
check the mask first.

</div>

<!--
The point: the symptom tells you which bug you have. Give the room about 30
seconds to read. Skip in the lecture if short on time — this slide is for
revision.
-->
---
layout: section
index: "06"
---

# Where that leaves us

One idea, applied twice per block.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="block" :size="190" /></div>

<!--
Section 06 lands the whole lecture in one picture: the block glyph, attention
mixing sideways and a small network working upward, with the residual wire
around both. Every earlier section was one part of that drawing.

About five minutes for the recap and the reading list. If the session is
running late, show the recap, name the lab task, and stop.
-->

---
layout: default
core: true
title: Where we got to
---

# Where we got to

<div class="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 dl-tight">
<div v-click class="flex items-center gap-3">
  <TransformerGlyph kind="cut" :size="52" />
  <div><strong>Recurrence deleted:</strong> all positions processed at once.</div>
</div>
<div v-click class="flex items-center gap-3">
  <TransformerGlyph kind="qkv" :size="52" />
  <div>A <strong>query</strong> meets each <strong>key</strong>; <strong>values</strong> are mixed.</div>
</div>
<div v-click class="flex items-center gap-3">
  <TransformerGlyph kind="heads" :size="52" />
  <div>Several <strong>heads</strong> ask different questions; <strong>position</strong> is added in.</div>
</div>
<div v-click class="flex items-center gap-3">
  <TransformerGlyph kind="block" :size="52" />
  <div><strong>Block:</strong> attention, then a per-position network, plus residuals and norms.</div>
</div>
<div v-click class="flex items-center gap-3">
  <TransformerGlyph kind="encdec" :size="52" />
  <div><strong>Original:</strong> two stacks; a mask hides future words.</div>
</div>
<div v-click class="flex items-center gap-3">
  <TransformerGlyph kind="decoder" :size="52" />
  <div><strong>Modern:</strong> decoder-only, new details, same mechanism.</div>
</div>
<div v-click class="flex items-center gap-3">
  <TransformerGlyph kind="code" :size="52" />
  <div><strong>PyTorch:</strong> one function call on (B, T, d) tensors.</div>
</div>
</div>

<div v-click class="mt-3 dl-callout">

Mix across positions, then think about each position alone.

</div>

<!--
The whole lecture on one slide, one glyph per section, in the order we met
them. The glyphs are the same ones that sat on each section divider, so point
at the shape before reading the words.

Click: the cut chain. The recurrence is gone, so nothing in a layer waits for
anything else and the whole sequence is processed at once.

Click 2: the query fan. Attention is a soft dictionary: the query is matched to
every key by a dot product, the scores are scaled and softmaxed, and the values
are mixed by those weights. A word's meaning is assembled per sentence.

Click 3: the four fans. One softmax answers one question, so we use several
heads. And because attention ignores order, position is put into the vector.

Click 4: the block glyph. Attention mixes sideways, then the same small network
works on each position alone. Each half sits inside a residual connection and a
norm, which is what lets the blocks stack.

Click 5: the two stacks. The original transformer was an encoder and a decoder.
The mask stops a position from seeing later words, which keeps generation
honest and lets training run in parallel.

Click 6: the masked stack. Modern models are decoder-only. They moved the norm,
rotated the positions and shared the key and value heads, and left the
mechanism alone.

Click 7: the tensor slab. In PyTorch the mechanism is one call,
F.scaled_dot_product_attention, and every block maps (B, T, d) to (B, T, d).

Click 8: the callout, the sentence to leave with.

Then hand over: next week takes this block, stacks a hundred of them, trains it
on next-token prediction over a substantial fraction of the written internet, and
asks what happens. None of the architecture changes. Everything else does.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Where we got to"
---

# In words: Where we got to

<div class="dl-describe">

Each glyph stands for one section of the lecture.

- A transformer drops the recurrence, so every position is processed at the same time.
- Attention is a soft lookup. A query is compared with every key, and the values are mixed using those scores.
- Several heads ask several questions at once. Position is added, because attention ignores word order.
- A block is attention, then a small network on each position, each with a residual and a norm.
- The original model had two stacks. Modern models keep only the masked decoder stack.

The sentence to remember: mix across positions, then think about each position alone.

</div>

<!--
The recap in sentences, for revision. Give the room thirty seconds to read it,
then ask which glyph they would struggle to explain. Skip in the lecture if
short on time.
-->

---
layout: default
core: true
title: Reading, and the lab
---

# Reading, and the lab

<div class="grid grid-cols-3 gap-4 mt-4">
<div v-click>
  <LinkCard
    href="https://jalammar.github.io/illustrated-transformer/"
    title="The Illustrated Transformer"
    blurb="Alammar, 2018. The pictures everyone has seen, and still the best first read. Do this one before the lab."
    icon="🖼️"
  />
</div>
<div v-click>
  <LinkCard
    href="https://sebastianraschka.com/blog/2023/self-attention-from-scratch.html"
    title="Self-attention from scratch"
    blurb="Raschka, 2023. The same worked example as today's widgets, in NumPy and PyTorch, at full size."
    icon="✍️"
  />
</div>
<div v-click>
  <LinkCard
    href="https://github.com/karpathy/nanoGPT"
    title="nanoGPT"
    blurb="Karpathy. A complete, readable, trainable decoder-only transformer in about 300 lines. Its attention is our “Self-attention, written out”."
    icon="💻"
  />
</div>
</div>

<div v-click class="mt-4 flex items-center gap-4 dl-tight">
  <TransformerGlyph kind="decoder" :size="64" />
  <div>

**In the lab.** Build the block from “A block, and a stack”. Train a small
decoder-only model on character-level text. Then drop `is_causal`, the
$\sqrt{d_k}$ and the positional encoding, one at a time. Report what each one
costs.

  </div>
</div>

<div v-click class="mt-2 dl-secondary">

Dropping the positional encoding is the interesting one. Predict first.

</div>

<!--
Three readings, in the order to read them, then the lab task.

Click: The Illustrated Transformer, the best first read. Ask them to read it
before the lab.

Click 2: Raschka's from-scratch post, which uses the same worked example as
today's widgets at full size.

Click 3: nanoGPT, a whole decoder-only model in about 300 lines. Its attention
is the class on the "Self-attention, written out" slide.

Click 4: the lab. They build the block from "A block, and a stack", train a
small decoder-only model on characters, and then break it on purpose.

Click 5: ask them to predict, before running it, what happens without the
positional encoding.

The deliberate-breakage exercise carries over from week 5 because it worked.

What each break does, so you can grade it: no mask gives an implausibly low loss
and gibberish samples; no scaling trains but converges slower and worse, more
visibly at larger d_k; no positional encoding still trains to a surprisingly
decent loss, because character-level text is heavily predictable from a bag of
recent characters — which is itself the lesson, and the reason to make them
predict first.

Practicalities — dataset, deadline, what to hand in — belong on the course page.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Reading, and the lab"
---

# In words: Reading, and the lab

<div class="dl-describe">

1. Read "The Illustrated Transformer" first. It explains the architecture with pictures.
2. Read "Self-attention from scratch" next. It works through the same kind of example as the lecture.
3. Look at nanoGPT for a complete decoder-only model. Its attention code matches "Self-attention, written out".

In the lab you build the block from "A block, and a stack". You train it on character-level text.
Then you remove three parts, one at a time: the causal mask, the $\sqrt{d_k}$ scaling and the positional encoding.
Predict each result first, then report what each part was doing.

</div>

<!--
The reading list and the lab task in full sentences, for students who look
back at the deck before the lab. No time needed in the lecture.
-->

---
layout: end
email: vajira@simula.no
next: Large Language Models
---

# To be continued…

<div class="mx-auto mt-2" style="width: 150px;">
  <TransformerGlyph kind="decoder" :size="150" />
</div>

<!--
The decoder-only glyph, one last time: the masked stack that every modern
language model is built from. Next week is what happens when that stack is made
very large and trained on a great deal of text.

Leave five minutes for questions.
-->
