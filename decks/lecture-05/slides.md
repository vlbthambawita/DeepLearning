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

Change one word of a review and its meaning flips. Today's network reads the
words in order and keeps a note as it goes.

<div class="mt-5" style="max-width: 460px">
  <WordStrip review="B" verdict highlight="not" :width="460" />
</div>

<!--
One session. The arc: the data changed, so the layer has to change; the change
is a single feedback connection; that connection is what lets the network read a
sequence of any length, and also what makes it hard to train.

The picture is the running example, review B: "the movie was not great". The
0.22 on the right is P(positive) from the small two-unit network we build by hand
in section 01 — negative, as it should be. Do not explain it now; say "by the
end of section 01 you can compute that number yourself".

What the room already knows: the MLP and the neuron, gradient descent, PyTorch
training loops, CNNs, cross-entropy, Adam, and generative models. Nothing here
depends on anything the room has not seen. Attention appears in section 06, in
its original recurrent form only.

Do not rush section 02. Vanishing gradients are the reason LSTM and GRU exist,
and a student who has only been told "gradients vanish" cannot see why the fixes
are shaped the way they are.

Sections 04 and 05 (embeddings, PyTorch) are the compressible ones if the session
runs late — the lab covers them. Today ends on two walls a recurrent network hits.
-->

---
layout: default
title: Today, in seven parts
---

# Today, in seven parts

Today's network reads a review of any length **one word at a time**.

<div class="grid grid-cols-4 gap-x-4 gap-y-2 mt-3">
<div class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="sequence" :size="64" />
  <span class="dl-secondary">00 Order matters</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="loop" :size="64" />
  <span class="dl-secondary">01 One cell with a loop</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="fade" :size="64" />
  <span class="dl-secondary">02 Training through time</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="gate" :size="64" />
  <span class="dl-secondary">03 Gates that keep the past</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="map" :size="64" />
  <span class="dl-secondary">04 Words as vectors</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="shape" :size="64" />
  <span class="dl-secondary">05 The network in PyTorch</span>
</div>
<div class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="generate" :size="64" />
  <span class="dl-secondary">06 Generating text</span>
</div>
</div>

<div v-click class="mt-3 dl-callout">

Sections 01 to 03 are the core. Sections 04 and 05 are practice for the lab.

</div>

<!--
The glyph grid is the map of today, and the same seven glyphs come back on the
section dividers and on the recap. Point at three of them: the loop (section 01,
the one new wire), the fading arrows (section 02, why it is hard to train), and the
valve (section 03, the fix). Those three sections are the lecture — the click
says so. Sections 04 and 05 can shrink to one slide each if time is short — the
lab carries them.
-->

---
layout: section
index: "00"
---

# The data changed

<div style="position: absolute; right: 4.5rem; top: 50%; transform: translateY(-50%)">
  <RnnGlyph kind="sequence" :size="190" />
</div>

<!--
Section 00, about fifteen minutes. The glyph: word tiles in a row, read left to
right. The middle tile is marked — one word that changes the others.

What this section has to land, in order: text is written one token after another;
a fixed window does not fit text; averaging the words loses the order; and two
facts about sequences that become the recurrent layer.
-->

---
layout: default
title: One step at a time, through a window
---

# One step at a time, through a window

<svg viewBox="0 0 640 190" class="dl-diagram" role="img" aria-label="Top: review B read word by word, with a window of the last three words, movie was not, used to predict the next word. Bottom: in a long review the word not is fifteen words before great, outside the window of three">
  <text class="dl-dg-small" x="30" y="14">Review B</text>
  <rect class="dl-dg-box" x="30" y="30" width="100" height="34" rx="4" />
  <rect class="dl-dg-box" x="146" y="30" width="100" height="34" rx="4" />
  <rect class="dl-dg-box" x="262" y="30" width="100" height="34" rx="4" />
  <rect class="dl-dg-box" x="378" y="30" width="100" height="34" rx="4" />
  <rect class="dl-dg-box is-accent" x="494" y="30" width="100" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="80" y="52" text-anchor="middle">the</text>
  <text class="dl-dg-lab is-sm" x="196" y="52" text-anchor="middle">movie</text>
  <text class="dl-dg-lab is-sm" x="312" y="52" text-anchor="middle">was</text>
  <text class="dl-dg-lab is-sm" x="428" y="52" text-anchor="middle">not</text>
  <text class="dl-dg-lab is-sm" x="544" y="52" text-anchor="middle">?</text>
  <rect class="dl-dg-line" x="140" y="24" width="344" height="46" rx="6" />
  <text class="dl-dg-small" x="146" y="86">window of 3</text>
  <text class="dl-dg-small" x="544" y="86" text-anchor="middle">next word</text>
  <g v-click>
    <text class="dl-dg-small" x="30" y="114">5 words, or 500</text>
    <rect class="dl-dg-box is-accent" x="30" y="124" width="50" height="28" rx="3" />
    <text class="dl-dg-small" x="55" y="142" text-anchor="middle">not</text>
    <rect v-for="k in 14" :key="k" class="dl-dg-box" :x="60 + k * 28" y="124" width="22" height="28" rx="2" />
    <rect class="dl-dg-box" x="482" y="124" width="70" height="28" rx="3" />
    <text class="dl-dg-small" x="517" y="142" text-anchor="middle">great</text>
    <rect class="dl-dg-line" x="391" y="119" width="88" height="38" rx="4" />
    <text class="dl-dg-small" x="395" y="174">window of 3</text>
    <text class="dl-dg-small is-bad" x="30" y="174">not is 15 words back: outside the window</text>
  </g>
</svg>

A fixed window cannot see a *not* further back. And a review can be any length.

<div v-click class="mt-3 dl-callout">

Today's question: keep a **running summary** instead of a window.

</div>

<!--
Start with a model that reads text through a fixed window, the way a 1-D
convolution does. Top row: review B, one word after another, and a window of three
words. To guess the next word it sees "movie was not" and nothing else.

Click. Two things break the window for text.
1. Length. A review is 5 words or 500. A window wide enough for every review is
   mostly padding for most reviews.
2. Distance. "not" at the start can change a word much later. Here it is 15 words
   back, and the window of three cannot see it. Make the window 16 wide and the
   next review puts "not" 30 words back.

Then the callout, which is the question the whole deck answers: carry a running
summary forward — one small vector, updated after every word — instead of a
window. Section 01 builds that summary; the rest of the deck is about training it.

At the end of the deck we come back here: generating text one word at a time is
the same idea, predict the next word from the ones before it, with the running
summary in place of the window.
-->

---
layout: default
title: Two reviews, one word apart
---

# Two reviews, one word apart

<div class="grid grid-cols-[1fr_13rem] gap-8 mt-2 items-center">
<div>

<div class="grid grid-cols-[1fr_5.5rem] gap-2 items-center">
  <WordStrip review="A" :width="440" />
  <span class="dl-secondary">positive</span>
  <WordStrip review="B" highlight="not" :width="440" />
  <span class="dl-secondary">negative</span>
</div>

<div class="mt-4">

<v-clicks>

- Same words except one. Opposite labels.
- *not* alone means little. It flips the word **after** it.
- So the model must carry something from one word to the next.

</v-clicks>

</div>

</div>
<div>

<svg viewBox="0 0 220 200" class="dl-diagram is-xs" role="img" aria-label="A toy two-dimensional embedding: the, movie and was at the origin, not at zero one, great at one zero">
  <path class="dl-dg-arrow" d="M40 160 H200 M40 160 V20" />
  <circle class="dl-dg-dot" cx="40" cy="160" r="5" />
  <circle class="dl-dg-dot is-accent" cx="40" cy="50" r="6" />
  <circle class="dl-dg-dot" cx="150" cy="160" r="5" />
  <text class="dl-dg-small" x="48" y="128">the, movie, was [0, 0]</text>
  <text class="dl-dg-small" x="50" y="54">not [0, 1]</text>
  <text class="dl-dg-small" x="150" y="148" text-anchor="middle">great [1, 0]</text>
  <text class="dl-dg-small" x="40" y="182">dim 1: positive</text>
  <text class="dl-dg-small" x="40" y="14">dim 2: negation</text>
</svg>

<div class="dl-secondary text-center">Toy embedding: two numbers per word</div>

</div>
</div>

<div v-click class="mt-3 dl-callout">

These two reviews run through the whole lecture.

</div>

<!--
The point: this is the running example. Two reviews, the same words except
one, with opposite labels. Write both on the board and leave them there for the
whole session.

On screen: review A, "the movie was great" — positive. Review B, "the movie
was not great" — negative. The word strips show them tile by tile, with "not"
highlighted in B.

The right-hand picture is the toy embedding: each word becomes two numbers.
Dimension 1 means "a positive word", dimension 2 means "a negation word". The,
movie and was carry no sentiment, so they sit at [0, 0]; great is [1, 0]; not
is [0, 1]. Real embeddings have 64 or more dimensions and are learned — section
04 shows where they come from. Here we set them by hand so the arithmetic fits
on the board.

Click: "Same words except one. Opposite labels." Point at the "not" tile in
strip B — it is the only difference.

Click 2: before this one appears, get the room to say what "not" does. It has
no sentiment of its own; it changes the meaning of what comes after it. That is
exactly what a model of single words cannot see.

Click 3: so the model has to carry something from one word to the next. That
sentence is the motivation for everything that follows.

Click 4: the callout — these two reviews run through the whole lecture. Every
section comes back to them, with the same picture.

An older pair makes the same point and is worth saying aloud: "dog bites man"
(page 14) and "man bites dog" (front page) — identical words, different news.
-->

---
layout: default
title: "A bag of words: keep the words, drop the order"
---

# A bag of words: keep the words, drop the order

<svg viewBox="0 0 640 196" class="dl-diagram" role="img" aria-label="Review B as five word tiles is poured into a bag. The same five words in a shuffled order give the same bag. The bag becomes one vector, the average of the five word vectors, 0.2 and 0.2">
  <defs>
    <marker id="l5a-bag-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="20" y="12">review B</text>
  <rect v-for="k in 5" :key="`b${k}`" :class="k === 4 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="20 + (k - 1) * 80" y="20" width="72" height="30" rx="4" />
  <text v-for="(w, k) in ['the', 'movie', 'was', 'not', 'great']" :key="`bw${k}`" class="dl-dg-lab is-sm" :x="56 + k * 80" y="40" text-anchor="middle" v-text="w" />
  <path class="dl-dg-arrow" marker-end="url(#l5a-bag-head)" d="M424 35 H468" />
  <path class="dl-dg-box" d="M492 22 Q540 8 588 22 L612 104 Q540 126 468 104 Z" />
  <path class="dl-dg-line" d="M506 22 Q540 32 574 22" />
  <text class="dl-dg-small" x="540" y="50" text-anchor="middle">great</text>
  <text class="dl-dg-small" x="506" y="68" text-anchor="middle">the</text>
  <text class="dl-dg-small is-bad" x="570" y="72" text-anchor="middle">not</text>
  <text class="dl-dg-small" x="532" y="90" text-anchor="middle">movie</text>
  <text class="dl-dg-small" x="580" y="98" text-anchor="middle">was</text>
  <g v-click="1">
    <text class="dl-dg-small" x="20" y="74">shuffled</text>
    <rect v-for="k in 5" :key="`s${k}`" :class="k === 2 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="20 + (k - 1) * 80" y="82" width="72" height="30" rx="4" />
    <text v-for="(w, k) in ['great', 'not', 'was', 'movie', 'the']" :key="`sw${k}`" class="dl-dg-lab is-sm" :x="56 + k * 80" y="102" text-anchor="middle" v-text="w" />
    <path class="dl-dg-arrow" marker-end="url(#l5a-bag-head)" d="M424 97 H468" />
    <text class="dl-dg-small is-bad" x="446" y="124" text-anchor="middle">same bag</text>
  </g>
  <g v-click="2">
    <path class="dl-dg-arrow" marker-end="url(#l5a-bag-head)" d="M540 120 V146" />
    <rect class="dl-dg-box is-accent" x="490" y="150" width="100" height="30" rx="4" />
    <text class="dl-dg-lab is-sm" x="540" y="170" text-anchor="middle">[0.2, 0.2]</text>
    <text class="dl-dg-small" x="20" y="152">average of the five word vectors:</text>
    <text class="dl-dg-small" x="20" y="172">([0, 0] + [0, 0] + [0, 0] + [0, 1] + [1, 0]) / 5 = [0.2, 0.2]</text>
  </g>
</svg>

<div class="dl-tight">

<v-clicks>

- In a bag, only **which words appear** survives, not their order.
- The bag becomes **one vector**: the average of its word vectors, for any review length.

</v-clicks>

</div>

<div v-click="3" class="mt-2 dl-callout">

A **bag of words**: the simplest text model. Does it keep what *not* does?

</div>

<!--
The point: before testing it, name the simplest way to read text with the
networks the room already has. A bag of words throws away the order of the
words and keeps only which words appear. The next slide tests whether that is
enough for our two reviews.

On screen: the top row is review B, word by word. The arrow pours the five words
into a bag; inside the bag they have no order any more. "not" is drawn in red in
the bag because it is the word whose position matters.

Click: the second row is the same five words shuffled — "great not was movie
the". It goes into exactly the same bag. That is the definition: two reviews with
the same words, in any order, are the same bag.

Click 2: the bag becomes one vector. With the toy embedding, the, movie and was
are [0, 0], not is [0, 1] and great is [1, 0]. Add the five vectors and divide by
five: ([0, 0] + [0, 0] + [0, 0] + [0, 1] + [1, 0]) / 5 = [1, 1] / 5 = [0.2, 0.2].
That one vector is what a classifier sees. A 4-word review and a 400-word review
both become two numbers, so a plain dense layer can read either.

Click 3: the callout. A bag of words is the simplest text model, and it is a
strong baseline in practice. The question for the next slide: it keeps the
word "not", but does it keep what "not" does to the word after it?

Variants worth naming if asked: instead of averaging embeddings, the classic
version counts each word of the vocabulary (a vector of 20 000 counts). The
order is lost either way.
-->

---
layout: default
title: Averaging loses the order
---

# Averaging loses the order

<div class="grid grid-cols-[19rem_1fr] gap-8 mt-1">
<div>

<svg viewBox="0 0 330 240" class="dl-diagram" role="img" aria-label="The average word vector of each review on a plane. A at 0.25, 0; B at 0.2, 0.2. A horizontal line at 0.1 separates them. C and D, the same six words in a different order, both land at 0, 0.17">
  <path class="dl-dg-arrow" d="M50 200 H305 M50 200 V14" />
  <text class="dl-dg-small" x="44" y="124" text-anchor="end">0.1</text>
  <text class="dl-dg-small" x="305" y="234" text-anchor="end">positive →</text>
  <text class="dl-dg-small" x="56" y="12">↑ negation</text>
  <circle class="dl-dg-dot is-accent" cx="250" cy="200" r="6" />
  <text class="dl-dg-small is-good" x="250" y="188" text-anchor="middle">A [0.25, 0]</text>
  <circle class="dl-dg-dot is-bad" cx="210" cy="40" r="6" />
  <text class="dl-dg-small is-bad" x="210" y="28" text-anchor="middle">B [0.2, 0.2]</text>
  <g v-click="1">
    <path class="dl-dg-loss" d="M50 120 H305" />
    <text class="dl-dg-small" x="300" y="113" text-anchor="end">any not → negative</text>
  </g>
  <g v-click="2">
    <circle class="dl-dg-dot" cx="50" cy="67" r="6" />
    <circle class="dl-dg-box is-bad" cx="50" cy="67" r="11" />
    <text class="dl-dg-small" x="66" y="64">C, D [0, 0.17]</text>
    <text class="dl-dg-small is-bad" x="66" y="78">wrong for C</text>
  </g>
</svg>

</div>
<div>

A **bag of words** averages the word vectors, so order is lost.

<div v-click="1" class="mt-3">

A and B still differ: a line splits them.

</div>

<div v-click="2" class="mt-3">

Add *bad* = [−1, 0], and reorder:

<div class="grid grid-cols-[1fr_4.8rem] gap-1 items-center mt-1">
  <WordStrip :review="['not', 'bad,', 'the', 'movie', 'was', 'great']" highlight="not" :width="330" />
  <span class="dl-secondary">C positive</span>
  <WordStrip :review="['not', 'great,', 'the', 'movie', 'was', 'bad']" highlight="not" :width="330" />
  <span class="dl-secondary">D negative</span>
</div>

</div>

<div v-click="3" class="mt-3 dl-callout">

Same average, opposite labels. No rule on the average can fix that.

</div>

</div>
</div>

<!--
The arithmetic, for the board. The, movie, was are [0, 0]; not is [0, 1]; great
is [1, 0].
A: (0 + 0 + 0 + [1, 0]) / 4 = [0.25, 0].
B: ([0, 1] + [1, 0]) / 5 = [0.2, 0.2].

Be honest about click 1: on this pair, averaging works. The two points are
different, and a line at "dimension 2 = 0.1" separates them. But look at what that
line has learned: "a review with a not anywhere in it is negative". That is a
rule about which words occur, not about what not does to the word after it.

Click 2 breaks the rule. Add one word, bad = [−1, 0] (a negative word). Then
C = "not bad, the movie was great" is positive, and D = "not great, the movie
was bad" is negative. Same six words, so the same average:
([0, 1] + [−1, 0] + [1, 0]) / 6 = [0, 1/6] = [0, 0.17].
One point, two opposite labels. No classifier that only sees the average — linear
or not — can label both correctly. And the "any not" rule from click 1 gets C
wrong.

A second weakness, for the notes: the average dilutes. In a 500-word review the
not contributes 1/500 of the average, so the signal shrinks with length.

What survives: averaging keeps which words occur. It loses the order, and so it
loses which word modifies which.
-->

---
layout: default
title: Try it with the network we already have
---

# Try it with the network we already have

<svg viewBox="0 0 600 150" class="dl-diagram" role="img" aria-label="A fixed window of 200 slots. Review A fills slots 1 to 4 and review B slots 1 to 5; the rest is padding. Great sits in slot 4 for A and slot 5 for B, so different weights read it">
  <text class="dl-dg-small" x="60" y="14">slot 1</text>
  <text class="dl-dg-small" x="530" y="14">slot 200</text>
  <text class="dl-dg-lab is-sm" x="20" y="43">A</text>
  <text class="dl-dg-lab is-sm" x="20" y="87">B</text>
  <rect v-for="k in 4" :key="`a${k}`" :class="k === 4 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="60 + (k - 1) * 62" y="24" width="56" height="28" rx="3" />
  <rect v-for="k in 3" :key="`ap${k}`" class="dl-dg-fill is-muted is-dashed" :x="308 + (k - 1) * 62" y="24" width="56" height="28" rx="3" />
  <rect class="dl-dg-fill is-muted is-dashed" x="530" y="24" width="56" height="28" rx="3" />
  <text v-for="(w, k) in ['the', 'movie', 'was', 'great']" :key="`aw${k}`" class="dl-dg-lab is-sm" :x="88 + k * 62" y="43" text-anchor="middle" v-text="w" />
  <rect v-for="k in 5" :key="`b${k}`" :class="k === 5 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="60 + (k - 1) * 62" y="68" width="56" height="28" rx="3" />
  <rect v-for="k in 2" :key="`bp${k}`" class="dl-dg-fill is-muted is-dashed" :x="370 + (k - 1) * 62" y="68" width="56" height="28" rx="3" />
  <rect class="dl-dg-fill is-muted is-dashed" x="530" y="68" width="56" height="28" rx="3" />
  <text v-for="(w, k) in ['the', 'movie', 'was', 'not', 'great']" :key="`bw${k}`" class="dl-dg-lab is-sm" :x="88 + k * 62" y="87" text-anchor="middle" v-text="w" />
  <path class="dl-dg-loss" d="M492 38 H526 M492 82 H526" />
  <text class="dl-dg-small" x="558" y="62" text-anchor="middle">pad</text>
  <g v-click="1">
    <path class="dl-dg-loss" d="M274 100 V122 M336 100 V122" />
    <text class="dl-dg-small is-bad" x="305" y="138" text-anchor="middle">different weights</text>
  </g>
</svg>

<div class="mt-1 dl-tight">

Each slot: a **one-hot** vector of 20 000 numbers, all 0 except one 1. So 4 000 000 inputs.
Into 256 units: **1 024 000 256 weights**.

</div>

<div v-click="1" class="mt-2">

**Position-locked.** *great* in slots 4 and 5 meets different weights.

</div>

<div v-click="2" class="mt-2 dl-callout">

It tells A from B, but learns each word again at every position.

</div>

<!--
The point: try the tool the room already has — flatten a review into one long
vector and feed it to a dense layer, exactly as with MNIST. It works on A and
B, but it is huge and it learns every word again at every position.

On screen: a window of 200 slots, one word per slot. Review A fills slots 1 to
4, review B slots 1 to 5; the dashed boxes are padding. The highlighted box is
great: slot 4 in A, slot 5 in B.

Do the arithmetic in the text aloud. A one-hot vector is 20 000 numbers, all
zero except a single 1 at the word's index. 200 slots x 20 000 = 4 000 000
inputs. One dense layer of 256 units: 4 000 000 x 256 + 256 biases =
1 024 000 256 weights. A billion, before the second layer and before anything
has been learned.

Click: two things appear together — the red marks under slots 4 and 5 in the
picture ("different weights"), and the "Position-locked" line. great sits in
slot 4 in A and slot 5 in B, so different columns of weights read it. The layer
must learn great, and not-before-great, separately at every one of the 200
positions. This is the complaint that led to CNNs, with "pixel" replaced by
"position", and the answer is the same: share the weights.

Click 2: the callout. Be fair to it: unlike the average on the last slide, the
window keeps the order, so it can tell A from B. But it learns each word again
at every position.

The slide shows the worst problem (position-locking); say the other two aloud.

1. Fixed length. Every review must be exactly 200 words. Longer ones are cut —
   and the cut can remove the word that carries the label. Short ones are
   padded, and review A is 196 slots of padding out of 200.
2. Size. Even with a 64-number embedding instead of one-hot (200 x 64 = 12 800
   inputs), the dense layer is 12 800 x 256 + 256 = 3.28 M weights, plus
   1.28 M for the embedding. The LSTM classifier we build in section 05
   (embedding 20 000 x 64, LSTM 64 to 128, a linear head to 2 classes) has
   1 379 586 ≈ 1.38 M parameters in total — and that number does not change
   when the review gets longer.
-->

---
layout: default
title: Sequence, or time series?
---

# Sequence, or time series?

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

<svg viewBox="0 0 260 70" class="dl-diagram" role="img" aria-label="A DNA sequence as letter tiles in a row, indexed by position only">
  <rect v-for="(c, k) in ['A', 'C', 'G', 'G', 'T', 'T', 'A']" :key="k" class="dl-dg-box" :x="4 + k * 36" y="8" width="30" height="28" rx="3" />
  <text v-for="(c, k) in ['A', 'C', 'G', 'G', 'T', 'T', 'A']" :key="`t${k}`" class="dl-dg-lab is-sm" :x="19 + k * 36" y="27" text-anchor="middle" v-text="c" />
  <text class="dl-dg-small" x="4" y="56">positions only</text>
</svg>

### Sequence

Order matters. No clock needed.

<v-clicks>

- the words of a sentence
- a DNA (genetic code) sequence

</v-clicks>

</div>
<div>

<svg viewBox="0 0 260 70" class="dl-diagram" role="img" aria-label="A time series: samples on a time axis with an uneven gap between two of them">
  <path class="dl-dg-arrow" d="M4 52 H252" />
  <path class="dl-dg-line" d="M10 34 L30 22 L50 30 L64 14 L110 26 L126 18 L190 36 L240 24" />
  <circle v-for="(p, k) in [[10, 34], [30, 22], [50, 30], [64, 14], [110, 26], [126, 18], [190, 36], [240, 24]]" :key="k" class="dl-dg-dot" :cx="p[0]" :cy="p[1]" r="3" />
  <text class="dl-dg-small is-bad" x="158" y="14" text-anchor="middle">gap</text>
  <text class="dl-dg-small" x="252" y="66" text-anchor="end">time →</text>
</svg>

### Time series

A sequence on a **time** axis. The gaps are data too.

<v-clicks>

- stock prices, one per minute
- speech: 16 000 samples a second
- an ECG (electrocardiogram) trace

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

Every time series is a sequence. Today's models see only positions.

</div>

<!--
The point: a vocabulary check. A sequence is anything where order matters; a
time series is a sequence on a time axis, where the gaps are data too. The
models today see only positions.

On screen: the left picture has positions and nothing else — DNA letters in a
row. The right one has a time axis, and the uneven gap between two samples
(marked in red) is itself information.

