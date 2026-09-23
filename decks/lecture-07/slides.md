---
theme: dl2026
addons:
  - dl2026
title: Generative Models and GANs
info: PGR207 Deep Learning 2026 — Lecture 07
author: Vajira Thambawita
routerMode: hash
transition: slide-left
mdc: true
themeConfig:
  courseCode: PGR207
  lecture: "07"
  lectureTitle: Generative Models and GANs
layout: title
courseCode: PGR207
lecture: "07"
email: vajira@simula.no
---

# Generative Models and GANs

Everything so far took an image and said something about it. Today the model has
to **make** the image.

<div class="dl-side-glyph dl-pixrow">
  <PixelImage pattern="noise" :seed="11" :size="84" label="noise" />
  <span class="dl-op is-accent">→</span>
  <PixelImage pattern="noise" :seed="11" :noise="0.55" :size="84" label="…" />
  <span class="dl-op is-accent">→</span>
  <PixelImage pattern="smiley" :size="84" tone="accent" label="a new image" />
</div>

<!--
One session. The arc: a CNN from weeks 4–5 turns an image into a label. Today we
run that arrow the other way — a handful of random numbers in, a whole image out
— and the whole story is which loss you can actually compute to train it.

Prerequisites, deliberately: CNNs (convolution, stride, BatchNorm), binary
cross-entropy with a sigmoid, MSE, Adam, and PyTorch training loops. Nothing
in this deck depends on RNNs, LSTMs, attention or transformers. Where a modern
system happens to use a transformer, the slide names it as "a different
architecture" and says the idea does not depend on it.

Section 03 is the lecture. A room that leaves able to compute the optimal
discriminator on three bins, and to say what a trained discriminator is actually
measuring, has the transferable idea. Sections 01 and 02 are the compressible
ones if you are running late — say the autoencoder's punchline and move on.

The running example is three modes. It shows up as three bars when we need a
distribution and as three blobs when we need a picture, and it is the same
example both times. The tiny pixel pictures (smiley, heart, star …) are the
other running device: whenever a slide talks about "an image", it shows one.

Say at the start that this lecture is the *how*. Next week is GAN variants,
applications and the practical work.
-->

---
layout: interactive
heading: Where we are
title: Where we are
aside-width: 15rem
---

<SyllabusTimeline :current-week="9" />

::aside::

Today needs **one** thing from earlier: the **CNN** of weeks 4–5.

<div class="mt-3 flex justify-center">
  <FamilyGlyph kind="cnn" :size="96" />
</div>

It turned an image into a label. Today we run that arrow **backwards**.

<!--
Say it plainly: the only earlier block this lecture builds on is the CNN one —
convolutions, strides, BatchNorm, BCE, and the PyTorch loop. If the room has not
got to (or not yet absorbed) recurrent networks and transformers, nothing here
will trip them up; none of it is used.

The glyph in the aside is the section-00 emblem: the top arrow is the classifier
they already built, the bottom one is today. Every section in this deck has its
own emblem and it comes back on that section's slides — point that out once.

Next week is the variants and the applications, and the lab work sits there too.
-->

---
layout: section
index: "00"
---

# From recognising to creating

<div class="dl-side-glyph"><FamilyGlyph kind="cnn" :size="190" /></div>

---
layout: default
title: What a CNN already does
---

# What a CNN already does

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 250" class="dl-diagram" role="img" aria-label="A CNN maps an image to three class scores; a generator would map a few numbers back to an image">
  <defs>
    <marker id="cnn-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="8" y="14">weeks 4–5 — recognise</text>
  <PixelImage in-svg :x="8" :y="26" :size="72" pattern="smiley" />
  <path class="dl-dg-arrow" marker-end="url(#cnn-arrow)" d="M86 62 H118" />
  <polygon class="dl-dg-net is-critic" points="124,24 290,46 290,78 124,100" />
  <text class="dl-dg-in is-critic" x="206" y="67" text-anchor="middle">CNN</text>
  <path class="dl-dg-arrow" marker-end="url(#cnn-arrow)" d="M294 62 H326" />
  <rect class="dl-dg-bar" x="336" y="36" width="150" height="14" rx="3" />
  <rect class="dl-dg-bar" x="336" y="56" width="10" height="14" rx="3" />
  <rect class="dl-dg-bar" x="336" y="76" width="6" height="14" rx="3" />
  <text class="dl-dg-small" x="494" y="47">smiley 0.94</text>
  <text class="dl-dg-small" x="494" y="67">heart 0.04</text>
  <text class="dl-dg-small" x="494" y="87">star 0.02</text>
  <text class="dl-dg-small" x="336" y="112">432 numbers in → 3 out</text>
  <g v-click>
    <line class="dl-dg-split" x1="8" y1="128" x2="652" y2="128" />
    <text class="dl-dg-small is-good" x="8" y="148">today — create</text>
    <rect class="dl-dg-box is-accent" x="8" y="176" width="40" height="44" rx="4" />
    <text class="dl-dg-lab is-sm" x="28" y="203" text-anchor="middle">z</text>
    <text class="dl-dg-small" x="28" y="236" text-anchor="middle">a few random numbers</text>
    <path class="dl-dg-arrow" marker-end="url(#cnn-arrow)" d="M52 198 H118" />
    <polygon class="dl-dg-net" points="124,176 290,154 290,242 124,220" />
    <text class="dl-dg-in" x="206" y="203" text-anchor="middle">generator</text>
    <path class="dl-dg-arrow" marker-end="url(#cnn-arrow)" d="M294 198 H326" />
    <PixelImage in-svg :x="336" :y="162" :size="72" pattern="heart" tone="accent" />
    <PixelImage in-svg :x="420" :y="162" :size="72" pattern="star" tone="accent" />
    <PixelImage in-svg :x="504" :y="162" :size="72" pattern="tree" tone="accent" />
    <text class="dl-dg-small" x="336" y="248">a different new image for every z</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

Few numbers in, **many** out — and a new picture each time. That is a
**generative model**.

</div>

<!--
Start from what the room owns. The top row is the network they trained in weeks
4 and 5: an image goes in, a softmax over a few classes comes out. The 432 is
12 x 12 x 3 for the toy picture — the arithmetic is the point, not the size.

Click, and the bottom row appears: the same kind of network, pointed the other
way. A handful of random numbers in, a whole image out, and a *different* image
for a different handful. Nothing else in the lecture is conceptually new; it is
all about how you train that bottom arrow.

Ask the room before the callout: what would the label be, for the bottom row?
There is none. That is the whole difficulty — and the rest of the lecture is four
answers to "then what do you compare the output against?"
-->

---
layout: default
title: Now make a real picture
---

# Now make a real picture

A 256 × 256 colour image.

<div class="grid grid-cols-2 gap-8 mt-2 dl-tight">
<div>

<svg viewBox="0 0 330 210" class="dl-diagram" role="img" aria-label="An image is three stacked 256 by 256 grids — 196 608 numbers; generating one pixel at a time takes one pass per number">
  <defs>
    <marker id="px-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <rect class="dl-dg-fill is-muted" x="36" y="12" width="120" height="120" rx="3" />
  <rect class="dl-dg-fill is-muted" x="24" y="24" width="120" height="120" rx="3" />
  <rect class="dl-dg-fill" x="12" y="36" width="120" height="120" rx="3" />
  <text class="dl-dg-small" x="72" y="174" text-anchor="middle">256 × 256 × 3</text>
  <text class="dl-dg-lab" x="72" y="200" text-anchor="middle">196 608 numbers</text>
  <g v-click>
    <text class="dl-dg-small" x="190" y="30">one pixel at a time?</text>
    <g v-for="r in 5" :key="r">
      <rect v-for="c in 5" :key="c" class="dl-dg-box" :x="176 + c * 20" :y="24 + r * 20" width="18" height="18" rx="2" />
    </g>
    <path class="dl-dg-line" marker-end="url(#px-arrow)" d="M205 53 H285 M285 73 H205 M205 93 H285 M285 113 H205 M205 133 H285" />
    <text class="dl-dg-small is-bad" x="190" y="176">196 608 passes</text>
    <text class="dl-dg-small is-bad" x="190" y="192">for one image</text>
  </g>
</svg>

</div>
<div>

<v-clicks>

- **196 608 numbers**, not three class scores
- Each is **continuous** — no short list of answers to put a softmax over
- They must **agree**: an eye on the left wants an eye on the right

</v-clicks>

<div v-click class="mt-3 dl-callout">

So: produce the **whole image at once**, and find a loss you can compute.

</div>

</div>
</div>

<!--
The 196 608 is 256 x 256 x 3. Write it on the board; the number does the
arguing.

The right-hand picture is the honest counter-example, and it is a CNN: PixelCNN
(2016) uses a *masked* convolution so each pixel only sees the ones above and to
the left, and generates one pixel at a time. It works. It is also 196 608
sequential forward passes for a single image, which is the trade the diffusion
section comes back to. Name it, do not teach it.

The third bullet is the one that makes it hard: the numbers are not independent.
Sampling each pixel on its own gives static, not a face.
-->

---
layout: default
title: Two kinds of model
---

# Two kinds of model

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 210" class="dl-diagram" role="img" aria-label="A discriminative model draws a boundary between two clusters; a generative model draws where each cluster lives and can place new points">
  <text class="dl-dg-lab is-sm" x="160" y="16" text-anchor="middle">discriminative — p(y | x)</text>
  <text class="dl-dg-small" x="160" y="32" text-anchor="middle">where is the line?</text>
  <g v-for="(p, i) in [[70,90],[92,120],[60,130],[100,80],[80,150],[115,105]]" :key="`a${i}`"><circle class="dl-dg-dot" :cx="p[0]" :cy="p[1]" r="5" /></g>
  <g v-for="(p, i) in [[220,90],[245,120],[210,140],[255,80],[230,160],[200,110]]" :key="`b${i}`"><circle class="dl-dg-dot is-accent" :cx="p[0]" :cy="p[1]" r="5" /></g>
  <path class="dl-dg-line is-bad" d="M140 50 L175 195" />
  <text class="dl-dg-small" x="160" y="206" text-anchor="middle">everything either side is ignored</text>
  <line class="dl-dg-split" x1="330" y1="6" x2="330" y2="206" />
  <g v-click>
    <text class="dl-dg-lab is-sm" x="500" y="16" text-anchor="middle">generative — p(x)</text>
    <text class="dl-dg-small" x="500" y="32" text-anchor="middle">where does the data live?</text>
    <ellipse class="dl-dg-fill is-muted is-dashed" cx="418" cy="115" rx="52" ry="52" />
    <ellipse class="dl-dg-fill is-muted" cx="418" cy="115" rx="30" ry="30" />
    <ellipse class="dl-dg-fill is-dashed" cx="570" cy="118" rx="52" ry="52" />
    <ellipse class="dl-dg-fill" cx="570" cy="118" rx="30" ry="30" />
    <g v-for="(p, i) in [[410,90],[432,120],[400,130],[440,80],[420,150],[455,105]]" :key="`c${i}`"><circle class="dl-dg-dot" :cx="p[0] - 10" :cy="p[1]" r="5" /></g>
    <g v-for="(p, i) in [[560,90],[585,120],[550,140],[595,80],[570,160],[540,110]]" :key="`d${i}`"><circle class="dl-dg-dot is-accent" :cx="p[0]" :cy="p[1]" r="5" /></g>
    <text class="dl-dg-lab" x="575" y="122" text-anchor="middle">★</text>
    <text class="dl-dg-small is-good" x="500" y="206" text-anchor="middle">★ a new point it can invent</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

A classifier only needs the line. A generator needs the whole shape — strictly
harder.

</div>

<!--
Left: weeks 1–5. A classifier learns p(y | x), which in picture form is a
boundary. It never has to know what a smiley looks like, only what separates
smileys from hearts; everything far from the line is irrelevant to it.

Right (click): a generative model learns p(x) — where the data actually lives,
the contour lines. Once you have that you can place a new point inside a
contour, which is exactly "make a new example". The star is that.

A decision boundary is a low-dimensional object; the data distribution is not.
This is why generative modelling stayed hard long after classification was
solved.

Vapnik's line is worth quoting if the room is awake: "when solving a problem of
interest, do not solve a more general problem as an intermediate step". Then note
that the whole of the last five years has been people doing exactly that anyway,
and it working.
-->

---
layout: default
title: The deal every model today makes
---

# The deal every model today makes

<div class="dl-prompt mt-1">

a simple distribution you can sample from, and a learned map from it to the data

</div>

<div class="dl-pixrow mt-5">
  <div class="flex flex-col gap-1">
    <PixelImage pattern="noise" :seed="3" :size="54" />
    <PixelImage pattern="noise" :seed="4" :size="54" />
    <PixelImage pattern="noise" :seed="5" :size="54" />
  </div>
  <span class="dl-op">→</span>
  <svg viewBox="0 0 150 120" width="150" height="120" role="img" aria-label="the network g">
    <polygon class="dl-dg-net" points="6,34 144,8 144,112 6,86" />
    <text class="dl-dg-in" x="75" y="66" text-anchor="middle">network g<tspan baseline-shift="sub" style="font-size: 10px">θ</tspan></text>
  </svg>
  <span class="dl-op">→</span>
  <div class="flex flex-col gap-1">
    <PixelImage pattern="smiley" :size="54" tone="accent" />
    <PixelImage pattern="heart" :size="54" tone="accent" />
    <PixelImage pattern="star" :size="54" tone="accent" />
  </div>
</div>

<div class="grid grid-cols-3 gap-4 mt-3 dl-tight text-center">
<div v-click>

**1.** Draw $\mathbf{z} \sim \mathcal{N}(\mathbf{0}, I)$ — free

</div>
<div v-click>

**2.** Push it through $g_\theta$

</div>
<div v-click>

**3.** Call the result a sample

</div>
</div>

<div v-click class="mt-3 dl-callout">

Autoencoder, VAE, GAN, diffusion — **all four** do exactly this. They differ only
in **how $g_\theta$ is trained**.

</div>

<!--
Write the prompt line on the board and leave it there for the whole lecture. Every
section ends by coming back to it.

Notation: z is the latent — a short vector of random numbers. N(0, I) means "each
number drawn independently from a standard bell curve", which is torch.randn.
theta is the network's weights, as it has been all course.

The picture is the whole idea: three different random z's on the left, three
different images on the right, one network in between. The left column is shown
as images only so the analogy is visual — z is usually much shorter than an image.

The reason the framing earns its keep: students meet these four as four unrelated
architectures with four sets of notation, and then cannot say what any of them
has in common. They have almost everything in common. The differences are
entirely in the loss, which is the only thing worth teaching about them.
-->

---
layout: default
title: Which loss can you even compute?
---

# Which loss can you even compute?

You cannot differentiate "look like real data". Each family is a different answer.

<div class="grid grid-cols-4 gap-3 mt-4">
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="ae" :size="70" />
  <strong>autoencoder</strong>
  <span>pixel error against <b>its own input</b></span>
  <span class="dl-glyphcard__cost">not generative at all</span>
</div>
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="vae" :size="70" />
  <strong>VAE</strong>
  <span>pixel error <b>+ a leash</b> on the code</span>
  <span class="dl-glyphcard__cost">blurry</span>
</div>
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="gan" :size="70" />
  <strong>GAN</strong>
  <span><b>a second network's</b> opinion</span>
  <span class="dl-glyphcard__cost">sharp, and unstable</span>
</div>
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="diffusion" :size="70" />
  <strong>diffusion</strong>
  <span>pixel error on <b>noise</b>, at every level</span>
  <span class="dl-glyphcard__cost">sharp and stable</span>
</div>
</div>

<div v-click class="mt-4 dl-callout">

Four cards, one lecture. The grey line under each is the plot.

</div>

<!--
This is the overview the whole deck fills in. Do not explain the cards now —
name them, promise each one, and move.

The four glyphs are the section emblems. They come back on each section's divider
and on the recap slide, so the room can always tell where in this table they are.

It is also the slide to come back to if the room gets lost in section 05: every
architectural difference they are looking at descends from the middle line of
each card.

The fourth card is the one that surprises people. "Regression onto noise" sounds
much weaker than an adversarial game, and it turned out to be the thing that
worked.
-->

---
layout: default
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="Which of these can tell you the probability it assigns to a picture you hand it?"
  :items="[
    'A GAN',
    'A VAE',
    'A diffusion model',
    'A pixel-by-pixel model (PixelCNN)',
  ]"
/>

</div>
<div class="mt-8">
  <div class="dl-pixrow">
    <PixelImage pattern="heart" :size="70" />
    <span class="dl-op">→</span>
    <span class="dl-op">model</span>
    <span class="dl-op">→</span>
    <span class="dl-op is-accent">p(x) = ?</span>
  </div>
</div>
</div>

<div v-click class="mt-4 dl-reveal">

Only the last one, exactly

</div>

<div v-click class="mt-2 dl-secondary">

A GAN has no likelihood at all. A VAE and a diffusion model give a **lower bound**
on it. PixelCNN multiplies one probability per pixel — exact, and slow.

</div>

<!--
Hands up for each. Most rooms pick the VAE, because it is the one with the
probability-looking derivation.

The point to leave them with: "generative model" is not one capability. Ask what
you actually need — samples, a density, or a latent you can edit — because no
family gives you all three.

PixelCNN is on the list because it was on the previous-but-two slide: generating
one pixel at a time means each step is a softmax over 256 intensity values, and
the probability of the whole image is the product of those. Exact, and very slow
to sample.

Anomaly detection is the practical case where this bites: people reach for a GAN
and then discover there is nothing to threshold.
-->

---
layout: section
index: "01"
---

# Compress first: autoencoders

<div class="dl-side-glyph"><FamilyGlyph kind="ae" :size="190" /></div>

---
layout: default
title: The autoencoder
---

# The autoencoder

Two networks, back to back, trained to do **nothing** — as accurately as possible.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 640 170" class="dl-diagram" role="img" aria-label="An encoder narrows an input image to a small code, a decoder widens it back into an image">
  <defs>
    <marker id="ae-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <PixelImage in-svg :x="4" :y="40" :size="66" pattern="smiley" />
  <text class="dl-dg-lab" x="37" y="30" text-anchor="middle">x</text>
  <polygon class="dl-dg-net" points="96,30 210,58 210,92 96,120" />
  <text class="dl-dg-in" x="150" y="80" text-anchor="middle">encoder f</text>
  <rect class="dl-dg-box is-accent" x="248" y="58" width="36" height="34" rx="4" />
  <text class="dl-dg-lab" x="266" y="80" text-anchor="middle">z</text>
  <polygon class="dl-dg-net" points="322,58 436,30 436,120 322,92" />
  <text class="dl-dg-in" x="380" y="80" text-anchor="middle">decoder g</text>
  <PixelImage in-svg :x="466" :y="40" :size="66" pattern="smiley" :noise="0.06" :seed="21" tone="accent" />
  <text class="dl-dg-lab" x="499" y="30" text-anchor="middle">x̂</text>
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M72 75 H92" />
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M212 75 H244" />
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M286 75 H318" />
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M438 75 H462" />
  <path class="dl-dg-loss" d="M37 112 V150 H499 V112" />
  <text class="dl-dg-small" x="266" y="146" text-anchor="middle">loss compares these two pictures</text>
  <text class="dl-dg-small" x="266" y="50" text-anchor="middle">the bottleneck</text>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

