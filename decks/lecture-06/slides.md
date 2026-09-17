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

Last week ended on an architecture that could look anywhere but had to read in
order. Delete the reading-in-order part and almost nothing is lost — that is the
whole idea, and everything since 2017 is built on it.

<!--
One session. The arc: last week's attention was a bolt-on to a recurrent model;
this week it is the entire layer, and the recurrence is gone.

Section 01 is the lecture. Everything else can be compressed if you are running
late, but a room that leaves without being able to compute one attention output
by hand has not learned anything they can build on. Budget forty minutes for
query, key and value, and do not apologise for it.

The running example is three words — "the river bank" — and the payoff arrives
on slide 16: the same weights and the same word, one neighbour changed, and the
output vector swaps ends. Set it up properly on slide 11 so that payoff lands.

Say at the start that this lecture stops at the architecture. How one of these
is actually trained, at what cost, and what happens when you make it very large
is next week.
-->

---
layout: interactive
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
Worth saying explicitly that this is one continuous story and not three
lectures that happen to be adjacent. The transformer is not a new idea bolted
onto week 6 — it is week 6's last slide, taken seriously.
-->

---
layout: section
index: "00"
---

# Delete the recurrence

---
layout: default
title: Where last week stopped
---

# Where last week stopped

We built a recurrent encoder–decoder, found two walls, and knocked one down.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### Wall one — the bottleneck

<v-clicks>

- The decoder saw the source through **one fixed vector**
- **Attention** fixed it: score every encoder state, softmax, weighted sum
- A fresh context at every output step, so nothing has to be summarised in
  advance

</v-clicks>

</div>
<div>

### Wall two — no parallelism

<v-clicks>

- $\mathbf{h}_t$ needs $\mathbf{h}_{t-1}$, so 200 tokens is **200 sequential**
  matrix multiplies
- The batch parallelises. **Time cannot**
- Attention did nothing about this, because the recurrence was still underneath
  it

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Two walls, one fix. The second wall is what this lecture is about.

</div>

<!--
Five minutes of recap, no more, and make it a recap of the *argument* rather
than of the equations. The room needs the last content slide of week 6 in their head
— the one that says no amount of hardware shortens the chain.

If anyone is missing week 6: the one sentence they need is that attention means
"score every position, softmax the scores, take a weighted sum of the values".
That is all of it, and this lecture re-derives it from scratch anyway.
-->

---
layout: default
title: The move
---

# The move

Last week's attention was a **passenger**: a weighted sum bolted onto a recurrent
encoder–decoder that was doing the real work.

<div v-click class="mt-5 dl-callout">

**Attention Is All You Need**, Vaswani et al., 2017. Keep the weighted sum.
Delete everything it was bolted to.

</div>

<div class="dl-tight">

<v-clicks>

- No recurrence. No convolution. Every layer is attention, then a small
  per-position network
- Nothing in a layer waits for anything else in the layer, so the whole sequence
  is processed **at once**
- The title is not a slogan. It is the experimental result: they removed the RNN
  to see what would break, and translation quality went **up**

</v-clicks>

</div>

<div class="mt-4">
  <Citation source="Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser & Polosukhin, Attention Is All You Need (2017)" url="https://arxiv.org/abs/1706.03762" />
</div>

<!--
The third bullet is the one worth saying slowly. The paper is usually taught as
a bold architectural leap; it reads much more like an ablation that got out of
hand. They were trying to make translation train faster on the hardware they
had.

Twelve hours on eight P100s for the base model. The reason that number mattered
is that it is what made everything after it affordable.
-->

---
layout: default
title: What a transformer is
---

# What a transformer is

A stack of identical blocks. Each block does exactly two things, in two
different directions:

<div class="grid grid-cols-2 gap-8 mt-4 dl-tight">
<div v-click>

### Sideways — attention

Every position builds a new vector by **looking at every other position** and
taking a weighted average of what it finds.

<div class="mt-2 dl-secondary">

The only place in the whole architecture where information moves between tokens.

</div>

</div>
<div v-click>

### Upward — a small network

Every position is then pushed through **the same two-layer network, alone**, with
no idea its neighbours exist.

<div class="mt-2 dl-secondary">

And this is where two thirds of the parameters live.

</div>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Mix across positions, then think about each position on its own — six times, or
ninety-six. The rest of the lecture is detail.

</div>

<!--
Give them this sentence before any mathematics, and write it on the board: mix
across positions, then think about each position separately.

The "two thirds of the parameters" line always gets a reaction, and it should —
students arrive believing a transformer is attention with some plumbing. It is
closer to the reverse. Slide 30 does the arithmetic.
-->

---
layout: default
---

<PollSlide
  question="Which of last week's two walls does attention, on its own, knock down?"
  :items="[
    'The bottleneck — one fixed vector for the whole source',
    'The lack of parallelism across time',
    'Both of them',
    'Neither — it needs the recurrence to work at all',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

The bottleneck only

</div>

<div v-click class="mt-2 dl-secondary">

Bahdanau's attention still sat on top of an RNN, so the sequential chain was
untouched. Removing the recurrence is what buys the parallelism — and the point
of today is that attention turns out not to need it.

</div>

<!--
Hands up for each before revealing. Option 3 is the popular wrong answer and it
is worth naming why: attention and parallelism get taught together so often
that students fuse them. They are two separate moves, made three years apart.
-->

---
layout: section
index: "01"
---

# Query, key, value

---
layout: default
title: Start from a lookup
---

# Start from a lookup

A Python dictionary is a lookup: you bring a key, it finds the **exact** match,
it gives you the value.

```python
store = {"river": "waterside", "money": "financial"}
store["river"]        # → 'waterside'    exact match, one winner
store["stream"]       # → KeyError       no match, nothing at all
```

<div class="dl-tight">

<v-clicks>

- The thing you bring is a **query**
- The thing each entry advertises is its **key**
- The thing you get back is its **value**

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Attention is this lookup made **soft**: match by *similarity* rather than
equality, and return a blend of **every** value, weighted by how well each key
matched.

</div>

<!--
This is the framing that makes the three names stop being arbitrary, and it is
worth the ninety seconds. Every student in the room has written store[k] a
thousand times.

Then name the two changes, because everything else follows from them:
  hard match  -> similarity score
  one winner  -> a weighted average of all of them

Both changes exist for the same reason: a hard lookup is not differentiable, and
you cannot backpropagate through a KeyError.
-->

---
layout: default
title: Three roles, one vector
---

# Three roles, one vector

Every token produces all three, from **the same** input vector, through three
**learned** matrices:

<div class="dl-ledger mt-3">

