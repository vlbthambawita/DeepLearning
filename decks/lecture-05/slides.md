---
theme: dl2026
addons:
  - dl2026
title: Recurrent Neural Networks
info: PGR207 Deep Learning 2026 — Lecture 05
author: Vajira Thambawita
routerMode: hash
transition: slide-left
mdc: true
themeConfig:
  courseCode: PGR207
  lecture: "05"
  lectureTitle: Recurrent Neural Networks
layout: title
courseCode: PGR207
lecture: "05"
email: vajira@simula.no
---

# Recurrent Neural Networks

A sequence is not a bag of inputs — order carries meaning, and the length is not
fixed. One new wire handles both, and everything hard about it follows from that
one wire.

<!--
One session. The arc: the data changed, so the layer has to change; the change
is a single feedback connection; that connection is what makes the network
trainable on sequences and what makes it hard to train at all.

Do not rush section 02. Vanishing gradients are the reason LSTM, GRU, attention
and eventually the transformer all exist, and a student who has only been told
"gradients vanish" cannot see why any of the fixes are shaped the way they are.

Transformers are next week. Say so at the start: today ends on the two walls a
recurrent network hits, and next week is the architecture built to knock both
down.
-->

---
layout: interactive
heading: Where we are
title: Where we are
aside-width: 15rem
---

<SyllabusTimeline :current-week="6" />

::aside::

A new kind of data, for the first time since Lecture 02.

Weeks 4 and 5 were images. Today is sequences; next week is the architecture that
replaced what we build today.

<!--
Worth saying out loud that lectures 04 and 05 are the same move made twice: look
at what structure the data has, and build that structure into the layer.
-->

---
layout: section
index: "00"
---

# The data changed

---
layout: default
title: What last week assumed
---

# What last week assumed

A convolution works because of two facts about an image:

<v-clicks>

- **things are local** — a pixel belongs with the pixels beside it
- **things repeat** — the same edge means the same thing anywhere in the frame

</v-clicks>

<div v-click class="mt-4">

Fact two became **parameter sharing**, and that part survives today. Fact one does
not: a sequence is not a neighbourhood, it is an **order**.

</div>

<div v-click class="mt-4 dl-callout">

Same method, new data: find the structure, build it into the layer.

</div>

<!--
Deliberately opens on Lecture 04 rather than on sequences. The students have
just spent two weeks on one instance of this method; naming the method makes the
second instance much cheaper to teach.

Ask what a "neighbourhood" means for a sentence. Answers will include "the words
either side", which is right and is exactly what a 1D convolution exploits —
flag it, we come back to it in six slides.
-->

---
layout: default
title: The assumption nobody mentioned
---

# The assumption nobody mentioned

Every model in this course so far has assumed the training examples are
**independent and identically distributed** — IID.

<v-clicks>

- Iris flower 41 tells you nothing about flower 42
- MNIST digit 17 tells you nothing about digit 18
- Shuffle the dataset and nothing changes — which is why `shuffle=True` is the
  default and nobody blinks

</v-clicks>

<div v-click class="mt-5 dl-callout">

Now shuffle the words of this sentence. The label does not survive the shuffle,
so the examples were never independent — and `shuffle=True` on the words inside
one review would destroy it.

</div>

<!--
The reason to make this explicit: students have never been asked to notice the
assumption, so they do not notice it breaking. The shuffle test is the fastest
diagnostic — if shuffling the units of your input destroys the label, the units
are a sequence.

Note the subtlety, because someone always asks: we still shuffle the *reviews*
in the DataLoader. What we cannot shuffle is the words inside one review. The
examples are IID; their contents are not.
-->

---
layout: default
title: Order is not decoration
---

# Order is not decoration

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

### Same words, different meaning

<v-clicks>

- *dog bites man* — page 14
- *man bites dog* — front page

</v-clicks>

<div v-click class="mt-4">

Identical bag of words. A model that counts words cannot tell them apart, and
neither can a fully-connected layer fed a word-count vector.

</div>

</div>
<div>

### One word, opposite label

<v-clicks>

- *the film was very good* → **positive**
- *the film was not very good* → **negative**

</v-clicks>

<div v-click class="mt-4 dl-callout">

*not* does not mean anything on its own. It changes the meaning of what comes
**after** it. So the model has to carry something from one position to the next.

</div>

</div>
</div>

<!--
Two minutes, and it does more work than any diagram in the section. Get the room
to say what "not" does before revealing the callout.

If someone offers n-grams: yes, bigrams catch "not good", and that is exactly
what a 1D convolution learns. It will not catch "not, by any stretch of the
imagination, good". Unbounded distance is the thing recurrence buys.
-->

---
layout: default
title: Sequence, or time series?
---

# Sequence, or time series?

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

### Sequence

Order matters. There need be no clock.

<v-clicks>

- the words of a sentence
- a DNA sequence: `ACGGTTA…`
- the moves of a chess game

</v-clicks>

</div>
<div>

### Time series

A sequence with a **time** axis — so the gaps between elements are themselves
data.

<v-clicks>

- stock prices, one per minute
- a speech waveform, 16 000 samples a second
- an ECG trace
- a patient's vitals, sampled irregularly

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Every time series is a sequence. Not every sequence is a time series — and the
models today do not care which one you have. Position is all they see.

</div>

<!--
The distinction matters for one practical reason: with a time series you often
have to decide what to do about irregular sampling and missing steps, and a plain
RNN silently treats "one step" as "one row of the tensor" whatever the real gap
was. Mention it; do not solve it.

The ECG example is the one to linger on if the room has clinical interests —
it comes back in the GAN weeks.
-->

---
layout: default
title: Try it with the network we already have
---

# Try it with the network we already have

Flatten a review into one long vector and hand it to a dense layer — exactly what
we did with MNIST in week 3.

<div class="grid grid-cols-2 gap-10 mt-3">
<div class="dl-math-sm">

A 200-word review, one-hot over a 20 000-word vocabulary:

$$ 200 \times 20\,000 = 4\,000\,000 \;\text{inputs} $$

<div v-click class="mt-5">

One layer of 256 units, reading that:

$$ 4\,000\,000 \times 256 + 256 = 1\,024\,000\,256 $$

</div>

</div>
<div>

<div v-click>

**A billion weights** in the first layer — before the second layer, and before
anything has been learned.

</div>

<div v-click class="mt-5 dl-callout">

The recurrent model we build today does the same job with **1.38 million**. And
that number does not change when the review gets longer.

</div>

</div>
</div>

<!--
This is week 4's parameter-budget argument, about the same layer, with the numbers
turned up. Say that: the room has seen this complaint before.

Do the arithmetic aloud — 200 x 20,000 = 4,000,000 inputs, times 256 units. Nobody
trains a billion-weight first layer to read a film review.

Then say the honest version, which is the next slide: the parameter count is not
even the worst of it.
-->

---
layout: default
title: And the parameter count is the least of it
---

# And the parameter count is the least of it

Give the dense layer an embedding, so it reads 200 × 64 = 12 800 numbers rather
than 4 million. It still fails, three times:

<div class="dl-tight">

<v-clicks>

- **Fixed length.** 12 800 inputs means every review is exactly 200 words — longer
  is truncated, shorter is padded, and the padding gets weights
- **Position-locked weights.** *brilliant* at word 3 is read by different weights
  than *brilliant* at word 180, so the word is learned again at every position
- **Still bigger.** 3.28 M in that layer plus 1.28 M of embedding, against 1.38 M
  for the whole recurrent model

</v-clicks>

</div>

<div v-click class="mt-5 dl-callout">

Bullet two is Lecture 04's complaint with *pixel* replaced by *position*. So is the
answer: **share the weights**.

</div>

<!--
This is the hinge of the section. The parameter count is a symptom; position-
locked weights are the disease, exactly as in week 4.

Bullet one has no counterpart in the CNN lecture and is worth its own beat: images
in a batch are all resized to the same size and nobody minds, because cropping a
photo loses a border. Truncating a review can lose the word that carries the label.
-->

---
layout: default
title: Two facts about sequences
---

# Two facts about sequences

<v-clicks>

- **The same pattern means the same thing wherever it occurs.** *not very good* is
  bad news at word 4 and bad news at word 140 — so one set of weights should read
  every position
- **What happened earlier changes what a later element means.** So something has
  to be **carried forward** from one position to the next

