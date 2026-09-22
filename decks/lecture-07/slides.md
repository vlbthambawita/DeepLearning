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

Everything so far has answered questions about data it was handed. Today the
model has to produce the data — and the whole story is which loss you can
actually compute.

<!--
One session. The arc: a language model already generates, one token at a time,
by sampling a softmax over a vocabulary. Ask for a picture and that recipe has
nothing to stand on, because there is no vocabulary of images. Everything today
is a different answer to the same question.

Section 03 is the lecture. A room that leaves able to compute the optimal
discriminator on three bins, and to say what a trained discriminator is actually
measuring, has the transferable idea. Sections 01 and 02 are the compressible
ones if you are running late — say the autoencoder's punchline and move on.

The running example is three modes. It shows up as three bars when we need a
distribution and as three blobs when we need a picture, and it is the same
example both times. Set that up on slide 13 so nobody thinks the widgets are
unrelated.

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

Weeks 6 to 8 built sequence models and ended on the large language model.

Today starts the block on generative models — and the first thing to notice is
that we finished the last block holding one.

<!--
Worth saying out loud that this is not a change of subject. The LLM of week 8 is
a generative model, and a very good one. What makes today a new topic is not
"now we generate" but "now we generate something that is not a sequence of
symbols from a finite vocabulary".

Next week is the variants and the applications, and the lab work sits there too.
-->

---
layout: section
index: "00"
---

# You already have a generative model

---
layout: default
title: What last week left you holding
---

# What last week left you holding

A language model generates. Nobody calls it a generative model in the lecture
that builds it, but that is exactly what it is.

<div class="dl-tight mt-3">

<v-clicks>

- It defines $p(\text{next token} \mid \text{everything so far})$ — an honest
  probability distribution
- The distribution is a **softmax over a vocabulary**: 50 257 numbers that are
  positive and sum to one
- To generate, you **sample** one, append it, and go again

</v-clicks>

</div>

<div v-click class="mt-5 dl-callout">

Two things make that work: the output is **discrete**, and the set of
possibilities is **small enough to list**.

</div>

<!--
Get the room to agree that they already know how to generate text before you
take it away from them. It makes the next slide land.

If someone objects that a language model is "discriminative because it is trained
to predict": training by prediction is how you *fit* it; what you have at the end
is a distribution you can sample from. That is the definition.

The two conditions in the callout are the ones slide 5 breaks, one at a time.
-->

---
layout: default
title: Now do it for a picture
---

# Now do it for a picture

Same recipe, one different output. A 256 × 256 colour image.

<div class="grid grid-cols-2 gap-10 mt-4 dl-tight">
<div>

### What breaks

<v-clicks>

- **196 608 numbers**, not one
- Each is **continuous**. There is no vocabulary to put a softmax over
- No natural order, so "the next one" means nothing

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

You *could* discretise and go pixel by pixel — PixelRNN did, in 2016. That is
196 608 sequential forward passes for one image.

</div>

<div v-click class="mt-3 dl-secondary">

So: produce the whole thing **at once**, and find a loss you can compute.

</div>

</div>
</div>

<!--
The 196 608 is 256 x 256 x 3. Write it on the board; the number does the
arguing.

PixelRNN and PixelCNN are worth thirty seconds because they are the honest
counter-example: autoregressive image generation is not impossible, it is just
unbearably slow at sampling time, and it is the same trade the diffusion section
comes back to. It is also why autoregressive image models are back in 2025 for
multimodal LLMs, where the sequence machinery already exists.

Do not let this become a lecture on PixelCNN.
-->

---
layout: default
title: Two kinds of model
---

# Two kinds of model

<div class="dl-ledger mt-2">

| | learns | asks | what you get |
| --- | --- | --- | --- |
| **discriminative** | $p(y \mid \mathbf{x})$ | *given this, which class?* | a label, a box, a mask |
| **generative** | $p(\mathbf{x})$ | *what does data look like at all?* | new examples |

</div>

<div class="dl-tight mt-4">

<v-clicks>

- Weeks 1–5 were all the top row. The classifier never has to know what a cat
  looks like, only what separates cats from dogs
- The bottom row is strictly harder: a boundary can ignore everything either
  side of it, a **density cannot**

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

A discriminative model can be right about a picture it could never have imagined.

</div>

<!--
The last bullet is the one that takes a moment. A decision boundary is a
low-dimensional object; the data distribution is not. This is why generative
modelling stayed hard long after classification was solved.

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

Every model in this lecture is the same two-part arrangement.

<div class="dl-prompt mt-3">

a simple distribution you can sample from, and a learned map from it to the data

</div>

<div class="grid grid-cols-2 gap-10 mt-5 dl-tight">
<div>

<v-clicks>

- Draw a **latent** $\mathbf{z} \sim \mathcal{N}(\mathbf{0}, I)$ — free, and
  with no structure at all
- Push it through a network $g_\theta$
- Call the result a sample

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

Autoencoder, VAE, GAN, diffusion — **all four** do exactly this. They differ only
in **how $g_\theta$ is trained**.

</div>

</div>
</div>

<!--
Write the prompt line on the board and leave it there for the whole lecture. Every
section ends by coming back to it.

The reason the framing earns its keep: students meet these four as four unrelated
architectures with four sets of notation, and then cannot say what any of them
has in common. They have almost everything in common. The differences are
entirely in the loss, which is the only thing worth teaching about them.

Where the latent comes from is not the interesting question — a Gaussian is a
Gaussian. What you can *measure* about the output is.
-->

---
layout: default
title: Which loss can you even compute?
---

# Which loss can you even compute?

You cannot write down "make it look like real data" and differentiate it. Each
family is a different answer to that.

<div class="dl-ledger mt-3">

| | the loss it trains on | what that costs |
| --- | --- | --- |
| autoencoder | pixel error against **its own input** | not generative at all |
| VAE | pixel error **+ a leash on the latent** | blurry |
| GAN | **a second network's opinion** | sharp, and unstable |
| diffusion | pixel error on **noise**, at every level | sharp and stable |

</div>

<div v-click class="mt-4 dl-callout">

Four rows, one lecture. The last column is the plot.

</div>

<!--
This is the table the whole deck fills in. Do not explain the rows now — name
them, promise each one, and move.

It is also the slide to come back to if the room gets lost in section 05: every
architectural difference they are looking at descends from column two.

The fourth row is the one that surprises people. "Regression onto noise" sounds
much weaker than an adversarial game, and it turned out to be the thing that
worked.
-->

---
layout: default
---

<PollSlide
  question="Which of these can tell you the probability it assigns to a picture you hand it?"
  :items="[
    'A GAN',
    'A VAE',
    'A diffusion model',
    'A language model, for text',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

Only the last one, exactly

</div>

<div v-click class="mt-2 dl-secondary">

A GAN has no likelihood at all. A VAE and a diffusion model give a **lower bound**
on it, not the number. Sampling and scoring are separate abilities, and most of
these models only have the first.

</div>

<!--
Hands up for each. Most rooms pick the VAE, because it is the one with the
probability-looking derivation.

The point to leave them with: "generative model" is not one capability. Ask what
you actually need — samples, a density, or a latent you can edit — because no
family gives you all three.

Anomaly detection is the practical case where this bites: people reach for a GAN
and then discover there is nothing to threshold.
-->