$\mathbf{z} = f(\mathbf{x})$, $\hat{\mathbf{x}} = g(\mathbf{z})$, and the loss is
$\lVert \mathbf{x} - \hat{\mathbf{x}} \rVert^2$. **The label is the input.**

</div>

<!--
"Trained to do nothing" always gets a laugh and it is the right way in: the task
is the identity function, and the only reason it is not trivial is the width of
the middle.

The encoder is just the CNN half they know — image in, short vector out. The
decoder is the new half: short vector in, image out.

No labels anywhere. That is the selling point — this is self-supervised learning,
and it predates the term by twenty years.

Notation for the section: f is the encoder, g the decoder, z the latent or code.
Say "code" and "latent" interchangeably once, then stay with "code".
-->

---
layout: default
title: How wide is the middle?
---

# How wide is the middle?

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

<svg viewBox="0 0 300 110" class="dl-diagram" role="img" aria-label="An undercomplete autoencoder with a narrow middle">
  <polygon class="dl-dg-net" points="10,10 130,44 130,66 10,100" />
  <rect class="dl-dg-box is-accent" x="136" y="44" width="28" height="22" rx="3" />
  <polygon class="dl-dg-net" points="290,10 170,44 170,66 290,100" />
  <text class="dl-dg-small" x="150" y="36" text-anchor="middle">narrow</text>
</svg>

### Undercomplete — $\dim(\mathbf{z}) < \dim(\mathbf{x})$

<v-clicks>

- No room to keep everything, so it **must choose**
- What it keeps is what the data actually varies along

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 110" class="dl-diagram" role="img" aria-label="An overcomplete autoencoder whose middle is wider than its input, so it can copy">
  <defs>
    <marker id="oc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <polygon class="dl-dg-net" points="10,26 110,10 110,100 10,84" />
  <rect class="dl-dg-box is-accent" x="116" y="6" width="68" height="98" rx="3" />
  <polygon class="dl-dg-net" points="290,26 190,10 190,100 290,84" />
  <path class="dl-dg-line is-bad" marker-end="url(#oc-arrow)" d="M20 55 H280" />
  <text class="dl-dg-small is-bad" x="150" y="48" text-anchor="middle">just copy</text>
</svg>

### Overcomplete — $\dim(\mathbf{z}) \ge \dim(\mathbf{x})$

<v-clicks>

- The **identity map** scores a perfect loss and teaches nothing
- Useful only with another constraint — noise, sparsity

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

The bottleneck is not a limitation you tolerate. It is the entire mechanism.

</div>

<!--
The 2025 deck asked "Undercomplete? Overcomplete?" as bare questions on the
slide; the two pictures are the answer. On the right the red arrow goes straight
through — a code that is as wide as the input can simply carry the input.

The denoising autoencoder is the standard escape for the overcomplete case:
corrupt the input, ask for the clean version, and copying is no longer a
winning strategy. Mention it, because it is also exactly the idea section 05 is
built on — and that is not a coincidence worth hiding.
-->

---
layout: interactive
heading: The bottleneck, and what it costs
title: The bottleneck, and what it costs
aside-width: 18rem
---

<AutoencoderLab />

::aside::

Three clusters of data. Grey is the input, teal is what comes back out.

<v-clicks>

- **code = 2** — output sits exactly on input. Perfect, and useless
- **code = 1** — every output must lie on **one curve** the decoder can draw

</v-clicks>

<div v-click class="mt-2 dl-callout">

That curve is the model's whole idea of what data is.

</div>

<!--
Toggle between the two a few times. With a 2-number code the teal dots vanish
under the grey ones, and "the reconstruction is perfect" stops being reassuring.

The curve is written down rather than trained, and the widget's source says so —
a network with a one-dimensional bottleneck converges to essentially this curve
on this data, and writing it down keeps the demo instant and identical every
time. Say that if anyone asks whether it is really trained.

Do not press the other button yet. That is the next-but-one slide.
-->

---
layout: default
title: What autoencoders are actually for
---

# What autoencoders are actually for

Not generation. The useful outputs are the **code** and the **error**.

<div class="grid grid-cols-[1.25fr_1fr] gap-8 mt-2 items-center">
<div>

<svg viewBox="0 0 380 220" class="dl-diagram" role="img" aria-label="A normal image is rebuilt with small error; an unusual image is rebuilt badly, with a large error">
  <defs>
    <marker id="an-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="6" y="14">trained on smileys only</text>
  <PixelImage in-svg :x="6" :y="24" :size="60" pattern="smiley" />
  <path class="dl-dg-arrow" marker-end="url(#an-arrow)" d="M72 54 H98" />
  <polygon class="dl-dg-net" points="104,34 150,48 150,60 104,74" />
  <polygon class="dl-dg-net" points="196,34 150,48 150,60 196,74" />
  <path class="dl-dg-arrow" marker-end="url(#an-arrow)" d="M200 54 H226" />
  <PixelImage in-svg :x="232" :y="24" :size="60" pattern="smiley" :noise="0.05" :seed="4" tone="accent" />
  <rect class="dl-dg-bar is-q" x="304" y="48" width="10" height="12" rx="2" />
  <text class="dl-dg-small" x="304" y="78">error 0.02</text>
  <g v-click>
    <PixelImage in-svg :x="6" :y="124" :size="60" pattern="house" />
    <path class="dl-dg-arrow" marker-end="url(#an-arrow)" d="M72 154 H98" />
    <polygon class="dl-dg-net" points="104,134 150,148 150,160 104,174" />
    <polygon class="dl-dg-net" points="196,134 150,148 150,160 196,174" />
    <path class="dl-dg-arrow" marker-end="url(#an-arrow)" d="M200 154 H226" />
    <PixelImage in-svg :x="232" :y="124" :size="60" pattern="smiley" :shifts="[-1, 0, 1]" tone="accent" />
    <rect class="dl-dg-bar is-bad" x="304" y="120" width="60" height="12" rx="2" />
    <text class="dl-dg-small is-bad" x="304" y="150">error 0.41</text>
    <text class="dl-dg-small is-bad" x="304" y="166">→ flag it</text>
  </g>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

- **Compression, denoising** — use $\hat{\mathbf{x}}$
- **Features** — use $\mathbf{z}$ for a small labelled task
- **Anomaly detection** — use the **error**
- **A space to work in** — keep this for section 05

</v-clicks>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Every one of these uses $f$, or the loss. None uses $g$ on its own.

</div>

<!--
The picture is the anomaly-detection case, and it is worth a real example:
train on healthy scans, flag the ones the model cannot rebuild. It works because
the model was never shown the pathology and so has no code for it — here, it has
only ever seen smileys, so a house comes back as a smeared smiley and the error
bar lights up. The numbers are illustrative.

The last bullet is a deliberate plant. Latent diffusion is an autoencoder with a
diffusion model living inside it, and when that slide arrives the room should
already have been told to expect it.
-->

---
layout: interactive
heading: Now sample from it
title: Now sample from it
aside-width: 18rem
---

<AutoencoderLab />

::aside::

Press **Decode a fresh z** four times. The strip shows every training code.

<v-clicks>

- The first two land **inside a clump** and decode to something plausible
- The last two land **in a gap** — a point no data ever occupied

</v-clicks>

<div v-click class="mt-2 dl-callout">

The loss asked $f$ to be **invertible**. Never to **fill** anything.

</div>

<!--
This is the slide of the section. Do all four presses, and read the nearest-real-
example number out loud each time: about 0.05 inside a clump, about 0.7 to 1.0
in a gap. A tenfold difference.

Then ask the question the next section answers: what would you have to add to the
loss to stop this happening? Let them try. The answer someone usually reaches is
"make the codes spread out", which is nearly right and is worth crediting.

The general statement: an autoencoder gives you a decoder without a distribution
to feed it. You have half a generative model and no way to use it.
-->

---
layout: default
title: An autoencoder in PyTorch
---

# An autoencoder in PyTorch

<div class="grid grid-cols-[2.3fr_1fr] gap-4 items-center">
<div>

```python {all|1-4|5-8|10-13|all}{lines:true}
enc = nn.Sequential(                          # 784 → 2
    nn.Linear(784, 128), nn.ReLU(),
    nn.Linear(128, 2),
)
dec = nn.Sequential(                          # 2 → 784
    nn.Linear(2, 128), nn.ReLU(),
    nn.Linear(128, 784), nn.Sigmoid(),
)

for x, _ in loader:                           # the label is thrown away
    z = enc(x.flatten(1))                     # (B, 784) → (B, 2)
    loss = F.mse_loss(dec(z), x.flatten(1))   # the input IS the target
    loss.backward(); opt.step(); opt.zero_grad()
```

</div>
<div>

<svg viewBox="0 0 200 230" class="dl-diagram" role="img" aria-label="Layer widths 784, 128, 2, 128, 784">
  <g v-for="(l, i) in [[784, 180, 'x'], [128, 80, ''], [2, 10, 'z'], [128, 80, ''], [784, 180, 'x̂']]" :key="i">
    <rect :class="['dl-dg-box', i === 2 ? 'is-accent' : '']" :x="100 - l[1] / 2" :y="6 + i * 44" :width="l[1]" height="26" rx="3" />
    <text class="dl-dg-small" x="100" :y="24 + i * 44" text-anchor="middle">{{ l[0] }}</text>
  </g>
</svg>

</div>
</div>

<div v-click class="mt-2 dl-secondary">

`for x, _ in loader` — the underscore is the point. No labels were used.

</div>

<!--
Have them notice the discarded label before you say anything. It is the shortest
possible definition of self-supervised learning.

The strip on the right is the shape ledger drawn to scale: 784 pixels, squeezed
to 2 numbers, and back. Linear layers keep the code short enough to read; a real
image autoencoder uses the CNN layers from week 4 in the encoder and the
transposed convolutions of section 04 in the decoder.

Sigmoid on the output because MNIST pixels live in [0, 1]. With real-valued data
you drop it, and then MSE is the sensible loss rather than a convenient one.

Two is a brutally small code for MNIST and is chosen so it can be plotted. Real
ones use 32 to 256, and then nobody can draw the picture from the widget, which
is why we do it at two.
-->

---
layout: default
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="An autoencoder rebuilds test images perfectly, yet a random z decodes to noise. Why?"
  :items="[
    'The decoder is undertrained',
    'The code is too small to hold an image',
    'The encoder never put any codes where that z is',
    'You need a bigger dataset',
  ]"
/>

</div>
<div class="mt-10">

<svg viewBox="0 0 260 150" class="dl-diagram" role="img" aria-label="Training codes sit in three clumps; a random z lands in a gap and decodes to noise">
  <line class="dl-dg-split" x1="6" y1="40" x2="254" y2="40" />
  <circle v-for="(c, i) in [20, 26, 31, 36, 110, 116, 121, 127, 200, 207, 212, 218]" :key="i" class="dl-dg-dot" :cx="c" cy="40" r="4" />
  <text class="dl-dg-small" x="6" y="18">training codes</text>
  <path class="dl-dg-line is-bad" d="M165 20 L165 60" />
  <text class="dl-dg-small is-bad" x="165" y="76" text-anchor="middle">random z</text>
  <path class="dl-dg-arrow" d="M165 82 V96" />
  <PixelImage in-svg :x="138" :y="98" :size="50" pattern="noise" :seed="9" tone="danger" />
</svg>


<div v-click class="mt-4 dl-reveal dl-reveal--side">

Nothing ever lives at that z

</div>

<div v-click class="mt-2 dl-secondary">

The decoder is only meaningful on the region the encoder used. Everywhere else
it extrapolates, and it was never penalised for what it does there.

</div>

</div>
</div>

<!--
Options one and four are the reflexes — students reach for "train more, get more
data" whenever a model misbehaves, and this is a good place to break that habit.
No amount of either fixes this, because nothing in the objective is being
violated. The model is doing exactly what it was asked.

The sketch is the widget's strip again: three clumps of codes and a random z
landing between them.

Fixing it needs a *different objective*, which is the next section in one
sentence.
-->

---
layout: section
index: "02"
---

# Make the code behave: VAEs

<div class="dl-side-glyph"><FamilyGlyph kind="vae" :size="190" /></div>

---
layout: default
title: Two changes, and only two
---

# Two changes, and only two

The variational autoencoder (VAE) is the autoencoder with the gaps fixed.

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 150" class="dl-diagram" role="img" aria-label="An autoencoder puts each example at a point, leaving gaps; a VAE gives each example a region, and the regions overlap to fill a unit Gaussian">
  <text class="dl-dg-lab is-sm" x="160" y="16" text-anchor="middle">autoencoder — one point each</text>
  <line class="dl-dg-split" x1="10" y1="110" x2="310" y2="110" />
  <circle v-for="(c, i) in [50, 58, 66, 150, 158, 166, 250, 258, 266]" :key="`p${i}`" class="dl-dg-dot" :cx="c" cy="110" r="5" />
  <text class="dl-dg-small is-bad" x="108" y="100" text-anchor="middle">gap</text>
  <text class="dl-dg-small is-bad" x="208" y="100" text-anchor="middle">gap</text>
  <line class="dl-dg-split" x1="330" y1="6" x2="330" y2="146" />
  <g v-click>
    <text class="dl-dg-lab is-sm" x="500" y="16" text-anchor="middle">VAE — a region each, pulled to N(0, 1)</text>
    <line class="dl-dg-split" x1="350" y1="110" x2="650" y2="110" />
    <path class="dl-dg-line is-muted" style="stroke-dasharray: 5 4" d="M350 110 C 440 110, 450 30, 500 30 C 550 30, 560 110, 650 110" />
    <path v-for="(c, i) in [440, 500, 560]" :key="`r${i}`" class="dl-dg-fill" :d="`M${c - 50} 110 C ${c - 25} 110, ${c - 20} 55, ${c} 55 C ${c + 20} 55, ${c + 25} 110, ${c + 50} 110 Z`" />
    <text class="dl-dg-small" x="500" y="136" text-anchor="middle">regions overlap → no gaps</text>
  </g>
</svg>
</div>

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div v-click>

**1 — encode a distribution.** The encoder outputs a mean $\boldsymbol\mu$
**and** a spread $\boldsymbol\sigma$, not a point.

</div>
<div v-click>

**2 — pull it toward a prior.** Punish each region for straying from
$\mathcal{N}(\mathbf{0}, I)$ — what we sample from later.

</div>
</div>

<div class="mt-2">
  <Citation source="Kingma & Welling, Auto-Encoding Variational Bayes (2013)" url="https://arxiv.org/abs/1312.6114" />
</div>

<!--
Deliver these two before any mathematics. The derivation is genuinely hard and
genuinely optional; the two changes are neither.

The picture is the whole mechanism: on the left each training example is a dot,
and there are gaps between the clumps — that is the previous section's failure.
On the right each example claims a bump, and all the bumps are pushed toward the
same dashed unit bell curve, so they have to overlap. An overlapping cover has no
holes. Regions overlap and fill; points do not.

If asked why N(0, I) specifically: because it is the thing we can sample from
trivially at generation time — torch.randn. There is nothing deep about the
choice.
-->

---
layout: default
title: The objective, in two terms
---

# The objective, in two terms

<div class="dl-math-sm">

$$
\mathcal{L}(\mathbf{x}) \;=\; \underbrace{\mathbb{E}_{q(\mathbf{z}\mid\mathbf{x})}\big[\lVert \mathbf{x} - g(\mathbf{z}) \rVert^2\big]}_{\text{rebuild it}} \;+\; \beta \underbrace{\mathrm{KL}\big(q(\mathbf{z}\mid\mathbf{x}) \,\Vert\, \mathcal{N}(\mathbf{0}, I)\big)}_{\text{stay near the prior}}
$$

</div>

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 620 110" class="dl-diagram" role="img" aria-label="A tug of war: the reconstruction term pulls codes apart, the KL term pulls them to the prior, beta sets the strength">
  <defs>
    <marker id="tug-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <line class="dl-dg-arrow" x1="120" y1="50" x2="500" y2="50" />
  <rect class="dl-dg-box is-accent" x="290" y="36" width="40" height="28" rx="4" />
  <text class="dl-dg-lab is-sm" x="310" y="55" text-anchor="middle">code</text>
  <PixelImage in-svg :x="40" :y="22" :size="56" pattern="smiley" />
  <path class="dl-dg-arrow" marker-end="url(#tug-arrow)" d="M270 30 H130" />
  <text class="dl-dg-small" x="200" y="22" text-anchor="middle">rebuild it: keep codes apart</text>
  <path class="dl-dg-line is-muted" d="M520 64 C 545 64, 548 22, 565 22 C 582 22, 585 64, 610 64" />
  <path class="dl-dg-arrow" marker-end="url(#tug-arrow)" d="M350 30 H505" />
  <text class="dl-dg-small" x="425" y="22" text-anchor="middle">× β — pull to N(0, I)</text>
  <text class="dl-dg-small" x="310" y="96" text-anchor="middle">β = 0 is exactly last section's autoencoder</text>
</svg>
</div>

<div class="dl-tight">

<v-clicks>

- **Left**: the autoencoder loss, decoded from a *sampled* $\mathbf{z}$
- **Right**: a leash. For a Gaussian encoder it is a two-line closed form

</v-clicks>

</div>

<div v-click class="mt-2 dl-callout">

Two terms that want opposite things. Everything a VAE does is the compromise.

</div>

<!--
Name it as the ELBO — evidence lower bound — say that maximising it maximises a
lower bound on the likelihood of the data, and then do not derive it. The
derivation is a whole lecture and it is not this one.

KL, the Kullback–Leibler divergence, is a measure of how different two
distributions are — zero when they are identical. That is all anyone needs here;
it comes back properly in section 04.

The tug of war is the image to leave them with: the reconstruction term wants
every code distinct and far apart so it can rebuild each image exactly; the KL
term wants every code squeezed onto the same bell curve. beta sets how hard the
right-hand team pulls.

The closed form for the KL, for anyone who wants it:
  KL = -0.5 * sum(1 + log(sigma^2) - mu^2 - sigma^2)
which is the one line everybody copies out of the original paper.

beta = 1 is the plain VAE. beta as a dial is Higgins et al.'s beta-VAE (2017),
and it is the slider on the widget two slides on.
-->

---
layout: default
title: You cannot backpropagate through a sample
---

# You cannot backpropagate through a sample

The encoder produces $\boldsymbol\mu, \boldsymbol\sigma$; the decoder needs an
actual $\mathbf{z}$. Drawing one is not a differentiable operation.