| | question it answers | how it is made | what it is used for |
| --- | --- | --- | --- |
| **query** $\mathbf{q}$ | *what am I looking for?* | $\mathbf{q} = \mathbf{x}W_Q$ | scored against everyone's key |
| **key** $\mathbf{k}$ | *what do I advertise?* | $\mathbf{k} = \mathbf{x}W_K$ | scored against everyone's query |
| **value** $\mathbf{v}$ | *what do I hand over?* | $\mathbf{v} = \mathbf{x}W_V$ | averaged into the output |

</div>

<div v-click class="mt-3 dl-callout">

Three **projections** of one vector — not three stored things. Every token is a
query, a key and a value at once, including when it looks at itself.

</div>

<div v-click class="mt-2 dl-secondary">

$W_Q$, $W_K$ and $W_V$ are the only new parameters, and they learn the usual way.

</div>

<!--
The callout is the misconception to kill early. Students hear "keys and values"
and picture a stored table that the queries are looked up in. There is no table:
the keys and values are computed from the very tokens that are also doing the
querying.

"Including when it looks at itself" earns its place — self-attention always
includes the diagonal, and a surprising number of people assume a token is
excluded from its own row.
-->

---
layout: default
title: The sentence we will use all lecture
---

# The sentence we will use all lecture

<div class="dl-prompt mt-2">

the river bank

</div>

<div class="grid grid-cols-2 gap-10 mt-4 dl-tight">
<div>

<v-clicks>

- Four embedding dimensions, which we will pretend mean **det**, **water**,
  **money**, **thing**
- *river* = $[0, 2, 0, 1]$ — a thing, and watery
- *bank* = $[0, 0, 0, 2]$ — a thing, and **nothing else**

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

*bank* arrives **empty of sense**. Nothing in its vector says riverbank rather
than high-street bank, because the word on its own does not say.

</div>

<div v-click class="mt-3">

So the information has to come from a neighbour. Attention is how it gets there.

</div>

</div>
</div>

<div v-click class="mt-4 dl-secondary">

These four numbers are hand-picked so the room can check the arithmetic. A
trained model's coordinates mean nothing nameable — as with the embedding widget
in Lecture 05.

</div>

<!--
Spend a minute here. The whole section pays off only if they accept that "bank"
genuinely does not contain the answer.

Ask the room what "bank" means before showing the embedding. You will get both
senses, which is the point: they cannot tell either, from the word alone.

The honesty caveat at the bottom is not optional. Say it out loud — dimension 2
is not "water" in any real model, and a student who leaves believing otherwise
will misread every attention visualisation they ever see.
-->

---
layout: interactive
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

The question that always comes: why does bank's key advertise nothing? Because
in this toy model the "thing" axis carries no sense to offer. In a real model a
word's key advertises plenty — this is a caricature, and the caricature is doing
a job.

If asked whether W_Q, W_K, W_V are shared across positions: yes, one set per
head for the whole sequence. Exactly the weight-sharing argument from weeks 4
and 5, a third time.
-->

---
layout: default
title: Why a key and a value are different things
---

# Why a key and a value are different things

The question every year: *if both come from $\mathbf{x}$, why two matrices?*

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### A library catalogue

<v-clicks>

- The **key** is the spine label — what makes a book **findable**
- The **value** is what is **inside** it
- A useful spine label is short and says what the book is *about*. That is not
  what you want to read

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

*What makes me worth finding* and *what I am worth reading* are different
questions, so the model gets to learn different answers.

</div>

<div v-click class="mt-3 dl-secondary">

Tie them — set $W_K = W_V$ — and it still works, slightly worse. Some efficient
variants deliberately do exactly that.

</div>

</div>
</div>

<div v-click class="mt-4">

In our example: *river* advertises **water** so that *bank* can find it, and then
hands over something else entirely.

</div>

<!--
This slide exists because the question is guaranteed and because "they're just
different projections" is a non-answer that students correctly find
unsatisfying.

The library metaphor holds up well. Push it one step if the room is engaged: the
query is the sentence you say to the librarian, and it is in the same language
as the spine labels, not the same language as the contents. That is why q and k
must share a dimension and v need not.
-->

---
layout: default
title: Four steps, and that is the whole mechanism
---

# Four steps, and that is the whole mechanism

<div class="dl-tight mt-2">

<v-clicks>

1. **Score.** Dot every query against every key: $e_{ij} = \mathbf{q}_i \cdot \mathbf{k}_j$.
   A big dot product means *these two point the same way*
2. **Scale.** Divide by $\sqrt{d_k}$, so the scores do not grow with the width of
   the model
3. **Softmax.** Turn the scores into weights that are positive and sum to 1 —
   one weight per position
4. **Mix.** Take the weighted sum of the **values**. That is the position's new
   vector

</v-clicks>

</div>

<div v-click class="mt-5 dl-callout">

Score, scale, softmax, mix. Steps 1, 3 and 4 are last week's three-line
attention slide, unchanged. Step 2 is new, and it is one division.

</div>

<!--
Write the four words on the board and leave them there for the rest of the
lecture: score, scale, softmax, mix. Every widget that follows is one of these
four.

Say the continuity explicitly. Last week's slide was score, softmax, weighted
sum, and a student who noticed that should be told they were right — the only
genuinely new thing in this lecture is *where the scores come from*, which is
now a dot product between two learned projections instead of a small MLP.
-->

---
layout: interactive
heading: One output vector, five lines
title: One output vector, five lines
aside-width: 18rem
---

<AttentionTrace />

::aside::

*bank* is asking. Keys and values are already there; the **query** is new.

<v-clicks>

- **score** — 0, **2**, 0. Only *river* advertised anything
- **scale** — divide by $\sqrt{2}$
- **softmax** — 0.16, **0.67**, 0.16
- **mix** — two thirds of *river*, and a little of the rest

</v-clicks>

<div v-click class="mt-2 dl-callout">

Line 5 is the one to be able to produce unaided.

</div>

<!--
This is the most important widget in the deck. Do not rush it and do not skip it
because the numbers are small — nobody who cannot do this can read an attention
implementation.

Walk lines 1 to 4 yourself, then stop and hand line 5 to the room: given weights
0.16, 0.67, 0.16 and values [0.2, 0.2], [2.3, 0.3], [0.6, 0.6], what is the
output? Let them do the multiplication. The answer is [1.68, 0.33].

Two things to point at while you are here. The weights sum to exactly 1, which
is why the output is an average rather than something that grows with sentence
length. And "bank" attends 0.16 to itself — the diagonal is always in the sum.

Do not press Swap yet. That is the next slide and it deserves its own beat.
-->

---
layout: interactive
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