</v-clicks>

<div v-click class="mt-5">

The first fact gives **weights shared across time**. The second gives a
**state** — one vector, passed from each step to the next.

</div>

<div v-click class="mt-4 dl-callout">

That is the entire architecture. Everything else today is a consequence.

</div>

<!--
Say these two sentences slowly and write them on the board, because the rest of
the lecture refers back to them by number.

The parallel with slide 6 of Lecture 04 is exact and worth pointing at: two facts
about the data, each turned into one piece of wiring.
-->

---
layout: interactive
heading: An aside — a convolution can read a sequence too
title: An aside — a convolution can read a sequence too
aside-width: 19rem
---

<Conv1DLab :controls="['padding', 'stride']" />

::aside::

Last week's widget, with the axis read as **time**. `Conv1d` shares one filter
across positions — fact one, already solved.

<v-clicks>

- **Parallel** — every output at once
- Context **bounded** by the receptive field
- Nothing about 60 words ago
- Recurrence trades that parallelism for **unbounded** context

</v-clicks>

<!--
This slide exists so nobody leaves believing recurrence is the only way to read a
sequence. WaveNet and ByteNet are convolutional; so is most on-device audio.

It also plants the flag for the last section: the CNN's advantage here is that it
is parallel, and that is precisely the advantage the transformer takes back from
the RNN next week. Say that now and again at the end.
-->

---
layout: interactive
heading: Which shapes does a sequence problem come in?
title: Which shapes does a sequence problem come in?
aside-width: 16rem
---

<SequenceTasks />

::aside::

Five wirings of one cell. All that changes: **which steps take an input, and which
produce an output**.

<div v-click class="mt-3 dl-secondary">

Start on **no recurrence** — every model in this course so far — then walk right.

</div>

<div v-click class="mt-3 dl-callout">

The shape decides where the loss lives, and so what `forward` returns.

</div>

<!--
Click through all five and read the examples. Then ask which one a film-review
sentiment classifier is (many to one), and which one autocomplete is (many to
many, in step, shifted by one).

The encoder-decoder tab is the one the last section of the lecture is about. Flag
it and move on.
-->

---
layout: default
---

<PollSlide
  question="You train a sentiment model on 200-word reviews. At test time a 340-word review arrives. Which model just broke?"
  :items="[
    'The flattened MLP — its input layer has a fixed width',
    'The 1D CNN — its filters have a fixed size',
    'The RNN — it has a fixed number of time steps',
    'All three',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

The MLP

</div>

<div v-click class="mt-2 dl-secondary">

A filter slides, so a CNN takes any length. An RNN's loop runs as many times as
you ask it to. Only the flattened dense layer has a width baked into its weights.

</div>

<!--
Hands up for each before revealing. Option 3 catches people who have not yet
realised there is one cell rather than T cells — which is exactly what the next
section fixes.
-->

---
layout: section
index: "01"
---

# The recurrent layer

---
layout: interactive
heading: One new wire
title: One new wire
aside-width: 17rem
---

<RnnUnroll start="fold" />

::aside::

A hidden layer, with **one connection from its own output back to its own input**.

<v-clicks>

- $W_{xh}$ reads this step's input
- $W_{hh}$ reads **the layer's own previous output**
- $W_{ho}$ produces the output

</v-clicks>

<div v-click class="mt-2 dl-callout">

The whole difference from Lecture 02: one extra matrix, and one step of delay.

</div>

<!--
Press nothing yet. Let them look at the loop.

The single most common misreading is that the loop is a second layer or a memory
buffer sitting beside the network. It is neither: it is the same 128 units,
reading the values they held one step ago.

"One step of delay" is worth repeating. Without the delay the definition would be
circular.
-->

---
layout: interactive
heading: The same layer, once per step
title: The same layer, once per step
aside-width: 18rem
---

<RnnUnroll start="unroll" :steps="4" />

::aside::

**Unrolling** draws one copy of the layer per time step. Press **Next step**.

<v-clicks>

- Every $W$ on this picture is the **same matrix**
- The chain grows with the sequence; the weights do not
- $h_0$ is zeros — before word one, nothing is known

</v-clicks>

<div v-click class="mt-2 dl-callout">

At $t = 2$ the input is **0** and $h_2$ is not. The state, doing its job.

</div>

<!--
Press "Fold it back" and "Unroll it" a couple of times. Folded is the network;
unrolled is the computation. Students who only ever see one of the two pictures
get a specific wrong idea from each.

The t = 2 step is the slide. The input is zero, the hidden state is [0.55, 0.15],
and every number in it came from step 1. Ask where it came from before saying so.

If someone asks whether h_0 could be learned: yes, and it sometimes is. Zeros is
the default and it is nearly always fine.
-->

---
layout: default
title: The forward pass, written down
---

# The forward pass, written down

<div class="mt-2">

$$ \mathbf{h}_t = \tanh\!\left(W_{xh}\,\mathbf{x}_t + W_{hh}\,\mathbf{h}_{t-1} + \mathbf{b}_h\right) $$

$$ \mathbf{o}_t = W_{ho}\,\mathbf{h}_t + \mathbf{b}_o $$

</div>

<div class="grid grid-cols-2 gap-8 mt-4 dl-tight">
<div>

<v-clicks>

- $\mathbf{x}_t$ — this step's input. One word's embedding, one sensor reading
- $\mathbf{h}_{t-1}$ — the state after the previous step. **Everything the network
  remembers**
- $\tanh$ — the activation, and the reason $\mathbf{h}$ stays inside $(-1, 1)$

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

Two terms inside one activation. Drop the second and this is exactly the dense
layer from Lecture 02.

</div>

<div v-click class="mt-3 dl-secondary">

$\mathbf{o}_t$ has no activation here — as in Lecture 04, the logits go straight
into the loss.

</div>

</div>
</div>

<!--
Read it aloud in words first: "the new state is a squashed sum of what I am
looking at and what I already knew".

Nothing on this slide is new mathematics. W_xh x + b is Lecture 02; the tanh is
Lecture 02; the only new symbol is W_hh h_{t-1}. Say that explicitly — it lowers
the temperature of the slide considerably.

Why tanh rather than ReLU: h is fed back into itself, so an unbounded activation
can compound to infinity over 200 steps. tanh keeps the state bounded. It is also
what makes the gradients vanish, which is section 02's problem.
-->

---
layout: default
title: The same equation, one matrix
---

# The same equation, one matrix

Stack the two inputs into one vector and the two matrices into one matrix:

<div class="mt-3 dl-math-sm">

$$ \mathbf{h}_t = \tanh\!\left( W_h \begin{bmatrix} \mathbf{x}_t \\ \mathbf{h}_{t-1} \end{bmatrix} + \mathbf{b}_h \right), \qquad W_h = \begin{bmatrix} W_{xh} & W_{hh} \end{bmatrix} $$

</div>

<div class="dl-tight">

<v-clicks>

- Identical arithmetic — a block matrix times a stacked vector *is* the sum of the
  two products
- And it says the useful thing out loud: a recurrent layer is **one dense layer**
  reading *this step, concatenated with the last state*
- Every LSTM diagram you will ever see is drawn this way

</v-clicks>

</div>

<div v-click class="mt-5 dl-callout">

A 64-wide embedding and 128 hidden units: one $128 \times 192$ matrix, applied once
per word.

</div>

<!--
2025 slide 8 said "another way of writing the same" and left it there. This is
why it is worth writing: it turns four gate equations on the LSTM slide into one
matrix multiply, which is also exactly what nn.LSTM does — one weight_ih and one
weight_hh per layer, not eight.

128 x 192: 128 rows because there are 128 units, 192 columns because 64 + 128.
Have them check it.
-->

---
layout: interactive
heading: One step, by hand
title: One step, by hand
aside-width: 17rem
---

<RnnStepTrace />

::aside::

Two hidden units, one input feature, and the sequence $x = 1, 0, 1, 0$. Press
**Next line**:

<v-clicks>

- the rule, with $t$ fixed
- the numbers — the same two matrices at every step
- what **this step** brought, beside what **the past** brought
- add, squash, done

</v-clicks>

<div v-click class="mt-2 dl-secondary">

Line 3 is the one to be able to produce unaided.

</div>

<!--
Walk t = 1 line by line, then hand t = 2 to the room: ask for the two vectors on
line 3 before pressing.