<div class="mt-3 flex justify-center">
<svg viewBox="0 0 660 132" class="dl-diagram" role="img" aria-label="Sampling inside the graph blocks the gradient; adding scaled external noise does not">
  <defs>
    <marker id="rp-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small is-bad" x="8" y="14">sampling inside the graph</text>
  <rect class="dl-dg-box" x="8" y="34" width="66" height="30" rx="4" />
  <text class="dl-dg-lab is-sm" x="41" y="54" text-anchor="middle">μ, σ</text>
  <rect class="dl-dg-box is-bad" x="122" y="34" width="72" height="30" rx="4" />
  <text class="dl-dg-lab is-sm" x="158" y="54" text-anchor="middle">sample</text>
  <rect class="dl-dg-box is-accent" x="242" y="34" width="44" height="30" rx="4" />
  <text class="dl-dg-lab is-sm" x="264" y="54" text-anchor="middle">z</text>
  <path class="dl-dg-arrow" marker-end="url(#rp-arrow)" d="M74 49 H118" />
  <path class="dl-dg-arrow" marker-end="url(#rp-arrow)" d="M196 49 H238" />
  <path class="dl-dg-grad is-bad" d="M264 74 V96 H158 V70" />
  <text class="dl-dg-small is-bad" x="196" y="112">gradient stops here</text>
  <line class="dl-dg-split" x1="330" y1="6" x2="330" y2="126" />
  <text class="dl-dg-small is-good" x="356" y="14">noise as an input</text>
  <rect class="dl-dg-box" x="356" y="34" width="66" height="30" rx="4" />
  <text class="dl-dg-lab is-sm" x="389" y="54" text-anchor="middle">μ, σ</text>
  <circle class="dl-dg-op" cx="486" cy="49" r="15" />
  <text class="dl-dg-lab is-sm" x="486" y="55" text-anchor="middle">+</text>
  <rect class="dl-dg-box" x="456" y="94" width="60" height="26" rx="4" />
  <text class="dl-dg-lab is-sm" x="486" y="112" text-anchor="middle">ε</text>
  <rect class="dl-dg-box is-accent" x="574" y="34" width="44" height="30" rx="4" />
  <text class="dl-dg-lab is-sm" x="596" y="54" text-anchor="middle">z</text>
  <path class="dl-dg-arrow" marker-end="url(#rp-arrow)" d="M424 49 H468" />
  <path class="dl-dg-arrow" marker-end="url(#rp-arrow)" d="M486 92 V66" />
  <path class="dl-dg-arrow" marker-end="url(#rp-arrow)" d="M503 49 H570" />
  <path class="dl-dg-grad is-good" d="M596 74 V84 H389 V70" />
</svg>
</div>

<div v-click class="mt-3 dl-callout">

$\mathbf{z} = \boldsymbol\mu + \boldsymbol\sigma \odot \boldsymbol\epsilon$,
$\;\boldsymbol\epsilon \sim \mathcal{N}(\mathbf{0}, I)$ — identical distribution,
and now $\boldsymbol\mu$ and $\boldsymbol\sigma$ sit on a differentiable path.

</div>

<!--
This is the one piece of real technique in the section and it generalises far
beyond VAEs — the same move shows up in reinforcement learning and in every
stochastic layer anyone has shipped since. It is called the reparameterisation
trick.

Read the two graphs. On the left, an arrow into a "sample" box and nothing coming
back. On the right, epsilon entering from outside as a constant, and mu and sigma
with a clean path to the loss. The circle-dot symbol is element-wise
multiplication — `*` on two tensors of the same shape.

The test of understanding: ask whether the gradient flows through epsilon. It
does not, and it does not need to — epsilon has no parameters.
-->

---
layout: interactive
heading: What β buys, and what it costs
title: What β buys, and what it costs
aside-width: 19rem
---

<VaeLatentLab />

::aside::

The curve is where codes actually are; the dashed line is what we will sample.
Red dots are samples that landed on nothing.

<v-clicks>

- **β = 0** — three spikes, two holes, 16 of 24 samples usable
- **β = 1** — the curve matches the prior, and **24 of 24** land on data
- And reconstruction error nearly **triples**

</v-clicks>

<!--
Drag the slider slowly from 0 to 1 and let the room watch three numbers move at
once. The middle one is what the VAE was invented for; the third is what it cost.

Both mechanisms in the widget are the real ones: the codes are squeezed toward
the prior, and each code is widened into a distribution. It is the widening that
drives the reconstruction error up, and that is not a simulation artefact — it is
the next slide.

If anyone asks about the 16 of 24 at beta = 0: the failures are the gaps and the
tails. The autoencoder's codes never reach past about 1.4, and the prior happily
hands you a 2.
-->

---
layout: default
title: Why VAE samples are soft
---

# Why VAE samples are soft

A slightly jittered code could have meant **either** of two sharp images.

<div class="dl-pixrow mt-4">
  <PixelImage pattern="smiley" :shifts="[-1]" :size="104" label="plausible A" />
  <span class="dl-op">and</span>
  <PixelImage pattern="smiley" :shifts="[1]" :size="104" label="plausible B" />
  <span v-click class="dl-op is-accent">→ MSE's best single answer →</span>
  <PixelImage v-click pattern="smiley" :shifts="[-1, 1]" :size="104" tone="accent" label="their average" />
</div>

<div v-click class="mt-5 dl-callout">

Scored by squared error on pixels, the best guess is the **average** — one
blurry image. The model is not failing. It is succeeding.

</div>

<div v-click class="mt-3 dl-secondary">

So to get sharpness, stop scoring pixels against pixels. That is the next section.

</div>

<!--
This is the most useful picture in the first half of the lecture. Point at the
right-hand image: the eyes are doubled and grey, the outline is thick and soft.
That is what "blurry VAE sample" means, and it follows from the loss in one step.

The concrete version: a face is plausible with the head turned slightly left and
plausible turned slightly right. MSE's best single answer is the average of the
two, which is a face with a smeared nose. No amount of capacity fixes it, because
the blurry answer genuinely has the lower expected loss.

That is the argument that made the adversarial loss worth trying, and it is worth
framing the next section as a direct response to this slide.
-->

---
layout: default
title: A VAE in PyTorch
---

# A VAE in PyTorch

<div class="dl-pixrow mb-2">
  <PixelImage pattern="smiley" :size="40" />
  <span class="dl-op">→ enc →</span>
  <span class="dl-op">μ, log σ²</span>
  <span class="dl-op is-accent">→ z = μ + σ·ε →</span>
  <span class="dl-op">dec →</span>
  <PixelImage pattern="smiley" :shifts="[-1, 0, 1]" :size="40" tone="accent" />
  <span class="dl-op">+ β·KL</span>
</div>

```python {all|2-4|6-8|11-13|all}{lines:true}
def forward(self, x):
    h = self.enc(x)                                # (B, 784) → (B, 256)
    mu = self.fc_mu(h)                             # (B, 2)
    logvar = self.fc_logvar(h)                     # (B, 2), log σ²

    std = (0.5 * logvar).exp()                     # σ, always > 0
    eps = torch.randn_like(std)                    # the noise, as an INPUT
    z = mu + std * eps                             # reparameterised

    return self.dec(z), mu, logvar

recon, mu, logvar = model(x)
kl = -0.5 * (1 + logvar - mu.pow(2) - logvar.exp()).sum(1).mean()
loss = F.mse_loss(recon, x, reduction='sum') / x.size(0) + beta * kl
```

<!--
The strip above the code is the code, drawn: each arrow is a line group, and the
accent part is lines 6 to 8.

Line 8 is the reparameterisation trick and it is one line. Point at it and say
so — students expect something elaborate after the previous slides.

Line 4 predicts log sigma^2, not sigma: it can come out negative and `.exp()`
still gives a positive standard deviation, with no clamp needed. Predicting sigma
directly means adding a softplus or a clamp, and a network that outputs a tiny
negative sigma early in training produces a NaN you will spend an afternoon on.

reduction='sum' over pixels then mean over the batch, so the two terms are on a
comparable scale. Using reduction='mean' divides by 784 as well and silently
turns beta into beta/784 — that is the classic VAE bug, and the symptom is a
posterior collapse where every mu is 0 and the model ignores z entirely.
-->

---
layout: section
index: "03"
---

# The adversarial game

<div class="dl-side-glyph"><FamilyGlyph kind="gan" :size="190" /></div>

---
layout: default
title: Stop specifying the loss
---

# Stop specifying the loss

Pixel error is the problem. So do not write a loss at all — **train one**.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 150" class="dl-diagram" role="img" aria-label="A forger makes a fake, a detective judges it, and the detective's verdict is the forger's feedback">
  <defs>
    <marker id="fd-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g transform="translate(18 42)"><ellipse class="dl-dg-fill" cx="22" cy="18" rx="22" ry="17" /><circle class="dl-dg-dot" cx="12" cy="12" r="3.5" /><circle class="dl-dg-dot is-accent" cx="22" cy="8" r="3.5" /><circle class="dl-dg-dot is-bad" cx="32" cy="13" r="3.5" /><path class="dl-dg-arrow" d="M30 40 L46 4" /></g>
  <text class="dl-dg-lab is-sm" x="40" y="106" text-anchor="middle">forger</text>
  <text class="dl-dg-small" x="40" y="122" text-anchor="middle">= generator G</text>
  <path class="dl-dg-arrow" marker-end="url(#fd-arrow)" d="M76 70 H140" />
  <PixelImage in-svg :x="150" :y="38" :size="62" pattern="smiley" :noise="0.3" :seed="6" tone="accent" />
  <text class="dl-dg-small" x="181" y="122" text-anchor="middle">a fake</text>
  <path class="dl-dg-arrow" marker-end="url(#fd-arrow)" d="M220 70 H370" />
  <PixelImage in-svg :x="290" :y="4" :size="44" pattern="heart" />
  <text class="dl-dg-small" x="312" y="62" text-anchor="middle">+ real ones</text>
  <g transform="translate(390 42)"><circle class="dl-dg-op" cx="18" cy="16" r="14" /><path class="dl-dg-arrow" style="stroke-width: 4" d="M28 26 L42 40" /></g>
  <text class="dl-dg-lab is-sm" x="410" y="106" text-anchor="middle">detective</text>
  <text class="dl-dg-small" x="410" y="122" text-anchor="middle">= discriminator D</text>
  <path class="dl-dg-arrow" marker-end="url(#fd-arrow)" d="M446 70 H500" />
  <text class="dl-dg-lab" x="510" y="76">“fake!”</text>
  <g v-click>
    <path class="dl-dg-grad is-good" marker-end="url(#fd-arrow)" d="M540 90 C 540 150, 60 150, 40 128" />
    <text class="dl-dg-small is-good" x="300" y="146" text-anchor="middle">how it could tell = how the forger improves</text>
  </g>
</svg>
</div>

<v-clicks>

- If the best detective we can train cannot tell, the fake **is** realistic
- The loss is no longer a formula. It is a network that **improves** as $G$ does

</v-clicks>

<div class="mt-3">
  <Citation source="Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville & Bengio, Generative Adversarial Nets (2014)" url="https://arxiv.org/abs/1406.2661" />
</div>

<!--
The forger and the detective are the metaphor for the whole section; use the
words "forger" and "detective" every time you explain a step, and the room will
too.

The first bullet is the philosophical move and it is worth pausing on: it
replaces "looks real" — which nobody can differentiate — with "fools the best
classifier we can train", which is just a loss.

The moving-target property in the second bullet is both why it works and why it
is hard. Every other loss in this course is a fixed function. This one is not,
and none of your optimisation intuitions transfer.

Goodfellow's account of writing the first version in one evening after an
argument in a bar is a true story and worth thirty seconds.
-->

---
layout: default
title: Two networks, opposite jobs
---

# Two networks, opposite jobs

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 210" class="dl-diagram" role="img" aria-label="A generator turns noise into a fake sample; a discriminator scores real and fake samples">
  <defs>
    <marker id="gan-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <PixelImage in-svg :x="4" :y="20" :size="48" pattern="noise" :seed="12" />
  <text class="dl-dg-small" x="28" y="84" text-anchor="middle">noise z</text>
  <polygon class="dl-dg-net" points="78,18 190,36 190,64 78,82" />
  <text class="dl-dg-in" x="134" y="55" text-anchor="middle">generator G</text>
  <PixelImage in-svg :x="224" :y="16" :size="60" pattern="smiley" :noise="0.3" :seed="6" tone="accent" />
  <text class="dl-dg-small" x="254" y="10" text-anchor="middle">fake x̃</text>
  <PixelImage in-svg :x="224" :y="120" :size="60" pattern="heart" />
  <text class="dl-dg-small" x="254" y="204" text-anchor="middle">real x, from the dataset</text>
  <polygon class="dl-dg-net is-critic" points="380,72 492,90 492,112 380,130" />
  <text class="dl-dg-in" x="436" y="105" text-anchor="middle">discriminator D</text>
  <text class="dl-dg-small" x="566" y="96">1 → real</text>
  <text class="dl-dg-small" x="566" y="114">0 → fake</text>
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M54 50 H74" />
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M192 50 H220" />
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M288 46 H330 V88 H376" />
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M288 150 H330 V114 H376" />
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M494 101 H556" />
</svg>
</div>

<div class="grid grid-cols-2 gap-8 mt-1 dl-tight">
<div v-click>

**D wants** to output 1 on real and 0 on fake.

</div>
<div v-click>

**G wants** D to output 1 on fake. It never sees a real image.

</div>
</div>

<!--
"G never sees a real image" always lands and is worth stating twice. Every scrap
of information about the dataset reaches the generator through the discriminator's
gradient, and through nothing else.

Note that D is an ordinary binary classifier — a CNN with a sigmoid on the end,
exactly the kind trained in week 4. Nothing about it is exotic. All the
strangeness is in what it is used for.

The 2025 deck drew this as one figure; here the two jobs arrive separately so
the room can be asked what D's training data is before being told. The answer —
"a labelled dataset it builds itself, half real and half from G" — is the
fourth step, three slides on.
-->

---
layout: default
title: The value function
---

# The value function

<div class="dl-math-sm">

$$
V(\theta^{(D)}, \theta^{(G)}) \;=\; \mathbb{E}_{\mathbf{x} \sim p_{\text{data}}}\big[\log D(\mathbf{x})\big] \;+\; \mathbb{E}_{\mathbf{z} \sim p_{\mathbf{z}}}\big[\log\big(1 - D(G(\mathbf{z}))\big)\big]
$$

</div>

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 620 120" class="dl-diagram" role="img" aria-label="Real images should push D toward 1, fakes should push D toward 0">
  <PixelImage in-svg :x="60" :y="8" :size="46" pattern="heart" />
  <text class="dl-dg-small" x="120" y="36">real → D(x)</text>
  <rect class="dl-dg-box" x="200" y="22" width="120" height="16" rx="3" />
  <rect class="dl-dg-bar is-q" x="200" y="22" width="108" height="16" rx="3" />
  <text class="dl-dg-small is-good" x="330" y="35">first term: wants D → 1</text>
  <PixelImage in-svg :x="60" :y="64" :size="46" pattern="smiley" :noise="0.3" :seed="6" tone="accent" />
  <text class="dl-dg-small" x="120" y="92">fake → D(G(z))</text>
  <rect class="dl-dg-box" x="200" y="78" width="120" height="16" rx="3" />
  <rect class="dl-dg-bar is-bad" x="200" y="78" width="12" height="16" rx="3" />
  <text class="dl-dg-small is-bad" x="330" y="91">second term: wants D → 0</text>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

Both halves are binary cross-entropy. **D wants $V$ big; G wants it small:**
$\;\min_G \max_D V$.

</div>

<div v-click class="mt-2 dl-secondary">

One objective, two players, opposite signs — a **saddle point**, not a minimum.

</div>

<!--
Go term by term, pointing at the two bars, and keep asking "who wants this big?".
The first term is D's score on real data, large when D(x) → 1. The second is D's
score on fakes, large when D(G(z)) → 0. The equation is much less frightening
once the room notices both halves are the BCE loss from week 4.

Notation: E means "average over", theta^(D) and theta^(G) are the two networks'
weights, p_data is the real data and p_z the noise we draw z from.

The min-max is the part to dwell on. Every optimisation so far in this course had
a bottom to roll to. This one does not: the solution is a point that is a maximum
in one set of variables and a minimum in the other, and gradient descent has no
particular reason to find it. Section 04 is that sentence with consequences.

The 2025 deck asked two questions here — freeze G, freeze D. Those are the next
slide.
-->

---
layout: default
title: Freeze one, look at the other
---

# Freeze one, look at the other

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 190" class="dl-diagram" role="img" aria-label="With G frozen, D is trained as a classifier; with D frozen, the gradient passes through D into G">
  <defs>
    <marker id="fz-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-lab is-sm" x="160" y="16" text-anchor="middle">freeze G, train D</text>
  <polygon class="dl-dg-net is-critic" points="20,50 110,62 110,88 20,100" />
  <text class="dl-dg-in is-critic" x="56" y="80" text-anchor="middle">G</text><g transform="translate(68 68)"><path class="dl-dg-arrow" style="stroke-width: 1.5" d="M2.5 7 V4 a3.5 3.5 0 0 1 7 0 V7" /><rect class="dl-dg-bar" x="0" y="7" width="12" height="9" rx="1.5" /></g>
  <path class="dl-dg-arrow" marker-end="url(#fz-arrow)" d="M112 75 H150" />
  <polygon class="dl-dg-net" points="156,50 246,62 246,88 156,100" />
  <text class="dl-dg-in" x="200" y="80" text-anchor="middle">D</text>
  <path class="dl-dg-arrow" marker-end="url(#fz-arrow)" d="M248 75 H280" />
  <text class="dl-dg-small" x="284" y="72">BCE</text>
  <path class="dl-dg-grad is-good" marker-end="url(#fz-arrow)" d="M296 90 V120 H200 V104" />
  <text class="dl-dg-small" x="160" y="146" text-anchor="middle">G is just a second dataset — of fakes</text>
  <text class="dl-dg-small is-good" x="160" y="164" text-anchor="middle">task: classify real vs fake · maximise V</text>
  <line class="dl-dg-split" x1="330" y1="6" x2="330" y2="184" />
  <g v-click>
    <text class="dl-dg-lab is-sm" x="500" y="16" text-anchor="middle">freeze D, train G</text>
    <polygon class="dl-dg-net" points="356,50 446,62 446,88 356,100" />
    <text class="dl-dg-in" x="400" y="80" text-anchor="middle">G</text>
    <path class="dl-dg-arrow" marker-end="url(#fz-arrow)" d="M448 75 H486" />
    <polygon class="dl-dg-net is-critic" points="492,50 582,62 582,88 492,100" />
    <text class="dl-dg-in is-critic" x="528" y="80" text-anchor="middle">D</text><g transform="translate(540 68)"><path class="dl-dg-arrow" style="stroke-width: 1.5" d="M2.5 7 V4 a3.5 3.5 0 0 1 7 0 V7" /><rect class="dl-dg-bar" x="0" y="7" width="12" height="9" rx="1.5" /></g>
    <path class="dl-dg-arrow" marker-end="url(#fz-arrow)" d="M584 75 H612" />
    <text class="dl-dg-small" x="614" y="72">“say real”</text>
    <path class="dl-dg-grad is-good" marker-end="url(#fz-arrow)" d="M628 90 V124 H400 V104" />
    <text class="dl-dg-small" x="500" y="146" text-anchor="middle">D is just a fixed, differentiable loss</text>
    <text class="dl-dg-small is-good" x="500" y="164" text-anchor="middle">gradient flows through D into G · minimise V</text>
  </g>
