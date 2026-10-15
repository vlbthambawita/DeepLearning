---
theme: dl2026
addons:
  - dl2026
title: "Transformer v2: The Illustrated Transformer"
info: PGR207 Deep Learning 2026 — Transformer v2, after Jay Alammar's The Illustrated Transformer
author: Vajira Thambawita
routerMode: hash
transition: slide-left
mdc: true
themeConfig:
  courseCode: PGR207
  lectureTitle: "Transformer v2: The Illustrated Transformer"
layout: title
courseCode: PGR207
email: vajira@simula.no
---

# The Illustrated Transformer

A machine turns *je suis étudiant* into *i am a student*. We open it layer by
layer, and compute its core step by hand.

<div class="mt-6 flex items-center gap-6">
  <TransformerGlyph kind="encdec" :size="84">the whole machine</TransformerGlyph>
  <span class="text-3xl" style="color: var(--dl-accent)">→</span>
  <TransformerGlyph kind="qkv" :size="84">its core step</TransformerGlyph>
</div>

<div class="mt-2">
  <Citation source="After Jay Alammar, The Illustrated Transformer (2018), CC BY-NC-SA 4.0. Figures re-drawn." url="https://jalammar.github.io/illustrated-transformer/" />
</div>

<!--
One session. This deck follows Jay Alammar's blog post "The Illustrated
Transformer" (2018) section by section, and keeps its three examples: the
"Thinking Machines" pair for self-attention, the sentence "The animal didn't
cross the street because it was too tired", and the translation "je suis
étudiant" → "i am a student". Every figure is re-drawn, and the toy numbers are
small enough to check by hand.

What the deck assumes: vectors and matrix multiplication, a fully connected
layer and an MLP (multilayer perceptron), ReLU, softmax, one-hot vectors,
cross-entropy loss, and training by gradient descent and backpropagation. Word
embeddings get a one-slide refresher in section 00. Residual connections and
layer normalisation are taught from scratch in section 04.

The two pictures are the first two emblems of the deck. Left: two stacks, the
right one reading the left, which is the whole encoder–decoder machine. Right:
one query dot with lines of different weight to three keys, which is
self-attention. Each section has its own emblem; they return on the dividers and
on the recap.

Section 01 is the lecture: forty minutes. A room that leaves able to compute one
self-attention output by hand has the idea that everything else is built on.
Sections 03, 04 and the beam-search slide of 06 are the ones to compress if the
session runs late.
-->

---
layout: default
core: true
title: Today, in eight parts
---

# Today, in eight parts

The whole machine, its core step, then the parts around it.

<div class="grid grid-cols-4 gap-x-4 gap-y-2 mt-2">
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="encdec" :size="56" />
  <span class="dl-secondary">00 The big picture</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="qkv" :size="56" />
  <span class="dl-secondary">01 Self-attention</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="heads" :size="56" />
  <span class="dl-secondary">02 Matrices and many heads</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="position" :size="56" />
  <span class="dl-secondary">03 Word order</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="block" :size="56" />
  <span class="dl-secondary">04 Add & norm</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="decoder" :size="56" />
  <span class="dl-secondary">05 The decoder side</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="train" :size="56" />
  <span class="dl-secondary">06 Training and decoding</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="encdec" :size="56" />
  <span class="dl-secondary">07 Recap</span>
</div>
</div>

<div v-click class="mt-2 dl-callout">

Section 01 is the heart: one word's output, computed by hand.

</div>

<!--
The point: the map of today. The order is Alammar's: first the machine as a
black box, then open it, then spend most of the time on its core step,
self-attention, and finally the parts that sit around it.

On screen: one glyph per section. Point at the shapes; they come back on each
divider and on the recap. Two stacks (00) are the whole machine. The query dot
with weighted lines (01) is self-attention. The four small fans (02) are many
heads. The tile with a wave under it (03) is positional encoding. The block with
a dashed wire around it (04) is add & norm. The masked grid (05) is the decoder.
The bars beside one tall bar (06) are a prediction against its target.

Click: the callout. Section 01 is where the time goes, about forty minutes.

About two minutes. Do not explain any glyph yet.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Today, in eight parts"
---

# In words: Today, in eight parts

<div class="dl-describe">

The slide is the map of the lecture. Each glyph stands for one section, and the
same glyph returns on that section's divider and on the recap.

1. **00, two stacks.** The whole translation machine, seen from outside.
2. **01, a query with weighted lines.** Self-attention, computed by hand.
3. **02 to 04.** Many heads, word order, and the wiring around each layer.
4. **05, a masked grid.** How the decoder writes one word at a time.
5. **06, bars against a target.** How the model is trained, and how it picks words.

Section 01 is the core of the lecture.

</div>

<!--
Revision slide. Twenty seconds; skip in the lecture if short on time.
-->

---
layout: section
index: "00"
---

# The big picture

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="encdec" :size="190" /></div>

<!--
Section 00, about ten minutes. Do not linger on the divider.

The glyph: two stacks of boxes, the right one reading from the left. That is the
whole transformer for translation: an encoder stack and a decoder stack.

What this section has to land: the machine is a black box that turns one
sentence into another; inside are six encoders and six decoders; each encoder
has two parts and each decoder has three; and the data travelling through is a
list of vectors, one per word.
-->

---
layout: default
core: true
title: A black box that translates
---

# A black box that translates

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 250" class="dl-diagram" role="img" aria-label="A French sentence goes into a box labelled transformer and an English sentence comes out; opened, the box holds an encoder part and a decoder part">
  <defs>
    <marker id="tv2s0-box" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-lab is-sm" x="70" y="58" text-anchor="middle">je suis étudiant</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s0-box)" d="M140 54 H200" />
  <rect class="dl-dg-box is-accent" x="206" y="22" width="248" height="64" rx="8" />
  <text class="dl-dg-in" x="330" y="59" text-anchor="middle">TRANSFORMER</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s0-box)" d="M454 54 H514" />
  <text class="dl-dg-lab is-sm" x="588" y="58" text-anchor="middle">i am a student</text>
  <g v-click>
    <line class="dl-dg-split" x1="10" y1="108" x2="650" y2="108" />
    <text class="dl-dg-small" x="330" y="128" text-anchor="middle">open the box</text>
    <rect class="dl-dg-box" x="206" y="144" width="248" height="96" rx="8" />
    <rect class="dl-dg-box is-accent" x="222" y="166" width="96" height="56" rx="5" />
    <text class="dl-dg-in" x="270" y="199" text-anchor="middle">ENCODERS</text>
    <rect class="dl-dg-box is-accent" x="342" y="166" width="96" height="56" rx="5" />
    <text class="dl-dg-in" x="390" y="199" text-anchor="middle">DECODERS</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-box)" d="M318 194 H340" />
    <text class="dl-dg-lab is-sm" x="70" y="198" text-anchor="middle">je suis étudiant</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-box)" d="M140 194 H220" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-box)" d="M438 194 H514" />
    <text class="dl-dg-lab is-sm" x="588" y="198" text-anchor="middle">i am a student</text>
  </g>
</svg>
</div>

<v-clicks>

- The **encoder** part reads the whole input sentence
- The **decoder** part writes the output sentence, using what the encoder found

</v-clicks>

<!--
The point: start from the outside. In machine translation the model is a black
box: a sentence in one language goes in, the same sentence in another language
comes out.

On screen, top row: the French sentence "je suis étudiant", the box, and the
English "i am a student". This example returns in sections 05 and 06.

Click: open the box. Inside are two parts, an encoder part and a decoder part,
with an arrow between them. The encoder reads the input; the decoder writes the
output and uses what the encoder produced.

Click 2: the encoder reads the whole input sentence.

Click 3: the decoder writes the output sentence, using the encoder's result.

About two minutes. Translation is the original use. The same parts are used in
many other tasks; say that, and do not list them yet.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: A black box that translates"
---

# In words: A black box that translates

<div class="dl-describe">

- The top row is the transformer seen from outside. The French sentence *je suis
  étudiant* goes in, and the English *i am a student* comes out.
- The bottom row opens the box. Inside are two parts, joined by an arrow.
- The encoder reads all of *je suis étudiant* before anything is written.
- The decoder produces the English words. It uses the encoder's result, which
  is the arrow between the two parts.
- Everything in this lecture is a closer look at one of these two parts.

</div>

<!--
The point: the machine has an encoder part and a decoder part. Twenty seconds;
this slide is for revision.
-->

---
layout: default
core: true
title: Six encoders, six decoders
---

# Six encoders, six decoders

<div class="grid grid-cols-[1.25fr_1fr] gap-8 mt-1 items-center">
<div>

<svg viewBox="0 0 380 300" class="dl-diagram" role="img" aria-label="Six encoder boxes stacked on the left, six decoder boxes stacked on the right; the top encoder's output feeds every decoder">
  <defs>
    <marker id="tv2s0-stack" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="k in 6" :key="`e${k}`">
    <rect class="dl-dg-box" x="30" :y="258 - k * 38" width="120" height="28" rx="4" />
    <text class="dl-dg-small" x="90" :y="277 - k * 38" text-anchor="middle">encoder {{ k }}</text>
  </g>
  <g v-for="k in 6" :key="`d${k}`">
    <rect class="dl-dg-box is-accent" x="230" :y="258 - k * 38" width="120" height="28" rx="4" />
    <text class="dl-dg-small" x="290" :y="277 - k * 38" text-anchor="middle">decoder {{ k }}</text>
  </g>
  <text class="dl-dg-small" x="90" y="292" text-anchor="middle">je suis étudiant ↑</text>
  <text class="dl-dg-small" x="290" y="12" text-anchor="middle">↑ i am a student</text>
  <g v-click>
    <path class="dl-dg-arrow" d="M150 34 H190 V244" />
    <path v-for="k in 6" :key="`a${k}`" class="dl-dg-arrow" marker-end="url(#tv2s0-stack)" :d="`M190 ${244 - (k - 1) * 38} H228`" />
    <text class="dl-dg-small is-good" x="196" y="292">top encoder → every decoder</text>
  </g>
</svg>

</div>
<div>

<v-clicks>

- The paper uses **6** of each. The number is a choice, not a law
- Each encoder has the **same design** and its own weights
- The input enters the **bottom** encoder and climbs the stack
- The **top** encoder's output goes to **every** decoder

</v-clicks>

</div>
</div>

<!--
The point: each part in the box is a stack of identical layers. The original
paper, "Attention Is All You Need" (Vaswani et al., 2017), uses six encoders and
six decoders. Alammar's note is worth repeating: there is nothing magical about
six.

On screen: two columns of six boxes. Left, the encoders, plain. Right, the
decoders, in accent colour. The French sentence enters at the bottom left, the
English sentence leaves at the top right.

Click: the wire from the top encoder appears. Its output is handed to every one
of the six decoders, not only the first one. Section 05 shows what the decoder
does with it.

Click 2: the paper's six is a choice; other models use more or fewer layers.

Click 3: the same design six times, but each encoder learns its own weights.

Click 4: the input enters the bottom encoder; each encoder's output is the next
one's input.

Click 5: the top encoder's output goes to every decoder — point at the wire
again.

About two minutes.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Six encoders, six decoders"
---

# In words: Six encoders, six decoders

<div class="dl-describe">

- The left column is six encoders. The right column is six decoders.
- All six encoders have the same design, but each has its own learned weights.
  The same is true of the decoders.
- The input sentence enters the bottom encoder. Each encoder passes its result
  to the one above.
- The wire on the right of the encoders carries the top encoder's output to
  **every** decoder.
- The paper uses six of each. That number is a design choice; other models use
  more or fewer.

</div>

<!--
The point: two stacks of identical layers, and one wire from the top encoder to
every decoder. Twenty seconds; this slide is for revision.
-->

---
layout: default
core: true
title: Inside one encoder, inside one decoder
---

# Inside one encoder, inside one decoder

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 640 250" class="dl-diagram" role="img" aria-label="An encoder holds self-attention under a feed-forward network; a decoder holds self-attention, then encoder-decoder attention, then a feed-forward network">
  <defs>
    <marker id="tv2s0-inside" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="40" y="20" width="230" height="200" rx="8" />
  <text class="dl-dg-small" x="155" y="40" text-anchor="middle">ENCODER</text>
  <rect class="dl-dg-box is-accent" x="65" y="60" width="180" height="44" rx="5" />
  <text class="dl-dg-in" x="155" y="87" text-anchor="middle">Feed-forward</text>
  <rect class="dl-dg-box is-accent" x="65" y="150" width="180" height="44" rx="5" />
  <text class="dl-dg-in" x="155" y="177" text-anchor="middle">Self-attention</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s0-inside)" d="M155 150 V106" />
  <path class="dl-dg-arrow" marker-end="url(#tv2s0-inside)" d="M155 244 V196" />
  <path class="dl-dg-arrow" marker-end="url(#tv2s0-inside)" d="M155 60 V4" />
  <g v-click>
    <rect class="dl-dg-box" x="370" y="10" width="230" height="226" rx="8" />
    <text class="dl-dg-small" x="485" y="28" text-anchor="middle">DECODER</text>
    <rect class="dl-dg-box is-accent" x="395" y="40" width="180" height="40" rx="5" />
    <text class="dl-dg-in" x="485" y="65" text-anchor="middle">Feed-forward</text>
    <rect class="dl-dg-box is-accent" x="395" y="106" width="180" height="40" rx="5" />
    <text class="dl-dg-in" x="485" y="131" text-anchor="middle">Encoder–decoder attention</text>
    <rect class="dl-dg-box is-accent" x="395" y="172" width="180" height="40" rx="5" />
    <text class="dl-dg-in" x="485" y="197" text-anchor="middle">Self-attention</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-inside)" d="M485 172 V148" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-inside)" d="M485 106 V82" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-inside)" d="M485 244 V214" />
    <path class="dl-dg-loss" marker-end="url(#tv2s0-inside)" d="M272 126 H392" />
    <text class="dl-dg-small" x="320" y="114" text-anchor="middle">from the</text>
    <text class="dl-dg-small" x="320" y="144" text-anchor="middle">top encoder</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

Self-attention lets each word **look at the other words**. The feed-forward
network then works on **each word alone**.

</div>

<!--
The point: what is inside one layer of each stack. An encoder has two parts; a
decoder has three.

On screen, left: one encoder. Data enters at the bottom, passes through
self-attention, then through a feed-forward network (a small MLP), and leaves at
the top towards the next encoder.

Click: the decoder appears on the right. It has the same two parts, and one more
in the middle: encoder–decoder attention. The dashed arrow says where that
middle part reads from: the output of the top encoder. That is the wire from the
previous slide.

Click 2: the callout is the one sentence to remember. Self-attention is where
words look at each other. The feed-forward network looks at one word at a time.
Section 01 opens the self-attention box; section 04 opens the feed-forward one;
section 05 opens the decoder's middle box.

About two minutes.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Inside one encoder, inside one decoder"
---

# In words: Inside one encoder, inside one decoder

<div class="dl-describe">

- The left box is one encoder. Data enters at the bottom, passes through
  **self-attention**, then through a **feed-forward network**, and leaves at the top.
- The right box is one decoder. It has the same two parts, plus
  **encoder–decoder attention** between them.
- The dashed arrow shows where that middle part reads from: the output of the top
  encoder.
- Self-attention is the part where each word looks at the other words.
- The feed-forward network is a small MLP (multilayer perceptron). It works on
  each word on its own.

</div>

<!--
The point: two parts per encoder, three per decoder. Twenty seconds; this slide
is for revision.
-->

---
layout: default
core: true
title: "Refresher: a word becomes a vector"
---

# Refresher: a word becomes a vector

<div class="grid grid-cols-[1.3fr_1fr] gap-8 mt-1 items-center">
<div>

<svg viewBox="0 0 400 230" class="dl-diagram" role="img" aria-label="An embedding table with one row per vocabulary word; looking up a word returns its row, a vector of numbers">
  <defs>
    <marker id="tv2s0-emb" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="150" y="14" text-anchor="middle">embedding table (learned)</text>
  <g v-for="(w, r) in ['…', 'je', 'machines', 'suis', 'thinking', '…']" :key="r">
    <text class="dl-dg-small" x="70" :y="44 + r * 30" text-anchor="end">{{ w }}</text>
    <rect v-for="c in 4" :key="c" :class="r === 4 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="80 + (c - 1) * 34" :y="28 + r * 30" width="30" height="22" rx="2" />
  </g>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-emb)" d="M220 159 H262" />
    <rect v-for="(n, c) in [1, 0, 1, 0]" :key="`x${c}`" class="dl-dg-box is-accent" :x="270 + c * 30" y="146" width="26" height="26" rx="2" />
    <text v-for="(n, c) in [1, 0, 1, 0]" :key="`t${c}`" class="dl-dg-small" :x="283 + c * 30" y="164" text-anchor="middle">{{ n }}</text>
    <text class="dl-dg-lab is-sm" x="330" y="196" text-anchor="middle">x₁ for "Thinking"</text>
    <text class="dl-dg-small" x="330" y="214" text-anchor="middle">toy: 4 numbers · paper: 512</text>
  </g>
</svg>

</div>
<div>

<v-clicks>

- A network needs **numbers**, not words
- An **embedding table** has one row of numbers per word
- Looking up a word returns its row: a **vector**
- The rows are **learned** in training, like any weight

</v-clicks>

</div>
</div>

<!--
The point: a refresher on word embeddings, because everything in the deck works
on vectors, not words. This deck assumes the room knows what a vector, a matrix
product and a learned weight are; it does not assume they have used an embedding
before.

On screen: a table with one row per word in the vocabulary. Each row is a short
vector; here four numbers, in the paper 512. The row for "Thinking" is
highlighted.

Click: looking up "Thinking" returns its row: the vector x_1 = [1, 0, 1, 0].
This is the toy vector the whole of section 01 uses. Say that the four numbers
are made small and round on purpose so the arithmetic can be done by hand; a
trained embedding has messy real numbers.

Clicks 2 to 5: the four bullets. A network multiplies and adds, so words must
become numbers. The table is just a matrix with one row per word. Looking a word
up is reading a row (the same as multiplying a one-hot vector by the matrix).
The table is learned by gradient descent, like every other weight.

About two minutes.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Refresher: a word becomes a vector"
---

# In words: Refresher: a word becomes a vector

<div class="dl-describe">

- A network can only work with numbers, so each word first becomes a vector.
- The table on the left is the **embedding table**. It has one row per word in
  the vocabulary.
- Looking up a word returns its row. For *Thinking* the toy row is
  $\mathbf{x}_1 = [1, 0, 1, 0]$.
- The toy uses 4 numbers per word so the arithmetic fits on a slide. The paper
  uses 512.
- The table is a weight matrix. Its rows are learned during training, like any
  other weight.

</div>

<!--
The point: words become vectors by a learned table lookup. Twenty seconds; this
slide is for revision.
-->

---
layout: default
core: true
title: A list of vectors flows up the stack
---

# A list of vectors flows up the stack

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 640 250" class="dl-diagram" role="img" aria-label="Three word vectors enter an encoder; in self-attention the three paths are joined by lines; in the feed-forward network each path has its own copy of the same network">
  <defs>
    <marker id="tv2s0-flow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="(w, i) in ['je', 'suis', 'étudiant']" :key="w">
    <text class="dl-dg-small" :x="150 + i * 170" y="244" text-anchor="middle">{{ w }}</text>
    <rect v-for="c in 4" :key="c" class="dl-dg-box is-accent" :x="114 + i * 170 + (c - 1) * 18" y="208" width="16" height="16" rx="2" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-flow)" :d="`M${150 + i * 170} 206 V176`" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-flow)" :d="`M${150 + i * 170} 128 V96`" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s0-flow)" :d="`M${150 + i * 170} 52 V18`" />
  </g>
  <rect class="dl-dg-box" x="90" y="130" width="460" height="44" rx="6" />
  <text class="dl-dg-small" x="566" y="156">self-attention</text>
  <g v-click>
    <path class="dl-dg-line" d="M150 152 L320 152 L490 152" />
    <path class="dl-dg-line" d="M150 152 C 220 136, 420 136, 490 152" />
    <text class="dl-dg-small is-good" x="320" y="146" text-anchor="middle">paths depend on each other</text>
  </g>
  <g v-for="i in 3" :key="`f${i}`">
    <rect class="dl-dg-box" :x="100 + (i - 1) * 170" y="54" width="100" height="40" rx="5" />
    <text class="dl-dg-small" :x="150 + (i - 1) * 170" y="78" text-anchor="middle">feed-forward</text>
  </g>
  <g v-click>
    <text class="dl-dg-small is-good" x="320" y="112" text-anchor="middle">same network, each word alone — run all three at once</text>
  </g>
</svg>
</div>

<div v-click class="dl-callout">

Each word keeps its **own path** through the encoder. Only self-attention connects the paths.

</div>

<!--
The point: what actually travels through the stack. Not a sentence and not one
vector, but a list of vectors, one per word, each of the same size (512 in the
paper, 4 in the toy).

On screen: three words of the input sentence, each turned into a vector at the
bottom (the embedding refresher). Each vector has its own vertical path. The
list's length is the number of words; the model is built for some maximum
length, a setting chosen by hand (for example the longest sentence in the
training data).

Click: inside self-attention the paths are joined. Each word's new vector depends
on the other words' vectors. This is the only place where words exchange
information.

Click 2: inside the feed-forward network, each word goes through the same small
network on its own. There are no dependencies between the three copies, so they
can run in parallel. That parallelism is one reason transformers train fast on
GPUs (graphics processing units).

Click 3: the callout.

Only the bottom encoder embeds the words. Every encoder above it receives the
list of vectors from the encoder below.

About three minutes.

Class cut: about 3 minutes.
-->

---
layout: default
title: "In words: A list of vectors flows up the stack"
---

# In words: A list of vectors flows up the stack

<div class="dl-describe">

- Each word of *je suis étudiant* becomes a vector at the bottom. The three
  vectors climb on three separate paths.