---
layout: section
index: "01"
---

# Compress first: autoencoders

---
layout: default
title: The autoencoder
---

# The autoencoder

Two networks, back to back, trained to do **nothing** — as accurately as possible.

<div class="mt-2 flex justify-center">
<svg viewBox="0 0 640 150" class="dl-diagram" role="img" aria-label="An encoder narrows an input to a latent vector, a decoder widens it back">
  <defs>
    <marker id="ae-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box" x="8" y="42" width="52" height="66" rx="4" />
  <text class="dl-dg-lab" x="34" y="80" text-anchor="middle">x</text>
  <polygon class="dl-dg-net" points="96,30 210,58 210,92 96,120" />
  <text class="dl-dg-in" x="150" y="80" text-anchor="middle">encoder f</text>
  <rect class="dl-dg-box is-accent" x="248" y="58" width="36" height="34" rx="4" />
  <text class="dl-dg-lab" x="266" y="80" text-anchor="middle">z</text>
  <polygon class="dl-dg-net" points="322,58 436,30 436,120 322,92" />
  <text class="dl-dg-in" x="380" y="80" text-anchor="middle">decoder g</text>
  <rect class="dl-dg-box" x="472" y="42" width="52" height="66" rx="4" />
  <text class="dl-dg-lab" x="498" y="80" text-anchor="middle">x̂</text>
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M60 75 H92" />
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M212 75 H244" />
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M286 75 H318" />
  <path class="dl-dg-arrow" marker-end="url(#ae-arrow)" d="M438 75 H468" />
  <path class="dl-dg-loss" d="M34 118 V140 H498 V112" />
  <text class="dl-dg-small" x="266" y="136" text-anchor="middle">loss compares these two</text>
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

No labels anywhere. That is the selling point — this is self-supervised learning,
and it predates the term by twenty years.

Notation for the section: f is the encoder, g the decoder, z the latent or code.
Keep saying "code" and "latent" interchangeably once, then pick one and stay with
it.
-->

---
layout: default
title: How wide is the middle?
---

# How wide is the middle?

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### Undercomplete

$\dim(\mathbf{z}) < \dim(\mathbf{x})$

<v-clicks>

- There is not room to keep everything, so the network must choose
- What it keeps is what the data actually varies along
- This is where the useful representation comes from

</v-clicks>

</div>
<div>

### Overcomplete

$\dim(\mathbf{z}) \ge \dim(\mathbf{x})$

<v-clicks>

- Nothing forces any compression at all
- The identity map is available, scores a perfect loss, and teaches you nothing
- Useful only once something *else* constrains it — noise, sparsity, dropout

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

The bottleneck is not a limitation you tolerate. It is the entire mechanism.

</div>

<!--
The 2025 deck asked "Undercomplete? Overcomplete?" as bare questions on the
slide; this is the answer.

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

- **latent = 2** — output sits exactly on input. Perfect, and useless
- **latent = 1** — every output must lie on **one curve** the decoder can draw

</v-clicks>

<div v-click class="mt-2 dl-callout">

That curve is the model's whole idea of what data is.

</div>

<!--
Toggle between the two a few times. With latent = 2 the teal dots vanish under
the grey ones, and "the reconstruction is perfect" stops being reassuring.

The curve is written down rather than trained, and the widget's source says so —
a network with a one-dimensional bottleneck converges to essentially this curve
on this data, and writing it down keeps the demo instant and identical every
time. Say that if anyone asks whether it is really trained.

Do not press the other button yet. That is the next slide.
-->

---
layout: default
title: What autoencoders are actually for
---

# What autoencoders are actually for

Not generation. The useful outputs are the **middle** and the **error**.

<div class="dl-ledger mt-3">

| | what you use | why |
| --- | --- | --- |
| compression, denoising | $\hat{\mathbf{x}}$ | keeps structure, drops noise |
| representation learning | $\mathbf{z}$ | features for a small labelled task |
| **anomaly detection** | the **error** | train on normal only; odd things rebuild badly |
| **a space to work in** | $f$ and $g$ | remember this one for section 05 |

</div>

<div v-click class="mt-4 dl-callout">

Every one of these uses $f$, or the loss. None of them uses $g$ on its own.

</div>

<!--
The anomaly detection case is worth a real example: train on healthy scans,
flag the ones the model cannot rebuild. It works because the model was never
shown the pathology and so has no code for it.

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

Press **Decode a fresh z**, four times. The strip shows every training point's
code.

<v-clicks>

- The first two land **inside a clump** and decode to something plausible
- The last two land **in a gap** — and decode to a point no data ever occupied

</v-clicks>

<div v-click class="mt-2 dl-callout">

The loss asked $f$ to be **invertible**. It never asked it to **fill** anything.

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