</svg>
</div>

<div v-click class="mt-3 dl-callout">

Two ordinary supervised problems, alternated. That is all a training loop is.

</div>

<!--
This is the slide that turns an intimidating min-max into something implementable,
and it is the structure of the training-loop code later in the section. The lock
is the frozen network; the teal dashed arrow is where the gradient goes.

"Gradients flow through D into G, and D's weights do not move" is the sentence
that explains why the code has two optimisers rather than one. It is also the
single most common source of bugs — the `detach()` poll.

Ask what happens if you train D to convergence at every step. The answer is the
non-saturating-loss slide: D gets so good that G's gradient vanishes.
-->

---
layout: default
title: The best discriminator that could exist
---

# The best discriminator that could exist

<div class="grid grid-cols-[1fr_1.15fr] gap-6 mt-1 items-center">
<div>

Freeze $G$. The best $D$ is:

<div class="dl-math-sm">

$$
D^*(\mathbf{x}) = \frac{p_{\text{data}}(\mathbf{x})}{p_{\text{data}}(\mathbf{x}) + p_g(\mathbf{x})}
$$

</div>

<div class="dl-tight">

<v-clicks>

- A **ratio of two densities**, point by point
- Only real data → 1. Only fakes → 0
- Where they are equal → ½

</v-clicks>

</div>

</div>
<div>

<Plot2D
  :x-domain="[-4, 4]" :y-domain="[0, 1.05]"
  :width="420" :height="215"
  x-label="x"
  :x-ticks="[-4, -2, 0, 2, 4]" :y-ticks="[0, 0.5, 1]"
>
  <PlotCurve :fn="(x) => 0.9 * Math.exp(-((x + 1) ** 2) / 1.2)" color="var(--dl-muted)" :width="2" :fill-to="0" :opacity="0.5" />
  <PlotCurve :fn="(x) => 0.9 * Math.exp(-((x - 1) ** 2) / 1.2)" color="var(--dl-accent)" :width="2" :fill-to="0" :opacity="0.5" />
  <PlotCurve :fn="(x) => 1 / (1 + Math.exp(4 * x / 1.2))" color="var(--dl-heading)" :width="2.6" />
  <PlotLine :from="[-4, 0.5]" :to="[4, 0.5]" color="var(--dl-muted)" :width="1" dashed />
  <PlotLabel :at="[-2.6, 0.62]" text="p_data" color="var(--dl-muted)" bold />
  <PlotLabel :at="[1.7, 0.62]" text="p_g" color="var(--dl-accent)" bold />
  <PlotLabel :at="[-3.9, 0.98]" text="D*" color="var(--dl-heading)" :dx="2" :dy="10" bold />
</Plot2D>

</div>
</div>

<div v-click class="mt-2 dl-callout">

A perfect generator makes the best discriminator useless — coin-flip everywhere.

</div>

<!--
Read the plot left to right. Grey is the real data, teal the generator. Far left
only real data lives, so D* = 1; far right only fakes, so D* = 0; in the middle
where the two curves cross, D* is exactly one half. As the teal hump slides onto
the grey one, the black curve flattens onto the dashed 0.5 line — that is the
callout, as a picture.

The derivation is one line if anyone wants it: the integrand is
a·log(d) + b·log(1 - d), which is maximised at d = a / (a + b). Point out that
this is per-x, so you can do it pointwise inside the integral.

The last bullet is the target the whole game is aimed at, and it is a good moment
to ask what "D's loss went to 0.693" means in a training log. It means ln 2. It
means you have won.

Next slide computes all three of these numbers on the running example.
-->

---
layout: interactive
heading: D*, on three modes
title: D*, on three modes
aside-width: 18rem
---

<AdversarialGame discriminator-only />

::aside::

Write $P$ for $p_{\text{data}}$ and $Q$ for $p_g$. $P$ is uniform over three
modes; $Q$ over-produces mode 2.

<v-clicks>

- Mode 1: $\tfrac{1/3}{1/3 + 1/5} = \tfrac{5}{8} = 0.625$
- Mode 2: $\tfrac{1/3}{1/3 + 1/2} = \tfrac{2}{5} = 0.400$
- Mode 3: $\tfrac{1/3}{1/3 + 3/10} = \tfrac{10}{19} = 0.526$

</v-clicks>

<div v-click class="mt-2 dl-callout">

Under 0.5 exactly where the generator is over-producing.

</div>

<!--
Have them do mode 1 on paper before you reveal it. One third over eight
fifteenths. Everyone can do this and it demystifies the whole section.

Then press Perfect and watch all three go to 0.500, which is the previous slide's
callout as a number.

The three modes carry the rest of the deck. Say now that the same three modes
come back as three blobs on a plane in section 05, and that it is the same
example wearing different clothes.
-->

---
layout: default
title: Put D* back in
---

# Put $D^*$ back in

<div class="grid grid-cols-[1.2fr_1fr] gap-6 mt-1 items-center">
<div>

Substitute the best discriminator into $V$:

<div class="dl-math-sm">

$$
V(D^*, G) = -\log 4 + 2 \cdot \mathrm{JS}\big(p_{\text{data}} \Vert p_g\big)
$$

</div>

<div class="dl-tight">

<v-clicks>

- $\mathrm{JS}$ — **Jensen–Shannon divergence**: how far apart two distributions are
- $-\log 4$ is a constant. $G$ can only move JS
- $\mathrm{JS} = 0$ only when the two are **identical**

</v-clicks>

</div>

</div>
<div>

<svg viewBox="0 0 280 210" class="dl-diagram" role="img" aria-label="The running example: P is one third on each mode, Q is 0.2, 0.5, 0.3; D star is 5/8, 2/5, 10/19; JS is 0.0173">
  <line class="dl-dg-split" x1="20" y1="160" x2="270" y2="160" />
  <g v-for="(b, i) in [[1/3, 0.2, '5/8'], [1/3, 0.5, '2/5'], [1/3, 0.3, '10/19']]" :key="i">
    <rect class="dl-dg-bar" :x="34 + i * 82" :y="160 - b[0] * 240" width="26" :height="b[0] * 240" rx="3" />
    <rect class="dl-dg-bar is-q" :x="62 + i * 82" :y="160 - b[1] * 240" width="26" :height="b[1] * 240" rx="3" />
    <text class="dl-dg-small" :x="61 + i * 82" y="176" text-anchor="middle">mode {{ i + 1 }}</text>
    <text class="dl-dg-lab is-sm" :x="61 + i * 82" y="196" text-anchor="middle">D* = {{ b[2] }}</text>
  </g>
  <text class="dl-dg-small" x="34" y="14">■ P (real)</text>
  <text class="dl-dg-small is-good" x="110" y="14">■ Q (generator)</text>
  <text class="dl-dg-lab is-sm" x="150" y="36" text-anchor="middle">JS(P ‖ Q) = 0.0173</text>
</svg>

</div>
</div>

<div v-click class="mt-2 dl-callout">

A trained discriminator is not just a classifier. It is a **measurement of the
gap** between real and fake — and $G$ is shrinking the thing it measures.

</div>

<!--
This is the payoff of the lecture. Slow down.

The chart is the running example drawn once more, the same way as in the
widget: grey bars P, teal bars Q, and the three D* fractions the room computed on
the previous slide underneath. JS turns the whole mismatch into one number,
0.0173 nats, and V(D*, G) = -1.38629 + 2 × 0.01725 = -1.35179.

The reframing is what matters: a GAN is not "a clever trick with two networks",
it is a way to minimise a divergence you cannot write down, by estimating it with
a classifier. Once a student holds that, every GAN variant in section 04 becomes
"they changed which divergence", which is exactly what those papers did.

Everything is in nats here. The 2025 deck's 0.101 and 0.0248 for this example are
the same numbers in bits — divide by ln 2. Say it, because a student comparing
the two decks will otherwise think one of them is wrong.

Next slide checks this equality numerically, live.
-->

---
layout: interactive
heading: The theorem, as a number
title: The theorem, as a number
aside-width: 18rem
---

<AdversarialGame />

::aside::

Two rows, computed two completely different ways.

<v-clicks>

- **V(D\*, G)** — sum the logs over three bins, by hand
- **−log 4 + 2·JS** — never touches $D$ at all
- Move any slider. They **never** disagree

</v-clicks>

<div v-click class="mt-2 dl-callout">

At $Q = P$: $V = -1.38629 = -\log 4$, and JS is 0.

</div>

<!--
Drag a slider back and forth while the room watches the two numbers move in
lockstep. That is the theorem, and it is much more convincing than the algebra.

The default position gives -1.35179 on both rows, and JS = 0.01725. Read all
three out.

Then press Perfect: -1.38629, which is -log 4 to five places, and a discriminator
at 0.5 on every mode. The game is over and V is at its floor.

Press Collapse for a preview of section 04 — but do not teach mode collapse yet.
-->

---
layout: default
title: The four steps
---

# The four steps

One iteration: two passes for $D$, one for $G$, and a label flip.

<div class="mt-3 flex justify-center">
<svg viewBox="0 0 660 200" class="dl-diagram" role="img" aria-label="Four steps: real batch labelled 1, fake batch labelled 0, update D, then fakes labelled 1 to update G">
  <defs>
    <marker id="st-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="(s, i) in [['1', 'real batch', 'D(x)', 'label 1', 'heart', 0, 'ink'], ['2', 'fake batch', 'D(G(z))', 'label 0', 'smiley', 0.3, 'accent'], ['3', 'update D', 'both', '—', '', 0, 'ink'], ['4', 'fakes again', 'D(G(z))', 'label 1 !', 'smiley', 0.3, 'accent']]" :key="i">
    <rect :class="['dl-dg-box', i === 3 ? 'is-accent' : '']" :x="8 + i * 164" y="24" width="140" height="150" rx="6" />
    <circle class="dl-dg-op" :cx="30 + i * 164" cy="46" r="13" />
    <text class="dl-dg-lab is-sm" :x="30 + i * 164" y="51" text-anchor="middle">{{ s[0] }}</text>
    <text class="dl-dg-lab is-sm" :x="92 + i * 164" y="51" text-anchor="middle">{{ s[1] }}</text>
    <PixelImage v-if="s[4]" in-svg :x="56 + i * 164" :y="66" :size="46" :pattern="s[4]" :noise="s[5]" :seed="6" :tone="s[6]" />
    <g v-else :transform="`translate(${60 + i * 164} 70)`"><circle class="dl-dg-op" cx="18" cy="18" r="16" /><path class="dl-dg-arrow" d="M18 8 V18 L26 24" /></g>
    <text class="dl-dg-small" :x="78 + i * 164" y="134" text-anchor="middle">{{ s[2] }}</text>
    <text :class="i === 3 ? 'dl-dg-lab is-sm is-bad-text' : 'dl-dg-lab is-sm'" :x="78 + i * 164" y="158" text-anchor="middle">{{ s[3] }}</text>
  </g>
  <path v-for="i in 3" :key="`a${i}`" class="dl-dg-arrow" marker-end="url(#st-arrow)" :d="`M${150 + (i - 1) * 164} 100 H${168 + (i - 1) * 164}`" />
  <text class="dl-dg-small" x="566" y="192" text-anchor="middle">then update G</text>
</svg>
</div>

<div v-click class="mt-3 dl-callout">

Step 4 labels a fake as **1**. That single lie is the generator's entire
training signal.

</div>

<!--
The 2025 deck had this as one dense figure. As four cards the label flip between
card 2 and card 4 is impossible to miss — the same fake smiley, labelled 0 when
D is learning and 1 when G is learning. That is the whole adversarial
relationship in one place. In forger-and-detective terms: step 4 asks "what
would the forger have to change for the detective to say real?".

Ask why step 4 needs a fresh forward pass rather than reusing step 2's. Because
D has been updated in between, so step 2's output is stale. Reusing it is a real
bug people ship.

There is a cheaper variant that reuses it and it mostly works, which is why the
bug survives.
-->

---
layout: default
title: The trick that makes it train
---

# The trick that makes it train

Early on, $D$ catches every fake — so the generator sits at the **left** of this
plot.

<div class="grid grid-cols-2 gap-6 mt-1">
<div>

<Plot2D
  :x-domain="[0, 1]" :y-domain="[-4, 0.5]"
  :width="420" :height="215"
  x-label="D(G(z))"
  :x-ticks="[0, 0.25, 0.5, 0.75, 1]" :y-ticks="[-4, -3, -2, -1, 0]"
>
  <PlotCurve :fn="(d) => Math.log(1 - d)" color="var(--dl-danger)" :width="2.6" />
  <PlotCurve :fn="(d) => Math.log(d)" color="var(--dl-accent)" :width="2.6" />
  <PlotLabel :at="[0.42, -0.62]" text="log(1 − D)" color="var(--dl-danger)" :dx="4" :dy="-4" bold />
  <PlotLabel :at="[0.42, -0.95]" text="log D" color="var(--dl-accent)" :dx="4" :dy="12" bold />
  <PlotLine :from="[0.08, -4]" :to="[0.08, 0.5]" color="var(--dl-muted)" :width="1.2" dashed />
  <PlotLabel :at="[0.08, 0.5]" text="G starts here" color="var(--dl-muted)" :dx="6" :dy="10" />
</Plot2D>

</div>
<div class="dl-tight">

<v-clicks>

- At $D \approx 0$, $\log(1-D)$ is **flat**. Almost no gradient
- $\log D$ is *steepest* in exactly that place

</v-clicks>

<div v-click class="mt-3 dl-callout">

So **maximise $\log D(G(\mathbf{z}))$** instead. Same fixed point, usable
gradient.

</div>

<div v-click class="mt-2 dl-secondary">

One argument in code: train $G$ with BCE against a label of **1**.

</div>

</div>
</div>

<!--
Read both curves between 0 and 1. log(1 - D) is flat at the left end and steep at
the right; log D is the reverse. The generator lives at the left end for the
whole early phase — the detective catches every fake.

This is in the original paper, in one paragraph, and it is the difference between
a GAN that trains and one that does not. It is the first thing to check when
someone's GAN is not moving.

The name to use is "the non-saturating loss". They will meet it in every
implementation they read.
-->

---
layout: default
title: The training loop
---

# The training loop

```python {all|1-2|5-7|9-11|all}{lines:true}
opt_d = torch.optim.Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))
opt_g = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))

for real in loader:
    fake = G(torch.randn(real.size(0), 100, device=dev))      # steps 1–3
    loss_d = bce(D(real), ones) + bce(D(fake.detach()), zeros)
    opt_d.zero_grad(); loss_d.backward(); opt_d.step()

    fake = G(torch.randn(real.size(0), 100, device=dev))      # step 4
    loss_g = bce(D(fake), ones)          # label 1 — the non-saturating form
    opt_g.zero_grad(); loss_g.backward(); opt_g.step()
```

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 92" class="dl-diagram" role="img" aria-label="Line 6: detach cuts the gradient before it reaches G. Line 10: the gradient must cross D to reach G">
  <defs>
    <marker id="tl-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-click>
    <text class="dl-dg-small" x="4" y="26">line 6</text>
    <rect class="dl-dg-box" x="50" y="10" width="44" height="24" rx="4" />
    <text class="dl-dg-lab is-sm" x="72" y="27" text-anchor="middle">G</text>
    <text class="dl-dg-emoji" x="128" y="32" text-anchor="middle" style="font-size: 20px">✂️</text>
    <rect class="dl-dg-box is-accent" x="160" y="10" width="44" height="24" rx="4" />
    <text class="dl-dg-lab is-sm" x="182" y="27" text-anchor="middle">D</text>
    <text class="dl-dg-small" x="214" y="26">← loss_d</text>
    <path class="dl-dg-grad is-bad" d="M156 22 H140" />
    <text class="dl-dg-small is-bad" x="280" y="26">detach(): D learns, G is untouched</text>
  </g>
  <g v-click>
    <text class="dl-dg-small" x="4" y="72">line 10</text>
    <rect class="dl-dg-box is-accent" x="50" y="56" width="44" height="24" rx="4" />
    <text class="dl-dg-lab is-sm" x="72" y="73" text-anchor="middle">G</text>
    <path class="dl-dg-grad is-good" marker-end="url(#tl-arrow)" d="M158 68 H98" />
    <rect class="dl-dg-box" x="160" y="56" width="44" height="24" rx="4" />
    <text class="dl-dg-lab is-sm" x="182" y="73" text-anchor="middle">D</text>
    <text class="dl-dg-small" x="214" y="72">← loss_g</text>
    <text class="dl-dg-small is-good" x="280" y="72">no detach: the gradient must cross D to reach G</text>
  </g>
</svg>
</div>

<!--
Lines 6 and 10 are the slide, and the strip under the code is them drawn: the
scissors are `.detach()`. One has detach and one must not, and if you get them
the wrong way round you get no error message and no working model.

Two optimisers, each holding only its own parameters — lines 1 and 2.

betas=(0.5, 0.999) is DCGAN's setting and everyone still uses it. Adam's default
0.9 keeps too much momentum for a loss surface that is moving under you.

Have them trace what happens without detach on line 6: the discriminator update
also pushes gradient into G, so G is being nudged to make D's job *easier*. It
trains, slowly, to something wrong.
-->

---
layout: default
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="You delete .detach() on line 6. What happens?"
  :items="[
    'A shape error on the next line',
    'Nothing — G has its own optimiser, so it is unaffected',
    'D\'s update also computes gradients into G, which opt_g then applies',
    'The discriminator stops learning',
  ]"
/>

</div>
<div class="mt-12">

<svg viewBox="0 0 240 90" class="dl-diagram" role="img" aria-label="Without the scissors, the discriminator's gradient leaks into G">
  <defs>
    <marker id="pd-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="10" y="30" width="50" height="28" rx="4" />
  <text class="dl-dg-lab is-sm" x="35" y="49" text-anchor="middle">G</text>
  <text class="dl-dg-emoji" x="100" y="24" text-anchor="middle" style="font-size: 20px">✂️</text>
  <line class="dl-dg-line is-bad" x1="86" y1="6" x2="114" y2="30" />
  <rect class="dl-dg-box is-accent" x="140" y="30" width="50" height="28" rx="4" />
  <text class="dl-dg-lab is-sm" x="165" y="49" text-anchor="middle">D</text>
  <path class="dl-dg-grad is-bad" marker-end="url(#pd-arrow)" d="M138 44 H64" />
  <text class="dl-dg-small is-bad" x="100" y="80" text-anchor="middle">loss_d leaks into G?</text>