- The wide box is **self-attention**. The lines inside it join the paths: each
  word's new vector depends on the other words.
- The three small boxes are copies of one **feed-forward network**. Each word
  goes through it alone, so all three can be computed at the same time.
- Only the bottom encoder looks words up in the embedding table. Higher encoders
  receive the list of vectors from the encoder below.
- To remember: one vector per word, and only self-attention mixes them.

</div>

<!--
The point: a list of vectors, one path per word; self-attention mixes, the
feed-forward network does not. Twenty seconds; this slide is for revision.
-->

---
layout: section
index: "01"
---

# Self-attention

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="qkv" :size="190" /></div>

<!--
Section 01, about forty minutes. This is the lecture.

The glyph: one query dot on the left, three keys on the right, and lines as
thick as the attention weights. The thick line is the word that matters most to
the asking word.

What this section has to land, in order: why a word needs to look at other words
(the "it" sentence); the three vectors every word makes (query, key, value); and
the six steps that turn them into one output vector, done by hand on "Thinking
Machines". By the end the room can compute z_1 = [1.79, 0.21] on paper.
-->

---
layout: interactive
core: true
heading: What does "it" refer to?
title: What does "it" refer to?
aside-width: 16rem
---

<ItAttention :head="0" :switchable="false" />

::aside::

*The animal didn't cross the street because **it** was too tired.*

To understand **it**, the model must find **animal**.

<div v-click class="mt-3 dl-callout">

**Self-attention**: every word reads every word, and takes most from the ones
that matter to it.

</div>

<!--
The point: why a word needs the other words. Alammar's example sentence: "The
animal didn't cross the street because it was too tired." A person knows
immediately that "it" is the animal, not the street. A model that handles each
word alone cannot know that.

On screen: the sentence twice. The asking word on the right is "it", in accent
colour. From it, one line goes to every word on the left, and each line is as
thick as the attention weight. The thickest line goes to "animal" (0.55).

Say clearly that these weights are drawn by hand to show the idea, not taken
from a trained model. In a trained model the picture for "it" looks much like
this; Alammar shows one from a real model in his post.

Use the arrow buttons (or click a word on the right) to move the asking word.
Every word asks the same question of the whole sentence; "it" is just the one
where the answer is easy to see.

Click: the callout names the mechanism. Self-attention: every word looks at every
word in the sentence, and builds its new vector mostly from the words that
matter to it. When "it" leaves this layer, its vector carries some of "animal".

About four minutes.

Class cut: about 4 minutes.
-->

---
layout: default
title: 'In words: What does "it" refer to?'
---

# In words: What does "it" refer to?

<div class="dl-describe">

- The sentence is *The animal didn't cross the street because it was too
  tired.* To understand *it*, a reader must know it means *the animal*.
- In the picture, the asking word *it* is on the right. A line goes to every
  word on the left.
- Each line is as thick as the **attention weight**: how much *it* takes from that
  word. The thickest line goes to *animal* (0.55).
- These weights are drawn by hand to show the idea.
- **Self-attention** means every word looks at every word, and builds its new
  vector mostly from the words that matter to it.

</div>

<!--
The point: a word needs context from other words, and self-attention gives it.
Twenty seconds; this slide is for revision.
-->

---
layout: default
core: true
title: "Step 1: three vectors for every word"
---

# Step 1: three vectors for every word

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 216" class="dl-diagram" role="img" aria-label="The embedding x1 = [1,0,1,0] times three learned matrices gives the query q1 = [1,1], the key k1 = [2,2] and the value v1 = [2,0]">
  <text class="dl-dg-small" x="10" y="14">"Thinking"</text>
  <rect v-for="(n, c) in [1, 0, 1, 0]" :key="`x${c}`" class="dl-dg-box" :x="10 + c * 28" y="86" width="24" height="24" rx="2" />
  <text v-for="(n, c) in [1, 0, 1, 0]" :key="`xt${c}`" class="dl-dg-small" :x="22 + c * 28" y="102" text-anchor="middle">{{ n }}</text>
  <text class="dl-dg-lab is-sm" x="62" y="132" text-anchor="middle">x₁</text>
  <g v-for="(m, r) in [{ n: 'W_Q', w: [[1,0],[0,1],[0,1],[0,0]], out: [1, 1], o: 'q₁', role: 'query: what I look for' }, { n: 'W_K', w: [[1,1],[1,0],[1,1],[0,0]], out: [2, 2], o: 'k₁', role: 'key: what I offer to match' }, { n: 'W_V', w: [[2,0],[0,2],[0,0],[0,0]], out: [2, 0], o: 'v₁', role: 'value: what I hand over' }]" :key="m.n" v-click>
    <text class="dl-dg-small" x="140" :y="30 + r * 66">× {{ m.n }}</text>
    <g v-for="(row, i) in m.w" :key="i">
      <text v-for="(n, j) in row" :key="j" class="dl-dg-small" :x="196 + j * 18" :y="18 + r * 66 + i * 13" text-anchor="middle">{{ n }}</text>
    </g>
    <rect class="dl-dg-box" x="184" :y="6 + r * 66" width="42" height="54" rx="2" style="fill: none" />
    <text class="dl-dg-small" x="248" :y="36 + r * 66" text-anchor="middle">=</text>
    <rect v-for="(n, c) in m.out" :key="`o${c}`" class="dl-dg-box is-accent" :x="268 + c * 28" :y="20 + r * 66" width="24" height="24" rx="2" />
    <text v-for="(n, c) in m.out" :key="`ot${c}`" class="dl-dg-small" :x="280 + c * 28" :y="36 + r * 66" text-anchor="middle">{{ n }}</text>
    <text class="dl-dg-lab is-sm" x="334" :y="37 + r * 66">{{ m.o }}</text>
    <text class="dl-dg-small" x="370" :y="37 + r * 66">{{ m.role }}</text>
  </g>
</svg>
</div>

<div v-click class="dl-callout">

Three **learned** matrices, $W_Q$, $W_K$ and $W_V$, shared by every word. Each
turns 4 numbers into 2 (paper: 512 into 64).

</div>

<!--
The point: self-attention starts by giving every word three new vectors: a
query, a key and a value. Each is the word's embedding times a learned matrix.

On screen: the toy embedding of "Thinking", x_1 = [1, 0, 1, 0], on the left.
Each click adds one row: x_1 times a 4 x 2 matrix gives a vector of two numbers.

Click: x_1 times W_Q gives the query q_1 = [1, 1]. Row-times-matrix: x_1 has ones
in positions 1 and 3, so q_1 is row 1 of W_Q plus row 3: [1, 0] + [0, 1] =
[1, 1]. The query is what this word is looking for.

Click 2: x_1 times W_K gives the key k_1 = [1, 1] + [1, 1] = [2, 2]. The key is
what this word offers, so that other words' queries can match it.

Click 3: x_1 times W_V gives the value v_1 = [2, 0] + [0, 0] = [2, 0]. The value
is what this word hands over once it has been chosen.

Click 4: the callout. The three matrices are learned in training and are shared
by every word in the sentence. They shrink the vector: 4 to 2 in the toy, 512 to
64 in the paper. Section 02 says why the paper shrinks it (eight heads of 64
cost the same as one of 512).

The names come from looking things up in a library: you search with a query, the
catalogue matches it against keys, and you take home the value. Alammar calls
them "abstractions that are useful for calculating attention"; the next slides
show why each one is needed.

Machines gets its own three vectors the same way: x_2 = [0, 1, 0, 1] gives
q_2 = [0, 1], k_2 = [1, 0], v_2 = [0, 2]. They are on the next slides.

About five minutes.

Class cut: about 5 minutes.
-->

---
layout: default
title: "In words: Step 1: three vectors for every word"
---

# In words: Step 1: three vectors for every word

<div class="dl-describe">

- Every word makes three new vectors from its embedding $\mathbf{x}$.
- On the left is *Thinking*'s toy embedding, $\mathbf{x}_1 = [1, 0, 1, 0]$. Each row
  multiplies it by one learned matrix.
- $\mathbf{x}_1 W_Q = \mathbf{q}_1 = [1, 1]$, the **query**: what this word is looking for.
- $\mathbf{x}_1 W_K = \mathbf{k}_1 = [2, 2]$, the **key**: what it offers to be matched.
- $\mathbf{x}_1 W_V = \mathbf{v}_1 = [2, 0]$, the **value**: what it hands over.
- *Machines*, $\mathbf{x}_2 = [0, 1, 0, 1]$, gives $\mathbf{q}_2 = [0, 1]$,
  $\mathbf{k}_2 = [1, 0]$, $\mathbf{v}_2 = [0, 2]$.
- The same three matrices serve every word. They map 4 numbers to 2 (paper: 512 to 64).

</div>

<!--
The point: query, key and value are three learned projections of the same
embedding. Thirty seconds; this slide is for revision.
-->

---
layout: default
core: true
title: "Step 2: score every word"
---

# Step 2: score every word

<div class="grid grid-cols-[1.3fr_1fr] gap-8 mt-2 items-center">
<div>

<svg viewBox="0 0 380 200" class="dl-diagram" role="img" aria-label="Thinking's query [1,1] dotted with Thinking's key [2,2] gives 4; with Machines' key [1,0] gives 1">
  <text class="dl-dg-small" x="10" y="16">asking: "Thinking"</text>
  <rect class="dl-dg-box is-accent" x="10" y="80" width="70" height="36" rx="4" />
  <text class="dl-dg-in" x="45" y="103" text-anchor="middle">q₁ [1, 1]</text>
  <g v-click>
    <path class="dl-dg-line" d="M82 92 L180 52" />
    <rect class="dl-dg-box" x="182" y="34" width="86" height="36" rx="4" />
    <text class="dl-dg-small" x="225" y="56" text-anchor="middle">k₁ [2, 2]</text>
    <text class="dl-dg-lab is-sm" x="290" y="46">1·2 + 1·2</text>
    <text class="dl-dg-lab" x="290" y="68">= 4</text>
  </g>
  <g v-click>
    <path class="dl-dg-line is-muted" d="M82 104 L180 146" />
    <rect class="dl-dg-box" x="182" y="128" width="86" height="36" rx="4" />
    <text class="dl-dg-small" x="225" y="150" text-anchor="middle">k₂ [1, 0]</text>
    <text class="dl-dg-lab is-sm" x="290" y="140">1·1 + 1·0</text>
    <text class="dl-dg-lab" x="290" y="162">= 1</text>
  </g>
  <text class="dl-dg-small" x="225" y="192" text-anchor="middle">keys of Thinking and Machines</text>
</svg>

</div>
<div>

<v-clicks>

- **Score** = the asking word's query **dot** each word's key
- Large score: the two vectors **point the same way**
- The word also scores **itself**

</v-clicks>

</div>
</div>

<div v-click class="mt-2 dl-callout">

*Thinking* scores 4 with itself and 1 with *Machines*.

</div>

<!--
The point: a score says how well one word's query matches another word's key.
The score is a dot product: multiply the two vectors element by element and add.

On screen: the asking word is "Thinking"; its query q_1 = [1, 1] is on the left.
Two keys on the right: its own, k_1 = [2, 2], and Machines', k_2 = [1, 0].

Click: q_1 · k_1 = 1 x 2 + 1 x 2 = 4.

Click 2: q_1 · k_2 = 1 x 1 + 1 x 0 = 1.

Clicks 3 to 5: the bullets. The score is a dot product. A large dot product means
the two vectors point in a similar direction, which is what "matches" means
here. And the asking word scores itself too: there is nothing special about its
own position.

Click 6: the callout: scores 4 and 1. Thinking's query matches its own key more
than Machines' key.

Alammar's version uses the paper's sizes: the scores for Thinking are 112 and 96.
The next slide shows what happens to those.

About three minutes.

Class cut: about 3 minutes.
-->

---
layout: default
title: "In words: Step 2: score every word"
---

# In words: Step 2: score every word

<div class="dl-describe">

- The asking word is *Thinking*. Its query is $\mathbf{q}_1 = [1, 1]$.
- The **score** of a word is the asking word's query dotted with that word's key:
  multiply element by element, then add.
- With its own key, $\mathbf{k}_1 = [2, 2]$: $1 \cdot 2 + 1 \cdot 2 = 4$.
- With *Machines*' key, $\mathbf{k}_2 = [1, 0]$: $1 \cdot 1 + 1 \cdot 0 = 1$.
- A large score means the query and the key point the same way: a good match.
- The asking word always scores itself as well.

</div>

<!--
The point: scores are query-key dot products, 4 and 1 for Thinking. Twenty
seconds; this slide is for revision.
-->

---
layout: default
core: true
title: "Steps 3 and 4: scale, then softmax"
---

# Steps 3 and 4: scale, then softmax

<div class="grid grid-cols-[1.2fr_1fr] gap-8 mt-1 items-center">
<div>

<svg viewBox="0 0 380 210" class="dl-diagram" role="img" aria-label="Scores 4 and 1 divided by root 2 give 2.83 and 0.71; softmax turns them into weights 0.89 and 0.11">
  <text class="dl-dg-small" x="120" y="16" text-anchor="middle">Thinking</text>
  <text class="dl-dg-small" x="250" y="16" text-anchor="middle">Machines</text>
  <text class="dl-dg-small" x="10" y="44">score</text>
  <text class="dl-dg-lab is-sm" x="120" y="44" text-anchor="middle">4</text>
  <text class="dl-dg-lab is-sm" x="250" y="44" text-anchor="middle">1</text>
  <g v-click>
    <text class="dl-dg-small" x="10" y="78">÷ √2</text>
    <text class="dl-dg-lab is-sm" x="120" y="78" text-anchor="middle">2.83</text>
    <text class="dl-dg-lab is-sm" x="250" y="78" text-anchor="middle">0.71</text>
  </g>
  <g v-click>
    <text class="dl-dg-small" x="10" y="150">softmax</text>
    <line class="dl-dg-split" x1="80" y1="190" x2="300" y2="190" />
    <rect class="dl-dg-bar is-q" x="95" :y="190 - 0.89 * 100" width="50" :height="0.89 * 100" />
    <rect class="dl-dg-bar" x="225" :y="190 - 0.11 * 100" width="50" :height="0.11 * 100" />
    <text class="dl-dg-lab is-sm" x="120" :y="184 - 0.89 * 100" text-anchor="middle">0.89</text>
    <text class="dl-dg-lab is-sm" x="250" :y="184 - 0.11 * 100" text-anchor="middle">0.11</text>
    <text class="dl-dg-small" x="190" y="206" text-anchor="middle">positive, add up to 1</text>
  </g>
</svg>

</div>
<div>

<v-clicks>

- **Scale**: divide by $\sqrt{d_k}$, the root of the key length
- **Softmax**: positive weights that add up to 1
- Paper: $d_k = 64$, divide by **8**. Scores 112, 96 → 14, 12 → 0.88, 0.12

</v-clicks>

</div>
</div>

<div v-click class="mt-1 dl-callout">

Unscaled, long keys give huge scores. The softmax then saturates and its gradients vanish.

</div>

<!--
The point: two small steps turn the raw scores into attention weights: divide by
the square root of the key length, then apply a softmax.

On screen: Thinking's two scores, 4 and 1, at the top.

Click: divide by the square root of d_k. In the toy d_k = 2, so sqrt(2) = 1.41:
4 / 1.41 = 2.83 and 1 / 1.41 = 0.71.

Click 2: the softmax. e^2.83 = 16.95 and e^0.71 = 2.03. They add to 18.98. So the
weights are 16.95 / 18.98 = 0.89 and 2.03 / 18.98 = 0.11. Two bars: Thinking
gives 0.89 of its attention to itself and 0.11 to Machines.

Click 3 to 5: the bullets. d_k is the length of the key vectors. The softmax is
the same function used at the end of a classifier: all outputs positive, adding
to 1. With the paper's sizes, d_k = 64 and sqrt(64) = 8: Alammar's raw scores 112
and 96 become 14 and 12, and the softmax gives 0.88 and 0.12.

Click 6: why divide at all. A dot product adds d_k products, so it grows with the
key length. Big scores push the softmax towards one weight near 1 and the rest
near 0. In that region the softmax is flat, so its gradients are almost zero and
the layer stops learning where to look. The paper says the division gives more
stable gradients.

The equation with every symbol named is on the next slide, "Reading the
equation: one attention weight".

About five minutes.

Class cut: about 5 minutes.
-->

---
layout: default
title: "Reading the equation: one attention weight"
---

# Reading the equation: one attention weight

<div class="grid grid-cols-[1.6fr_1fr] gap-5 items-start">
<div>

<div class="dl-math-xs">

$$
\alpha_{ij} = \frac{\exp(s_{ij})}{\sum_{m=1}^{T} \exp(s_{im})},
\qquad s_{ij} = \frac{\mathbf{q}_i \cdot \mathbf{k}_j}{\sqrt{d_k}}
$$

</div>

<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $i$, $j$, $T$ | word indices, length | $i$ asks, $j$ is read, $T$ words | 1, 2, 2 |
| $\mathbf{q}_i$, $\mathbf{k}_j$ | query, key | learned, length $d_k$ | $[1, 1]$, $[1, 0]$ |
| $d_k$ | key length | set by hand | 2 (paper 64) |
| $s_{ij}$ | scaled score | dot product $\div \sqrt{d_k}$ | 0.71 |
| $\exp$, $\sum_m$ | exp, sum over $m$ | the softmax | |
| $\alpha_{ij}$ | attention weight | share of $j$ in $i$'s output | 0.11 |

</v-clicks>

</div>

</div>
<div>

How much word $i$ takes from word $j$.

<svg viewBox="0 0 260 120" class="dl-diagram" role="img" aria-label="Thinking's row, i = 1: scaled scores 2.83 and 0.71, exponentials 16.95 and 2.03, weights 0.89 and 0.11">
  <text class="dl-dg-small" x="110" y="14" text-anchor="middle">j = 1</text>
  <text class="dl-dg-small" x="200" y="14" text-anchor="middle">j = 2</text>
  <g v-for="(row, r) in [['s', '2.83', '0.71'], ['exp(s)', '16.95', '2.03'], ['α', '0.89', '0.11']]" :key="r">
    <text class="dl-dg-small" x="50" :y="42 + r * 34" text-anchor="end">{{ row[0] }}</text>
    <rect :class="r === 2 ? 'dl-dg-box is-accent' : 'dl-dg-box'" x="70" :y="24 + r * 34" width="80" height="28" rx="3" />
    <rect :class="r === 2 ? 'dl-dg-box is-accent' : 'dl-dg-box'" x="160" :y="24 + r * 34" width="80" height="28" rx="3" />
    <text class="dl-dg-lab is-sm" x="110" :y="43 + r * 34" text-anchor="middle">{{ row[1] }}</text>
    <text class="dl-dg-lab is-sm" x="200" :y="43 + r * 34" text-anchor="middle">{{ row[2] }}</text>
  </g>
</svg>

<div v-click class="dl-callout">

$s_{12} = (1 \cdot 1 + 1 \cdot 0) / \sqrt{2} = 0.71$

$\alpha_{12} = 2.03 / (16.95 + 2.03) = 0.11$

</div>

</div>
</div>

<!--
This slide names every symbol of the scale-and-softmax step, with Thinking's row
as the example. Nothing new in the numbers.

Read the equation aloud: "alpha i j, the weight word i gives word j, is e to the
scaled score s i j, divided by the sum of e to the scaled score over every word
m in the sentence. And s i j is the dot product of q i and k j, divided by the
square root of d k."

Clicks 1 to 7: one legend row per click. Stress which parts are learned: the
queries and keys come from the learned matrices W_Q and W_K. d_k is chosen by
hand. The exponential, the sum and the square root are fixed operations with
nothing to learn. The index m runs over every word, so the bottom of the
fraction is the same for the whole row; that is why a row of weights adds up to
1.

Click 8: the worked example. Thinking is word 1, Machines is word 2.
s_12 = (1 x 1 + 1 x 0) / 1.41 = 0.71. e^0.71 = 2.03 and e^2.83 = 16.95, so
alpha_12 = 2.03 / 18.98 = 0.11, and alpha_11 = 0.89.

In the paper the same formula is written for all words at once as
softmax(Q K^T / sqrt(d_k)); section 02 shows that form.
-->

---
layout: default
title: "In words: Steps 3 and 4: scale, then softmax"
---

# In words: Steps 3 and 4: scale, then softmax

<div class="dl-describe">

- **Scale:** divide each score by $\sqrt{d_k}$, the square root of the key length.
  Here $d_k = 2$: the scores 4 and 1 become 2.83 and 0.71.
- **Softmax:** $\alpha_{1j} = \exp(s_{1j}) / \sum_m \exp(s_{1m})$. This gives
  $16.95 / 18.98 = 0.89$ and $2.03 / 18.98 = 0.11$. The weights are positive and
  add up to 1.
- So *Thinking* takes 0.89 from itself and 0.11 from *Machines*.
- In the paper, $d_k = 64$, so the divisor is 8. Scores 112 and 96 become 14 and
  12, then 0.88 and 0.12.
- Why scale: long keys give large scores. The softmax then puts nearly all
  weight on one word, and its gradients become almost zero.

</div>

<!--
The point: covers both "Steps 3 and 4" and its "Reading the equation" slide.
Thirty seconds; this slide is for revision.
-->

---
layout: default
core: true
title: "Steps 5 and 6: weigh the values, then add"
---