The word "contextual" is worth defining here, because students meet it constantly
and rarely get a definition. A word2vec embedding gives "bank" one vector for
life. A transformer gives it a vector per sentence. That difference is this
slide, and it is the difference between 2013 NLP and 2018 NLP.

If someone asks whether the input embedding is now useless: no — it is what the
query and key are computed *from*. Context does not replace the word, it resolves
it.
-->

---
layout: default
title: Why divide by the square root
---

# Why divide by the square root

<div class="grid grid-cols-2 gap-10 mt-2">
<div class="dl-tight">

<v-clicks>

- A dot product of two $d_k$-dimensional vectors is a **sum of $d_k$ terms**
- With unit-ish entries, its typical size grows like $\sqrt{d_k}$
- At $d_k = 64$ the scores are around **eight times** bigger than at $d_k = 1$
- Feed big scores to a softmax and it **saturates**: one weight goes to 1, the
  rest to 0

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

A saturated softmax has **near-zero gradient** everywhere. The layer stops
learning where to look, and it does so silently.

</div>

<div v-click class="mt-3 dl-math-sm">

$$ \alpha_{ij} = \operatorname{softmax}_j\!\left(\frac{\mathbf{q}_i \cdot \mathbf{k}_j}{\sqrt{d_k}}\right) $$

</div>

<div v-click class="mt-2 dl-secondary">

$d_k = 64$ in the 2017 model, so the division is by **8**. One constant, and the
whole reason the mechanism is called *scaled* dot-product attention.

</div>

</div>
</div>

<!--
The vanishing-gradient story from week 5, in a new costume: something saturates,
its derivative goes to zero, learning stops. Third time this term. Name the
pattern.

The paper's own footnote is the argument: if q and k have independent components
with mean 0 and variance 1, their dot product has mean 0 and variance d_k, so
the standard deviation is sqrt(d_k). Dividing by sqrt(d_k) puts the variance back
to 1.

Worth stating that this is not a subtle refinement — without it, deep models with
wide heads simply do not train.
-->

---
layout: interactive
heading: Every query at once
title: Every query at once
aside-width: 18rem
---

<AttentionMatrix :maskable="false" switchable />

::aside::

The same arithmetic for all three rows. Rows **ask**, columns **are read**.

<v-clicks>

- *the* asks nothing, so its row is flat: 0.33 each
- *bank*'s row is the one we just derived
- Every row sums to **1**

</v-clicks>

<div v-click class="mt-2 dl-callout">

No cell depends on any other cell — so all nine are computed **at the same
time**. That is the wall coming down.

</div>

<!--
The callout is the sentence the whole lecture has been walking towards, so say
it deliberately and point at the grid while you do.

Compare it out loud with last week's picture: an RNN computes h_1, then h_2, then
h_3, and cannot start h_2 early. This grid is one matrix multiply. A GPU fills it
in one shot whether the sentence is three words or three thousand.

Hovering a row puts that row's numbers in the readout. The flat row for "the" is
worth pausing on: a token with a zero query gets a uniform average of the whole
sentence, which is a perfectly sensible thing for a stopword to do.
-->

---
layout: default
title: The whole layer, in one line
---

# The whole layer, in one line

<div class="dl-tight">

Stack the queries into a matrix $Q$, the keys into $K$, the values into $V$ — one
row per token — and the four steps become one expression:

</div>

<div class="mt-2">

$$ \operatorname{Attention}(Q, K, V) = \operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V $$

</div>

<div class="dl-tight mt-2">

<v-clicks>

- $QK^\top$ is **step 1** for every pair at once — a $T \times T$ score matrix
- $\sqrt{d_k}$ is **step 2**, one division
- $\operatorname{softmax}$ is **step 3**, taken along each row
- Multiplying by $V$ is **step 4** — the weighted sums, all $T$ of them

</v-clicks>

</div>

<div v-click class="mt-2 dl-callout">

Two matrix multiplies and a softmax. Every transformer is this line.

</div>

<!--
Map each symbol back to the widget as you reveal it. The students have just seen
all four steps as numbers; this slide's only job is to convince them that the
scary line in the paper is those four steps written compactly.

Shapes, which they should check: Q is (T, d_k), K is (T, d_k), so QK^T is (T, T).
V is (T, d_v), so the result is (T, d_v). Have the room confirm the T x T — it is
the shape that comes back to bite in section 02.
-->

---
layout: default
---

<PollSlide
  question="In self-attention over one sentence, where do the keys come from?"
  :items="[
    'A separate memory the model has stored from training',
    'The previous layer\'s output for every token in this same sentence',
    'The decoder, one per output step',
    'The positional encoding',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

The same sentence

</div>

<div v-click class="mt-2 dl-secondary">

Self-attention means the queries, the keys and the values are all projections of
the **same** set of vectors. The word *self* is doing that work. Cross-attention,
in section 03, is the version where they come from two different places.

</div>

<!--
Option 1 is the one to draw out. It is what "the model looks things up" suggests
to a student who has met retrieval systems, and it is wrong in an instructive
way: there is no store, and nothing persists between sentences.

This also sets up cross-attention cleanly — once they are sure self-attention
means one source, "queries from here, keys from there" is an obvious variation
rather than a new mechanism.
-->

---
layout: section
index: "02"
---

# From one head to one block

---
layout: default
title: One softmax can only point at one thing
---

# One softmax can only point at one thing

<div class="dl-prompt mt-2">

the cat ate the fish because **it** was hungry

</div>

<div class="grid grid-cols-2 gap-10 mt-4 dl-tight">
<div>

To process *it*, the model would like to know, all at once:

<v-clicks>

- which word *it* refers to — *cat*
- what the nearby nouns are
- what the previous word was
- what clause it is in

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

One softmax puts its mass in **one** place. Four questions need four sets of
weights.

</div>

<div v-click class="mt-3">

So run the whole mechanism **several times in parallel**, each with its own
$W_Q$, $W_K$, $W_V$. Each copy is a **head**.

</div>

</div>
</div>

<!--
Derive multi-head attention rather than announcing it, the same way week 5
derived the gates. The need has to be felt before the fix is introduced.

Ask the room for the four questions before revealing them. You will get at least
two.

The word "head" has no deeper meaning. It is one independent copy of the
mechanism, and the only reason there are several is that one set of attention
weights can only express one relationship at a time.
-->

---
layout: interactive
heading: Four heads, one question each
title: Four heads, one question each
aside-width: 17rem
---

<MultiHeadLab />

::aside::

*it* is asking. Four heads, four different answers.

<v-clicks>

- **head 1** — the previous word
- **head 3** — back seven words to *cat*
- **head 4** — parks on token 1 and does nothing

</v-clicks>