```python {all|1-5|7-11|14-16|all}{lines:true}
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

<div v-click class="mt-3 dl-secondary">

`for x, _ in loader` — the underscore is the point. No labels were used.

</div>

<!--
Have them notice the discarded label before you say anything. It is the shortest
possible definition of self-supervised learning.

Sigmoid on the output because MNIST pixels live in [0, 1]. With real-valued data
you drop it, and then MSE is the sensible loss rather than a convenient one.

Two is a brutally small latent for MNIST and is chosen so it can be plotted. Real
ones use 32 to 256, and then nobody can draw the picture from the last slide,
which is why we do it at two.
-->

---
layout: default
---

<PollSlide
  question="A trained autoencoder rebuilds every test image beautifully. You feed the decoder a random z and get noise. Why?"
  :items="[
    'The decoder is undertrained',
    'The latent is too small to hold an image',
    'The encoder never put any codes where that z is',
    'You need a bigger dataset',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

Nothing ever lives at that z

</div>

<div v-click class="mt-2 dl-secondary">

The decoder is only defined, in any meaningful sense, on the region the encoder
actually used. Everywhere else it is extrapolating, and it was never penalised
for what it does there.

</div>

<!--
Options one and four are the reflexes — students reach for "train more, get more
data" whenever a model misbehaves, and this is a good place to break that habit.
No amount of either fixes this, because nothing in the objective is being
violated. The model is doing exactly what it was asked.

Fixing it needs a *different objective*, which is the next section in one
sentence.
-->

---
layout: section
index: "02"
---

# Make the latent behave: VAEs

---
layout: default
title: Two changes, and only two
---

# Two changes, and only two

The variational autoencoder is the autoencoder with the previous slide fixed.

<div class="grid grid-cols-2 gap-10 mt-4 dl-tight">
<div v-click>

### 1 — encode a distribution

The encoder outputs $\boldsymbol\mu$ **and** $\boldsymbol\sigma$, not a point.
Each example now claims a *region* of the latent, not a spot.

</div>
<div v-click>

### 2 — pull it toward a prior

Add a term that punishes each encoded distribution for straying from
$\mathcal{N}(\mathbf{0}, I)$ — the thing you will sample from later.

</div>
</div>

<div v-click class="mt-5 dl-callout">

Regions overlap and fill; points do not. That is the whole idea, and everything
else is bookkeeping.

</div>

<div class="mt-3">
  <Citation source="Kingma & Welling, Auto-Encoding Variational Bayes (2013)" url="https://arxiv.org/abs/1312.6114" />
</div>

<!--
Deliver these two before any mathematics. The derivation is genuinely hard and
genuinely optional; the two changes are neither.

The intuition for why regions fill: if every example insists on a whole
neighbourhood, and the neighbourhoods are all pushed toward the same unit
Gaussian, they have to overlap. An overlapping cover has no holes. That is the
entire mechanism.

If asked why N(0, I) specifically: because it is the thing we can sample from
trivially at generation time. There is nothing deep about the choice.
-->

---
layout: default
title: The objective, in two terms
---

# The objective, in two terms

$$
\mathcal{L}(\mathbf{x}) \;=\; \underbrace{\mathbb{E}_{q(\mathbf{z}\mid\mathbf{x})}\big[\lVert \mathbf{x} - g(\mathbf{z}) \rVert^2\big]}_{\text{rebuild it}} \;+\; \beta \underbrace{\mathrm{KL}\big(q(\mathbf{z}\mid\mathbf{x}) \,\Vert\, \mathcal{N}(\mathbf{0}, I)\big)}_{\text{stay near the prior}}
$$

<div class="dl-tight mt-4">

<v-clicks>

- **Left**: the autoencoder loss, but decoded from a *sampled* $\mathbf{z}$
- **Right**: a leash. For a Gaussian encoder it is a closed form — two lines of
  code, no integral
- $\beta$ sets the tension. $\beta = 0$ is exactly last section's autoencoder

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

Two terms that want opposite things. Everything a VAE does is the compromise.

</div>

<!--
Name it as the ELBO — evidence lower bound — say that maximising it maximises a
lower bound on the likelihood of the data, and then do not derive it. The
derivation is a whole lecture and it is not this one.

The closed form for the KL, for anyone who wants it:
  KL = -0.5 * sum(1 + log(sigma^2) - mu^2 - sigma^2)
which is the one line everybody copies out of the original paper.

beta = 1 is the plain VAE. beta as a dial is Higgins et al.'s beta-VAE (2017),
and it is the slider on the next widget.
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
stochastic layer anyone has shipped since.

Draw both computation graphs on the board. On the left, an arrow into a
"sample" box and nothing coming back. On the right, epsilon entering from
outside as a constant, and mu and sigma with a clean path to the loss.

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

Not a bug, not a lack of capacity. It follows from the loss in one step.

<div class="dl-tight mt-3">

<v-clicks>

- The decoder is scored by **squared error on pixels**
- A jittered code could have meant several different images
- The output minimising expected squared error over all of them is their
  **average**

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Average of several sharp images = one blurry image. The model is not failing. It
is succeeding.

</div>

<div v-click class="mt-3 dl-secondary">

So to get sharpness, stop scoring pixels against pixels. That is the next section.

</div>

<!--
This is the most useful sentence in the first half of the lecture. Say it slowly
and then say it again.

The concrete version: a face is plausible with the head turned slightly left and
plausible turned slightly right. MSE's best single answer is the average of the
two, which is a face with a smeared nose. No amount of capacity fixes it, because
the blurry answer genuinely has the lower loss.

That is the argument that made the adversarial loss worth trying, and it is worth
framing the next section as a direct response to this slide.
-->

---
layout: default
title: A VAE in PyTorch
---

# A VAE in PyTorch

```python {all|2-4|6-8|11-13|all}{lines:true}
def forward(self, x):
    h = self.enc(x)                                # (B, 784) → (B, 256)
    mu = self.fc_mu(h)                             # (B, 2)
    logvar = self.fc_logvar(h)                     # (B, 2)  — log, so σ > 0 free

    std = (0.5 * logvar).exp()                     # σ
    eps = torch.randn_like(std)                    # the noise, as an INPUT
    z = mu + std * eps                             # reparameterised

    return self.dec(z), mu, logvar