</svg>


<div v-click class="mt-4 dl-reveal dl-reveal--side">

G accumulates gradient from D's loss

</div>

<div v-click class="mt-2 dl-secondary">

`opt_g` only *applies* gradients; it does not decide who computed them. G's
`.grad` now carries a term from the discriminator's objective.

</div>

</div>
</div>

<!--
Option 2 is the popular answer and it is the useful misconception to break:
students think an optimiser scopes the backward pass. It does not. The backward
pass follows the graph; the optimiser only decides which parameters get stepped.

The sketch is the scissors from the previous slide, removed.

The reason `opt_g.zero_grad()` on line 11 does not save you: it clears before the
generator's own backward, so the stale gradient is gone — but in the many
loop orderings people write where it does not, it is not. Worth showing the
ordering that breaks.

The honest summary: detach is the cheap way to say "treat this tensor as data".
-->

---
layout: default
title: Watch it happen
---

# Watch it happen

<div class="grid grid-cols-[1fr_1fr_0.9fr] gap-5 mt-3 items-center">
<div v-click>
  <LinkCard
    href="https://poloclub.github.io/ganlab/"
    title="GAN Lab"
    blurb="Kahng et al., Georgia Tech. A GAN training in your browser, with the discriminator's decision surface drawn live."
    icon="🎮"
  />
</div>
<div v-click>
  <LinkCard
    href="https://arxiv.org/abs/1406.2661"
    title="Generative Adversarial Nets"
    blurb="Goodfellow et al., 2014. Nine pages. The proof of the D* result is four lines."
    icon="📄"
  />
</div>
<div v-click>

<svg viewBox="0 0 220 200" class="dl-diagram" role="img" aria-label="What to look for in GAN Lab: the background shading is D, and fake points move toward the real ones">
  <defs>
    <marker id="gl-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <rect class="dl-dg-fill is-muted" x="4" y="4" width="212" height="170" rx="6" />
  <path class="dl-dg-fill" style="stroke: none" d="M4 4 H120 C 100 60, 150 120, 110 174 H4 Z" />
  <circle v-for="(p, i) in [[40,40],[60,70],[34,110],[70,140],[50,90],[80,30]]" :key="`r${i}`" class="dl-dg-dot" :cx="p[0]" :cy="p[1]" r="5" />
  <circle v-for="(p, i) in [[170,50],[180,100],[160,140],[190,70]]" :key="`f${i}`" class="dl-dg-dot is-accent" :cx="p[0]" :cy="p[1]" r="5" />
  <path v-for="(p, i) in [[170,50],[180,100],[160,140],[190,70]]" :key="`m${i}`" class="dl-dg-arrow" marker-end="url(#gl-arrow)" :d="`M${p[0] - 7} ${p[1]} L${p[0] - 34} ${p[1] - 4}`" />
  <text class="dl-dg-small" x="110" y="192" text-anchor="middle">shading = D · teal = G, moving in</text>
</svg>

</div>
</div>

<div v-click class="mt-4 dl-secondary">

In GAN Lab, try the "two rings" dataset and wait. It usually collapses — and that
is the next section.

</div>

<!--
Five minutes here if the session is running to time, none if it is not. The
sketch on the right is what to point at on screen: the background shading is D —
the D* picture from earlier, live — and the teal fakes are sliding along D's
gradient toward the real data.

Leaving the two-rings case running while you start section 04 is a nice piece of
theatre — the collapse usually shows up within a couple of minutes.
-->

---
layout: section
index: "04"
---

# Why GANs are hard

<div class="dl-side-glyph"><FamilyGlyph kind="collapse" :size="190" /></div>

---
layout: default
title: DCGAN — a CNN, run backwards
---

# DCGAN — a CNN, run backwards

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 230" class="dl-diagram" role="img" aria-label="The discriminator shrinks a 64 by 64 image to one number with strided convolutions; the generator grows a vector to a 64 by 64 image with transposed convolutions">
  <defs>
    <marker id="dc-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-lab is-sm" x="8" y="16">discriminator — the week-4 CNN</text>
  <PixelImage in-svg :x="8" :y="26" :size="72" pattern="heart" />
  <g v-for="(s, i) in [36, 18, 9]" :key="`d${i}`">
    <rect class="dl-dg-box" :x="110 + i * 70" :y="62 - s" :width="s * 2 * 0.75" :height="s * 2 * 0.75" rx="2" />
    <text class="dl-dg-small" :x="110 + i * 70" y="104">{{ [32, 16, 8][i] }}²</text>
  </g>
  <path class="dl-dg-arrow" marker-end="url(#dc-arrow)" d="M84 60 H104" />
  <text class="dl-dg-small" x="160" y="120" text-anchor="middle">strided conv: halves each block</text>
  <circle class="dl-dg-op" cx="340" cy="56" r="14" />
  <text class="dl-dg-small" x="340" y="60" text-anchor="middle">0.9</text>
  <text class="dl-dg-small" x="360" y="60">one number: real?</text>
  <g v-click>
    <line class="dl-dg-split" x1="8" y1="132" x2="652" y2="132" />
    <text class="dl-dg-lab is-sm" x="8" y="152">generator — the same, run backwards</text>
    <rect class="dl-dg-box is-accent" x="8" y="170" width="16" height="44" rx="3" />
    <text class="dl-dg-small" x="16" y="228" text-anchor="middle">z</text>
    <g v-for="(s, i) in [9, 18, 36]" :key="`g${i}`">
      <rect class="dl-dg-fill" :x="60 + i * 80" :y="192 - s * 0.75" :width="s * 1.5" :height="s * 1.5" rx="2" />
      <text class="dl-dg-small" :x="60 + i * 80" y="228">{{ [8, 16, 32][i] }}²</text>
    </g>
    <path class="dl-dg-arrow" marker-end="url(#dc-arrow)" d="M28 192 H54" />
    <path class="dl-dg-arrow" marker-end="url(#dc-arrow)" d="M290 192 H320" />
    <PixelImage in-svg :x="326" :y="156" :size="72" pattern="heart" :noise="0.12" :seed="3" tone="accent" />
    <text class="dl-dg-small is-good" x="420" y="196">transposed conv: doubles each block</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-callout">

No pooling in either. Down is a stride, up is a **transposed** convolution — both
learned.

</div>

<div class="mt-2">
  <Citation source="Radford, Metz & Chintala, Unsupervised Representation Learning with Deep Convolutional GANs (2015)" url="https://arxiv.org/abs/1511.06434" />
</div>

<!--
Week 4 built a network that turns a big image into a small vector — the top row.
The generator needs the opposite — the bottom row. That is all DCGAN is.

DCGAN is the paper that made GANs usable, and it is almost entirely a list of
architectural rules found by trial and error: LeakyReLU in D, ReLU in G, tanh on
G's output, BatchNorm in both. That is worth saying: the contribution was
engineering, and it mattered enormously.

`tanh` at the output because images are scaled to [-1, 1]. Get that wrong and
the discriminator learns to detect the range rather than the content — a real bug
with a very confusing symptom.

No pooling is the one people ask about. Pooling throws information away with a
fixed rule, and a generator has nothing to throw away; a strided transposed
convolution learns its own upsampling. That operation is the next slide.
-->

---
layout: interactive
heading: Transposed convolution
title: Transposed convolution
aside-width: 18rem
---

<TransposeConvLab />

::aside::

Not a new operation: insert zeros between the inputs, then convolve.

<v-clicks>

- Output is $(n-1)s + k$
- Shading is **how many taps** reach each cell
- Try **(3, 2)**

</v-clicks>

<div v-click class="mt-2 dl-callout">

Kernel 3, stride 2: a 4× difference between neighbours.

</div>

<!--
Notation: n is the input width, s the stride, k the kernel size — the same
letters as the week-4 convolution formula, run the other way.

The middle panel is the whole slide. "Fractionally strided" stops being a mystery
the moment you see that the stride is applied to the *input* by spacing it out,
not to the kernel.

Then the (3, 2) case. The alternating pattern is baked into the arithmetic, so a
freshly initialised generator paints a checkerboard before it has learned
anything. That is the faint grid in every 2016 GAN sample.

Odena, Dumoulin and Olah's Distill article is the reference and the pictures are
worth showing if anyone is unconvinced.
-->

---
layout: default
title: The checkerboard, and what to do instead
---

# The checkerboard, and what to do instead

<div class="dl-pixrow mt-3 gap-8">
  <PixelImage pattern="checker:3:2" :size="120" tone="danger" label="kernel 3, stride 2" />
  <PixelImage v-click pattern="checker:4:2" :size="120" label="kernel 4, stride 2 — even" />
  <PixelImage v-click pattern="checker:2:1" :size="120" tone="accent" label="upsample, then convolve" />
</div>

<div class="dl-tight mt-4">

<v-clicks>

- Uneven taps whenever `stride` does not divide `kernel` — there **before training**
- **Fix 1:** make stride divide kernel. 4 with stride 2 is DCGAN's choice
- **Fix 2:** resize, then an ordinary `Conv2d`. What modern code — and section 05's U-Net — does

</v-clicks>

</div>

<div class="mt-2">
  <Citation source="Odena, Dumoulin & Olah, Deconvolution and Checkerboard Artifacts, Distill (2016)" url="https://distill.pub/2016/deconv-checkerboard/" />
</div>

<!--
The three pictures are the tap counts from the widget, shaded, for an untrained
layer where every weight is equal. Left: the checkerboard — a 4x difference
between neighbouring cells, and a grid the eye cannot un-see. Middle: stride
divides kernel and the interior is flat. Right: upsample then convolve, flat by
construction.

The second fix is the one to emphasise because it is what they will actually see
in code: `nn.Upsample` followed by `nn.Conv2d`, or `F.interpolate` then a conv.
Separating "make it bigger" from "decide what goes there" removes the problem by
construction rather than by tuning.

An artefact you can predict from arithmetic is one you can design out. By 2020
transposed convolution had quietly lost.
-->

---
layout: default
title: One more piece from week 4
---

# One more piece from week 4

Batch normalisation, in both networks, and it is doing more work here than usual.

<div class="grid grid-cols-[1.1fr_1fr] gap-6 mt-2 items-center">
<div>

<Plot2D
  :x-domain="[-4, 7]" :y-domain="[0, 0.45]"
  :width="420" :height="210"
  x-label="activation value"
  :x-ticks="[-4, -2, 0, 2, 4, 6]" :y-ticks="[0, 0.2, 0.4]"
>
  <PlotCurve :fn="(x) => Math.exp(-((x - 3.5) ** 2) / 8) / Math.sqrt(8 * Math.PI)" color="var(--dl-muted)" :width="2.2" dashed />
  <PlotCurve :fn="(x) => Math.exp(-(x ** 2) / 2) / Math.sqrt(2 * Math.PI)" color="var(--dl-accent)" :width="2.6" :fill-to="0" :opacity="0.6" />
  <PlotLabel :at="[4.6, 0.19]" text="drifting" color="var(--dl-muted)" bold />
  <PlotLabel :at="[1.1, 0.34]" text="after BatchNorm" color="var(--dl-accent)" bold />
</Plot2D>

</div>
<div class="dl-tight">

<v-clicks>

- Usual benefit: gradients stay in a workable range
- **New here** — it stops one network's activations drifting while the other
  chases them

</v-clicks>

<div v-click class="mt-3 dl-callout">

Not in $D$'s first layer, not in $G$'s last. Both touch real pixel statistics.

</div>

</div>
</div>

<!--
This is revision and should take two minutes. Normalise each activation over the
batch, rescale with two learned parameters — they have seen it. The plot is what
it does: the dashed grey distribution has wandered off and spread out; after
BatchNorm it is back to mean 0, spread 1.

The one new thing is the stabilisation argument, which is specific to the
adversarial setting: both networks are moving targets for each other, and
BatchNorm limits how far either can wander between updates.

Modern GANs often use spectral normalisation on D instead, which bounds how
sharply the discriminator can respond rather than rescaling its activations.

The exception in the callout is the kind of detail students dismiss as
superstition. It is not: normalising D's input layer destroys exactly the pixel
statistics it needs, and normalising G's output layer fights the tanh.
-->

---
layout: default
title: The failure that defines GANs
---

# The failure that defines GANs

**Mode collapse.** $G$ finds one output $D$ accepts, and produces only that.

<div class="grid grid-cols-2 gap-10 mt-3">
<div class="flex flex-col items-center gap-1">
  <div class="dl-samplegrid">
    <PixelImage v-for="(p, i) in ['smiley', 'heart', 'star', 'house', 'moon', 'tree', 'heart', 'smiley', 'star']" :key="i" :pattern="p" :size="46" />
  </div>
  <span class="dl-secondary">what the data looks like</span>
</div>
<div v-click class="flex flex-col items-center gap-1">
  <div class="dl-samplegrid">
    <PixelImage v-for="i in 9" :key="i" pattern="smiley" :noise="0.04" :seed="i" :size="46" tone="danger" />
  </div>
  <span class="dl-secondary">what a collapsed G makes</span>
</div>
</div>

<div class="dl-tight mt-3">

<v-clicks>

- Nothing in $V$ rewards **variety** — only each sample looking real
- $D$ learns to reject the smiley, so $G$ jumps to **another** single output. Forever

</v-clicks>

</div>

<div v-click class="mt-2 dl-callout">

Every sample looks excellent, and the model is worthless. The loss curve shows
nothing.

</div>

<!--
This is the slide practitioners care most about, and the two grids are the whole
explanation: left, the variety of the real data; right, nine perfect smileys. Each
individual sample would fool a detective. Together they are useless.

The diagnostic point is the callout: you cannot detect mode collapse from the
loss, because a GAN's loss does not go down in the first place. You detect it by
looking at a grid of samples — exactly like this one — or by measuring coverage.

The chasing behaviour has a name — cycling — and it is why "just train longer"
is not advice. The parameters are on an orbit, not a descent.

Next slides turn this failure into a number on the running example.
-->

---
layout: default
title: Four ways to say two distributions differ
---

# Four ways to say two distributions differ

<div class="dl-ledger dl-ledger--formula mt-1">

| | | |
| --- | --- | --- |
| total variation | $\mathrm{TV}(P,Q) = \sup_x \lvert P(x) - Q(x) \rvert$ | biggest single gap |
| Kullback–Leibler | $\mathrm{KL}(P \Vert Q) = \int P(x) \log \frac{P(x)}{Q(x)}\,dx$ | asymmetric; $\infty$ if $Q$ misses |
| Jensen–Shannon | $\mathrm{JS}(P,Q) = \tfrac{1}{2}\big(\mathrm{KL}(P\Vert M) + \mathrm{KL}(Q\Vert M)\big)$ | symmetric, $M = \tfrac{P+Q}{2}$ |
| earth-mover | $\mathrm{EM}(P,Q) = \inf_{\gamma} \mathbb{E}_{(u,v)\sim\gamma} \lVert u - v \rVert$ | cheapest way to move the mass |

</div>

<div class="grid grid-cols-[1.4fr_1fr] gap-6 mt-2 items-center">
<div v-click class="dl-callout">

Only the last one knows about **distance**. The other three ask how much mass is
misplaced, never how far it has to go.

</div>
<div v-click>

<svg viewBox="0 0 260 100" class="dl-diagram" role="img" aria-label="Earth-mover: moving a pile of sand one step costs less than moving it two steps">
  <defs>
    <marker id="em-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <line class="dl-dg-split" x1="10" y1="80" x2="250" y2="80" />
  <path class="dl-dg-fill is-muted" d="M20 80 Q 50 30 80 80 Z" />
  <path class="dl-dg-fill" d="M180 80 Q 210 30 240 80 Z" />
  <path class="dl-dg-arrow" marker-end="url(#em-arrow)" d="M60 40 C 100 10, 160 10, 196 40" />
  <text class="dl-dg-small" x="130" y="96" text-anchor="middle">cost = how much × how far</text>
</svg>

</div>
</div>

<!--
Do not derive any of these. The row that matters is the last one, and the
callout is the only thing they need to carry. The sketch is where the name comes
from: P and Q as two piles of sand, and EM is the cheapest total amount of
"how much sand times how far" to turn one pile into the other.

sup and inf mean "the largest" and "the smallest" over all choices; gamma is a
transport plan — which sand goes where. None of that needs to be on the board.

KL's asymmetry deserves one sentence: KL(P||Q) blows up where the model puts no
mass on real data, and KL(Q||P) blows up where the model invents data. Those are
two completely different failures and it matters which one you penalise.

JS is what a GAN minimises — the payoff slide in section 03. EM is what the
Wasserstein slide switches to. The whole section is that one substitution.
-->

---
layout: interactive
heading: The measure decides what "worse" means
title: The measure decides what "worse" means
aside-width: 18rem
---

<DivergenceLab />

::aside::

Three generators, four measures. Read the highlighted row across.

<v-clicks>

- Both collapsed generators score $\mathrm{JS} = 0.3183$. **Identical**
- $\mathrm{EM}$ says $2/3$ and $1$ — mode 3 is *two* steps from mode 1

</v-clicks>

<div v-click class="mt-2 dl-callout">

JS cannot tell these two apart, so there is no gradient between them.

</div>

<!--
This is the second payoff of the deck and it is entirely checkable by hand. Move
the mass yourself — the sand piles from the previous slide: collapsed-on-mode-2
needs one third moved one step left and one third moved one step right, so 2/3.
Collapsed-on-mode-3 needs one third moved two steps and one third moved one step,
so 1.

Then say the consequence plainly: if two configurations score the same, the
gradient between them is zero, and no amount of training moves you from the worse
one to the better one. JS has no opinion. That is the disease, and Wasserstein is
the prescription.

The KL column being infinite twice is why nobody trains on KL directly.
-->

---
layout: default
title: Wasserstein, and what came after
---

# Wasserstein, and what came after

<div class="grid grid-cols-[1.05fr_1fr] gap-6 mt-1 items-center">
<div>

<Plot2D
  :x-domain="[-2, 2]" :y-domain="[0, 2.1]"
  :width="420" :height="230"
  x-label="θ — how far Q sits from P"
  :x-ticks="[-2, -1, 0, 1, 2]" :y-ticks="[0, 0.69, 1, 2]"