# Steps 5 and 6: weigh the values, then add

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 640 200" class="dl-diagram" role="img" aria-label="0.89 times v1 = [2,0] gives [1.79, 0]; 0.11 times v2 = [0,2] gives [0, 0.21]; their sum is z1 = [1.79, 0.21]">
  <defs>
    <marker id="tv2s1-sum" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="10" y="44">Thinking</text>
  <text class="dl-dg-small" x="10" y="134">Machines</text>
  <rect class="dl-dg-box" x="90" y="24" width="90" height="32" rx="4" />
  <text class="dl-dg-small" x="135" y="45" text-anchor="middle">v₁ [2, 0]</text>
  <rect class="dl-dg-box" x="90" y="114" width="90" height="32" rx="4" />
  <text class="dl-dg-small" x="135" y="135" text-anchor="middle">v₂ [0, 2]</text>
  <g v-click>
    <text class="dl-dg-lab is-sm" x="214" y="45" text-anchor="middle">× 0.893</text>
    <text class="dl-dg-lab is-sm" x="214" y="135" text-anchor="middle">× 0.107</text>
    <rect class="dl-dg-box is-accent" x="250" y="20" width="110" height="40" rx="4" />
    <text class="dl-dg-in" x="305" y="45" text-anchor="middle">[1.79, 0]</text>
    <rect class="dl-dg-box" x="250" y="110" width="110" height="40" rx="4" />
    <text class="dl-dg-small" x="305" y="135" text-anchor="middle">[0, 0.21]</text>
    <text class="dl-dg-small" x="305" y="176" text-anchor="middle">nearly gone</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#tv2s1-sum)" d="M362 40 L440 78" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s1-sum)" d="M362 130 L440 94" />
    <circle class="dl-dg-op" cx="458" cy="86" r="16" />
    <text class="dl-dg-lab is-sm" x="458" y="91" text-anchor="middle">+</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s1-sum)" d="M474 86 H500" />
    <rect class="dl-dg-box is-accent" x="504" y="64" width="126" height="44" rx="4" />
    <text class="dl-dg-in" x="567" y="91" text-anchor="middle">z₁ [1.79, 0.21]</text>
    <text class="dl-dg-small" x="567" y="128" text-anchor="middle">Thinking's output</text>
  </g>
</svg>
</div>

<v-clicks>

- **Weigh**: each value times its weight. Words with tiny weights almost vanish
- **Add**: the sum is the asking word's output, $\mathbf{z}_1$

</v-clicks>

<!--
The point: the last two steps. The weights decide how much of each word's value
goes into the asking word's output.

On screen: the two values, v_1 = [2, 0] for Thinking and v_2 = [0, 2] for
Machines.

Click: weigh. 0.893 x [2, 0] = [1.79, 0], and 0.107 x [0, 2] = [0, 0.21]. The
weights 0.89 and 0.11 were rounded; with the rounded 0.89 the room gets 1.78, so
use three decimals here. Alammar's
intuition: keep the values of the words we want to focus on, and drown out the
others by multiplying them by tiny numbers like 0.001.

Click 2: add. [1.79, 0] + [0, 0.21] = [1.79, 0.21]. That is z_1, the output of
self-attention for Thinking. It is mostly Thinking's own value, with a little
of Machines mixed in.

Clicks 3 and 4: the two bullets, the names of steps 5 and 6.

Then ask the room to do Machines themselves: q_2 = [0, 1]; scores 2 and 0;
scaled 1.41 and 0; softmax 0.80 and 0.20; z_2 = 0.804 x [2, 0] + 0.196 x [0, 2] =
[1.61, 0.39]. The widget on the next slide checks their answer.

About four minutes.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: Steps 5 and 6: weigh the values, then add"
---

# In words: Steps 5 and 6: weigh the values, then add

<div class="dl-describe">

- The left boxes are the two values: $\mathbf{v}_1 = [2, 0]$ for *Thinking* and
  $\mathbf{v}_2 = [0, 2]$ for *Machines*.
- **Step 5, weigh:** multiply each value by its attention weight.
  $0.893 \times [2, 0] = [1.79, 0]$ and $0.107 \times [0, 2] = [0, 0.21]$
  (the weights 0.89 and 0.11, to three decimals).
- A word with a small weight almost disappears from the result.
- **Step 6, add:** the weighted values are added up.
  $\mathbf{z}_1 = [1.79, 0.21]$ is the self-attention output for *Thinking*.
- The output is a blend of every word's value, mixed in the proportions the
  softmax chose.

</div>

<!--
The point: the output is a weighted sum of values; z_1 = [1.79, 0.21]. Twenty
seconds; this slide is for revision.
-->

---
layout: interactive
core: true
heading: All six steps, for either word
title: All six steps, for either word
aside-width: 16rem
clicks: 6
---

<SelfAttentionSteps :step="$clicks" />

::aside::

Each click adds one step.

**Then** press *Machines* and compute its output yourself first.

<div class="dl-secondary mt-3">

Check: *Machines* gives 0.80 to *Thinking*, and its output is [1.61, 0.39].

</div>

<!--
The point: the six steps in one picture, for either word. This is the slide to
leave up while the room works.

On screen: one column per word. The embeddings x are at the top. Each click adds
one row, numbered as Alammar numbers the steps.

Click: step 1, the query, key and value of both words. The asking word's query
is in accent colour.

Click 2: step 2, the scores 4 and 1.

Click 3: step 3, divided by sqrt(2): 2.83 and 0.71.

Click 4: step 4, softmax: 0.89 and 0.11, with bars.

Click 5: step 5, the weighted values [1.79, 0] and [0, 0.21].

Click 6: step 6, the sum: z_1 = [1.79, 0.21].

Then press Machines in the widget. Ask the room to compute its output on paper
before you show it: scores 2 and 0, scaled 1.41 and 0, softmax 0.80 and 0.20,
output [1.61, 0.39]. The Next step button walks it again.

What the room gets wrong: they expect the asking word to take the largest
weight from itself. Machines does not: it gives 0.80 to Thinking. The poll on
the next slide is about exactly this.

About five minutes, more if the room computes Machines.

Class cut: about 5 minutes.
-->

---
layout: default
title: "In words: All six steps, for either word"
---

# In words: All six steps, for either word

<div class="dl-describe">

The table has one column per word and one row per step.

1. Make the query, key and value of every word.
2. Score: the asking word's query dotted with every key.
3. Divide every score by $\sqrt{d_k} = \sqrt{2}$.
4. Softmax: turn the scores into weights that add up to 1.
5. Multiply each value by its weight.
6. Add them up: the output $\mathbf{z}$ for the asking word.

For *Thinking*: weights 0.89 and 0.11, output $[1.79, 0.21]$. For *Machines*:
scores 2 and 0, weights 0.80 on *Thinking* and 0.20 on itself, output
$[1.61, 0.39]$.

</div>

<!--
The point: the six steps as one list, with both words' results. Thirty seconds;
this slide is for revision.
-->

---
layout: default
core: true
title: "Poll: does a word attend most to itself?"
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="In self-attention, does every word give its largest weight to itself?"
  :items="[
    'Yes, always',
    'Yes, but only after dividing by √d_k',
    'No: it depends on the learned matrices',
    'No: a word never attends to itself',
  ]"
/>

</div>
<div class="mt-12">

<svg viewBox="0 0 240 150" class="dl-diagram" role="img" aria-label="Machines asks: one line to Thinking, one line back to itself, weights hidden">
  <rect class="dl-dg-box" x="10" y="20" width="96" height="30" rx="4" />
  <text class="dl-dg-small" x="58" y="40" text-anchor="middle">Thinking</text>
  <rect class="dl-dg-box is-accent" x="10" y="100" width="96" height="30" rx="4" />
  <text class="dl-dg-small" x="58" y="120" text-anchor="middle">Machines</text>
  <path class="dl-dg-line" d="M106 115 C 170 115, 170 35, 106 35" />
  <path class="dl-dg-line is-muted" d="M106 122 C 150 140, 150 100, 106 108" />
  <text class="dl-dg-small" x="168" y="80">?</text>
  <text class="dl-dg-small" x="150" y="146">?</text>
</svg>

</div>
</div>

<div v-click class="mt-3 dl-reveal">

No: it depends on the learned matrices

</div>

<div v-click class="mt-2 dl-secondary">

*Machines* gives 0.80 to *Thinking* and only 0.20 to itself.

</div>

<!--
The point: a word's own position is not special. Whether it attends to itself
depends only on how its query matches each key, and those come from learned
matrices.

On screen beside the question: Machines asking, with one line to Thinking and
one back to itself, and the weights hidden.

Hands up for each option before revealing.

Click: the answer, option 3.

Click 2: the evidence from the toy. Machines' query q_2 = [0, 1] scores 2 with
Thinking's key [2, 2] and 0 with its own key [1, 0]. After scaling and softmax:
0.80 on Thinking, 0.20 on itself.

Why each wrong answer is tempting. Option 1 (its query should match its own key best): Alammar writes that the word at the
current position "obviously" often has the highest softmax score. Often, in a
trained model; not always, and nothing in the mechanism forces it. Option 2: the
division by sqrt(d_k) shrinks every score by the same factor, so it cannot change
which one is largest. Option 4: the asking word is scored like every other
word, including itself; the decoder's mask (section 05) hides future words, never
the word itself.

About four minutes.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: Poll: does a word attend most to itself?"
---

# In words: Poll: does a word attend most to itself?

<div class="dl-describe">

- The answer is **no**. A word's weights depend only on how its query matches
  each key.
- Queries and keys come from the learned matrices $W_Q$ and $W_K$. Nothing in the
  mechanism makes a word's own key special.
- In the toy, *Machines* has query $[0, 1]$. It scores 2 with *Thinking*'s key
  and 0 with its own.
- After scaling and the softmax it gives 0.80 to *Thinking* and 0.20 to itself.
- Dividing by $\sqrt{d_k}$ shrinks every score by the same factor. So it never
  changes which word gets the largest weight.

</div>

<!--
The point: self-attention has no built-in preference for the word itself.
Thirty seconds; this slide is for revision.
-->

---
layout: section
index: "02"
---

# Matrices and many heads

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="heads" :size="190" /></div>

<!--
Section 02, about twelve minutes in class. Do not linger on the divider.

The glyph: four small fans side by side, each pointing at a different word.
That is multi-head attention — several attention layers side by side, each
free to look somewhere else.

What this section has to land, in order: the six steps from section 01 are
really three matrix products and one softmax, so every word is done at once;
that whole layer fits in one line, and the room has already checked its first
row by hand; and the real layer runs eight of these side by side and glues the
results back together.
-->

---
layout: default
core: true
title: "Every word at once: matrices"
---

# Every word at once: matrices

Stack the word vectors as the rows of one matrix $X$. One product per matrix
gives every query, key and value at once.

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 210" class="dl-diagram" role="img" aria-label="X, two rows of four numbers, times W_Q, four rows of two, gives Q, two rows of two. The same X times W_K and W_V gives K and V">
  <text class="dl-dg-small" x="84" y="62" text-anchor="end">Thinking</text>
  <text class="dl-dg-small" x="84" y="88" text-anchor="end">Machines</text>
  <g v-for="(row, r) in [[1, 0, 1, 0], [0, 1, 0, 1]]" :key="'x' + r">
    <g v-for="(v, c) in row" :key="c">
      <rect class="dl-dg-box" :x="90 + c * 30" :y="44 + r * 26" width="30" height="26" />
      <text class="dl-dg-lab is-sm" :x="105 + c * 30" :y="62 + r * 26" text-anchor="middle">{{ v }}</text>
    </g>
  </g>
  <text class="dl-dg-small" x="150" y="118" text-anchor="middle">X (2 × 4)</text>
  <text class="dl-dg-lab" x="226" y="76" text-anchor="middle">×</text>
  <g v-for="(row, r) in [[1, 0], [0, 1], [0, 1], [0, 0]]" :key="'w' + r">
    <g v-for="(v, c) in row" :key="c">
      <rect class="dl-dg-box" :x="244 + c * 30" :y="26 + r * 22" width="30" height="22" />
      <text class="dl-dg-lab is-sm" :x="259 + c * 30" :y="42 + r * 22" text-anchor="middle">{{ v }}</text>
    </g>
  </g>
  <text class="dl-dg-small" x="274" y="130" text-anchor="middle">W_Q (4 × 2)</text>
  <text class="dl-dg-lab" x="324" y="76" text-anchor="middle">=</text>
  <g v-for="(row, r) in [[1, 1], [0, 1]]" :key="'q' + r">
    <g v-for="(v, c) in row" :key="c">
      <rect class="dl-dg-box is-accent" :x="344 + c * 30" :y="44 + r * 26" width="30" height="26" />
      <text class="dl-dg-lab is-sm" :x="359 + c * 30" :y="62 + r * 26" text-anchor="middle">{{ v }}</text>
    </g>
  </g>
  <text class="dl-dg-small" x="374" y="118" text-anchor="middle">Q (2 × 2)</text>
  <g v-click>
    <g v-for="(row, r) in [[2, 2], [1, 0]]" :key="'k' + r">
      <g v-for="(v, c) in row" :key="c">
        <rect class="dl-dg-box is-accent" :x="450 + c * 30" :y="44 + r * 26" width="30" height="26" />
        <text class="dl-dg-lab is-sm" :x="465 + c * 30" :y="62 + r * 26" text-anchor="middle">{{ v }}</text>
      </g>
    </g>
    <text class="dl-dg-small" x="480" y="118" text-anchor="middle">K = X W_K</text>
    <g v-for="(row, r) in [[2, 0], [0, 2]]" :key="'v' + r">
      <g v-for="(v, c) in row" :key="c">
        <rect class="dl-dg-box is-accent" :x="560 + c * 30" :y="44 + r * 26" width="30" height="26" />
        <text class="dl-dg-lab is-sm" :x="575 + c * 30" :y="62 + r * 26" text-anchor="middle">{{ v }}</text>
      </g>
    </g>
    <text class="dl-dg-small" x="590" y="118" text-anchor="middle">V = X W_V</text>
  </g>
  <g v-click>
    <line class="dl-dg-split" x1="10" y1="150" x2="650" y2="150" />
    <text class="dl-dg-small" x="330" y="174" text-anchor="middle">row 1 of Q, K and V belongs to Thinking, row 2 to Machines</text>
    <text class="dl-dg-small is-good" x="330" y="196" text-anchor="middle">the same three weight matrices serve every word</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

Three matrix products replace step 1 for **every word at once**. A computer does
this fast, in parallel.

</div>

<!--
The point: step 1 of the six steps (make a query, a key and a value) was done
word by word. Written with matrices, it is one product per weight matrix, and
it covers every word in the sentence at once.

On screen: X is the two word vectors stacked as rows — Thinking is [1, 0, 1, 0],
Machines is [0, 1, 0, 1]. Times W_Q (four rows, two columns) gives Q. Point at
row 1 of Q: [1, 1], exactly the q_1 from the six steps.

Click: K and V appear. K = X W_K = [[2, 2], [1, 0]], V = X W_V = [[2, 0], [0, 2]].
Again the rows are the k and v vectors the room already met.

Click 2: the reading rule — one row per word — and the reminder that there is
only one W_Q, one W_K and one W_V, shared by every word.

Click 3: the callout. This is why the layer is fast on a GPU (graphics
processing unit): a matrix product is the operation those chips are built for.

Check for the room: row 2 of Q is x_2 times W_Q. Machines is [0, 1, 0, 1], so
it picks rows 2 and 4 of W_Q: [0, 1] + [0, 0] = [0, 1].

Class cut: about 2 minutes. In the full slides it is followed by "In words:
Every word at once: matrices".
-->

---
layout: default
title: "In words: Every word at once: matrices"
---

# In words: Every word at once: matrices

<div class="dl-describe">

- The slide stacks the two word vectors as the rows of a matrix $X$. Row 1 is
  *Thinking*, $[1, 0, 1, 0]$. Row 2 is *Machines*, $[0, 1, 0, 1]$.
- Multiplying $X$ by $W_Q$ gives $Q$. Each row of $Q$ is one word's query.
  Row 1 is $[1, 1]$, the same $\mathbf{q}_1$ as in the six steps.
- The same $X$ times $W_K$ gives $K = [[2, 2], [1, 0]]$. Times $W_V$ it gives
  $V = [[2, 0], [0, 2]]$.
- There is one set of weight matrices, shared by every word.
- So three matrix products make every query, key and value at once. That is
  fast on modern hardware.

</div>

<!--
The point: queries, keys and values for all words come from three matrix
products. Thirty seconds; skip in the lecture if short on time — this slide is
for revision.
-->

---
layout: default
core: true
title: The whole layer in one line
---

# The whole layer in one line

Steps 2 to 6, for every word at once, as matrices.

<div class="dl-math-sm">

$$
Z = \operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

</div>

<div class="flex justify-center">
<svg viewBox="0 0 660 150" class="dl-diagram" style="max-height: 10.5rem" role="img" aria-label="Q K transpose is 4 1 over 2 0. Divided by root 2: 2.83 0.71 over 1.41 0. Softmax of each row: 0.89 0.11 over 0.80 0.20. Times V gives Z: 1.79 0.21 over 1.61 0.39">
  <defs>
    <marker id="tv2s2-one-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="84" y="66" text-anchor="end">Thinking</text>
  <text class="dl-dg-small" x="84" y="96" text-anchor="end">Machines</text>
  <g v-for="(m, k) in [['score: QKᵀ', [['4', '1'], ['2', '0']]], ['scale: ÷ √2', [['2.83', '0.71'], ['1.41', '0']]], ['softmax, each row', [['0.89', '0.11'], ['0.80', '0.20']]], ['× V = Z', [['1.79', '0.21'], ['1.61', '0.39']]]]" :key="k">
    <g v-click>
      <text class="dl-dg-small" :x="136 + k * 140" y="30" text-anchor="middle">{{ m[0] }}</text>
      <g v-for="(row, r) in m[1]" :key="r">
        <g v-for="(v, c) in row" :key="c">
          <rect :class="k === 3 && r === 0 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="90 + k * 140 + c * 46" :y="44 + r * 30" width="46" height="30" />
          <text class="dl-dg-lab is-sm" :x="113 + k * 140 + c * 46" :y="64 + r * 30" text-anchor="middle">{{ v }}</text>
        </g>
      </g>
      <path v-if="k < 3" class="dl-dg-arrow" marker-end="url(#tv2s2-one-head)" :d="`M${186 + k * 140} 74 H${224 + k * 140}`" />
    </g>
  </g>
  <text class="dl-dg-small" x="136" y="128" text-anchor="middle">columns: the key read</text>
  <text class="dl-dg-small is-good" x="556" y="128" text-anchor="middle">row 1 = z₁</text>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

Row 1 of $Z$ is $[1.79, 0.21]$: the $\mathbf{z}_1$ you computed by hand. One line
does the same work for **every word at once**.

</div>

<!--
This is the payoff of the lecture. Everything in section 01 was one row of
this picture.

Read the line aloud first: Z equals softmax of Q times K-transpose, divided by
the square root of d_k, times V. Every symbol gets its own row on the next
slide; here the job is to see the numbers flow.

Click: the scores. Q K-transpose is a 2 x 2 table: row i, column j is query i
dotted with key j. Row 1 is 4, 1 — Thinking's two scores from step 2. Row 2 is
2, 0 — Machines' scores.

Click 2: divide every entry by the square root of d_k. d_k is 2, so the
divisor is 1.41: 4 becomes 2.83, 1 becomes 0.71, 2 becomes 1.41.

Click 3: softmax along each row, so each row adds up to 1. Row 1 is 0.89,
0.11, as in step 4. Row 2 is 0.80, 0.20: Machines also leans on Thinking,
because Thinking's key is big.

Click 4: times V. Row 1 is 0.893 x [2, 0] + 0.107 x [0, 2] = [1.79, 0.21].

Click 5: the callout. Ask the room: what is the first row? They have it in
their notebooks already. That moment — the one line agrees with the hand
calculation — is what this deck is built to deliver.

The paper's numbers, from the original post: with d_k = 64, Thinking's raw
scores are 112 and 96. Divided by 8 they are 14 and 12, and the softmax gives
0.88 and 0.12.

Class cut: about 3 minutes. In the full slides it is followed by "Reading the
equation: the whole layer".
-->

---
layout: default
title: "Reading the equation: the whole layer"
---

# Reading the equation: the whole layer

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $T$ | sentence length | number of words | 2 |
| $Q$ | queries | $XW_Q$, one row per word, $T \times d_k$ | $[[1, 1], [0, 1]]$ |
| $K$ | keys | $XW_K$, $T \times d_k$ | $[[2, 2], [1, 0]]$ |
| $V$ | values | $XW_V$, $T \times d_v$ | $[[2, 0], [0, 2]]$ |
| $K^\top$ | transpose | rows become columns, $d_k \times T$ | |
| $QK^\top$ | scores | every query dotted with every key, $T \times T$ | $[[4, 1], [2, 0]]$ |
| $d_k$ | key width | set by hand | 2 (paper: 64) |
| $\operatorname{softmax}$ | softmax, per row | each row positive, sums to 1 | $0.89, 0.11$ |
| $Z$ | output | row $i$ is $\mathbf{z}_i$, $T \times d_v$ | row 1: $[1.79, 0.21]$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 120" class="dl-diagram" role="img" aria-label="Shapes: Q is T by d_k, K transpose is d_k by T, their product is T by T; times V, T by d_v, gives Z, T by d_v">
  <rect class="dl-dg-box is-accent" x="6" y="30" width="40" height="40" />
  <text class="dl-dg-small" x="26" y="88" text-anchor="middle">Q</text>
  <text class="dl-dg-small" x="26" y="104" text-anchor="middle">T × dₖ</text>
  <rect class="dl-dg-box is-accent" x="58" y="30" width="40" height="40" />
  <text class="dl-dg-small" x="78" y="88" text-anchor="middle">Kᵀ</text>
  <text class="dl-dg-small" x="78" y="104" text-anchor="middle">dₖ × T</text>
  <text class="dl-dg-lab is-sm" x="114" y="56" text-anchor="middle">=</text>
  <rect class="dl-dg-box" x="128" y="30" width="40" height="40" />
  <text class="dl-dg-small" x="148" y="88" text-anchor="middle">scores</text>
  <text class="dl-dg-small" x="148" y="104" text-anchor="middle">T × T</text>
  <text class="dl-dg-lab is-sm" x="182" y="56" text-anchor="middle">×</text>
  <rect class="dl-dg-box is-accent" x="196" y="30" width="40" height="40" />
  <text class="dl-dg-small" x="216" y="88" text-anchor="middle">V</text>
  <text class="dl-dg-small" x="216" y="104" text-anchor="middle">T × dᵥ</text>
  <text class="dl-dg-lab is-sm" x="250" y="56" text-anchor="middle">→</text>
  <rect class="dl-dg-fill" x="262" y="30" width="34" height="40" />
  <text class="dl-dg-small" x="279" y="88" text-anchor="middle">Z</text>