recon, mu, logvar = model(x)
kl = -0.5 * (1 + logvar - mu.pow(2) - logvar.exp()).sum(1).mean()
loss = F.mse_loss(recon, x, reduction='sum') / x.size(0) + beta * kl
```

<div v-click class="mt-2 dl-secondary">

Line 4 predicts $\log \sigma^2$, not $\sigma$: it can come out negative and
`.exp()` still gives a positive standard deviation, with no clamp needed.

</div>

<!--
Line 7 is the reparameterisation trick and it is one line. Point at it and say
so — students expect something elaborate after the previous slide.

The `logvar` convention is worth the aside. Predicting sigma directly means
adding a softplus or a clamp, and a network that outputs a tiny negative sigma
early in training produces a NaN you will spend an afternoon on.

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

---
layout: default
title: Stop specifying the loss
---

# Stop specifying the loss

Pixel error is the problem. So do not write a loss at all — **train one**.

<div class="dl-tight mt-3">

<v-clicks>

- Put a second network in the room whose only job is to say *real* or *fake*
- Train the generator to make that network wrong
- If the best available critic cannot tell, in what sense is the output not
  realistic?

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

The loss is no longer a formula you chose. It is a network that **improves** as
the generator does.

</div>

<div class="mt-4">
  <Citation source="Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville & Bengio, Generative Adversarial Nets (2014)" url="https://arxiv.org/abs/1406.2661" />
</div>

<!--
The third bullet is the philosophical move and it is worth pausing on: it
replaces "looks real" — which nobody can differentiate — with "fools the best
classifier we can train", which is just a loss.

The moving-target property in the callout is both why it works and why it is
hard. Every other loss in this course is a fixed function. This one is not, and
none of your optimisation intuitions transfer.

Goodfellow's account of writing the first version in one evening after an
argument in a bar is a true story and worth thirty seconds.
-->

---
layout: default
title: Two networks, opposite jobs
---

# Two networks, opposite jobs

<div class="mt-1 flex justify-center">
<svg viewBox="0 0 660 200" class="dl-diagram" role="img" aria-label="A generator turns noise into a fake sample; a discriminator scores real and fake samples">
  <defs>
    <marker id="gan-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path class="dl-dg-head" d="M0 0 L7 3.5 L0 7 z" />
    </marker>
  </defs>
  <rect class="dl-dg-box is-accent" x="8" y="26" width="34" height="48" rx="4" />
  <text class="dl-dg-lab" x="25" y="56" text-anchor="middle">z</text>
  <text class="dl-dg-small" x="25" y="88" text-anchor="middle">noise</text>
  <polygon class="dl-dg-net" points="78,18 190,36 190,64 78,82" />
  <text class="dl-dg-in" x="134" y="55" text-anchor="middle">generator G</text>
  <rect class="dl-dg-box" x="228" y="26" width="52" height="48" rx="4" />
  <text class="dl-dg-lab" x="254" y="56" text-anchor="middle">x̃</text>
  <text class="dl-dg-small" x="254" y="16" text-anchor="middle">fake</text>
  <rect class="dl-dg-box" x="228" y="126" width="52" height="48" rx="4" />
  <text class="dl-dg-lab" x="254" y="156" text-anchor="middle">x</text>
  <text class="dl-dg-small" x="254" y="192" text-anchor="middle">real, from the dataset</text>
  <polygon class="dl-dg-net is-critic" points="380,72 492,90 492,112 380,130" />
  <text class="dl-dg-in" x="436" y="105" text-anchor="middle">discriminator D</text>
  <text class="dl-dg-small" x="580" y="96">1 &#8594; real</text>
  <text class="dl-dg-small" x="580" y="114">0 &#8594; fake</text>
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M42 50 H74" />
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M192 50 H224" />
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M282 50 H330 V88 H376" />
  <path class="dl-dg-arrow" marker-end="url(#gan-arrow)" d="M282 150 H330 V114 H376" />
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

Note that D is an ordinary binary classifier — week 2 material with a sigmoid on
the end. Nothing about it is exotic. All the strangeness is in what it is used
for.

The 2025 deck drew this as one figure; here the two boxes arrive separately so
the room can be asked what D's training data is before being told. The answer —
"a labelled dataset it builds itself, half real and half from G" — is the
fourth step on slide 34.
-->

---
layout: default
title: The value function
---

# The value function

$$
V(\theta^{(D)}, \theta^{(G)}) \;=\; \mathbb{E}_{\mathbf{x} \sim p_{\text{data}}}\big[\log D(\mathbf{x})\big] \;+\; \mathbb{E}_{\mathbf{z} \sim p_{\mathbf{z}}}\big[\log\big(1 - D(G(\mathbf{z}))\big)\big]
$$

<div class="dl-tight mt-4">

<v-clicks>

- **First term** — D's score on real data. Large when $D(\mathbf{x}) \to 1$
- **Second term** — D's score on fakes. Large when $D(G(\mathbf{z})) \to 0$
- So **D wants $V$ big**. Both terms are exactly binary cross-entropy

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

$$\min_G \max_D \; V(\theta^{(D)}, \theta^{(G)})$$

</div>

<div v-click class="mt-2 dl-secondary">

One objective, two players, opposite signs. Nobody is minimising a loss here —
they are looking for a **saddle point**.

</div>

<!--
Go term by term with the clicks and keep asking "who wants this big?". The
equation is much less frightening once the room notices both halves are the
log-loss they already know.

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

<div class="dl-ledger mt-3">

| | freeze $G$, train $D$ | freeze $D$, train $G$ |
| --- | --- | --- |
| the other one is | a second dataset of fakes | a fixed, differentiable loss |
| the task is | binary classification | make $D$ say *real* |
| it does to $V$ | **maximise** | **minimise** |
| which term matters | both | the second only |
| gradients | into $D$ | through $D$, into $G$ |

</div>

<div v-click class="mt-4 dl-callout">

Two ordinary supervised problems, alternated. That is all a training loop is.

</div>

<!--
This is the slide that turns an intimidating min-max into something implementable,
and it is the structure of the code on slide 36.

"Gradients flow through D into G, and D's weights do not move" is the sentence
that explains why the code has two optimisers rather than one. It is also the
single most common source of bugs — slide 36.

Ask what happens if you train D to convergence at every step. The answer is on
slide 35: D gets so good that G's gradient vanishes, and that is exactly the
failure the non-saturating loss was invented for.
-->

---
layout: default
title: The best discriminator that could exist
---

# The best discriminator that could exist

Freeze $G$. For a **fixed** pair of distributions $p_{\text{data}}$ and $p_g$,
the $D$ that maximises $V$ can be written down:

<div class="mt-4 dl-math-sm">

$$
D^*(\mathbf{x}) \;=\; \frac{p_{\text{data}}(\mathbf{x})}{p_{\text{data}}(\mathbf{x}) + p_g(\mathbf{x})}
$$

</div>

<div class="dl-tight mt-4">

<v-clicks>

- Nothing is trained here. It is a **ratio of two densities**, point by point
- Where only real data lives, $D^* = 1$. Where only fakes live, $D^* = 0$
- Where the two are equal, $D^* = \tfrac{1}{2}$ — and that is the goal

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

A perfect generator makes the best possible discriminator useless. Coin-flip
everywhere.

</div>

<!--
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

Substitute the optimal discriminator into $V$ and the expression collapses:

<div class="mt-4 dl-math-sm">

$$
V(D^*, G) \;=\; -\log 4 \;+\; 2 \cdot \mathrm{JS}\big(p_{\text{data}} \,\Vert\, p_g\big)
$$

</div>

<div class="dl-tight mt-4">

<v-clicks>

- $\mathrm{JS}$ is the **Jensen–Shannon divergence** — a symmetric measure of how
  far apart two distributions are
- $-\log 4$ is a constant. The only thing $G$ can move is the second term
- $\mathrm{JS} = 0$ only when the two distributions are **identical**

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

A trained discriminator is not a classifier you happen to need. It is a
**measurement of a divergence**, and $G$ is minimising the thing it measures.

</div>

<!--
This is the payoff of the lecture. Slow down.

The reframing is what matters: a GAN is not "a clever trick with two networks",
it is a way to minimise a divergence you cannot write down, by estimating it with
a classifier. Once a student holds that, every GAN variant on slide 48 becomes
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

One iteration. Two forward passes for $D$, one for $G$, and a label flip.

<div class="dl-ledger mt-3">

| | pass | what goes in | label it is trained against |
| --- | --- | --- | --- |
| 1 | $D(\mathbf{x})$ | a real batch | **1** |
| 2 | $D(G(\mathbf{z}))$ | a fake batch | **0** |
| 3 | update $D$ | both of the above | — |
| 4 | update $G$ | $D(G(\mathbf{z}))$ again | **1** |

</div>

<div v-click class="mt-4 dl-callout">

Step 4 uses the label **1** on data it knows is fake. That single lie is the
generator's entire training signal.

</div>

<!--
The 2025 deck had this as one dense figure. As a table you can walk the columns
and the label flip between rows 2 and 4 is impossible to miss — which is the
thing worth noticing, because it is the whole adversarial relationship in one
cell.

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
Sketch both curves on the board between 0 and 1. log(1 - D) is flat at the left
end and steep at the right; log D is the reverse. The generator lives at the left
end for the whole early phase.

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

```python {all|1-2|5-8|11-13|all}{lines:true}
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

<div class="dl-tight mt-2">

<v-clicks>

- **Two optimisers**, each holding only its own parameters
- `fake.detach()` on line 6 — update $D$ without pushing gradient back into $G$
- Line 10 has no `detach`: that gradient **must** cross $D$ to reach $G$

</v-clicks>

</div>

<!--
Lines 6 and 10 are the slide. One has detach and one must not, and if you get
them the wrong way round you get no error message and no working model.

betas=(0.5, 0.999) is DCGAN's setting and everyone still uses it. Adam's default
0.9 keeps too much momentum for a loss surface that is moving under you.

Have them trace what happens without detach on line 6: the discriminator update
also pushes gradient into G, so G is being nudged to make D's job *easier*. It
trains, slowly, to something wrong.
-->

---
layout: default
---

<PollSlide
  question="You delete .detach() on line 6. What happens?"
  :items="[
    'A shape error on the next line',
    'Nothing — G has its own optimiser, so it is unaffected',
    'D\'s update also computes gradients into G, which opt_g then applies',
    'The discriminator stops learning',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

G accumulates gradient from D's loss

</div>

<div v-click class="mt-2 dl-secondary">

`opt_g` only *applies* gradients; it does not decide who computed them. G's
`.grad` now carries a term from the discriminator's objective, and
`opt_g.step()` will happily use it.

</div>