>
  <PlotCurve :points="[[-2, 0.693], [-0.02, 0.693]]" color="var(--dl-danger)" :width="2.6" />
  <PlotCurve :points="[[0.02, 0.693], [2, 0.693]]" color="var(--dl-danger)" :width="2.6" />
  <PlotCurve :fn="(t) => Math.abs(t)" color="var(--dl-accent)" :width="2.6" />
  <PlotPoints :points="[{ x: 0, y: 0 }]" color="var(--dl-danger)" :radius="4" />
  <PlotLabel :at="[-1.95, 0.693]" text="JS = log 2, flat" color="var(--dl-danger)" :dy="-8" bold />
  <PlotLabel :at="[1.1, 1.3]" text="EM = |θ|" color="var(--dl-accent)" bold />
</Plot2D>

</div>
<div class="dl-tight">

<v-clicks>

- **WGAN** (2017) — a *critic* with no sigmoid, whose loss estimates EM
- The critic must be **Lipschitz**: it cannot change faster than a fixed rate
- **WGAN-GP** enforces that with a gradient penalty
- **Spectral normalisation** does it per layer — now the default

</v-clicks>

</div>
</div>

<div v-click class="mt-2 dl-callout">

The critic's loss finally **correlates with sample quality** — the training curve
means something.

</div>

<div class="mt-1">
  <Citation source="Arjovsky, Chintala & Bottou, Wasserstein GAN (2017)" url="https://arxiv.org/abs/1701.07875" />
</div>

<!--
The plot is the WGAN paper's own argument, redrawn. P is a spike at 0 and Q a
spike at theta. Unless they overlap exactly, JS is log 2 whatever theta is — a
flat red line, zero gradient, no hint which way to move. EM is |theta|: a slope
pointing straight at the answer. That is why switching divergence fixes training.

The callout is the practical headline. Before WGAN, a GAN's loss curve told you
nothing at all; afterwards, the critic's estimate goes down as samples improve.
For anyone who has to train one of these, that is the difference between
engineering and guessing.

Lipschitz in one sentence: the critic is not allowed to change its output faster
than a fixed rate as the input moves. Without that, the number it reports is
arbitrary.

Do not go near the Kantorovich–Rubinstein duality. It is a graduate course.
-->

---
layout: default
title: The zoo, and the six that mattered
---

# The zoo, and the six that mattered

<div class="mt-4 flex justify-center">
<svg viewBox="0 0 660 190" class="dl-diagram" role="img" aria-label="A timeline of six GAN variants from 2014 to 2018">
  <line class="dl-dg-arrow" x1="20" y1="70" x2="640" y2="70" />
  <g v-for="(m, i) in [['cGAN', '2014', 'condition on', 'a label'], ['DCGAN', '2015', 'convolutions', '+ rules'], ['pix2pix', '2016', 'image → image,', 'paired'], ['CycleGAN', '2017', 'image → image,', 'no pairs'], ['WGAN-GP', '2017', 'a loss that', 'means something'], ['StyleGAN', '2018', '1024² faces,', 'steerable z']]" :key="i">
    <circle :class="['dl-dg-dot', i % 2 ? '' : 'is-accent']" :cx="60 + i * 108" cy="70" r="8" />
    <text class="dl-dg-small" :x="60 + i * 108" y="44" text-anchor="middle">{{ m[1] }}</text>
    <text class="dl-dg-lab is-sm" :x="60 + i * 108" y="102" text-anchor="middle">{{ m[0] }}</text>
    <text class="dl-dg-small" :x="60 + i * 108" y="122" text-anchor="middle">{{ m[2] }}</text>
    <text class="dl-dg-small" :x="60 + i * 108" y="138" text-anchor="middle">{{ m[3] }}</text>
  </g>
  <g v-click>
    <PixelImage in-svg :x="336" :y="148" :size="36" pattern="house" />
    <text class="dl-dg-small" x="382" y="170">→</text>
    <PixelImage in-svg :x="396" :y="148" :size="36" pattern="house" :noise="0.18" :seed="2" tone="accent" />
    <text class="dl-dg-small" x="440" y="170">CycleGAN: translate there and back</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-secondary">

Over 500 named variants exist — *the GAN zoo*. Almost all change the loss, the
conditioning, or the normalisation.

</div>

<div class="mt-2">
  <Citation source="Hindupur, The GAN Zoo" url="https://github.com/hindupuravinash/the-gan-zoo" />
</div>

<!--
Walk the timeline left to right. Four years, six ideas, and every one of them is
a change to the loss, the conditioning, or the architecture — the two-network
game underneath never changes.

CycleGAN is the one to spend time on if there is any: no paired data at all, just
two unpaired collections and a loss saying "translate there and back and you
should get the original". Horses to zebras. It is the most-copied idea in the
list.

StyleGAN is worth naming because its latent space is the one everybody's "edit
the smile" demo used, and because it is still, in 2026, competitive on faces
specifically while having been comprehensively beaten everywhere else.

The zoo link is honest about the field: 500 variants is not 500 ideas.
-->

---
layout: default
title: What this is actually used for
---

# What this is actually used for

Synthetic data where the real thing cannot be shared — our own research area.

<div class="grid grid-cols-[1fr_1.35fr] gap-6 mt-2 items-center">
<div class="dl-tight">

<v-clicks>

- **privacy** — data that can leave the hospital
- **scarcity** — more of the rare condition
- **balance** — the small class, generated
- **labels** — image **and** mask, together

</v-clicks>

</div>
<div>

<svg viewBox="0 0 400 200" class="dl-diagram is-sm-h" role="img" aria-label="Real scans stay behind the hospital wall; a generator trained inside produces synthetic images with masks that can leave">
  <defs>
    <marker id="md-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-fill is-muted" x="4" y="14" width="186" height="176" rx="8" />
  <text class="dl-dg-small" x="14" y="32">inside the hospital</text><g transform="translate(118 20)"><path class="dl-dg-arrow" style="stroke-width: 1.5" d="M2.5 7 V4 a3.5 3.5 0 0 1 7 0 V7" /><rect class="dl-dg-bar" x="0" y="7" width="12" height="9" rx="1.5" /></g>
  <PixelImage in-svg :x="16" :y="44" :size="42" pattern="moon" />
  <PixelImage in-svg :x="62" :y="44" :size="42" pattern="star" />
  <PixelImage in-svg :x="16" :y="92" :size="42" pattern="tree" />
  <text class="dl-dg-small" x="16" y="152">real scans</text>
  <polygon class="dl-dg-net" points="116,70 176,82 176,108 116,120" />
  <text class="dl-dg-in" x="146" y="99" text-anchor="middle">G</text>
  <path class="dl-dg-arrow" marker-end="url(#md-arrow)" d="M108 95 H114" />
  <rect class="dl-dg-box" x="196" y="10" width="8" height="184" />
  <path class="dl-dg-arrow" marker-end="url(#md-arrow)" d="M178 95 H226" />
  <PixelImage in-svg :x="234" :y="50" :size="50" pattern="star" :noise="0.1" :seed="8" tone="accent" />
  <PixelImage in-svg :x="292" :y="50" :size="50" pattern="checker:2:1" tone="accent" />
  <text class="dl-dg-small" x="259" y="118" text-anchor="middle">image</text>
  <text class="dl-dg-small" x="317" y="118" text-anchor="middle">+ its mask</text>
  <text class="dl-dg-small is-good" x="290" y="150" text-anchor="middle">synthetic — can be shared</text>
</svg>

</div>
</div>

<div v-click class="mt-3 dl-callout">

A synthetic sample too close to a training example has leaked the very thing it
was meant to protect.

</div>

<!--
The picture is the privacy argument: the real scans never cross the wall; only
the generator's samples do. The right-hand pair is the labels argument — image
and segmentation mask generated together, so nobody has to draw the mask. (The
"mask" here is just a filled square, for the picture.)

Two of our own papers sit behind this slide and are worth naming: DeepFake ECGs
(Scientific Reports, 2021) generates 12-lead traces good enough to train on, and
SinGAN-Seg (PLOS ONE, 2022) generates a polyp image together with its
segmentation mask. Both are GAN work and both are about the first two bullets.

The callout is not a disclaimer, it is a measurement problem: memorisation has to
be tested for, usually by nearest-neighbour distance against the training set.
"It looks different" is not evidence.

Next week's session is where the applications get their proper treatment.
-->

---
layout: default
---

<div class="grid grid-cols-[1.7fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="Sharp samples, flat noisy loss curves. What do you check first?"
  :items="[
    'Lower the learning rate — losses should fall',
    'Whether the samples are all the same',
    'More D steps per G step',
    'Nothing — flat losses are expected, sharp samples are the goal',
  ]"
/>

</div>
<div class="mt-12 flex flex-col items-center gap-2">
  <div class="dl-samplegrid">
    <PixelImage v-for="i in 9" :key="i" pattern="star" :noise="0.04" :seed="i + 20" :size="40" />
  </div>
  <svg viewBox="0 0 200 50" width="200" height="50" role="img" aria-label="A flat noisy loss curve">
    <path class="dl-dg-line is-muted" d="M4 26 L14 20 L24 30 L34 22 L44 28 L54 18 L64 27 L74 24 L84 31 L94 21 L104 26 L114 19 L124 29 L134 23 L144 27 L154 20 L164 28 L174 24 L184 27 L196 22" />
  </svg>

<div v-click class="mt-4 dl-reveal dl-reveal--side">

Look at a grid of samples

</div>

<div v-click class="mt-2 dl-secondary">

Flat noisy losses are normal — there is no minimum to descend to. Sharp samples
with no variety is mode collapse, invisible in every number you are logging.

</div>

</div>
</div>

<!--
The sketch on the right is the situation in the question: nine sharp samples and
a flat noisy curve. Let someone notice the nine are all stars before revealing.

Option 4 is the trap and it is half right, which is what makes it useful: flat
losses really are expected. The error is concluding that everything is therefore
fine.

Option 1 is the instinct carried over from every other lecture in this course and
it is the one to name explicitly as not applying here.

The practical habit to leave them with: log a fixed grid of samples from a fixed
set of z every epoch, and watch the grid, not the curves. If the columns stop
differing, you have collapsed.
-->

---
layout: section
index: "05"
---

# What replaced them: diffusion

<div class="dl-side-glyph"><FamilyGlyph kind="diffusion" :size="190" /></div>

---
layout: default
title: Destroying an image is easy
---

# Destroying an image is easy