At t = 2 the input contributes [0, 0] and the past contributes [0.61, 0.15]. That
is the whole idea, in two columns of one line of arithmetic.

Do not skip this widget because the numbers look small. Nobody who cannot do this
can debug an RNN.
-->

---
layout: default
title: What the state actually is
---

# What the state actually is

$\mathbf{h}_t$ is a **fixed-size summary of everything up to step $t$**.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

<v-clicks>

- 128 numbers after 3 words
- 128 numbers after 300 words
- The network chooses what to keep, because $W_{hh}$ is learned

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

So it is **lossy by construction**. 300 words do not fit in 128 numbers, and
nothing about the architecture says which 128 numbers matter.

</div>

<div v-click class="mt-3 dl-secondary">

Hold that sentence. It is the reason for section 03, and the reason the last
section of this lecture ends where it does.

</div>

</div>
</div>

<!--
This is the most important conceptual slide in the section and it has no
mechanism on it at all.

The honest framing: recurrence does not give a network memory, it gives it a
fixed budget for memory and makes it learn an eviction policy. Gates are a better
eviction policy. Attention is refusing to evict anything.
-->

---
layout: default
title: Counting the parameters
---

# Counting the parameters

<div class="mt-2">

$$ \underbrace{n_h \times n_x}_{W_{xh}} + \underbrace{n_h \times n_h}_{W_{hh}} + \underbrace{n_h}_{\mathbf{b}_h} $$

</div>

<div class="grid grid-cols-2 gap-8 mt-4 dl-tight">
<div>

A 64-wide embedding into 128 hidden units:

<div v-click class="mt-2 dl-math-sm">

$$ 128 \cdot 64 + 128 \cdot 128 + 128 = 24\,704 $$

</div>

<v-clicks>

- $T$ **does not appear.** A 10-word review and a 1000-word review use the same
  weights
- $W_{hh}$ is the expensive one, and it grows with $n_h^2$

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

Exactly the shape of Lecture 04's argument, where $H$ and $W$ did not appear in a
convolution's parameter count. Weight sharing always buys this.

</div>

<div v-click class="mt-3 dl-secondary">

`nn.RNN` prints **24 832**, not 24 704: PyTorch keeps *two* bias vectors,
`bias_ih` and `bias_hh`. Mathematically redundant — they only ever appear as a
sum — and kept for cuDNN's sake.

</div>

</div>
</div>

<!--
The secondary note saves a lab question every year. A student who counts by hand
and then calls sum(p.numel()) gets a number that is n_h too big and assumes they
are wrong. They are not.

Ask what happens to the count if you double the hidden size: W_hh quadruples.
That is why 128 and 256 are common and 4096 is not.
-->

---
layout: default
title: Your turn — count them
---

# Your turn — count them

<div class="dl-tight dl-math-sm">

<v-clicks>

- `nn.RNN(64, 128)` → $128 \cdot 64 + 128 \cdot 128 + 2 \cdot 128 = \mathbf{24\,832}$
- `nn.LSTM(64, 128)` → four gates, so $4 \times 24\,832 = \mathbf{99\,328}$
- `nn.GRU(64, 128)` → three, so $3 \times 24\,832 = \mathbf{74\,496}$
- `nn.Embedding(20000, 64)` → $20\,000 \cdot 64 = \mathbf{1\,280\,000}$

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Whole classifier: embedding + LSTM + `Linear(128, 2)` = **1 379 586** weights, and
the **embedding is 93%** of them. The recurrent part we are spending the lecture on
is 7%.

</div>

<div v-click class="mt-3 dl-secondary">

Lecture 04 ended with the same imbalance the other way round — 98% of a CNN in one
dense head. Where a model's parameters live is rarely where its ideas live.

</div>

<!--
Do the first row together, let them race the rest. Rows 2 and 3 are the
definition of the next section: an LSTM is four of these and a GRU is three, and
that is all the parameter count knows about gating.

The 93% is the number to leave them with. It also explains why pre-trained
embeddings mattered so much before 2018: it is the part of the model with the
most to learn and the least supervision.
-->

---
layout: interactive
heading: Five ways to wire it
title: Five ways to wire it
aside-width: 21rem
---

<RnnWiring />

::aside::

Three places the recurrence can come from, and two ways to reuse one cell.

<v-clicks>

- **hidden → hidden**, as in `nn.RNN`
- **output → hidden** squeezes the past through the output layer
- **stacked**, **bidirectional** are constructor arguments

</v-clicks>

<div v-click class="dl-callout">

Bidirectional needs the whole sequence first — so it cannot predict the next word.

</div>

<!--
Walk the first three, then the last two. The 2025 deck drew all three arrows at
once on one figure, which is unreadable, and never said which is used.

The bidirectional caveat catches people out in their own projects: they add
bidirectional=True to a language model, the loss collapses to nothing, and it
takes an afternoon to realise the model can see the answer.

Concatenation, not addition, is how the two directions combine — so the output
width doubles and the head has to know that.
-->

---
layout: section
index: "02"
---

# Training through time

---
layout: default
title: The loss for a whole sequence
---

# The loss for a whole sequence

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

### One label per sequence

Sentiment, from a whole review:

<div class="mt-2 dl-math-sm">

$$ L = \ell\!\left(\mathbf{o}_T,\; y\right) $$

</div>

<div v-click class="mt-2">

One term, computed at the last step, from the final state.

</div>

</div>
<div>

### One label per step

A tag per word, or the next character:

<div class="mt-2 dl-math-sm">

$$ L = \frac{1}{T}\sum_{t=1}^{T} \ell\!\left(\mathbf{o}_t,\; y_t\right) $$

</div>

<div v-click class="mt-2">

$T$ terms, averaged — and each one is the same cross-entropy from Lecture 04.

</div>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Either way there is **one** set of weights, so every loss term sends its gradient
into **all** of them. That is the interesting part, and it is the next slide.

</div>

<!--
Nothing new about the loss itself — it is Lecture 04's cross-entropy, once or T
times. What is new is that one weight matrix now receives gradient from T
different places.

Mention the averaging: sum and mean differ by a factor of T, which changes the
effective learning rate. PyTorch's default is mean, and with padded batches "mean
over what" becomes a real question — slide 51.
-->

---
layout: default
title: Backpropagation through time
---

# Backpropagation through time

The unrolled chain is just a deep feed-forward network, so backpropagation
applies unchanged. With one twist: **$W_{hh}$ appears at every step**.

<div class="mt-3 dl-math-sm">

$$ \frac{\partial L}{\partial W_{hh}} = \sum_{t=1}^{T} \frac{\partial L_t}{\partial \mathbf{h}_t} \left( \sum_{k=1}^{t} \underbrace{\frac{\partial \mathbf{h}_t}{\partial \mathbf{h}_k}}_{\text{through } t-k \text{ steps}} \frac{\partial \mathbf{h}_k}{\partial W_{hh}} \right) $$

</div>

<div class="dl-tight">

<v-clicks>

- A **sum over every step**, because the weight was used at every step
- Inside it, a factor for travelling from step $t$ back to step $k$
- That factor is a **product** of $t - k$ terms — and a product of many numbers is
  where the trouble is

</v-clicks>

</div>

<!--
Do not derive this. Point at three things: the outer sum, the inner sum, and the
Jacobian in the middle.