<!--
Option 2 is the popular answer and it is the useful misconception to break:
students think an optimiser scopes the backward pass. It does not. The backward
pass follows the graph; the optimiser only decides which parameters get stepped.

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

<div class="grid grid-cols-2 gap-6 mt-4">
<div v-click>
  <LinkCard
    href="https://poloclub.github.io/ganlab/"
    title="GAN Lab"
    blurb="Kahng et al., Georgia Tech. A GAN training in your browser, with the discriminator's decision surface drawn live. The 2025 deck pointed here and it is still the best thing of its kind."
    icon="🎮"
  />
</div>
<div v-click>
  <LinkCard
    href="https://arxiv.org/abs/1406.2661"
    title="Generative Adversarial Nets"
    blurb="Goodfellow et al., 2014. Nine pages. Everything in this section is in section 3 and the proof of the D* result is four lines."
    icon="📄"
  />
</div>
</div>

<div v-click class="mt-5 dl-tight">

**In GAN Lab, watch two things.** The background shading is $D$ — that is the
$D^*$ picture from slide 30, live. And the green samples pulling toward the data
are the generator following $D$'s gradient.

</div>

<div v-click class="mt-2 dl-secondary">

Try the "two rings" dataset and wait. It collapses, most times, and that is the
next section.

</div>

<!--
Five minutes here if the session is running to time, none if it is not. The thing
to point at is the background shading: students have just been told D is a
divergence estimate, and here is that estimate as a picture that updates.

Leaving the two-rings case running while you start section 04 is a nice piece of
theatre — the collapse usually shows up within a couple of minutes.
-->

---
layout: section
index: "04"
---

# Why GANs are hard

---
layout: default
title: DCGAN — a CNN, run backwards
---

# DCGAN — a CNN, run backwards

Week 4 built a network that turns a big image into a small vector. The generator
needs the opposite.

<div class="dl-ledger mt-3">

| | discriminator | generator |
| --- | --- | --- |
| direction | image $\to$ one number | vector $\to$ image |
| layer | strided convolution | **transposed** convolution |
| spatial size | halves each block | doubles each block |
| activation | LeakyReLU | ReLU, then `tanh` out |

</div>

<div v-click class="mt-3 dl-callout">

No pooling in either. Down is a stride, up is a transposed convolution — both
**learned**.

</div>

<div class="mt-3">
  <Citation source="Radford, Metz & Chintala, Unsupervised Representation Learning with Deep Convolutional GANs (2015)" url="https://arxiv.org/abs/1511.06434" />
</div>

<!--
DCGAN is the paper that made GANs usable, and it is almost entirely a list of
architectural rules found by trial and error. That is worth saying: the
contribution was engineering, and it mattered enormously.

`tanh` at the output because images are scaled to [-1, 1]. Get that wrong and
the discriminator learns to detect the range rather than the content — a real bug
with a very confusing symptom.

BatchNorm in both, which is the next slide.

No pooling is the one people ask about. Pooling throws information away with a
fixed rule, and a generator has nothing to throw away; a strided transposed
convolution learns its own upsampling.
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

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### Why it happens

<v-clicks>

- Cells get **uneven numbers** of taps whenever `stride` does not divide `kernel`
- The pattern is periodic, so it reads as a grid
- It is there at initialisation, before any training

</v-clicks>

</div>
<div>

### Two fixes

<v-clicks>

- **Make stride divide kernel.** 4 with stride 2 is DCGAN's choice, and it is even
- **Upsample, then convolve** — a resize, then an ordinary `Conv2d`. What modern
  code does, and what section 05's U-Net does

</v-clicks>

</div>
</div>

<div v-click class="mt-4 dl-callout">

An artefact you can predict from arithmetic is one you can design out.

</div>

<div class="mt-3">
  <Citation source="Odena, Dumoulin & Olah, Deconvolution and Checkerboard Artifacts, Distill (2016)" url="https://distill.pub/2016/deconv-checkerboard/" />
</div>

<!--
The second fix is the one to emphasise because it is what they will actually see
in code: `nn.Upsample` followed by `nn.Conv2d`, or `F.interpolate` then a conv.
Separating "make it bigger" from "decide what goes there" removes the problem by
construction rather than by tuning.

Worth connecting forward: the diffusion U-Net upsamples and convolves. By 2020
transposed convolution had quietly lost.
-->

---
layout: default
title: One more piece from week 4
---

# One more piece from week 4

Batch normalisation, in both networks, and it is doing more work here than usual.

<div class="dl-tight mt-3">

<v-clicks>

- Usual benefit, from week 4: gradients stay in a workable range
- **New here** — it keeps one network's activations from drifting while the other
  is chasing them

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Not in $D$'s first layer, and not in $G$'s last. Both touch real pixel statistics.

</div>

<!--
This is revision and should take two minutes. Normalise each activation over the
batch, rescale with two learned parameters — they have seen it.

The one new thing is the stabilisation argument, which is specific to the
adversarial setting: both networks are non-stationary targets for each other, and
BatchNorm limits how far either can wander between updates.

Modern GANs often use spectral normalisation on D instead, which bounds how
sharply the discriminator can respond rather than rescaling its activations.

The exception in the callout is the kind of detail students dismiss as
superstition. It is not: normalising D's input layer destroys exactly the pixel
statistics it needs, and normalising G's output layer fights the tanh.

BatchNorm's batch dependence is a real nuisance at generation time, which is why
you will also see InstanceNorm and GroupNorm here.
-->

---
layout: default
title: The failure that defines GANs
---

# The failure that defines GANs

**Mode collapse.** The generator finds one output the discriminator accepts, and
produces only that.

<div class="dl-tight mt-3">

<v-clicks>

- Nothing in $V$ rewards **variety**. It rewards each individual sample looking
  real
- A single convincing face is a perfectly good local solution
- $D$ eventually learns to reject it — so $G$ moves to *another* single output.
  The two chase each other forever

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

The samples look excellent and the model is worthless. Loss curves show nothing —
they were never going to converge anyway.

</div>

<!--
This is the slide practitioners care most about. The diagnostic point is the
callout: you cannot detect mode collapse from the loss, because a GAN's loss
does not go down in the first place. You detect it by looking at a grid of
samples, or by measuring coverage.

The chasing behaviour has a name — cycling — and it is why "just train longer"
is not advice. The parameters are on an orbit, not a descent.

Next slide is this failure in the running example, where it becomes a number.
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

<div v-click class="mt-3 dl-callout">

Only the last one knows about **distance**. The other three ask how much mass is
misplaced, never how far it has to go.

</div>

<!--
Do not derive any of these. The row that matters is the last one, and the callout
is the only thing they need to carry.

KL's asymmetry deserves one sentence: KL(P||Q) blows up where the model puts no
mass on real data, and KL(Q||P) blows up where the model invents data. Those are
two completely different failures and it matters which one you penalise.

JS is what a GAN minimises — slide 32. EM is what the next-but-one slide switches
to. The whole section is that one substitution.
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
the mass yourself: collapsed-on-mode-2 needs one third moved one step left and
one third moved one step right, so 2/3. Collapsed-on-mode-3 needs one third
moved two steps and one third moved one step, so 1.

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

Swap the divergence. Keep everything else.

<div class="dl-tight mt-3">