</svg>

<div v-click class="dl-callout">

$(QK^\top)_{12} = \mathbf{q}_1 \cdot \mathbf{k}_2 = 1$

$\mathbf{z}_1 = 0.893\,\mathbf{v}_1 + 0.107\,\mathbf{v}_2$

$\phantom{\mathbf{z}_1} = [1.79, 0.21]$

</div>

</div>
</div>

<!--
Every symbol of the one-line formula, with the toy's numbers.

Clicks 1 to 9: one legend row per click. Click 10: the worked arithmetic.

Walk the shapes first, using the picture on the right. Q has one row per word
and d_k columns. K-transpose turns K on its side, so it has d_k rows and one
column per word. Their product is T x T: one score for every pair of words.
Row i is "word i asking", column j is "word j being read". Times V (T x d_v)
gives Z, also T x d_v: one output vector per word.

Say which parts are learned: W_Q, W_K and W_V, so Q, K and V depend on
learned weights. d_k is chosen by hand. The transpose, the division and the
softmax are fixed operations with nothing to learn.

"Softmax, per row" matters: it normalises along a row, over the words being
read. Each row sums to 1; the columns do not.

The callout: one score entry, and the first row of Z, using the unrounded
weights 0.893 and 0.107. With the rounded 0.89 the room gets 1.78 — say why the
two differ, so nobody thinks they made a mistake.
-->

---
layout: default
title: "In words: The whole layer in one line"
---

# In words: The whole layer in one line

<div class="dl-describe">

The formula $Z = \operatorname{softmax}(QK^\top / \sqrt{d_k})\,V$ does steps 2 to 6
for every word at once. Read the picture left to right:

1. **Score.** $QK^\top$ holds every query dotted with every key: $[[4, 1], [2, 0]]$.
   Row $i$ belongs to the word that asks.
2. **Scale.** Divide by $\sqrt{d_k} = \sqrt{2}$: $[[2.83, 0.71], [1.41, 0]]$.
3. **Softmax.** Each row becomes weights that add up to 1: $[[0.89, 0.11], [0.80, 0.20]]$.
4. **Weighted sum.** Multiply by $V$. Row 1 of $Z$ is $[1.79, 0.21]$.

That first row is the $\mathbf{z}_1$ found by hand. The matrix form changes the
speed, not the answer.

</div>

<!--
The point: the one-line formula, the four steps in matrix form, and the check
against the hand calculation. Thirty seconds; skip in the lecture if short on
time — this slide is for revision.
-->

---
layout: interactive
core: true
heading: "Many heads: one question each"
title: "Many heads: one question each"
aside-width: 17rem
---

<ItAttention head="both" :switchable="true" />

::aside::

One softmax gives **one** set of weights. *It* needs two: **who** is it, and
**what** is it?

<v-clicks>

- Head 1 puts 0.55 on *animal*
- Head 2 puts 0.45 on *tired*
- Each head has its own query, key and value weights

</v-clicks>

<div v-click class="mt-2 dl-callout">

Several heads look in several places at once.

</div>

<!--
The point: why the real layer runs several attention heads, not one. A single
softmax spreads one budget of weight over the words. If one word needs two
different things from the sentence, one head has to compromise.

On screen: the sentence twice. The asking word, it, is on the right. Each line
goes to a word on the left and is as thick as the attention weight. Accent
lines are head 1, red lines are head 2. The buttons switch between head 1,
head 2 and both; the arrow buttons (or the arrow keys, once the picture has
focus) move the asking word.

Say clearly that these weights are drawn by hand to show the idea. A trained
model's heads are messier.

Click: head 1 resolves the reference — 0.55 of the attention of it goes to animal.
Press "Head 1" to show it alone.

Click 2: head 2 reads what is said about it — 0.45 on tired. Press "Head 2".

Click 3: each head is a full copy of the six steps with its own W_Q, W_K and
W_V. Nothing is shared between heads except the input X.

Click 4: the callout. Press "Both" and let the room see the two fans at once.
The output for it now carries both the animal and the tiredness.

What the room gets wrong: thinking heads are told what to look for. They are
not. Each head starts from random weights, and training alone decides what
each one ends up doing.

Class cut: about 4 minutes. In the full slides it is followed by "In words:
Many heads: one question each".
-->

---
layout: default
title: "In words: Many heads: one question each"
---

# In words: Many heads: one question each

<div class="dl-describe">

- The picture writes the sentence twice. The asking word, *it*, is on the
  right. Each line goes to a word on the left, as thick as its weight.
- One head has one softmax, so it can spread only one budget of weight.
- The word *it* needs two answers. Head 1 (accent lines) asks who *it* is and
  puts 0.55 on *animal*. Head 2 (red lines) asks what is said about it and puts
  0.45 on *tired*.
- Each head has its own $W_Q$, $W_K$ and $W_V$, so each can learn a different
  question.
- These weights were drawn by hand to show the idea.

</div>

<!--
The point: several heads let one word gather several kinds of information.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
core: true
title: Eight heads, then glue them back
---

# Eight heads, then glue them back

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 230" class="dl-diagram" role="img" aria-label="X goes into eight heads, each giving a T by 64 output. The eight outputs are put side by side into one T by 512 matrix, then multiplied by W_O, 512 by 512, to give Z, T by 512">
  <defs>
    <marker id="tv2s2-glue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="10" y="82" width="56" height="60" rx="3" />
  <text class="dl-dg-lab is-sm" x="38" y="117" text-anchor="middle">X</text>
  <text class="dl-dg-small" x="38" y="160" text-anchor="middle">T × 512</text>
  <g v-for="h in 8" :key="h">
    <path class="dl-dg-arrow" :d="`M66 112 L104 ${21 + (h - 1) * 24}`" />
    <rect :class="h === 1 ? 'dl-dg-box is-accent' : 'dl-dg-box'" x="106" :y="12 + (h - 1) * 24" width="96" height="19" rx="3" />
    <text class="dl-dg-small" x="154" :y="26 + (h - 1) * 24" text-anchor="middle">head {{ h }} → Z{{ h }}</text>
  </g>
  <text class="dl-dg-small" x="154" y="218" text-anchor="middle">each Zᵢ is T × 64</text>
  <g v-click>
    <g v-for="h in 8" :key="'c' + h">
      <path class="dl-dg-arrow" :d="`M202 ${21 + (h - 1) * 24} L${246 + (h - 1) * 22} 92`" />
      <rect :class="h === 1 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="240 + (h - 1) * 22" y="94" width="22" height="40" />
    </g>
    <text class="dl-dg-small" x="328" y="156" text-anchor="middle">concatenate: T × 512</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#tv2s2-glue)" d="M420 114 H446" />
    <rect class="dl-dg-fill is-muted" x="450" y="84" width="76" height="60" rx="3" />
    <text class="dl-dg-lab is-sm" x="488" y="119" text-anchor="middle">× W_O</text>
    <text class="dl-dg-small" x="488" y="160" text-anchor="middle">512 × 512, learned</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s2-glue)" d="M526 114 H556" />
    <rect class="dl-dg-box is-accent" x="560" y="84" width="60" height="60" rx="3" />
    <text class="dl-dg-lab is-sm" x="590" y="119" text-anchor="middle">Z</text>
    <text class="dl-dg-small" x="590" y="160" text-anchor="middle">T × 512</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

Eight outputs of width 64, side by side, are 512 wide. $W_O$ mixes them into one
$T \times 512$ matrix, the width the next part expects.

</div>

<!--
The point: how eight heads become one output. Each head is the one-line
formula with its own W_Q, W_K and W_V. The paper uses eight heads of width
d_k = d_v = 64, and d_model = 512.

On screen: X on the left, T rows of 512 numbers (T is the number of words).
Eight heads, each producing its own Z_i of shape T x 64.

Click: concatenate — put the eight outputs side by side. 8 x 64 = 512, so the
result is T x 512 again.

Click 2: multiply by one more learned matrix, W_O (512 x 512). It mixes what
the eight heads found. The result Z is T x 512: one vector per word, the same
width as the input.

Click 3: the callout. The next part of the layer (the feed-forward network)
expects one matrix of width 512, not eight.

In the toy, d_model = 4 with two heads of width 2: two outputs of width 2
side by side are 4 wide, so the same picture holds with smaller numbers.

Class cut: about 2 minutes. In the full slides it is followed by "In words:
Eight heads, then glue them back", then the recap picture "The whole
multi-head layer".
-->

---
layout: default
title: "In words: Eight heads, then glue them back"
---

# In words: Eight heads, then glue them back

<div class="dl-describe">

1. The input $X$ has one row per word and 512 columns ($T \times 512$).
2. Eight heads each run the one-line attention formula with their own weights.
   Each gives an output $Z_i$ of shape $T \times 64$.
3. The eight outputs are put side by side (concatenated). Since
   $8 \times 64 = 512$, the result is $T \times 512$.
4. One more learned matrix, $W_O$ ($512 \times 512$), mixes what the heads
   found. The result $Z$ is $T \times 512$.

So the layer's output has the same shape as its input. That lets the next part
of the model take it directly.

</div>

<!--
The point: concatenate the heads, then multiply by W_O. Thirty seconds; skip
in the lecture if short on time — this slide is for revision.
-->

---
layout: default
title: The whole multi-head layer
---

# The whole multi-head layer

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 220" class="dl-diagram" role="img" aria-label="Five steps left to right: the words; embed them into X; per head, multiply X by W_Q, W_K and W_V; attention in each head gives Z1 to Z8; concatenate and multiply by W_O to get Z">
  <defs>
    <marker id="tv2s2-recap" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="(lab, s) in ['1 · words', '2 · embed: X', '3 · per head: Q, K, V', '4 · attention', '5 · concat × W_O']" :key="s">
    <text class="dl-dg-small" :x="66 + s * 132" y="20" text-anchor="middle">{{ lab }}</text>
    <path v-if="s < 4" class="dl-dg-arrow" marker-end="url(#tv2s2-recap)" :d="`M${116 + s * 132} 110 H${144 + s * 132}`" />
  </g>
  <text class="dl-dg-lab is-sm" x="66" y="100" text-anchor="middle">Thinking</text>
  <text class="dl-dg-lab is-sm" x="66" y="124" text-anchor="middle">Machines</text>
  <g v-for="r in 2" :key="'x' + r">
    <rect v-for="c in 4" :key="c" class="dl-dg-box" :x="156 + (c - 1) * 20" :y="86 + (r - 1) * 22" width="20" height="20" />
  </g>
  <g v-click>
    <g v-for="h in 8" :key="'w' + h">
      <rect :class="h === 1 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="290 + ((h - 1) % 4) * 22" :y="56 + Math.floor((h - 1) / 4) * 60" width="18" height="48" rx="2" />
    </g>
    <text class="dl-dg-small" x="330" y="190" text-anchor="middle">8 × (W_Q, W_K, W_V)</text>
    <g v-for="h in 8" :key="'z' + h">
      <rect :class="h === 1 ? 'dl-dg-fill' : 'dl-dg-fill is-muted'" :x="422 + ((h - 1) % 4) * 22" :y="66 + Math.floor((h - 1) / 4) * 50" width="18" height="34" rx="2" />
    </g>
    <text class="dl-dg-small" x="462" y="190" text-anchor="middle">Z1 … Z8</text>
  </g>
  <g v-click>
    <rect v-for="h in 8" :key="'c' + h" class="dl-dg-box" :x="548 + (h - 1) * 7" y="86" width="7" height="44" />
    <text class="dl-dg-lab is-sm" x="576" y="156" text-anchor="middle">× W_O → Z</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

Above the first layer there is no embedding step: $X$ is the output of the
layer below.

</div>

<!--
The point: the whole multi-head self-attention layer in one picture, as a
recap of this section. This is the picture to redraw from memory in the exam.

On screen, left to right: (1) the words, (2) their embeddings stacked into X,
(3) eight sets of W_Q, W_K, W_V, one per head, (4) eight outputs Z_1 to Z_8,
(5) the outputs side by side, times W_O, giving Z.

Click: steps 3 and 4 appear — the heads and their outputs.

Click 2: step 5, concatenate and multiply by W_O.

Click 3: the callout. Only the bottom layer reads embeddings. Every layer above
it reads the output of the layer below, which has the same shape.

About 1 minute. Not in the class cut: the previous slide carries the same idea.
-->

---
layout: default
title: "In words: The whole multi-head layer"
---

# In words: The whole multi-head layer

<div class="dl-describe">

The picture has five steps, left to right.

1. **Words.** *Thinking Machines*.
2. **Embed.** Each word becomes a vector; the vectors are the rows of $X$.
3. **Per head.** Each of the eight heads multiplies $X$ by its own $W_Q$, $W_K$
   and $W_V$.
4. **Attention.** Each head computes its output: $Z_1$ to $Z_8$.
5. **Glue.** Put the eight outputs side by side and multiply by $W_O$ to get $Z$.

Only the first layer starts from embeddings. A layer higher up starts from the
output of the layer below it.

</div>

<!--
The point: the five steps of multi-head self-attention as one list. Thirty
seconds; skip in the lecture if short on time — this slide is for revision.
-->

---
layout: default
title: "Poll: eight small heads or one big one?"
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="Which needs more weights in W_Q: eight heads of width 64, or one head of width 512?"
  :items="[
    'Eight heads of width 64',
    'One head of width 512',
    'The same number',
    'It depends on the sentence length',
  ]"
/>

</div>
<div class="mt-10">

<svg viewBox="0 0 260 170" class="dl-diagram" role="img" aria-label="Left: eight thin matrices, each 512 rows by 64 columns. Right: one wide matrix, 512 rows by 512 columns">
  <rect v-for="h in 8" :key="h" class="dl-dg-box" :x="8 + (h - 1) * 13" y="20" width="11" height="110" />
  <text class="dl-dg-small" x="58" y="150" text-anchor="middle">8 × (512 × 64)</text>
  <rect class="dl-dg-box is-accent" x="150" y="20" width="104" height="110" />
  <text class="dl-dg-small" x="202" y="150" text-anchor="middle">1 × (512 × 512)</text>
  <text class="dl-dg-small" x="130" y="12" text-anchor="middle">W_Q for every head together</text>
</svg>

</div>
</div>

<div v-click class="mt-4 dl-reveal">

The same: $8 \times (512 \times 64) = 512 \times 512 = 262\,144$

</div>

<div v-click class="mt-2 dl-secondary">

Heads split the width. They do not add weights.

</div>

<!--
The point: more heads do not mean more parameters. The paper picks d_k = 512 / 8
= 64 exactly so that eight heads cost the same as one wide head.

On screen beside the question: on the left, the eight W_Q matrices, each 512
rows by 64 columns. On the right, one W_Q of 512 by 512.

Hands up for each option before revealing.

Click: the answer. 8 x 512 x 64 = 262 144, and 512 x 512 = 262 144.

Click 2: why. The heads cut the 512 columns into eight slices of 64.

Why the wrong answers tempt: option 1 because "eight of something" sounds
bigger; option 2 because 512 is the biggest number on the slide; option 4
because the attention scores (T x T) do grow with the sentence length — but
those are computed, not learned weights.

About 3 minutes. Not in the class cut.
-->

---
layout: default
title: "In words: Poll: eight small heads or one big one?"
---

# In words: Poll: eight small heads or one big one?

<div class="dl-describe">

- The question compares the query weights $W_Q$ of two designs.
- Eight heads of width 64 need eight $512 \times 64$ matrices.
- Together: $8 \times 512 \times 64 = 262\,144$ weights.
- One head of width 512 needs one matrix of $512 \times 512 = 262\,144$ weights.
- So the answer is **the same**. The heads split the 512 columns into eight
  slices of 64.
- The sentence length does not change the number of weights. It only changes
  the size of the score table, which is computed, not learned.

</div>

<!--
The point: heads split the width, they do not add weights. Thirty seconds;
skip in the lecture if short on time — this slide is for revision.
-->

---
layout: section
index: "03"
---

# Word order

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="position" :size="190" /></div>

<!--
Section 03, about five minutes in class.

The glyph: a word's vector (the tile of four cells) plus a wave. A position
vector, built from waves, is added to every word vector.

What this section has to land: self-attention on its own cannot tell word
order; so the model adds a fixed position vector to each embedding before the
first layer. The formula and the heat map are for self-study and can be
skipped in class.
-->

---
layout: default
core: true
title: Attention does not see order
---

# Attention does not see order

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 200" class="dl-diagram" role="img" aria-label="Thinking Machines gives Thinking 1.79 0.21 and Machines 1.61 0.39. Machines Thinking gives the same two vectors, just in the other order">
  <defs>
    <marker id="tv2s3-order" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g>
    <text class="dl-dg-small" x="160" y="16" text-anchor="middle">“Thinking Machines”</text>
    <rect class="dl-dg-box" x="40" y="150" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="95" y="170" text-anchor="middle">Thinking</text>
    <rect class="dl-dg-box" x="170" y="150" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="225" y="170" text-anchor="middle">Machines</text>
    <rect class="dl-dg-fill" x="40" y="86" width="240" height="34" rx="4" />
    <text class="dl-dg-in" x="160" y="108" text-anchor="middle">self-attention</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s3-order)" d="M95 150 V122 M225 150 V122 M95 86 V62 M225 86 V62" />
    <rect class="dl-dg-box is-accent" x="40" y="30" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="95" y="50" text-anchor="middle">[1.79, 0.21]</text>
    <rect class="dl-dg-box is-accent" x="170" y="30" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="225" y="50" text-anchor="middle">[1.61, 0.39]</text>
  </g>
  <line class="dl-dg-split" x1="330" y1="10" x2="330" y2="190" />
  <g v-click>
    <text class="dl-dg-small" x="500" y="16" text-anchor="middle">“Machines Thinking”</text>
    <rect class="dl-dg-box" x="380" y="150" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="435" y="170" text-anchor="middle">Machines</text>
    <rect class="dl-dg-box" x="510" y="150" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="565" y="170" text-anchor="middle">Thinking</text>
    <rect class="dl-dg-fill" x="380" y="86" width="240" height="34" rx="4" />
    <text class="dl-dg-in" x="500" y="108" text-anchor="middle">self-attention</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s3-order)" d="M435 150 V122 M565 150 V122 M435 86 V62 M565 86 V62" />
    <rect class="dl-dg-box is-accent" x="380" y="30" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="435" y="50" text-anchor="middle">[1.61, 0.39]</text>
    <rect class="dl-dg-box is-accent" x="510" y="30" width="110" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="565" y="50" text-anchor="middle">[1.79, 0.21]</text>
  </g>
</svg>
</div>

<v-clicks>

- Same words, other order: the **same** two outputs, only swapped
- Each word's output depends on **which** words are there, not **where**

</v-clicks>

<div v-click class="mt-2 dl-callout">

Word order changes meaning, so it has to go **into the vectors**.

</div>

<!--
The point: self-attention, as built so far, cannot tell word order. Every
word compares itself with every other word, and nothing in the six steps
looks at positions.

On screen, left: the toy sentence "Thinking Machines" through the layer. The
outputs are the two rows of Z from the previous section: [1.79, 0.21] for
Thinking, [1.61, 0.39] for Machines.

Click: the same two words in the other order. Thinking still scores 4 against
its own key and 1 against Machines' key, wherever it stands. So its output is
still [1.79, 0.21]. The outputs simply swap places.

Click 2 and 3: the two bullets. A weighted sum over a set of words has no
order in it.

Click 4: the callout. "The dog bit the man" and "the man bit the dog" have the
same words. The model must see the difference, so the position has to be
written into each word's vector before the first layer.

Class cut: about 2 minutes. In the full slides it is followed by "In words:
Attention does not see order".
-->

---
layout: default
title: "In words: Attention does not see order"
---

# In words: Attention does not see order

<div class="dl-describe">

- The left half runs *Thinking Machines* through self-attention. *Thinking*
  comes out as $[1.79, 0.21]$ and *Machines* as $[1.61, 0.39]$.
- The right half swaps the words. Each word still meets the same keys and
  values, so it gets the same weights and the same output.
- The two outputs only change places. Nothing in the six steps looks at where
  a word stands.
- So self-attention depends on **which** words are present, not on their
  order.
- Word order changes meaning. The model must therefore put each word's
  position into its vector.

</div>

<!--
The point: self-attention alone is blind to order. Thirty seconds; skip in the
lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: Add a position vector
---

# Add a position vector

Before the first layer, add a fixed **position vector** to each word's
embedding. Same width, so nothing else changes.

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 200" class="dl-diagram" role="img" aria-label="Thinking at position 0: 1 0 1 0 plus 0 1 0 1 equals 1 1 1 1. Machines at position 1: 0 1 0 1 plus 0.84 0.54 0.01 1.00 equals 0.84 1.54 0.01 2.00">
  <text class="dl-dg-small" x="10" y="54">embedding</text>
  <text class="dl-dg-small" x="10" y="104">+ position</text>
  <text class="dl-dg-small" x="10" y="154">= input</text>
  <text class="dl-dg-lab is-sm" x="218" y="20" text-anchor="middle">Thinking · position 0</text>
  <text class="dl-dg-lab is-sm" x="498" y="20" text-anchor="middle">Machines · position 1</text>
  <g v-for="(col, w) in [[[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 1, 1]], [[0, 1, 0, 1], ['0.84', '0.54', '0.01', '1.00'], ['0.84', '1.54', '0.01', '2.00']]]" :key="w">
    <g v-for="c in 4" :key="'e' + c">
      <rect class="dl-dg-box" :x="120 + w * 280 + (c - 1) * 49" y="34" width="49" height="28" />
      <text class="dl-dg-lab is-sm" :x="144 + w * 280 + (c - 1) * 49" y="53" text-anchor="middle">{{ col[0][c - 1] }}</text>
    </g>
    <g v-click="1">
      <g v-for="c in 4" :key="'p' + c">
        <rect class="dl-dg-fill" :x="120 + w * 280 + (c - 1) * 49" y="84" width="49" height="28" />
        <text class="dl-dg-lab is-sm" :x="144 + w * 280 + (c - 1) * 49" y="103" text-anchor="middle">{{ col[1][c - 1] }}</text>
      </g>
    </g>
    <g v-click="2">
      <g v-for="c in 4" :key="'s' + c">
        <rect class="dl-dg-box is-accent" :x="120 + w * 280 + (c - 1) * 49" y="134" width="49" height="28" />
        <text class="dl-dg-lab is-sm" :x="144 + w * 280 + (c - 1) * 49" y="153" text-anchor="middle">{{ col[2][c - 1] }}</text>
      </g>
    </g>
  </g>
  <text v-click="2" class="dl-dg-small is-good" x="330" y="190" text-anchor="middle">the input now says what the word is and where it stands</text>