The adversarial game exists because we could not write down a loss. Diffusion
finds one, by going backwards.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 170" class="dl-diagram is-sm-h" role="img" aria-label="Adding noise step by step turns an image into pure noise with no learning; a network learns to undo one step at a time">
  <defs>
    <marker id="df-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <path class="dl-dg-arrow" marker-end="url(#df-arrow)" d="M40 22 H620" />
  <text class="dl-dg-small" x="330" y="14" text-anchor="middle">add a little noise, repeat — arithmetic, no network</text>
  <g v-for="(n, i) in [0, 0.15, 0.35, 0.6, 0.85, 1]" :key="i">
    <PixelImage in-svg :x="20 + i * 108" :y="34" :size="84" pattern="smiley" :noise="n" :seed="31" />
    <text class="dl-dg-small" :x="62 + i * 108" y="132" text-anchor="middle">t = {{ [0, 200, 400, 600, 800, 1000][i] }}</text>
  </g>
  <g v-click>
    <path class="dl-dg-grad is-good" marker-end="url(#df-arrow)" d="M620 146 H40" />
    <text class="dl-dg-small is-good" x="330" y="164" text-anchor="middle">generate: learn to undo ONE small step, then repeat</text>
  </g>
</svg>
</div>

<div class="dl-tight">

<v-clicks>

- Undoing a *little* noise is plain regression — MSE
- So the hard problem — noise to image — is a thousand easy ones stacked

</v-clicks>

</div>

<div class="mt-2">
  <Citation source="Ho, Jain & Abbeel, Denoising Diffusion Probabilistic Models (2020)" url="https://arxiv.org/abs/2006.11239" />
</div>

<!--
The strip is the whole section. Top arrow: forwards, a smiley dissolving into
static — no network, no training, just adding Gaussian noise. Bottom arrow
(click): backwards is what we learn, one small step at a time. From here on,
the glyph for this section is exactly this strip.

It is worth saying that this is the same move as the denoising autoencoder from
section 01 — corrupt, then ask for the clean version — with one addition that
turns it into a generative model: do it at *every* noise level, with the level as
an input.

Sohl-Dickstein et al. published the idea in 2015 and nobody noticed. Ho et al. in
2020 made it work, and the difference was mostly parameterisation and scale. That
is a useful pattern to point out.
-->

---
layout: default
title: The forward process, in one step
---

# The forward process, in one step

Because Gaussians add up to a Gaussian, the whole chain has a closed form:

<div class="dl-math-sm">

$$
\mathbf{x}_t \;=\; \sqrt{\bar\alpha_t}\,\mathbf{x}_0 \;+\; \sqrt{1 - \bar\alpha_t}\,\boldsymbol\epsilon,
\qquad \boldsymbol\epsilon \sim \mathcal{N}(\mathbf{0}, I)
$$

</div>

<div class="dl-pixrow mt-2">
  <span class="dl-op">√ᾱ ×</span>
  <PixelImage pattern="smiley" :size="78" label="x₀ — clean" />
  <span class="dl-op">+ √(1−ᾱ) ×</span>
  <PixelImage pattern="noise" :seed="31" :size="78" label="ε — fresh noise" />
  <span class="dl-op">=</span>
  <PixelImage pattern="smiley" :noise="0.5" :seed="31" :size="78" tone="accent" label="xₜ — any level" />
</div>

<div class="dl-tight mt-3">

<v-clicks>

- $t$ is a **noise level**, from 0 (clean) to $T$ (pure noise)
- $\bar\alpha_t$ falls from $\approx 1$ to $\approx 0$ — a mixing dial between image and noise
- Any level costs **one** multiply-add. No chain is ever simulated

</v-clicks>

</div>

<!--
This is the most important equation in the section and the picture under it is
the equation, read left to right: a bit of the clean image plus a bit of fresh
noise gives the noisy version at level t. Change the dial and you get any other
column of the previous slide — directly, without the ones in between.

The two square roots sum in quadrature so the variance stays at 1 — the scale of
x_t does not drift as t grows, which matters for the network's input.

Notation: alpha_t = 1 - beta_t is the per-step survival, and alpha-bar_t is their
running product. Students trip over the bar; say it out loud as "alpha bar".

Note the collision if anyone raises it: this beta_t is the diffusion schedule and
has nothing to do with the VAE's beta. The field reuses the letter; the deck only
ever puts one of them on a slide.

This is why training is affordable: otherwise one example at t = 900 would cost
900 sequential steps. Forward is parallel and closed-form; reverse, as we will
see, is sequential.
-->

---
layout: interactive
heading: Forward — no network involved
title: Forward — no network involved
aside-width: 20rem
---

<DiffusionLab />

::aside::

The three modes again, as blobs. Drag $t$ from 0 to 47.

<v-clicks>

- $\sqrt{\bar\alpha_t}$ is image left, $\sqrt{1-\bar\alpha_t}$ is noise
- By $t = 47$ the clusters are gone
- Every frame comes from $\mathbf{x}_0$ **directly**

</v-clicks>

<div v-click class="mt-2 dl-callout">

Nothing was trained.

</div>

<!--
Scrub slowly and read the two coefficients as you go. Around t = 20 the clusters
are still just distinguishable, which is the regime where most of the model's
useful learning happens — at very low t there is nothing to remove and at very
high t there is nothing left to recover.

Say the three-modes connection explicitly: same example as sections 03 and 04,
drawn on a plane instead of as bars. The widget uses 48 steps rather than 1000 so
it can be scrubbed.

Then flip to reverse for the slide after next, and note that the widget has to
walk every step to get there.
-->

---
layout: default
title: What the network is asked to do
---

# What the network is asked to do

Given a noisy image and its noise level, **predict the noise that was added**.

<div class="dl-pixrow mt-2">
  <PixelImage pattern="smiley" :noise="0.5" :seed="31" :size="74" tone="accent" label="xₜ" />
  <span class="dl-op">, t →</span>
  <svg viewBox="0 0 120 80" width="120" height="80" role="img" aria-label="the denoising network">
    <polygon class="dl-dg-net" points="4,10 58,30 58,50 4,70" />
    <polygon class="dl-dg-net" points="116,10 62,30 62,50 116,70" />
    <text class="dl-dg-in" x="60" y="78" text-anchor="middle">ε<tspan baseline-shift="sub" style="font-size: 10px">θ</tspan></text>
  </svg>
  <span class="dl-op">→</span>
  <PixelImage pattern="noise" :seed="31" :size="74" label="predicted ε" />
  <span v-click class="dl-op is-accent">⇒ subtract ⇒</span>
  <PixelImage v-click pattern="smiley" :noise="0.12" :seed="32" :size="74" tone="accent" label="a step cleaner" />
</div>

<div class="dl-math-sm mt-1">

$$
\mathcal{L} \;=\; \mathbb{E}_{\mathbf{x}_0,\, t,\, \boldsymbol\epsilon}\Big[\big\lVert \boldsymbol\epsilon - \boldsymbol\epsilon_\theta(\mathbf{x}_t, t) \big\rVert^2\Big]
$$

</div>

<div v-click class="mt-1 dl-callout">

A **mean squared error**, on noise. $t$ is an input, so **one** network covers
every noise level.

</div>

<!--
Read the strip left to right: noisy image and its level in, the network's guess
of the noise out, and subtracting that guess gives an image one step cleaner.

epsilon_theta is the network — theta its weights, as always. Its shape is image
in, image out: the same shape as the autoencoder, which is why the denoiser in
practice is a CNN (slide "What the denoiser is made of").

The room's reasonable objection: this is MSE, and section 02 said MSE gives you
blur. The answer is the whole trick, and it is worth stating carefully: MSE on a
*small* denoising step is fine, because at small noise there is only one
plausible answer. The blur in a VAE came from averaging over genuinely different
images; here the ambiguity is spread across a thousand tiny steps and the
randomness is re-injected at each one. That is the last poll of the section.

Why predict epsilon rather than x_0: the target has unit variance at every t, so
one network with one loss scale handles the whole range. Predicting x_0 directly
works but trains worse, and Ho et al. found this empirically.
-->

---
layout: interactive
heading: Reverse — what the sampler follows
title: Reverse — what the sampler follows
aside-width: 20rem
---

<DiffusionLab reverse field />

::aside::

Press **show the field**: the arrows are what the network is trained to output.

<v-clicks>

- High $t$ — vaguely inward, no mode chosen
- Low $t$ — it sharpens, samples commit

</v-clicks>

<div v-click class="mt-2 dl-callout">

Each step needs the one before. Hence slow.

</div>

<!--
Because the data here is a Gaussian mixture, the exact field is available in
closed form, so the widget draws the true target rather than an approximation.
Say that: the room is looking at exactly what a trained network is fitted to, and
nothing is faked.

The high-t behaviour is the interesting part. The field is nearly symmetric, so
which mode a sample ends up in is decided by tiny differences early on. That is
the diversity, and it is the property mode collapse destroyed.

Contrast with the forward slide: there, any frame in one step. Here, forty-seven
steps to get one sample. Training parallel, sampling sequential.
-->

---
layout: default
title: Three lines, and no adversary
---

# Three lines, and no adversary

```python {all|2-4|6-7|all}{lines:true}
for x0 in loader:
    t = torch.randint(0, T, (x0.size(0),), device=dev)      # a level per example
    eps = torch.randn_like(x0)
    xt = ab[t].sqrt() * x0 + (1 - ab[t]).sqrt() * eps       # the closed form

    loss = F.mse_loss(model(xt, t), eps)                    # that is the whole loss
    opt.zero_grad(); loss.backward(); opt.step()
```

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 130" class="dl-diagram" role="img" aria-label="A GAN has two networks and two noisy losses that never settle; diffusion has one network and a loss that goes down">
  <text class="dl-dg-lab is-sm" x="160" y="16" text-anchor="middle">GAN — 2 networks, 2 optimisers, detach</text>
  <line class="dl-dg-split" x1="20" y1="110" x2="300" y2="110" />
  <path class="dl-dg-line is-bad" d="M20 60 L40 48 L60 70 L80 52 L100 66 L120 45 L140 72 L160 50 L180 64 L200 46 L220 70 L240 52 L260 66 L280 48 L300 62" />
  <path class="dl-dg-line is-muted" d="M20 80 L40 90 L60 74 L80 92 L100 78 L120 94 L140 76 L160 90 L180 80 L200 95 L220 76 L240 88 L260 78 L280 93 L300 80" />
  <text class="dl-dg-small" x="160" y="126" text-anchor="middle">two losses that never settle — no meaning</text>
  <line class="dl-dg-split" x1="330" y1="6" x2="330" y2="126" />
  <g v-click>
    <text class="dl-dg-lab is-sm" x="500" y="16" text-anchor="middle">diffusion — 1 network, 1 optimiser</text>
    <line class="dl-dg-split" x1="360" y1="110" x2="640" y2="110" />
    <path class="dl-dg-line" d="M360 30 C 400 70, 440 88, 500 96 S 600 102, 640 103" />
    <text class="dl-dg-small is-good" x="500" y="126" text-anchor="middle">one regression loss that goes down — stop when it stops</text>
  </g>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

The answer to the whole of section 04. Not a better adversary — **no** adversary.

</div>

<!--
Put the GAN training-loop slide and this one side by side if you can. Eleven
lines with two optimisers and a detach, against seven with neither. The sketch is
what the two logs look like: the GAN's two losses wander forever; the diffusion
loss is an ordinary falling training curve. That comparison is the strongest
argument in the lecture and it needs no commentary.

"The loss goes down" deserves emphasis after the GAN section. It is a supervised
regression problem, so every habit from weeks 2 to 5 applies again: watch the
curve, early-stop, tune the schedule.

`ab` is alpha-bar, precomputed for every t. The `ab[t]` indexing hides a
broadcast — for images it needs reshaping to (B, 1, 1, 1). Mention it, because it
is the first thing that breaks when they write this themselves.
-->

---
layout: default
title: The cost is at the other end
---

# The cost is at the other end

GANs are one forward pass per sample. Diffusion is many.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 200" class="dl-diagram is-sm-h" role="img" aria-label="Forward passes per sample on a log scale: GAN 1, DDPM 1000, DDIM about 50, distilled models about 4">
  <g v-for="(t, i) in [1, 10, 100, 1000]" :key="`t${i}`">
    <line class="dl-dg-split" :x1="230 + i * 130" y1="14" :x2="230 + i * 130" y2="170" />
    <text class="dl-dg-small" :x="230 + i * 130" y="188" text-anchor="middle">{{ t }}</text>
  </g>
  <text class="dl-dg-small" x="620" y="200" text-anchor="end">forward passes per sample (log scale)</text>
  <g v-for="(b, i) in [['GAN', 1, 'is-q', '1'], ['DDPM, as published (2020)', 1000, 'is-bad', '1000'], ['DDIM sampler', 50, '', '20–50'], ['distilled / consistency', 4, 'is-q', '1–4']]" :key="i">
    <text class="dl-dg-lab is-sm" x="220" :y="38 + i * 38" text-anchor="end">{{ b[0] }}</text>
    <rect :class="['dl-dg-bar', b[2]]" x="230" :y="24 + i * 38" :width="Math.max(Math.log10(b[1]) * 130, 5)" height="20" rx="4" />
    <text class="dl-dg-small" :x="238 + Math.max(Math.log10(b[1]) * 130, 5)" :y="38 + i * 38">{{ b[3] }}</text>
  </g>
</svg>
</div>

<div class="dl-tight">

<v-clicks>

- **DDIM** takes bigger, noise-free strides with the **same** trained model
- **Distillation** trains a student to do in one step what the teacher did in many

</v-clicks>

</div>

<div v-click class="mt-2 dl-callout">

Sampling cost turned out to be an engineering problem. Training stability did not.

</div>

<!--
The bar chart is on a log scale — say so, because the DDPM bar is a thousand
times the GAN's, not four times. The bottom bar is where 2026 sits: one to four
passes, close to the GAN again.

The callout is the honest verdict on why diffusion won. GANs had one advantage —
single-pass sampling — and five years of work closed that gap, while nobody
closed the stability gap the other way.

DDIM in one sentence: the same trained network, stepped deterministically
instead of re-injecting noise each step, so you can take coarser steps. It also
makes the noise-to-image map fixed, which is what makes interpolating between two
samples possible.

Consistency models (Song et al., 2023) are the current end of this line and get
usable images in one or two passes.
-->

---
layout: default
title: How the prompt gets in
---

# How the prompt gets in

The network already takes $t$. Give it a description of what you want, $c$, too.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 170" class="dl-diagram is-sm-h" role="img" aria-label="A prompt is turned into a vector by a separate pretrained text encoder, and fed into the denoiser alongside the noisy image and the noise level">
  <defs>
    <marker id="pr-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="8" y="20" width="150" height="34" rx="6" />
  <text class="dl-dg-lab is-sm" x="83" y="42" text-anchor="middle">“a smiling face”</text>
  <path class="dl-dg-arrow" marker-end="url(#pr-arrow)" d="M160 37 H190" />
  <rect class="dl-dg-box" x="194" y="14" width="120" height="46" rx="6" />
  <text class="dl-dg-small" x="254" y="34" text-anchor="middle">text encoder</text>
  <text class="dl-dg-small" x="254" y="50" text-anchor="middle">(pretrained, frozen)</text>
  <path class="dl-dg-arrow" marker-end="url(#pr-arrow)" d="M316 37 H346" />
  <g v-for="i in 6" :key="i"><rect class="dl-dg-box is-accent" :x="350 + (i - 1) * 14" y="28" width="12" height="18" rx="2" /></g>
  <text class="dl-dg-lab is-sm" x="392" y="20" text-anchor="middle">c — a vector</text>
  <path class="dl-dg-arrow" marker-end="url(#pr-arrow)" d="M392 50 V86" />
  <PixelImage in-svg :x="120" :y="92" :size="64" pattern="smiley" :noise="0.55" :seed="31" tone="accent" />
  <text class="dl-dg-small" x="152" y="168" text-anchor="middle">xₜ</text>
  <text class="dl-dg-lab is-sm" x="230" y="128" text-anchor="middle">t</text>
  <path class="dl-dg-arrow" marker-end="url(#pr-arrow)" d="M188 124 H320" />
  <polygon class="dl-dg-net" points="324,92 392,112 392,140 324,160" />
  <polygon class="dl-dg-net" points="460,92 392,112 392,140 460,160" />
  <text class="dl-dg-in" x="392" y="168" text-anchor="middle">ε<tspan baseline-shift="sub" style="font-size: 10px">θ</tspan>(xₜ, t, c)</text>
  <path class="dl-dg-arrow" marker-end="url(#pr-arrow)" d="M462 126 H500" />
  <PixelImage in-svg :x="506" :y="94" :size="64" pattern="noise" :seed="31" />
  <text class="dl-dg-small" x="538" y="172" text-anchor="middle">predicted noise</text>
</svg>
</div>

<div class="dl-tight">

<v-clicks>

- A **separate** network turns the prompt into a vector $c$ — trained once, kept frozen
- $c$ goes into every block, just like $t$ does
- Drop the caption **10% of the time** in training, so one network learns both
  "with $c$" and "without"

</v-clicks>

</div>

<!--
Keep the text encoder a black box. All the room needs is: a pretrained network
turns a sentence into a list of numbers, and those numbers are fed to the
denoiser as another input, exactly as t is. How the text encoder works, and the
exact mechanism by which each layer reads c, belong to later material on
language models — none of it is needed for the idea on this slide. (For a class
label instead of a sentence, c is just an embedding of the label.)

The 10% caption dropout is the whole trick and it is one line in a dataloader.
With it, the same network can predict the noise both with and without the
prompt, and the next slide uses the difference between the two.
-->

---
layout: default
title: Pushing past the prompt
---

# Pushing past the prompt

<div class="grid grid-cols-[1fr_1.1fr] gap-6 mt-1 items-center">
<div>

<svg viewBox="0 0 320 240" class="dl-diagram is-xs" role="img" aria-label="From the noisy image, the unconditional and the conditional predictions point in slightly different directions; guidance extends the difference">
  <defs>
    <marker id="cf-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <circle class="dl-dg-dot" cx="40" cy="200" r="7" />
  <text class="dl-dg-small" x="20" y="228">xₜ</text>
  <path class="dl-dg-line is-muted" marker-end="url(#cf-arrow)" d="M40 200 L180 150" />
  <text class="dl-dg-small" x="186" y="152">without c</text>
  <path class="dl-dg-line" marker-end="url(#cf-arrow)" d="M40 200 L170 100" />
  <text class="dl-dg-small is-good" x="120" y="92">with c</text>
  <path class="dl-dg-grad" d="M180 150 L170 100" />
  <g v-click>
    <path class="dl-dg-line is-bad" style="stroke-dasharray: 6 4" marker-end="url(#cf-arrow)" d="M40 200 L150 20" />
    <text class="dl-dg-small is-bad" x="156" y="24">w = 3: push further</text>
  </g>
</svg>

</div>
<div>

<div class="dl-math-sm">

$$
\tilde{\boldsymbol\epsilon} = \boldsymbol\epsilon_\theta(\mathbf{x}_t, t) + w\big(\boldsymbol\epsilon_\theta(\mathbf{x}_t, t, c) - \boldsymbol\epsilon_\theta(\mathbf{x}_t, t)\big)
$$

</div>

<v-clicks>

- $w = 0$ — ignore the prompt
- $w = 1$ — ordinary "with $c$"
- $w > 1$ — **extrapolate** past it

</v-clicks>

</div>
</div>

<div v-click class="mt-2 dl-callout">

**Classifier-free guidance.** $w$ is the guidance scale — not a weight vector. It
is the "follow my prompt" slider in every image tool.

</div>

<div class="mt-1">
  <Citation source="Ho & Salimans, Classifier-Free Diffusion Guidance (2022)" url="https://arxiv.org/abs/2207.12598" />
</div>

<!--
The picture is the equation. Two predictions from the same network, with and
without the prompt, point in slightly different directions. Their difference
(the dashed segment) is "what the prompt adds". Guidance scales that difference
by w and adds it on: at w = 1 you land on the "with c" arrow; above 1 you shoot
past it, in the red direction.

Ask what w = 1 does before revealing: it is ordinary conditional sampling, since
the two terms collapse. Everything above 1 is an extrapolation, which is the next
slide.

It is called "classifier-free" because earlier work needed a separately trained
classifier to provide this push.
-->

---
layout: interactive
heading: The guidance slider
title: The guidance slider
aside-width: 19rem
---

<GuidanceLab />

::aside::

The prompt is *which mode do you want*. Drag $w$ from 0 to 8.

<v-clicks>

- $w = 0$ — ignored; samples on all three modes
- $w = 1$ — on-prompt, real data's spread
- $w = 7$ — on-prompt, **twice** that spread

</v-clicks>

<div v-click class="mt-2 dl-callout">

Past $w = 1$: a field no data ever had.

</div>

<!--
The w = 0 case is the one to start on: twelve of thirty-six on the asked-for
mode, which is one in three, which is chance. The prompt is genuinely doing
nothing.

Then w = 1: 36 of 36, spread 0.333 against the real data's 0.389. That is correct
conditional sampling and it is worth naming as the only value with a
justification.

Then push it up. Still 36 of 36 — so by the obvious metric it looks better — but
the spread has gone wrong. The usual phrasing is that guidance trades diversity
for fidelity; the more useful phrasing is that above 1 you are sampling from
p_cond·(p_cond/p_uncond)^(w-1), which is not a distribution anyone trained on. In
real image models the same cause shows up as over-saturation and blown-out
contrast. One cause, several symptoms.

Every tool ships a default between 3 and 8, which is why this matters.
-->

---
layout: default
title: Do it somewhere cheaper
---

# Do it somewhere cheaper

A 512 × 512 image is 786 432 numbers, visited fifty times. Most of it is detail.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 210" class="dl-diagram" role="img" aria-label="Latent diffusion: an encoder shrinks a 512 by 512 image to a 64 by 64 by 4 code, diffusion runs there, and a decoder turns the result back into an image">
  <defs>
    <marker id="ld-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <PixelImage in-svg :x="8" :y="30" :size="128" pattern="smiley" />
  <text class="dl-dg-small" x="72" y="186" text-anchor="middle">512 × 512 × 3</text>
  <polygon class="dl-dg-net" points="150,40 230,78 230,118 150,156" />
  <text class="dl-dg-in" x="190" y="102" text-anchor="middle">f</text>
  <rect class="dl-dg-box is-accent" x="250" y="80" width="36" height="36" rx="3" />
  <rect class="dl-dg-box is-accent" x="256" y="74" width="36" height="36" rx="3" />
  <text class="dl-dg-small" x="274" y="140" text-anchor="middle">64 × 64 × 4</text>
  <text class="dl-dg-small is-good" x="274" y="156" text-anchor="middle">48× smaller</text>
  <path class="dl-dg-grad is-good" marker-end="url(#ld-arrow)" d="M300 70 C 330 20, 220 20, 250 66" />
  <text class="dl-dg-small is-good" x="274" y="20" text-anchor="middle">all of diffusion runs here</text>
  <polygon class="dl-dg-net" points="386,78 466,40 466,156 386,118" />
  <text class="dl-dg-in" x="426" y="102" text-anchor="middle">g</text>
  <path class="dl-dg-arrow" marker-end="url(#ld-arrow)" d="M298 98 H380" />
  <path class="dl-dg-arrow" marker-end="url(#ld-arrow)" d="M468 98 H500" />
  <PixelImage in-svg :x="508" :y="30" :size="128" pattern="heart" tone="accent" />
  <text class="dl-dg-small" x="572" y="186" text-anchor="middle">decode once, at the end</text>
  <text class="dl-dg-small" x="190" y="200" text-anchor="middle">section 01's autoencoder</text>
  <text class="dl-dg-small" x="426" y="200" text-anchor="middle">section 01's autoencoder</text>
</svg>
</div>

<div v-click class="mt-2 dl-callout">

Section 01's autoencoder, section 05's diffusion model running inside it. That is
Stable Diffusion — and why it runs on a laptop.

</div>

<div class="mt-2">
  <Citation source="Rombach, Blattmann, Lorenz, Esser & Ommer, High-Resolution Image Synthesis with Latent Diffusion Models (2021)" url="https://arxiv.org/abs/2112.10752" />
</div>

<!--
This is the slide the autoencoder section was planted for, and it is worth saying
so: the thing we spent twenty minutes on and then declared "not a generative
model" turns out to be half of the most widely deployed generative model there is.

Read the picture: train an autoencoder first; encode to a 64 x 64 x 4 code, 48
times smaller than the image; run the *entire* diffusion loop in that small space;
decode once at the very end. The squares are drawn to scale against each other.

The division of labour is the elegant part. The autoencoder handles texture and
high-frequency detail, which is easy and local; the diffusion model handles
layout and meaning, which is hard and global. Each does the part it is good at.

The autoencoder here is trained with a perceptual loss and a small adversarial
term — so there is a GAN inside Stable Diffusion too, doing exactly the job
section 03 said an adversarial loss is good at. Worth a sentence; it delights
people.
-->

---
layout: default
title: What the denoiser is made of
---

# What the denoiser is made of

$\boldsymbol\epsilon_\theta$ takes an image and returns one. The classic choice is a
CNN shaped like a **U**.

<div class="grid grid-cols-[1.3fr_1fr] gap-6 mt-1 items-center">
<div>

<svg viewBox="0 0 400 220" class="dl-diagram" role="img" aria-label="A U-Net: convolutions shrink the image on the left, upsampling grows it on the right, and skip connections copy detail across">
  <defs>
    <marker id="un-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <g v-for="(b, i) in [[20, 20, 56], [60, 80, 40], [100, 140, 26]]" :key="`l${i}`">
    <rect class="dl-dg-box" :x="b[0]" :y="b[1]" width="30" :height="b[2]" rx="3" />
    <rect class="dl-dg-box" :x="350 - b[0]" :y="b[1]" width="30" :height="b[2]" rx="3" />
    <path class="dl-dg-grad is-good" marker-end="url(#un-arrow)" :d="`M${b[0] + 32} ${b[1] + b[2] / 2} H${346 - b[0]}`" />
  </g>
  <rect class="dl-dg-box is-accent" x="185" y="180" width="30" height="18" rx="3" />
  <path class="dl-dg-arrow" marker-end="url(#un-arrow)" d="M36 78 L66 96 M76 122 L106 138 M116 168 L182 188" />
  <path class="dl-dg-arrow" marker-end="url(#un-arrow)" d="M218 188 L276 168 M286 138 L316 122 M326 96 L352 80" />
  <text class="dl-dg-small" x="40" y="214">down: conv + stride</text>
  <text class="dl-dg-small" x="236" y="214">up: upsample + conv</text>
  <text class="dl-dg-small is-good" x="200" y="14" text-anchor="middle">skips copy detail across</text>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

- **Down**: the week-4 CNN
- **Up**: upsample-then-convolve, from section 04
- **Skips** keep detail the bottom loses

</v-clicks>

<div v-click class="mt-3 dl-secondary">

The biggest 2026 models swap the U-Net for a *transformer* — a different
architecture. The objective does not change.

</div>

</div>
</div>

<!--
The point of the slide is that the *architecture is not the idea*. Diffusion is a
training objective; you can implement it with anything that maps an image to an
image. Students routinely conflate "diffusion" with "U-Net" and it is worth
separating.

The U-Net (Ronneberger et al., 2015 — originally for medical segmentation) is
built entirely from parts the room knows: strided convolutions going down,
upsample-then-convolve going up (the checkerboard fix), and skip connections that
copy each level's feature map straight across so fine detail is not lost in the
bottleneck. It is an autoencoder with shortcuts.

The secondary line is deliberately a name only. Large current image and video
models (Stable Diffusion 3, Flux) use a transformer as the denoiser because it
scales better with compute. If the room has not met transformers, that is fine:
nothing about the diffusion objective depends on which network computes epsilon.
-->

---
layout: default
title: What actually gets trained in 2026
---

# What actually gets trained in 2026

The noising path was never essential. **Choose a straighter one.**

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 660 190" class="dl-diagram is-sm-h" role="img" aria-label="Diffusion paths from noise to data curve; rectified flow paths are straight and need fewer steps">
  <text class="dl-dg-lab is-sm" x="160" y="16" text-anchor="middle">diffusion — curved paths, many steps</text>
  <g v-for="(p, i) in [[40, 50, 280, 60], [40, 100, 280, 110], [40, 150, 280, 160]]" :key="`c${i}`">
    <circle class="dl-dg-dot" :cx="p[0]" :cy="p[1]" r="6" />
    <circle class="dl-dg-dot is-accent" :cx="p[2]" :cy="p[3]" r="6" />
    <path class="dl-dg-line is-muted" :d="`M${p[0]} ${p[1]} C ${p[0] + 60} ${p[1] - 50}, ${p[2] - 100} ${p[3] + 50}, ${p[2]} ${p[3]}`" />
    <circle v-for="k in 7" :key="k" class="dl-dg-dot" :cx="p[0] + (p[2] - p[0]) * k / 8" :cy="p[1] + (k % 2 ? -12 : 10)" r="2" />
  </g>
  <text class="dl-dg-small" x="40" y="182" text-anchor="middle">noise</text>
  <text class="dl-dg-small" x="280" y="182" text-anchor="middle">data</text>
  <line class="dl-dg-split" x1="330" y1="6" x2="330" y2="186" />
  <g v-click>
    <text class="dl-dg-lab is-sm" x="500" y="16" text-anchor="middle">rectified flow — straight paths, few steps</text>
    <g v-for="(p, i) in [[380, 50, 620, 60], [380, 100, 620, 110], [380, 150, 620, 160]]" :key="`s${i}`">
      <circle class="dl-dg-dot" :cx="p[0]" :cy="p[1]" r="6" />
      <circle class="dl-dg-dot is-accent" :cx="p[2]" :cy="p[3]" r="6" />
      <path class="dl-dg-line" :d="`M${p[0]} ${p[1]} L${p[2]} ${p[3]}`" />
      <circle v-for="k in 2" :key="k" class="dl-dg-dot is-accent" :cx="p[0] + (p[2] - p[0]) * k / 3" :cy="p[1] + (p[3] - p[1]) * k / 3" r="3" />
    </g>
    <text class="dl-dg-small" x="380" y="182" text-anchor="middle">noise</text>
    <text class="dl-dg-small" x="620" y="182" text-anchor="middle">data</text>
  </g>
</svg>
</div>

<div v-click class="mt-1 dl-secondary">

**Rectified flow:** $\mathbf{x}_t = (1-t)\,\mathbf{x}_0 + t\,\boldsymbol\epsilon$ — the
same shape as the forward process, with straight-line coefficients.

</div>

<div v-click class="mt-2 dl-callout">

Stable Diffusion 3 and Flux train this — with the same shape of MSE loss.

</div>

<!--
Do not derive any of this. The one sentence that matters: the noising path was a
free choice all along, diffusion made one choice, and a straighter choice needs
fewer sampling steps because the trajectory has less curvature to resolve. The
picture says it: seven small dots along each wiggly path on the left, two along
each straight one on the right.

The general name is flow matching (Lipman et al., 2022): regress a velocity field
that carries noise to data along a path you choose. Diffusion is one particular
choice of path in this family; rectified flow is the straight one.

The linear interpolation is worth writing next to the forward-process equation.
Same shape, different coefficients — and that really is most of the difference.

If someone asks whether diffusion is now obsolete: the objective is not, the
particular schedule is. Papers still say "diffusion" for the whole family and
that is fine.
-->

---
layout: default
---

<div class="grid grid-cols-[1.6fr_1fr] gap-6 items-start">
<div>

<PollSlide
  question="Why does diffusion's MSE loss not blur, when the VAE's did?"
  :items="[
    'Because it uses a U-Net rather than fully-connected layers',
    'Because the loss is on noise, not on pixels',
    'Because each step removes only a little noise — one plausible answer',
    'Because the adversarial term in the autoencoder fixes it',
  ]"