<v-clicks>

- **WGAN** (2017) — a *critic* returning a real number, no sigmoid. Its loss
  estimates earth-mover distance
- The critic must be **Lipschitz**-bounded or the estimate is meaningless
- **WGAN-GP** enforces that with a gradient penalty. This is the one people use
- **Spectral normalisation** does it per layer — cheaper, and now the default

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

And the critic's loss finally **correlates with sample quality**, so for the first
time the training curve means something.

</div>

<div class="mt-2">
  <Citation source="Arjovsky, Chintala & Bottou, Wasserstein GAN (2017)" url="https://arxiv.org/abs/1701.07875" />
</div>

<!--
The callout is the practical headline. Before WGAN, a GAN's loss curve told you
nothing at all; afterwards, the critic's estimate goes down as samples improve.
For anyone who has to train one of these, that is the difference between
engineering and guessing.

Lipschitz in one sentence: the critic is not allowed to change its output faster
than a fixed rate as the input moves. Without that, the supremum in the
earth-mover dual is unbounded and the number it reports is arbitrary.

Do not go near the Kantorovich–Rubinstein duality. It is a graduate course.
-->

---
layout: default
title: The zoo, and the six that mattered
---

# The zoo, and the six that mattered

<div class="dl-ledger mt-1">

| | year | what it added |
| --- | --- | --- |
| **cGAN** | 2014 | condition both networks on a label |
| **DCGAN** | 2015 | convolutions, and rules that made training work |
| **pix2pix** | 2016 | image to image, from **paired** data |
| **CycleGAN** | 2017 | image to image with **no pairs** |
| **WGAN-GP** | 2017 | a loss whose value means something |
| **StyleGAN** | 2018 | 1024² faces, and a steerable latent |

</div>

<div v-click class="mt-3 dl-secondary">

Over 500 named variants exist — *the GAN zoo* lists them. Almost all are a change
to the loss, the conditioning, or the normalisation.

</div>

<div class="mt-2">
  <Citation source="Hindupur, The GAN Zoo" url="https://github.com/hindupuravinash/the-gan-zoo" />
</div>

<!--
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

Synthetic data, where the real thing cannot be shared — this group's own research
area.

<div class="dl-ledger mt-3">

| | the problem | what a generator gives you |
| --- | --- | --- |
| **privacy** | a scan identifies its patient | data that can leave the hospital |
| **scarcity** | rare conditions, few examples | more of the rare one |
| **balance** | one class swamps the rest | the small class, generated |
| **labels** | masks are expensive to draw | image **and** mask, together |

</div>

<div v-click class="mt-4 dl-callout">

A synthetic sample too close to a training example has leaked the very thing it
was meant to protect.

</div>

<!--
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

<PollSlide
  question="Your GAN's samples look sharp and realistic, and the loss curves are flat and noisy. What should you check first?"
  :items="[
    'Lower the learning rate — the losses should be decreasing',
    'Whether the samples are all the same',
    'Train the discriminator for more steps per generator step',
    'Nothing — flat adversarial losses are expected and sharp samples are the goal',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

Look at a grid of samples

</div>

<div v-click class="mt-2 dl-secondary">

Flat noisy losses are normal — there is no minimum to descend to. Sharp samples
with no variety is mode collapse, and it is invisible in every number you are
currently logging.

</div>

<!--
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

---
layout: default
title: Destroying an image is easy
---

# Destroying an image is easy

The adversarial game exists because we could not write down a loss. Diffusion
finds one, by going backwards.

<div class="dl-tight mt-3">

<v-clicks>

- Take an image, add a little Gaussian noise, repeat a thousand times. Pure noise
- That direction needs **no network and no training**. It is arithmetic
- So generate by learning to undo **one step** of it
- Undoing a *little* noise is plain regression — week 2 material

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

The hard problem — noise to image — is a thousand easy ones stacked.

</div>

<div class="mt-2">
  <Citation source="Ho, Jain & Abbeel, Denoising Diffusion Probabilistic Models (2020)" url="https://arxiv.org/abs/2006.11239" />
</div>

<!--
The reframing in the callout is the whole section. It is worth saying that this
is the same move as the denoising autoencoder from slide 12 — corrupt, then ask
for the clean version — with one addition that turns it into a generative model:
do it at *every* noise level, with the level as an input.

Sohl-Dickstein et al. published the idea in 2015 and nobody noticed. Ho et al. in
2020 made it work, and the difference was mostly parameterisation and scale. That
is a useful pattern to point out.
-->

---
layout: default
title: The forward process, in one step
---

# The forward process, in one step

Adding noise a thousand times is a chain. But because Gaussians compose, the
whole chain has a closed form:

<div class="mt-3 dl-math-sm">

$$
\mathbf{x}_t \;=\; \sqrt{\bar\alpha_t}\,\mathbf{x}_0 \;+\; \sqrt{1 - \bar\alpha_t}\,\boldsymbol\epsilon,
\qquad \boldsymbol\epsilon \sim \mathcal{N}(\mathbf{0}, I)
$$

</div>

<div class="dl-tight mt-4">

<v-clicks>

- $t$ is a **noise level** here, not week 6's position in a sequence
- $\bar\alpha_t$ falls from $\approx 1$ to $\approx 0$ — a mixing dial between
  image and noise
- A training example at level $t$ costs **one** multiply-add
- No chain is ever simulated. Pick a random $t$, corrupt, train, repeat

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

This is why training is affordable. Otherwise one example at $t = 900$ costs 900
sequential steps.

</div>

<!--
This is the most important equation in the section and the one to write on the
board. The two square roots sum in quadrature so the variance stays at 1 — the
scale of x_t does not drift as t grows, which matters for the network's input.

Notation: alpha_t = 1 - beta_t is the per-step survival, and alpha-bar_t is their
running product. Students trip over the bar; say it out loud as "alpha bar".

Note the collision if anyone raises it: this beta_t is the diffusion schedule and
has nothing to do with the VAE's beta from slide 20. The field reuses the letter;
the deck only ever puts one of them on a slide.

The asymmetry in the callout is the thing to hold onto: forward is parallel and
closed-form, reverse is sequential. It is exactly the opposite of the transformer
trade from week 7, and worth pointing at.
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
drawn on a plane instead of as bars.

Then flip to reverse for the next slide, and note that the widget has to walk
every step to get there.
-->

---
layout: default
title: What the network is asked to do
---

# What the network is asked to do

Given a noisy image and the noise level, **predict the noise that was added**.

<div class="mt-3 dl-math-sm">

$$
\mathcal{L} \;=\; \mathbb{E}_{\mathbf{x}_0,\, t,\, \boldsymbol\epsilon}\Big[\big\lVert \boldsymbol\epsilon - \boldsymbol\epsilon_\theta(\mathbf{x}_t, t) \big\rVert^2\Big]
$$

</div>

<div class="dl-tight mt-4">

<v-clicks>

- A **mean squared error**. On noise, rather than on pixels
- $t$ goes in as an input, so **one** network covers every noise level
- Subtract the prediction and you have an estimate of $\mathbf{x}_0$ — and
  therefore of one step back

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Predicting $\boldsymbol\epsilon$ rather than $\mathbf{x}_0$ is a *reparameterisation*
of the same problem — and it is the change that made this work in 2020.