<div v-click class="mt-2 dl-callout">

Head 4 is not a drawing error. Nearly-dead heads are in every model anyone has
looked inside.

</div>

<!--
Say plainly that these weights are drawn, not trained — a four-dimensional toy
model produces nothing interpretable, and claiming otherwise would be a lie the
students could not detect. The patterns are caricatures of things that do show
up repeatedly in published attention maps.

Head 4 earns its place. "Attention sinks" — heads that dump most of their mass
on the first token — are a robust finding, and they matter practically: they are
why you cannot simply evict the first tokens from a KV cache.

Press Next query word a couple of times so they see the rows change together.
-->

---
layout: default
title: Heads are free
---

# Heads are free

Eight heads do **not** cost eight times one head. Each head is **narrower**.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

<v-clicks>

- $d_{\text{model}} = 512$, $h = 8$, so each head works at
  $d_k = d_v = 512/8 = 64$
- Run all eight, **concatenate** the outputs: $8 \times 64 = 512$ again
- One more matrix, $W_O$, mixes the heads back together

</v-clicks>

</div>
<div>

<div v-click class="dl-math-sm">

$$ \operatorname{MHA}(X) = \left[\operatorname{head}_1 \,\|\, \cdots \,\|\, \operatorname{head}_h\right] W_O $$

</div>

<div v-click class="mt-3 dl-callout">

Four square matrices in total — $W_Q$, $W_K$, $W_V$, $W_O$ — so
$4d^2$ parameters, **whatever $h$ is**.

</div>

</div>
</div>

<div v-click class="mt-4 dl-secondary">

At $d = 512$: $4 \times 512^2 = 1\,048\,576$. One head or thirty-two, the
attention sub-layer costs the same.

</div>

<!--
The parameter-count invariance is the point and it surprises people. In an
implementation there is not even a loop: W_Q is one (d, d) matrix, and the heads
are made by reshaping its output into (h, d/h). Slide 50 shows exactly that line.

W_O is the part most summaries omit. Without it the concatenated output is just
eight independent blocks of 64 numbers with no communication between them, and
the residual stream would have no way to combine what different heads found.

If asked how many heads to use: h such that d/h is 64 or 128 is the near-universal
convention, and the answer has more to do with GPU tiling than with linguistics.
-->

---
layout: interactive
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
- *the river bank* and *bank river the* are the same input here

</v-clicks>

<div v-click class="mt-2 dl-callout">

Last week's entire lecture was that order matters. We have just thrown it away.

</div>

<!--
This should feel like a problem, so let it. Shuffle once, let the room read the
numbers themselves, and wait.

The technical name is permutation equivariance: permute the input and the outputs
permute with it, otherwise unchanged. For a set of points that is a feature —
it is why the same machinery works on graphs and point clouds. For a sentence it
is a bug.

An RNN got order for free, because it read in order. That was the same property
that made it un-parallelisable. We deleted the recurrence; this is the bill.
-->

---
layout: interactive
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
Hover a row to put its first numbers in the readout.

The formula, if anyone wants it: PE(pos, 2i) = sin(pos / 10000^(2i/d)) and the
cosine for the odd index. Wavelengths run from 2π to 10000·2π, so the left
columns are a fast clock and the right columns a slow one — the same trick as
the hands of a watch.

Two questions that always come:

Why add rather than concatenate? Because concatenating would spend model width on
something that is the same for every sentence. Adding works because the embedding
space is large and mostly empty, and the model can learn to keep the two apart.

Why not just learn a position embedding? You can, and BERT and GPT-2 both do.
Learned embeddings cannot extrapolate past the longest training sequence, which
is exactly the problem RoPE later solves properly — slide 44.
-->

---
layout: default
title: The other half of the block
---

# The other half of the block

After attention has mixed the positions, each position goes through the **same
small network, alone**:

<div class="mt-3">

$$ \operatorname{FFN}(\mathbf{x}) = W_2\,\phi\!\left(W_1\mathbf{x} + \mathbf{b}_1\right) + \mathbf{b}_2 $$

</div>

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

<v-clicks>

- Two linear layers and a non-linearity. Lecture 02's MLP
- **Position-wise**: no token sees another. Sixteen tokens is sixteen independent
  applications of one network
- Wide in the middle — $d_{\text{ff}} = 4d$, so $512 \to 2048 \to 512$

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

Attention decides **what to gather**. This decides **what to do with it** — and it
is where the model's stored knowledge is thought to live.

</div>

<div v-click class="mt-3 dl-secondary">

$2 \times 512 \times 2048 = 2\,097\,152$ weights, against 1.05 M for the whole
attention sub-layer. **Two thirds of the block.**

</div>

</div>
</div>

<!--
This slide is routinely skipped and it should not be. A student who thinks a
transformer is only attention cannot explain the parameter count, cannot read an
implementation, and is missing the part that most interpretability work now
points at as the store of factual knowledge.

"Position-wise" is worth making concrete: it is a Linear layer applied to a
(B, T, d) tensor, which PyTorch broadcasts over the first two dimensions
automatically. There is no loop and there is no mixing.

Why 4x: no principled reason. It is what the paper used and what stuck.
-->

---
layout: default
title: Two wrappers that make it stackable
---

# Two wrappers that make it stackable

Each sub-layer is wrapped the same way — and that wrapping is what lets you put
ninety-six of these on top of each other.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### Residual

<v-clicks>

- $\mathbf{x} + \operatorname{SubLayer}(\mathbf{x})$ — **add**, never replace
- The sub-layer proposes an *edit* to a running stream, rather than a new vector
- Same trick as a ResNet, for the same reason: a gradient path with no matrix on
  it

</v-clicks>

</div>
<div>

### LayerNorm

<v-clicks>

- Re-centre and re-scale **each position's own vector**, across its features
- Not BatchNorm: nothing is shared across the batch or across time, so variable
  lengths are safe
- Keeps the scale of the stream from drifting as blocks are added

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Input shape in, **identical shape out**. That is the only reason a block can be
stacked at all.

</div>

<!--
The "residual stream" reading is worth planting, because the interpretability
literature is written in it and the students will meet it: think of a vector per
position running the height of the model, with each sub-layer reading from it and
adding something back.

Week 5's additive-path argument, third appearance — LSTM cell state, ResNet skip,
transformer residual. Same idea each time: give the gradient a route with no
repeated multiplication on it.

LayerNorm versus BatchNorm is a real exam-type question. The one-line answer:
BatchNorm's statistics depend on the other examples in the batch, which is
untenable when sequences have different lengths and at inference with batch 1.
-->

---
layout: interactive
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
Walk all six and read the readout aloud for each; it carries the detail so the
aside does not have to.