/>

</div>
<div class="mt-10">

<svg viewBox="0 0 260 190" class="dl-diagram" role="img" aria-label="A VAE makes one big jump between two possible answers and lands in the middle; diffusion takes many small steps and commits to one">
  <defs>
    <marker id="pb-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path class="dl-dg-head" d="M0 0 L6 3 L0 6 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="4" y="14">one big guess</text>
  <circle class="dl-dg-dot" cx="20" cy="50" r="5" />
  <circle class="dl-dg-dot is-accent" cx="230" cy="24" r="6" />
  <circle class="dl-dg-dot is-accent" cx="230" cy="76" r="6" />
  <path class="dl-dg-line is-bad" marker-end="url(#pb-arrow)" d="M26 50 H214" />
  <text class="dl-dg-small is-bad" x="170" y="44" text-anchor="middle">average</text>
  <text class="dl-dg-small" x="4" y="112">many small steps</text>
  <circle class="dl-dg-dot" cx="20" cy="150" r="5" />
  <circle class="dl-dg-dot is-accent" cx="230" cy="124" r="6" />
  <circle class="dl-dg-dot is-accent" cx="230" cy="176" r="6" />
  <path class="dl-dg-line" marker-end="url(#pb-arrow)" d="M26 150 L60 146 L94 140 L128 136 L162 130 L196 126 L220 124" />
</svg>


<div v-click class="mt-4 dl-reveal dl-reveal--side">

One small step has one plausible answer

</div>

<div v-click class="mt-2 dl-secondary">

A VAE averages different images. One small denoising step is nearly
unambiguous.

</div>

</div>
</div>

<!--
The sketch is the answer drawn: top, one jump from a code to two possible
images lands exactly between them — the blurry average from section 02. Bottom,
many small steps; each one is almost unambiguous, the noise added at each step
nudges the path, and it ends committed to one image.

Option 2 is the attractive wrong answer: predicting noise instead of pixels is a
reparameterisation, and MSE would blur just the same if the step were large. The
step size is the reason, not the target.

This is the single best question to ask on the whole section, because getting it
right means holding section 02 and section 05 in mind at once.

The one-liner to leave them with: a VAE makes one hard guess, diffusion makes a
thousand easy ones.
-->

---
layout: section
index: "06"
---

# Choosing one

<div class="dl-side-glyph"><FamilyGlyph kind="choose" :size="190" /></div>

---
layout: default
title: Five families, side by side
---

# Five families, side by side

<div class="dl-ledger dl-ledger--compare mt-1">

| | quality | sampling | training | likelihood | editable code |
| --- | --- | --- | --- | --- | --- |
| <FamilyGlyph kind="ae" :size="30" /> **autoencoder** | — | 1 pass | easy | no | with holes |
| <FamilyGlyph kind="vae" :size="30" /> **VAE** | soft | 1 pass | easy | bound | **yes** |
| <FamilyGlyph kind="gan" :size="30" /> **GAN** | sharp | **1 pass** | **fragile** | none | yes |
| <FamilyGlyph kind="diffusion" :size="30" /> **diffusion / flow** | **sharp** | 1–50 | **stable** | bound | partly |
| <PixelImage pattern="checker:2:1" :size="26" /> **pixel by pixel** | sharp | 1 **per pixel** | stable | **exact** | no |

</div>

<div v-click class="mt-3 dl-callout">

No row wins. Pick the column you cannot compromise on, then read across.

</div>

<!--
Walk the columns rather than the rows, because the columns are the decisions.
Need a density for anomaly detection? Only the last row gives you one exactly.
Need real time? The GAN column is still the simplest single-pass option that
produces sharp output. Need reliability of training more than anything? Row four.

The glyphs are the section emblems again, so each row points back to the section
where it was built.

The pixel-by-pixel row is PixelCNN from the opening section, included so the one
model that gives an exact likelihood sits in the same table.

Note the autoencoder row has a dash for quality, because it does not generate at
all. Keep that honest.
-->

---
layout: default
title: How do you know it is any good?
---

# How do you know it is any good?

No held-out accuracy here. The answer is a **distance between two clouds**.

<div class="grid grid-cols-[1.15fr_1fr] gap-6 mt-1 items-center">
<div>

<svg viewBox="0 0 380 210" class="dl-diagram is-sm-h" role="img" aria-label="Real and generated images are turned into features; a Gaussian is fitted to each cloud and FID is the distance between them; a collapsed generator makes a tiny cloud">
  <defs>
    <marker id="fid-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <ellipse class="dl-dg-fill is-muted is-dashed" cx="110" cy="100" rx="80" ry="55" />
  <circle v-for="(p, i) in [[70,80],[100,120],[140,90],[120,70],[90,105],[150,120],[60,110],[130,135]]" :key="`r${i}`" class="dl-dg-dot" :cx="p[0]" :cy="p[1]" r="4" />
  <text class="dl-dg-small" x="110" y="176" text-anchor="middle">real — features of real images</text>
  <ellipse class="dl-dg-fill is-dashed" cx="270" cy="92" rx="70" ry="50" />
  <circle v-for="(p, i) in [[240,80],[270,110],[300,85],[280,65],[250,100],[310,110],[235,95]]" :key="`g${i}`" class="dl-dg-dot is-accent" :cx="p[0]" :cy="p[1]" r="4" />
  <text class="dl-dg-small is-good" x="280" y="160" text-anchor="middle">generated</text>
  <path class="dl-dg-arrow" marker-end="url(#fid-arrow)" d="M112 100 H264" />
  <text class="dl-dg-lab is-sm" x="190" y="92" text-anchor="middle">FID</text>
  <g v-click>
    <circle v-for="(p, i) in [[330,180],[334,184],[328,186]]" :key="`c${i}`" class="dl-dg-dot is-bad" :cx="p[0]" :cy="p[1]" r="3" />
    <text class="dl-dg-small is-bad" x="320" y="204" text-anchor="end">collapsed G: a tiny cloud → bad FID</text>
  </g>
</svg>

</div>
<div class="dl-tight">

<v-clicks>

- **FID** — features from a fixed pretrained CNN; fit a Gaussian to each set; measure the gap. Lower is better
- It sees **variety** as well as quality
- Biased by sample count, and gameable

</v-clicks>

</div>
</div>

<div v-click class="mt-2 dl-callout">

Everyone reports FID; nobody fully trusts it. Look at samples too.

</div>

<div class="mt-1">
  <Citation source="Heusel et al., GANs Trained by a Two Time-Scale Update Rule (2017) — FID" url="https://arxiv.org/abs/1706.08500" />
</div>

<!--
FID is the Fréchet Inception Distance. The picture: push every real image and
every generated image through a pretrained ImageNet CNN (Inception), keep the
feature vector, and you get two clouds. Fit a Gaussian to each — the dashed
ellipses — and FID is the distance between them, counting both where the centres
are and how spread the clouds are.

The variety sensitivity is the click: a collapsed GAN makes a tiny cloud, and
even if it sits inside the real one the spread term punishes it. That is why FID
replaced Inception Score, which a model producing one perfect example per class
could fool.

The sample-count bias is a practical trap worth stating: FID computed on 1000
samples is not comparable to FID on 50 000, and papers do not always say which.
Always report N.

For medical imaging the whole approach is shakier still — an ImageNet feature
extractor has no idea what matters in an endoscopy frame. Domain-specific
features or a downstream task metric ("does a segmentation model trained on the
synthetic data work on the real data?") are more honest, and that last one is
what our own papers use.
-->

---
layout: default
title: Where that leaves us
---

# Where that leaves us

All of today: **sample something simple, learn a map**. Four ways to train the map:

<div class="grid grid-cols-4 gap-3 mt-3">
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="ae" :size="64" />
  <strong>autoencoder</strong>
  <span>a map, and nothing to feed it</span>
</div>
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="vae" :size="64" />
  <strong>VAE</strong>
  <span>adds a leash — pays in blur</span>
</div>
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="gan" :size="64" />
  <strong>GAN</strong>
  <span>the loss is a network — sharp and unstable</span>
</div>
<div v-click class="dl-glyphcard">
  <FamilyGlyph kind="diffusion" :size="64" />
  <strong>diffusion</strong>
  <span>a regression again — the curve goes down</span>
</div>
</div>

<div class="grid grid-cols-2 gap-8 mt-3 dl-tight">
<div v-click>

A trained discriminator **measures a divergence**. That is what $D^*$ meant.

</div>
<div v-click>

Which divergence you pick decides what *worse* means. JS cannot see distance.

</div>
</div>

<div v-click class="mt-3 dl-callout">

Four families, one difference: which loss you could actually compute.

</div>

<!--
The four cards are the opening overview, closed — same glyphs, same order, now
with what each one cost. Read them left to right as the story of the lecture.

The two lines under them are the two payoffs: D* turned the discriminator into a
measurement, and the earth-mover example showed the measurement you choose
decides what counts as progress.

Then the honest coda: the generator architectures barely differ — they are all
convolutional image-to-image networks at heart. Everything that separates these
models is the objective. That is the transferable lesson, and it is why this
lecture spent its time on losses rather than on layer diagrams.

Hand over: next week is the variants, the applications, and getting one of these
trained.
-->

---
layout: default
title: What comes with the capability
---

# What comes with the capability

<div class="grid grid-cols-[1fr_1.2fr] gap-6 mt-2 items-center">
<div class="dl-tight">

<v-clicks>

- **Memorisation is measurable** — "it looks different" is not a test
- **Provenance** — C2PA, watermarking. Both removable
- **The asymmetry** — faking is one forward pass; proving something real is open
- **Say what is synthetic** — in a paper, a tool, a dataset card

</v-clicks>

</div>
<div>

<svg viewBox="0 0 400 210" class="dl-diagram" role="img" aria-label="A memorisation check: find the training image nearest to each generated sample; a tiny distance means the model copied it">
  <defs>
    <marker id="mm-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <text class="dl-dg-small" x="8" y="16">a generated sample</text>
  <PixelImage in-svg :x="8" :y="28" :size="70" pattern="tree" :noise="0.03" :seed="5" tone="accent" />
  <path class="dl-dg-arrow" marker-end="url(#mm-arrow)" d="M84 63 H130" />
  <text class="dl-dg-small" x="107" y="54" text-anchor="middle">nearest?</text>
  <rect class="dl-dg-fill is-muted" x="138" y="6" width="254" height="120" rx="6" />
  <text class="dl-dg-small" x="148" y="22">the training set</text>
  <PixelImage v-for="(p, i) in ['smiley', 'heart', 'star', 'house', 'moon', 'tree']" :key="i" in-svg :x="148 + (i % 3) * 80" :y="30 + Math.floor(i / 3) * 48" :size="40" :pattern="p" />
  <rect class="dl-dg-box is-bad" x="306" y="76" width="46" height="46" rx="4" style="fill: none; stroke-width: 2.5" />
  <g v-click>
    <text class="dl-dg-lab is-sm is-bad-text" x="200" y="160" text-anchor="middle">distance 0.02 → it copied a training image</text>
    <text class="dl-dg-small" x="200" y="180" text-anchor="middle">run this on every synthetic dataset you release</text>
  </g>
</svg>

</div>
</div>

<div v-click class="mt-3 dl-callout">

The first line is a measurement you run, not an opinion you hold.

</div>

<!--
Keep this concrete and short — five minutes, no sermon. The framing that works
with engineers is that these are testable properties, not ethics-slide filler.

The picture is the test: for each generated sample, find the nearest training
image; if it is almost identical, the model memorised it. Here the generated tree
is the training tree plus a speck of noise.

The memorisation result to name is Carlini et al. (2023), who extracted training
images from Stable Diffusion. The practical test is a nearest-neighbour search of
generated samples against the training set, and it belongs in anyone's synthetic
data pipeline.

For our own field the rule that matters: a synthetic medical dataset released
without a memorisation check has not established the privacy claim it was made
for.
-->

---
layout: default
title: Reading, and the lab
---

# Reading, and the lab

<div class="grid grid-cols-3 gap-4 mt-3">
<div v-click>
  <LinkCard
    href="https://lilianweng.github.io/posts/2021-07-11-diffusion-models/"
    title="What are Diffusion Models?"
    blurb="Weng, 2021. The derivation this lecture skipped, done properly and readably."
    icon="📘"
  />
</div>
<div v-click>
  <LinkCard
    href="https://github.com/lucidrains/denoising-diffusion-pytorch"
    title="denoising-diffusion-pytorch"
    blurb="A complete, trainable DDPM in readable PyTorch. The one to start from."
    icon="💻"
  />
</div>
<div v-click>
  <LinkCard
    href="https://github.com/soumith/ganhacks"
    title="ganhacks"
    blurb="Chintala's list of what actually makes a GAN train. Unglamorous, and the reason your first one will work."
    icon="🔧"
  />
</div>
</div>

<div v-click class="mt-3 dl-tight">

**In the lab.** Train a DCGAN and a small diffusion model on the same data and
compare. Then break the GAN on purpose — remove `detach`, use the saturating
loss, train $D$ five steps per $G$ step.

</div>

<div v-click class="dl-pixrow mt-2">
  <span class="dl-secondary">log a fixed grid every epoch:</span>
  <PixelImage v-for="(n, i) in [0.9, 0.65, 0.4, 0.2, 0.05]" :key="i" pattern="star" :noise="n" :seed="41" :size="46" :label="`epoch ${i + 1}`" tone="accent" />
</div>

<!--
The strip at the bottom is the habit to leave them with: the same fixed z every
epoch, so the pictures are comparable, and watching them sharpen is the real
progress bar.

The deliberate-breakage exercise works because students predict before they run.
What each break does, so you can grade it:

  - no detach: trains, slowly, to something visibly worse
  - saturating loss: often does not move at all in the first epochs
  - D five steps per G step: D wins, G's gradient vanishes, samples stay noise

The comparison between the two models is the real assignment. The DCGAN will
produce something recognisable faster and then stop improving or collapse; the
diffusion model will be slower and keep getting better. That contrast is the
lecture, discovered rather than asserted.

Datasets, deadlines and hand-in belong on the course page.
-->

---
layout: end
email: vajira@simula.no
next: GAN variants and applications
---

# To be continued…

<div class="flex gap-6 justify-center mt-2">
  <FamilyGlyph kind="ae" :size="64" label="autoencoder" />
  <FamilyGlyph kind="vae" :size="64" label="VAE" />
  <FamilyGlyph kind="gan" :size="64" label="GAN" />
  <FamilyGlyph kind="diffusion" :size="64" label="diffusion" />
</div>