</svg>
</div>

<div v-click="3" class="mt-1 dl-callout">

The position vectors are **not learned**. Each one follows a fixed pattern of
sine and cosine waves.

</div>

<!--
The point: the fix for order-blindness is one addition per word, before the
first layer.

On screen: the toy, with d_model = 4. Top row: the two embeddings,
[1, 0, 1, 0] for Thinking and [0, 1, 0, 1] for Machines.

Click: the position vectors. Position 0 gets [0, 1, 0, 1]. Position 1 gets
[0.84, 0.54, 0.01, 1.00]. Where those numbers come from is the next slide.

Click 2: the sums. Thinking's input is [1, 1, 1, 1]; Machines' input is
[0.84, 1.54, 0.01, 2.00]. If Machines came first, it would get position 0's
vector instead, and its input would be different — so the layer can now see
order.

Click 3: the callout. In the original paper the position vectors are
computed by a fixed formula, not learned. (The paper also tried learned
position vectors and found about the same quality; the fixed ones work for
sentences longer than any seen in training.)

Why add rather than attach the numbers at the end: adding keeps the width at
d_model, so every weight matrix keeps its shape.

The section-01 toy deliberately left positions out to keep the numbers small.
Say so if asked.

Class cut: about 2 minutes. In the full slides it is followed by "Reading the
equation: positional encoding" and "The pattern over many positions".
-->

---
layout: default
title: "Reading the equation: positional encoding"
---

# Reading the equation: positional encoding

Each pair of dimensions is a wave: early pairs change fast, later pairs slowly.

<div class="dl-math-xs">

$$
PE_{(pos,\,2i)} = \sin\!\left(\frac{pos}{10000^{2i/d_{model}}}\right) \qquad
PE_{(pos,\,2i+1)} = \cos\!\left(\frac{pos}{10000^{2i/d_{model}}}\right)
$$

</div>

<div class="grid grid-cols-[1.5fr_1fr] gap-5 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $PE$ | position vector | fixed, added to $\mathbf{x}$ | see right |
| $pos$ | position | counted from 0 | 1 (*Machines*) |
| $2i$, $2i{+}1$ | dimension pair $i$ | even: $\sin$, odd: $\cos$ | $i = 0, 1$ |
| $d_{model}$, $10000$ | width, constant | set by hand | 4 (paper 512) |
| $\sin$, $\cos$ | sine, cosine | waves in $[-1, 1]$ | $\sin 1 = 0.84$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 250 92" class="dl-diagram" role="img" aria-label="Position 1 with width 4: sin 1, cos 1, sin 0.01, cos 0.01 give 0.84, 0.54, 0.01, 1.00">
  <g v-for="(lab, c) in ['sin 1', 'cos 1', 'sin 0.01', 'cos 0.01']" :key="c">
    <text class="dl-dg-small" :x="31 + c * 60" y="16" text-anchor="middle">{{ lab }}</text>
    <rect class="dl-dg-fill" :x="4 + c * 60" y="24" width="54" height="30" />
    <text class="dl-dg-lab is-sm" :x="31 + c * 60" y="44" text-anchor="middle">{{ ['0.84', '0.54', '0.01', '1.00'][c] }}</text>
  </g>
  <text class="dl-dg-small" x="125" y="80" text-anchor="middle">PE for pos = 1, d_model = 4</text>
</svg>

<div v-click class="dl-callout">

Angles: $1 / 10000^{0} = 1$ and $1 / 10000^{2/4} = 0.01$

</div>

</div>
</div>

<!--
Read the formula aloud: the even dimension 2i of the position vector for
position pos is the sine of pos divided by 10000 to the power 2i over d_model.
The odd dimension next to it is the cosine of the same number.

Clicks 1 to 5: one legend row per click. Click 6: the worked example. The constant 10000 sets how slow the slowest wave is.

The worked example is Machines at position 1 with d_model = 4. There are two
pairs, i = 0 and i = 1. For i = 0 the divisor is 10000^0 = 1, so the angle is
1: sin 1 = 0.84 and cos 1 = 0.54. For i = 1 the divisor is 10000^(2/4) = 100,
so the angle is 0.01: sin 0.01 = 0.01 and cos 0.01 = 1.00. Together:
[0.84, 0.54, 0.01, 1.00], the vector on the previous slide. Position 0 gives
angle 0 everywhere: sin 0 = 0 and cos 0 = 1, so [0, 1, 0, 1].

Nothing here is learned: pos is data, d_model and 10000 are set by hand, sine
and cosine are fixed functions.

Depth: the paper chose this form because, for any fixed offset k, the vector
for pos + k is a fixed linear function of the vector for pos (a rotation in
each sine-cosine pair). That may make it easy to attend by relative
position. The original blog post's large picture puts all the sines in the
left half and all the cosines in the right half, as one code library did; the
paper interleaves them, as here. Both work.
-->

---
layout: default
title: "In words: Add a position vector"
---

# In words: Add a position vector

<div class="dl-describe">

- Each word's input is its embedding **plus** a position vector of the same
  width.
- *Thinking* stands at position 0: $[1, 0, 1, 0] + [0, 1, 0, 1] = [1, 1, 1, 1]$.
- *Machines* stands at position 1: $[0, 1, 0, 1] + [0.84, 0.54, 0.01, 1.00] = [0.84, 1.54, 0.01, 2.00]$.
- The position vector is not learned. Its even dimensions are $\sin(pos / 10000^{2i/d_{model}})$
  and its odd dimensions are the matching $\cos$.
- With $d_{model} = 4$, position 1 gives $\sin 1$, $\cos 1$, $\sin 0.01$ and $\cos 0.01$.
- Now the same word at another position has a different input. So the layers
  can tell word order.

</div>

<!--
The point: covers "Add a position vector" and its "Reading the equation" slide.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: interactive
heading: The pattern over many positions
title: The pattern over many positions
aside-width: 17rem
---

<PositionalEncoding mode="sinusoid" :d-model="16" :positions="12" />

::aside::

One row per position, one column per dimension.

<v-clicks>

- Left columns change **fast** from row to row
- Right columns change **slowly**
- Every row is different

</v-clicks>

<div v-click class="mt-2 dl-callout">

It works for any position, even beyond the longest training sentence.

</div>

<!--
The point: what the position vectors look like for many positions at once.

On screen: twelve positions (rows, from 0) and sixteen dimensions (columns).
Each cell is one number between -1 and 1. Hover a row to read its first values
in the readout; row 0 starts [0, 1, 0, 1], as in the toy.

Click: the left columns are the fast waves — the angle is pos divided by a
small number, so they swing every few positions.

Click 2: the right columns are the slow waves — the angle is pos divided by a
number close to 10000, so they hardly move across twelve positions.

Click 3: every row is a different pattern, so every position gets its own
signature. Like the digits of a clock: the seconds hand moves fast, the hour
hand slowly, and together they say exactly what time it is.

Click 4: the callout. Because the vector comes from a formula, position 500
has one too, even if training only saw 50-word sentences.

The original blog post shows a 20 x 512 version of this picture, with the
sines in the left half and the cosines in the right half. This widget follows
the paper and alternates them. Same idea.

About 3 minutes. Not in the class cut.
-->

---
layout: default
title: "In words: The pattern over many positions"
---

# In words: The pattern over many positions

<div class="dl-describe">

- The heat map shows the position vectors for twelve positions. Each row is one
  position; each column is one of sixteen dimensions.
- Each cell is a number between $-1$ and $1$. The colour shows its sign and the
  strength shows its size.
- The left columns are fast waves. They change a lot from one row to the next.
- The right columns are slow waves. They barely change over twelve rows.
- Together they give every position its own pattern.
- Because the vectors come from a formula, any position has one, even in a
  sentence longer than those used in training.

</div>

<!--
The point: fast and slow waves together give each position a unique vector.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: section
index: "04"
---

# Add, norm, feed-forward

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="block" :size="190" /></div>

<!--
Section 04, about five minutes in class.

The glyph: one block of the encoder. The bar is self-attention, the trapezoid
above it is the feed-forward network, and the dashed wire around both is the
shortcut (the residual connection).

What this section has to land: every sub-layer has a shortcut around it and a
normalisation after it ("add & norm"), and the feed-forward network is a
small MLP applied to each word on its own. Layer normalisation and the
feed-forward formula are for self-study; in class, show the shortcut and the
full picture.
-->

---
layout: default
core: true
title: A shortcut around every sub-layer
---

# A shortcut around every sub-layer

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 160" class="dl-diagram" role="img" aria-label="x goes through self-attention, then add, then normalise, then feed-forward, then add, then normalise. A dashed shortcut carries x around self-attention to the first add, and another carries the normalised vector around the feed-forward network to the second add">
  <defs>
    <marker id="tv2s4-res" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
    <marker id="tv2s4-res-acc" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" style="fill: var(--dl-accent)" />
    </marker>
  </defs>
  <text class="dl-dg-lab is-sm" x="18" y="120" text-anchor="middle">x</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-res)" d="M28 115 H58" />
  <rect class="dl-dg-box is-accent" x="60" y="94" width="110" height="42" rx="4" />
  <text class="dl-dg-small" x="115" y="120" text-anchor="middle">self-attention</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-res)" d="M170 115 H189" />
  <circle class="dl-dg-op" cx="205" cy="115" r="14" />
  <text class="dl-dg-lab is-sm" x="205" y="120" text-anchor="middle">+</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-res)" d="M219 115 H233" />
  <rect class="dl-dg-fill" x="235" y="94" width="76" height="42" rx="4" />
  <text class="dl-dg-small" x="273" y="120" text-anchor="middle">normalise</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-res)" d="M311 115 H333" />
  <rect class="dl-dg-box" x="335" y="94" width="110" height="42" rx="4" />
  <text class="dl-dg-small" x="390" y="120" text-anchor="middle">feed-forward</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-res)" d="M445 115 H464" />
  <circle class="dl-dg-op" cx="480" cy="115" r="14" />
  <text class="dl-dg-lab is-sm" x="480" y="120" text-anchor="middle">+</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-res)" d="M494 115 H508" />
  <rect class="dl-dg-fill" x="510" y="94" width="76" height="42" rx="4" />
  <text class="dl-dg-small" x="548" y="120" text-anchor="middle">normalise</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-res)" d="M586 115 H620" />
  <text class="dl-dg-small" x="640" y="120" text-anchor="middle">out</text>
  <g v-click>
    <path d="M44 115 V56 H205 V99" marker-end="url(#tv2s4-res-acc)" style="fill: none; stroke: var(--dl-accent); stroke-width: 2; stroke-dasharray: 5 4" />
    <path d="M323 115 V56 H480 V99" marker-end="url(#tv2s4-res-acc)" style="fill: none; stroke: var(--dl-accent); stroke-width: 2; stroke-dasharray: 5 4" />
    <text class="dl-dg-small is-good" x="125" y="48" text-anchor="middle">shortcut: add x back</text>
    <text class="dl-dg-small is-good" x="401" y="48" text-anchor="middle">shortcut: add its input back</text>
  </g>
</svg>
</div>

<v-clicks>

- Each sub-layer's output is **added** to its input: $\mathbf{x} + \text{Sublayer}(\mathbf{x})$
- The sub-layer only has to learn a **change** to $\mathbf{x}$
- The signal and the gradient get a path with **no weight matrix** on it

</v-clicks>

<div v-click class="mt-1 dl-callout">

"Add & norm": add the shortcut, then normalise each word's vector. This is what
lets six (or many more) layers stack and still train.

</div>

<!--
The point: two small wrappers around every sub-layer make a deep stack
trainable. The residual connection (the shortcut) and layer normalisation
together are called "add & norm".

On screen: one encoder layer, left to right. x goes into self-attention, then
an add (the circle), then normalise, then the feed-forward network, then
another add, then normalise again.

Click: the dashed shortcuts. The input of each sub-layer jumps around it and
is added to its output.

Click 2: the formula. The vector leaving the add is x + Sublayer(x), where
Sublayer is self-attention or the feed-forward network.

Click 3: the sub-layer only learns a correction to x. If the best thing is to
change nothing, it can output zeros and x passes through untouched.

Click 4: why it trains. During backpropagation, the gradient flows back along
the shortcut through an addition, which passes it on unchanged. Without
shortcuts it must pass through every weight matrix of every layer, and it
tends to shrink or blow up on the way.

Click 5: the callout. "Normalise" is layer normalisation, the next slide in
the full deck. In one sentence: rescale each word's vector to mean 0 and
standard deviation 1.

Class cut: about 3 minutes. In the full slides it is followed by "Layer
normalisation" and its equation slide.
-->

---
layout: default
title: "In words: A shortcut around every sub-layer"
---

# In words: A shortcut around every sub-layer

<div class="dl-describe">

The picture is one encoder layer, read left to right.

1. The vector $\mathbf{x}$ goes into self-attention.
2. The dashed shortcut carries $\mathbf{x}$ around it. The circle adds the two:
   $\mathbf{x} + \text{Sublayer}(\mathbf{x})$.
3. The sum is normalised.
4. The same happens around the feed-forward network.

The sub-layer only has to learn a change to its input. In training, the
gradient flows back along the shortcut. It passes no weight matrix on the way. "Add & norm" is what lets many layers be stacked and still train.

</div>

<!--
The point: residual connections plus normalisation around every sub-layer.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
title: Layer normalisation
---

# Layer normalisation

Rescale **each word's vector on its own**: subtract its mean, divide by its
standard deviation.

<div class="grid grid-cols-2 gap-6 mt-1 items-center">
<div>

<svg viewBox="0 0 320 170" class="dl-diagram" role="img" aria-label="Bars 2 0 2 0 with a mean line at 1 become bars 1 minus 1 1 minus 1 around zero">
  <text class="dl-dg-small" x="70" y="14" text-anchor="middle">x + Sublayer(x)</text>
  <line class="dl-dg-split" x1="10" y1="130" x2="140" y2="130" />
  <rect v-for="(v, c) in [2, 0, 2, 0]" :key="'a' + c" class="dl-dg-bar" :x="18 + c * 30" :y="130 - v * 40" width="22" :height="v * 40" />
  <line x1="10" y1="90" x2="140" y2="90" style="stroke: var(--dl-accent); stroke-width: 1.5; stroke-dasharray: 4 3" />
  <text class="dl-dg-small is-good" x="143" y="86">mean 1</text>
  <text class="dl-dg-small" x="75" y="150" text-anchor="middle">[2, 0, 2, 0]</text>
  <g v-click>
    <text class="dl-dg-small" x="245" y="14" text-anchor="middle">normalised</text>
    <line class="dl-dg-split" x1="180" y1="90" x2="310" y2="90" />
    <rect v-for="(v, c) in [1, -1, 1, -1]" :key="'b' + c" class="dl-dg-bar is-q" :x="188 + c * 30" :y="v > 0 ? 90 - v * 40 : 90" width="22" :height="Math.abs(v) * 40" />
    <text class="dl-dg-small" x="245" y="150" text-anchor="middle">[1, −1, 1, −1]</text>
  </g>
</svg>

</div>
<div class="dl-math-sm">

$$
\text{LayerNorm}(\mathbf{v}) = \boldsymbol{\gamma} \odot \frac{\mathbf{v} - \mu}{\sigma} + \boldsymbol{\beta}
$$

<div v-click class="dl-secondary">

Every word's vector ends with mean 0 and standard deviation 1, before $\boldsymbol{\gamma}$
and $\boldsymbol{\beta}$.

</div>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Each word is normalised on its own, so the sentence length does not matter.

</div>

<!--
The point: what "norm" in "add & norm" does, with one word's numbers.

On screen, left: the toy vector leaving the add, [2, 0, 2, 0], as four bars.
The dashed line is its mean, 1. Right: the formula.

Read the formula aloud: LayerNorm of v is gamma times (v minus its mean,
divided by its standard deviation), plus beta. Every symbol is named on the
next slide.

Click: the normalised bars. Subtract the mean: [1, -1, 1, -1]. The standard
deviation is 1, so dividing changes nothing: [1, -1, 1, -1].

Click 2: the result always has mean 0 and standard deviation 1. Then gamma
and beta, both learned, can rescale and shift it if the model needs that.

Click 3: the callout. The statistics come from the d_model numbers of one
word. Nothing is shared between words or between sentences.

Why bother: without it, the vectors can grow a little in every layer, and
after six additions the numbers drift to sizes where training is unstable.

About 2 minutes. Not in the class cut.
-->

---
layout: default
title: "Reading the equation: layer normalisation"
---

# Reading the equation: layer normalisation

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $\mathbf{v}$ | input vector | one word's $d_{model}$ numbers | $[2, 0, 2, 0]$ |
| $\mu$ | mean | average of the $d_{model}$ numbers | 1 |
| $\sigma$ | standard deviation | square root of the average squared gap from $\mu$ | 1 |
| $\mathbf{v} - \mu$ | centred vector | $\mu$ subtracted from every number | $[1, -1, 1, -1]$ |
| $\boldsymbol{\gamma}$ | scale | learned, $d_{model}$ numbers, starts as all 1 | $[1, 1, 1, 1]$ |
| $\boldsymbol{\beta}$ | shift | learned, $d_{model}$ numbers, starts as all 0 | $[0, 0, 0, 0]$ |
| $\odot$ | element-wise product | multiply position by position | |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 260 120" class="dl-diagram" role="img" aria-label="Two, zero, two, zero minus 1 gives one, minus one, one, minus one; divided by 1 it stays the same">
  <g v-for="(row, r) in [['v', ['2', '0', '2', '0']], ['v − μ', ['1', '−1', '1', '−1']], ['÷ σ', ['1', '−1', '1', '−1']]]" :key="r">
    <text class="dl-dg-small" x="50" :y="30 + r * 36" text-anchor="end">{{ row[0] }}</text>
    <g v-for="(v, c) in row[1]" :key="c">
      <rect :class="r === 2 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="60 + c * 46" :y="12 + r * 36" width="46" height="28" />
      <text class="dl-dg-lab is-sm" :x="83 + c * 46" :y="31 + r * 36" text-anchor="middle">{{ v }}</text>
    </g>
  </g>
</svg>

<div v-click class="dl-callout">

$\mu = (2 + 0 + 2 + 0) / 4 = 1$

$\sigma = \sqrt{(1 + 1 + 1 + 1) / 4} = 1$

With $\boldsymbol{\gamma} = 1$, $\boldsymbol{\beta} = 0$: $[1, -1, 1, -1]$

</div>

</div>
</div>

<!--
Every symbol of the layer-normalisation formula, on the toy vector.

Clicks 1 to 7: one legend row per click. Click 8: the arithmetic.

v is data — the output of the add. mu and sigma are computed from v itself,
so nothing about them is learned. gamma and beta are learned parameters, one
number per dimension; they start at 1 and 0, so at the start of training the
layer is a pure normalisation.

The arithmetic: the mean of 2, 0, 2, 0 is 1. The gaps from the mean are 1, -1,
1, -1; squared, 1 each; their average is 1; the square root is 1.

Depth: real implementations add a tiny constant epsilon (about 0.00001) under
the square root, so a vector whose numbers are all equal (sigma = 0) does not
cause a division by zero.
-->

---
layout: default
title: "In words: Layer normalisation"
---

# In words: Layer normalisation

<div class="dl-describe">

- Layer normalisation works on one word's vector at a time.
- The left bars are $[2, 0, 2, 0]$. Their mean $\mu$ is 1, the dashed line.
- Subtract the mean: $[1, -1, 1, -1]$. The standard deviation $\sigma$ is 1, so
  dividing by it changes nothing. These are the right-hand bars.
- The result has mean 0 and standard deviation 1.
- Then a learned scale $\boldsymbol{\gamma}$ and shift $\boldsymbol{\beta}$ are
  applied. They start at 1 and 0.
- This keeps the numbers at a steady size from layer to layer, which keeps
  training stable.

</div>

<!--
The point: covers "Layer normalisation" and its "Reading the equation" slide.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
title: The feed-forward network, one word at a time
---

# The feed-forward network, one word at a time

A small MLP (multilayer perceptron): widen, ReLU, narrow back. The **same**
weights for every word.

<div class="grid grid-cols-[1.3fr_1fr] gap-6 mt-1 items-center">
<div>