The Jacobian is the whole story:

  dh_t/dh_k = prod_{j=k+1..t} diag(tanh'(z_j)) W_hh^T

Write that on the board. It is a product of (t - k) copies of the same matrix,
each pre-multiplied by a diagonal of tanh derivatives, every one of which is at
most 1. The next slide is that product, with the matrix replaced by one number.
-->

---
layout: interactive
heading: One number, raised to a power
title: One number, raised to a power
aside-width: 19rem
---

<GradientFlow />

::aside::

One hidden unit, so the recurrent matrix is one weight $W$. Going $k$ steps back
multiplies the gradient by $W^k$.

<v-clicks>

- $W < 1$ → **vanishing**
- $W > 1$ → **exploding**
- $W = 1$ → stable, and nothing holds a trained weight there

</v-clicks>

<div v-click class="mt-2 dl-callout">

Drag $W$ slowly through 1. There is no safe band — only a point.

</div>

<!--
Drag it. The lesson is the shape of the curve on a log axis: a straight line whose
slope is log W, so the damage is exponential in the distance, not linear.

Then say the part that makes it worse: the real factor is W times tanh'(z), and
tanh' is at most 1 and usually well under it. So the effective W is smaller than
the weight, and vanishing is the common case by a wide margin. Exploding happens,
but it announces itself with a NaN; vanishing is silent.

Tick gradient clipping with W above 1 and point out that the vanishing end of the
chart does not move at all.
-->

---
layout: default
title: What vanishing feels like
---

# What vanishing feels like

<div class="dl-tight">

<div v-click class="dl-callout">

"The clouds are in the **sky**."

The word that decides the answer is four steps back. Any RNN learns this.

</div>

<div v-click class="mt-5 dl-callout">

"I grew up in **France** … [forty words about school, weather and food] … so I
speak fluent **French**."

The word that decides the answer is forty steps back. A plain RNN never learns
this — not because it lacks capacity, but because the gradient that would teach it
arrives multiplied by $W^{40}$.

</div>

</div>

<div v-click class="mt-5 dl-secondary">

The model is not failing to represent the dependency. It is failing to *receive
the news* that the dependency exists.

</div>

<!--
This example is Olah's and it is the clearest one in the literature — use it.

The distinction in the secondary line is the one students most often miss and the
one that makes gating make sense: forward, the state could in principle carry
"France" for forty steps. Backward, the learning signal cannot survive the trip.
Fix the backward path and the forward one takes care of itself.

Ask how far back a 0.9 weight reaches at 1% strength: about 44 steps. At 0.6, nine.
-->

---
layout: interactive
heading: And tanh is not helping
title: And tanh is not helping
aside-width: 19rem
---

<ActivationExplorer />

::aside::

Choose **Tanh** and watch the dashed derivative.

<v-clicks>

- It peaks at **1** and falls away either side
- A saturated unit has a derivative near **zero**
- Every backward step multiplies by one of these

</v-clicks>

<div v-click class="mt-2 dl-callout">

So the real factor is $W \cdot \tanh'$, with $\tanh' \le 1$ always. What keeps the
state stable is what kills the gradient.

</div>

<!--
Lecture 02's widget, third outing, and it earns it: the vanishing-gradient story
there was about depth, and this is the same fact about length.

The obvious question — why not ReLU, whose derivative is exactly 1 — has a good
answer: people do, and it works with careful initialisation (IRNN), but an
unbounded activation fed back into itself for 200 steps also explodes forwards, not
just backwards. tanh is the safe default and gating is the real fix.
-->

---
layout: default
title: Three ways out, honestly ranked
---

# Three ways out, honestly ranked

<div class="grid grid-cols-3 gap-6 mt-4 dl-tight">
<div v-click>

### Gradient clipping

Cap the gradient's norm before stepping.

<div class="mt-2 dl-secondary">

Fixes **exploding** only. Two lines of code, always worth having.

</div>

</div>
<div v-click>

### Truncated BPTT

Only backpropagate $k$ steps, then cut the graph.

<div class="mt-2 dl-secondary">

Bounds the cost and the explosion. Also **declares** that nothing beyond $k$ steps
will ever be learned.

</div>

</div>
<div v-click>

### Gated cells

Change the cell so the gradient's path is an **addition**, not a multiplication.

<div class="mt-2 dl-secondary">

The real fix, and the next section.

</div>

</div>
</div>

<div v-click class="mt-6 dl-callout">

The 2025 deck listed these three side by side. They are not alternatives: you use
clipping **and** a gated cell, and truncation when the sequence will not fit in
memory.

</div>

<!--
Being explicit about the ranking matters. A list of three fixes invites a student
to pick one.

Clipping is not a hack — it is standard in every recurrent and every transformer
training script. Truncation is a memory and compute decision first and a gradient
decision second.
-->

---
layout: default
title: Gradient clipping, in one line
---

# Gradient clipping, in one line

```python {all|1-3|5|6|7|all}{lines:true}
logits = model(ids, lengths)
loss = loss_fn(logits, labels)
optimiser.zero_grad()

loss.backward()                                     # gradients exist now
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimiser.step()                                    # …and are bounded
```

<div v-click class="mt-4 dl-math-sm">

If $\|\mathbf{g}\| > c$, replace $\mathbf{g}$ with $c \cdot \mathbf{g} / \|\mathbf{g}\|$
— same **direction**, capped **length**. A gradient of norm 900 with $c = 1$
becomes norm 1, pointing exactly where it did.

</div>

<div v-click class="mt-3 dl-callout">

It goes **between** `backward()` and `step()`. Before `backward()` there is nothing
to clip; after `step()` it is too late.

</div>

<!--
The placement is the bug students actually write. Say it twice.

Norm clipping, not value clipping: clip_grad_value_ exists and clamps each
component independently, which changes the direction of the update. Almost nobody
wants that.

max_norm between 0.25 and 5 is the usual range, and 1.0 is a fine default. If
clipping fires on every batch, the learning rate is too high — clipping is a
seatbelt, not a suspension.
-->

---
layout: default
title: Truncated backpropagation through time
---

# Truncated backpropagation through time

A 100 000-character book is one sequence — and 100 000 steps of activations do not
fit in memory.

<div v-click class="mt-3">

```python {all|3|4-5|6|all}{lines:true}
hidden = None
for chunk in chunks_of(book, size=128):            # 128 steps at a time
    if hidden is not None:
        hidden = tuple(h.detach() for h in hidden)  # keep the values,
                                                    # cut the graph
    logits, hidden = model(chunk, hidden)
    ...                                             # loss, backward, step
```

</div>

<div class="dl-tight">

<v-clicks>

- The state still flows **forward** across chunk boundaries — the model's context
  is not truncated
- Only the **gradient** stops at the boundary, which is what `detach()` does
- Forget the `detach` and the graph grows without bound until the run dies

</v-clicks>

</div>

<!--
The distinction in bullet one is the thing to get right: TBPTT truncates learning,
not memory. The forward context is as long as you like.

detach() returns a tensor sharing the same storage with no graph history. This is
also the answer to "why is my loop using more memory every iteration" for anyone
who ever accumulates losses in a list.

k = 128 or 256 is typical for character models. It is a memory decision.
-->

---
layout: section
index: "03"
---

# Gated cells

---
layout: default
title: Stop multiplying, start adding
---

# Stop multiplying, start adding

The problem, in one line: the state is **rebuilt** at every step —

<div class="mt-2 dl-math-sm">

$$ \mathbf{h}_t = \tanh\!\left(W_{hh}\,\mathbf{h}_{t-1} + \dots\right) $$

</div>

<div class="dl-tight">

<v-clicks>

- so going back $k$ steps multiplies by $W_{hh}$ $k$ times, and $\tanh'$ $k$ times
- What if the state were **carried** instead, and only *added to*?
  $\;\mathbf{c}_t = \mathbf{c}_{t-1} + \text{something}$
- Then $\partial \mathbf{c}_t / \partial \mathbf{c}_{t-1} = 1$, and the gradient walks
  back a hundred steps unchanged

</v-clicks>

</div>

<div v-click class="mt-5 dl-callout">

And it never forgets anything, ever, which is useless. So put a **learned valve**
on each part of it. Those valves are the gates.

</div>

<!--
Derive the architecture rather than presenting it. Students who meet the LSTM as
six equations memorise six equations; students who watch "additive path, then gate
it" can reconstruct them.

The same additive-path trick is a residual connection in a ResNet and a skip
connection in a U-Net. Say so — it is one idea appearing in three lectures.
-->

---
layout: interactive
heading: The LSTM memory block
title: The LSTM memory block
aside-width: 21rem
---

<GatedCell />

::aside::

The **cell state** runs straight across the top, touched by exactly one multiply
and one add.

Press **Walk the cell** to take the six parts in order.

<div v-click class="mt-2 dl-callout">

Then set **forget = 1** and **input = 0**: $c_t = c_{t-1}$, exactly, for as many
steps as you like. That is the highway open.

</div>

<div v-click class="mt-2 dl-secondary">

Set forget = 0 and the past is gone in one step. The network learns which.

</div>

<!--
Walk all six, reading each equation as it lights up. Then drive the two extremes
from the aside — they take ten seconds each and they are what the room remembers.

Say clearly that the sliders set the gate *values*: in a real cell each is its own
sigma(Wx + Wh + b), a Lecture 02 layer with a sigmoid. There are four of them, and
they are what the "four gates" in the parameter count refers to.

The gate is per unit, not per layer. With 128 units there are 128 independent
forget decisions every step, and in a trained model they genuinely differ — some
units hold values for hundreds of steps, most for two or three.
-->

---
layout: default
title: The six equations
---

# The six equations

<div class="grid grid-cols-2 gap-8 mt-1 dl-math-sm">
<div>

<div v-click>

$$ \mathbf{f}_t = \sigma\!\left(W_{xf}\mathbf{x}_t + W_{hf}\mathbf{h}_{t-1} + \mathbf{b}_f\right) $$

</div>
<div v-click>

$$ \mathbf{i}_t = \sigma\!\left(W_{xi}\mathbf{x}_t + W_{hi}\mathbf{h}_{t-1} + \mathbf{b}_i\right) $$

</div>
<div v-click>

$$ \tilde{\mathbf{c}}_t = \tanh\!\left(W_{xc}\mathbf{x}_t + W_{hc}\mathbf{h}_{t-1} + \mathbf{b}_c\right) $$

</div>
</div>
<div>

<div v-click>

$$ \mathbf{o}_t = \sigma\!\left(W_{xo}\mathbf{x}_t + W_{ho}\mathbf{h}_{t-1} + \mathbf{b}_o\right) $$

</div>
<div v-click>

$$ \mathbf{c}_t = \mathbf{f}_t \odot \mathbf{c}_{t-1} + \mathbf{i}_t \odot \tilde{\mathbf{c}}_t $$

</div>
<div v-click>

$$ \mathbf{h}_t = \mathbf{o}_t \odot \tanh(\mathbf{c}_t) $$

</div>
</div>
</div>

<div v-click class="mt-4 dl-callout">

Four of the six are the **same layer** — $\sigma$ or $\tanh$ of $Wx + Wh + b$ —
with different weights. Only the last two are new, and both are elementwise.

</div>

<!--
Reveal them in this order and say what changes each time: the first four are
identical in form and differ only in their weights and their activation. That is
why the parameter count is exactly 4x the plain RNN's, and why nn.LSTM stores one
weight_ih of shape (4H, input) rather than four matrices.

The odot is elementwise, not a matrix product. Every gate decision is per unit.

Sigmoid for a gate because a gate is a fraction in (0, 1); tanh for the candidate
because content should be signed.
-->

---
layout: default
title: One LSTM step, by hand
---

# One LSTM step, by hand

One unit. $c_{t-1} = 0.6$, and the four gate values come out as
$f = 0.9$, $i = 0.4$, $\tilde{c} = 0.8$, $o = 0.7$.

<div class="grid grid-cols-2 gap-8 mt-3 dl-tight">
<div>

<v-clicks>

- **kept**: $f \cdot c_{t-1} = 0.9 \times 0.6 = 0.54$
- **written**: $i \cdot \tilde{c} = 0.4 \times 0.8 = 0.32$
- **cell state**: $c_t = 0.54 + 0.32 = \mathbf{0.86}$
- **exposed**: $h_t = 0.7 \times \tanh(0.86) = 0.7 \times 0.696 = \mathbf{0.49}$

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

The cell holds **0.86** and shows **0.49**. A unit can keep a value and reveal it
on exactly one step out of fifty — which is what "remembering *France*" looks like
arithmetically.

</div>

<div v-click class="mt-3 dl-secondary">

Now put $f = 1$, $i = 0$ in the first two lines: kept $= 0.6$, written $= 0$,
$c_t = 0.6$. Fifty steps of that and $c_{50} = c_0$.

</div>

</div>
</div>

<!--
Have them do it on paper while the widget is still on the previous slide's screen,
then check against it — the numbers are the widget's defaults precisely so this
works.

The distinction between what the cell *holds* and what it *shows* is the job of
the output gate and it is the part of the LSTM that students most often cannot
explain. This slide is where it gets explained.
-->

---
layout: interactive
heading: The highway, against the chain
title: The highway, against the chain
aside-width: 20rem
---

<GradientFlow mode="gated" />

::aside::

Section 02's chart, with the gated path drawn on top.

<v-clicks>

- **Red** — a plain RNN's $W^k$
- **Teal** — the cell state's $f^k$, at $f = 0.99$
- Push $f$ to 1.000: the factor is exactly **1**, at any distance

</v-clicks>

<div v-click class="mt-2 dl-callout">

The LSTM does not remove the multiply. It replaces a **fixed weight** with a
**learned gate** the network can hold near 1.

</div>

<!--
The callout is the honest version and it matters: LSTMs do not abolish vanishing
gradients, they make the decay rate a learnable, per-unit, per-step quantity. An
LSTM whose forget gates all learn 0.5 vanishes as fast as anything else.

This is also why forget-gate biases are often initialised to 1 or 2 — it starts
the gate open, so the highway is clear before training has learned anything.
Worth mentioning; jetblue for anyone who reads implementations.
-->

---
layout: default
title: Where the LSTM came from
---

# Where the LSTM came from

<div class="dl-callout">

**Hochreiter & Schmidhuber, 1997.** Hochreiter's 1991 diploma thesis had already
diagnosed the vanishing gradient; the LSTM was the architecture built to defeat it,
with a "constant error carousel" at its centre — the additive cell state.

</div>

<div v-click class="mt-4 dl-callout">

**Gers, Schmidhuber & Cummins, 2000.** The original cell had *no forget gate*: it
could write and read but never clear, so on a long stream the state saturated.
The forget gate was added three years later, and it is now the most important of
the four.

</div>

<div v-click class="mt-5 dl-secondary">

Twenty years of near-total dominance of sequence modelling, ended by an
architecture with no recurrence in it at all.

</div>

<div class="mt-4">
  <Citation source="Hochreiter & Schmidhuber, Long Short-Term Memory (1997); Gers et al., Learning to Forget (2000)" url="https://www.bioinf.jku.at/publications/older/2604.pdf" />
</div>

<!--
Short and cited, like the Hubel and Wiesel slide in Lecture 04. The history is
worth one minute for one reason: the forget gate was not in the original design,
which is a useful antidote to reading an architecture as if every part were
inevitable.

"Constant error carousel" is the 1997 paper's own name for the additive path. It
is a better name than "highway".
-->

---
layout: interactive
heading: The GRU — same idea, fewer parts
title: The GRU — same idea, fewer parts
aside-width: 20rem
---

<GatedCell variant="gru" />

::aside::

One state instead of two, two gates instead of three.

<v-clicks>

- The **update gate** $z$ does the forget and input jobs at once
- The **reset gate** $r$ sets how much of the past the candidate may read — drag it
  to 0
- $h_t = (1-z)\,h_{t-1} + z\,\tilde{h}_t$: a blend, and the shares sum to 1

</v-clicks>

<!--
Drive the reset gate to 0 first: the candidate bar jumps, because it has stopped
reading the state. Then drive z to 0 and 1 in turn — frozen state, then total
overwrite.

The structural consequence worth naming: an LSTM can forget without writing
(f = 0, i = 0) and a GRU cannot — its kept and written shares are tied. In practice
this costs almost nothing, and the GRU is a quarter cheaper.

Cho et al., 2014. Two years before this deck's last lecture on the subject became
obsolete.
-->

---
layout: default
title: Which one, and the sign that will catch you
---

# Which one, and the sign that will catch you

<div class="dl-ledger">

| | plain RNN | LSTM | GRU |
| --- | --- | --- | --- |
| states carried | $\mathbf{h}$ | $\mathbf{h}$ and $\mathbf{c}$ | $\mathbf{h}$ |
| gates | — | 4 | 3 |
| parameters at 64 → 128 | 24 832 | 99 328 | 74 496 |
| long-range dependencies | no | yes | yes |

</div>

<div v-click class="mt-4 dl-callout">

**Pick one and move on.** Benchmarks have argued about LSTM versus GRU since 2014
and the answer is "it depends, by about a point". Never the plain RNN.

</div>

<div v-click class="mt-3 dl-secondary">

**The sign trap.** Cho's paper writes $h_t = (1-z)h_{t-1} + z\tilde{h}$: $z$ is *how
much to update*. `nn.GRU` writes it the other way round. Same model, inverted gate —
read the docs.

</div>

<!--
The table is the summary; the sign trap is the thing they will actually hit, and
only if they try to check an implementation against a paper. Which is exactly
what a good student does.

If pressed on LSTM versus GRU: GRU trains faster and is usually equal on small
data; LSTM has a small edge on very long dependencies and on language modelling.
Neither difference is worth an afternoon.
-->

---
layout: default
---

<PollSlide
  question="An LSTM unit runs 50 steps with forget = 1 and input = 0 throughout. What is c₅₀?"
  :items="[
    'Zero — it has been multiplied down',
    'c₀, unchanged',
    'Undefined — the state saturates',
    'tanh(c₀)',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

c₀, unchanged

</div>

<div v-click class="mt-2 dl-secondary">

$c_t = 1 \cdot c_{t-1} + 0 \cdot \tilde{c}_t = c_{t-1}$, fifty times over. And the
gradient makes the same trip in the other direction with a factor of exactly 1 —
which is the entire reason the architecture exists.

</div>

<!--
Hands up for each. Option 4 is the popular wrong answer: tanh is applied on the
way *out* to h, never to c itself. That confusion is worth naming out loud.
-->

---
layout: section
index: "04"
---

# Words into vectors

---
layout: default
title: A word is not a number
---

# A word is not a number

$W_{xh}\mathbf{x}_t$ needs $\mathbf{x}_t$ to be a vector of numbers. A word is
not. So: 20 000 words, and one vector each.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### Index it — `great` → 4 217

<v-clicks>

- One number per word, and arithmetic on it is nonsense
- It says 4 217 is "more" than 96, and that `great` sits between whatever happens
  to be numbered 4 216 and 4 218

</v-clicks>

</div>
<div>

### One-hot it — Lecture 02's answer

<v-clicks>

- A 20 000-long vector, 19 999 zeros and one 1
- Honest: no false ordering
- But **every pair of words is equally far apart**. *great* and *brilliant* are
  exactly as different as *great* and *aardvark*

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

And one-hot is what made the dense layer cost a billion weights, back on slide 8.

</div>

<!--
The index option is worth showing rather than skipping: it is what a student's
first tokeniser produces, and it is the tensor they then feed straight into a
Linear layer by mistake.

The equidistance point is the one that motivates embeddings. One-hot throws away
every relationship between words before the model sees anything.
-->

---
layout: interactive
heading: An embedding is a lookup table
title: An embedding is a lookup table
aside-width: 19rem
---

<EmbeddingLab />

::aside::

Nine words, four learned numbers each. Click one and watch a row light up.

<v-clicks>

- `nn.Embedding` skips the multiply and **indexes** the row
- $E$ is $V \times d$ — one learnable row per word
- $d \ll V$: 64 or 300, not 20 000

</v-clicks>

<div v-click class="mt-2 dl-callout">

An embedding layer *is* a dense layer whose input is one-hot — which is why it
trains by ordinary backpropagation.

</div>

<!--
Click a few words and let them watch the highlighted row move. The claim to make
unmissable: one-hot times a matrix IS row selection, so the "lookup table" and the
"linear layer" descriptions are the same object.

Which also answers "how does it learn?" — the same way every other weight matrix
does. The gradient reaching E is non-zero only in the rows for words that were in
the batch, which is why embedding gradients are sparse.
-->

---
layout: interactive
heading: What it learns is a geometry
title: What it learns is a geometry
aside-width: 21rem
---

<EmbeddingLab mode="space" />

::aside::

Nobody wrote these coordinates. They are weights, moved by ordinary gradient
descent.

<v-clicks>

- *great* and *brilliant* end up together
- *awful* and *terrible* too, at the far end
- *the* and *a* end up nowhere in particular

</v-clicks>

<div v-click class="mt-2 dl-secondary">

Two axes, so the picture is readable. A real table has 64, and no axis means
anything nameable.

</div>

<!--
The honest caveat in the secondary line matters: these coordinates are
hand-written to look like a trained table. Do not let anyone leave thinking
dimension 1 is "sentiment" in a real model.

The useful consequence: a word the model saw twice can inherit from a word it saw
a thousand times, because they sit near each other. That is what "extraction of
salient features" meant in the 2025 slide's bullet list.
-->

---
layout: default
title: Embeddings in code, and where they come from
---

# Embeddings in code, and where they come from

```python {all|1-2|4|5-6|all}{lines:true}
vocab_size, embed_dim = 20_000, 64
embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)

ids = torch.tensor([[41, 9, 2317, 0, 0]])      # (batch=1, time=5), 0 is padding
vectors = embed(ids)                            # (1, 5, 64)
print(embed.weight.shape)                       # torch.Size([20000, 64])
```

<div class="dl-tight">

<v-clicks>

- Input is **integer ids**, not one-hot. Shape `(B, T)` in, `(B, T, d)` out
- `padding_idx=0` pins row 0 at zero and keeps it there
- The 1.28 M numbers in `embed.weight` are 93% of the model, and they start random

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Or start them somewhere better: **word2vec**, **GloVe** and **fastText** are tables
trained on billions of words. Load one and the 93% arrives already knowing what
*brilliant* means.

</div>

<!--
padding_idx is the practical line. Without it the pad row drifts during training
and quietly contributes to every short sequence in the batch.

Pre-trained embeddings were the transfer learning of NLP from 2013 to 2018, and
they are the direct ancestor of "download a pre-trained transformer", which is
where the next two lectures go. Word vectors were the first half of the idea: the
words came pre-trained but the model reading them did not.
-->

---
layout: section
index: "05"
---

# An RNN in PyTorch

---
layout: default
title: The shape that causes the most bugs
---

# The shape that causes the most bugs

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

### `batch_first=False` — the default

<div class="mt-2 dl-math-sm">

$$ (T,\; B,\; \text{features}) $$

</div>

Time first. Convenient for the loop inside cuDNN, and a surprise for everyone
else.

</div>
<div>

### `batch_first=True` — what you want

<div class="mt-2 dl-math-sm">

$$ (B,\; T,\; \text{features}) $$

</div>

Batch first, like every other layer in PyTorch, and like `nn.Embedding`'s output.

</div>
</div>

<div v-click class="mt-5 dl-callout">

Pass `batch_first=True` and never think about it again. Leave it out and the model
still runs, still trains, and reads your batch dimension as time — a silent
disaster with no error message.

</div>

<div v-click class="mt-3 dl-secondary">

The hidden state is the exception: `h_n` is always
$(\text{layers} \times \text{directions},\; B,\; n_h)$, whatever `batch_first`
says.

</div>

<!--
This is the single most expensive line in the lecture. Say it, write it on the
board, and say it again when the code slide comes up.

The failure mode is worth spelling out: with (B, T, F) fed to a batch_first=False
layer, the layer treats each of the B examples as a time step of one sequence. The
loss goes down — it is still learning something — and the accuracy is nonsense.

The h_n exception catches people who then try to be consistent about it.
-->

---
layout: default
title: nn.LSTM returns two things, and you want one of them
---

# `nn.LSTM` returns two things, and you want one of them

```python {all|1-3|5|6|8-9|all}{lines:true}
lstm = nn.LSTM(input_size=64, hidden_size=128,
               num_layers=1, batch_first=True)

x = torch.randn(32, 200, 64)                  # (B, T, embed)
output, (h_n, c_n) = lstm(x)

print(output.shape)      # (32, 200, 128)  — the hidden state at *every* step
print(h_n.shape)         # (1, 32, 128)    — the hidden state at the *last* step
```

<div class="dl-tight">

<v-clicks>

- **Many → one** (classify a review): you want `h_n[-1]`, shape `(32, 128)`
- **Many → many in step** (a tag per word): you want `output`, `(32, 200, 128)`
- They agree: `output[:, -1, :]` equals `h_n[-1]` — for unpadded batches

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

Which one you take **is** the task shape from slide 12. Pick wrong and the shapes
still line up often enough to hide it.

</div>

<!--
Have them check bullet three as an assertion in the lab: torch.allclose(output[:,
-1, :], h_n[-1]). It is true, and the "for unpadded batches" caveat is the whole
subject of the next two slides.

c_n is the cell state and you almost never touch it — except to pass it back in
when continuing a sequence, as in truncated BPTT.

nn.RNN and nn.GRU return (output, h_n): one tensor, not a tuple. Only the LSTM
hands back two states, because only the LSTM has two.
-->

---
layout: default
title: Sequences in a batch are not the same length
---

# Sequences in a batch are not the same length

A batch is one rectangular tensor, so the short rows get **padded** with a
reserved id.

<div class="mt-3 dl-ledger dl-ledger--nums">

| review | ids, padded to 8 | real | pad |
| --- | --- | --- | --- |
| *a brilliant film about nothing* | `[7, 41, 12, 88, 63, 0, 0, 0]` | 5 | 3 |
| *not worth it* | `[23, 96, 14, 0, 0, 0, 0, 0]` | 3 | 5 |
| *the plot was thin but the acting saved it* | `[4, 55, 9, 71, 18, 4, 33, 60]` | 8 | 0 |
| *utterly awful* | `[31, 77, 0, 0, 0, 0, 0, 0]` | 2 | 6 |

</div>

<div class="dl-tight">

<v-clicks>

- 18 real tokens and 14 pad tokens. Nearly half the batch is nothing
- The LSTM runs 8 steps on row 4, six on padding — so `h_n` holds the state *after
  the padding*, not after *awful*
- So the batch has to carry its **lengths** alongside it

</v-clicks>

</div>

<!--
Draw attention to row 4. Two real words, six steps of padding, and the final
hidden state is the state after six updates on a token that means nothing. Nothing
crashes; the model just gets a worse feature vector for every short review in
every batch.

This is why a length tensor is part of the batch and why the collate function has
to build it. It is also the single most common reason a student's RNN scores worse
than their bag-of-words baseline.

Sorting a batch by length reduces the padding a lot. Bucketing by length reduces
it further, and torchtext's BucketIterator existed for exactly this.
-->

---
layout: default
title: Packing — tell the layer where to stop
---

# Packing — tell the layer where to stop

```python {all|3-5|7|9-11|all}{lines:true}
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence

packed = pack_padded_sequence(embedded, lengths.cpu(),
                              batch_first=True,
                              enforce_sorted=False)      # it sorts for you

packed_out, (h_n, c_n) = lstm(packed)                    # skips every pad step

output, _ = pad_packed_sequence(packed_out, batch_first=True)
#   h_n[-1]  is now the state after the *last real* token of each row
#   output   is padded again, with exact zeros where the padding was
```

<div class="dl-tight">

<v-clicks>

- `pack` flattens the batch into only the real tokens, plus a count per time step
- The layer then runs each row for exactly its own length
- `h_n` becomes correct, which is the entire reason to do this

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

Not an optimisation: without it `h_n` is the wrong vector for every padded row.

</div>

<!--
enforce_sorted=False is the modern convenience; older code sorts the batch by
length by hand and then has to unsort the outputs. Show them the flag exists.

lengths must be on the CPU — a real error message people hit and do not expect.

For a many-to-many model you could skip packing and mask the loss instead, and
that is a legitimate choice. For many-to-one you cannot: there is nothing to mask,
the damage is already inside h_n.
-->

---
layout: default
title: The model
---

# The model

```python {all|4-6|8-9|11|13-16|all}{lines:true}
class ReviewClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim=64, hidden=128, n_classes=2):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden, num_layers=1,
                            batch_first=True)
        self.dropout = nn.Dropout(0.3)
        self.head = nn.Linear(hidden, n_classes)     # logits — no softmax

    def forward(self, ids, lengths):
        emb = self.embed(ids)                              # (B, T, 64)
        packed = pack_padded_sequence(emb, lengths.cpu(),
                                      batch_first=True, enforce_sorted=False)
        _, (h_n, _) = self.lstm(packed)                    # (1, B, 128)
        return self.head(self.dropout(h_n[-1]))            # (B, 2)
```

<div v-click class="mt-3 dl-secondary">

Three layers, and the only unfamiliar line is the `pack`. `h_n[-1]` is "the last
layer's final state" — and with `num_layers=2` it is still the line you want.

</div>

<!--
Read the shape comments aloud; every one of them is checkable and they should
check them.

The dropout sits on the final state, between the recurrence and the head — the
same place as in the CNN, for the same reason. Dropout *inside* the recurrence
needs care: dropping a different set of units every step destroys the state.
nn.LSTM's own `dropout=` argument applies between stacked layers, not across time,
and it does nothing at all with num_layers=1 (PyTorch warns about this).

No softmax, because CrossEntropyLoss applies it — Lecture 04's trap, unchanged.
-->

---
layout: default
title: Shapes, end to end
---

# Shapes, end to end

<div class="dl-ledger">

| step | shape | what it is |
| --- | --- | --- |
| `ids` | `(32, 200)` | integer token ids, padded |
| `lengths` | `(32,)` | real length of each row |
| `embed(ids)` | `(32, 200, 64)` | a vector per token |
| `lstm(packed)` → `output` | `(32, 200, 128)` | the state at every step |
| `lstm(packed)` → `h_n` | `(1, 32, 128)` | the state after the last real token |
| `h_n[-1]` | `(32, 128)` | one feature vector per review |
| `head(…)` | `(32, 2)` | logits |

</div>

<div v-click class="mt-4 dl-callout">

Run a batch of noise through the model before writing the training loop — two lines,
and every shape mistake on this slide.

</div>

<!--
This is Lecture 04's shape ledger, for a sequence model. Same habit, same payoff.

The check:
    model = ReviewClassifier(20_000)
    ids = torch.randint(1, 20_000, (32, 200))
    lengths = torch.randint(5, 201, (32,))
    print(model(ids, lengths).shape)      # torch.Size([32, 2])

Note which dimension is 200 and which is 32 at every row, and that 200 disappears
after h_n — that is where the sequence becomes a vector.
-->

---
layout: default
title: The training loop, with one line added
---

# The training loop, with one line added

```python {all|1-3|6-7|8-11|12-14|all}{lines:true}
model = ReviewClassifier(vocab_size=20_000).to(device)
loss_fn = nn.CrossEntropyLoss()
optimiser = torch.optim.Adam(model.parameters(), lr=1e-3)

for epoch in range(epochs):
    model.train()
    for ids, lengths, labels in train_loader:
        ids, labels = ids.to(device), labels.to(device)
        logits = model(ids, lengths)
        loss = loss_fn(logits, labels)
        optimiser.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimiser.step()
```

<div v-click class="mt-3 dl-secondary">

Forward, loss, backward, **clip**, step. Weeks 3, 4 and 5 differ by one line and
one model class.

</div>

<!--
Say the thing the slide is for: the pipeline has not changed since week 3. A new
architecture is a new nn.Module.

The clip line is the only addition, and it is the one that keeps a recurrent run
from dying on its first long batch.

`lengths` stays on the CPU deliberately — pack_padded_sequence requires it, and
the model does the .cpu() itself, so this loop does not have to care.
-->

---
layout: default
title: Four bugs, and what each one looks like
---

# Four bugs, and what each one looks like

<div class="dl-tight">

<v-clicks>

- **`batch_first` left out.** No error. The model reads your batch as time, trains,
  and scores badly for no visible reason
- **No packing in a many → one model.** No error. `h_n` is the state after the
  padding, so every short review gets a worse feature vector
- **Loss computed on padding** in a many → many model. No error, and the model
  spends most of its capacity predicting the pad token. Use `ignore_index=0`
- **No clipping.** One long batch, one `nan` loss, and every weight in the model is
  `nan` from then on

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Three of the four produce **no error message at all** — only a model that is
quietly worse than it should be. Print your shapes and check `h_n` against
`lengths`.

</div>

<!--
This slide is the lab's FAQ, written in advance.

For bug 3: nn.CrossEntropyLoss(ignore_index=0) is the one-argument fix, and it is
why the pad id is conventionally 0 and conventionally reserved.

For bug 4: once a nan reaches the weights, nothing recovers — every subsequent
forward pass is nan. If a run goes to nan, restart it, do not wait.
-->

---
layout: section
index: "06"
---

# Generating, and the wall

---
layout: default
title: Generating one step at a time
---

# Generating one step at a time

Predicting the **next** token turns a classifier into a generator: the output at
step $t$ becomes the input at step $t+1$.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### Training — **teacher forcing**

<v-clicks>

- Feed the **true** previous token, whatever the model predicted
- Every step is independent, so the whole sequence trains in one pass
- Fast, stable, and the standard

</v-clicks>

</div>
<div>

### Inference

<v-clicks>

- There is no true previous token. Feed the model's **own** last output
- Which it has never been trained on — one early mistake compounds
- Called **exposure bias**, and it is why generated text drifts

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

Teacher forcing is slide 23's `output → hidden` wiring, made trainable — and still
how a language model is trained.

</div>

<!--
The mismatch between train and test is worth dwelling on, because it is one of the
few places in the course where the two differ by construction rather than by
accident.

Scheduled sampling — mixing in the model's own predictions with rising probability
— is the classic mitigation. In practice large models mostly outgrow the problem.

This slide is also the natural place to mention sampling temperature if the room is
interested: argmax generation is repetitive, and softmax(logits / T) is the knob.
-->

---
layout: interactive
heading: One sequence in, another out
title: One sequence in, another out
aside-width: 21rem
---

<SeqToSeqFlow />

::aside::

Lengths differ, word order differs, and nothing is emitted until the source has
been read.

<v-clicks>

- The **encoder**'s final state — the **context vector** — is all the decoder knows
- Drag the slider: two words or eight, the same 256 numbers

</v-clicks>

<div v-click class="dl-callout">

Eight words into 256 is generous. Forty into the same 256 is the bottleneck.

</div>

<!--
Drag the slider from 2 to 8 slowly and say the number out loud each time: still
256. That is the whole slide.

The second half of the argument, which the picture cannot show: the first word of
the source has to survive every subsequent update of the encoder state before the
decoder gets to see anything. Long sources lose their beginnings.

Cho et al. measured it in 2014 — BLEU falls off sharply past about 20 source
words. The fix was published the same year.
-->

---
layout: interactive
heading: Attention — stop choosing in advance
title: Attention — stop choosing in advance
aside-width: 20rem
---

<SeqToSeqFlow mode="attention" />

::aside::

Keep **every** encoder state, and build a **fresh** context at each output step.
Press **Next word**.

<v-clicks>

- *have* → the weight sits on *habe*
- *read* → on ***gelesen***, the **last** German word
- Nothing told it the alignment. It is learned

</v-clicks>

<div v-click class="mt-2 dl-callout">

No fixed summary, so nothing to overflow. The decoder looks things up instead of
remembering them.

</div>

<!--
Step through all five and stop on "read". The German verb is at the end of the
clause and the English one is in the middle; the attention weights cross, and the
crossing is the evidence that this is not a positional trick.

This is Bahdanau, Cho & Bengio, 2014 — attention bolted onto a recurrent
encoder-decoder. The recurrence is still there. Next week's move is to keep this
part and delete the recurrence.

That is the sentence to end the section on, so do not spend the attention
mathematics here — the next slide is three lines and then we stop.
-->

---
layout: default
title: Attention, in three lines
---

# Attention, in three lines

<div class="grid grid-cols-2 gap-8 mt-3">
<div class="dl-math-sm">

$$ e_{t,i} = a(\mathbf{s}_{t-1},\; \mathbf{h}_i) $$

$$ \alpha_{t,i} = \frac{\exp(e_{t,i})}{\sum_j \exp(e_{t,j})} $$

$$ \mathbf{c}_t = \sum_i \alpha_{t,i}\,\mathbf{h}_i $$

</div>
<div class="dl-tight">

<v-clicks>

- **Score** every encoder state against the decoder's current state. $a$ is a small
  MLP in the 2014 paper, a **dot product** in everything since
- **Softmax** the scores, so the weights sum to 1 — one weight per source position,
  which is what the widget drew
- **Weighted sum**: the context for this step, rebuilt from everything, every step

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Score, softmax, weighted sum. Next week that is the **whole** layer — with the
recurrence deleted and the sequence attending to itself.

</div>

<div class="mt-3">
  <Citation source="Bahdanau, Cho & Bengio, Neural Machine Translation by Jointly Learning to Align and Translate (2014)" url="https://arxiv.org/abs/1409.0473" />
</div>

<!--
Three lines, revealed one at a time, and then stop. Resist finishing the
transformer today.

The one thing to point at: everything on this slide is differentiable, so the
alignment is learned by the same gradient descent as the rest. Nobody supplies
alignments.

Bullet one is the bridge: replace a with a scaled dot product, drop the RNN, and
scaled dot-product attention is what you have. That is next week's first slide.
-->

---
layout: default
title: The other wall — and this one attention does not fix
---

# The other wall — and this one attention does not fix

$\mathbf{h}_t$ needs $\mathbf{h}_{t-1}$. So the steps **cannot** be computed in
parallel.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

<v-clicks>

- A 200-token sequence is **200 sequential** matrix multiplies, each waiting for the
  last
- The batch dimension parallelises; the **time** dimension cannot
- So no amount of hardware shortens the chain. Longer sequences are strictly
  slower, in training and at inference

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

A CNN reads all positions at once. So does attention — a weighted sum over
positions has nothing sequential in it.

</div>

<div v-click class="mt-3 dl-secondary">

Which is why the 2017 paper that removed the recurrence and kept only the attention
is called *Attention Is All You Need*, and why you have heard of it.

</div>

</div>
</div>

<!--
This is the slide that explains the last eight years, and the 2025 deck did not
have it. Spend two minutes.

Both walls matter, and they are different: the bottleneck is about what the model
can represent, and attention fixed it in 2014. Parallelism is about what a GPU can
train, and it is the reason recurrent models were abandoned rather than improved.
Scale needed parallelism, and recurrence cannot provide it.

If someone asks what recurrent models are still good for: very long or streaming
sequences where quadratic attention is unaffordable, small on-device models, and
the state-space revival — Mamba and friends are recurrent networks with a
parallelisable scan.
-->

---
layout: default
title: Where we got to
---

# Where we got to

<div class="grid grid-cols-2 gap-10 mt-2">
<div>

<v-clicks>

- Order matters, lengths vary → **one state, carried forward**
- The same pattern anywhere → **weights shared across time**
- One extra matrix, $W_{hh}$, and one step of delay

</v-clicks>

</div>
<div>

<v-clicks>

- Sharing across time means $W_{hh}^{\,k}$ → **gradients vanish or explode**
- Gates make the path **additive** → LSTM, GRU
- Words become vectors by a **learned lookup table**

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

And two walls: one fixed-size summary of the whole source, and no way to
parallelise time. Attention knocks the first down. Next week, something knocks
down both.

</div>

<!--
Read the left column as the architecture and the right as its consequences.

The last callout is the handover. Next week opens by taking the attention slide,
deleting the RNN around it, and asking what is left.
-->

---
layout: default
title: Reading, and the lab
---

# Reading, and the lab

<div class="grid grid-cols-3 gap-4 mt-4">
<div v-click>
  <LinkCard
    href="https://colah.github.io/posts/2015-08-Understanding-LSTMs/"
    title="Understanding LSTMs"
    blurb="Olah, 2015. The clearest explanation of the gates that exists. Read it once before the lab."
    icon="📄"
  />
</div>
<div v-click>
  <LinkCard
    href="https://karpathy.github.io/2015/05/21/rnn-effectiveness/"
    title="The Unreasonable Effectiveness of RNNs"
    blurb="Karpathy, 2015. A character-level LSTM writing Shakespeare, C code and LaTeX."
    icon="✍️"
  />
</div>
<div v-click>
  <LinkCard
    href="https://pytorch.org/docs/stable/generated/torch.nn.LSTM.html"
    title="nn.LSTM"
    blurb="The shapes, the two bias vectors, and the GRU's inverted update gate. Read the actual docs."
    icon="💻"
  />
</div>
</div>

<div v-click class="mt-5">

**In the lab.** Train the review classifier on this deck's shapes. Then break it on
purpose — drop `batch_first`, drop the packing, drop the clipping, one at a time —
and report what each costs you.

</div>

<div v-click class="mt-2 dl-secondary">

Reporting the damage is the graded part.

</div>

<!--
The deliberate-breakage exercise is the point. A student who has watched
batch_first cost them six accuracy points never forgets it, and no amount of
saying it from the front achieves that.

Practicalities — dataset, deadline, what to hand in — belong on the course page.
-->

---
layout: end
email: vajira@simula.no
next: Transformers
---

# To be continued…