The thing to point at repeatedly: only the first box moves information sideways.
Everything else in the block — and, in fact, everything else in the entire
architecture — operates on one position at a time.

This is the 2017 wiring, with the norms after the adds. Do not mention pre-LN
yet; section 04 flips the toggle and the contrast is much sharper if they have
not seen it coming.
-->

---
layout: default
title: What a block costs
---

# What a block costs

<div class="dl-ledger mt-2">

| part | weights | at $d = 512$, $d_{\text{ff}} = 2048$ |
| --- | --- | --- |
| $W_Q, W_K, W_V, W_O$ | $4d^2$ | 1 048 576 |
| feed-forward $W_1, W_2$ | $2 d\, d_{\text{ff}}$ | 2 097 152 |
| two LayerNorms | $4d$ | 2 048 |
| **one encoder block** | | **≈ 3.15 M** |

</div>

<div class="dl-tight mt-3">

<v-clicks>

- $T$ **does not appear**. A six-word sentence and a six-thousand-word document
  use the same weights
- The feed-forward network is **twice** the attention sub-layer
- Six encoder blocks ≈ 18.9 M; six decoder blocks, which have a third sub-layer,
  ≈ 25.2 M

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

Plus a 37 000-word shared embedding at 512 wide — 18.9 M — and the 2017 base
model's **65 M** is accounted for.

</div>

<!--
Do the last line as arithmetic on the board: 18.9 + 25.2 + 18.9 = 63, and the
paper says 65 million. The gap is biases and the final norms. A student who can
rebuild a published parameter count from the architecture understands the
architecture.

Bullet one is the third appearance of the same observation — a convolution's
count does not contain H and W, a recurrent layer's does not contain T, and
neither does this. Weight sharing always buys it.

The embedding being 29% of the model here, against 93% in last week's classifier,
is worth a remark: as models grow, the embedding stops being the story.
-->

---
layout: default
title: The bill for looking everywhere
---

# The bill for looking everywhere

Every position scores against every position, so the score matrix is
$T \times T$.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

<v-clicks>

- 512 tokens → 262 144 scores **per head, per layer**
- Double the length and the attention work goes up **four times**
- An RNN was linear in $T$. This is quadratic

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

The trade we made: an RNN's $T$ **sequential** steps became $T^2$ **parallel**
ones. More total work, far less waiting — and GPUs are built for exactly that
shape.

</div>

<div v-click class="mt-3 dl-secondary">

Honest caveat: the feed-forward network costs $O(T d^2)$ and attention
$O(T^2 d)$, so attention only dominates once $T$ is a few times $d$. At 512
tokens and $d = 512$ it is not the expensive part.

</div>

</div>
</div>

<!--
Both halves matter. The quadratic cost is real and it is why context length was
the central engineering fight of 2020-2024. The caveat is also real and is
usually left out, which leaves students believing attention is the bottleneck at
every scale. It is not — at short context the FFN dominates, and the crossover is
around T = 4d.

Memory is worse than compute here: the T x T matrix has to exist per head per
layer. That is what FlashAttention attacks — not by changing the mathematics but
by never materialising the matrix. Slide 43.
-->

---
layout: section
index: "03"
---

# The original transformer

---
layout: default
title: Two stacks
---

# Two stacks

The 2017 paper was a **translation** model, so it has one stack to read and one
to write.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### Encoder — reads once

<v-clicks>

- Six blocks: self-attention, feed-forward
- **No mask.** Every source token sees every other, in both directions
- Output: one vector per source token — **not** one vector for the sentence

</v-clicks>

</div>
<div>

### Decoder — runs once per output token

<v-clicks>

- Six blocks with **three** sub-layers, not two
- **Masked** self-attention over what it has written so far
- **Cross-attention** into the encoder's output — the only place the stacks meet

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

"One vector per source token" is last week's bottleneck, gone. Nothing is
summarised in advance, because nothing has to be.

</div>

<!--
The callout ties the two lectures together and it is worth pausing on. The
encoder-decoder RNN had to compress the source into a fixed vector because the
decoder could only be handed one thing. Here the decoder can attend, so the
encoder can simply hand over everything.

Three sub-layers in the decoder catches people who have only ever seen the
diagram. Count them on the widget on the next slide.
-->

---
layout: interactive
heading: The architecture, step by step
title: The architecture, step by step
aside-width: 17rem
---

<TransformerStack :layers="6" />

::aside::

Press **Walk the architecture** and follow the data — nine steps, no new boxes.

<v-clicks>

- up the encoder **once**
- then up the decoder **once per word it writes**
- cross-attention is the only wire between them

</v-clicks>

<div v-click class="mt-2 dl-callout">

The famous figure, in the order the data actually moves.

</div>

<!--
This is the slide the 2025 deck had as a single screenshot of the paper's figure.
Walking it is the whole improvement: the figure is unreadable precisely because
it shows everything simultaneously and gives no clue which arrow comes first.

Step 9 is the one to dwell on. The encoder runs once; the decoder runs once per
output token. So the sequence-level parallelism people attribute to transformers
is real in the encoder and real during *training* of the decoder, and is gone at
generation time, where you are back to one token at a time.

That asymmetry is the whole reason the KV cache exists — slide 45.
-->

---
layout: interactive
heading: The mask, and why the loss collapses without it
title: The mask, and why the loss collapses without it
aside-width: 18rem
---

<AttentionMatrix :causal="true" />

::aside::

Position $t$ may read positions $1 \ldots t$, and nothing after.

<v-clicks>

- Row *the* becomes a single **1.00** — nothing to look at but itself
- Rows still sum to 1: the softmax comes **after** the $-\infty$
- Press the button to take the mask off and put it back

</v-clicks>

<div v-click class="mt-2 dl-callout">

Without it, the model reads the answer off its own input.

</div>

<!--
Say what it buys, which is not obvious: because the mask makes position t
independent of everything after t, a whole target sentence can be trained in one
forward pass. Every position is simultaneously a training example, and none of
them can cheat.

That is teacher forcing from week 5, made parallel. The RNN version had to run T
steps to get T training signals.

The implementation detail students get wrong: masking does not skip the
computation. Every score is computed, then the forbidden ones are set to -inf
before the softmax. It saves no work — it only removes the answer.
-->

---
layout: default
title: Cross-attention is last week's slide
---

# Cross-attention is last week's slide

Self-attention takes $Q$, $K$ and $V$ from **one** place. Cross-attention takes
them from **two**.

<div class="mt-2">

$$ \operatorname{Attention}(\underbrace{Q}_{\text{decoder}},\; \underbrace{K,\; V}_{\text{encoder}}) $$