<svg viewBox="0 0 360 190" class="dl-diagram" role="img" aria-label="z1 for Thinking and z2 for Machines each go through a copy of the same feed-forward network, 512 wide, then 2048, then 512, and come out as r1 and r2">
  <defs>
    <marker id="tv2s4-ffn" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="(w, k) in ['Thinking', 'Machines']" :key="k">
    <text class="dl-dg-small" :x="90 + k * 180" y="182" text-anchor="middle">z{{ k + 1 }} · {{ w }}</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s4-ffn)" :d="`M${90 + k * 180} 168 V146`" />
    <polygon class="dl-dg-net" :points="`${60 + k * 180},144 ${120 + k * 180},144 ${150 + k * 180},104 ${30 + k * 180},104`" />
    <polygon class="dl-dg-net" :points="`${30 + k * 180},100 ${150 + k * 180},100 ${120 + k * 180},60 ${60 + k * 180},60`" />
    <text class="dl-dg-small" :x="90 + k * 180" y="128" text-anchor="middle">512 → 2048</text>
    <text class="dl-dg-small" :x="90 + k * 180" y="84" text-anchor="middle">2048 → 512</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s4-ffn)" :d="`M${90 + k * 180} 58 V36`" />
    <text class="dl-dg-small" :x="90 + k * 180" y="26" text-anchor="middle">r{{ k + 1 }}</text>
  </g>
  <text class="dl-dg-small is-good" x="180" y="102" text-anchor="middle">same</text>
  <text class="dl-dg-small is-good" x="180" y="116" text-anchor="middle">weights</text>
</svg>

</div>
<div class="dl-math-sm">

$$
\text{FFN}(\mathbf{x}) = \max(0,\, \mathbf{x}W_1 + \mathbf{b}_1)\, W_2 + \mathbf{b}_2
$$

<div v-click class="dl-secondary">

No word sees another word here. Only self-attention mixes words.

</div>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Every word goes through the FFN (feed-forward network) on its own, so all words
run in parallel.

</div>

<!--
The point: the second sub-layer of every encoder layer is a plain MLP, applied
to each word's vector separately, with weights shared across positions.

On screen: Thinking's vector z_1 and Machines' vector z_2, each going through
its own copy of the same network. The lower trapezoid widens 512 to 2048
(d_ff = 2048 in the paper); the upper one narrows back to 512. The outputs
r_1 and r_2 go to the next layer.

Read the formula aloud: FFN of x is ReLU of (x times W_1 plus b_1), times W_2,
plus b_2. max(0, ...) is ReLU. The next slide names every symbol and works a
toy example.

Click: the important property. This sub-layer has no connection between
words. All mixing between words happens in self-attention.

Click 2: the callout. Because the words do not interact here, every word can
be computed at the same time.

What the room gets wrong: thinking each word has its own network. It is one
network, used once per word.

About 2 minutes. Not in the class cut.
-->

---
layout: default
title: "Reading the equation: the feed-forward network"
---

# Reading the equation: the feed-forward network

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example (toy) |
| --- | --- | --- | --- |
| $\mathbf{x}$ | input | one word's vector, $d_{model}$ numbers | $[1, 2]$ |
| $W_1$ | first weights | learned, $d_{model} \times d_{ff}$ | $[[1, 0, 1], [0, 1, -1]]$ |
| $\mathbf{b}_1$ | first bias | learned, $d_{ff}$ numbers | $[0, -1, 0]$ |
| $\max(0, \cdot)$ | ReLU | negatives become 0, element-wise | $-1 \to 0$ |
| $W_2$ | second weights | learned, $d_{ff} \times d_{model}$ | $[[1, 0], [1, 1], [1, 2]]$ |
| $\mathbf{b}_2$ | second bias | learned, $d_{model}$ numbers | $[0.5, 0]$ |
| $d_{ff}$ | hidden width | set by hand | 3 (paper: 2048) |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 250 150" class="dl-diagram" role="img" aria-label="1, 2 becomes 1, 1, minus 1; ReLU gives 1, 1, 0; then 2.5, 1">
  <g v-for="(row, r) in [['x', ['1', '2']], ['xW₁ + b₁', ['1', '1', '−1']], ['ReLU', ['1', '1', '0']], ['out', ['2.5', '1']]]" :key="r">
    <text class="dl-dg-small" x="80" :y="27 + r * 34" text-anchor="end">{{ row[0] }}</text>
    <g v-for="(v, c) in row[1]" :key="c">
      <rect :class="r === 3 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="90 + c * 46" :y="8 + r * 34" width="46" height="28" />
      <text class="dl-dg-lab is-sm" :x="113 + c * 46" :y="27 + r * 34" text-anchor="middle">{{ v }}</text>
    </g>
  </g>
</svg>

<div v-click class="dl-callout">

$\mathbf{x}W_1 + \mathbf{b}_1 = [1, 1, -1]$

ReLU: $[1, 1, 0]$

$\times W_2 + \mathbf{b}_2 = [2.5, 1]$

</div>

</div>
</div>

<!--
Every symbol of the feed-forward formula, on a toy small enough to do by
hand: d_model = 2 and d_ff = 3. The toy is not the attention example — its
width is 2, not 4 — because a 4 x 16 matrix does not fit on a slide. The real
rule d_ff = 4 x d_model (2048 = 4 x 512) is broken only to keep it small.

Clicks 1 to 7: one legend row per click. Click 8: the arithmetic.

Step by step: x W_1 is [1 x 1 + 2 x 0, 1 x 0 + 2 x 1, 1 x 1 + 2 x (-1)] =
[1, 2, -1]. Add b_1: [1, 1, -1]. ReLU sets the negative to 0: [1, 1, 0]. Times
W_2: 1 x [1, 0] + 1 x [1, 1] + 0 x [1, 2] = [2, 1]. Add b_2: [2.5, 1].

Which parts are learned: W_1, b_1, W_2, b_2. d_ff is set by hand. ReLU is a
fixed function.

Depth: in the paper this network holds about two thirds of each encoder
layer's weights: 2 x 512 x 2048, about 2.1 million, against 4 x 512 x 512,
about 1.0 million, for the attention matrices.
-->

---
layout: default
title: "In words: The feed-forward network, one word at a time"
---

# In words: The feed-forward network, one word at a time

<div class="dl-describe">

- The feed-forward network is a small MLP. It widens each word's vector, applies
  ReLU, then narrows it back: 512 → 2048 → 512 in the paper.
- The picture shows *Thinking* and *Machines* going through copies of **one**
  network with the same weights.
- No word sees another here, so all words run at once.
- Toy example, with $d_{model} = 2$ and $d_{ff} = 3$: $\mathbf{x} = [1, 2]$
  gives $\mathbf{x}W_1 + \mathbf{b}_1 = [1, 1, -1]$.
- ReLU turns that into $[1, 1, 0]$. Then $\times W_2 + \mathbf{b}_2$ gives $[2.5, 1]$.

</div>

<!--
The point: covers the feed-forward slide and its "Reading the equation" slide.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
core: true
title: The full picture, two layers deep
---

# The full picture, two layers deep

<div class="flex justify-center">
<svg viewBox="0 0 660 324" class="dl-diagram" style="max-height: 19.5rem" role="img" aria-label="Two encoder layers stacked on the left, each with self-attention and feed-forward, each followed by add and norm. Two decoder layers on the right with self-attention, encoder-decoder attention and feed-forward. The top encoder's output feeds the encoder-decoder attention of both decoders. Above the decoders: linear, then softmax">
  <defs>
    <marker id="tv2s4-full" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="(y0, e) in [214, 120]" :key="'e' + e">
    <rect class="dl-dg-fill is-muted" x="60" :y="y0" width="220" height="86" rx="5" />
    <rect class="dl-dg-fill" x="70" :y="y0 + 4" width="200" height="14" rx="2" />
    <text class="dl-dg-small" x="170" :y="y0 + 15" text-anchor="middle">add &amp; norm</text>
    <rect class="dl-dg-box" x="70" :y="y0 + 21" width="200" height="20" rx="3" />
    <text class="dl-dg-small" x="170" :y="y0 + 35" text-anchor="middle">feed-forward</text>
    <rect class="dl-dg-fill" x="70" :y="y0 + 44" width="200" height="14" rx="2" />
    <text class="dl-dg-small" x="170" :y="y0 + 55" text-anchor="middle">add &amp; norm</text>
    <rect class="dl-dg-box is-accent" x="70" :y="y0 + 61" width="200" height="20" rx="3" />
    <text class="dl-dg-small" x="170" :y="y0 + 75" text-anchor="middle">self-attention</text>
    <text class="dl-dg-small" x="286" :y="y0 + 48">encoder {{ 2 - e }}</text>
  </g>
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-full)" d="M170 304 V302" />
  <path class="dl-dg-arrow" marker-end="url(#tv2s4-full)" d="M170 214 V208" />
  <text class="dl-dg-small" x="170" y="318" text-anchor="middle">Thinking, Machines + positions</text>
  <g v-click>
    <g v-for="(y0, d) in [174, 40]" :key="'d' + d">
      <rect class="dl-dg-fill is-muted" x="380" :y="y0" width="220" height="126" rx="5" />
      <rect class="dl-dg-fill" x="390" :y="y0 + 4" width="200" height="14" rx="2" />
      <text class="dl-dg-small" x="490" :y="y0 + 15" text-anchor="middle">add &amp; norm</text>
      <rect class="dl-dg-box" x="390" :y="y0 + 21" width="200" height="20" rx="3" />
      <text class="dl-dg-small" x="490" :y="y0 + 35" text-anchor="middle">feed-forward</text>
      <rect class="dl-dg-fill" x="390" :y="y0 + 44" width="200" height="14" rx="2" />
      <text class="dl-dg-small" x="490" :y="y0 + 55" text-anchor="middle">add &amp; norm</text>
      <rect class="dl-dg-box is-accent" x="390" :y="y0 + 61" width="200" height="20" rx="3" />
      <text class="dl-dg-small" x="490" :y="y0 + 75" text-anchor="middle">encoder–decoder attention</text>
      <rect class="dl-dg-fill" x="390" :y="y0 + 84" width="200" height="14" rx="2" />
      <text class="dl-dg-small" x="490" :y="y0 + 95" text-anchor="middle">add &amp; norm</text>
      <rect class="dl-dg-box is-accent" x="390" :y="y0 + 101" width="200" height="20" rx="3" />
      <text class="dl-dg-small" x="490" :y="y0 + 115" text-anchor="middle">self-attention</text>
      <text class="dl-dg-small" x="606" :y="y0 + 68">decoder {{ 2 - d }}</text>
    </g>
    <path class="dl-dg-arrow" marker-end="url(#tv2s4-full)" d="M490 174 V168" />
    <text class="dl-dg-small" x="490" y="318" text-anchor="middle">outputs so far + positions</text>
    <path class="dl-dg-arrow" marker-end="url(#tv2s4-full)" d="M490 310 V302" />
    <path class="dl-dg-arrow" d="M170 120 V104 H345" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s4-full)" d="M345 104 V111 H388" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s4-full)" d="M345 104 V245 H388" />
    <text class="dl-dg-small is-good" x="186" y="97">K, V for every decoder</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#tv2s4-full)" d="M490 40 V32" />
    <rect class="dl-dg-box" x="390" y="8" width="200" height="22" rx="3" />
    <text class="dl-dg-small" x="490" y="23" text-anchor="middle">linear → softmax: next word</text>
  </g>
</svg>
</div>

<!--
The point: the whole model in one picture, two layers deep (the paper uses
six). Every box is now a part the room has met, or meets in the next section.

On screen, left: two encoder layers stacked. Each has self-attention and a
feed-forward network, each followed by add & norm. The input at the bottom is
the word embeddings plus position vectors. The output of encoder 1 is the
input of encoder 2.

Click: the decoders appear on the right. Each decoder layer has three
sub-layers: self-attention, encoder–decoder attention, and a feed-forward
network, each with add & norm. The top encoder's output is sent to the
encoder–decoder attention of every decoder layer, where it provides the keys
and values. The decoder's input at the bottom is the words it has written so
far, plus positions.

Click 2: on top of the decoders, a linear layer and a softmax pick the next
word.

Do not explain the decoder yet. Say: "the next section opens the right-hand
column". The point here is that everything fits together and the shapes
match: every arrow carries one vector of width d_model per word.

Class cut: about 2 minutes. In the full slides it is followed by "In words:
The full picture, two layers deep".
-->

---
layout: default
title: "In words: The full picture, two layers deep"
---

# In words: The full picture, two layers deep

<div class="dl-describe">

- The left column is two encoder layers. Each has self-attention and a
  feed-forward network, and each of those is followed by "add & norm".
- The encoders read the word embeddings plus position vectors, from the bottom
  up.
- The right column is two decoder layers. Each has **three** sub-layers:
  self-attention, encoder–decoder attention and a feed-forward network.
- The top encoder's output goes to the encoder–decoder attention of every
  decoder layer. It provides the keys $K$ and values $V$.
- A linear layer and a softmax on top choose the next word.
- The paper stacks six of each, not two.

</div>

<!--
The point: the whole model as one picture, two layers deep. Thirty seconds;
skip in the lecture if short on time — this slide is for revision.
-->

---
layout: section
index: "05"
---

# The decoder side

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="decoder" :size="190" /></div>

<!--
Section 05, about fourteen minutes in the class cut. Do not linger on the
divider; the next slide does the work.

The glyph is the decoder: a stack under a triangular grid, where each row may
only look at the cells to its left. That triangle is the mask, and it is the
one thing in this section that is genuinely new.

What this section has to land, in order: the encoder's output becomes keys and
values for every decoder; the decoder writes one word per step and reads its
own output back in; a mask stops it looking at future words; encoder–decoder
attention is ordinary attention with Q from one stack and K, V from the other;
and a linear layer plus a softmax turn the last vector into a word.
-->

---
layout: default
core: true
title: The encoder hands over keys and values
---

# The encoder hands over keys and values

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 256" class="dl-diagram" role="img" aria-label="The encoder stack reads je suis étudiant once; its top output is turned into keys and values that go to every one of the six decoders">
  <defs>
    <marker id="tv2s5-kv-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="130" y="250" text-anchor="middle">input: je suis étudiant</text>
  <rect class="dl-dg-box" x="50" y="204" width="50" height="24" rx="4" />
  <rect class="dl-dg-box" x="105" y="204" width="50" height="24" rx="4" />
  <rect class="dl-dg-box" x="160" y="204" width="50" height="24" rx="4" />
  <text class="dl-dg-small" x="75" y="220" text-anchor="middle">je</text>
  <text class="dl-dg-small" x="130" y="220" text-anchor="middle">suis</text>
  <text class="dl-dg-small" x="185" y="220" text-anchor="middle">étudiant</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M130 202 V186" />
  <rect class="dl-dg-box" x="40" y="150" width="180" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="130" y="172" text-anchor="middle">encoder 1</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M130 148 V134" />
  <text class="dl-dg-small" x="130" y="124" text-anchor="middle">encoders 2 to 5</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M130 112 V98" />
  <rect class="dl-dg-box" x="40" y="62" width="180" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="130" y="84" text-anchor="middle">encoder 6</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M130 60 V44" />
  <rect class="dl-dg-box is-accent" x="70" y="20" width="36" height="22" rx="3" />
  <rect class="dl-dg-box is-accent" x="112" y="20" width="36" height="22" rx="3" />
  <rect class="dl-dg-box is-accent" x="154" y="20" width="36" height="22" rx="3" />
  <text class="dl-dg-small" x="130" y="13" text-anchor="middle">one vector per input word</text>
  <rect class="dl-dg-box" x="440" y="150" width="180" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="530" y="172" text-anchor="middle">decoder 1</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M530 148 V134" />
  <text class="dl-dg-small" x="530" y="124" text-anchor="middle">decoders 2 to 5</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M530 112 V98" />
  <rect class="dl-dg-box" x="440" y="62" width="180" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="530" y="84" text-anchor="middle">decoder 6</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M530 60 V44" />
  <text class="dl-dg-small" x="530" y="34" text-anchor="middle">the next output word</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-kv-head)" d="M530 230 V186" />
  <text class="dl-dg-small" x="530" y="248" text-anchor="middle">output so far: ⟨start⟩ …</text>
  <g v-click>
    <path class="dl-dg-grad is-good" marker-end="url(#tv2s5-kv-head)" d="M192 31 C 330 31, 330 167, 436 167" />
    <path class="dl-dg-grad is-good" marker-end="url(#tv2s5-kv-head)" d="M192 31 C 330 31, 340 122, 436 122" />
    <path class="dl-dg-grad is-good" marker-end="url(#tv2s5-kv-head)" d="M192 31 C 330 31, 350 79, 436 79" />
    <text class="dl-dg-in" x="300" y="22" text-anchor="middle">K and V</text>
    <text class="dl-dg-small is-good" x="330" y="200" text-anchor="middle">the same K and V</text>
    <text class="dl-dg-small is-good" x="330" y="214" text-anchor="middle">go to every decoder</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

The encoder runs **once**. Its top output becomes keys $K$ and values $V$ that
every decoder reads.

</div>

<!--
The point: the only thing that crosses from the encoder side to the decoder
side is the encoder's top output, and it crosses as keys and values.

On screen: left, the encoder stack reading "je suis étudiant" from the bottom.
Six encoders, drawn as the first, a gap for 2 to 5, and the sixth. At the top,
one accent box per input word: the encoder's output, one vector of 512 numbers
per word. Right, the decoder stack, also six high. Its input at the bottom is
the output written so far, starting from a start symbol.

Click: the dashed accent curves. The top encoder output is multiplied by a key
matrix and a value matrix to make K and V. The same K and V go into every one of
the six decoders, into a layer called encoder–decoder attention. That layer is
two slides on.

Click 2: the callout. The encoder runs once for the whole input sentence. The
decoder will run once for every output word. Say that difference out loud: it is
why writing is slower than reading.

What the room gets wrong: they think each decoder reads the encoder layer at the
same height (decoder 3 reads encoder 3). No — all six decoders read the top
encoder only.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: The encoder hands over keys and values"
---

# In words: The encoder hands over keys and values

<div class="dl-describe">

- The left stack is the encoder: six encoders on top of each other. It reads
  the input *je suis étudiant* from the bottom.
- The accent boxes at the top are its output: one vector per input word.
- The dashed curves show that output turned into keys $K$ and values $V$.
- The same $K$ and $V$ go to **all six** decoders on the right. Decoder 3 does
  not read encoder 3; every decoder reads the top encoder.
- The encoder runs once per sentence. The decoder runs once per output word.

</div>

<!--
The point: what the encoder hands over, and to whom. Twenty seconds; skip in
the lecture if short on time — this slide is for revision.
-->

---
layout: interactive
core: true
heading: One word per step
title: One word per step
aside-width: 16rem
clicks: 5
---

<DecodeLoop :step="$clicks" :switchable="false" />

::aside::

The decoder writes **one word per step**.

<v-clicks>

- The word it writes is fed back in as its next input.
- That input is embedded and gets a position vector, as on the encoder side.
- It stops when it writes ⟨eos⟩, "end of sentence".

</v-clicks>

<!--
The point: the decoder is a loop. It writes a word, then reads everything it
has written so far, then writes the next word.

On screen: the input row shows the French sentence, already read once by the
encoder. The output row starts with the start symbol only. The bars are the
probability the model gives each of the six words in our tiny vocabulary for
the current output position. The ringed word is the right answer; the accent
bar is the word the model picks, the highest one.

Click: step 1. The highest bar is "i" at 0.80; "i" is appended. The first aside
bullet appears: that "i" is now part of the decoder's input.

Click 2: step 2. Reading "⟨start⟩ i", the model puts 0.75 on "am". The second
bullet: the decoder's inputs are turned into vectors and given positions in
exactly the same way as the encoder's.

Click 3: step 3, "a" at 0.70. The third bullet: decoding stops at the end
symbol.

Click 4: step 4, "student" at 0.85.

Click 5: step 5, "⟨eos⟩" at 0.90, and the readout says decoding stops. The
output is "i am a student ⟨eos⟩".

Picking the highest bar each time is called greedy decoding. The training
section comes back to it and shows the alternative, beam search.

These probabilities are made-up numbers for a trained model, chosen to be easy
to read. A real model with 10 000 words spreads a little probability over
every word.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: One word per step"
---

# In words: One word per step

<div class="dl-describe">

1. The encoder has already read *je suis étudiant*. The decoder starts from a
   ⟨start⟩ symbol.
2. At each step it gives a probability to every word in the vocabulary. Here
   the vocabulary has six words.
3. It picks the most likely word: *i* (0.80), then *am* (0.75), *a* (0.70),
   *student* (0.85) and ⟨eos⟩ (0.90).
4. Each picked word becomes part of the decoder's input for the next step. It
   is embedded and gets a position vector first.
5. ⟨eos⟩ means "end of sentence", so the loop stops there.

</div>

<!--
The point: the decoder is a loop over output words. Thirty seconds; skip in the
lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: "No looking ahead: the mask"
---

# No looking ahead: the mask

<div class="grid grid-cols-[1fr_1.05fr] gap-8 mt-1 items-start">
<div>

<svg viewBox="0 0 320 210" class="dl-diagram" role="img" aria-label="Scaled scores for three decoder positions. Every cell to the right of the diagonal is minus infinity. After softmax the rows are 1 0 0, 0.5 0.5 0, and 0.79 0.11 0.11">
  <text class="dl-dg-small" x="10" y="14">scaled scores, one row per asking position</text>
  <text v-for="(h, c) in ['⟨start⟩', 'i', 'am']" :key="'h' + c" class="dl-dg-small" :x="128 + c * 64" y="36" text-anchor="middle">{{ h }}</text>
  <g v-for="(row, r) in [['⟨start⟩', ['3', '−∞', '−∞']], ['i', ['1', '1', '−∞']], ['am', ['2', '0', '0']]]" :key="r">
    <text class="dl-dg-small" x="88" :y="64 + r * 40" text-anchor="end">{{ row[0] }}</text>
    <g v-for="(v, c) in row[1]" :key="c">
      <rect :class="c > r ? 'dl-dg-box is-bad' : 'dl-dg-box'" :x="100 + c * 64" :y="44 + r * 40" width="56" height="32" rx="3" />
      <text :class="c > r ? 'dl-dg-small is-bad' : 'dl-dg-lab is-sm'" :x="128 + c * 64" :y="65 + r * 40" text-anchor="middle">{{ v }}</text>
    </g>
  </g>
  <g v-click>
    <text class="dl-dg-small is-good" x="10" y="182">after softmax:</text>
    <text class="dl-dg-small is-good" x="10" y="198">1, 0, 0 · 0.5, 0.5, 0 · 0.79, 0.11, 0.11</text>
  </g>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