</div>

<!--
The room's reasonable objection: this is MSE, and section 02 said MSE gives you
blur. The answer is the whole trick, and it is worth stating carefully: MSE on a
*small* denoising step is fine, because at small noise there is only one
plausible answer. The blur in a VAE came from averaging over genuinely different
images; here the ambiguity is spread across a thousand tiny steps and the
randomness is re-injected at each one.

Why predict epsilon: the target has unit variance at every t, so one network with
one loss scale handles the whole range. Predicting x_0 directly works but trains
worse, and Ho et al. found this empirically.
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

<div class="dl-tight mt-3">

<v-clicks>

- **One** network, **one** optimiser, **one** regression loss
- Compare with slide 36: no second model, no label flip, no `detach`, no
  alternation
- And the loss **goes down**. It means something, and you can stop when it stops

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

This is the answer to the whole of section 04. Not a better adversary — no
adversary.

</div>

<!--
Put slide 36 and this slide side by side if you can. Eleven lines with two
optimisers and a detach, against seven with neither. That comparison is the
strongest argument in the lecture and it needs no commentary.

"The loss goes down" deserves emphasis after the GAN section. It is a supervised
regression problem, so every habit from weeks 2 to 5 applies again: watch the
curve, early-stop, tune the schedule.

The `ab[t]` indexing hides a broadcast — for images it needs reshaping to
(B, 1, 1, 1). Mention it, because it is the first thing that breaks when they
write this themselves.
-->

---
layout: default
title: The cost is at the other end
---

# The cost is at the other end

GANs are one forward pass per sample. Diffusion is $T$ of them.

<div class="dl-ledger mt-3">

| | forward passes to make one sample |
| --- | --- |
| GAN | **1** |
| DDPM, as published (2020) | 1000 |
| DDIM, deterministic sampler | 20–50 |
| Distilled or consistency models | **1–4** |

</div>

<div class="dl-tight mt-3">

<v-clicks>

- **DDIM** drops the per-step noise and takes bigger strides. Same trained model,
  a fiftieth of the work
- **Distillation** trains a student to take in one step what the teacher took many
  to do

</v-clicks>

</div>

<div v-click class="mt-3 dl-callout">

Sampling cost turned out to be an engineering problem. Training stability did not.

</div>

<!--
The callout is the honest verdict on why diffusion won. GANs had one advantage —
single-pass sampling — and five years of work closed that gap, while nobody
closed the stability gap the other way.

DDIM in one sentence: the same trained network, resolved as a deterministic
ordinary differential equation instead of a stochastic chain, so you can take
coarser steps. It also makes the noise-to-image map a fixed bijection, which is
what makes latent interpolation between two samples possible.

Consistency models (Song et al., 2023) are the current end of this line and get
usable images in one or two passes.
-->

---
layout: default
title: How the prompt gets in
---

# How the prompt gets in

The network already takes $t$. Give it the text too, and it becomes
$\boldsymbol\epsilon_\theta(\mathbf{x}_t, t, c)$.

<div class="dl-tight mt-3">

<v-clicks>

- Encode the prompt once; every block **cross-attends** to it — week 7's
  cross-attention, in exactly that role
- Drop the caption **10% of the time** in training, so one network learns both
  predictions
- At sampling time, push **away** from the unconditional one:

</v-clicks>

</div>

<div v-click class="mt-3 dl-math-sm">

$$
\tilde{\boldsymbol\epsilon} \;=\; \boldsymbol\epsilon_\theta(\mathbf{x}_t, t) \;+\; w\big(\boldsymbol\epsilon_\theta(\mathbf{x}_t, t, c) - \boldsymbol\epsilon_\theta(\mathbf{x}_t, t)\big)
$$

</div>

<div v-click class="mt-2 dl-callout">

**Classifier-free guidance.** $w$ here is the guidance scale — the field's letter
for it, not week 2's weight vector $\mathbf{w}$. It is the "follow my prompt"
slider in every image tool you have used.

</div>

<div class="mt-2">
  <Citation source="Ho & Salimans, Classifier-Free Diffusion Guidance (2022)" url="https://arxiv.org/abs/2207.12598" />
</div>

<!--
The cross-attention point is worth dwelling on: this is the same mechanism as
week 7's encoder-decoder attention, doing the same job — one sequence looking at
another. The room has already computed one of these by hand.

The 10% caption dropout is the whole trick and it is one line in a dataloader. It
is why "classifier-free": earlier work needed a separately trained classifier to
provide the gradient.

Ask what w = 1 does before revealing: it is ordinary conditional sampling, since
the two terms collapse. Everything above 1 is an extrapolation, which is the next
slide.
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

A 512 × 512 image is 786 432 numbers, and the sampler visits it fifty times. Most
of that is detail no diffusion model needs to be deciding.

<div class="dl-tight mt-3">

<v-clicks>

- Train an autoencoder first. Encode to a **64 × 64 × 4** latent — 48× smaller
- Run the **entire** diffusion process in there
- Decode once, at the very end

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Section 01's autoencoder, section 05's diffusion model, running inside it. That
is Stable Diffusion, and it is why image generation runs on a laptop.

</div>

<div class="mt-3">
  <Citation source="Rombach, Blattmann, Lorenz, Esser & Ommer, High-Resolution Image Synthesis with Latent Diffusion Models (2021)" url="https://arxiv.org/abs/2112.10752" />
</div>

<!--
This is the slide the autoencoder section was planted for, and it is worth saying
so: the thing we spent twenty minutes on and then declared "not a generative
model" turns out to be half of the most widely deployed generative model there is.

The division of labour is the elegant part. The autoencoder handles texture and
high-frequency detail, which is easy and local; the diffusion model handles
layout and semantics, which is hard and global. Each does the part it is good at.

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

$\boldsymbol\epsilon_\theta$ takes an image and returns one. Two popular choices.

<div class="grid grid-cols-2 gap-10 mt-3 dl-tight">
<div>

### U-Net — 2015, and still fine

<v-clicks>

- Encoder down, decoder up, **skips** across
- The skips keep detail a bottleneck loses
- Upsample-then-convolve

</v-clicks>

</div>
<div>

### DiT — a transformer instead

<v-clicks>

- Patches as tokens, then week 7's blocks
- No convolutions anywhere
- **Scales like a transformer** — the reason

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

Every current large image and video model is the transformer one.

</div>

<div class="mt-2">
  <Citation source="Peebles & Xie, Scalable Diffusion Models with Transformers (2022)" url="https://arxiv.org/abs/2212.09748" />
</div>

<!--
The point of the slide is that the *architecture is not the idea*. Diffusion is a
training objective; you can implement it with anything that maps an image to an
image. Students routinely conflate "diffusion" with "U-Net" and it is worth
separating.

Why DiT won: the same reason decoder-only transformers won in week 7. It has a
clean scaling law, so you can predict what more compute buys before spending it.
A U-Net does not.

SD3, Flux, Sora and Veo are all transformer denoisers. The convolution has lost
here too.
-->

---
layout: default
title: What actually gets trained in 2026
---

# What actually gets trained in 2026

Diffusion's thousand-step chain was never essential. The current framing is
simpler.

<div class="dl-tight mt-3">

<v-clicks>