</div>

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

<v-clicks>

- The decoder asks: *what do I need for the word I am about to write?*
- The encoder's output answers, one key and value per source token
- Exactly Bahdanau's 2014 alignment — score, softmax, weighted sum

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

The only difference from last week: a **scaled dot product** for the score, and
no recurrence on either side.

</div>

<div v-click class="mt-3 dl-secondary">

The encoder's K and V are computed **once** and reused for every output token.

</div>

</div>
</div>

<!--
Put last week's German-English widget back on screen mentally: "read" attending
to "gelesen" five words away. That picture is a cross-attention map.

The secondary note is a real optimisation and a good check of understanding: ask
why the encoder's K and V can be cached but the decoder's queries cannot.

If someone asks whether cross-attention is masked: no. The whole source is
available from the start; there is nothing to hide.
-->

---
layout: default
title: The model they actually trained
---

# The model they actually trained

<div class="dl-ledger mt-2">

| | base | big |
| --- | --- | --- |
| blocks per stack $N$ | 6 | 6 |
| model width $d_{\text{model}}$ | 512 | 1024 |
| heads $h$ | 8 | 16 |
| head width $d_k = d_v$ | 64 | 64 |
| feed-forward width $d_{\text{ff}}$ | 2048 | 4096 |
| parameters | 65 M | 213 M |
| training | 12 hours, 8 GPUs | 3.5 days, 8 GPUs |

</div>

<div v-click class="mt-3 dl-callout">

Twelve hours on eight GPUs, and it beat every recurrent translation system of its day.

</div>

<div v-click class="mt-2 dl-secondary">

$d_k = 64$ in both — head width fixed, head **count** growing. Still true today.

</div>

<!--
The 12-hour figure is the one to leave them with. Recurrent systems of comparable
quality were taking days to weeks, because they could not use the hardware. The
architecture's advantage was never only accuracy.

Point at d_k = 64 across both columns. It is still 64 or 128 in models a thousand
times larger, which is worth noticing — almost nothing else about the
architecture survived unchanged.
-->

---
layout: default
---

<PollSlide
  question="Training on a 100-token target sentence, how many forward passes through the decoder does teacher forcing need?"
  :items="[
    '100 — one per output token',
    '1 — the mask makes all 100 positions independent',
    '2 — one forward, one backward',
    '100 at training time and 1 at generation time',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

One

</div>

<div v-click class="mt-2 dl-secondary">

Because position $t$ cannot see past $t$, all 100 positions can be computed
together and each is still an honest next-token prediction. At **generation**
time it is the other way round: 100 passes, one per token, because token 37 does
not exist until it has been sampled.

</div>

<!--
This is the single most useful thing in section 03 and it is worth the two
minutes. The mask is not only a correctness device — it is what makes training
parallel over the sequence, which is the entire economic argument for the
architecture.

Option 4 inverts it, and it is the most instructive wrong answer: it is exactly
backwards, and a student who picks it has the right two facts attached to the
wrong ends.
-->

---
layout: section
index: "04"
---

# Modern transformers

---
layout: interactive
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

Ask which family a sentence-embedding model for search should be, and why. The
answer is encoder-only, and the reason — you have the whole text and want one
vector for it — is exactly the mask.

Whisper being encoder-decoder is a nice detail: audio in, text out, two genuinely
different modalities, so the split earns its keep.
-->

---
layout: default
title: Why decoder-only took over
---

# Why decoder-only took over

Not because it is the most expressive of the three. Because of **what it can
train on**.

<div class="dl-tight mt-3">

<v-clicks>

- "Predict the next token" needs **no labels**, so the training set is every text
  ever written
- Every position in every document is a training example, so one pass over a
  document gives thousands of them
- Any task phrased as text becomes next-token prediction — translation,
  summarising, answering, writing code
- One stack instead of two: simpler to scale, simpler to serve

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

The architectural choice that won was the one whose training data was free.

</div>

<div v-click class="mt-2 dl-secondary">

That story — objective, scale, and what emerges from them — is next week.

</div>

<!--
Resist teaching next week's lecture here. The one sentence they need is the
callout.

The second bullet is under-appreciated and worth a beat: masked language
modelling trains on the 15% of tokens it masked, next-token prediction trains on
essentially 100% of them. That is a several-fold difference in signal per unit of
compute, before anything about scale.

If someone asks whether encoder-only models are obsolete: no. Retrieval and
reranking in production are still full of them, and ModernBERT in 2024 exists
precisely because that niche did not go away.
-->

---
layout: interactive
heading: One wire moved, and deep stacks started training
title: One wire moved, and deep stacks started training
aside-width: 19rem
---

<TransformerBlock variant="pre" start="whole" />

::aside::

Press **Rewire**. One difference: where the normalisation sits.

<v-clicks>

- **post-LN** (2017) — norm *after* the add, **on** the residual path
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

The mechanism: a residual is supposed to provide an identity path so the gradient
can travel without being multiplied. Put a LayerNorm on that path and it is not
an identity any more, and gradient magnitudes at the bottom of a deep post-LN
stack go badly wrong at initialisation. Warmup is the workaround; moving the norm
is the fix.

Anyone who has tried to train a deep transformer from scratch and watched it
diverge in the first hundred steps has met this.
-->

---
layout: default
title: What else changed inside the block
---

# What else changed inside the block

<div class="dl-ledger mt-1">

| | 2017 | a model trained today | why |
| --- | --- | --- | --- |
| normalisation | LayerNorm, after | **RMSNorm**, before | trains deeper, slightly cheaper |
| position | sinusoids added at the bottom | **RoPE**, rotating $Q$ and $K$ | relative, and extrapolates |
| activation | ReLU | **SwiGLU** | consistently better, three matrices |
| attention | 8 heads, all with own $K,V$ | **grouped-query** | shrinks the inference cache |
| biases | everywhere | **dropped** | no measurable loss |
| the kernel | plain matmuls | **FlashAttention** | never builds the $T\times T$ matrix |

</div>

<div v-click class="mt-4 dl-callout">

Six changes, and **none of them touch** $\operatorname{softmax}(QK^\top/\sqrt{d_k})V$.
The mechanism you computed by hand on slide 15 is untouched since 2017.

</div>

<!--
The callout is the point of the slide and of the section. Everything in the table
is an engineering refinement around a core that did not change.

Go across the rows at whatever depth the room wants; none of them is essential.
If time is short, do RoPE and grouped-query and skip the rest — those two are the
ones a student will actually meet in a config file.

FlashAttention is worth one sentence: it is not a different attention, it is the
same attention computed in tiles so the T x T matrix never exists in memory.
Same numbers, several times faster, far less memory.
-->