- In training, the decoder sees the **whole** right answer at once
- Position *t* must not read the words after *t*: those are the answer
- So the future cells get **−∞** before the softmax, and weight $e^{-\infty} = 0$

</v-clicks>

<div v-click class="dl-math-sm">

$$
\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}} + M\right) V
$$

</div>

</div>
</div>

<div v-click class="mt-2 dl-callout">

The mask blocks the future. Each word is predicted from the words before it only.

</div>

<!--
The point: the decoder's self-attention is the same attention as the encoder's,
with one change. A position may only read itself and the positions before it.

On screen, left: a 3 by 3 grid of scaled scores, that is q·k divided by the
square root of d_k, for the decoder input "⟨start⟩ i am". Rows are the asking
position, columns the position being read. Every cell to the right of the
diagonal is red and holds minus infinity.

Click: the first bullet. During training we hand the decoder the whole correct
output sentence at once, so it can learn every position in one pass. That is
efficient, but it means the answer is sitting in the input.

Click 2: the second bullet. The position that must predict "am" would simply
copy it from the next position if it could see it. The loss would go to zero and
the model would learn nothing useful.

Click 3: the third bullet. We add minus infinity to those scores. The
exponential of minus infinity is zero, so they get zero weight.

Click 4: the equation. It is the attention line from earlier with one extra term,
the mask M, added before the softmax. The next slide reads it symbol by symbol.

Click 5: the softmax rows at the bottom of the picture. Row 1 is 3, −∞, −∞: only
one live score, so weight 1, 0, 0. Row 2 is 1, 1, −∞: two equal scores, so 0.5,
0.5, 0. Row 3 has no masked cell: 2, 0, 0 gives e^2 = 7.39 and two 1s, total
9.39, so 0.79, 0.11, 0.11.

Click 6: the callout.

At inference time the future words do not exist yet, so the mask changes
nothing. It exists so that training sees the same situation as writing.

Class cut: about 3 minutes. In the full slides it is followed by "Reading the
equation: the mask".
-->

---
layout: default
title: "Reading the equation: the mask"
---

# Reading the equation: the mask

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $Q, K, V$ | queries, keys, values | one row per decoder position | 3 rows |
| $QK^\top$ | score matrix | every query dotted with every key | $3 \times 3$ |
| $\sqrt{d_k}$ | scale | square root of the key width | $\sqrt{64} = 8$ |
| $M$ | mask | 0 where $j \le i$, $-\infty$ where $j > i$ | upper triangle $-\infty$ |
| $i, j$ | row, column | asking position, position read | row 2 reads *i* |
| $\operatorname{softmax}$ | softmax per row | positive weights, each row sums to 1 | $0.5, 0.5, 0$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 280 120" class="dl-diagram" role="img" aria-label="Row 2: scores 1, 1, minus infinity, add the mask row 0, 0, minus infinity, softmax gives 0.5, 0.5, 0">
  <g v-for="(row, r) in [['scores', ['1', '1', '−∞']], ['softmax', ['0.5', '0.5', '0']]]" :key="r">
    <text class="dl-dg-small" x="66" :y="40 + r * 50" text-anchor="end">{{ row[0] }}</text>
    <g v-for="(v, c) in row[1]" :key="c">
      <rect :class="c === 2 ? 'dl-dg-box is-bad' : 'dl-dg-box'" :x="76 + c * 64" :y="20 + r * 50" width="56" height="32" rx="3" />
      <text class="dl-dg-lab is-sm" :x="104 + c * 64" :y="41 + r * 50" text-anchor="middle">{{ v }}</text>
    </g>
  </g>
  <text class="dl-dg-small" x="76" y="114">row for the position reading "i"</text>
</svg>

<div v-click class="dl-callout">

$e^{1} / (e^{1} + e^{1} + e^{-\infty}) = 2.72 / 5.44 = 0.5$

The third weight is $0 / 5.44 = 0$.

</div>

</div>
</div>

<!--
The legend reads the masked attention line symbol by symbol. One row per click,
then the worked example.

Clicks 1 to 6: Q, K and V have one row per decoder position; three here. QK^T is
every query dotted with every key, a 3 by 3 grid. The square root of d_k is the
scale; in the paper d_k = 64, so it is 8. M is the mask: zero on and below the
diagonal, minus infinity above it. Adding zero changes nothing; adding minus
infinity kills the score. i is the row, the asking position; j the column, the
position read. The softmax runs along each row.

Click 7: row 2 worked by hand. Scores 1, 1, minus infinity. e^1 is 2.72, so the
sum is 2.72 + 2.72 + 0 = 5.44, and each live weight is exactly 0.5. The masked
weight is 0.

Which symbols are learned: none of these directly. Q, K and V come from learned
matrices; M is fixed by hand and has nothing to learn.

In code the mask is usually a boolean triangle, and the scores are filled with a
very large negative number. The effect is the same.
-->

---
layout: default
title: "In words: No looking ahead: the mask"
---

# In words: No looking ahead: the mask

<div class="dl-describe">

- In training, the decoder gets the whole correct sentence at once. Without a
  rule, each position could copy the next word.
- The mask $M$ adds $-\infty$ to every score to the right of the diagonal, the
  red cells. Their softmax weight becomes $e^{-\infty} = 0$.
- So the full line is $\operatorname{softmax}(QK^\top / \sqrt{d_k} + M)\,V$.
- Row 1 (scores $3, -\infty, -\infty$) becomes $1, 0, 0$. Row 2 ($1, 1,
  -\infty$) becomes $0.5, 0.5, 0$.
- So the model learns to predict a word from earlier words alone.

</div>

<!--
The point: covers "No looking ahead: the mask" and its "Reading the equation"
slide. Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
core: true
title: Encoder–decoder attention
---

# Encoder–decoder attention

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 640 230" class="dl-diagram" style="max-height: 12rem" role="img" aria-label="The decoder position about to write am sends its query down to the three encoder outputs je, suis, étudiant; the line to suis is thickest at 0.8">
  <text class="dl-dg-small" x="320" y="16" text-anchor="middle">decoder: the position about to write "am"</text>
  <circle class="dl-dg-dot is-accent" cx="320" cy="44" r="13" />
  <text class="dl-dg-in" x="320" y="49" text-anchor="middle" style="fill: var(--dl-bg)">q</text>
  <text class="dl-dg-small is-good" x="346" y="48">query from the decoder layer below</text>
  <g v-click>
    <line class="dl-dg-line is-muted" x1="312" y1="56" x2="140" y2="150" style="stroke-width: 1.6" />
    <line class="dl-dg-line" x1="320" y1="58" x2="320" y2="150" style="stroke-width: 9" />
    <line class="dl-dg-line is-muted" x1="328" y1="56" x2="500" y2="150" style="stroke-width: 1.6" />
    <text class="dl-dg-small" x="214" y="98" text-anchor="end">0.1</text>
    <text class="dl-dg-small is-good" x="332" y="110">0.8</text>
    <text class="dl-dg-small" x="426" y="98">0.1</text>
  </g>
  <rect class="dl-dg-box" x="100" y="152" width="80" height="30" rx="4" />
  <rect class="dl-dg-box is-accent" x="280" y="152" width="80" height="30" rx="4" />
  <rect class="dl-dg-box" x="460" y="152" width="80" height="30" rx="4" />
  <text class="dl-dg-lab is-sm" x="140" y="172" text-anchor="middle">je</text>
  <text class="dl-dg-lab is-sm" x="320" y="172" text-anchor="middle">suis</text>
  <text class="dl-dg-lab is-sm" x="500" y="172" text-anchor="middle">étudiant</text>
  <text class="dl-dg-small" x="320" y="204" text-anchor="middle">keys and values from the top encoder's output</text>
  <text class="dl-dg-small" x="320" y="222" text-anchor="middle">weights drawn to show the idea, not from a trained model</text>
</svg>
</div>

<v-clicks>

- **Query**: from the decoder. "What do I need to write next?"
- **Keys and values**: from the encoder's output. "What did the input say?"

</v-clicks>

<div v-click class="mt-2 dl-callout">

Same attention. Only the sources differ: $Q$ from one stack, $K$ and $V$ from the other.

</div>

<!--
The point: encoder–decoder attention is the same scaled dot-product attention,
with the queries taken from one place and the keys and values from another.

On screen: at the top, one decoder position, the one about to write "am". Its
query is the accent dot. At the bottom, the three encoder outputs for "je",
"suis" and "étudiant". The weights are drawn by hand; the slide says so.

Click: the three lines appear, as thick as their weight. 0.1 on "je", 0.8 on
"suis", 0.1 on "étudiant". To write "am", the decoder looks mostly at "suis",
the French word for "am". The weights add up to 1, as every softmax row does.

Click 2: the queries. They come from the decoder layer just below this one, so
they carry what has been written so far.

Click 3: the keys and values. They are the K and V made from the top encoder's
output, the same ones handed to every decoder.

Click 4: the callout. Nothing new is computed here: score, scale, softmax, and a
weighted sum of values. There is no mask in this layer, because the whole input
sentence is known.

So a decoder has three sub-layers, each with add and norm: masked
self-attention, encoder–decoder attention, and the feed-forward network.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Encoder–decoder attention"
---

# In words: Encoder–decoder attention

<div class="dl-describe">

- The accent dot at the top is the query of one decoder position: the one about
  to write *am*. It comes from the decoder layer below.
- The three boxes at the bottom are the encoder's outputs for *je*, *suis* and
  *étudiant*. They supply the keys and the values.
- Each line is as thick as its attention weight: 0.1, 0.8 and 0.1. To write
  *am*, the decoder reads mostly *suis*. These weights are drawn, not trained.
- The computation is ordinary attention. There is no mask, because the whole
  input sentence is known.

</div>

<!--
The point: queries from the decoder, keys and values from the encoder. Twenty
seconds; skip in the lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: "From a vector to a word: linear and softmax"
---

# From a vector to a word: linear and softmax

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 680 230" class="dl-diagram" role="img" aria-label="The decoder's 512-number output goes through a linear layer to six logits, 0.5 0.2 2.6 0.1 0.4 -0.5, then softmax to probabilities 0.08 0.06 0.69 0.06 0.08 0.03; the largest is i">
  <defs>
    <marker id="tv2s5-out-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box is-accent" x="10" y="40" width="34" height="150" rx="4" />
  <text class="dl-dg-small" x="27" y="210" text-anchor="middle">512 numbers</text>
  <text class="dl-dg-small" x="27" y="26" text-anchor="middle">decoder</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-out-head)" d="M48 115 H72" />
  <polygon class="dl-dg-net" points="76,70 156,40 156,190 76,160" />
  <text class="dl-dg-in" x="116" y="120" text-anchor="middle">linear</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s5-out-head)" d="M160 115 H184" />
  <g v-click>
    <text class="dl-dg-small" x="252" y="26" text-anchor="middle">logits: one score per word</text>
    <line class="dl-dg-split" x1="252" y1="40" x2="252" y2="190" />
    <g v-for="(b, i) in [['a', 0.5], ['am', 0.2], ['i', 2.6], ['thanks', 0.1], ['student', 0.4], ['⟨eos⟩', -0.5]]" :key="'z' + i">
      <text class="dl-dg-small" x="228" :y="56 + i * 25" text-anchor="end">{{ b[0] }}</text>
      <rect :class="b[1] < 0 ? 'dl-dg-bar is-bad' : 'dl-dg-bar'" :x="b[1] < 0 ? 252 + b[1] * 30 : 252" :y="45 + i * 25" :width="Math.abs(b[1]) * 30" height="14" rx="2" />
      <text class="dl-dg-small" :x="b[1] < 0 ? 262 : 258 + b[1] * 30" :y="56 + i * 25">{{ b[1] }}</text>
    </g>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#tv2s5-out-head)" d="M380 115 H420" />
    <text class="dl-dg-small" x="400" y="105" text-anchor="middle">softmax</text>
    <text class="dl-dg-small" x="520" y="26" text-anchor="middle">probabilities: sum to 1</text>
    <line class="dl-dg-split" x1="490" y1="40" x2="490" y2="190" />
    <g v-for="(b, i) in [['a', 0.08], ['am', 0.06], ['i', 0.69], ['thanks', 0.06], ['student', 0.08], ['⟨eos⟩', 0.03]]" :key="'p' + i">
      <text class="dl-dg-small" x="482" :y="56 + i * 25" text-anchor="end">{{ b[0] }}</text>
      <rect :class="i === 2 ? 'dl-dg-bar is-q' : 'dl-dg-bar'" x="490" :y="45 + i * 25" :width="b[1] * 120" height="14" rx="2" />
      <text class="dl-dg-small" :x="496 + b[1] * 120" :y="56 + i * 25">{{ b[1].toFixed(2) }}</text>
    </g>
  </g>
  <g v-click>
    <text class="dl-dg-lab" x="645" y="110" text-anchor="middle">"i"</text>
    <text class="dl-dg-small is-good" x="645" y="128" text-anchor="middle">the largest</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

A linear layer gives one score per vocabulary word. Softmax turns the scores into probabilities.

</div>

<!--
The point: the last decoder outputs a vector of numbers, and two familiar pieces
turn it into a word — a fully connected layer and a softmax.

On screen, left: the top decoder's output for one position, a vector of 512
numbers. The trapezoid is a linear layer, a fully connected layer with no
activation after it.

Click: the logits. The linear layer makes one score per word in the vocabulary.
In Alammar's example the vocabulary has 10 000 English words, so 10 000 logits.
Our toy vocabulary has six words: 0.5, 0.2, 2.6, 0.1, 0.4 and −0.5. The negative
one is drawn in red to the left of the zero line.

Click 2: softmax turns them into probabilities that are positive and sum to 1.
The exponentials are 1.65, 1.22, 13.46, 1.11, 1.49 and 0.61; their total is
19.54. So "i" gets 13.46 / 19.54 = 0.69, and the others 0.08, 0.06, 0.06, 0.08
and 0.03.

Click 3: pick the largest, "i". That is the word written at this step.

Click 4: the callout. The next slide writes this as an equation and names every
symbol.

What the room gets wrong: the linear layer here is not shared with anything
earlier; it is one big matrix of 512 × 10 000 numbers, often the largest single
matrix in the model.

Class cut: about 2 minutes. In the full slides it is followed by "Reading the
equation: the output layer".
-->

---
layout: default
title: "Reading the equation: the output layer"
---

# Reading the equation: the output layer

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div>

<div class="dl-math-sm">

$$
\mathbf{z} = \mathbf{h}\,W_{out} + \mathbf{b}, \qquad \mathbf{p} = \operatorname{softmax}(\mathbf{z})
$$

</div>

<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $\mathbf{h}$ | decoder output | one position, $d_{model}$ numbers (data) | 512 numbers |
| $W_{out}$ | output weights | $d_{model} \times N_{\text{vocab}}$ matrix, learned | $512 \times 10\,000$ |
| $\mathbf{b}$ | bias | $N_{\text{vocab}}$ numbers, learned | |
| $N_{\text{vocab}}$ | vocabulary size | set by hand | 10 000 (toy: 6) |
| $\mathbf{z}$ | logits | one score per word | $z_i = 2.6$ |
| $\mathbf{p}$ | probabilities | positive, sum to 1 | $p_i = 0.69$ |

</v-clicks>

</div>
</div>
<div>

<svg viewBox="0 0 260 120" class="dl-diagram" role="img" aria-label="exp of each logit: 1.65 1.22 13.46 1.11 1.49 0.61, total 19.54">
  <text class="dl-dg-small" x="10" y="11">e to the power of each logit</text>
  <g v-for="(b, i) in [['a', 1.65], ['am', 1.22], ['i', 13.46], ['thanks', 1.11], ['student', 1.49], ['⟨eos⟩', 0.61]]" :key="i">
    <rect :class="i === 2 ? 'dl-dg-bar is-q' : 'dl-dg-bar'" :x="12 + i * 40" :y="96 - b[1] * 4.4" width="28" :height="b[1] * 4.4" rx="2" />
    <text class="dl-dg-small" :x="26 + i * 40" :y="91 - b[1] * 4.4" text-anchor="middle">{{ b[1] }}</text>
    <text class="dl-dg-small" :x="26 + i * 40" y="112" text-anchor="middle">{{ b[0] }}</text>
  </g>
</svg>

<div v-click class="dl-callout">

Total $= 1.65 + 1.22 + 13.46 + 1.11 + 1.49 + 0.61 = 19.54$

$p_i = 13.46 / 19.54 = 0.69$

</div>

</div>
</div>

<!--
Read the two equations aloud: the logits z are the decoder output h times a
weight matrix, plus a bias. The probabilities p are the softmax of z.

Clicks 1 to 6: one legend row per click. h is data flowing through the model:
the top decoder's 512 numbers for one output position. W_out is learned and has
one column per vocabulary word, so it is 512 by 10 000 in Alammar's example. b is
a learned bias, one number per word. N_vocab is the vocabulary size, chosen by hand
when the vocabulary is built; 6 in our toy. z is the logits, one score per word;
p the probabilities. The vocabulary size gets its own name, N_vocab, so it is
not confused with V, the value matrix.

Click 7: the worked example on the right. Raise e to each logit: 1.65, 1.22,
13.46, 1.11, 1.49, 0.61. Add them: 19.54. Divide: "i" gets 13.46 / 19.54 =
0.69. The picture's bars are those six exponentials.

Why the softmax: it makes the outputs a probability distribution, which is what
the loss in the next section needs.
-->

---
layout: default
title: "In words: From a vector to a word: linear and softmax"
---

# In words: From a vector to a word: linear and softmax

<div class="dl-describe">

1. The top decoder gives one vector $\mathbf{h}$ of 512 numbers per output
   position.
2. A linear layer, $\mathbf{z} = \mathbf{h}\,W_{out} + \mathbf{b}$, makes one
   score per vocabulary word. These scores are the logits.
3. Softmax turns the logits into probabilities $\mathbf{p}$.
4. Toy example, six words: logits $0.5, 0.2, 2.6, 0.1, 0.4, -0.5$. The
   exponentials add up to 19.54. So *i* gets $13.46 / 19.54 = 0.69$.
5. The word with the largest probability, *i*, is written.

With 10 000 words, $W_{out}$ is a $512 \times 10\,000$ matrix.

</div>

<!--
The point: covers the output-layer slide and its "Reading the equation" slide.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: section
index: "06"
---

# Training and decoding

<div class="absolute right-18 top-1/2 -translate-y-1/2"><TransformerGlyph kind="train" :size="190" /></div>

<!--
Section 06, about eleven minutes in the class cut. Do not linger on the divider.

The glyph: on the left, the model's probability bars; on the right, the target,
one tall bar and the rest flat. Training is making the left look like the right.

What this section has to land, in order: the right answer as a one-hot vector;
the loss on one word, −log of the probability given to the right word; the loss
on a sentence as the sum over positions; and two ways to turn probabilities
into a sentence, greedy and beam search. Beam search is compressible if time is
short.
-->

---
layout: default
title: The target, as one-hot vectors
---

# The target, as one-hot vectors

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 560 224" class="dl-diagram" role="img" aria-label="Five rows, one per target word i am a student eos, six columns, one per vocabulary word; each row has a single filled cell">
  <text v-for="(h, c) in ['a', 'am', 'i', 'thanks', 'student', '⟨eos⟩']" :key="'h' + c" class="dl-dg-small" :x="196 + c * 58" y="18" text-anchor="middle">{{ h }}</text>
  <g v-for="(t, r) in [2, 1, 0, 4, 5]" :key="r">
    <text class="dl-dg-small" x="10" :y="48 + r * 38">position {{ r + 1 }}</text>
    <text class="dl-dg-lab is-sm" x="150" :y="48 + r * 38" text-anchor="end">{{ ['i', 'am', 'a', 'student', '⟨eos⟩'][r] }}</text>
    <g v-for="c in 6" :key="c">
      <rect :class="c - 1 === t ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="170 + (c - 1) * 58" :y="28 + r * 38" width="52" height="30" rx="3" />
      <text :class="c - 1 === t ? 'dl-dg-lab is-sm' : 'dl-dg-small'" :x="196 + (c - 1) * 58" :y="48 + r * 38" text-anchor="middle">{{ c - 1 === t ? 1 : 0 }}</text>
    </g>
  </g>
</svg>
</div>

<v-clicks>

- Output vocabulary of six words. In practice: 30 000 to 50 000
- Each right word is a **one-hot** vector: a single 1 in its own column. *am* is $[0, 1, 0, 0, 0, 0]$

</v-clicks>

<!--
The point: before we can measure how wrong the model is, the right answer must
have the same shape as the model's output: one number per vocabulary word.

On screen: six columns, one per word of the toy vocabulary: a, am, i, thanks,
student and the end symbol. Five rows, one per position of the target sentence
"i am a student ⟨eos⟩". Each row has one accent cell holding 1 and five cells
holding 0.

Click: the vocabulary. Alammar uses six words so the picture fits; a real
translation model has tens of thousands.

Click 2: the one-hot vector. "am" is word number 2, so its row is 0, 1, 0, 0, 0,
0. A one-hot vector is already a probability distribution: all of the
probability is on the right word.

About one minute. Not in the class cut: the next slide says "the right word" and
the room knows what a one-hot vector is.
-->

---
layout: default
title: "In words: The target, as one-hot vectors"
---

# In words: The target, as one-hot vectors

<div class="dl-describe">

- The columns are the six vocabulary words: *a, am, i, thanks, student* and
  ⟨eos⟩.
- The rows are the five positions of the target sentence *i am a student
  ⟨eos⟩*.
- Each row is a one-hot vector: a 1 under the right word and 0 everywhere else.
  For example, *am* is $[0, 1, 0, 0, 0, 0]$.
- A one-hot row is the perfect output: all the probability on the right word.
  Training pushes the model's output towards it.

</div>