Click: "the words of a sentence" — our reviews are this kind.

Click 2: "a DNA (genetic code) sequence" — order matters, no clock.

Click 3: "stock prices, one per minute" — a time series with regular sampling.

Click 4: "speech: 16 000 samples a second" — also regular, but very long.

Click 5: "an ECG (electrocardiogram) trace" — the heart's electrical signal,
for anyone with clinical interests.

Click 6: the callout. Every time series is a sequence, but today's models see
only positions.

That distinction matters for one practical reason: with a time series you often
have to decide what to do about irregular sampling and missing steps. A plain
RNN silently treats "one step" as "one row of the tensor", whatever the real
gap was. A patient's vitals, sampled whenever a nurse comes by, is the classic
case. Mention it; do not solve it.

More examples if the room wants them: the moves of a chess game (a sequence, no
clock that matters).

Short slide: a minute or two.
-->

---
layout: default
title: Two facts about sequences
---

# Two facts about sequences

CNNs turned two facts about images into wiring. Sequences have two facts too.

<svg viewBox="0 0 640 210" class="dl-diagram" role="img" aria-label="The five words of review B, each read by a cell with the same weights W, and a state h passed from each cell to the next">
  <defs>
    <marker id="l5a-facts-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect v-for="k in 5" :key="k" :class="k === 4 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="20 + (k - 1) * 124" y="8" width="96" height="28" rx="4" />
  <text v-for="(w, k) in ['the', 'movie', 'was', 'not', 'great']" :key="w" class="dl-dg-lab is-sm" :x="68 + k * 124" y="27" text-anchor="middle" v-text="w" />
  <g v-click>
    <path v-for="k in 5" :key="`d${k}`" class="dl-dg-arrow" marker-end="url(#l5a-facts-head)" :d="`M${68 + (k - 1) * 124} 38 V60`" />
    <rect v-for="k in 5" :key="`c${k}`" class="dl-dg-net" :x="40 + (k - 1) * 124" y="64" width="56" height="34" rx="5" />
    <text v-for="k in 5" :key="`w${k}`" class="dl-dg-in" :x="68 + (k - 1) * 124" y="86" text-anchor="middle">W</text>
    <text class="dl-dg-lab is-sm" x="20" y="134">1. Same pattern, same meaning, anywhere</text>
    <text class="dl-dg-small is-good" x="38" y="152">→ one set of weights for every position</text>
  </g>
  <g v-click>
    <path v-for="k in 4" :key="`h${k}`" class="dl-dg-line" marker-end="url(#l5a-facts-head)" :d="`M${98 + (k - 1) * 124} 81 H${160 + (k - 1) * 124}`" />
    <text v-for="k in 4" :key="`hl${k}`" class="dl-dg-small is-good" :x="129 + (k - 1) * 124" y="74" text-anchor="middle">h</text>
    <text class="dl-dg-lab is-sm" x="20" y="180">2. Earlier words change later ones</text>
    <text class="dl-dg-small is-good" x="38" y="198">→ a state h, carried to the next step</text>
  </g>
</svg>

<div v-click class="mt-2 dl-callout">

Shared weights plus a carried state: that is the whole architecture.

</div>

<!--
CNNs did this for images: things are local, and things repeat. Repetition
became parameter sharing — one filter slid over every position. Locality does
not carry over: a sentence is not a neighbourhood, it is an order. Say that in one
breath; it is the only CNN recap the section needs.

Click 1, fact one: "not great" is negative at word 4 and at word 140. So one set
of weights W should read every position — the same W in every box. This fixes
the position-locked window from two slides back.

Click 2, fact two: what came earlier changes what a later word means. So
something has to be carried from each position to the one after it: the state h,
one small vector passed along the row. It is the running summary from
"One step at a time, through a window".

The picture is the recurrent network unrolled over review B, before we have
named it. Section 01 opens on exactly this drawing, folded into one cell with a
loop. A good image for the room: the state is a note passed along a row of
people. Each person reads one word, updates the note, and passes it on.

Write the two facts on the board; the rest of the lecture refers back to them by
number.
-->

---
layout: interactive
heading: An aside — a convolution can read a sequence too
title: An aside — a convolution can read a sequence too
aside-width: 19rem
---

<Conv1DLab :controls="['padding', 'stride']" />

::aside::

<v-clicks>

- **Parallel**: each output needs only nearby words, so all are computed at once
- **Limited** reach: nothing from 60 words ago
- A recurrent layer: step 5 waits for step 4, so steps run **one after another**. But the state reaches any distance.

</v-clicks>

<svg v-click="3" viewBox="0 0 260 84" class="dl-diagram mt-1" role="img" aria-label="Order of computation. Convolution: five outputs, all computed in round 1. Recurrent layer: five steps in a chain, computed in rounds 1 to 5">
  <defs>
    <marker id="l5a-par-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="0" y="24">conv</text>
  <rect v-for="k in 5" :key="`c${k}`" class="dl-dg-box is-accent" :x="64 + (k - 1) * 40" y="8" width="28" height="24" rx="3" />
  <text v-for="k in 5" :key="`ct${k}`" class="dl-dg-lab is-sm" :x="78 + (k - 1) * 40" y="25" text-anchor="middle">1</text>
  <text class="dl-dg-small" x="0" y="66">recurrent</text>
  <rect v-for="k in 5" :key="`r${k}`" class="dl-dg-box" :x="64 + (k - 1) * 40" y="50" width="28" height="24" rx="3" />
  <text v-for="k in 5" :key="`rt${k}`" class="dl-dg-lab is-sm" :x="78 + (k - 1) * 40" y="67" text-anchor="middle" v-text="k" />
  <path v-for="k in 4" :key="`ra${k}`" class="dl-dg-arrow" marker-end="url(#l5a-par-head)" :d="`M${93 + (k - 1) * 40} 62 H${103 + (k - 1) * 40}`" />
  <text class="dl-dg-small" x="260" y="44" text-anchor="end">number = round it is computed in</text>
</svg>

<!--
The point: this slide exists so nobody leaves believing recurrence is the only
way to read a sequence. A 1-D convolution reads one too — in parallel, but only
as far as its filter reaches.

On screen: the 1-D convolution widget, with the axis read as time. One filter
slides along the input and every output uses the same weights — weight sharing
across positions, which already fixes the position-locking problem from the
dense-layer slide. Try the padding and stride controls: padding keeps the
output as long as the input, stride 2 halves it.

Click: "Parallel". Each output of the convolution depends only on the few input
words under the filter, and the input is all known in advance. No output needs
another output, so a GPU computes all of them at the same time.

Click 2: the reach is limited. The filter's reach is its receptive field:
stacking layers widens it, but it is always a fixed number of positions. If the
"not" is 60 words back, outside the reach, the output never sees it.

Click 3: a recurrent layer makes the opposite trade, and the small picture shows it. The
number in each box is the round in which that output can be computed. The
convolution's five outputs are all computed in round 1. The recurrent layer's step 5 needs
the state from step 4, which needs step 3, and so on, so the five steps take five
rounds, one after another. A 500-word review takes 500 rounds, however big the
GPU is. What the RNN gets in return: the state is passed along the whole chain,
so a word from any distance back can still affect the output. Plant the flag for
the last section: this waiting is the second wall at the end of today.

If someone offers n-grams: yes, a bigram catches "not good", and that is
exactly what a 1-D convolution with a width-2 filter learns. It will not catch
"not, by any stretch of the imagination, good". Unlimited distance is what
recurrence buys.

WaveNet and ByteNet are convolutional; so is most on-device audio.
-->

---
layout: interactive
heading: Which shapes does a sequence problem come in?
title: Which shapes does a sequence problem come in?
aside-width: 16rem
---

<SequenceTasks />

::aside::

Five wirings of one cell. What changes: **which steps take an input, and which
give an output**.

<div v-click class="mt-3 dl-secondary">

Start on **no recurrence**: one input, one output. Which one reads review B and
gives one label?

</div>

<div v-click class="mt-3 dl-callout">

The shape decides where the loss is computed, and what `forward` returns.

</div>

<!--
Start on the first tab, "no recurrence". Its caption uses the word IID:
independent and identically distributed. Independent means one example tells you
nothing about the next one; identically distributed means they all come from the
same data. Five Iris flowers are IID, so their order does not matter and
shuffling them changes nothing. The five words of a review are not: shuffle them
and the meaning changes. Everything else in this lecture is about data that is
not IID along the time axis.

Click through all five and read the examples. Then ask which one the review
classifier is: many to one — five words in, one label out. Autocomplete is many to
many, in step, shifted by one: predict the next word from the ones before it.

The encoder-decoder tab is what the last section of the lecture is about
(translating review B into Norwegian). Flag it and move on.
-->

---
layout: default
title: "Poll: which model just broke?"
---

<div class="grid grid-cols-[1fr_15rem] gap-6 items-start">
<div>

<PollSlide
  question="You train a sentiment model on 200-word reviews. At test time a 340-word review arrives. Which model just broke?"
  :items="[
    'The flattened MLP (multi-layer perceptron): its input layer has a fixed width',
    'The 1D CNN: its filters have a fixed size',
    'The RNN (recurrent neural network): it has a fixed number of time steps',
    'All three',
  ]"
/>

</div>
<div>

<svg viewBox="0 0 240 110" class="dl-diagram" role="img" aria-label="Training reviews are 200 words long; the test review is 340 words long">
  <text class="dl-dg-small" x="4" y="16">training: 200 words</text>
  <rect class="dl-dg-fill is-muted" x="4" y="24" width="118" height="22" rx="3" />
  <text class="dl-dg-small" x="4" y="72">test: 340 words</text>
  <rect class="dl-dg-fill" x="4" y="80" width="200" height="22" rx="3" />
  <path class="dl-dg-loss" d="M122 20 V106" />
</svg>

<div v-click class="mt-3 dl-reveal">

The MLP

</div>

<div v-click class="mt-2 dl-secondary">

A filter slides, so a CNN takes any length. An RNN's loop runs as many times as
you ask. Only the flattened dense layer has a width built into its weights.

</div>

</div>
</div>

<!--
Hands up for each before revealing. The picture: the dashed line is where the
training reviews end; the test review runs past it.

Option 3 catches people who have not yet realised there is one cell rather than T
cells — which is exactly what the next section shows. The unrolled picture on
"Two facts about sequences" had five boxes, but they were the same W five times.

Option 2 is the one to discuss: the 1D CNN's filters do not break, but if its last
layer flattens the feature map into a dense head, that head breaks for the same
reason as the MLP. Global pooling over time is the usual fix.
-->

---
layout: section
index: "01"
---

# The recurrent layer

One note, passed along a row of readers.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><RnnGlyph kind="loop" :size="190" /></div>

<!--
Section 01 is the lecture, part 1. Never cut it. About 25 minutes.

The glyph is a cell whose output curls back into its own input: the state. It
comes back on the overview and the recap, so name it now: "this loop is the whole
idea of the lecture".

The metaphor for the whole section: a row of people pass a note along. Each one
reads one word of the review, updates the note, and passes it on. The last person
reads the note and says positive or negative. The note is the hidden state.
-->

---
layout: interactive
heading: One new wire
title: One new wire
aside-width: 17rem
---

<RnnUnroll example="review" start="fold" />

::aside::

A layer whose **output feeds back in**: a note passed along a row of readers.

<v-clicks>

- $W_{xh}$ reads this word
- $W_{hh}$ reads the note — the layer's last output
- $W_{ho}$ turns the note into an answer

</v-clicks>

<div v-click class="mt-1 dl-callout">

New since the dense layer: one extra matrix, one step of delay.

</div>

<!--
The point: a recurrent layer is an ordinary layer with one new wire — its
output feeds back in as an input at the next step.

On screen: the widget starts folded. Press nothing yet; let them look at the
loop. The box is one hidden layer, the word comes in from below, and the
output of the layer comes back round into itself.

The single most common misreading is that the loop is a second layer or a
memory buffer sitting beside the network. It is neither: it is the same units,
reading the values they held one step ago. In the toy network there are two
units; in the code later there are 128.