---
layout: default
title: Position, done properly
---

# Position, done properly

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

### The problem with adding

<v-clicks>

- A sinusoid added at the bottom has to survive every block to still mean
  anything
- What a model actually needs is **relative** position — *three words before me*,
  not *word 412*
- Learned position embeddings cannot go past the longest sentence they were
  trained on

</v-clicks>

</div>
<div>

### RoPE — rotate instead

<v-clicks>

- **Rotate** each query and key by an angle proportional to its position
- The dot product between two rotated vectors then depends only on the
  **difference** of their positions
- Applied inside **every** attention layer, so it cannot fade

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Relative position falls out of the geometry rather than being added on. Every
major open model since Llama uses it.

</div>

<div class="mt-3">
  <Citation source="Su et al., RoFormer: Enhanced Transformer with Rotary Position Embedding (2021)" url="https://arxiv.org/abs/2104.09864" />
</div>

<!--
The one-line intuition: rotating both vectors by the same amount does not change
the angle between them, so only the difference in rotation survives the dot
product. That is relative position, for free, from the geometry.

Do not derive it. The room needs to know what RoPE is for and why "rotary"
appears in every model card they will read.

The extrapolation claim needs a caveat if anyone presses: RoPE extrapolates
better than learned embeddings, not perfectly. Long-context models still need
interpolation tricks on top.
-->

---
layout: default
title: What generation actually costs
---

# What generation actually costs

Writing token 501 means running attention over tokens 1–500 — **which you already
did** when you wrote token 500.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### The KV cache

<v-clicks>

- Keep every layer's keys and values from previous steps
- Each new token computes **one** query and reuses everything else
- Generation goes from $O(T^2)$ per token to $O(T)$

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

And the cache is **enormous**: layers × heads × tokens × $d_k$ × 2, per sequence
in the batch. At long context it, not the weights, is what fills the GPU.

</div>

<div v-click class="mt-3 dl-secondary">

**Grouped-query attention** is the fix: keep all the query heads, let groups of
them **share** one key/value head. Cache shrinks by the group size; quality
barely moves.

</div>

</div>
</div>

<!--
This is the slide that connects the architecture to why serving these models is
hard, and it is the one industry cares most about.

The arithmetic if the room wants it: Llama-2-7B has 32 layers and 32 heads at
d_k = 128, so per token per sequence the cache is 32 x 32 x 128 x 2 x 2 bytes,
about 512 KB. At 4096 tokens that is 2 GB for one conversation. Multiply by the
number of concurrent users.

Grouped-query attention with 8 key/value heads instead of 32 cuts that by four.
That is why it is in essentially every model released since 2023.
-->

---
layout: default
title: The same block, more of it
---

# The same block, more of it

<div class="dl-ledger dl-ledger--scale mt-2">

| | year | blocks | $d_{\text{model}}$ | heads | context | parameters |
| --- | --- | --- | --- | --- | --- | --- |
| Transformer base | 2017 | 6 | 512 | 8 | 512 | 65 M |
| BERT base | 2018 | 12 | 768 | 12 | 512 | 110 M |
| GPT-2 XL | 2019 | 48 | 1600 | 25 | 1024 | 1.5 B |
| GPT-3 | 2020 | 96 | 12288 | 96 | 2048 | 175 B |
| Llama 3.1 70B | 2024 | 80 | 8192 | 64 | 128 k | 70 B |

</div>

<div v-click class="mt-4 dl-callout">

Deeper, wider, longer — and structurally the **same block**. Nobody found a
better one; they found more compute.

</div>

<div v-click class="mt-3 dl-secondary">

Context grew 250-fold. That is the fight the $T^2$ on slide 31 started, and it
was won by engineering — better kernels, cached keys, cheaper positions — not by
replacing attention.

</div>

<!--
Read down the "blocks" column and then down the "parameters" column: depth grew
about 13x and parameters about 1000x, so most of the growth is width, not depth.
Students usually assume the reverse.

The callout is the honest summary of eight years. Several proposed replacements
for attention have been published every year since 2017 and the vanilla block is
still what gets trained. Mamba and the state-space family are the most serious
current challenge, and they are worth one sentence if asked — recurrent models
with a parallelisable scan, which is the RNN's advantage back without the RNN's
sequential training.
-->

---
layout: default
title: What did not change
---

# What did not change

<div class="dl-tight mt-2">

<v-clicks>

- Three projections of every token into a **query**, a **key** and a **value**
- A **dot product** for the score, divided by $\sqrt{d_k}$
- A **softmax** across positions, so the weights are positive and sum to 1
- A **weighted sum of values** as the output
- **Residual** and **normalise** around every sub-layer
- A **position-wise** network holding most of the parameters

</v-clicks>

</div>

<div v-click class="mt-5 dl-callout">

Every line you would write to implement a 2017 transformer's attention still
runs, unchanged, inside a model trained this year.

</div>

<!--
Read the list slowly. This is the summary of the whole lecture and it is
deliberately the same list as section 01 and section 02.

Say the thing the table on the previous slide implies: the reason to teach the
2017 paper in 2026 is not history. It is that the mechanism is still the
mechanism, and a student who understands these six lines can read any model
released this year.
-->

---
layout: section
index: "05"
---

# In PyTorch

---
layout: default
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

<div class="dl-tight mt-2">

<v-clicks>

- Scaling, masking and the softmax are all inside it — `is_causal=True` is the
  triangle
- It dispatches to a fused kernel when it can, so the $T \times T$ matrix is never
  materialised
- Shape convention: **heads are a batch dimension**

</v-clicks>

</div>

<!--
Show this before the hand-rolled version so they know the hand-rolled version is
pedagogy, not practice. Nobody should be writing their own softmax(QK^T/sqrt(d))
in production code.

The shape (B, h, T, d_k) is the thing to memorise. The heads sit between batch
and time precisely so the whole thing is one batched matmul.

Pass an explicit attn_mask instead of is_causal when you have padding as well as
causality — and note that the two masks have to be combined by you, which is the
single most common source of silent wrongness in hand-written transformer code.
-->

---
layout: default
title: Self-attention, written out
---

# Self-attention, written out

```python {all|5-6|10-11|13|15-16|all}{lines:true}
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

<div v-click class="mt-3 dl-secondary">

Fourteen lines, and every one of them is on a slide you have already seen. The
heads are a **reshape**, not a loop — which is why eight of them cost what one
would.

</div>

<!--
Walk the reshape carefully, because it is the only line that is not obvious:
(B, T, d) -> (B, T, h, d_k) -> (B, h, T, d_k). The last transpose is what puts
the heads next to the batch so the matmul treats them as independent problems.

One matrix producing Q, K and V at once is standard and is purely an efficiency
choice — one big matmul beats three small ones. Mathematically it is the three
matrices from slide 10.

bias=False is the modern convention from slide 43's table.

This is nanoGPT's CausalSelfAttention, minus the dropout. Point them at it.
-->

---
layout: default
title: A block, and a stack
---

# A block, and a stack

```python {all|4-8|11-12|16-18|all}{lines:true}
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