<!--
The point: the target has the same shape as the output. Twenty seconds; skip in
the lecture if short on time — this slide is for revision.
-->

---
layout: interactive
core: true
heading: "The loss on one word: merci → thanks"
title: "The loss on one word: merci → thanks"
aside-width: 15rem
---

<div style="zoom: 0.72">
<LogitLab
  mode="multiclass"
  :classes="['a', 'am', 'i', 'thanks', 'student', '⟨eos⟩']"
  :logits="[0, 0, 0, 0, 0, 0]"
  :true-class="3"
  :range="[-4, 6]"
/>
</div>

::aside::

Input *merci*, right answer *thanks*.

<v-clicks>

- Untrained: all logits 0, so every word gets $1/6 = 0.17$
- Loss $= -\log 0.17 = 1.79$
- Drag $z$(thanks) up: the loss falls
- Backpropagation nudges **every** weight that way

</v-clicks>

<!--
The point: the loss for one output word is minus the log of the probability the
model gave to the right word. Everything else in training follows from that.

On screen: Alammar's smallest example. The input is the French word "merci",
the right answer "thanks". Each row of the widget is one vocabulary word: its
logit (raw score) on the left, its probability in the middle, and in the last
column the loss for the true word, "thanks".

Click: an untrained model. Its weights are random, so treat its logits as all
zero. Softmax of six equal numbers gives 1/6 = 0.17 each.

Click 2: the loss is −log 0.17 = log 6 = 1.79. This is cross-entropy on one
example: only the probability of the right word enters it.

Click 3: drag the "thanks" slider up to about 3. Its probability climbs to about
0.80 and the loss drops to about 0.22. The other words lose probability, because
the six probabilities always sum to 1.

Click 4: in training nobody drags a slider. Backpropagation computes how each
weight in the whole model should change to raise this one probability, and
gradient descent takes a small step. Repeat over many sentence pairs.

The "+2 to every logit" button shows a softmax fact: adding the same number to
every logit changes nothing.

Class cut: about 4 minutes. In the full slides it is followed by "Reading the
equation: cross-entropy".
-->

---
layout: default
title: "Reading the equation: cross-entropy"
---

# Reading the equation: cross-entropy

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div>

One word: minus the log of the right word's probability. A sentence: add them up.

<div class="dl-math-sm">

$$
L = -\log p_{y}, \qquad L_{\text{sentence}} = \sum_{t=1}^{T} -\log p_t(y_t)
$$

</div>

<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $L$ | loss | one word; whole sentence | 1.79; 1.14 |
| $y$, $y_t$ | target word | the right word (at position $t$) | *thanks* |
| $p_y$, $p_t(y_t)$ | its probability | from the softmax | 0.17 |
| $\log$ | natural log | $\log 1 = 0$, negative below 1 | |
| $t$, $T$ | position, length | $t = 1, \dots, T$ | $T = 5$ |
| $\sum$ | sum | add over all $T$ positions | |

</v-clicks>

</div>
</div>
<div>

<svg viewBox="0 0 260 150" class="dl-diagram" role="img" aria-label="Probability 0.17 gives loss 1.79; probability 0.9 gives loss 0.11">
  <line class="dl-dg-split" x1="20" y1="120" x2="240" y2="120" />
  <rect class="dl-dg-bar is-bad" x="40" y="50" width="50" height="70" rx="2" />
  <rect class="dl-dg-bar is-q" x="160" y="116" width="50" height="4" rx="2" />
  <text class="dl-dg-small" x="65" y="44" text-anchor="middle">loss 1.79</text>
  <text class="dl-dg-small" x="185" y="110" text-anchor="middle">loss 0.11</text>
  <text class="dl-dg-small" x="65" y="138" text-anchor="middle">p = 0.17</text>
  <text class="dl-dg-small" x="185" y="138" text-anchor="middle">p = 0.90</text>
</svg>

<div v-click class="dl-callout">

$-\log \tfrac{1}{6} = \log 6 = 1.79$

Trained sentence: $0.22 + 0.29 + 0.36 + 0.16 + 0.11 = 1.14$

</div>

</div>
</div>

<!--
Read it aloud: the loss on one word is minus the log of the probability the model
gave to the right word. The loss on a sentence is the same thing added up over
every position.

Clicks 1 to 5: one legend row per click. y is the target word, data from the
training pair. p_y is its probability, the output of the softmax. log is the
natural logarithm: log 1 is 0, and the log of anything below 1 is negative,
which is why there is a minus sign. t counts output positions from 1 to T; for
"i am a student ⟨eos⟩", T = 5. The sum adds the five terms.

Click 6: the arithmetic. Untrained, p = 1/6, so the loss is log 6 = 1.79 per
word and 8.96 for five words. Trained, the right words get 0.80, 0.75, 0.70,
0.85 and 0.90. Their −logs are 0.22, 0.29, 0.36, 0.16 and 0.11, which add up to
1.14.

The picture: the bar is the loss. A small probability gives a tall loss; a
probability near 1 gives a loss near 0. A probability of exactly 0 would give an
infinite loss, which is one reason the softmax never outputs exactly 0.

This is ordinary cross-entropy against a one-hot target. Alammar also mentions
the Kullback–Leibler divergence; against a one-hot target, minimising it is
the same as minimising cross-entropy.
-->

---
layout: default
title: "In words: The loss on one word: merci → thanks"
---

# In words: The loss on one word: merci → thanks

<div class="dl-describe">

- The input is *merci*; the right answer is *thanks*.
- An untrained model gives all six words logit 0, so each gets probability
  $1/6 = 0.17$.
- The loss is $L = -\log p_{y}$, minus the log of the right word's probability:
  $-\log 0.17 = 1.79$.
- Raising the *thanks* logit raises its probability and lowers the loss. A
  probability of 0.90 gives a loss of 0.11.
- Backpropagation finds how every weight should change to do this. Gradient
  descent takes the step.
- For a sentence, add the losses of all its positions.

</div>

<!--
The point: covers the merci → thanks widget and its "Reading the equation"
slide. Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
title: "Poll: the loss of a model that knows nothing"
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="An untrained model gives all six words the same probability. What is the loss on one word?"
  :items="[
    '0, because it has not made a mistake yet',
    '1/6 ≈ 0.17',
    'log 6 ≈ 1.79',
    '6',
  ]"
/>

</div>
<div class="mt-10">

<svg viewBox="0 0 240 150" class="dl-diagram" role="img" aria-label="Six equal probability bars, one ringed as the right word">
  <line class="dl-dg-split" x1="10" y1="110" x2="230" y2="110" />
  <g v-for="i in 6" :key="i">
    <rect :class="i === 4 ? 'dl-dg-bar is-q' : 'dl-dg-bar'" :x="i * 34 - 18" y="80" width="26" height="30" rx="2" />
    <text class="dl-dg-small" :x="i * 34 - 5" y="74" text-anchor="middle">1/6</text>
  </g>
  <text class="dl-dg-small is-good" x="115" y="130" text-anchor="middle">the right word gets 1/6 too</text>
</svg>

</div>
</div>

<div v-click class="mt-4 dl-reveal">

log 6 ≈ 1.79

</div>

<div v-click class="mt-2 dl-secondary">

The loss is $-\log p_y$ with $p_y = 1/6$, and $-\log \tfrac16 = \log 6$.

</div>

<!--
The point: the loss of a model that knows nothing is not zero. It is log of the
vocabulary size. This is a useful sanity check on the first training step of any
real model.

On screen beside the question: six equal bars, each 1/6. The accent bar is the
right word; it gets 1/6 like every other word.

Hands up for each option before revealing.

Click: the answer, log 6 ≈ 1.79.

Click 2: why. The loss is minus the log of the probability on the right word,
and that probability is 1/6.

Why each wrong answer is tempting. Option 1: "no mistake yet" — but the model
has made a prediction, a bad one, and the loss measures how bad. Option 2 is the
probability, not the loss; students forget the −log. Option 4 is 1/p without the
log.

The general rule: with a vocabulary of N words, an untrained model starts at a
loss of about log N. For 10 000 words that is 9.2. If a real model's first loss
is far from log N, something is wrong with the set-up.

About 4 minutes. Not in the class cut by default; swap it in if the room is
quiet.
-->

---
layout: default
title: "In words: Poll: the loss of a model that knows nothing"
---

# In words: Poll: the loss of a model that knows nothing

<div class="dl-describe">

- The picture shows six equal bars. An untrained model gives each word
  probability $1/6$, and the right word, in accent, is no exception.
- The loss is $-\log p_y$. Here $p_y = 1/6$, so the loss is
  $-\log \tfrac16 = \log 6 = 1.79$.
- It is not 0: the model did predict, and badly.
- It is not 0.17: that is the probability, before the $-\log$.
- With a vocabulary of $N_{\text{vocab}}$ words, an untrained model starts near
  a loss of $\log N_{\text{vocab}}$. That is a quick check on a new training run.

</div>

<!--
The point: the answer to the poll and why. Twenty seconds; skip in the lecture
if short on time — this slide is for revision.
-->

---
layout: interactive
core: true
heading: A whole sentence
title: A whole sentence
aside-width: 16rem
clicks: 5
---

<DecodeLoop mode="untrained" :loss="true" :step="$clicks" />

::aside::

The sentence loss adds one $-\log p$ per position.

<v-clicks>

- Untrained: $1.79$ per word, $8.96$ in total
- Press *Show a trained model*: $1.14$ in total
- In training the decoder is fed the **right** previous words, not its own guesses (teacher forcing)

</v-clicks>

<!--
The point: a sentence is trained position by position, and its loss is the sum
of the per-position losses.

On screen: the same decoding widget as before, now with a loss row at the bottom.
It starts with an untrained model: every bar is 1/6, and the ringed word is the
right one.

Click: step 1. Loss for "i" is −log(1/6) = 1.79. The first aside bullet: every
position will add 1.79.

Click 2: step 2, another 1.79. The second bullet: after training, press the
switch button in the widget to show the trained model; its five losses are 0.22,
0.29, 0.36, 0.16 and 0.11, total 1.14.

Click 3: step 3. The third bullet: teacher forcing. During training, the
decoder's input at each position is the correct previous word, not what the
model just guessed. With the mask, that lets all five positions be computed and
trained in one pass.

Clicks 4 and 5: steps 4 and 5. The untrained total reaches 5 × 1.79 = 8.96. The
untrained model writes "a a a a a": every bar ties, so the first word wins each
time. That output means nothing.

What the room gets wrong: they assume training also runs one word at a time.
Only writing does. Training sees the whole target and uses the mask.

Class cut: about 4 minutes.
-->

---
layout: default
title: "In words: A whole sentence"
---

# In words: A whole sentence

<div class="dl-describe">

- The target is *i am a student ⟨eos⟩*: five positions.
- Each position adds its own loss, $-\log p$ of the right word.
- An untrained model gives every word $1/6$, so each position costs 1.79 and
  the sentence costs $5 \times 1.79 = 8.96$.
- A trained model gives the right words 0.80, 0.75, 0.70, 0.85 and 0.90. The
  losses are 0.22, 0.29, 0.36, 0.16 and 0.11: 1.14 in total.
- In training, the decoder is given the right previous words (teacher forcing).
  With the mask, all positions train at once.

</div>

<!--
The point: the sentence loss is a sum, and training is parallel over positions.
Thirty seconds; skip in the lecture if short on time — this slide is for
revision.
-->

---
layout: default
core: true
title: Greedy or beam search
---

# Greedy or beam search

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 220" class="dl-diagram" style="max-height: 11.5rem" role="img" aria-label="Step 1 keeps i 0.80 and a 0.08. Step 2 extends both: i am 0.60, i a 0.08, a student 0.032, a am 0.016. Beam size 2 keeps i am and i a">
  <defs>
    <marker id="tv2s6-beam-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="60" y="16" text-anchor="middle">start</text>
  <text class="dl-dg-small" x="250" y="16" text-anchor="middle">step 1</text>
  <text class="dl-dg-small" x="500" y="16" text-anchor="middle">step 2: score = product</text>
  <rect class="dl-dg-box" x="20" y="96" width="80" height="30" rx="4" />
  <text class="dl-dg-lab is-sm" x="60" y="116" text-anchor="middle">⟨start⟩</text>
  <path class="dl-dg-arrow" marker-end="url(#tv2s6-beam-head)" d="M100 104 L196 66" />
  <path class="dl-dg-arrow" marker-end="url(#tv2s6-beam-head)" d="M100 118 L196 156" />
  <rect class="dl-dg-box is-accent" x="200" y="48" width="100" height="32" rx="4" />
  <text class="dl-dg-lab is-sm" x="250" y="69" text-anchor="middle">i  0.80</text>
  <rect class="dl-dg-box" x="200" y="140" width="100" height="32" rx="4" />
  <text class="dl-dg-lab is-sm" x="250" y="161" text-anchor="middle">a  0.08</text>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#tv2s6-beam-head)" d="M300 58 L416 36" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s6-beam-head)" d="M300 70 L416 84" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s6-beam-head)" d="M300 150 L416 136" />
    <path class="dl-dg-arrow" marker-end="url(#tv2s6-beam-head)" d="M300 162 L416 184" />
    <rect class="dl-dg-box is-accent" x="420" y="22" width="220" height="28" rx="4" />
    <text class="dl-dg-small" x="430" y="41">i am: 0.80 × 0.75 = 0.60</text>
    <rect class="dl-dg-box is-accent" x="420" y="70" width="220" height="28" rx="4" />
    <text class="dl-dg-small" x="430" y="89">i a: 0.80 × 0.10 = 0.08</text>
    <rect class="dl-dg-box is-bad" x="420" y="122" width="220" height="28" rx="4" />
    <text class="dl-dg-small" x="430" y="141">a student: 0.08 × 0.40 = 0.032</text>
    <rect class="dl-dg-box is-bad" x="420" y="170" width="220" height="28" rx="4" />
    <text class="dl-dg-small" x="430" y="189">a am: 0.08 × 0.20 = 0.016</text>
  </g>
  <text class="dl-dg-small" x="330" y="214" text-anchor="middle">toy numbers; beam size 2 keeps the two accent boxes</text>
</svg>
</div>

<v-clicks>

- **Greedy**: keep only the top word at each step
- **Beam search** (size 2): keep the 2 best partial sentences; score = product of probabilities

</v-clicks>

<div v-click class="mt-1 dl-callout">

Beam search can recover from a wrong first word. Beam size is set by hand.

</div>

<!--
The point: the model gives probabilities; turning them into one sentence is a
separate choice, made after training.

On screen: a small search tree with made-up numbers. From the start symbol, the
two most likely first words: "i" at 0.80 and "a" at 0.08.

Click: step 2. Each kept sentence is extended by its two best next words. A
partial sentence is scored by multiplying its word probabilities: "i am" is 0.80
× 0.75 = 0.60, "i a" is 0.80 × 0.10 = 0.08, "a student" is 0.08 × 0.40 = 0.032,
"a am" is 0.08 × 0.20 = 0.016. With a beam size of 2 we keep the best two, the
accent boxes, and drop the red ones.

Click 2: greedy decoding. Keep the single top word at each step: "i", then
"am". It is what the decoding widget did. It is fast, but a wrong first word can
never be undone.

Click 3: beam search keeps several candidates alive, so a sentence that starts
less likely but continues much better can still win.

Click 4: the callout. In Alammar's description there are two settings: the beam
size (how many partial sentences to keep) and the number of finished sentences
to return. Both are hyperparameters, set by hand.

In this toy example greedy and beam agree on "i am". That is common; beam search
matters most when the first steps are uncertain. In practice the scores are sums
of log-probabilities, not products, to avoid tiny numbers.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: Greedy or beam search"
---

# In words: Greedy or beam search

<div class="dl-describe">

- The tree starts at ⟨start⟩. Step 1 keeps the two best first words: *i* (0.80)
  and *a* (0.08).
- Step 2 extends each of them. A partial sentence is scored by multiplying its
  probabilities: *i am* is $0.80 \times 0.75 = 0.60$.
- With beam size 2, the two best survive: *i am* (0.60) and *i a* (0.08). The
  red boxes are dropped.
- Greedy decoding keeps only the single best word at each step.
- If the best first word turns out wrong, beam search still holds a second
  option. The beam size is a hyperparameter, set by hand. The numbers are toy
  numbers.

</div>

<!--
The point: two ways to turn probabilities into a sentence. Twenty seconds; skip
in the lecture if short on time — this slide is for revision.
-->

---
layout: default
core: true
title: The whole transformer, in one picture
---

# The whole transformer, in one picture

<div class="grid grid-cols-4 gap-x-4 gap-y-2 mt-2">
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="encdec" :size="70" />
  <span class="dl-secondary">Encoders read, decoders write</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="qkv" :size="70" />
  <span class="dl-secondary">Score, scale, softmax, sum</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="heads" :size="70" />
  <span class="dl-secondary">Many heads, joined by $W_O$</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="position" :size="70" />
  <span class="dl-secondary">Position added to each word</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="block" :size="70" />
  <span class="dl-secondary">Add and norm around each sub-layer</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="decoder" :size="70" />
  <span class="dl-secondary">Mask, then read the encoder</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <TransformerGlyph kind="train" :size="70" />
  <span class="dl-secondary">Loss: −log p of the right word</span>
</div>
<div class="flex flex-col items-center justify-center text-center gap-1 dl-secondary">

$\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$

</div>
</div>

<div v-click class="mt-3 dl-callout">

Every word reads every other word, in one weighted sum. The rest makes that stackable and trainable.

</div>

<div class="mt-2 dl-secondary">
  <Citation source="Alammar, J. (2018). The Illustrated Transformer" url="https://jalammar.github.io/illustrated-transformer/" />
  ·
  <Citation source="Vaswani et al. (2017). Attention Is All You Need" url="https://arxiv.org/abs/1706.03762" />
</div>

<!--
The point: the whole deck in seven pictures, in the order the data flows.

On screen: the seven section glyphs, each with one line. Walk them left to
right, top to bottom, and ask the room to say each line before you do.

Encoders read, decoders write: six encoders turn the input into one vector per
word; six decoders write the output one word per step.

Score, scale, softmax, sum: self-attention. For "Thinking Machines", Thinking's
weights were 0.89 and 0.11.

Many heads: several attention layers in parallel, their outputs joined and
multiplied by W_O.

Position: a fixed vector of sines and cosines is added to each word, because
attention alone ignores order.

Add and norm: a residual connection and layer normalisation around every
sub-layer.

The decoder: masked self-attention, then encoder–decoder attention with K and V
from the encoder.

The loss: −log of the probability on the right word, summed over the sentence.

The last cell is the one line the whole lecture is built on.

Click: the callout, the sentence to leave with.

Both sources are cited: Alammar's post, which this deck follows, and the 2017
paper.

Class cut: about 2 minutes.
-->

---
layout: default
title: "In words: The whole transformer, in one picture"
---

# In words: The whole transformer, in one picture

<div class="dl-describe">

1. **Two stacks.** Encoders read the input; decoders write the output, one word
   per step.
2. **Self-attention.** Score, scale, softmax, sum: $\operatorname{softmax}(QK^\top/\sqrt{d_k})\,V$.
3. **Many heads.** Several attentions side by side, joined by $W_O$.
4. **Position.** A fixed vector is added to each word, so order is known.
5. **Add and norm.** A residual connection and layer normalisation around every
   sub-layer.
6. **The decoder.** A mask hides future words; then it reads the encoder's $K$
   and $V$.
7. **The loss.** $-\log p$ of the right word, added over the sentence.

</div>

<!--
The point: the recap as a list. Thirty seconds; this slide is for revision.
-->

---
layout: default
title: Going further
---

# Going further

<div class="grid grid-cols-[1fr_3fr] gap-6 mt-3 items-center">
<div class="flex justify-center">
  <TransformerGlyph kind="encdec" :size="150" />
</div>
<div class="flex flex-col gap-3">
  <LinkCard
    href="https://jalammar.github.io/illustrated-transformer/"
    title="The Illustrated Transformer"
    blurb="Jay Alammar's post, which this deck follows. Read it once more with these slides beside it."
  />
  <LinkCard
    href="https://arxiv.org/abs/1706.03762"
    title="Attention Is All You Need"
    blurb="The 2017 paper. Sections 3.1 to 3.5 are the architecture in this deck."
  />
  <LinkCard
    href="https://nlp.seas.harvard.edu/annotated-transformer/"
    title="The Annotated Transformer"
    blurb="The same paper, line by line, as working PyTorch code."
  />
</div>
</div>

<!--
The point: three places to go next, in order of difficulty.

On screen: the two-stack glyph, and three link cards.

First, Alammar's post. It is the source of this deck's examples: Thinking
Machines, the animal and the street, and je suis étudiant. Reading it again with
these slides beside it is the fastest revision.

Second, the paper. Sections 3.1 to 3.5 are short, and after this deck every
symbol in them has a name.

Third, the Annotated Transformer from the Harvard NLP group: the paper with
PyTorch code under each paragraph. It is the place to see the mask, the heads
and the output layer as tensors.

About one minute. Not in the class cut.
-->

---
layout: default
title: "In words: Going further"
---

# In words: Going further

<div class="dl-describe">

Three sources, from easiest to hardest:

- **The Illustrated Transformer** by Jay Alammar. This deck follows it, and
  its three examples come from it.
- **Attention Is All You Need** (2017), the paper. Its sections 3.1 to 3.5
  describe the architecture covered here.
- **The Annotated Transformer**. The paper again, with working PyTorch code
  under each part.

Read the post first, with these slides beside it.

</div>

<!--
The point: where to read next. Ten seconds; for revision.
-->

---
layout: end
email: vajira@simula.no
---

# Questions?

<div class="flex justify-center mt-2">
  <TransformerGlyph kind="qkv" :size="120" />
</div>

Each word's new vector is a blend of every word's value.

<!--
Close on the sentence and the attention glyph. Take questions. If time remains,
ask a volunteer to recompute Thinking's two weights, 0.89 and 0.11, on the
board.
-->