- **Flow matching** — regress a velocity field that carries noise to data along a
  path *you* choose. Same shape of loss, no chain
- **Rectified flow** — choose the *straight* path,
  $\mathbf{x}_t = (1-t)\mathbf{x}_0 + t\boldsymbol\epsilon$, and few steps are needed
- Diffusion is one particular choice of path in this family

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Stable Diffusion 3 and Flux are rectified-flow transformers. The objective on
slide 55 is still, recognisably, the objective.

</div>

<div class="mt-3">
  <Citation source="Lipman, Chen, Ben-Hamu, Nickel & Le, Flow Matching for Generative Modeling (2022)" url="https://arxiv.org/abs/2210.02747" />
</div>

<!--
Do not derive any of this. The one sentence that matters: the noising path was a
free choice all along, diffusion made one choice, and a straighter choice needs
fewer sampling steps because the trajectory has less curvature to resolve.

The linear interpolation in the second bullet is worth writing next to slide 53's
equation. Same shape, different coefficients — and that really is most of the
difference.

If someone asks whether diffusion is now obsolete: the objective is not, the
particular schedule is. Papers still say "diffusion" for the whole family and
that is fine.
-->

---
layout: default
---

<PollSlide
  question="Why does diffusion's MSE loss not blur, when the VAE's did?"
  :items="[
    'Because it uses a U-Net rather than fully-connected layers',
    'Because the loss is on noise, not on pixels',
    'Because each step removes only a little noise — one plausible answer',
    'Because the adversarial term in the autoencoder fixes it',
  ]"
/>

<div v-click class="mt-6 dl-reveal">

One small step has one plausible answer

</div>

<div v-click class="mt-2 dl-secondary">

A VAE averages over genuinely different images and gets their smear. One
denoising step is nearly unambiguous, and fresh randomness enters at each of the
fifty — ambiguity is resolved by *sampling*, not averaging.

</div>

<!--
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

---
layout: default
title: Five families, side by side
---

# Five families, side by side

<div class="dl-ledger dl-ledger--compare mt-1">

| | quality | sampling | training | likelihood | editable latent |
| --- | --- | --- | --- | --- | --- |
| **autoencoder** | — | 1 pass | easy | no | with holes |
| **VAE** | soft | 1 pass | easy | bound | **yes** |
| **GAN** | sharp | **1 pass** | **fragile** | none | yes |
| **diffusion / flow** | **sharp** | 20–50 | **stable** | bound | partly |
| **autoregressive** | sharp | 1 **per token** | stable | **exact** | no |

</div>

<div v-click class="mt-3 dl-callout">

No row wins. Pick the column you cannot compromise on, then read across.

</div>

<!--
Walk the columns rather than the rows, because the columns are the decisions.
Need a density for anomaly detection? Only the last row gives you one. Need real
time? The GAN column is still the only single-pass option that produces sharp
output. Need reliability of training more than anything? Row four.

The autoregressive row is week 8's model, included on purpose so the LLM sits in
the same table as everything else. And it is genuinely back for images, inside
multimodal models where the sequence machinery already exists.

Note the autoencoder row has a dash for quality, because it does not generate at
all. Keep that honest.
-->

---
layout: default
title: How do you know it is any good?
---

# How do you know it is any good?

There is no held-out accuracy here. The standard answer is a **distance between
two sets of statistics**.

<div class="dl-tight mt-3">

<v-clicks>

- **FID** — features from a fixed pretrained network, a Gaussian fitted to each
  set, the distance between them. Lower is better
- It sees **variety** as well as quality: a collapsed GAN scores badly however
  good its samples look
- It is also biased by sample count, and gameable

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

Every number in every table in this field is FID, and nobody fully trusts it.
Look at samples too.

</div>

<div class="mt-2">
  <Citation source="Heusel, Ramsauer, Unterthiner, Nessler & Hochreiter, GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (2017)" url="https://arxiv.org/abs/1706.08500" />
</div>

<!--
The variety sensitivity is why FID replaced Inception Score: IS could be fooled
by a model producing one perfect example of each class, FID cannot, because
collapsing the variety moves the fitted covariance.

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

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

<v-clicks>

- All of today: **sample something simple, learn a map**
- An **autoencoder** gives the map and nothing to feed it
- A **VAE** adds a leash, and pays in blur
- A **GAN** makes the loss a network — sharpness and instability at once

</v-clicks>

</div>
<div>

<v-clicks>

- A trained discriminator is a **divergence estimate**. That is what $D^*$ meant
- Which divergence you pick decides what *worse* means. JS cannot see distance
- **Diffusion** makes the loss a regression again — and the curve goes down

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

Four families, one difference: which loss you could actually compute.

</div>

<!--
Read the left column as the first half and the right as the second. The callout
is slide 8's table, closed.

Then the honest coda: the generator architectures barely differ — they are all
convolutional or transformer image-to-image networks. Everything that separates
these models is the objective. That is the transferable lesson, and it is why
this lecture spent its time on losses rather than on layer diagrams.

Hand over: next week is the variants, the applications, and getting one of these
trained.
-->

---
layout: default
title: What comes with the capability
---

# What comes with the capability

<div class="dl-tight mt-2">

<v-clicks>

- **Memorisation is measurable.** These models can be made to reproduce training
  images, and "it looks different" is not a test
- **Provenance is infrastructure now** — C2PA, watermarking. Both removable
- **The asymmetry is the problem.** Faking is one forward pass; proving something
  real is an open question
- **Say what is synthetic** — in a paper, a tool, a dataset card

</v-clicks>

</div>

<div v-click class="mt-4 dl-callout">

The first line is a measurement you run, not an opinion you hold.

</div>

<!--
Keep this concrete and short — five minutes, no sermon. The framing that works
with engineers is that these are testable properties, not ethics-slide filler.

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

<div class="grid grid-cols-3 gap-4 mt-4">
<div v-click>
  <LinkCard
    href="https://lilianweng.github.io/posts/2021-07-11-diffusion-models/"
    title="What are Diffusion Models?"
    blurb="Weng, 2021. The derivation this lecture skipped, done properly and readably. Do this one before the lab."
    icon="📘"
  />
</div>
<div v-click>
  <LinkCard
    href="https://github.com/lucidrains/denoising-diffusion-pytorch"
    title="denoising-diffusion-pytorch"
    blurb="A complete, trainable DDPM in readable PyTorch. The 2025 deck's link, and still the one to start from."
    icon="💻"
  />
</div>
<div v-click>
  <LinkCard
    href="https://github.com/soumith/ganhacks"
    title="ganhacks"
    blurb="Chintala's list of what actually makes a GAN train. Unglamorous, undertheorised, and the reason your first one will work."
    icon="🔧"
  />
</div>
</div>

<div v-click class="mt-4 dl-tight">

**In the lab.** Train a DCGAN on one dataset, then a small diffusion model on the
same one, and compare. Then break the GAN on purpose — remove `detach`, use the
saturating loss, train $D$ five steps per $G$ step — and report what each does.

</div>

<div v-click class="mt-2 dl-secondary">

Predict which break is worst before you run it. Log a fixed grid of samples every
epoch, not just the losses.

</div>

<!--
The deliberate-breakage exercise carries over from weeks 6 and 7 because it
works. What each break does, so you can grade it:

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