The note metaphor in the aside: each reader gets one word of review B ("the
movie was not great") and the note from the person before. They write a new
note and pass it on.

Click: W_xh reads this word — how the reader reads the word.

Click 2: W_hh reads the note, which is the layer's own last output — how they
read the old note.

Click 3: W_ho turns the note into an answer — the output layer.

Click 4: the callout. Compared with the dense layer, the only thing new is one
extra matrix (W_hh) and one step of delay. "One step of delay" is worth
repeating: without the delay the definition would be circular.
-->

---
layout: interactive
heading: The same layer, once per step
title: The same layer, once per step
aside-width: 18rem
---

<RnnUnroll example="review" start="unroll" />

::aside::

**Unrolling** draws one copy of the layer per word. Press **Next step**.

<v-clicks>

- Every $W$ here is the **same matrix**
- The chain grows with the review; the weights do not
- $\mathbf{h}_0 = \mathbf{0}$: the note starts blank

</v-clicks>

<div v-click class="mt-2 dl-callout">

Review A (*…was great*) and B (*…not great*) both end on *great*. Only the note differs.

</div>

<!--
The point: unrolling draws one copy of the layer per word. It is the same layer
with the same weights, used once per step.

On screen: the widget starts unrolled. Press "Fold it back" and "Unroll it" a
couple of times. Folded is the network; unrolled is the computation. Students
who only ever see one of the two pictures get a specific wrong idea from each:
a memory cell, or five layers with five sets of weights.

Click: every W in the unrolled picture is the same matrix — the copies share
it.

Click 2: the chain grows with the review; the weights do not. A 1000-word
review is a longer chain, not a bigger model.

Click 3: h_0 = 0 — the note starts blank. If someone asks whether h_0 could be
learned: yes, and it sometimes is. Zeros is the default and it is nearly always
fine.

Now press "Next step" and walk through review B. "the", "movie", "was" embed as
[0, 0], so the note stays [0, 0]. "not" sets the first unit: h = [0.96, 0].
"great" arrives with the note already marked, and the state becomes
[0.45, -0.42]. In review A the same "great" arrives with a blank note and gives
[0, 0.76].

Click 4: the callout. A and B are the two running reviews: A is "the movie was
great" (positive), B is "the movie was not great" (negative). Both end on the
word great, so at that last step they give the same input x = [1, 0] to the same
weights. The only difference is the note that arrives with it: blank [0, 0] in
A, the not-flag [0.96, 0] in B. Same word, same weights, different note,
opposite answer.
-->

---
layout: default
title: The forward pass, written down
---

# The forward pass, written down

The new note is a squashed sum of this word and the old note:

<div class="dl-math-sm">

$$ \mathbf{h}_t = \tanh\!\left(W_{xh}\,\mathbf{x}_t + W_{hh}\,\mathbf{h}_{t-1} + \mathbf{b}_h\right) \qquad \mathbf{o}_t = W_{ho}\,\mathbf{h}_t + \mathbf{b}_o $$

</div>

<div class="grid grid-cols-[1fr_1.15fr] gap-8 mt-2 items-start dl-tight">
<div>

<svg viewBox="0 0 320 170" class="dl-diagram is-sm" role="img" aria-label="One recurrent cell: the old state comes in from the left, the input from below, the new state leaves to the right and the output goes up">
  <defs>
    <marker id="l5b-fwd-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <rect x="115" y="66" width="90" height="42" rx="6" class="dl-dg-box is-accent" />
  <text x="160" y="93" text-anchor="middle" class="dl-dg-lab is-sm">tanh</text>
  <text x="30" y="92" text-anchor="middle" class="dl-dg-in">hₜ₋₁</text>
  <path d="M52 87 H111" class="dl-dg-arrow" marker-end="url(#l5b-fwd-head)" />
  <text x="82" y="78" text-anchor="middle" class="dl-dg-small">W_hh</text>
  <path d="M207 87 H266" class="dl-dg-arrow" marker-end="url(#l5b-fwd-head)" />
  <text x="290" y="92" text-anchor="middle" class="dl-dg-in">hₜ</text>
  <text x="160" y="162" text-anchor="middle" class="dl-dg-in">xₜ</text>
  <path d="M160 146 V112" class="dl-dg-arrow" marker-end="url(#l5b-fwd-head)" />
  <text x="168" y="134" class="dl-dg-small">W_xh</text>
  <path d="M160 64 V30" class="dl-dg-arrow" marker-end="url(#l5b-fwd-head)" />
  <text x="168" y="50" class="dl-dg-small">W_ho</text>
  <text x="160" y="20" text-anchor="middle" class="dl-dg-in">oₜ</text>
</svg>

</div>
<div>

<v-clicks>

- $\mathbf{x}_t$ — this word's embedding
- $\mathbf{h}_{t-1}$ — the note: **all the layer remembers**
- $\tanh$ keeps $\mathbf{h}$ between −1 and 1

</v-clicks>

<div v-click class="mt-2 dl-callout">

Delete the second term and this is a dense layer.

</div>

<div v-click class="mt-2 dl-secondary">

$\mathbf{o}_t$: logits, with no activation.

</div>

</div>
</div>

<!--
The point: the whole recurrent layer is one equation. The new note is a
squashed sum of this word and the old note.

Read it aloud in words first: "h_t equals tanh of W_xh times x_t, plus W_hh
times h_{t-1}, plus a bias b_h" — the new state is a squashed sum of what I am
looking at and what I already knew. The output is "o_t equals W_ho times h_t
plus b_o".

On screen: the picture is the same sentence. Old note h_{t-1} in from the left
through W_hh, word x_t in from below through W_xh, the tanh box in the middle,
new note h_t out to the right, and the output o_t going up through W_ho.

Nothing on this slide is new mathematics. W_xh x + b is a dense layer; the tanh
is the familiar activation; the only new symbol is W_hh h_{t-1}. Say that
explicitly — it lowers the temperature of the slide considerably.

Click: x_t is this word's embedding.

Click 2: h_{t-1} is the note — all the layer remembers. Nothing else about the
earlier words survives.

Click 3: tanh keeps h between -1 and 1. Why tanh rather than ReLU: h is fed
back into itself, so an unbounded activation can compound to infinity over 200
steps. tanh keeps the state bounded. It is also part of why the gradients
vanish, which is section 02's problem.

Click 4: the callout. Delete the second term, W_hh h_{t-1}, and this is a dense
layer.

Click 5: o_t is logits, with no activation. For the review we only use the last
one, o_T, and turn it into a probability with a sigmoid, as in binary
cross-entropy. The next slide names every symbol and puts numbers in.
-->

---
layout: default
title: "Reading the equation: one recurrent step"
---

# Reading the equation: one recurrent step

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | review B |
| --- | --- | --- | --- |
| $t$ | time step | which word, 1 to $T$ | 5, *great* |
| $\mathbf{x}_t$ | input | this word's embedding; data | $\mathbf{x}_5 = [1, 0]$ |
| $\mathbf{h}_{t-1}$ | previous hidden state | the note so far | $\mathbf{h}_4 = [0.964, 0]$ |
| $W_{xh},\ W_{hh}$ | input, recurrent weights | $n_h \times n_x$, $n_h \times n_h$; learned | both $2 \times 2$ |
| $\mathbf{b}_h,\ \mathbf{b}_o$ | biases | one per unit; learned | 0 here |
| $\tanh$ | hyperbolic tangent | squashes into $(-1, 1)$ | $\tanh 0.482 = 0.448$ |
| $\mathbf{h}_t$ | hidden state | the new note | $\mathbf{h}_5 = [0.448, -0.419]$ |
| $\mathbf{o}_t,\ W_{ho}$ | output, its weights | logit; $W_{ho} = [0, 3]$ | $-1.26$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 120" class="dl-diagram" role="img" aria-label="Step 5: the state after not, 0.964 and 0, and the input great go into the new state 0.448 and minus 0.419">
  <defs>
    <marker id="l5b-rd1-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <rect x="6" y="34" width="104" height="36" rx="6" class="dl-dg-box" />
  <text x="58" y="57" text-anchor="middle" class="dl-dg-lab is-sm">h₄ [0.964, 0]</text>
  <path d="M112 52 H160" class="dl-dg-arrow" marker-end="url(#l5b-rd1-head)" />
  <text x="136" y="44" text-anchor="middle" class="dl-dg-small">W_hh</text>
  <rect x="164" y="34" width="130" height="36" rx="6" class="dl-dg-box is-accent" />
  <text x="229" y="57" text-anchor="middle" class="dl-dg-lab is-sm">h₅ [0.448, −0.419]</text>
  <text x="229" y="114" text-anchor="middle" class="dl-dg-in">great [1, 0]</text>
  <path d="M229 100 V74" class="dl-dg-arrow" marker-end="url(#l5b-rd1-head)" />
  <text x="237" y="90" class="dl-dg-small">W_xh</text>
</svg>

<div class="mt-1 dl-math-xs">

$W_{xh} = \begin{bmatrix} 0 & 2 \\ 1 & 0 \end{bmatrix}$, $W_{hh} = \begin{bmatrix} 0.5 & 0 \\ -1.5 & 0.8 \end{bmatrix}$, $\mathbf{b}_h = \mathbf{0}$

</div>

<div v-click class="mt-2 dl-callout">

Result: $\mathbf{h}_5 = [0.448, -0.419]$. The next slide works it out, one step per click.

</div>
</div>
</div>

<!--
Read the legend top to bottom as one sentence: at step t, take this word x_t and
the note h_{t-1}, mix them with two learned matrices, add a bias, squash with
tanh. That gives the new note h_t. The output o_t is a plain dense layer on top.

Say which symbols are learned: W_xh, W_hh, W_ho and the two biases. x_t is data.
h_t is neither — it is computed, fresh, for every review.

Where h_4 comes from (one step earlier, at "not", t = 4): x_4 = [0, 1].
W_xh x_4 = [0*0 + 2*1, 1*0 + 0*1] = [2, 0]. h_3 = [0, 0], so W_hh h_3 = [0, 0].
h_4 = tanh([2, 0]) = [0.964, 0]. That is the value in the legend's h_{t-1} row.

Click 9: the callout gives the result of step 5, h_5 = [0.448, -0.419]. Do not
compute it here; the next slide does it one step per click.

The -1.446 is the heart of it: it is the not-flag, travelling through the -1.5
wire, and it beats the +1 that "great" brought on its own.

Shapes to say out loud: in the code slides n_x = 64 and n_h = 128, so W_xh is
128 x 64 and W_hh is 128 x 128. Here n_x = 2 and n_h = 2 so it fits on paper.
-->

---
layout: default
title: "Working it out: review B at great"
---

# Working it out: review B at *great*

<svg viewBox="0 0 640 124" class="dl-diagram" style="max-height: 7.2rem" role="img" aria-label="Step 5 of review B. The old state h4 = 0.964, 0 times W_hh gives 0.482, minus 1.446. The word great = 1, 0 times W_xh gives 0, 1. The two are added, squashed by tanh into h5 = 0.448, minus 0.419, and read out as P(positive) = 0.22">
  <defs>
    <marker id="l5b-work-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <rect x="4" y="10" width="112" height="30" rx="5" class="dl-dg-box" />
  <text x="60" y="30" text-anchor="middle" class="dl-dg-lab is-sm">h₄ = [0.964, 0]</text>
  <path d="M118 25 H234" class="dl-dg-arrow" marker-end="url(#l5b-work-head)" />
  <text x="176" y="17" text-anchor="middle" class="dl-dg-small">2 · × W_hh</text>
  <text x="176" y="40" text-anchor="middle" class="dl-dg-small is-bad">[0.482, −1.446]</text>
  <circle cx="254" cy="25" r="15" class="dl-dg-box" />
  <text x="254" y="30" text-anchor="middle" class="dl-dg-lab is-sm">+</text>
  <rect x="190" y="90" width="128" height="30" rx="5" class="dl-dg-box" />
  <text x="254" y="110" text-anchor="middle" class="dl-dg-lab is-sm">x₅ = great [1, 0]</text>
  <path d="M254 88 V44" class="dl-dg-arrow" marker-end="url(#l5b-work-head)" />
  <text x="262" y="62" class="dl-dg-small">1 · × W_xh</text>
  <text x="262" y="78" class="dl-dg-small is-good">[0, 1]</text>
  <path d="M270 25 H318" class="dl-dg-arrow" marker-end="url(#l5b-work-head)" />
  <rect x="320" y="10" width="64" height="30" rx="5" class="dl-dg-box" />
  <text x="352" y="30" text-anchor="middle" class="dl-dg-lab is-sm">3 · tanh</text>
  <path d="M386 25 H426" class="dl-dg-arrow" marker-end="url(#l5b-work-head)" />
  <rect x="428" y="10" width="150" height="30" rx="5" class="dl-dg-box is-accent" />
  <text x="503" y="30" text-anchor="middle" class="dl-dg-lab is-sm">h₅ = [0.448, −0.419]</text>
  <path d="M503 42 V86" class="dl-dg-arrow" marker-end="url(#l5b-work-head)" />
  <text x="511" y="68" class="dl-dg-small">4 · × W_ho, then σ</text>
  <rect x="428" y="90" width="150" height="30" rx="5" class="dl-dg-box" />
  <text x="503" y="110" text-anchor="middle" class="dl-dg-lab is-sm">P(positive) = 0.22</text>
</svg>

<div class="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 dl-math-sm">
<div v-click class="dl-card">

<div class="dl-secondary">1 · What the word brings</div>

$W_{xh}\mathbf{x}_5 = \begin{bmatrix} 0 & 2 \\ 1 & 0 \end{bmatrix} \begin{bmatrix} 1 \\ 0 \end{bmatrix} = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$

</div>
<div v-click class="dl-card">

<div class="dl-secondary">2 · What the note brings</div>

$W_{hh}\mathbf{h}_4 = \begin{bmatrix} 0.5 & 0 \\ -1.5 & 0.8 \end{bmatrix} \begin{bmatrix} 0.964 \\ 0 \end{bmatrix} = \begin{bmatrix} 0.482 \\ -1.446 \end{bmatrix}$

</div>
<div v-click class="dl-card">

<div class="dl-secondary">3 · Add them (bias 0), then tanh</div>

$\mathbf{h}_5 = \tanh \begin{bmatrix} 0 + 0.482 \\ 1 - 1.446 \end{bmatrix} = \begin{bmatrix} 0.448 \\ -0.419 \end{bmatrix}$

</div>
<div v-click class="dl-card">

<div class="dl-secondary">4 · Read out with W<sub>ho</sub> = [0, 3], then sigmoid σ</div>

$o_5 = 3 \times (-0.419) = -1.26$

$\sigma(-1.26) = 0.22$: negative

</div>
</div>

<!--
The point: the arithmetic of one recurrent step, at the moment that matters —
review B reaching "great" with the note left by "not". Four small steps, one per
click, each a matrix times a vector the room can check by hand. All numbers are
checked in Python.

On screen: the picture is the recipe, numbered in the same order as the cards.
The old note h_4 comes in from the left, the word "great" from below. Each is
multiplied by its own weight matrix (steps 1 and 2), the two results are added
and squashed by tanh (step 3), and the new note h_5 is read out as a
probability (step 4).

Click: step 1, what the word brings. x_5 = [1, 0]. Multiply each row of W_xh by
x_5: row 1 is 0*1 + 2*0 = 0, row 2 is 1*1 + 0*0 = 1. So the word brings [0, 1]:
on its own, "great" pushes the sentiment unit up by 1.

Click 2: step 2, what the note brings. h_4 = [0.964, 0] (computed at "not", on
the previous slide). Row 1 of W_hh: 0.5*0.964 + 0*0 = 0.482. Row 2: -1.5*0.964 +
0.8*0 = -1.446. So the note brings [0.482, -1.446]. The -1.446 is the not-flag
travelling through the -1.5 wire.

Click 3: step 3, add and squash. Add the two vectors and the bias (zero here):
[0 + 0.482, 1 - 1.446] = [0.482, -0.446]. Apply tanh to each number:
tanh(0.482) = 0.448 and tanh(-0.446) = -0.419. So h_5 = [0.448, -0.419]. The
sentiment unit is negative: the note's -1.446 beat the word's +1.

Click 4: step 4, read out. W_ho = [0, 3] reads only the sentiment unit:
0*0.448 + 3*(-0.419) = -1.256, about -1.26. The sigmoid turns this logit into a
probability: sigmoid(-1.26) = 1 / (1 + e^1.26) = 0.22. P(positive) = 0.22, so
review B is read as negative.

For contrast, say review A aloud: it reaches "great" with a blank note [0, 0],
so step 2 brings [0, 0], h_5 = tanh([0, 1]) = [0, 0.762], and
sigmoid(3 * 0.762) = 0.91: positive. Same word, same weights, different note.
-->

---
layout: default
title: The same equation, one matrix
---

# The same equation, one matrix

Stack word $\mathbf{x}_t$ and note $\mathbf{h}_{t-1}$ into one vector, and both matrices side by side as $W_h$. The bias $\mathbf{b}_h$ is unchanged:

<div class="dl-math-sm">

$$ \mathbf{h}_t = \tanh\!\left( W_h \begin{bmatrix} \mathbf{x}_t \\ \mathbf{h}_{t-1} \end{bmatrix} + \mathbf{b}_h \right), \qquad W_h = \begin{bmatrix} W_{xh} & W_{hh} \end{bmatrix} $$

</div>

<div class="grid grid-cols-[1fr_1.2fr] gap-8 mt-1 items-start dl-tight">
<div>

<svg viewBox="0 0 330 170" class="dl-diagram is-sm" style="max-height: 8rem" role="img" aria-label="A 128 by 192 matrix, split into a 64-wide block and a 128-wide block, times a stacked vector of 64 and 128 numbers">
  <rect x="10" y="20" width="64" height="128" class="dl-dg-box" />
  <rect x="74" y="20" width="128" height="128" class="dl-dg-box is-accent" />
  <text x="42" y="88" text-anchor="middle" class="dl-dg-lab is-sm">W_xh</text>
  <text x="138" y="88" text-anchor="middle" class="dl-dg-lab is-sm">W_hh</text>
  <text x="42" y="14" text-anchor="middle" class="dl-dg-small">64</text>
  <text x="138" y="14" text-anchor="middle" class="dl-dg-small">128</text>
  <text x="222" y="90" text-anchor="middle" class="dl-dg-lab">×</text>
  <rect x="246" y="2" width="22" height="64" class="dl-dg-box" />
  <rect x="246" y="66" width="22" height="100" class="dl-dg-box is-accent" />
  <text x="276" y="38" class="dl-dg-small">xₜ</text>
  <text x="276" y="120" class="dl-dg-small">hₜ₋₁</text>
</svg>

</div>
<div>

<v-clicks>

- Toy, at *great*: $\begin{bmatrix} 0 & 2 & 0.5 & 0 \\ 1 & 0 & -1.5 & 0.8 \end{bmatrix} [1, 0, 0.964, 0]^\top = [0.482, -0.446]$

</v-clicks>

<div v-click class="mt-2 dl-callout">

**One dense layer** reading word and note, joined. Real size: $128 \times 192$.

</div>

</div>
</div>

<!--
Input x_t, previous state h_{t-1} and bias b_h are as before; the only new
symbol is W_h, the two weight matrices placed side by side.

It is easy to call this "another way of writing the same" and leave it there.
This is why it is worth writing: it turns the gate equations on the LSTM slides into one
matrix multiply, which is also exactly what nn.LSTM does — one weight_ih and one
weight_hh per layer, not eight.

The toy example: the 2 x 4 matrix is W_xh and W_hh side by side. Times
[1, 0, 0.964, 0] (great, then the note after "not"):
  row 1: 0*1 + 2*0 + 0.5*0.964 + 0*0 = 0.482
  row 2: 1*1 + 0*0 - 1.5*0.964 + 0.8*0 = -0.446
The same sum as the previous slide, before the tanh.

128 x 192: 128 rows because there are 128 units, 192 columns because 64 + 128.
The drawing is to scale. Have them check it.
-->

---
layout: interactive
heading: One step, by hand
title: One step, by hand
aside-width: 17rem
---

<RnnStepTrace example="review" />

::aside::

Review B, one word per step, with the toy weights. Press **Next line**:

<v-clicks>

- the rule, with $t$ fixed
- the numbers: the same two matrices at every step
- what **this word** brought, beside what **the note** brought
- add, squash, done

</v-clicks>

<div v-click class="mt-2 dl-secondary">

Line 3 at *great* is the one to be able to produce unaided.

</div>

<!--
Click through "the", "movie", "was" quickly: every line is zeros, and that is
fine — those words carry no sentiment in the toy embedding.

At "not", stop on line 3: the word brings [2, 0], the note brings [0, 0]. Line 4
gives [0.96, 0]. The first unit is now a flag.

Then hand "great" to the room: ask for the two vectors on line 3 before pressing.
The answer is [0, 1] from the word and [0.48, -1.45] from the note. The note wins,
and the sentiment ends at -0.42. The readout gives P(positive) = 0.22.

Do not skip this widget because the numbers look small. Nobody who cannot do this
can debug an RNN.
-->

---
layout: default
title: What the state actually is
---

# What the state actually is

<WordStrip review="B" state verdict highlight="not" :upto="$clicks + 3" :width="640" />

<div class="grid grid-cols-2 gap-8 mt-3 dl-tight">
<div>

<v-clicks>

- **Unit 1, the not-flag:** 0 until *not*, then 0.964
- **Unit 2, the sentiment:** *great* pushes it **down**, to −0.419
- The wire: $-1.5$ in $W_{hh}$ carries the flag into the sentiment

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

$\mathbf{h}_t$ is a **fixed-size summary**: 2 numbers here, 128 in a real layer,
after 3 words or 300. It must throw information away.

</div>

</div>
</div>

<!--
The strip builds with the clicks. At click 0 three words are read and both bars
are empty. Click 1 reads "not": the flag bar fills to 0.964. Click 2 reads
"great": the sentiment bar goes red, to -0.419, and P(positive) = 0.22.

Compare review A, "the movie was great": the flag never rises, "great" gives
h = [0, 0.762] and P(positive) = sigmoid(3 * 0.762) = 0.91. Same word, opposite
answer, because the note was different.

Be honest about the toy: these weights were set by hand so each unit has a name.
A trained network spreads the job over many units, and nobody labels them.

The callout is the most important idea in the section. Recurrence does not give a
network unlimited memory; it gives it a fixed budget and makes it learn what to
keep. Gates (section 03) are a better way of choosing. The attention slide in the
last section is refusing to throw anything away.
-->

---
layout: default
title: Counting the parameters
---

# Counting the parameters

<div class="dl-math-sm">

$$ \underbrace{n_h \times n_x}_{W_{xh}} + \underbrace{n_h \times n_h}_{W_{hh}} + \underbrace{n_h}_{\mathbf{b}_h} $$

</div>

<div class="grid grid-cols-[1fr_1.25fr] gap-8 mt-1 items-start dl-tight">
<div>

<svg viewBox="0 0 300 160" class="dl-diagram is-sm" role="img" aria-label="Drawn to scale: W_xh is 128 by 64, W_hh is 128 by 128, the bias is 128 by 1">
  <rect x="10" y="20" width="64" height="128" class="dl-dg-box" />
  <rect x="94" y="20" width="128" height="128" class="dl-dg-box is-accent" />
  <rect x="242" y="20" width="6" height="128" class="dl-dg-box" />
  <text x="42" y="88" text-anchor="middle" class="dl-dg-lab is-sm">W_xh</text>
  <text x="158" y="88" text-anchor="middle" class="dl-dg-lab is-sm">W_hh</text>
  <text x="256" y="88" class="dl-dg-lab is-sm">b_h</text>
  <text x="42" y="12" text-anchor="middle" class="dl-dg-small">8 192</text>
  <text x="158" y="12" text-anchor="middle" class="dl-dg-small">16 384</text>
  <text x="245" y="12" text-anchor="middle" class="dl-dg-small">128</text>
</svg>

</div>
<div>

Input width $n_x = 64$, $n_h = 128$ hidden units, bias $\mathbf{b}_h$:

<div v-click class="mt-1 dl-math-sm">

$$ 128 \cdot 64 + 128 \cdot 128 + 128 = 24\,704 $$

</div>

<v-clicks>

- $T$ **does not appear**: a 10-word and a 1000-word review share the weights
- $W_{hh}$ grows with $n_h^2$: double the units, four times the weights

</v-clicks>

<div v-click class="mt-2 dl-secondary">

`nn.RNN` prints **24 832**: PyTorch keeps two bias vectors.

</div>

</div>
</div>

<!--
The point: count the weights of a recurrent layer, and notice that the length
of the review does not appear in the count.

On screen: the formula reads "n_h times n_x for W_xh, plus n_h times n_h for
W_hh, plus n_h for the bias b_h". The drawing is to scale: one pixel per row
and column. W_xh is 128 x 64 = 8 192, W_hh is the big square, 128 x 128 =
16 384, and the bias is a thin 128 x 1 strip.

Click: the sum with our sizes, n_x = 64 and n_h = 128:
128 x 64 + 128 x 128 + 128 = 8 192 + 16 384 + 128 = 24 704.

Click 2: T does not appear. A 10-word and a 1000-word review share the same
weights. Same argument as for CNNs, where an image's height and width do not
appear in a convolution's parameter count. Weight sharing always buys this.

Click 3: W_hh grows with n_h squared — double the units, four times the
weights. Ask the room first what happens if you double the hidden size. That is
why 128 and 256 are common and 4096 is not.

Click 4: nn.RNN prints 24 832. This saves a lab question every year. nn.RNN
keeps bias_ih and bias_hh, which only ever appear as a sum — mathematically
redundant, kept for the fast GPU (cuDNN) kernels. A student who counts by hand
and then calls sum(p.numel()) gets a number that is n_h = 128 too big and
assumes they are wrong. They are not: 24 704 + 128 = 24 832.
-->

---
layout: default
title: Your turn — count them
---

# Your turn — count them

<div class="dl-tight dl-math-sm">

<v-clicks>

- `nn.RNN(64, 128)` → $128 \cdot 64 + 128 \cdot 128 + 2 \cdot 128 = \mathbf{24\,832}$
- `nn.LSTM(64, 128)` → an LSTM (long short-term memory, next section) has four such blocks: $\mathbf{99\,328}$
- `nn.GRU(64, 128)` → a GRU (gated recurrent unit) has three: $\mathbf{74\,496}$
- `nn.Embedding(20000, 64)` → $20\,000 \cdot 64 = \mathbf{1\,280\,000}$

</v-clicks>

</div>

<div v-click class="mt-3">

<svg viewBox="0 0 640 74" class="dl-diagram" role="img" aria-label="The whole classifier as one bar: the embedding is 93 percent, the LSTM 7 percent, the output layer a sliver">
  <rect x="10" y="14" width="556.7" height="30" class="dl-dg-bar" />
  <rect x="566.7" y="14" width="43.2" height="30" class="dl-dg-bar is-q" />
  <rect x="609.9" y="14" width="1.5" height="30" class="dl-dg-bar is-bad" />
  <text x="288" y="34" text-anchor="middle" class="dl-dg-lab is-sm" style="fill: var(--dl-bg)">embedding 93%</text>
  <text x="588" y="64" text-anchor="middle" class="dl-dg-small is-good">LSTM 7%</text>
  <text x="626" y="10" text-anchor="end" class="dl-dg-small is-bad">head</text>
</svg>

</div>

<div v-click class="mt-2 dl-callout">

Embedding + LSTM + `Linear(128, 2)` = **1 379 586** weights. The recurrent part we
spend the lecture on is 7% of them.

</div>

<!--
The point: an exercise. Count the layers of the classifier we build later, and
discover that the recurrent part is only 7% of the weights.

Do the first row together, let them race the rest. Reveal each row after the
room has had a go.

Click: nn.RNN(64, 128) = 128 x 64 + 128 x 128 + 2 x 128 = 24 832, with the two
PyTorch bias vectors from the last slide.

Click 2: nn.LSTM(64, 128) = 99 328. Be precise about "blocks": an LSTM has
three gates (input, forget, output) plus a candidate, so four blocks of the
RNN's size: 4 x 24 832 = 99 328. "Four gates" is a common slip — there are
three gates. The LSTM itself is the next section.

Click 3: nn.GRU(64, 128) = 74 496. A GRU has two gates (update, reset) plus a
candidate: 3 x 24 832 = 74 496.

Click 4: nn.Embedding(20000, 64) = 20 000 x 64 = 1 280 000 — a vocabulary of
20 000 words, 64 numbers each.

Click 5: the bar — the whole classifier drawn to scale. 1 280 000 / 1 379 586 =
92.8% embedding; 99 328 / 1 379 586 = 7.2% LSTM; and Linear(128, 2) =
128 x 2 + 2 = 258 weights, 0.02%, the sliver at the right.

Click 6: the callout. 1 280 000 + 99 328 + 258 = 1 379 586. The recurrent part
we spend the lecture on is 7% of them.

A CNN shows the same imbalance the other way round — most of its weights in one
dense head. Where a model's parameters live is rarely where its ideas live. The
93% also explains why pre-trained embeddings mattered so much: it is the part
of the model with the most to learn and the least supervision.
-->

---
layout: interactive
heading: Five ways to wire it
title: Five ways to wire it
aside-width: 21rem
---

<RnnWiring />

::aside::

<v-clicks>

- **hidden → hidden**: `nn.RNN`
- **output → hidden**: the past squeezed through *o*
- **output → output**: *h* carries nothing forward
- **stacked**, **bidirectional**: constructor arguments

</v-clicks>

<div v-click class="dl-callout">

Bidirectional needs the whole sequence, so it cannot predict the next word.

</div>

<!--
The point: the recurrence can come from different places, and one cell can be
reused by stacking or by reading both directions. nn.RNN uses hidden to hidden.

On screen: the wiring widget, with one tab per wiring: hidden → hidden, output
→ hidden, output → output, stacked, bidirectional. All three recurrent arrows
drawn at once on one figure is unreadable, so take them one tab at a time and
say which one nn.RNN uses. Walk the first three tabs, then the last two.

Click: hidden → hidden, as in nn.RNN. In the note picture, it passes the whole
note on.

Click 2: output → hidden passes only the reader's one-word verdict, so
everything the past contributes is squeezed through the output layer, which is
usually far smaller than h. Its upside, shown in the widget's note: it is cheap
to train in parallel when the true outputs are known (teacher forcing).

Click 3: output → output, the third tab. Only the previous output feeds the next
output; the hidden layer carries nothing across time. Rare on its own — the idea
survives in models that generate one word at a time and feed each word back in.

Click 4: stacked and bidirectional are constructor arguments (num_layers,
bidirectional=True). Stacked: one recurrent layer's states are the next one's
inputs. Bidirectional: a second row of readers going right to left, and the two
notes are joined at each word. Concatenation, not addition, is how the two
directions combine — so the output width doubles and the head has to know that.

Click 5: the callout. Bidirectional needs the whole sequence first, so it
cannot predict the next word. That is why it is fine for review B — the whole
review is there before we classify it — and wrong for generating text.

The bidirectional caveat catches people out in their own projects: they add
bidirectional=True to a language model, the loss collapses to nothing, and it
takes an afternoon to realise the model can see the answer.
-->

---
layout: section
index: "02"
---

# Training through time

Why the note fades with every copy.

<div class="absolute right-18 top-1/2 -translate-y-1/2"><RnnGlyph kind="fade" :size="190" /></div>

<!--
Section 02 is the lecture, part 2. Never cut it. About 25 minutes.

The glyph: a chain of cells with a gradient arrow running back from the loss,
fainter at every step. Keep the note metaphor going: the training signal is a
message passed back down the row, and every person who copies it makes the copy
fainter.

The number to aim at is 0.012, on "What vanishing feels like". Section 03 answers
it with 0.82.
-->

---
layout: default
title: The loss for a whole sequence
---

# The loss for a whole sequence

<div class="grid grid-cols-2 gap-10 mt-1 dl-tight">
<div>

### One label per review

<svg viewBox="0 0 300 76" class="dl-diagram is-sm" role="img" aria-label="Five cells in a chain; only the last one feeds a loss">
  <g v-for="i in 5" :key="i">
    <rect :x="6 + (i - 1) * 58" y="34" width="40" height="28" rx="4" :class="i === 5 ? 'dl-dg-box is-accent' : 'dl-dg-box'" />
    <path v-if="i < 5" :d="`M${46 + (i - 1) * 58} 48 H${64 + (i - 1) * 58}`" class="dl-dg-arrow" />
  </g>
  <path d="M258 32 V18" class="dl-dg-loss" />
  <text x="258" y="12" text-anchor="middle" class="dl-dg-small is-bad">ℓ</text>
</svg>

<div class="dl-math-sm">

$$ L = \ell\!\left(\mathbf{o}_T,\; y\right) $$

</div>

<div v-click>

One term, at the last word. Review B: $\ell = -\ln 0.78 = 0.25$.

</div>

</div>
<div>

### One label per word

<svg viewBox="0 0 300 76" class="dl-diagram is-sm" role="img" aria-label="Five cells in a chain; every one feeds its own loss">
  <g v-for="i in 5" :key="i">
    <rect :x="6 + (i - 1) * 58" y="34" width="40" height="28" rx="4" class="dl-dg-box is-accent" />
    <path v-if="i < 5" :d="`M${46 + (i - 1) * 58} 48 H${64 + (i - 1) * 58}`" class="dl-dg-arrow" />
    <path :d="`M${26 + (i - 1) * 58} 32 V18`" class="dl-dg-loss" />
    <text :x="26 + (i - 1) * 58" y="12" text-anchor="middle" class="dl-dg-small is-bad">ℓ</text>
  </g>
</svg>

<div class="dl-math-sm">

$$ L = \frac{1}{T}\sum_{t=1}^{T} \ell\!\left(\mathbf{o}_t,\; y_t\right) $$

</div>

<div v-click>

$T$ terms, averaged. Each is a cross-entropy.

</div>

</div>
</div>

<div v-click class="mt-3 dl-callout">

Either way, **one** set of weights receives gradient from **every** term.

</div>

<!--
The point: nothing new about the loss itself — it is cross-entropy, once or T
times. What is new is that one weight matrix now receives gradient from T
different places.

On screen, left: one label per review. Five cells in a chain, and only the last
one feeds a loss. Read the equation as "L equals the loss of the last output
o_T against the label y".

On screen, right: one label per word. Every cell feeds its own loss. Read it as
"L equals one over T times the sum, over every step t, of the loss of o_t
against y_t". Per-word labels: a tag on every word, or the next character in a
text model.

Click: the left box — one term, at the last word. Review B: the label is
negative and the toy network says P(positive) = 0.22, so the chance it gave the
right answer is 0.78, and the loss is -ln 0.78 = 0.25. (Checked:
sigmoid(3 x -0.419) = 0.222; -ln(0.778) = 0.251.)

Click 2: the right box — T terms, averaged, and each is a cross-entropy.
Mention the averaging: sum and mean differ by a factor of T, which changes the
effective learning rate. PyTorch's default is mean, and with padded batches
"mean over what" becomes a real question — the padding slide in the PyTorch
section.

Click 3: the callout. Either way, one set of weights receives gradient from
every term. The next slide names every symbol in these two equations.
-->

---
layout: default
title: "Reading the equation: the sequence loss"
---

# Reading the equation: the sequence loss

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $L$ | loss | one per sequence | 0.77 |
| $\ell$ | per-step loss | cross-entropy $-\ln p$; $p$ = chance of the right answer | $-\ln 0.8 = 0.22$ |
| $\mathbf{o}_t,\ \mathbf{o}_T$ | output | logits at $t$, or at the end | $o_5 = -1.26$ |
| $y,\ y_t$ | true label | data | negative |
| $t,\ T$ | step, sequence length | $t$ runs from 1 to $T$ | $T = 3$ |
| $\sum_{t=1}^{T},\ \frac{1}{T}$ | sum, average | add the $T$ losses, divide by $T$ | $2.30 / 3$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 160" class="dl-diagram" role="img" aria-label="Three bars for the step losses 0.22, 0.69 and 1.39, and a dashed line at their mean, 0.77">
  <line x1="20" y1="130" x2="290" y2="130" class="dl-dg-split" />
  <rect x="40" y="114" width="44" height="16" class="dl-dg-fill" />
  <rect x="120" y="80" width="44" height="50" class="dl-dg-fill" />
  <rect x="200" y="30" width="44" height="100" class="dl-dg-fill" />
  <text x="62" y="108" text-anchor="middle" class="dl-dg-small">0.22</text>
  <text x="142" y="74" text-anchor="middle" class="dl-dg-small">0.69</text>
  <text x="222" y="24" text-anchor="middle" class="dl-dg-small">1.39</text>
  <line x1="20" y1="75" x2="290" y2="75" class="dl-dg-grad is-bad" />
  <text x="22" y="69" class="dl-dg-small is-bad">L = 0.77</text>
  <text x="62" y="148" text-anchor="middle" class="dl-dg-small">t = 1</text>
  <text x="142" y="148" text-anchor="middle" class="dl-dg-small">t = 2</text>
  <text x="222" y="148" text-anchor="middle" class="dl-dg-small">t = 3</text>
</svg>

<div v-click class="dl-callout">

Next character, $T = 3$, $p$ = 0.8, 0.5, 0.25:
$L = (0.22 + 0.69 + 1.39) / 3 = 0.77$

Review B (negative): $p = 1 - 0.22 = 0.78$

so $L = -\ln 0.78 = 0.25$

</div>

</div>
</div>

<!--
The legend has nothing new in it except the index t. The loss l is
cross-entropy: minus the log of the probability the model gave the right class.
o_t are the logits at step t; y_t is the right answer at step t.

Two worked examples. Character by character: the model is fairly sure at step 1
(0.8), unsure at step 2 (0.5), and mostly wrong at step 3 (0.25). The worst step
costs the most: 1.39 of the 2.30 total. Averaging gives 0.77. The sum is ln 10 =
2.30 exactly, because 0.8 x 0.5 x 0.25 = 0.1 — a nice check if someone asks.

Review B, one label: o_5 = -1.26, sigmoid gives P(positive) = 0.22. The right
answer is negative, with probability 0.78. Loss 0.25. With one label, T plays no
part: the average over one term is that term.

Sum versus mean: PyTorch's cross_entropy averages by default. With padded batches
the question "average over what?" becomes real; that is the padding slide in the
PyTorch section.
-->

---
layout: default
title: Backpropagation through time
---

# Backpropagation through time

The unrolled chain is a deep feed-forward network, so backpropagation works.
One twist: **$W_{hh}$ is used at every step**.

<div class="dl-math-sm">

$$ \frac{\partial L}{\partial W_{hh}} = \sum_{t=1}^{T} \frac{\partial L_t}{\partial \mathbf{h}_t} \left( \sum_{k=1}^{t} \underbrace{\frac{\partial \mathbf{h}_t}{\partial \mathbf{h}_k}}_{\text{through } t-k \text{ steps}} \frac{\partial \mathbf{h}_k}{\partial W_{hh}} \right) $$

</div>

<div class="grid grid-cols-[1fr_1.1fr] gap-8 items-start dl-tight">
<div>

<svg viewBox="0 0 320 110" class="dl-diagram is-sm" role="img" aria-label="The unrolled chain for review B; the gradient runs back from the loss through every copy of W_hh">
  <defs>
    <marker id="l5b-bptt-back" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" style="fill: var(--dl-danger)" />
    </marker>
  </defs>
  <g v-for="(w, i) in ['the', 'movie', 'was', 'not', 'great']" :key="i">
    <rect :x="6 + i * 60" y="30" width="44" height="30" rx="4" class="dl-dg-box is-accent" />
    <text :x="28 + i * 60" y="98" text-anchor="middle" class="dl-dg-small">{{ w }}</text>
    <path v-if="i < 4" :d="`M${50 + i * 60} 40 H${66 + i * 60}`" class="dl-dg-arrow" />
    <path v-if="i < 4" :d="`M${66 + i * 60} 54 H${52 + i * 60}`" class="dl-dg-grad is-bad" marker-end="url(#l5b-bptt-back)" />
  </g>
  <text x="268" y="20" text-anchor="middle" class="dl-dg-small is-bad">L</text>
  <text x="128" y="20" text-anchor="middle" class="dl-dg-small">W_hh × 4</text>
</svg>

</div>
<div>

<v-clicks>

- A **sum over every step**, because the weight was used at every step
- Inside it, a factor for travelling back from step $t$ to step $k$
- That factor is a **product** of $t - k$ terms: the trouble

</v-clicks>

</div>
</div>

<!--
The point: the unrolled network is just a deep feed-forward network, so
ordinary backpropagation trains it. The one twist is that W_hh is shared by
every step, and that twist is where the trouble starts.

Backpropagation through time is often shortened to BPTT. Do not derive this.
Point at three things: the outer sum, the inner sum, and the Jacobian in the
middle.

On screen: the equation reads "the gradient of the loss with respect to W_hh is
a sum over every time step t; for each one, a sum over every earlier step k of:
how the loss at t depends on h_t, times how h_t depends on h_k, times how h_k
depends on W_hh directly." The underbrace marks the middle factor as the trip
back through t - k steps.

The picture is review B: five copies of the cell, the loss L at the end, and the
gradient running back through each W_hh arrow (four of them, hence "W_hh x 4").
Every red arrow is one factor in the product.

Click: the outer sum. W_hh was used at every step, so its gradient collects a
contribution from every step — the same rule as any shared weight, like a
convolution filter used at every position.

Click 2: the inner factor dh_t/dh_k, the cost of travelling back from step t to
step k. Point at the underbrace.

Click 3: that factor is a product of t - k terms — that is the trouble. The
Jacobian is the whole story:

  dh_t/dh_k = prod_{j=k+1..t} diag(tanh'(z_j)) W_hh^T

Write that on the board. It is a product of (t - k) copies of the same matrix,
each pre-multiplied by a diagonal of tanh derivatives, every one of which is at
most 1. The legend slide works it for one unit; "What vanishing feels like" puts
it on a long review.
-->

---
layout: default
title: "Reading the equation: backpropagation through time"
---

# Reading the equation: backpropagation through time

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $L,\ L_t$ | loss, step-$t$ loss | $L = \sum_t L_t$ | $L = L_3 = h_3$ |
| $\partial L / \partial W_{hh}$ | gradient | slope of $L$ in $W_{hh}$ | 1.0 |
| $W_{hh}$ | recurrent weight | learned; used every step | 0.5 |
| $\mathbf{h}_t,\ \mathbf{h}_k$ | hidden states | at step $t$, earlier step $k$ | $h_1 = 1$ |
| $\sum_{t=1}^{T},\ \sum_{k=1}^{t}$ | sums | over $t$, then over $k \le t$ | $T = 3$ |
| $\partial L_t / \partial \mathbf{h}_t$ | state gradient | slope of $L_t$ in $\mathbf{h}_t$ | 1 |
| $\partial \mathbf{h}_t / \partial \mathbf{h}_k$ | Jacobian | factor for $t - k$ steps back | $0.5^{\,t-k}$ |
| $\partial \mathbf{h}_k / \partial W_{hh}$ | local gradient | step $k$ alone | $h_{k-1}$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 130" class="dl-diagram" role="img" aria-label="A chain h1 equal to 1, h2 equal to 0.5, h3 equal to 0.25; the gradient travels back from h3 with factor 1, then 0.5, then 0.25">
  <defs>
    <marker id="l5b-rd3-fwd" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
    <marker id="l5b-rd3-back" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" style="fill: var(--dl-danger)" />
    </marker>
  </defs>
  <rect x="10" y="30" width="72" height="34" rx="6" class="dl-dg-box" />
  <text x="46" y="52" text-anchor="middle" class="dl-dg-lab is-sm">h₁ = 1</text>
  <rect x="114" y="30" width="72" height="34" rx="6" class="dl-dg-box" />
  <text x="150" y="52" text-anchor="middle" class="dl-dg-lab is-sm">h₂ = 0.5</text>
  <rect x="218" y="30" width="74" height="34" rx="6" class="dl-dg-box is-accent" />
  <text x="255" y="52" text-anchor="middle" class="dl-dg-lab is-sm">h₃ = 0.25</text>
  <path d="M84 40 H110" class="dl-dg-arrow" marker-end="url(#l5b-rd3-fwd)" />
  <path d="M188 40 H214" class="dl-dg-arrow" marker-end="url(#l5b-rd3-fwd)" />
  <path d="M214 56 H188" class="dl-dg-grad is-bad" marker-end="url(#l5b-rd3-back)" />
  <path d="M110 56 H84" class="dl-dg-grad is-bad" marker-end="url(#l5b-rd3-back)" />
  <text x="46" y="88" text-anchor="middle" class="dl-dg-small is-bad">× 0.25</text>
  <text x="150" y="88" text-anchor="middle" class="dl-dg-small is-bad">× 0.5</text>
  <text x="255" y="88" text-anchor="middle" class="dl-dg-small is-bad">× 1</text>
  <text x="150" y="118" text-anchor="middle" class="dl-dg-small">factor ∂h₃/∂hₖ</text>
</svg>

<div v-click class="dl-callout">

One unit, no $\tanh$, $W_{hh} = 0.5$, inputs $1, 0, 0$:

$\frac{\partial L}{\partial W_{hh}} = \underbrace{0.25 \cdot 0}_{k=1} + \underbrace{0.5 \cdot 1}_{k=2} + \underbrace{1 \cdot 0.5}_{k=3} = 1.0$

Check: $h_3 = W_{hh}^2$, slope $2 W_{hh} = 1.0$.

</div>

</div>
</div>

<!--
This example is deliberately smaller than the review: one hidden unit, no tanh,
so the chain rule fits on one line. The review comes back on the next slide.

One hidden unit, no tanh, so h_t = W_hh h_{t-1} + x_t. Inputs 1, 0, 0 give
h_1 = 1, h_2 = 0.5, h_3 = 0.25. The loss is just L = h_3, so only the t = 3 term
of the outer sum is non-zero, and dL_3/dh_3 = 1.

The inner sum has one term per use of W_hh, k = 1, 2, 3. Each term is
(factor for travelling back from step 3 to step k) x (direct effect at step k):
  k = 1: 0.5^2 x h_0 = 0.25 x 0 = 0
  k = 2: 0.5^1 x h_1 = 0.5 x 1 = 0.5
  k = 3: 0.5^0 x h_2 = 1 x 0.5 = 0.5
Total 1.0. The check on the slide is the point: h_3 = W_hh^2 as a function of the
weight, its derivative is 2 W_hh = 1.0, and the sum over k is the chain rule
doing exactly that bookkeeping.

The red factors are 1, 0.5, 0.25: a power of W_hh. With 40 steps instead of 3 that
is 0.5^40, about 1e-12.

With a real tanh RNN, each factor also carries tanh'(z), which is at most 1, and
W_hh is a matrix, so the factor is a matrix product. Do not go further than that.
-->

---
layout: default
title: What vanishing feels like
---

# What vanishing feels like

A long review. The word that decides it, *not*, comes 20 steps before *great*.

<WordStrip :review="['not', 'once', 'in', 'the', 'two', 'long', 'hours', 'of', 'this', 'movie', 'with', 'all', 'its', 'stars', 'and', 'all', 'its', 'money', 'was', 'it', 'great']" highlight="not" :width="860" />

<svg v-click viewBox="0 0 860 74" role="img" aria-label="The gradient reaching each word from the loss at the end: full size at great, 0.8 times smaller per step back, 0.012 at not" style="display: block; width: 100%; max-width: 860px; height: auto; margin: 0 auto; font-family: inherit;">
  <g v-for="i in 21" :key="i" :style="{ opacity: 0.2 + 0.8 * Math.pow(0.8, 21 - i) }">
    <rect :x="4 + (i - 1) * 40.571" :y="50 - 44 * Math.pow(0.8, 21 - i)" width="34.571" :height="Math.max(1.5, 44 * Math.pow(0.8, 21 - i))" class="dl-dg-bar is-bad" />
  </g>
  <line x1="4" y1="51" x2="856" y2="51" class="dl-dg-split" />
  <text x="21" y="44" text-anchor="middle" class="dl-dg-small is-bad">0.012</text>
  <text x="833" y="66" text-anchor="middle" class="dl-dg-small">1</text>
  <text x="430" y="68" text-anchor="middle" class="dl-dg-small">← gradient from the loss, × 0.8 per step back</text>
</svg>

<div v-click class="mt-2 dl-callout">

Simplified: each step back multiplies the gradient by 0.8, the sentiment unit's
self-weight. Twenty steps: $0.8^{20} = 0.012$.

</div>

<div v-click class="mt-2 dl-secondary">

The layer could carry the flag forward. It never **receives the training signal**
that says it should.

</div>

<!--
The point: on a long review the word that decides the label is 20 steps before
the end, and the training signal that would teach the network to remember it
arrives at about 1% strength. Forward the state could carry it; backward the
learning signal cannot survive the trip.

On screen: a 21-word review. "not" is the first word, highlighted; "great" is
the last. The loss sits after "great", so the gradient has to travel 20 steps
back to reach "not".

Click: the bar chart under the words — the gradient reaching each word from the
loss. The bars are to scale: 0.8^k for k steps back, so "great" gets 1, five
words back 0.33, ten back 0.11, and "not" 0.012. Use the note metaphor: going
backwards, the loss passes a correction down the row. Every person copies it and
the copy is fainter. Twenty copies later, the person who read "not" gets 1% of
the message.

Click 2: the callout names the simplification: each step back multiplies by 0.8,
the sentiment unit's self-weight, and 0.8^20 = 0.012.

Click 3: the punchline. The layer could carry the flag forward; it never
receives the training signal that says it should.

Be honest — this is a simplification, and say so if asked:
- The real factor per step is a 2 x 2 matrix: diag(tanh'(z)) W_hh. tanh' is at
  most 1, so the real factor is smaller, not larger. Computed for this exact
  review with the toy weights, the sentiment-to-sentiment entry of dh_21/dh_1 is
  about 2e-5 with tanh' included, against 0.8^20 = 0.012 without it.
- There are cross-terms: the flag reaches the sentiment through the -1.5 wire.
  The flag-to-sentiment entry is about 0.06 without tanh', and 0.002 with it.
So 0.012 is the optimistic number. The next two slides make the general case.

The toy network also forgets forwards: its flag halves at every word (self-weight
0.5), so on this review it says P(positive) = 0.91 — wrong. Training would have to
change W_hh to hold the flag. The point of the slide is that the gradient that
would ask for that change arrives at 1% strength or less.

The classic version of this (Olah's): "I grew up in France ... [forty words] ...
so I speak fluent French." The word that decides the answer is forty steps back.
A plain RNN is big enough to represent it; it never receives the signal to learn
it. Fix the backward path and the forward one takes care of itself.
-->

---
layout: interactive
heading: One number, raised to a power
title: One number, raised to a power
aside-width: 19rem
---

<GradientFlow :w="0.8" :steps="20" />

::aside::

One unit, so $W_{hh}$ is one weight $W$. $k$ steps back, the gradient is
multiplied by $W^k$. It opens on the review's $W = 0.8$.

<v-clicks>

- $W < 1$ → **vanishing**
- $W > 1$ → **exploding**
- $W = 1$ → stable, but nothing keeps it there

</v-clicks>

<div v-click class="mt-2 dl-callout">

Drag $W$ slowly through 1. There is no safe band — only a point.

</div>

<!--
The point: with one unit the backward factor is a single weight W raised to the
power of the distance, so the damage is exponential in distance — and only
W = 1 exactly is safe.

On screen: the GradientFlow widget. It opens on the review's number: W = 0.8,
twenty steps, and the readout says 0.8^20 = 0.012. The chart shows the gradient
strength against steps back on a log axis: a straight line whose slope is
log W, so the damage is exponential in the distance, not linear. The aside says
the same in words: k steps back, the gradient is multiplied by W^k.

Click: W < 1 means vanishing. Drag W down and watch the line tilt steeper. Ask
how far back a 0.9 weight reaches at 1% strength: about 43 steps. At 0.6, nine.
At 0.8, twenty — exactly the review.

Click 2: W > 1 means exploding. Drag above 1 and the line climbs instead.
Exploding happens, but it announces itself with a NaN (not a number); vanishing
is silent.

Click 3: W = 1 is stable, but nothing in training keeps the weight there.

Click 4: the callout — drag W slowly through 1 so the room sees the line swing
from falling to rising. There is no safe band, only a point.

Then say the part that makes it worse: the real factor is W times tanh'(z), and
tanh' is at most 1 and usually well under it. So the effective W is smaller than
the weight, and vanishing is the common case by a wide margin.

Tick gradient clipping with W above 1 and point out that the vanishing end of the
chart does not move at all: clipping fixes exploding, never vanishing.
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

So the real factor is $W \cdot \tanh'$, with $\tanh' \le 1$. The 0.012 was the
optimistic case.

</div>

<!--
The point: the real factor per step is W times tanh', and tanh' is at most 1 —
so the activation itself shrinks the gradient further, and a confident unit
passes almost nothing back.

On screen: the ActivationExplorer widget. Choose Tanh. The solid curve is tanh,
the dashed curve is its derivative. The vanishing-gradient story is usually told
about depth; this widget shows the same fact about length.

Click: the derivative peaks at 1, at input 0, and falls away on both sides.
Point at the top of the dashed curve.

Click 2: a saturated unit — one whose input is far from 0, so tanh sits near
+1 or -1 — has a derivative near zero. Move along the flat part of the curve.

Click 3: every backward step multiplies by one of these derivatives, once per
step, so the shrinking compounds.

Click 4: the callout. The real factor is W times tanh', with tanh' at most 1, so
the 0.012 on the long review was the optimistic case.

Tie it to the review: after "not" the flag unit sits at 0.964, where tanh' is
1 - 0.964^2 = 0.07. A unit that is sure of itself passes almost no gradient back.
What keeps the state stable is what kills the gradient.

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

<div class="grid grid-cols-3 gap-6 mt-2 dl-tight">
<div v-click>

<svg viewBox="0 0 120 64" class="dl-diagram is-xs" role="img" aria-label="A tall arrow cut off at a dashed ceiling">
  <path d="M20 58 L100 8" class="dl-dg-grad is-bad" />
  <path d="M20 58 L60 33" class="dl-dg-line" />
  <path d="M4 33 H116" class="dl-dg-split" style="stroke-dasharray: 4 3" />
</svg>

### Gradient clipping

Cap the gradient's length.

<div class="mt-1 dl-secondary">

Fixes **exploding** only.

</div>

</div>
<div v-click>

<svg viewBox="0 0 120 64" class="dl-diagram is-xs" role="img" aria-label="A chain of cells with a cut after two of them">
  <g v-for="i in 4" :key="i">
    <rect :x="4 + (i - 1) * 30" y="22" width="20" height="20" rx="3" :class="i > 2 ? 'dl-dg-box is-accent' : 'dl-dg-box'" />
  </g>
  <path d="M59 10 V54" class="dl-dg-grad is-bad" />
</svg>

### Truncated BPTT

Backpropagate $k$ steps, then cut.

<div class="mt-1 dl-secondary">

Nothing beyond $k$ steps is learned.

</div>

</div>
<div v-click>

<div class="flex justify-center"><RnnGlyph kind="gate" :size="64" /></div>

### Gated cells

Make the gradient's path **add**, not multiply.

<div class="mt-1 dl-secondary">

The real fix: the next section.

</div>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Use clipping **and** a gated cell. Truncate when a sequence is too long for
memory.

</div>

<!--
The point: there are three standard responses to the gradient problem, and they
are not equals. Being explicit about the ranking matters: a list of three fixes
side by side invites a student to pick one.

On screen: three columns, each revealed on its own click, each with a small
picture. Nothing is visible but the heading at first.

Click: gradient clipping. The picture is a tall red arrow cut off at a dashed
ceiling; the accent part below the line is what survives. Cap the gradient's
length. It fixes exploding only — a gradient that is already tiny is never above
the cap. Clipping is not a hack: it is standard in essentially every recurrent
training script.

Click 2: truncated BPTT (backpropagation through time, from the "Backpropagation
through time" slide). The picture is a chain of four cells with a red cut after
the second. Backpropagate k steps, then cut; nothing beyond k steps is learned.
Truncation is a memory and compute decision first and a gradient decision second.
It is the last slide of this section.

Click 3: gated cells, with the gate emblem. Make the gradient's path add instead
of multiply. This is the real fix and the next section. Gating is the only one of
the three that touches the 0.012: section 03 turns it into 0.82.

Click 4: the callout gives the practical rule. Use clipping and a gated cell
together; truncate only when a sequence is too long for memory.
-->

---
layout: default
title: Gradient clipping, in one line
---

# Gradient clipping, in one line

<div class="grid grid-cols-[1.35fr_1fr] gap-6 items-start">
<div>

```python {all|1-3|5|6|7|all}{lines:true}
logits = model(ids, lengths)
loss = loss_fn(logits, labels)
optimiser.zero_grad()

loss.backward()                       # gradients exist now
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimiser.step()                      # …and are bounded
```

<div v-click class="mt-3 dl-callout">

It goes **between** `backward()` and `step()`. Before, there is nothing to clip;
after, it is too late.

</div>

</div>
<div>

<svg viewBox="0 0 260 150" class="dl-diagram is-sm" role="img" aria-label="A long gradient arrow of length 900 and the clipped arrow of length 1, pointing the same way">
  <defs>
    <marker id="l5b-clip-bad" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" style="fill: var(--dl-danger)" />
    </marker>
    <marker id="l5b-clip-good" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" style="fill: var(--dl-accent)" />
    </marker>
  </defs>
  <circle cx="30" cy="125" r="44" class="dl-dg-fill is-muted is-dashed" />
  <path d="M30 125 L240 22" class="dl-dg-grad is-bad" marker-end="url(#l5b-clip-bad)" />
  <path d="M30 125 L68 106" class="dl-dg-line" marker-end="url(#l5b-clip-good)" />
  <text x="236" y="44" text-anchor="end" class="dl-dg-small is-bad">before: length 900</text>
  <text x="80" y="128" class="dl-dg-small is-good">after: length 1</text>
  <text x="30" y="72" text-anchor="middle" class="dl-dg-small">c = 1</text>
</svg>

<div v-click class="mt-2 dl-math-sm">

If $\|\mathbf{g}\| > c$, use $c \cdot \mathbf{g} / \|\mathbf{g}\|$: same **direction**, capped **length**.

</div>

</div>
</div>

<!--
The point: clipping is one line of code, and the only way to get it wrong is to
put it in the wrong place — between backward() and step(), nowhere else.

On screen: a training step on the left, and on the right a picture of what
clipping does. The picture: a gradient of length 900 (red) with cap c = 1
becomes length 1 (accent), pointing exactly where it did. The dashed circle is
every vector of length 1.

Click: lines 1-3 — the forward pass, the loss, and zero_grad(). Nothing new.

Click 2: line 5, loss.backward(). Only now do the gradients exist.

Click 3: line 6, clip_grad_norm_ with max_norm=1.0. It rescales all the
gradients together so their combined length is at most 1.

Click 4: line 7, optimiser.step() — it uses the gradients, which are now bounded.

Click 5: the whole block again. Read the order top to bottom once more.

Click 6: the callout. It goes between backward() and step(): before, there is
nothing to clip; after, it is too late. The placement is the bug students
actually write. Say it twice.

Click 7: the rule as a formula. Read it: "if the length of g is bigger than c,
replace g by c times g divided by its length". Symbols: g is the gradient of all
parameters, stacked into one long vector; ||g|| is its length; c is the cap,
max_norm in the code. Dividing by the length makes a vector of length 1, and
multiplying by c makes it length c — same direction, capped length. With the
picture's numbers: 1 x g / 900 has length 1.

Norm clipping, not value clipping: clip_grad_value_ exists and clamps each
component independently, which changes the direction of the update. Almost nobody
wants that.

max_norm between 0.25 and 5 is the usual range, and 1.0 is a fine default. If
clipping fires on every batch, the learning rate is too high — clipping is a
safety device for rare spikes, not a way to train.
-->

---
layout: default
title: Truncated backpropagation through time
---

# Truncated backpropagation through time

A 100 000-character book is one sequence, and 100 000 steps of activations do not
fit in memory.

<div class="grid grid-cols-[1.3fr_1fr] gap-6 items-start">
<div>

```python {all|3|4-5|6|all}{lines:true}
hidden = None
for chunk in chunks_of(book, size=128):       # 128 steps
    if hidden is not None:
        hidden = tuple(h.detach() for h in hidden)
        # keep the values, cut the graph
    logits, hidden = model(chunk, hidden)
    ...                                        # loss, backward, step
```

</div>
<div>

<svg viewBox="0 0 330 110" class="dl-diagram is-sm" role="img" aria-label="Three chunks of cells: the state flows forward through all of them; the gradient flows back only inside each chunk, and stops at the detach cuts">
  <defs>
    <marker id="l5b-tb-back" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" style="fill: var(--dl-danger)" />
    </marker>
  </defs>
  <path d="M8 44 H322" class="dl-dg-line" />
  <g v-for="i in 9" :key="i">
    <rect :x="10 + (i - 1) * 35 + Math.floor((i - 1) / 3) * 8" y="34" width="22" height="20" rx="3" class="dl-dg-box is-accent" />
  </g>
  <g v-for="c in 3" :key="`c${c}`">
    <path :d="`M${76 + (c - 1) * 113} 70 H${22 + (c - 1) * 113}`" class="dl-dg-grad is-bad" marker-end="url(#l5b-tb-back)" />
  </g>
  <path d="M112 18 V90" class="dl-dg-split" style="stroke-dasharray: 4 3" />
  <path d="M225 18 V90" class="dl-dg-split" style="stroke-dasharray: 4 3" />
  <text x="112" y="12" text-anchor="middle" class="dl-dg-small">detach()</text>
  <text x="225" y="12" text-anchor="middle" class="dl-dg-small">detach()</text>
  <text x="165" y="104" text-anchor="middle" class="dl-dg-small is-bad">gradient: inside one chunk only</text>
</svg>

</div>
</div>

<div class="dl-tight">

<v-clicks>

- The state still flows **forward** across chunks: the model's context is not cut
- Only the **gradient** stops at the boundary. That is what `detach()` does
- Forget the `detach` and the graph grows until the run runs out of memory

</v-clicks>

</div>

<!--
The point: a very long sequence cannot be backpropagated in one go, so it is cut
into chunks. Truncated BPTT truncates learning, not memory: the state still
crosses every chunk boundary, only the gradient stops.

On screen: the problem in one line — a 100 000-character book is one sequence,
and 100 000 steps of activations do not fit in memory. Left, the loop over
chunks of 128 steps. Right, the picture: the accent line is the state, flowing
forward through every chunk. The red arrows are the gradient, flowing back only
inside each chunk of 128 steps. The dashed cuts are the detach() calls.

Click: line 3 — skip the cut on the very first chunk, when there is no state yet.

Click 2: lines 4-5 — detach the state: keep the values, cut the graph. detach()
returns a tensor sharing the same storage with no graph history. The tuple is
there because an LSTM's state is a pair, (h, c) — next section.

Click 3: line 6 — run the model on the chunk, starting from the carried-over
state, and get the new state back.

Click 4: the whole loop again; the loss, backward and step happen once per chunk.

Click 5: the state still flows forward across chunks, so the model's context is
not cut. This is the thing to get right. In the note metaphor: the note keeps
being passed along the whole row, but a correction only travels back as far as
the start of the current chunk.

Click 6: only the gradient stops at the boundary — that is what detach() does.
Point at the dashed lines.

Click 7: forget the detach and the graph grows across every chunk until the run
runs out of memory. This is also the answer to "why is my loop using more memory
every iteration" for anyone who ever accumulates losses in a list.

k = 128 or 256 is typical for character models. It is a memory decision.
-->

---
layout: section
index: "03"
---

# Gated cells

The fix for the fading note: a sealed envelope that only the gates may open.

<div style="position: absolute; right: 4.5rem; top: 50%; transform: translateY(-50%)"><RnnGlyph kind="gate" :size="190" /></div>

<!--
Section 03 is the third part of the lecture proper, with section 01 and 02. Do
not compress it: it holds the payoff slide, "The highway, against the chain".

The glyph is a valve on a line. It comes back on the overview and the recap.
Say the metaphor out loud once more: the state is a note passed along a row of
people; in section 02 it got fainter with every copy. This section puts the
important part of the note in a sealed envelope that only the gates open.
-->

---
layout: default
title: Stop multiplying, start adding
---

# Stop multiplying, start adding

A plain RNN (recurrent neural network) **rebuilds** its state at every word.
The *not*-flag must survive 20 words to reach *great*.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 640 196" class="dl-diagram" role="img" aria-label="Top row: the not-flag passes through a chain of states, multiplied at every word, and fades. Bottom row: the flag rides a straight cell-state line in an envelope, with only additions along the way, and arrives intact.">
  <defs>
    <marker id="l5c-add-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small is-bad" x="10" y="16">plain RNN: multiply</text>
  <rect class="dl-dg-box is-accent" x="10" y="30" width="50" height="30" rx="4" />
  <text class="dl-dg-in" x="35" y="50" text-anchor="middle">not</text>
  <g v-for="(o, k) in [1, 0.7, 0.45, 0.28, 0.15]" :key="`l5c-ch${k}`">
    <path class="dl-dg-arrow" marker-end="url(#l5c-add-arrow)" :d="`M${62 + k * 90} 45 H${94 + k * 90}`" />
    <text class="dl-dg-small is-bad" :x="78 + k * 90" y="34" text-anchor="middle">×0.8</text>
    <rect class="dl-dg-fill" :x="98 + k * 90" y="30" width="50" height="30" rx="4" :style="{ opacity: o }" />
  </g>
  <text class="dl-dg-small" x="560" y="50">… 20 words</text>
  <g v-click>
    <text class="dl-dg-small is-good" x="10" y="106">cell state: only add</text>
    <rect class="dl-dg-box is-accent" x="10" y="130" width="50" height="30" rx="4" />
    <text class="dl-dg-in" x="35" y="150" text-anchor="middle">not</text>
    <path class="dl-dg-line" d="M62 145 H550" />
    <g v-for="k in 5" :key="`l5c-pl${k}`">
      <circle class="dl-dg-op" :cx="20 + k * 90" cy="145" r="10" />
      <text class="dl-dg-lab is-sm" :x="20 + k * 90" y="150" text-anchor="middle">+</text>
    </g>
    <g v-for="k in 4" :key="`l5c-env${k}`">
      <rect class="dl-dg-box is-accent" :x="51 + k * 90" y="136" width="28" height="18" rx="2" />
      <path class="dl-dg-arrow" :d="`M${51 + k * 90} 136 L${65 + k * 90} 147 L${79 + k * 90} 136`" />
    </g>
    <text class="dl-dg-small" x="560" y="150">… 20 words</text>
    <text class="dl-dg-small is-good" x="110" y="184">factor per word: 1</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

But a state that only adds never forgets. So put a **learned valve** on each
path: the **gates**.

</div>

<!--
Derive the architecture rather than presenting it. Students who meet the LSTM as
six equations memorise six equations; students who watch "additive path, then gate
it" can rebuild them.

Top row: the plain RNN. h_t = tanh(W_hh h_{t-1} + ...), so going back k words
multiplies the gradient by W_hh (and by tanh') k times. With the sentiment unit's
self-weight 0.8, that is section 02's 0.8^20 = 0.012. The boxes fade: the note
gets fainter with every copy.

Click: the bottom row. If instead the state were carried and only added to,
c_t = c_{t-1} + something, then dc_t / dc_{t-1} = 1 and the gradient walks back
twenty words unchanged. The envelope is the same envelope at every step.

Click: the callout. A pure sum never forgets anything, so it fills up. The fix is
a valve, learned, on each path: that is the next slide.

If the room has met a residual (skip) connection, it is the same additive trick.
Say so in one sentence; do not lean on it.
-->

---
layout: interactive
heading: The LSTM memory block
title: The LSTM memory block
aside-width: 21rem
---

<GatedCell />

::aside::

The LSTM (long short-term memory) carries two states. The **cell state** $c$
runs along the top.

Press **Walk the cell** for the six parts.

<div v-click class="mt-2 dl-callout">

Set **forget = 1**, **input = 0**: $c_t = c_{t-1}$, step after step. The
envelope stays sealed.

</div>

<div v-click class="mt-2 dl-secondary">

Forget = 0 wipes the past at once. Training learns which.

</div>

<!--
Walk all six, reading each equation as it lights up. Then drive the two extremes
from the aside. They take ten seconds each and they are what the room remembers.

Say clearly that the sliders set the gate *values*. In a real cell each gate is
its own sigma(Wx + Wh + b): a small dense layer with a sigmoid. There
are three gates (forget, input, output) plus the candidate, which is the same
kind of layer with tanh. Four weight sets: that is the "4x" in the parameter
count.

The gate is per unit, not per layer. With 128 units there are 128 independent
forget decisions every step, and in a trained model they genuinely differ: some
units hold values for hundreds of steps, most for two or three.

Running example, in words only: on the unit that holds the not-flag, a trained
cell can keep the forget gate near 1 from "not" until "great". The flag then
arrives intact. We have not set LSTM weights for the review, so give no numbers
for it.
-->

---
layout: default
title: The six equations
---

# The six equations

Three gates and a candidate, then two lines that update the states:

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

<div class="grid grid-cols-[1.1fr_1fr] gap-6 mt-2 items-center">
<div>

<svg viewBox="0 0 360 120" class="dl-diagram" style="max-height: 8.5rem" role="img" aria-label="The same inputs feed four small layers: three sigmoids give the gates f, i and o, one tanh gives the candidate; all four feed the update of c and h">
  <defs>
    <marker id="l5c-six-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="2" y="44" width="72" height="32" rx="4" />
  <text class="dl-dg-lab is-sm" x="38" y="65" text-anchor="middle">x, h</text>
  <g v-for="(g, k) in [['σ', 'f'], ['σ', 'i'], ['tanh', 'c̃'], ['σ', 'o']]" :key="`l5c-gate${k}`">
    <path class="dl-dg-arrow" marker-end="url(#l5c-six-arrow)" :d="`M76 60 L118 ${15 + k * 30}`" />
    <rect class="dl-dg-box is-accent" x="122" :y="4 + k * 30" width="58" height="22" rx="4" />
    <text class="dl-dg-in" x="151" :y="20 + k * 30" text-anchor="middle">{{ g[0] }}</text>
    <text class="dl-dg-lab is-sm" x="192" :y="20 + k * 30">{{ g[1] }}</text>
    <path class="dl-dg-arrow" marker-end="url(#l5c-six-arrow)" :d="`M210 ${15 + k * 30} L262 60`" />
  </g>
  <rect class="dl-dg-box" x="266" y="44" width="90" height="32" rx="4" />
  <text class="dl-dg-lab is-sm" x="311" y="65" text-anchor="middle">c, h</text>
</svg>

</div>
<div v-click class="dl-callout">

Four of the six are the **same layer**: $\sigma$ or $\tanh$ of $Wx + Wh + b$,
each with its own weights. Only the last two are new.

</div>
</div>

<!--
The point: the LSTM looks like six equations, but four of them are the same
layer with different weights. Only the last two — the updates of c and h — are
new ideas.

On screen: at first only the heading, the line "three gates and a candidate,
then two lines that update the states", and the picture underneath. The picture
is the same point drawn: one input (x, h), four boxes of the same shape — three
sigmoids giving the gates f, i and o, one tanh giving the candidate c~ — then
all four feed the update of c and h.

Reveal the equations in order and say what changes each time: the first four
are identical in form and differ only in their weights and their activation.

Click: the forget gate. Read it: "f at step t is the sigmoid of W_xf times x_t,
plus W_hf times the previous h, plus a bias." Point at the first sigma box.

Click 2: the input gate i_t — the same shape, its own weights.

Click 3: the candidate c~_t — the same shape again, but with tanh. Sigmoid for a
gate because a gate is a fraction in (0, 1); tanh for the candidate because
content should be signed.

Click 4: the output gate o_t, top of the right column — the fourth copy.

Click 5: the cell update. "c_t is f_t times the old c, plus i_t times the
candidate." Keep a fraction of the old memory, add a fraction of the new
content. The odot is elementwise, not a matrix product: every gate decision is
per unit.

Click 6: the output. "h_t is o_t times tanh of c_t" — squash the memory, then
let the output gate decide how much of it to show.

Click 7: the callout. Four of the six are the same layer, sigma or tanh of
Wx + Wh + b, each with its own weights. That is why the parameter count is
exactly 4x the plain RNN's, and why nn.LSTM stores one weight_ih of shape
(4H, input) rather than four matrices.

Every symbol is named on the next slide, "Reading the equation: the LSTM cell".
-->

---
layout: default
title: "Reading the equation: the LSTM cell"
---

# Reading the equation: the LSTM cell

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $\mathbf{f}_t,\ \mathbf{i}_t,\ \mathbf{o}_t$ | forget, input, output gates | fractions in $(0, 1)$ | 0.90, 0.40, 0.70 |
| $\tilde{\mathbf{c}}_t$ | candidate | content to write | 0.80 |
| $\mathbf{c}_{t-1},\ \mathbf{c}_t$ | cell state | long-term memory | 0.6 |
| $\mathbf{h}_{t-1},\ \mathbf{h}_t$ | hidden state | what the cell shows | 0.5 |
| $\mathbf{x}_t,\ t$ | input, time step | this step's data | 1 |
| $W_{x\cdot},\ W_{h\cdot},\ \mathbf{b}_\cdot$ | weights, biases | per gate, learned | $W_{xf} = 1.5$ |
| $\sigma,\ \tanh$ | sigmoid, hyperbolic tangent | into $(0, 1)$ and $(-1, 1)$ | $\sigma(2.2) = 0.90$ |
| $\odot$ | element-wise product | unit by unit | $0.9 \times 0.6$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 140" role="img" aria-label="The sigmoid curve with three points: the input gate at 0.40, the output gate at 0.70 and the forget gate at 0.90" style="width: 100%; height: auto; font-family: inherit;">
  <line x1="20" y1="110" x2="280" y2="110" stroke="var(--dl-border)" stroke-width="1.5" />
  <line x1="20" y1="10" x2="280" y2="10" stroke="var(--dl-border)" stroke-width="1" style="stroke-dasharray: 4 4" />
  <line x1="150" y1="10" x2="150" y2="110" stroke="var(--dl-border)" stroke-width="1" />
  <path d="M20.0 108.2 L36.2 107.1 L52.5 105.3 L68.8 102.4 L85.0 98.1 L101.2 91.8 L117.5 83.1 L133.8 72.2 L150.0 60.0 L166.2 47.8 L182.5 36.9 L198.8 28.2 L215.0 21.9 L231.2 17.6 L247.5 14.7 L263.8 12.9 L280.0 11.8" fill="none" stroke="var(--dl-accent)" stroke-width="2" />
  <circle cx="221.5" cy="20.0" r="5" fill="var(--dl-danger)" />
  <text x="230" y="38" style="font-size: 12px; fill: var(--dl-body)">f = 0.90</text>
  <circle cx="177.6" cy="39.9" r="5" fill="var(--dl-accent-strong)" />
  <text x="186" y="58" style="font-size: 12px; fill: var(--dl-body)">o = 0.70</text>
  <circle cx="137.0" cy="69.9" r="5" fill="var(--dl-accent-strong)" />
  <text x="146" y="88" style="font-size: 12px; fill: var(--dl-body)">i = 0.40</text>
  <text x="150" y="128" text-anchor="middle" style="font-size: 12px; fill: var(--dl-muted)">0</text>
  <text x="280" y="128" text-anchor="end" style="font-size: 12px; fill: var(--dl-muted)">input to σ</text>
  <text x="22" y="24" style="font-size: 12px; fill: var(--dl-muted)">1</text>
</svg>

<div v-click class="dl-callout">

Forget gate: $x_t = 1$, $h_{t-1} = 0.5$, $W_{xf} = 1.5$, $W_{hf} = 0.8$,
$b_f = 0.3$:

$f_t = \sigma(1.5 + 0.4 + 0.3) = \sigma(2.2) = 0.90$

Others: $\sigma(-0.4) = 0.40,\; \tanh(1.1) = 0.80,\; \sigma(0.85) = 0.70$

</div>

</div>
</div>

<!--
Eight rows, because the six equations share most of their symbols. Group them as
you read: three gates, one candidate, two states, one input, one set of weights per
gate, two squashing functions, one new operator.

The subscript dot in W_x., W_h., b. stands for the gate's letter: W_xf, W_xi,
W_xc, W_xo and so on. Four input matrices, four recurrent matrices, four biases
(three gates plus the candidate), which is why the parameter count is 4x the plain
RNN's.

The worked example shows where the next slide's numbers come from. The next
slide starts from f = 0.9, i = 0.4, c~ = 0.8, o = 0.7 (the GatedCell widget's
defaults); this one shows that each is just sigma or tanh of a weighted sum. Do
the forget gate in full and only quote the other three pre-activations. Checked:
sigma(2.2) = 0.900, sigma(-0.4) = 0.401, tanh(1.1) = 0.800, sigma(0.85) = 0.701.

The odot row is the one students get wrong: it multiplies matching entries, unit
by unit. c_t = f_t odot c_{t-1} means "each unit keeps its own fraction of its own
memory".

Two letters clash with earlier slides: o_t here is the output GATE, not an output
of the plain RNN, and W_ho here is the gate's recurrent weight, not the output
layer. The literature uses the same letters for both; say it once.
-->

---
layout: default
title: One LSTM step, by hand
---

# One LSTM step, by hand

Values from the last slide: $c_{t-1} = 0.6$, $f = 0.9$,
$i = 0.4$, $\tilde{c} = 0.8$, $o = 0.7$.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 640 180" class="dl-diagram" role="img" aria-label="The cell state 0.6 is multiplied by the forget gate 0.9 to give 0.54, then 0.4 times 0.8 = 0.32 is added to give 0.86; tanh of 0.86 times the output gate 0.7 gives h = 0.49">
  <defs>
    <marker id="l5c-step-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <text class="dl-dg-lab is-sm" x="2" y="55">c<tspan baseline-shift="sub" style="font-size: 9px">t−1</tspan> = 0.6</text>
  <path class="dl-dg-line" marker-end="url(#l5c-step-arrow)" d="M70 50 H610" />
  <circle class="dl-dg-op" cx="170" cy="50" r="13" />
  <text class="dl-dg-lab is-sm" x="170" y="55" text-anchor="middle">×</text>
  <rect class="dl-dg-box is-accent" x="140" y="96" width="60" height="26" rx="4" />
  <text class="dl-dg-in" x="170" y="114" text-anchor="middle">f = 0.9</text>
  <path class="dl-dg-arrow" marker-end="url(#l5c-step-arrow)" d="M170 96 V66" />
  <circle class="dl-dg-op" cx="320" cy="50" r="13" />
  <text class="dl-dg-lab is-sm" x="320" y="55" text-anchor="middle">+</text>
  <rect class="dl-dg-box is-accent" x="270" y="96" width="100" height="26" rx="4" />
  <text class="dl-dg-in" x="320" y="114" text-anchor="middle">i · c̃ = 0.4 × 0.8</text>
  <path class="dl-dg-arrow" marker-end="url(#l5c-step-arrow)" d="M320 96 V66" />
  <g v-click>
    <text class="dl-dg-lab" x="245" y="36" text-anchor="middle">0.54</text>
    <text class="dl-dg-small" x="245" y="74" text-anchor="middle">kept</text>
  </g>
  <g v-click>
    <text class="dl-dg-small" x="320" y="140" text-anchor="middle">written: 0.32</text>
  </g>
  <g v-click>
    <text class="dl-dg-lab" x="395" y="36" text-anchor="middle">0.86</text>
  </g>
  <g v-click>
    <path class="dl-dg-arrow" marker-end="url(#l5c-step-arrow)" d="M450 50 V100 H476" />
    <text class="dl-dg-small" x="444" y="84" text-anchor="end">tanh</text>
    <circle class="dl-dg-op" cx="492" cy="100" r="13" />
    <text class="dl-dg-lab is-sm" x="492" y="105" text-anchor="middle">×</text>
    <rect class="dl-dg-box is-accent" x="462" y="140" width="60" height="26" rx="4" />
    <text class="dl-dg-in" x="492" y="158" text-anchor="middle">o = 0.7</text>
    <path class="dl-dg-arrow" marker-end="url(#l5c-step-arrow)" d="M492 140 V116" />
    <path class="dl-dg-arrow" marker-end="url(#l5c-step-arrow)" d="M506 100 H532" />
    <text class="dl-dg-lab" x="538" y="106">h<tspan baseline-shift="sub" style="font-size: 11px">t</tspan> = 0.49</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

The cell **holds** 0.86 but **shows** 0.49: the output gate decides how much
to reveal.

</div>

<!--
Have them do it on paper while you click, then check against the GatedCell widget
("The LSTM memory block"): the numbers are the widget's defaults, so it works.

The four clicks, in order:
  kept     f x c_{t-1} = 0.9 x 0.6 = 0.54
  written  i x c~      = 0.4 x 0.8 = 0.32
  cell     c_t = 0.54 + 0.32 = 0.86
  shown    h_t = o x tanh(c_t) = 0.7 x tanh(0.86) = 0.7 x 0.696 = 0.49
(checked in Python: 0.4874.)

The distinction between what the cell *holds* and what it *shows* is the job of
the output gate, and it is the part of the LSTM that students most often cannot
explain. This slide is where it gets explained.

Running example, in words: if this unit held the not-flag, the "kept" line is
what carries it from word to word. With f near 1, almost all of it survives each
word. The output gate can keep it hidden until "great" arrives. Do not put numbers
on that: we have not set LSTM weights for the review.
-->

---
layout: interactive
heading: The highway, against the chain
title: The highway, against the chain
aside-width: 20rem
---

<GradientFlow mode="gated" :w="0.8" :forget="0.99" :steps="20" />

::aside::

The long review: *not* sits 20 words before *great*. How much gradient gets back
to it?

<svg viewBox="0 0 300 128" class="dl-diagram mt-2" role="img" aria-label="Two bars on the same scale from 0 to 1: the plain RNN keeps 0.8 to the power 20, which is 0.012, a sliver; the LSTM cell state keeps 0.99 to the power 20, which is 0.82">
  <g v-click>
    <text class="dl-dg-small" x="0" y="14">plain RNN, 0.8²⁰</text>
    <rect class="dl-dg-box" x="0" y="22" width="190" height="26" rx="3" />
    <rect class="dl-dg-bar is-bad" x="0" y="22" width="2.3" height="26" />
    <text x="200" y="45" style="font-size: 26px; font-weight: 700; fill: var(--dl-danger)">0.012</text>
  </g>
  <g v-click>
    <text class="dl-dg-small" x="0" y="80">LSTM cell state, 0.99²⁰</text>
    <rect class="dl-dg-box" x="0" y="88" width="190" height="26" rx="3" />
    <rect class="dl-dg-bar is-q" x="0" y="88" width="155.8" height="26" />
    <text x="200" y="111" style="font-size: 26px; font-weight: 700; fill: var(--dl-accent-strong)">0.82</text>
  </g>
</svg>

<div v-click class="mt-2 dl-callout">

The note fades with every copy. The sealed envelope arrives almost intact.

</div>

<!--
THE PAYOFF. This is the slide the whole deck is built for: slow down.

Say out loud: it is not magic. A learned forget gate, held near 1, replaces the
fixed weight 0.8.

Ask the question first and let it sit. Then click: 0.012, the number from section
02 ("What vanishing feels like"), drawn as a bar on a 0-to-1 scale. It is a
sliver. Click: 0.82 on the same scale. Leave both on screen and say the two
numbers out loud, side by side.

Checked in Python: 0.8^20 = 0.0115 (the widget's readout says 0.0115; the slide
rounds to 0.012), 0.99^20 = 0.818. The bars are to scale: 190 px = 1.

The chart: red is the plain recurrence, multiplied by W = 0.8 per word back; teal
is the cell state, multiplied by f = 0.99. Then push f to 1.000 on the slider:
the factor is exactly 1 at any distance.

The secondary line is the honest version and it matters: LSTMs do not abolish
vanishing gradients. They make the decay rate a learned, per-unit, per-step
quantity. An LSTM whose forget gates all learn 0.5 vanishes as fast as anything
else.

This is also why forget-gate biases are often initialised to 1 or 2: it starts
the gate open, so the highway is clear before training has learned anything.
Worth saying for anyone who reads implementations.
-->

---
layout: default
title: Where the LSTM came from
---

# Where the LSTM came from

<div class="mt-3 flex justify-center">
<svg viewBox="0 0 640 120" class="dl-diagram" role="img" aria-label="A timeline: 1991, the vanishing gradient described; 1997, the LSTM with an additive cell state; 2000, the forget gate added; 2014, the GRU">
  <path class="dl-dg-line is-muted" d="M30 50 H620" />
  <g v-for="(e, k) in [[60, '1991', 'vanishing gradient', 'described'], [210, '1997', 'LSTM: additive', 'cell state'], [300, '2000', 'forget gate', 'added'], [560, '2014', 'GRU:', 'fewer parts']]" :key="`l5c-year${k}`">
    <circle :class="k === 2 ? 'dl-dg-dot is-accent' : 'dl-dg-dot'" :cx="e[0]" cy="50" r="7" />
    <text class="dl-dg-lab is-sm" :x="e[0]" y="30" text-anchor="middle">{{ e[1] }}</text>
    <text :class="k === 2 ? 'dl-dg-small is-good' : 'dl-dg-small'" :x="e[0]" y="80" text-anchor="middle">{{ e[2] }}</text>
    <text :class="k === 2 ? 'dl-dg-small is-good' : 'dl-dg-small'" :x="e[0]" y="96" text-anchor="middle">{{ e[3] }}</text>
  </g>
</svg>
</div>

<div v-click class="mt-3 dl-callout">

The 1997 cell could write and read, but **never clear**. On a long stream its
state filled up and stopped changing. The forget gate came three years later.

</div>

<div v-click class="mt-4 dl-secondary">

For about twenty years, the LSTM was the standard model for sequences.

</div>

<div class="mt-4">
  <Citation source="Hochreiter & Schmidhuber, Long Short-Term Memory (1997); Gers et al., Learning to Forget (2000)" url="https://www.bioinf.jku.at/publications/older/2604.pdf" />
</div>

<!--
Short and cited. The history is
worth one minute for one reason: the forget gate was not in the original design,
which is a useful antidote to reading an architecture as if every part were
inevitable.

1991: Hochreiter's diploma thesis already described the vanishing gradient.
1997: Hochreiter and Schmidhuber built the LSTM to fix it. At its centre is the
"constant error carousel", the 1997 paper's own name for the additive cell state.
It is a better name than "highway".
2000: Gers, Schmidhuber and Cummins added the forget gate. Without it the state
saturated on long streams: it filled up and stopped changing. Today it is the
most important gate of the three.
2014: the GRU, two slides on.

What came after the LSTM starts at the end of this lecture (attention, in its
2014 recurrent form) and continues in a later lecture; do not open it here.
-->

---
layout: interactive
heading: The GRU — same idea, fewer parts
title: The GRU — same idea, fewer parts
aside-width: 20rem
---

<GatedCell variant="gru" />

::aside::

The GRU (gated recurrent unit): one state, two gates.

<v-clicks>

- The **update gate** $z$ does the forget and input jobs at once
- The **reset gate** $r$ sets how much of the past the candidate may read. Drag
  it to 0
- $h_t = (1-z)\,h_{t-1} + z\,\tilde{h}_t$: a blend, and the two shares sum to 1

</v-clicks>

<!--
The point: the GRU is the same gating idea with fewer parts — one state instead
of two, two gates instead of three — and it works about as well.

On screen: the GatedCell widget in its GRU variant: a slider for each gate, bars
for the old state, the candidate and the new state. The aside: the GRU (gated
recurrent unit) has one state and two gates.

Click: the update gate z does the forget and input jobs at once. One number
decides both how much to keep and how much to write.

Click 2: the reset gate r sets how much of the past the candidate may read. Drive
the reset gate to 0 now: the candidate bar jumps, because it has stopped reading
the state.

Click 3: the blend. Read it: "h_t is (1 - z) times the old h, plus z times the
candidate." The two shares sum to 1. Now drive z to 0 and 1 in turn: at 0 the
state is frozen, at 1 it is totally overwritten.

The structural consequence worth naming: an LSTM can forget without writing
(f = 0, i = 0) and a GRU cannot, because its kept and written shares are tied.
In practice this costs almost nothing, and the GRU has a quarter fewer weights
(three weight sets instead of four).

Cho et al., 2014. The way the blend is written here (z = how much to update)
follows Chung et al., 2014; the next slide shows why that matters.
-->

---
layout: default
title: Which one, and the sign that will catch you
---

# Which one, and the sign that will catch you

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 600 124" class="dl-diagram" role="img" aria-label="Parameter counts for a layer with 64 inputs and 128 hidden units, drawn to scale: plain RNN 24 832, GRU 74 496, LSTM 99 328">
  <text class="dl-dg-small" x="100" y="12">weights, 64 → 128</text>
  <g v-for="(r, k) in [['plain RNN', 24832, '24 832'], ['GRU', 74496, '74 496'], ['LSTM', 99328, '99 328']]" :key="`l5c-par${k}`">
    <text class="dl-dg-lab is-sm" x="92" :y="40 + k * 32" text-anchor="end">{{ r[0] }}</text>
    <rect :class="k === 0 ? 'dl-dg-bar' : 'dl-dg-bar is-q'" x="100" :y="24 + k * 32" :width="r[1] / 99328 * 380" height="22" rx="2" />
    <text class="dl-dg-small" :x="108 + r[1] / 99328 * 380" :y="40 + k * 32">{{ r[2] }}</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

**Pick one and move on.** LSTM and GRU usually differ by about a point. Both
beat the plain RNN on long sequences.

</div>

<div v-click class="mt-3 dl-secondary">

**Sign trap.** Here $z$ = how much to **update**. In Cho's paper and `nn.GRU`,
$h_t = z\,h_{t-1} + (1-z)\,\tilde{h}_t$: $z$ = how much to **keep**.

</div>

<!--
The bars are the parameter count to scale: one weight set for the plain RNN
(64x128 + 128x128 + 2x128 = 24 832, with PyTorch's two bias vectors), three for
the GRU (74 496), four for the LSTM (99 328). Checked in Python.

The callout: benchmarks have argued about LSTM versus GRU since 2014 and the
answer is "it depends, by about a point". If pressed: GRU trains faster and is
usually equal on small data; LSTM has a small edge on very long dependencies and
on language modelling. Neither difference is worth an afternoon.

The sign trap is the thing they will actually hit, and only if they check an
implementation against a paper, which is what a good student does. These slides
(and the GatedCell widget) write h_t = (1 - z) h_{t-1} + z h~, as Chung et al.
(2014) and many textbooks do. Cho et al. (2014), the GRU paper itself, write
h_t = z h_{t-1} + (1 - z) h~, and PyTorch's nn.GRU follows Cho:
h_t = (1 - z) * n_t + z * h_{t-1}. Same model; the gate means the opposite.

(An earlier version of this deck had this backwards, saying Cho used the update
convention. Fixed in the 2026-10-04 rework.)
-->

---
layout: default
---

<div class="grid grid-cols-[1.6fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="An LSTM unit runs 50 steps with forget = 1 and input = 0 throughout. What is c₅₀?"
  :items="[
    'Zero — it has been multiplied down',
    'c₀, unchanged',
    'Undefined — the state saturates',
    'tanh(c₀)',
  ]"
/>

</div>
<div class="mt-10">

<svg viewBox="0 0 260 110" class="dl-diagram" role="img" aria-label="The cell state c-zero passes through fifty steps of multiply by 1 and add 0; what comes out?">
  <text class="dl-dg-lab is-sm" x="4" y="45">c₀</text>
  <path class="dl-dg-line" d="M28 40 H200" />
  <circle class="dl-dg-op" cx="70" cy="40" r="14" />
  <text class="dl-dg-small" x="70" y="44" text-anchor="middle">×1</text>
  <circle class="dl-dg-op" cx="120" cy="40" r="14" />
  <text class="dl-dg-small" x="120" y="44" text-anchor="middle">+0</text>
  <text class="dl-dg-small" x="160" y="44" text-anchor="middle">…</text>
  <text class="dl-dg-lab is-sm" x="206" y="45">c₅₀</text>
  <text class="dl-dg-small" x="110" y="84" text-anchor="middle">50 steps: f = 1, i = 0</text>
</svg>

</div>
</div>

<div v-click class="mt-4 dl-reveal">

c₀, unchanged

</div>

<div v-click class="mt-2 dl-secondary">

$c_t = 1 \cdot c_{t-1} + 0 \cdot \tilde{c}_t = c_{t-1}$, fifty times over. The
gradient travels back along the same path, multiplied by exactly 1 at each step.

</div>

<!--
Hands up for each. Option 4 is the popular wrong answer: tanh is applied on the
way *out* to h, never to c itself. That confusion is worth naming out loud.

Option 3 is the 1997 cell's real problem, but it came from input that kept
being added. With input = 0 nothing is added, so nothing fills up.

This is the sealed envelope with both gates shut: nothing gets in, nothing leaks
out. That is the whole reason the architecture exists.
-->

---
layout: section
index: "04"
---

# Words into vectors

Where the input vectors came from.

<div style="position: absolute; right: 4.5rem; top: 50%; transform: translateY(-50%)"><RnnGlyph kind="map" :size="190" /></div>

<!--
Section 04 is compressible. If you are behind, show "An embedding is a lookup
table" only: our toy table was hand-set, a real one is learned, 64 numbers per
word. The lab covers the code.

The glyph: words as points on a plane. Similar words sit close together. It comes
back on the overview and the recap.
-->

---
layout: default
title: A word is not a number
---

# A word is not a number

$W_{xh}\mathbf{x}_t$ needs a vector. Two first tries, for 20 000 words:

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 640 176" class="dl-diagram" role="img" aria-label="Left: words numbered by index on a line, aardvark 96, brilliant 2103, great 4217, which invents an order. Right: one-hot vectors as the corners of a triangle, every pair the same distance apart.">
  <text class="dl-dg-lab is-sm" x="150" y="16" text-anchor="middle">index: one number</text>
  <path class="dl-dg-line is-muted" d="M14 90 H290" />
  <g v-for="(p, k) in [[34, 'aardvark', '96'], [130, 'brilliant', '2 103'], [250, 'great', '4 217']]" :key="`l5c-idx${k}`">
    <circle class="dl-dg-dot" :cx="p[0]" cy="90" r="6" />
    <text class="dl-dg-small" :x="p[0]" y="70" text-anchor="middle">{{ p[1] }}</text>
    <text class="dl-dg-small" :x="p[0]" y="112" text-anchor="middle">{{ p[2] }}</text>
  </g>
  <text class="dl-dg-small is-bad" x="150" y="160" text-anchor="middle">great "bigger" than brilliant?</text>
  <line class="dl-dg-split" x1="320" y1="4" x2="320" y2="170" />
  <g v-click>
    <text class="dl-dg-lab is-sm" x="480" y="16" text-anchor="middle">one-hot: 20 000 numbers</text>
    <path class="dl-dg-line is-muted" d="M480 38 L410 128 L550 128 Z" />
    <circle class="dl-dg-dot" cx="480" cy="38" r="6" />
    <circle class="dl-dg-dot" cx="410" cy="128" r="6" />
    <circle class="dl-dg-dot" cx="550" cy="128" r="6" />
    <text class="dl-dg-small" x="494" y="42">great</text>
    <text class="dl-dg-small" x="396" y="132" text-anchor="end">brilliant</text>
    <text class="dl-dg-small" x="564" y="132">aardvark</text>
    <text class="dl-dg-small is-bad" x="480" y="160" text-anchor="middle">every pair equally far apart</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

Neither knows that *great* and *brilliant* mean almost the same. We want a short
vector per word, with **similar words close together**.

</div>

<!--
Left: index it. great -> 4 217. One number per word, and arithmetic on it is
nonsense. It says 4 217 is "more" than 2 103, and it puts great between whatever
words happen to be numbered 4 216 and 4 218. This is what a student's first
tokeniser produces, and it is the tensor they then feed straight into a Linear
layer by mistake.

Click: one-hot it, the usual answer. A 20 000-long vector, 19 999 zeros and one
1. Honest: no false order. But every pair of words is exactly sqrt(2) apart, so
great and brilliant are as different as great and aardvark. One-hot throws away
every relationship between words before the model sees anything. It is also what
made the dense layer cost a billion weights on "Try it with the network we
already have" in section 00.

The callout sets up the next slide: our toy review already used two hand-set
numbers per word. The question is where real ones come from.
-->

---
layout: interactive
heading: An embedding is a lookup table
title: An embedding is a lookup table
aside-width: 19rem
---

<EmbeddingLab />

::aside::

Our review's table was **set by hand**:

<svg viewBox="0 0 280 78" class="dl-diagram" role="img" aria-label="The toy table: the, movie and was map to 0, 0; not maps to 0, 1; great maps to 1, 0">
  <g v-for="(r, k) in [['the, movie, was', '0', '0'], ['not', '0', '1'], ['great', '1', '0']]" :key="`l5c-toy${k}`">
    <text class="dl-dg-small" x="132" :y="20 + k * 24" text-anchor="end">{{ r[0] }}</text>
    <rect class="dl-dg-box is-accent" x="142" :y="6 + k * 24" width="44" height="20" rx="2" />
    <rect class="dl-dg-box is-accent" x="190" :y="6 + k * 24" width="44" height="20" rx="2" />
    <text class="dl-dg-in" x="164" :y="21 + k * 24" text-anchor="middle">{{ r[1] }}</text>
    <text class="dl-dg-in" x="212" :y="21 + k * 24" text-anchor="middle">{{ r[2] }}</text>
  </g>
</svg>

<v-clicks>

- The widget: a **different, bigger** table, 9 words × 4 numbers
- Real: 20 000 rows of **64 learned** numbers

</v-clicks>

<div v-click class="mt-2 dl-callout">

One-hot times the table picks a row. So it trains like any layer.

</div>

<!--
Start with the toy table in the aside: it is the one from the start of the lecture, two numbers
per word, "positive word" and "negation word", written by hand so every number
could be checked. Say plainly: that was for teaching. In a real model those rows
are weights, learned like any other, and there are 64 numbers per word, not 2.

Then the widget, and say it out loud: it is a different, bigger table, nine words
and four numbers each, chosen to look like a learned one. It does not contain our
"not" row.

Click a few words and let them watch the highlighted row move. The claim to make
unmissable: one-hot times a matrix IS row selection, so the "lookup table" and
the "linear layer" descriptions are the same object. E is V x d: V rows (the
vocabulary size), d columns (the embedding width), with d much smaller than V.

Which also answers "how does it learn?": the same way every other weight matrix
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

In a trained model these coordinates are weights, moved by gradient descent.

<v-clicks>

- *great* and *brilliant* end up together
- *awful* and *terrible* too, at the far end
- *the* and *a* sit near zero on both axes

</v-clicks>

<div v-click class="mt-2 dl-secondary">

These axes are hand-written for display, not our toy's. A real table has 64
unnamed axes.

</div>

<!--
The point: an embedding table is not a list of arbitrary codes; after training,
words that are used alike sit near each other, and that geometry is what the
model has learned.

On screen: the EmbeddingLab widget in "space" mode — each word is a dot in two
dimensions. The aside opens with the key fact: in a trained model these
coordinates are weights, moved by gradient descent like any other.

Click: great and brilliant end up together. Point at the pair in the widget.

Click 2: awful and terrible too, at the far end of the same axis.

Click 3: the and a sit near zero on both axes — they carry neither sentiment nor
meaning about films.

Click 4: the honest caveat in the secondary line, and it matters. The widget's
axes, "sentiment" and "is a film noun", are hand-written to look like a trained
table; they are not the toy review's axes ("positive word", "negation word"), and
this is not the same table. A real table has 64 unnamed axes. Do not let anyone
leave thinking dimension 1 is "sentiment" in a real model.

The useful consequence: a word the model saw twice can inherit from a word it saw
a thousand times, because they sit near each other. That is what "extraction of
salient features" means when textbooks list it as a benefit.

For the running example: in a trained table, "not" would end up somewhere of its
own, away from the sentiment words, because what it does is flip them, not carry
a sentiment of its own. Say that as an expectation, not a measured fact.
-->

---
layout: default
title: Embeddings in code, and where they come from
---

# Embeddings in code, and where they come from

<div class="flex justify-center">
<svg viewBox="0 0 560 56" class="dl-diagram is-sm-h" role="img" aria-label="Token ids of shape 2 by 5 go into the embedding table of 20 000 by 64 and come out as vectors of shape 2 by 5 by 64">
  <defs>
    <marker id="l5c-emb-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="4" y="10" width="110" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="59" y="32" text-anchor="middle">ids (2, 5)</text>
  <path class="dl-dg-arrow" marker-end="url(#l5c-emb-arrow)" d="M116 27 H170" />
  <rect class="dl-dg-box is-accent" x="174" y="4" width="170" height="46" rx="4" />
  <text class="dl-dg-in" x="259" y="32" text-anchor="middle">table 20 000 × 64</text>
  <path class="dl-dg-arrow" marker-end="url(#l5c-emb-arrow)" d="M346 27 H400" />
  <rect class="dl-dg-box" x="412" y="4" width="140" height="34" rx="4" />
  <rect class="dl-dg-box" x="404" y="12" width="140" height="34" rx="4" />
  <text class="dl-dg-lab is-sm" x="474" y="34" text-anchor="middle">vectors (2, 5, 64)</text>
</svg>
</div>

```python {all|1-2|4-5|6|7|all}{lines:true}
vocab_size, embed_dim = 20_000, 64
embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)

ids = torch.tensor([[2, 17, 9, 31, 4217],    # B: the movie was not great
                    [2, 17, 9, 4217,  0]])   # A: the movie was great, padded
vectors = embed(ids)                         # (2, 5, 64)
print(embed.weight.shape)                    # torch.Size([20000, 64])
```

<div class="grid grid-cols-2 gap-6 dl-tight">
<div>

<v-clicks>

- Integer ids in, shape (batch, time)
- `padding_idx=0` keeps row 0 at zero
- 1.28 M learned numbers, starting random

</v-clicks>

</div>
<div v-click class="dl-callout">

Or start from a table pre-trained on billions of words: **word2vec**, **GloVe**,
**fastText**.

</div>
</div>

<!--
The point: an embedding layer is a lookup table — integer ids in, one learned
row of 64 numbers per id out — and it is usually most of the model's weights.

On screen: the shape picture across the top. Token ids of shape (2, 5) go into
the table of 20 000 x 64 and come out as vectors of shape (2, 5, 64). Below, the
code that does it, with the two reviews as a batch.

Click: lines 1-2 — the table: 20 000 words, 64 numbers each. padding_idx is the
practical line. Row 0 is pinned at zero and gets no gradient. Without it the pad
row drifts during training and quietly contributes to every short sequence in
the batch.

Click 2: lines 4-5 — the two reviews as ids. Review B is the first row; review
A is one word shorter, so it is padded with id 0 to length 5. The ids are made up
(a real tokeniser assigns them); 4217 is "great", the same number as on "A word
is not a number".

Click 3: line 6 — the lookup. (B, T) in, (B, T, d) out: batch 2, time 5, width 64.

Click 4: line 7 — the table itself is a weight matrix of shape (20000, 64).

Click 5: the whole block again.

Click 6: integer ids in, shape (batch, time) — no one-hot vectors anywhere.

Click 7: padding_idx=0 keeps row 0 at zero, as on line 2.

Click 8: 1.28 M learned numbers, starting random. 20 000 x 64 = 1 280 000. Put an
LSTM(64, 128) and the Linear(128, 2) head on top and the embedding is 92.8% of
all the weights (1 280 000 of 1 379 586, the same classifier as section 05).

Click 9: the callout — or start from a table pre-trained on billions of words.
Pre-trained tables (word2vec 2013, GloVe 2014, fastText 2016) were the transfer
learning of language models from 2013 to 2018, the same idea as starting a
network from pre-trained weights. The words came pre-trained but the model
reading them did not.
-->

---
layout: section
index: "05"
---

# An RNN in PyTorch

The same reviews, 32 at a time.

<div style="position: absolute; right: 4.5rem; top: 50%; transform: translateY(-50%);"><RnnGlyph kind="shape" :size="190" /></div>

<!--
Section 06 is compressible: the lab covers all of it. If you are behind, show
"Shapes, end to end" and "Four bugs, and what each one looks like", and send the
rest to the lab.

The glyph is a stack of slabs with three sizes marked, B, T and F: one padded
batch of reviews. It is the picture behind every slide in this section.
-->

---
layout: default
title: The shape that causes the most bugs
---

# The shape that causes the most bugs

32 reviews (B) of 200 words (T), 64 numbers per word (F). Which axis is time?

<svg class="dl-diagram mt-2" viewBox="0 0 600 168" role="img" aria-label="Three shape strips. Default: T 200, B 32, F 64. batch_first=True: B 32, T 200, F 64. The trap: a batch-first tensor read by the default layer becomes T 32, B 200.">
  <text class="dl-dg-lab is-sm" x="0" y="22">default</text>
  <text class="dl-dg-small" x="0" y="38">batch_first=False</text>
  <g v-for="(d, k) in [['T', '200'], ['B', '32'], ['F', '64']]" :key="`r1${k}`">
    <rect class="dl-dg-box" :x="190 + k * 130" y="4" width="120" height="40" rx="5" />
    <text class="dl-dg-lab is-sm" :x="232 + k * 130" y="29" text-anchor="middle">{{d[0]}}</text>
    <text class="dl-dg-small" :x="262 + k * 130" y="29" text-anchor="middle">{{d[1]}}</text>
  </g>
  <text class="dl-dg-lab is-sm" x="0" y="80">batch_first=True</text>
  <g v-for="(d, k) in [['B', '32'], ['T', '200'], ['F', '64']]" :key="`r2${k}`">
    <rect class="dl-dg-box is-accent" :x="190 + k * 130" y="62" width="120" height="40" rx="5" />
    <text class="dl-dg-lab is-sm" :x="232 + k * 130" y="87" text-anchor="middle">{{d[0]}}</text>
    <text class="dl-dg-small" :x="262 + k * 130" y="87" text-anchor="middle">{{d[1]}}</text>
  </g>
  <g v-click>
    <text class="dl-dg-lab is-sm" x="0" y="138">the trap</text>
    <text class="dl-dg-small is-bad" x="0" y="154">flag left out</text>
    <g v-for="(d, k) in [['T', '32'], ['B', '200'], ['F', '64']]" :key="`r3${k}`">
      <rect class="dl-dg-box is-bad" :x="190 + k * 130" y="120" width="120" height="40" rx="5" />
      <text class="dl-dg-lab is-sm" :x="232 + k * 130" y="145" text-anchor="middle">{{d[0]}}</text>
      <text class="dl-dg-small is-bad" :x="262 + k * 130" y="145" text-anchor="middle">{{d[1]}}</text>
    </g>
  </g>
</svg>

<div v-click class="mt-2 dl-callout">

Pass `batch_first=True`. Without it the model still trains, but reads 32 reviews
as 32 time steps, with no error.

</div>

<div v-click class="mt-2 dl-secondary">

Exception: `h_n` is always (layers × directions, B, hidden).

</div>

<!--
This is the single most expensive line in the lecture. Say it, write it on the
board, and say it again when the code slide comes up.

Ask the question first, then click to the red row. The failure mode: a
(B, T, F) tensor fed to a batch_first=False layer is read as T = 32 steps of a
batch of 200 "reviews", each "review" being one word position across the batch.
The loss goes down — it is still learning something — and the accuracy is
nonsense.

Why the default is time-first at all: it is convenient for cuDNN, the NVIDIA GPU
library that runs the LSTM loop. Batch-first matches every other PyTorch layer,
and nn.Embedding's output.

The h_n exception catches people who then try to be consistent about it.
-->

---
layout: default
title: nn.LSTM returns two things, and you want one of them
---

# `nn.LSTM` returns two things, and you want one of them

<div class="grid grid-cols-[1.35fr_1fr] gap-6 items-center">
<div>

```python {all|1-2|4-5|7|8|all}{lines:true}
lstm = nn.LSTM(input_size=64, hidden_size=128,
               batch_first=True)

x = torch.randn(32, 200, 64)        # (B, T, embed)
output, (h_n, c_n) = lstm(x)

output.shape     # (32, 200, 128): every step
h_n.shape        # (1, 32, 128): the last step
```

</div>
<div>

<svg class="dl-diagram" viewBox="0 0 330 160" role="img" aria-label="Five LSTM steps over the words the movie was not great. Each step emits a vector; together they are output. The last one is h_n.">
  <defs>
    <marker id="l5d-head-two" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="10" y="12">output: one vector per step</text>
  <g v-for="(w, i) in ['the', 'movie', 'was', 'not', 'great']" :key="i">
    <rect :class="['dl-dg-box', i === 4 ? 'is-accent' : '']" :x="10 + i * 56" y="20" width="44" height="20" rx="3" />
    <path class="dl-dg-arrow" :d="`M${32 + i * 56} 98 V44`" marker-end="url(#l5d-head-two)" />
    <rect class="dl-dg-net" :x="10 + i * 56" y="98" width="44" height="26" rx="5" />
    <path v-if="i < 4" class="dl-dg-arrow" :d="`M${54 + i * 56} 111 H${64 + i * 56}`" marker-end="url(#l5d-head-two)" />
    <text class="dl-dg-small" :x="32 + i * 56" y="146" text-anchor="middle">{{w}}</text>
  </g>
  <text class="dl-dg-in" x="290" y="60">h_n</text>
</svg>

</div>
</div>

<div class="dl-tight mt-1">

<v-clicks>

- **Classify a review**: take `h_n[-1]`, `(32, 128)`
- **A label per word**: take `output`, `(32, 200, 128)`
- They agree, `output[:, -1]` = `h_n[-1]`, without padding

</v-clicks>

</div>

<div v-click class="mt-2 dl-callout">

Pick by the **task shape**. Pick wrong, and the shapes can still line up.

</div>

<!--
The point: nn.LSTM hands back two things, and which one you keep depends on the
task shape. Classifying a review needs one vector per review; tagging every word
needs one vector per word.

On screen: the code on the left, and on the right the same code as a picture —
five LSTM steps over review B, each with an output vector on top. `output` is all
five of them; `h_n` is the last one, drawn in the accent colour.

Click: the first two lines light up. One LSTM layer, 64 numbers in per word (the
embedding size), 128 numbers of state. batch_first=True means the batch is the
first axis, which is how our data loader hands it over.

Click 2: lines 4–5. A fake batch: 32 reviews, 200 steps, 64 numbers per step, so
(B, T, embed). The call returns output and a tuple (h_n, c_n).

Click 3: line 7. output is (32, 200, 128): the state at every one of the 200
steps, for every review. That is the row of five vectors in the picture.

Click 4: line 8. h_n is (1, 32, 128): only the last step. The leading 1 is the
number of layers (times directions); with num_layers=2 it would be 2.

Click 5: the whole block again. Ask the room which of the two they would hand to
a classifier head before the bullets answer it.

Click 6: classify a review — take h_n[-1], shape (32, 128). The [-1] picks the
last layer, so it stays correct if you stack layers later.

Click 7: a label per word — take output, (32, 200, 128), and put a head on every
step.

Click 8: the two agree: output[:, -1] equals h_n[-1], as long as nothing is
padded. Have them check it as an assertion in the lab:
torch.allclose(output[:, -1, :], h_n[-1]). It is true, and the "when nothing is
padded" caveat is the whole subject of the next two slides.

Click 9: the callout. Pick by the task shape. This points back to "Which shapes
does a sequence problem come in?": classifying a review is many to one, a tag
per word is many to many. Pick the wrong one and the shapes can still line up
after a reshape, so nothing crashes — the model just learns the wrong thing.

c_n is the cell state and you almost never touch it — except to pass it back in
when continuing a sequence, as in truncated backpropagation through time.

nn.RNN and nn.GRU return (output, h_n): one tensor, not a tuple. Only the LSTM
hands back two states, because only the LSTM has two.
-->

---
layout: default
title: Sequences in a batch are not the same length
---

# Sequences in a batch are not the same length

A batch is one rectangle. Short reviews are filled up with a reserved **pad**
token, id 0.

<div class="flex flex-col gap-1 mt-2 mx-auto" style="max-width: 600px;">
  <WordStrip :review="['a', 'brilliant', 'film', 'about', 'nothing', ...Array(3).fill('\u003cpad\u003e')]" :upto="5" :width="600" />
  <WordStrip :review="['not', 'worth', 'it', ...Array(5).fill('\u003cpad\u003e')]" :upto="3" :width="600" />
  <WordStrip :review="['the', 'movie', 'was', 'not', 'great', 'but', 'well', 'acted']" :upto="8" highlight="not" :width="600" />
  <WordStrip :review="['utterly', 'awful', ...Array(6).fill('\u003cpad\u003e')]" :upto="2" highlight="awful" :width="600" />
</div>

<div class="dl-tight mt-2">

<v-clicks>

- 18 real tokens, 14 pads: nearly half the batch is nothing
- The LSTM runs 8 steps on *utterly awful*. Six of them read padding
- So `h_n` is the state after the padding. The batch must carry its **lengths**

</v-clicks>

</div>

<!--
The point: a batch is one rectangle, but reviews have different lengths. The
gaps get filled with a pad token, and unless the model is told the real lengths,
it reads the padding as if it were words.

On screen: four reviews as rows of word tiles, padded out to 8 slots. Faint
tiles are padding. The third row is the long one: our review B with three more
words ("but well acted"). Lengths are 5, 3, 8 and 2. In the tensor each tile is
an integer id; the pad id is 0 by convention, and nn.Embedding(padding_idx=0)
keeps its vector at zero.

Click: count it. 18 real tokens out of 32 slots, 14 pads — nearly half the batch
is nothing.

Click 2: draw attention to the last row, "utterly awful". The LSTM runs all 8
steps on it: two real words, then six steps reading padding.

Click 3: so h_n is the state after six updates on a token that means nothing.
Nothing crashes; the model just gets a worse feature vector for every short
review in every batch. That is why the batch has to carry its lengths: a length
tensor is part of the batch, and the collate function has to build it.

This is the single most common reason a student's RNN scores worse than their
bag-of-words baseline.

If asked how to waste less: sorting a batch by length reduces the padding a lot.
Bucketing by length reduces it further.
-->

---
layout: default
title: Packing — tell the layer where to stop
---

# Packing — tell the layer where to stop

<div class="grid grid-cols-[1.75fr_1fr] gap-5 items-center">
<div>

```python {all|1-4|5|6-8|all}{lines:true}
from torch.nn.utils.rnn import (
    pack_padded_sequence, pad_packed_sequence)
packed = pack_padded_sequence(emb, lengths.cpu(),
    batch_first=True, enforce_sorted=False)  # sorts for you
packed_out, (h_n, c_n) = lstm(packed)       # skips pad steps
output, _ = pad_packed_sequence(packed_out, batch_first=True)
# h_n[-1]: the state after the LAST REAL token of each row
# output:  padded again, with zeros where the padding was
```

</div>
<div>

<svg class="dl-diagram" viewBox="0 0 262 172" role="img" aria-label="The four reviews sorted by length 8, 5, 3, 2 words, one column per time step 1 to 8. Real tokens are solid, padding red. The last real token of each row is highlighted. Under each step, how many reviews still have a real word: 4, 4, 3, 2, 2, 1, 1, 1.">
  <text class="dl-dg-small" x="58" y="12" text-anchor="end">step</text>
  <text v-for="t in 8" :key="`s${t}`" class="dl-dg-small" :x="74 + (t - 1) * 24" y="12" text-anchor="middle" v-text="t" />
  <g v-for="(len, r) in [8, 5, 3, 2]" :key="r">
    <text class="dl-dg-small" x="58" :y="35 + r * 24" text-anchor="end">{{len}} words</text>
    <rect v-for="t in 8" :key="t"
      :class="['dl-dg-box', ['', 'is-accent', 'is-bad'][Math.sign(t - len) + 1]]"
      :x="64 + (t - 1) * 24" :y="20 + r * 24" width="20" height="20" rx="2" />
  </g>
  <path class="dl-dg-line" d="M62 120 H256" />
  <text class="dl-dg-small" x="58" y="140" text-anchor="end">still going</text>
  <g v-for="(n, t) in [4, 4, 3, 2, 2, 1, 1, 1]" :key="`n${t}`">
    <text class="dl-dg-lab is-sm" :x="74 + t * 24" y="140" text-anchor="middle">{{n}}</text>
  </g>
  <text class="dl-dg-small" x="62" y="164">stored as batch_sizes</text>
</svg>

</div>
</div>

Packing keeps only the real tokens. The bottom row counts **how many reviews
still have a real word** at each step. Step 3 has 3: the 2-word review has ended.
So each row stops at its own length.

<div v-click class="mt-2 dl-callout">

Not an optimisation: without packing, `h_n` is the wrong vector for every padded
row.

</div>

<!--
The point: packing tells the LSTM where each review really ends, so it stops
each row at its own length. Without it, h_n is the wrong vector for every padded
row.

On screen: the code on the left. On the right, the same four reviews sorted by
length, 8, 5, 3, 2 words, with one column per time step (numbered along the
top). The accent cell in each row is the last real token — where h_n is now
read; the red cells after it are padding.

The bottom row is the part people ask about. Read it column by column: under
each step, count the rows that still have a real (not red) token in that
column.
  Steps 1 and 2: all four reviews have a word, so 4 and 4.
  Step 3: the 2-word review ("utterly awful") has ended, so 3.
  Steps 4 and 5: the 3-word review has ended too, so 2 and 2.
  Steps 6, 7 and 8: only the 8-word review is left, so 1, 1, 1.
That row, 4, 4, 3, 2, 2, 1, 1, 1, is exactly what a PackedSequence stores in
its batch_sizes field. At each step the LSTM processes only that many rows, so
it never reads a pad token. The numbers add up to 18, the real tokens in the
batch. Sorting by length is what makes the rows still going always the top
ones.

Click: lines 1–4. Import the two helpers and pack the embedded batch with its
lengths. enforce_sorted=False is the modern convenience; older code sorts the
batch by length by hand and then has to unsort the outputs. Show them the flag
exists. lengths must be on the CPU — a real error message people hit and do not
expect.

Click 2: line 5. The LSTM takes the packed batch directly and skips the pad
steps. Nothing else about the call changes.

Click 3: lines 6–8. h_n[-1] is now the state after the last real token of each
row. output comes back as a PackedSequence; pad_packed_sequence turns it into a
padded tensor again, with zeros where the padding was.

Click 4: the whole block again — five lines of code, and only one of them is
the LSTM.

Click 5: the callout. This is not an optimisation; it is a correctness fix.

For a many-to-many model you could skip packing and mask the loss instead, and
that is a legitimate choice. For many-to-one you cannot: there is nothing to
mask, the damage is already inside h_n.
-->

---
layout: default
title: The model
---

# The model

<div class="grid grid-cols-[2.1fr_1fr] gap-4 items-center">
<div>

```python {all|4-5|6-7|10|11-14|all}{lines:true}
class ReviewClassifier(nn.Module):
    def __init__(self, vocab_size, embed=64, hidden=128):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed, padding_idx=0)
        self.lstm = nn.LSTM(embed, hidden, batch_first=True)
        self.drop = nn.Dropout(0.3)
        self.head = nn.Linear(hidden, 2)          # logits

    def forward(self, ids, lengths):
        emb = self.embed(ids)                     # (B, T, 64)
        packed = pack_padded_sequence(emb, lengths.cpu(),
                     batch_first=True, enforce_sorted=False)
        _, (h_n, _) = self.lstm(packed)           # (1, B, 128)
        return self.head(self.drop(h_n[-1]))      # (B, 2)
```

</div>
<div>

<svg class="dl-diagram" style="max-height: 14rem" viewBox="0 0 200 250" role="img" aria-label="Shape strip: ids 32 by 200, embedding, 32 by 200 by 64, LSTM, 32 by 128, linear, 32 by 2.">
  <defs>
    <marker id="l5d-head-model" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <g v-for="(s, i) in [['ids', '(32, 200)', 150], ['emb', '(32, 200, 64)', 180], ['h_n[-1]', '(32, 128)', 100], ['logits', '(32, 2)', 64]]" :key="i">
    <rect :class="['dl-dg-box', i === 2 ? 'is-accent' : '']" :x="100 - s[2] / 2" :y="4 + i * 66" :width="s[2]" height="34" rx="4" />
    <text class="dl-dg-small" x="100" :y="18 + i * 66" text-anchor="middle">{{s[0]}}</text>
    <text class="dl-dg-lab is-sm" x="100" :y="33 + i * 66" text-anchor="middle">{{s[1]}}</text>
  </g>
  <g v-for="(op, i) in ['Embedding', 'LSTM, packed', 'Linear']" :key="`o${i}`">
    <path class="dl-dg-arrow" :d="`M100 ${40 + i * 66} V${66 + i * 66}`" marker-end="url(#l5d-head-model)" />
    <text class="dl-dg-small" x="108" :y="57 + i * 66">{{op}}</text>
  </g>
</svg>

</div>
</div>

<div v-click class="mt-2 dl-secondary">

Three layers. The only new line is the `pack`. `h_n[-1]` is the last layer's
final state, so it stays right with `num_layers=2`.

</div>

<!--
The point: the whole review classifier is three layers — embedding, LSTM,
linear — and the only new line compared with an MLP or CNN is the pack.

On screen: the model class on the left, and on the right a shape strip: ids
(32, 200), Embedding, emb (32, 200, 64), LSTM packed, h_n[-1] (32, 128) in the
accent colour, Linear, logits (32, 2). The 200 disappears at the LSTM. That is
where the sequence becomes a vector.

Click: lines 4–5. The embedding turns each id into 64 numbers; padding_idx=0
keeps the pad token's vector at zero. The LSTM reads 64 and keeps 128 numbers of
state, batch first.

Click 2: lines 6–7. Dropout of 0.3, and a linear head to 2 logits, positive and
negative. The dropout sits on the final state, between the recurrence and the
head — the same place as in the CNN, for the same reason.

Click 3: line 10. Read the shape comment aloud: (B, T, 64). Every shape comment
on this slide is checkable and they should check them.

Click 4: lines 11–14. Pack with the lengths, run the LSTM, keep only h_n,
(1, B, 128). Take h_n[-1], dropout, head: (B, 2).

Click 5: the whole class again; point at the shape strip and walk down it once.

Click 6: the note underneath. Three layers, and the only new line is the pack.
h_n[-1] is the last layer's final state, so the code stays right with
num_layers=2.

Dropout *inside* the recurrence needs care: dropping a different set of units
every step destroys the state. nn.LSTM's own `dropout=` argument applies between
stacked layers, not across time, and it does nothing at all with num_layers=1
(PyTorch warns about this).

No softmax, because CrossEntropyLoss applies it — the same trap as for CNNs.
-->

---
layout: default
title: Shapes, end to end
---

# Shapes, end to end

<svg class="dl-diagram mx-auto" viewBox="0 0 600 64" style="max-height: 4.2rem;" role="img" aria-label="A slab 32 by 200 by 64 becomes a flat 32 by 128 after the LSTM, then 32 by 2 after the linear layer.">
  <defs>
    <marker id="l5d-head-ledger" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <rect v-for="k in 3" :key="k" class="dl-dg-box" :x="10 + (k - 1) * 8" :y="4 + (k - 1) * 6" width="150" height="40" rx="3" />
  <text class="dl-dg-lab is-sm" x="101" y="40" text-anchor="middle">32×200×64</text>
  <path class="dl-dg-arrow" d="M182 32 H262" marker-end="url(#l5d-head-ledger)" />
  <text class="dl-dg-small" x="222" y="24" text-anchor="middle">LSTM</text>
  <rect class="dl-dg-box is-accent" x="270" y="16" width="120" height="30" rx="3" />
  <text class="dl-dg-lab is-sm" x="330" y="36" text-anchor="middle">32×128</text>
  <path class="dl-dg-arrow" d="M396 32 H466" marker-end="url(#l5d-head-ledger)" />
  <text class="dl-dg-small" x="431" y="24" text-anchor="middle">Linear</text>
  <rect class="dl-dg-box" x="474" y="16" width="70" height="30" rx="3" />
  <text class="dl-dg-lab is-sm" x="509" y="36" text-anchor="middle">32×2</text>
</svg>

<div class="dl-ledger dl-tight">

| step | shape | what it is |
| --- | --- | --- |
| `ids` | `(32, 200)` | padded token ids |
| `lengths` | `(32,)` | real lengths |
| `embed(ids)` | `(32, 200, 64)` | a vector per token |
| `lstm(packed)` → `output` | packed; unpacked `(32, ≤200, 128)` | state at every step |
| `lstm(packed)` → `h_n` | `(1, 32, 128)` | state after the last real token |
| `h_n[-1]` | `(32, 128)` | one vector per review |
| `head(…)` | `(32, 2)` | logits |

</div>

<div v-click class="mt-2 dl-callout">

Test first: push one batch of random ids through the model.

</div>

<!--
This is a shape ledger for a sequence model: write every tensor's shape down.
The strip on top is the same story in three boxes: the T axis of 200 disappears
at the LSTM.

The output row: with packed input, output is a PackedSequence, not a tensor.
pad_packed_sequence turns it back into (32, T, 128), where T is the longest
review in this batch — 200 only if some review fills the padding. This model
never uses output (it reads h_n), so the row is there to stop someone indexing
output[:, -1] and silently reading padding.

The check:
    model = ReviewClassifier(20_000)
    ids = torch.randint(1, 20_000, (32, 200))
    lengths = torch.randint(5, 201, (32,))
    print(model(ids, lengths).shape)      # torch.Size([32, 2])

Four lines, and they catch every shape mistake on this slide.

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

<svg class="dl-diagram mx-auto mt-1" viewBox="0 0 600 56" style="max-height: 3.6rem;" role="img" aria-label="Forward, loss, backward, clip, step. Clip is the one new step, between backward and step.">
  <defs>
    <marker id="l5d-head-loop" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <g v-for="(s, i) in ['forward', 'loss', 'backward', 'clip', 'step']" :key="i">
    <rect :class="['dl-dg-box', i === 3 ? 'is-accent' : '']" :x="4 + i * 120" y="4" width="96" height="30" rx="5" />
    <text class="dl-dg-lab is-sm" :x="52 + i * 120" y="24" text-anchor="middle">{{s}}</text>
    <path v-if="i < 4" class="dl-dg-arrow" :d="`M${102 + i * 120} 19 H${122 + i * 120}`" marker-end="url(#l5d-head-loop)" />
  </g>
  <text class="dl-dg-small is-good" x="412" y="50" text-anchor="middle">gradient length ≤ 1.0</text>
</svg>

<div v-click class="mt-1 dl-secondary">

The MLP's loop, the CNN's loop and this one differ by one line and one model
class.

</div>

<!--
The point: the training loop is the same one used for MLPs and CNNs. A new
architecture is a new nn.Module, plus one line: gradient clipping.

On screen: the loop, and under it a strip — forward, loss, backward, clip, step
— with clip in the accent colour and "gradient length ≤ 1.0" under it.

Click: lines 1–3. The model, CrossEntropyLoss, Adam with learning rate 1e-3.
Nothing here is specific to sequences.

Click 2: lines 6–7. model.train() and the loader. The loader now yields three
things: ids, lengths and labels. `lengths` stays on the CPU deliberately —
pack_padded_sequence requires it, and the model does the .cpu() itself, so this
loop does not have to care.

Click 3: lines 8–11. Move ids and labels to the device, forward with the
lengths, compute the loss, zero the gradients. Familiar.

Click 4: lines 12–14. backward, then the clip, then step. The clip line is the
only addition ("Gradient clipping, in one line" in section 03), and it is the one
that keeps a recurrent run from dying on its first long batch. It sits between
backward() and step(), which the strip shows: it rescales the whole gradient so
its length is at most 1.0, after the gradients exist and before the weights
move.

Click 5: the whole loop again. Ask: which line would you delete to make this a
CNN loop? Only the clip, and the lengths argument.

Click 6: the note. The MLP's loop, the CNN's loop and this one differ by one line
and one model class.
-->

---
layout: default
title: Four bugs, and what each one looks like
---

# Four bugs, and what each one looks like

<div class="grid grid-cols-[1.25fr_1fr] gap-6 items-center">
<div class="dl-tight">

<v-clicks>

- **`batch_first` left out**: the batch is read as time
- **No packing**: `h_n` is read after the padding
- **Loss on padding**, with a label per word: fix with `ignore_index=0`
- **No clipping**: one `nan` loss, then every weight is `nan`

</v-clicks>

</div>
<div>

<svg class="dl-diagram" viewBox="-14 0 294 170" role="img" aria-label="A sketch of three loss curves against training steps. The correct model goes lowest. A silent bug flattens out higher. The run without clipping stops at nan.">
  <path class="dl-dg-line is-muted" d="M24 10 V146 H272" style="stroke-width: 1.2;" />
  <text class="dl-dg-small" x="18" y="16" text-anchor="end">loss</text>
  <text class="dl-dg-small" x="272" y="162" text-anchor="end">steps</text>
  <path class="dl-dg-grad is-good" d="M26 24 C 70 90, 120 128, 268 136" style="stroke-width: 2.4;" />
  <text class="dl-dg-small is-good" x="266" y="128" text-anchor="end">correct</text>
  <path class="dl-dg-line is-muted" d="M26 24 C 70 66, 120 88, 268 92" style="stroke-width: 2.4;" />
  <text class="dl-dg-small" x="266" y="84" text-anchor="end">bug</text>
  <path class="dl-dg-grad is-bad" d="M26 24 C 50 50, 70 62, 112 66" style="stroke-width: 2.4; stroke-dasharray: none;" />
  <text class="dl-dg-small is-bad" x="120" y="62">nan</text>
</svg>

</div>
</div>

<div v-click class="mt-4 dl-callout">

Three of the four give **no error message**: the loss still falls, just not far
enough.

</div>

<!--
The point: this slide is the lab's FAQ, written in advance. Four bugs everyone
makes, and three of them give no error message at all.

On screen: the bullets on the left reveal one bug per click. The plot on the
right is a sketch, not a measured run: the green curve is the correct model and
goes lowest; the grey "bug" curve is what any of the three silent bugs looks
like — it trains, it flattens out, just higher; the red curve is the run without
clipping, which stops at nan.

Click: batch_first left out. The LSTM defaults to (T, B, features), so the model
reads 32 reviews as 32 time steps and still trains.

Click 2: no packing. h_n is the state after the padding, so every short review
gets a worse feature vector.

Click 3: loss on padding. The slide says when: a label per word (many to many),
as in tagging or next-word prediction. Our review classifier has one label per
review, so its labels are never padding — this bug waits for the generation
model. nn.CrossEntropyLoss(ignore_index=0) is the one-argument fix, and it is
why the pad id is conventionally 0 and conventionally reserved. Without it the
model spends most of its capacity predicting the pad token.

Click 4: no clipping. Point at the red curve. Once a nan reaches the weights,
nothing recovers — every later forward pass is nan. If a run goes to nan,
restart it; do not wait.

Click 5: the callout. Three of the four give no error message: the loss still
falls, just not far enough. The habit that catches all three silent ones: print
your shapes, and check h_n against lengths.
-->

---
layout: section
index: "06"
---

# Generating, and the wall

<div style="position: absolute; right: 4.5rem; top: 50%; transform: translateY(-50%);"><RnnGlyph kind="generate" :size="190" /></div>

<!--
Section 06. The first slide closes the loop with the window slide in section 00;
the rest is the encoder–decoder, attention in its 2014 form, and the one problem attention does
not fix. Compressible after the generation slide if time is short: show
"One sequence in, another out", "The other wall" and the recap.

The glyph: a cell writes one tile, and the tile curls back in as the next input.
-->

---
layout: default
title: Generating one step at a time
---

# Generating one step at a time

One next-word model, fed in two different ways.

<svg viewBox="0 0 660 214" class="dl-diagram" role="img" aria-label="Left, training: the true words the, movie, was, not go in at four steps, and at each step the prediction is compared with the true next word movie, was, not, great, giving four losses. Right, generating: only the goes in; each predicted word is fed back in as the next input, one step at a time">
  <defs>
    <marker id="l5f-gen-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-lab is-sm" x="10" y="14">Training: the true review is known</text>
  <g v-for="(w, k) in ['the', 'movie', 'was', 'not']" :key="`t${k}`">
    <text class="dl-dg-small is-good" :x="40 + k * 74" y="38" text-anchor="middle">loss</text>
    <rect class="dl-dg-box" :x="12 + k * 74" y="46" width="56" height="24" rx="3" />
    <text class="dl-dg-lab is-sm" :x="40 + k * 74" y="63" text-anchor="middle" v-text="['movie', 'was', 'not', 'great'][k]" />
    <path class="dl-dg-arrow" marker-end="url(#l5f-gen-head)" :d="`M${40 + k * 74} 98 V74`" />
    <rect class="dl-dg-net" :x="16 + k * 74" y="100" width="48" height="30" rx="5" />
    <text class="dl-dg-in" :x="40 + k * 74" y="120" text-anchor="middle">RNN</text>
    <path class="dl-dg-arrow" marker-end="url(#l5f-gen-head)" :d="`M${40 + k * 74} 160 V134`" />
    <rect class="dl-dg-box is-accent" :x="12 + k * 74" y="162" width="56" height="24" rx="3" />
    <text class="dl-dg-lab is-sm" :x="40 + k * 74" y="179" text-anchor="middle" v-text="w" />
  </g>
  <path v-for="k in 3" :key="`th${k}`" class="dl-dg-line" marker-end="url(#l5f-gen-head)" :d="`M${64 + (k - 1) * 74} 115 H${86 + (k - 1) * 74}`" />
  <text class="dl-dg-small" x="10" y="206">target: the true next word · input: the true word</text>
  <path class="dl-dg-split" d="M322 6 V206" />
  <g v-click="1">
    <text class="dl-dg-lab is-sm" x="336" y="14">Generating: no true review exists</text>
    <g v-for="k in 4" :key="`g${k}`">
      <rect class="dl-dg-box" :x="334 + (k - 1) * 82" y="46" width="60" height="24" rx="3" />
      <text class="dl-dg-lab is-sm" :x="364 + (k - 1) * 82" y="63" text-anchor="middle" v-text="['movie', 'was', 'not', 'great'][k - 1]" />
      <path class="dl-dg-arrow" marker-end="url(#l5f-gen-head)" :d="`M${364 + (k - 1) * 82} 98 V74`" />
      <rect class="dl-dg-net" :x="340 + (k - 1) * 82" y="100" width="48" height="30" rx="5" />
      <text class="dl-dg-in" :x="364 + (k - 1) * 82" y="120" text-anchor="middle">RNN</text>
      <path class="dl-dg-arrow" marker-end="url(#l5f-gen-head)" :d="`M${364 + (k - 1) * 82} 160 V134`" />
      <rect :class="k === 1 ? 'dl-dg-box is-accent' : 'dl-dg-box'" :x="334 + (k - 1) * 82" y="162" width="60" height="24" rx="3" />
      <text class="dl-dg-lab is-sm" :x="364 + (k - 1) * 82" y="179" text-anchor="middle" v-text="['the', 'movie', 'was', 'not'][k - 1]" />
    </g>
    <path v-for="k in 3" :key="`gh${k}`" class="dl-dg-line" marker-end="url(#l5f-gen-head)" :d="`M${388 + (k - 1) * 82} 115 H${419 + (k - 1) * 82}`" />
    <path v-for="k in 3" :key="`gb${k}`" class="dl-dg-grad is-good" marker-end="url(#l5f-gen-head)" :d="`M${396 + (k - 1) * 82} 58 Q${412 + (k - 1) * 82} 58 ${412 + (k - 1) * 82} 120 Q${412 + (k - 1) * 82} 174 ${420 + (k - 1) * 82} 174`" />
    <text class="dl-dg-small" x="336" y="206">input: the model's own last guess</text>
  </g>
</svg>

<div class="dl-tight">

<v-clicks>

- **Training** feeds the *true* previous word (**teacher forcing**). All inputs are known, so one forward call covers the review.
- **Generating** feeds its *own* last guess. One wrong word changes every later input (**exposure bias**).

</v-clicks>

</div>

<!--
The point: an RNN that predicts the next word is used in two different ways.
At training time it is fed the true review; at generation time it is fed its
own guesses. This closes the loop with the window slide in section 00: predict
the next word from the ones before it, with the state in place of the window.

On screen, left panel (training). Read it bottom to top. The bottom row is the
input at each step: the true words of review B, "the movie was not". The middle
row is the same RNN cell at four steps, with the state passed along to the
right. The top row is the target: the true next word at each step, "movie was
not great". The model's prediction at each step is compared with that target,
which gives one cross-entropy loss per step (the "loss" labels). The four
losses are averaged into the loss for the review.

Click: the right panel (generating). Now there is no true review; we want the
model to write one. We give it only the first word, "the" (the accent tile). It
predicts a next word, here "movie". The dashed curve shows that guess fed back
in as the input of the next step. Then it predicts "was", feeds it back, and so
on. Each step must wait for the guess of the step before, so generation runs
one word at a time.

Click 2: training uses the true previous word as input. This has a name,
teacher forcing: like a teacher who corrects you after every word, so a mistake
at step 2 does not affect the input of step 3. Because every input is known
before we start, nn.LSTM processes the whole review in one forward call and
computes the loss for every step at once.

Click 3: generating uses the model's own last guess. The model never saw its
own mistakes during training, so one wrong word puts it in a situation it was
not trained on, and the error carries into every later step. That mismatch
between training and generating is called exposure bias, and it is why long
generated text drifts. Scheduled sampling, which mixes in the model's own
predictions during training with rising probability, is the classic fix.

How the next word is chosen, if the room asks: the output at each step is a
softmax over the vocabulary. Always taking the most likely word (argmax) is
repetitive; sampling from softmax(logits / temperature) is the usual knob.
-->

---
layout: interactive
heading: One sequence in, another out
title: One sequence in, another out
aside-width: 21rem
---

<SeqToSeqFlow />

::aside::

Lengths and word order differ, and nothing is written until the
whole source is read.

<v-clicks>

- The **encoder**'s final state, the **context vector**, is all the **decoder** knows
- Drag the slider: 2 words or 8, still 256 numbers

</v-clicks>

<div v-click class="dl-callout">

Eight words into 256 numbers is generous. Forty into the same 256 is the
bottleneck.

</div>

<!--
The point: an encoder–decoder squeezes the whole source sentence into one
context vector of fixed size. That size does not grow with the sentence, and
that is the bottleneck.

On screen: the widget. Bottom row: the encoder, an RNN that reads the German
source sentence. Top row: the decoder, a second RNN that writes the English
target one word at a time, exactly as on the previous slide — but starting from
the encoder's final state instead of from zero. In the middle, the context box:
256 numbers. The slider sets how many words are in the source, from 2 to 8.

Before the clicks: read the aside's first line. Lengths and word order differ
between the languages, and nothing is written until the whole source is read.

Click: the encoder's final state, the context vector, is all the decoder knows
about the source.

Click 2: drag the slider from 2 to 8 slowly and say the number out loud each
time: still 256. That is the whole slide. The readout also says how many more
updates the first word has to survive before the encoder is done.

Click 3: the callout. Eight words into 256 numbers is generous. Forty into the
same 256 is the bottleneck.

The second half of the argument, which the picture cannot show: the first word of
the source has to survive every later update of the encoder state before the
decoder sees anything. Long sources lose their beginnings — the vanishing note
from section 03 again.

Cho et al. measured it in 2014 — translation quality (BLEU score) falls off
sharply past about 20 source words. The fix was published the same year.
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
- The alignment is learned, not given

</v-clicks>

<div v-click class="mt-2 dl-callout">

No fixed summary to overflow: the decoder looks words up instead of remembering
them.

</div>

<!--
The point: attention drops the single fixed summary. The decoder keeps every
encoder state and builds a fresh context for each word it writes.

On screen: the same widget in attention mode, on "Ich habe ein Buch gelesen" →
"I have read a book". Each press of Next word writes one English word; the
weights over the five German encoder states appear above them, and the readout
says which German word gets most of the weight.

Press Next word once: writing "I", the weight is 0.90 on "Ich". Then press again
for "have" before the first click.

Click: "have" — the weight sits on "habe", 0.85.

Press Next word to reach "read".

Click 2: "read" — 0.85 of the weight on "gelesen", the last German word. Stop
here. The German verb is at the end of the clause and the English one is in the
middle; the attention lines cross, and the crossing is the evidence that the
model is not just copying word order.

Click 3: the alignment is learned, not given. Nobody told the model that "read"
goes with "gelesen". Press on through "a" (0.88 on "ein") and "book" (0.86 on
"Buch") if there is time.

Click 4: the callout. No fixed summary to overflow: the decoder looks words up
instead of remembering them.

This is Bahdanau, Cho & Bengio, 2014 — attention added to a recurrent
encoder–decoder. The recurrence is still there: the encoder is an RNN and the
decoder is an RNN. Attention only changes what the decoder reads at each step.

Do not spend the mathematics here — the next slide is three lines.
-->

---
layout: default
title: Attention, in three lines
---

# Attention, in three lines

A new context at every output step: a weighted average of encoder states.

<div class="grid grid-cols-[1.1fr_1fr] gap-6 items-center">
<div class="dl-math-xs">

<div v-click class="grid grid-cols-[1fr_9rem] items-center gap-2">
<div>

$$ e_{t,i} = a(\mathbf{s}_{t-1},\; \mathbf{h}_i) $$

</div>
<div class="dl-secondary">

Score each $\mathbf{h}_i$

</div>
</div>
<div v-click class="grid grid-cols-[1fr_9rem] items-center gap-2">
<div>

$$ \alpha_{t,i} = \frac{\exp(e_{t,i})}{\sum_j \exp(e_{t,j})} $$

</div>
<div class="dl-secondary">

Softmax: sums to 1

</div>
</div>
<div v-click class="grid grid-cols-[1fr_9rem] items-center gap-2">
<div>

$$ \mathbf{c}_t = \sum_i \alpha_{t,i}\,\mathbf{h}_i $$

</div>
<div class="dl-secondary">

Weighted sum

</div>
</div>

</div>
<div>

<svg class="dl-diagram" style="max-height: 10rem" viewBox="0 0 290 196" role="img" aria-label="Three stages. Score: encoder states h1, h2, h3 get scores 1.1, 0, 0. Softmax: bars of height 0.6, 0.2, 0.2. Sum: the three feed one context vector with line widths proportional to the weights.">
  <text class="dl-dg-small" x="0" y="22">score</text>
  <text class="dl-dg-small" x="0" y="96">softmax</text>
  <text class="dl-dg-small" x="0" y="176">sum</text>
  <g v-for="(v, i) in [[1.1, 0.6, 'h₁'], [0, 0.2, 'h₂'], [0, 0.2, 'h₃']]" :key="i">
    <rect class="dl-dg-box" :x="80 + i * 70" y="6" width="56" height="24" rx="4" />
    <text class="dl-dg-lab is-sm" :x="108 + i * 70" y="23" text-anchor="middle">{{v[2]}}</text>
    <text class="dl-dg-small" :x="108 + i * 70" y="46" text-anchor="middle">e = {{v[0]}}</text>
    <rect class="dl-dg-bar is-q" :x="94 + i * 70" :y="124 - v[1] * 100" width="28" :height="v[1] * 100" />
    <text class="dl-dg-small" :x="108 + i * 70" :y="118 - v[1] * 100" text-anchor="middle">{{v[1]}}</text>
    <line :x1="108 + i * 70" y1="126" x2="178" y2="160" class="dl-dg-arrow" :style="{ strokeWidth: v[1] * 14 }" />
  </g>
  <rect class="dl-dg-box is-accent" x="130" y="160" width="96" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="178" y="178" text-anchor="middle">c = [0.6, 0.6]</text>
</svg>

<div class="mt-1">
  <Citation source="Bahdanau, Cho & Bengio, Neural Machine Translation by Jointly Learning to Align and Translate (2014)" url="https://arxiv.org/abs/1409.0473" />
</div>

</div>
</div>

<div v-click class="dl-callout">

All three steps are differentiable, so the alignment is learned with every other
weight.

</div>


<!--
The point: attention is three lines of maths — score, softmax, weighted sum —
and all three are differentiable, so the alignment is learned like any other
weight.

On screen: the heading says it in words — a new context at every output step, a
weighted average of encoder states. The equations reveal one at a time on the
left. The picture on the right is the worked example from the next slide, drawn
as the three stages: scores 1.1, 0, 0; softmax weights 0.6, 0.2, 0.2 as bars;
the three states feeding one context vector [0.6, 0.6], with line widths
proportional to the weights.

Click: the score. "e t i equals a of s t minus 1 and h i": for output step t,
score each encoder state h_i against the decoder's state before writing,
s_{t-1}. The score function a is a small MLP (multi-layer perceptron) in the 2014
paper; later papers often use a plain dot product, which is what the worked
example on the next slide does.

Click 2: the softmax. "alpha t i is e to the score, divided by the sum of e to
every score." The weights are positive and add up to 1 across the source words.
In the picture: 1.1, 0, 0 become 0.6, 0.2, 0.2.

Click 3: the weighted sum. "c t is the sum over i of alpha t i times h i." The
context for this step is mostly h_1, a little of the others.

Click 4: the callout — the one thing to point at. Everything on this slide is
differentiable, so the alignment is learned by the same gradient descent as the
rest. Nobody supplies alignments.

Three lines, then stop. Do not go further than this today. "The other wall" names
the problem attention does not fix.
-->

---
layout: default
title: "Reading the equation: attention"
---

# Reading the equation: attention

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $t,\ i,\ j$ | indices | $t$: output step; $i$, $j$: source positions | $i = 1, 2, 3$ |
| $\mathbf{h}_i$ | encoder state | after source word $i$ | $[1, 0]$ |
| $\mathbf{s}_{t-1}$ | decoder state | before writing word $t$ | $[1.1, 0]$ |
| $a(\cdot, \cdot)$ | score function | learned network, or dot product | dot |
| $e_{t,i}$ | score | how well word $i$ fits step $t$ | 1.1 |
| $\exp,\ \sum_j$ | softmax | make positive, divide by the total | |
| $\alpha_{t,i}$ | attention weight | share on word $i$; sum to 1 | 0.6 |
| $\mathbf{c}_t$ | context vector | weighted sum of the $\mathbf{h}_i$ | $[0.6, 0.6]$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" role="img" aria-label="Three encoder states feed one context vector; the line from the first is thickest, weight 0.6, the other two have weight 0.2" style="width: 100%; height: auto; font-family: inherit;">
  <rect x="100" y="12" width="100" height="32" rx="6" fill="var(--dl-accent-soft)" stroke="var(--dl-accent)" stroke-width="1.5" />
  <text x="150" y="33" text-anchor="middle" style="font-size: 13px; fill: var(--dl-heading)">c = [0.6, 0.6]</text>
  <line x1="50" y1="102" x2="130" y2="46" stroke="var(--dl-accent)" stroke-width="9" />
  <line x1="150" y1="102" x2="150" y2="46" stroke="var(--dl-accent)" stroke-width="3" />
  <line x1="250" y1="102" x2="170" y2="46" stroke="var(--dl-accent)" stroke-width="3" />
  <text x="72" y="70" text-anchor="end" style="font-size: 12px; fill: var(--dl-body)">0.6</text>
  <text x="158" y="78" style="font-size: 12px; fill: var(--dl-body)">0.2</text>
  <text x="228" y="70" style="font-size: 12px; fill: var(--dl-body)">0.2</text>
  <rect x="14" y="104" width="72" height="30" rx="6" fill="var(--dl-surface)" stroke="var(--dl-border)" stroke-width="1.5" />
  <text x="50" y="124" text-anchor="middle" style="font-size: 12px; fill: var(--dl-body)">h₁ = [1, 0]</text>
  <rect x="114" y="104" width="72" height="30" rx="6" fill="var(--dl-surface)" stroke="var(--dl-border)" stroke-width="1.5" />
  <text x="150" y="124" text-anchor="middle" style="font-size: 12px; fill: var(--dl-body)">h₂ = [0, 1]</text>
  <rect x="214" y="104" width="72" height="30" rx="6" fill="var(--dl-surface)" stroke="var(--dl-border)" stroke-width="1.5" />
  <text x="250" y="124" text-anchor="middle" style="font-size: 12px; fill: var(--dl-body)">h₃ = [0, 2]</text>
</svg>

<div v-click class="dl-callout">

Scores $\mathbf{s}_{t-1} \cdot \mathbf{h}_i$: $e = 1.1,\ 0,\ 0$.

$e^{1.1} \approx 3$, so

$\alpha = \tfrac{3}{5}, \tfrac{1}{5}, \tfrac{1}{5} = 0.6, 0.2, 0.2$

$\mathbf{c}_t = 0.6\,[1, 0] + 0.2\,[0, 1] + 0.2\,[0, 2] = [0.6, 0.6]$

</div>

</div>
</div>

<!--
Three source words, two-number states, so it fits on paper. The decoder state
s_{t-1} = [1.1, 0] points the same way as h_1, so h_1 gets the high score.

Score: dot products s . h_i = 1.1, 0, 0.
Softmax: exp gives 3.0, 1, 1 (e^1.1 = 3.004); total 5; weights 0.6, 0.2, 0.2.
Weighted sum: 0.6 [1, 0] + 0.2 [0, 1] + 0.2 [0, 2] = [0.6, 0.6].
(Exactly: 0.6003, 0.1998, 0.1998, and c = [0.600, 0.600].)

Connect it to the widget two slides back: writing "read", the weight on
"gelesen" was 0.85. That number is one alpha_{t,i}, computed exactly like this.

Two clashes of letters to name out loud. c_t here is the context vector, not the
LSTM's cell state — the 2014 paper and the LSTM paper both chose c. And s is the
decoder's hidden state; it is called s only so it is not confused with the
encoder's h.

The index j only appears inside the sum in the softmax: it runs over all source
positions, so the denominator is the same for every i. That is why the weights
add up to 1.
-->

---
layout: default
title: The other wall — and this one attention does not fix
---

# The other wall — and this one attention does not fix

$\mathbf{h}_t$ needs $\mathbf{h}_{t-1}$, so the steps **cannot** run in parallel.

<svg class="dl-diagram mx-auto mt-2" viewBox="0 0 600 150" style="max-height: 9.5rem;" role="img" aria-label="Against clock time: the RNN computes one step per tick, five ticks for five words. A CNN or an attention sum computes all five positions in the first tick.">
  <defs>
    <marker id="l5d-head-wall" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <text class="dl-dg-lab is-sm" x="0" y="34">RNN</text>
  <g v-for="i in 5" :key="`r${i}`">
    <rect class="dl-dg-net" :x="130 + (i - 1) * 94" y="16" width="56" height="28" rx="5" />
    <text class="dl-dg-small" :x="158 + (i - 1) * 94" y="34" text-anchor="middle">h{{i}}</text>
    <path v-if="i < 5" class="dl-dg-arrow" :d="`M${186 + (i - 1) * 94} 30 H${222 + (i - 1) * 94}`" marker-end="url(#l5d-head-wall)" />
  </g>
  <text class="dl-dg-lab is-sm" x="0" y="80">CNN, attention</text>
  <g v-for="i in 5" :key="`p${i}`">
    <rect class="dl-dg-box is-accent" :x="130 + (i - 1) * 5" :y="58 + (i - 1) * 5" width="56" height="28" rx="5" />
  </g>
  <text class="dl-dg-small" x="222" y="84">all at once</text>
  <path class="dl-dg-line is-muted" d="M130 124 H590" />
  <g v-for="i in 5" :key="`t${i}`">
    <text class="dl-dg-small" :x="158 + (i - 1) * 94" y="142" text-anchor="middle">tick {{i}}</text>
  </g>
</svg>

<div class="dl-tight mt-2">

<v-clicks>

- 200 tokens: 200 matrix multiplies, one after another
- The batch runs in parallel. Time cannot
- More hardware does not shorten the chain

</v-clicks>

</div>

<div v-click class="mt-2 dl-callout">

Attention fixed the bottleneck. But the encoder and decoder are still RNNs: one
step at a time.

</div>

<!--
The point: there is a second wall, and attention does not fix it. h_t needs
h_{t-1}, so the steps of a recurrent network cannot run in parallel. Spend two
minutes; this slide explains why recurrent models were set aside.

On screen: against clock time. The top row is the RNN: one state per tick, h1 to
h5, five ticks for five words, because h2 needs h1. The bottom row is a
convolution, or an attention weighted sum on its own: every position computed in
the first tick — the stacked boxes, "all at once".

Click: 200 tokens means 200 matrix multiplies, one after another.

Click 2: the batch runs in parallel — 32 reviews at once is fine. Time cannot:
step 7 of every review waits for step 6.

Click 3: more hardware does not shorten the chain. A bigger GPU makes each step
faster, not the number of steps smaller.

Click 4: the callout. Attention fixed the bottleneck, but the encoder and decoder
are still RNNs: one step at a time.

Both walls matter, and they are different: the bottleneck is about what the model
can represent, and attention fixed it in 2014. Parallelism is about what a GPU can
train, and it is the reason recurrent models were abandoned rather than improved.
Scale needed parallelism, and recurrence cannot provide it.

The 2017 paper that removed the recurrence and kept only the attention is called
"Attention Is All You Need". This wall is why that paper matters. Name the wall
and stop: every step waits for the one before.

If someone asks what recurrent models are still good for: very long or streaming
sequences, small on-device models, and the state-space revival — Mamba and
similar models are recurrent networks with a computation that can run in
parallel during training.
-->

---
layout: default
title: Where we got to
---

# Where we got to

<div class="grid grid-cols-4 gap-x-4 gap-y-3 mt-2">
<div v-click class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="sequence" :size="56" />
  <span class="dl-secondary">Order matters: carry one state forward</span>
</div>
<div v-click class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="loop" :size="56" />
  <span class="dl-secondary">The same weights at every step</span>
</div>
<div v-click class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="fade" :size="56" />
  <span class="dl-secondary">The gradient fades: 0.8²⁰ = 0.012</span>
</div>
<div v-click class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="gate" :size="56" />
  <span class="dl-secondary">Gates keep an additive path: 0.99²⁰ = 0.82</span>
</div>
<div v-click class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="map" :size="56" />
  <span class="dl-secondary">Words become learned vectors</span>
</div>
<div v-click class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="shape" :size="56" />
  <span class="dl-secondary">Batch first, pack, clip</span>
</div>
<div v-click class="flex flex-col items-center text-center gap-1">
  <RnnGlyph kind="generate" :size="56" />
  <span class="dl-secondary">Feed outputs back in; attend to the source</span>
</div>
</div>

<div v-click class="mt-4 dl-callout">

Two walls. A fixed-size summary: attention fixes it. Time that cannot run in
parallel: still open. Each step waits for the last.

</div>

<!--
One glyph per section, in the order of the lecture. Point at each one and ask the
room for its sentence before you click it in.

Sequence: order matters and lengths vary, so keep one state and carry it forward.
Loop: one cell, its weights shared across every step.
Fade: the gradient back to "not" 20 steps away is scaled by 0.8^20 = 0.012.
Gate: the LSTM's forget gate of 0.99 keeps 0.99^20 = 0.82 of it.
Map: the 2-number word vectors were a toy; real ones are learned, 64 numbers or
more.
Shape: batch_first=True, pack the padded batch, clip the gradient.
Generate: feed the output back in to write text; let the decoder look back at
every encoder state with attention.

The last callout names both walls. The first is fixed; the second, steps that
must run one after another, is still open at the end of today.
-->

---
layout: default
title: Reading, and the lab
---

# Reading, and the lab

<div class="grid grid-cols-3 gap-4 mt-1">
<div v-click>
  <LinkCard
    href="https://colah.github.io/posts/2015-08-Understanding-LSTMs/"
    title="Understanding LSTMs"
    blurb="Olah, 2015. The clearest explanation of the gates. Read it once before the lab."
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
    blurb="The shapes, the two bias vectors, and a GRU gate written the other way round."
    icon="💻"
  />
</div>
</div>

<div v-click class="grid grid-cols-[1fr_1.1fr] gap-6 mt-2 items-center">
<div>

**In the lab.** Train the review classifier. Then break it on purpose, one change
at a time, and report what each change costs. That report is the graded part.

</div>
<div>

<svg class="dl-diagram" viewBox="0 0 300 104" role="img" aria-label="Three runs, each with one thing removed: batch_first, packing, clipping. Each run's accuracy is a question mark to measure.">
  <defs>
    <marker id="l5d-head-lab" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" class="dl-dg-head" />
    </marker>
  </defs>
  <g v-for="(s, i) in ['batch_first', 'packing', 'clipping']" :key="i">
    <rect class="dl-dg-box is-bad" x="4" :y="4 + i * 34" width="130" height="26" rx="4" />
    <text class="dl-dg-lab is-sm" x="69" :y="22 + i * 34" text-anchor="middle">no {{s}}</text>
    <path class="dl-dg-arrow" :d="`M138 ${17 + i * 34} H180`" marker-end="url(#l5d-head-lab)" />
    <text class="dl-dg-small" x="188" :y="22 + i * 34">accuracy: ?</text>
  </g>
</svg>

</div>
</div>

<!--
The point: three things to read, and the lab — where the bugs from this lecture
get made on purpose.

On screen: three link cards, then the lab description with a small picture on
the right: three runs, each with one thing removed — no batch_first, no packing,
no clipping — and each run's accuracy a question mark to measure.

Click: Olah, "Understanding LSTMs" (2015). The clearest explanation of the
gates; read it once before the lab.

Click 2: Karpathy, "The Unreasonable Effectiveness of RNNs" (2015). A
character-level LSTM writing Shakespeare, C code and LaTeX — the generation
slide, at scale.

Click 3: the nn.LSTM documentation. Worth reading for the shapes, the two bias
vectors, and the GRU gate written the other way round.

Click 4: the lab. Train the review classifier, then break it on purpose, one
change at a time, and report what each change costs. That report is the graded
part. The deliberate-breakage exercise is the point. A student who has watched
batch_first quietly cost them accuracy never forgets it, and no amount of
saying it from the front achieves that.

The three runs on the right are three of the bugs from "Four bugs, and what each
one looks like": two silent ones, and clipping, the loud one. Each run changes
exactly one thing against a working baseline.

Practicalities — dataset, deadline, what to hand in — belong on the course page.
-->

---
layout: end
email: vajira@simula.no
---

# To be continued…

<div class="mx-auto" style="width: 460px;">
  <WordStrip review="B" state verdict highlight="not" :width="460" />
</div>

<!--
The running example, one last time: "the movie was not great", the not-flag
switching on at "not", the sentiment going negative at "great", and P(positive)
= 0.22. Two numbers of state carried that across the review.

Leave time for questions. A likely one: "if attention is so good, why keep the
RNN at all?" — answer it with the second wall: the attention still sits inside
an RNN, so every step still waits for the one before.
-->