<div v-click class="mt-3 dl-secondary">

`x = x + sublayer(norm(x))`, twice. That line **is** the pre-LN block from slide
42, and `nn.Sequential` is the stack.

</div>

<!--
Read the two forward lines aloud as English: normalise a copy, run the sub-layer
on the copy, add the result back to the stream. Then again.

Post-LN would be x = self.n1(x + self.attn(x)), and the difference is exactly the
widget's toggle. Write both on the board side by side if there is time.

GELU rather than ReLU because that is what BERT and GPT-2 used and what most
non-gated models still use. SwiGLU needs three matrices and does not fit the
Sequential, which is why it is not here.
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

<div class="dl-tight mt-2">

<v-clicks>

- `batch_first=True` — same trap as `nn.LSTM`, same silent failure
- `norm_first=True` — the default is the 2017 wiring, which needs warmup
- The parameter count is slide 30's **18.9 M**, to the number

</v-clicks>

</div>

<!--
The two keyword arguments are the whole slide. Both default to the wrong thing
for a modern model, and neither produces an error.

Have them run the print. Matching a number they derived by hand against what
PyTorch reports is the most convincing five seconds available.

Worth saying: most people writing transformers today do not use these classes.
They write the fourteen lines from slide 50, or they load a pretrained model from
Hugging Face. nn.TransformerEncoderLayer is a reasonable middle.
-->

---
layout: default
title: Shapes, end to end
---

# Shapes, end to end

<div class="dl-ledger">

| step | shape | what it is |
| --- | --- | --- |
| `ids` | `(32, 128)` | token ids, padded |
| `embed(ids)` + position | `(32, 128, 512)` | added, so the width is unchanged |
| `qkv(x)` | `(32, 128, 1536)` | Q, K and V in one tensor |
| after the reshape | `(32, 8, 128, 64)` | heads promoted to a batch dimension |
| $QK^\top$ | `(32, 8, 128, 128)` | **the scores** — quadratic in T |
| weights @ V | `(32, 8, 128, 64)` | one output per head |
| merged + $W_O$ | `(32, 128, 512)` | back to the residual stream |
| `head(x)` | `(32, 128, 50257)` | a logit per vocabulary entry, per position |

</div>

<div v-click class="mt-2 dl-callout">

The scores row is the only one that depends on $T$ **twice** — 4 M numbers here,
67 M at 2048 tokens. That row is the long-context problem.

</div>

<!--
Lecture 04 and Lecture 05 both ended their code section on a shape ledger. Same
habit, same payoff, and this one has a punchline the others did not.

The check to run before writing any training loop:
    x = torch.randint(0, 50257, (32, 128))
    print(model(x).shape)      # torch.Size([32, 128, 50257])

Note the last row is a logit per position, not per sequence — a decoder-only
model predicts a next token at every position at once, which is what makes
training parallel.
-->

---
layout: default
title: Four bugs, and what each one looks like
---

# Four bugs, and what each one looks like

<div class="dl-tight">

<v-clicks>

- **No causal mask** in a language model. Training loss drops to near zero within
  minutes and generation is gibberish — the model learned to copy its own input
- **`batch_first` left out.** No error. PyTorch reads your batch dimension as
  time, exactly as `nn.LSTM` did last week
- **Padding mask forgotten.** No error. Attention spreads weight onto pad tokens,
  and every short sequence in the batch gets a worse vector
- **`norm_first` left as the default.** Post-LN, so a deep stack diverges in the
  first few hundred steps unless you add a warmup schedule

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Three of the four produce **no error message**. A training loss that looks *too
good* is the first symptom of bug one, and the only cheap symptom you get.

</div>

<!--
This is the lab's FAQ written in advance, and it deliberately mirrors week 5's
version of the same slide.

Bug one is the one everybody hits. The tell is a loss that falls below anything
plausible — if next-token loss on natural text drops under about 1.0 in the first
epoch of a small model, the mask is wrong.

Bug three: padding and causality are two different masks and you have to combine
them yourself. is_causal=True does not know about your padding.
-->

---
layout: section
index: "06"
---

# Where that leaves us

---
layout: default
title: Where we got to
---

# Where we got to

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

<v-clicks>

- A soft dictionary: **query**, **key**, **value**, matched by dot product
- Score, scale, softmax, mix — and a word's meaning is assembled per sentence
- Several **heads**, because one softmax answers one question
- Order is not free any more, so **position** is put into the vector

</v-clicks>

</div>
<div>

<v-clicks>

- A **block** is attention, then a per-position network, each wrapped in a
  residual and a norm
- The **original** was two stacks; masking is what makes generation honest and
  training parallel
- **Modern** models moved the norm, rotated the positions, shared the key heads —
  and left the mechanism alone

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

One idea, applied twice per block: mix across positions, then think about each
position alone.

</div>

<!--
Read the left column as the mechanism and the right as the architecture built
from it.

Then hand over: next week takes this block, stacks a hundred of them, trains it
on next-token prediction over a substantial fraction of the written internet, and
asks what happens. None of the architecture changes. Everything else does.
-->

---
layout: default
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
    blurb="Karpathy. A complete, readable, trainable decoder-only transformer in about 300 lines. Slide 50 is its attention."
    icon="💻"
  />
</div>
</div>

<div v-click class="mt-4 dl-tight">

**In the lab.** Build the block from slide 51 and train a small decoder-only model
on character-level text. Then break it on purpose — drop `is_causal`, drop the
$\sqrt{d_k}$, drop the positional encoding, one at a time — and report what each
one costs.

</div>

<div v-click class="mt-2 dl-secondary">

Dropping the positional encoding is the interesting one. Predict first.

</div>

<!--
The deliberate-breakage exercise carries over from week 5 because it worked.

What each break does, so you can grade it: no mask gives an implausibly low loss
and gibberish samples; no scaling trains but converges slower and worse, more
visibly at larger d_k; no positional encoding still trains to a surprisingly
decent loss, because character-level text is heavily predictable from a bag of
recent characters — which is itself the lesson, and the reason to make them
predict first.

Practicalities — dataset, deadline, what to hand in — belong on the course page.
-->

---
layout: end
email: vajira@simula.no
next: Large Language Models
---

# To be continued…
