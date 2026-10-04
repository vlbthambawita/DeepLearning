---
theme: dl2026
addons:
  - dl2026
title: Basics of Neural Networks
info: PGR207 Deep Learning 2026 — Lecture 02
author: Vajira Thambawita
routerMode: hash
transition: slide-left
mdc: true
themeConfig:
  courseCode: PGR207
  lecture: "02"
  lectureTitle: Basics of Neural Networks
layout: title
courseCode: PGR207
lecture: "02"
email: vajira@simula.no
---

# Basics of Neural Networks

One artificial neuron, the rule that trains it, and why that rule had to change.

<!--
Everything today is one neuron. The multilayer network at the end is just this
slide's neuron, repeated.
-->

---
layout: default
title: Outline
---

# Outline

<v-clicks>

- Artificial neurons and neural networks
- Implementing and training a multilayer neural network from scratch

</v-clicks>

<div v-click class="mt-8">
  <Citation source="Based throughout on Raschka, Liu & Mirjalili — Machine Learning with PyTorch and Scikit-Learn" />
</div>

---
layout: section
index: "01"
---

# Artificial neurons

---
layout: interactive
title: The biological neuron, and what we kept
aside-width: 16rem
---

<NeuronAnatomy />

::aside::

Click a part: it highlights in both diagrams at once.

The two usually left out matter most. A spike starts at the **axon hillock**,
and only past a threshold — which becomes the **bias**. The spike is
**all-or-none** — which is the unit step.

<div class="mt-3 dl-secondary">
Read the red line each time: a caricature of a nerve cell, not a model of one.
</div>

<div class="mt-3">
  <Citation source="Kandel et al., Principles of Neural Science" />
</div>

<!--
Do not oversell the analogy. It is where the words came from and very little
more — overselling it is part of what set up the first AI winter.
-->


---
layout: default
title: History of the artificial neuron
---

# History of the artificial neuron

<div class="grid grid-cols-2 gap-8 mt-2">
<div v-click>

### 1943 — the MCP neuron

**McCulloch & Pitts** publish *A Logical Calculus of the Ideas Immanent in
Nervous Activity*: a nerve cell as a simple logic gate.

</div>
<div v-click>

### 1957 — the perceptron

**Frank Rosenblatt**, at the Cornell Aeronautical Laboratory, publishes the
first perceptron **learning rule** on top of the MCP model.

</div>
</div>

<div v-click class="mt-8 dl-callout">
Rosenblatt's algorithm learns the weight coefficients that get multiplied with
the input features, in order to decide whether the neuron fires.
</div>

<div class="absolute bottom-12 left-12">
  <Citation source="historyofinformation.com" url="https://www.historyofinformation.com/" />
</div>

---
layout: interactive
title: A sample dataset — Iris
aside-width: 12rem
---

<IrisDataset>
  <template #setosa><img src="./figures/iris-setosa.jpg" alt="Iris setosa in flower"></template>
  <template #versicolor><img src="./figures/iris-versicolor.jpg" alt="Iris versicolor in flower"></template>
  <template #virginica><img src="./figures/iris-virginica.jpg" alt="Iris virginica in flower"></template>
</IrisDataset>

::aside::

**Iris**, Fisher 1936. 150 flowers, 50 per species.

**Sepals** are the outer whorl — on an iris, the drooping *falls*. **Petals**
are the inner *standards*.

Click a species: both are redrawn to scale from a real row.

<div class="mt-3 dl-callout">
Petal length: 1.5 → 4.1 → 5.5 cm. That column does most of the work.
</div>

<!--
Ask which measurement they would pick if allowed only one. The drawing answers
it before the scatter plot does.
-->

---
layout: default
title: The Iris data, as a table
---

# What one row actually contains

<div class="grid grid-cols-[1.5fr_1fr] gap-7 mt-1">
<div>

<table class="dl-iris-table">
<thead>
<tr>
<th><Katex expr="i" /></th>
<th><Katex expr="x_1" /><br><span>sepal length</span></th>
<th><Katex expr="x_2" /><br><span>sepal width</span></th>
<th><Katex expr="x_3" /><br><span>petal length</span></th>
<th><Katex expr="x_4" /><br><span>petal width</span></th>
<th><Katex expr="y" /></th>
<th>class</th>
</tr>
</thead>
<tbody>
<tr><td>1</td><td>5.1</td><td>3.5</td><td>1.4</td><td>0.2</td><td>0</td><td><em>setosa</em></td></tr>
<tr><td>2</td><td>4.9</td><td>3.0</td><td>1.4</td><td>0.2</td><td>0</td><td><em>setosa</em></td></tr>
<tr class="is-gap"><td>⋮</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>51</td><td>7.0</td><td>3.2</td><td>4.7</td><td>1.4</td><td>1</td><td><em>versicolor</em></td></tr>
<tr><td>52</td><td>6.4</td><td>3.2</td><td>4.5</td><td>1.5</td><td>1</td><td><em>versicolor</em></td></tr>
<tr class="is-gap"><td>⋮</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td>101</td><td>6.3</td><td>3.3</td><td>6.0</td><td>2.5</td><td>2</td><td><em>virginica</em></td></tr>
<tr><td>102</td><td>5.8</td><td>2.7</td><td>5.1</td><td>1.9</td><td>2</td><td><em>virginica</em></td></tr>
</tbody>
</table>

<div class="mt-2 dl-secondary">All four measurements in centimetres.</div>

<div class="mt-6">
  <Citation source="Fisher (1936), via the UCI Machine Learning Repository" url="https://archive.ics.uci.edu/dataset/53/iris" />
</div>

</div>
<div>

### The target variable

<div class="dl-tight">

<v-clicks>

- The file stores the class as **text**: `Iris-setosa`, `Iris-versicolor`,
  `Iris-virginica`. It has to be encoded before any arithmetic.
- We map those to $0$, $1$, $2$ — but that order is **arbitrary**. The classes
  are nominal; nothing says versicolor lies between the other two.
- Today's neuron is **binary**, so we take setosa vs versicolor, two of the four
  features, and $y \in \{0, 1\}$.

</v-clicks>

<div v-click class="mt-3 dl-callout">
Three classes need three output units — <strong>one-hot</strong> encoding.
Later today.
</div>

</div>

</div>
</div>

---
layout: default
title: The notation
---

# The notation

<div class="grid grid-cols-2 gap-6 mt-2">
<div>

That table, written the way every equation from here on will assume:

<div class="dl-math-xs">

$$
X =
\begin{bmatrix}
x_1^{(1)} & \cdots & x_4^{(1)} \\
x_1^{(2)} & \cdots & x_4^{(2)} \\
\vdots & \ddots & \vdots \\
x_1^{(150)} & \cdots & x_4^{(150)}
\end{bmatrix}
\in \mathbb{R}^{150 \times 4}
$$

</div>

<div class="dl-secondary">

$\mathbb{R}^{150 \times 4}$: real numbers, 150 rows by 4 columns.
Row 51, column 3: $x_3^{(51)} = 4.7$ cm.

</div>

</div>
<div>

<v-clicks>

- A **row** of $X$ is one flower — one training example, written $\mathbf{x}^{(i)}$.
- A **column** is one feature across all 150 examples.
- The superscript $(i)$ indexes the example; the subscript $j$ indexes the feature.
- Target variables: $\mathbf{y} = [\,y^{(1)}, \ldots, y^{(150)}\,]^\top$

</v-clicks>

</div>
</div>

<!--
Fix this notation now. Every equation for the rest of the course uses it.
-->

---
layout: default
title: The formal definition of an artificial neuron
---

# The formal definition of an artificial neuron

<div class="grid grid-cols-2 gap-10 mt-2 dl-math-xs">
<div>

**Weight vector and input values**

$$
\mathbf{w} = \begin{bmatrix} w_1 \\ \vdots \\ w_m \end{bmatrix},
\qquad
\mathbf{x} = \begin{bmatrix} x_1 \\ \vdots \\ x_m \end{bmatrix}
$$

<div v-click class="mt-4">

**Net input**

$$ z = w_1 x_1 + w_2 x_2 + \cdots + w_m x_m $$

</div>
</div>
<div>

<div v-click>

**Unit step function**

$$
\sigma(z) =
\begin{cases}
1 & \text{if } z \ge \theta \\
0 & \text{otherwise}
\end{cases}
$$

</div>

</div>
</div>

<!--
Three definitions, no numbers yet. The next slide names every symbol and puts
one real flower through the neuron.
-->

---
layout: default
title: "Reading the equation: the artificial neuron"
---

# Reading the equation: the artificial neuron

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $\mathbf{x}$ | input vector | one flower (data) | $[5.1,\ 1.4]$ cm |
| $x_j$ | feature $j$ | $j$ from $1$ to $m$: sepal, petal length | $x_2 = 1.4$ |
| $m$ | number of features | inputs per flower | $2$ |
| $\mathbf{w}$ | weight vector | one per feature, learned | $[0.1,\ 1.0]$ |
| $z$ | net input | weighted sum of inputs | $1.91$ |
| $\theta$ | threshold | fire once $z$ reaches it | $3$ |
| $\sigma(z)$ | unit step function | $1$ if $z \ge \theta$, else $0$ | $0$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" style="width:100%;max-width:19rem;height:auto" role="img" aria-label="Worked example: inputs 5.1 and 1.4, weights 0.1 and 1.0, net input 1.91, below the threshold 3, so the output is 0">
  <g style="fill:none;stroke:var(--dl-body);stroke-width:1.6">
    <line x1="52" y1="40" x2="128" y2="72" />
    <line x1="52" y1="110" x2="128" y2="82" />
    <line x1="168" y1="77" x2="198" y2="77" />
    <line x1="258" y1="77" x2="280" y2="77" />
  </g>
  <g style="fill:var(--dl-surface);stroke:var(--dl-border);stroke-width:1.5">
    <circle cx="34" cy="40" r="18" />
    <circle cx="34" cy="110" r="18" />
    <rect x="198" y="57" width="60" height="40" rx="4" />
  </g>
  <circle cx="148" cy="77" r="20" style="fill:var(--dl-accent-soft);stroke:var(--dl-accent);stroke-width:1.5" />
  <polyline points="208,88 228,88 228,66 248,66" style="fill:none;stroke:var(--dl-accent);stroke-width:1.8" />
  <g style="fill:var(--dl-heading);font-size:13px" text-anchor="middle">
    <text x="34" y="45">5.1</text>
    <text x="34" y="115">1.4</text>
    <text x="148" y="82">1.91</text>
    <text x="290" y="82">0</text>
  </g>
  <g style="fill:var(--dl-muted);font-size:11px" text-anchor="middle">
    <text x="34" y="14">x₁</text>
    <text x="34" y="144">x₂</text>
    <text x="96" y="44">w₁ = 0.1</text>
    <text x="96" y="116">w₂ = 1.0</text>
    <text x="148" y="114">z</text>
    <text x="228" y="114">θ = 3</text>
    <text x="284" y="60">σ(z)</text>
  </g>
</svg>

<div v-click class="dl-callout">

Flower 1: $z = 0.1 \times 5.1 + 1.0 \times 1.4 = 1.91$

$1.91 < 3$, so $\sigma(z) = 0$.

Flower 51: $z = 5.4 \ge 3$, so $\sigma(z) = 1$.

</div>

</div>
</div>

<!--
From here on the neuron uses two of the four Iris features: x1 = sepal length
and x2 = petal length (columns 1 and 3 of the table). So m = 2, and j counts
1, 2. Flower 1 is setosa (y = 0), flower 51 is versicolor (y = 1).

Walk the legend top to bottom: x is data, w is learned, theta is — for now —
set by hand. On the next slide theta becomes the bias, and then it is learned
too.

The weights 0.1 and 1.0 and the threshold 3 are picked by hand here, so the
arithmetic is easy. Petal length does almost all the work: setosa petals are
about 1.5 cm, versicolor about 4.3 cm. The learning rule, three slides on, is
how the neuron finds such weights itself.

Check flower 51 with the room: 0.1 × 7.0 + 1.0 × 4.7 = 0.7 + 4.7 = 5.4.
-->

---
layout: default
title: From threshold to bias
---

# From threshold to bias

<div class="grid grid-cols-2 gap-10 mt-4 dl-math-sm">
<div>

Bring the threshold to the left-hand side:

$$ z \ge \theta \quad\Longleftrightarrow\quad z - \theta \ge 0 $$

<div v-click class="mt-6">

Then rename $-\theta$ as the **bias** $b$:

$$
\begin{aligned}
z &= w_1x_1 + \cdots + w_mx_m + b \\
  &= \mathbf{w}^\top\mathbf{x} + b
\end{aligned}
$$

<div class="dl-secondary">

$\mathbf{w}^\top\mathbf{x}$ is the same weighted sum: weights $\mathbf{w}$
times inputs $\mathbf{x}$, over all $m$ features.

</div>

</div>
</div>
<div v-click>

The unit step $\sigma$ now compares the net input $z$ against zero:

$$
\sigma(z) =
\begin{cases}
1 & \text{if } z \ge 0 \\
0 & \text{otherwise}
\end{cases}
$$

<div class="mt-2 dl-secondary">

Flower 1, with $b = -3$: $z = 1.91 - 3 = -1.09 < 0$, so $\sigma(z) = 0$ — the same answer.

</div>

<div class="mt-4 dl-callout">
The bias is not a new idea — it is the threshold, moved. Every framework from
here on has a <code>bias=True</code> argument for exactly this.
</div>

</div>
</div>

---
layout: interactive
title: The decision function of the perceptron
aside-width: 13rem
---

<PerceptronPlayground mode="boundary" />

::aside::

$\sigma(\mathbf{w}^\top\mathbf{x} + b)$ splits the plane with a **linear
decision boundary**: the line where $z = 0$, with one side firing and the other
not.

Drag $w_1, w_2$ to **rotate** it, $b$ to **slide** it. That is the whole model.

<div class="mt-3 dl-secondary">
Right: the same 24 points collapsed to one number each. The step cuts that axis
at zero.
</div>

---
layout: default
title: The perceptron learning rule
---

# The perceptron learning rule

<div class="grid grid-cols-2 gap-10 mt-2">
<div>

1. Initialise $\mathbf{w}$ and $b$ to $0$ or small random numbers.
2. For each training example $\mathbf{x}^{(i)}$:
   - compute the output $\hat{y}^{(i)}$
   - update $\mathbf{w}$ and $b$

</div>
<div>

$$ \Delta w_j = \eta\,\bigl(y^{(i)} - \hat{y}^{(i)}\bigr)\,x_j^{(i)} $$

$$ \Delta b = \eta\,\bigl(y^{(i)} - \hat{y}^{(i)}\bigr) $$

<div v-click class="mt-4 dl-callout">

Note there is **no** $x$ in the bias update — the bias has no input to scale it.

</div>

</div>
</div>

---
layout: default
title: "Reading the equation: the perceptron update"
---

# Reading the equation: the perceptron update

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $i$ | example index | which flower, $1$ to $n$ | $1$ |
| $j$ | feature index | which input, $1$ to $m$ | $1,\ 2$ |
| $x_j^{(i)}$ | feature $j$ of example $i$ | measurement (data) | $5.1,\ 1.4$ |
| $y^{(i)}$ | true label | setosa $0$, versicolor $1$ (data) | $0$ |
| $\hat{y}^{(i)}$ | predicted label | the neuron's output $\sigma(z^{(i)})$ | $1$ |
| $y^{(i)} - \hat{y}^{(i)}$ | error | $0$ if right, $\pm 1$ if wrong | $-1$ |
| $\eta$ | learning rate | step size (set by hand) | $0.1$ |
| $\Delta w_j,\ \Delta b$ | update | change added to $w_j$, $b$ | |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" style="width:100%;max-width:19rem;height:auto" role="img" aria-label="Worked example: flower 1 has inputs 5.1 and 1.4; the error is minus 1; times the learning rate 0.1 gives weight changes minus 0.51 and minus 0.14">
  <g style="fill:var(--dl-surface);stroke:var(--dl-border);stroke-width:1.5">
    <rect x="78" y="12" width="70" height="30" rx="3" />
    <rect x="158" y="12" width="70" height="30" rx="3" />
  </g>
  <g style="fill:var(--dl-accent-soft);stroke:var(--dl-accent);stroke-width:1.5">
    <rect x="78" y="106" width="70" height="30" rx="3" />
    <rect x="158" y="106" width="70" height="30" rx="3" />
  </g>
  <g style="fill:none;stroke:var(--dl-body);stroke-width:1.6">
    <line x1="153" y1="46" x2="153" y2="98" />
    <polyline points="147,92 153,100 159,92" />
  </g>
  <g style="fill:var(--dl-heading);font-size:13px" text-anchor="middle">
    <text x="113" y="32">5.1</text>
    <text x="193" y="32">1.4</text>
    <text x="113" y="126">−0.51</text>
    <text x="193" y="126">−0.14</text>
  </g>
  <g style="fill:var(--dl-muted);font-size:11px">
    <text x="70" y="31" text-anchor="end">x⁽¹⁾</text>
    <text x="70" y="125" text-anchor="end">Δw</text>
    <text x="166" y="76">× η(y − ŷ) = −0.1</text>
    <text x="236" y="125">Δb = −0.1</text>
  </g>
</svg>

<div v-click class="dl-callout">

All zeros: $z = 0$, so $\hat{y} = 1$ — wrong.

$\Delta w_1 = 0.1 \times (-1) \times 5.1 = -0.51$

$\Delta w_2 = 0.1 \times (-1) \times 1.4 = -0.14$

$\Delta b = 0.1 \times (-1) = -0.1$

</div>

</div>
</div>

<!--
This is step 1 of the algorithm on the previous slide, done by hand: start
from all zeros, take the first example, update.

Flower 1 is setosa, y = 0. With all weights zero, z = 0, and the step fires
at z >= 0, so the neuron says 1. Wrong by -1.

Every symbol in the rule is in the table. Point out which are data (x, y),
which is set by hand (eta), and which the neuron produces (y-hat). Delta is
the change, not the new value: the new w1 is 0 + (-0.51) = -0.51.

Check it worked: with w = [-0.51, -0.14] and b = -0.1, flower 1 now gives
z = -2.601 - 0.196 - 0.1 = -2.897, so y-hat = 0. Correct.

eta = 0.1 matches the default on the next slide's diagram. The code later
uses 0.01; the rule is the same.
-->

---
layout: interactive
title: The whole perceptron, error loop included
aside-width: 13rem
---

<PerceptronDiagram />

::aside::

The same neuron as slide 4, with the part the learning rule needs: the output is
**compared** against the true label $y$, and that error is what travels back to
the weights.

<div class="mt-3 dl-secondary">
Move a slider until the prediction flips, then press <strong>Apply update</strong>.
The two cases the next slides work through by hand are both one control away.
</div>

<!--
Drive this one live. Set y = 1 with a negative z, apply the update twice, and
let them see z cross zero — then set the prediction right and show that every
delta collapses to zero.
-->

---
layout: default
title: Example (1/2) — correct predictions
---

# Example (1/2)

With two input features, all weights and the bias update simultaneously.

<div class="mt-1 dl-secondary">

Flower $i$: label $y^{(i)}$, prediction $\hat{y}^{(i)}$, feature $x_j^{(i)}$. $\Delta w_j$, $\Delta b$:
changes to weight $w_j$ and bias $b$. $\eta$: learning rate.

</div>

<div class="mt-1">

**What happens when the prediction is already correct?**

</div>

<div class="grid grid-cols-[1.2fr_1fr] gap-6 items-center">

<div v-click class="dl-math-sm">

$$
\begin{aligned}
(1)\quad & y^{(i)} = 0,\; \hat{y}^{(i)} = 0 \\
         & \Delta w_j = \eta(0 - 0)\,x_j^{(i)} = 0, \qquad \Delta b = 0 \\[8pt]
(2)\quad & y^{(i)} = 1,\; \hat{y}^{(i)} = 1 \\
         & \Delta w_j = \eta(1 - 1)\,x_j^{(i)} = 0, \qquad \Delta b = 0
\end{aligned}
$$

</div>

<div v-click class="dl-callout">

Flower 51 ($y = 1$), predicted $1$:

$\Delta w_1 = 0.1 \times 0 \times 7.0 = 0$.

Nothing moves. The rule only ever learns from its mistakes — which is also why
it stops the moment the data is separated.

</div>

</div>

---
layout: default
title: Example (2/2) — wrong predictions
---

# Example (2/2)

In the case of <span class="dl-wrong">wrong</span> predictions:

<div class="mt-1 dl-secondary">

Same symbols: label $y^{(i)}$, prediction $\hat{y}^{(i)}$, learning rate $\eta$,
feature $x_j^{(i)}$. The changes $\Delta w_j$, $\Delta b$ are added to $w_j$ and $b$.

</div>

<div class="grid grid-cols-[1.2fr_1fr] gap-6 mt-3 items-center">

<div v-click class="dl-math-sm">

$$
\begin{aligned}
(3)\quad & y^{(i)} = 1,\; \hat{y}^{(i)} = 0 \\
         & \Delta w_j = \eta(1-0)\,x_j^{(i)} = \eta\,x_j^{(i)}, \quad \Delta b = \eta \\[8pt]
(4)\quad & y^{(i)} = 0,\; \hat{y}^{(i)} = 1 \\
         & \Delta w_j = \eta(0-1)\,x_j^{(i)} = -\eta\,x_j^{(i)}, \quad \Delta b = -\eta
\end{aligned}
$$

</div>

<div v-click class="dl-callout">

With $\eta = 0.1$: flower 51 missed gives $\Delta\mathbf{w} = [0.70,\ 0.47]$;
flower 1 missed gives $[-0.51,\ -0.14]$.
Both updates point the boundary the right way. How <em>far</em> it moves is set
by the feature value.

</div>

</div>

---
layout: default
title: The size of the correction
---

# The size of the correction

Case (3), $\eta = 1$: the changes $\Delta w_j$ and $\Delta b$, for $x_j = 1.5$ and $x_j = 2$?

<div class="grid grid-cols-2 gap-8 mt-6 dl-math-sm">
<div class="dl-compare">

<div class="dl-secondary mb-1">

$x_j = 1.5$

</div>

$$ \Delta w_j = (1-0)\,1.5 = 1.5 $$

$$ \Delta b = (1-0) = 1 $$

</div>
<div class="dl-compare">

<div class="dl-secondary mb-1">

$x_j = 2$

</div>

$$ \Delta w_j = (1-0)\,2 = 2 $$

$$ \Delta b = (1-0) = 1 $$

</div>
</div>

<div v-click class="mt-6 dl-callout">
The weight update scales with the feature; the bias update does not. So a
feature measured on a larger scale drags the weights harder — which is exactly
why <strong>feature scaling</strong> matters, and we come back to it shortly.
</div>

---
layout: interactive
title: The perceptron learning rule, running
aside-width: 17rem
---

<PerceptronPlayground />

::aside::

Every step applies the rule to one example. Watch the boundary rotate towards
the misclassified point.

**Convergence** is only guaranteed if the two classes are linearly separable —
turn the toggle off and run a few epochs.

---
layout: interactive
title: The big picture
aside-width: 15rem
---

<PerceptronDiagram static />

::aside::

<div class="dl-tight">

<v-clicks>

- Inputs $\mathbf{x}$, scaled by weights $\mathbf{w}$
- Summed into the net input $z = \mathbf{w}^\top\mathbf{x} + b$
- Thresholded into a class label $\hat{y} = \sigma(z)$
- Compared against the true label $y$
- The error drives $\Delta\mathbf{w}$ and $\Delta b$

</v-clicks>

<div v-click class="mt-4 dl-prompt">
Can you read the whole diagram now?
</div>

</div>

<!--
"Can you understand this now?" — the 2025 deck asked this over a repeated
screenshot. Ask it, then step through the list against the diagram.
-->

---
layout: section
index: "02"
---

# ADAptive LInear NEuron

---
layout: default
title: ADALINE
---

# ADALINE <span class="dl-secondary">(the Widrow–Hoff rule)</span>

<v-clicks>

- Published by **Bernard Widrow** and his doctoral student **Tedd Hoff**, only a
  few years after Rosenblatt's perceptron.
- It is the natural next step: it illustrates how to define and **minimise a
  continuous loss function**.
- The key change: weights are updated from a **linear** activation, rather than
  from a unit step.

</v-clicks>

---
layout: interactive
title: Perceptron vs Adaline
aside-width: 11rem
---

<PerceptronVsAdaline />

::aside::

The **same network** twice. One edge moves — the red tap — and everything else
follows from it.

<div class="mt-3 dl-secondary">
Click a row to take it on its own.
</div>

---
layout: default
title: Perceptron vs Adaline — the differences
---

# What follows from moving that one edge

<div class="dl-compare-table mt-3">

| | **Perceptron** — Rosenblatt, 1957 | **Adaline** — Widrow & Hoff, 1960 |
| --- | --- | --- |
| Learning activation | unit step, $\sigma(z) \in \{0, 1\}$ | linear, $\sigma(z) = z$ |
| Error measured from | the **thresholded** label $\hat{y}$ | the **continuous** $\sigma(z)$, before thresholding |
| Loss function | none — it minimises nothing | mean squared error: differentiable **and** convex |
| How the weights move | a hand-written correction, one example at a time, only on a mistake | **gradient descent**, over all $n$ examples, every step |
| Converges | only if the classes are linearly separable | always — to the single MSE minimum, separable or not |

</div>

<div class="mt-2 text-right">
  <Citation source="Raschka — “Perceptron, Adaline, and neural network models”" url="https://sebastianraschka.com/faq/docs/diff-perceptron-adaline-neuralnet.html" />
</div>

<div class="mt-2 dl-callout">
The unit step's derivative is zero everywhere it exists — which is the whole
reason the perceptron has no loss to descend.
</div>

---
layout: default
title: Minimising the loss function
---

# Minimising the loss function

Mean squared error, as the objective to minimise:

<div class="dl-math-sm">

$$ L(\mathbf{w}, b) = \frac{1}{2n} \sum_{i=1}^{n} \Bigl(y^{(i)} - \sigma\bigl(z^{(i)}\bigr)\Bigr)^2 $$

</div>

<div v-click class="mt-2 dl-secondary">

The $\tfrac{1}{2}$ is there purely for convenience — it cancels the 2 that falls
out when we differentiate.

</div>

<div class="mt-5">

Because the activation is **linear**:

<div class="dl-tight">

<v-clicks>

- the loss is **differentiable**
- the loss is **convex** — one minimum, no local traps
- so we can use **gradient descent** to find it

</v-clicks>

</div>

</div>

<!--
The loss in one line: square each error, add them up, average. The next
slide names every symbol and computes it for two flowers.
-->

---
layout: default
title: "Reading the equation: the MSE loss"
---

# Reading the equation: the MSE loss

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $L(\mathbf{w}, b)$ | loss | how wrong $\mathbf{w}$, $b$ are | $0.25$ |
| $n$ | number of examples | flowers used | $2$ |
| $\sum_{i=1}^{n}$ | sum | add over flowers $i = 1, \ldots, n$ | $2$ terms |
| $y^{(i)}$ | true label | from the data | $0,\ 1$ |
| $z^{(i)}$ | net input | $\mathbf{w}^\top\mathbf{x}^{(i)} + b$ | $0,\ 0$ |
| $\sigma(z) = z$ | linear activation | output equals $z$ | $0,\ 0$ |
| $(\cdot)^2$ | square | always positive; big errors cost more | $0,\ 1$ |
| $\tfrac{1}{2n}$ | average, halved | divide by $n$; the $\tfrac12$ cancels later | $\tfrac14$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" style="width:100%;max-width:19rem;height:auto" role="img" aria-label="Worked example: flower 1 has label 0 and output 0, error 0; flower 51 has label 1 and output 0, error 1">
  <g style="stroke:var(--dl-border);stroke-width:1">
    <line x1="40" y1="120" x2="290" y2="120" />
    <line x1="40" y1="30" x2="290" y2="30" />
  </g>
  <line x1="200" y1="36" x2="200" y2="114" style="stroke:var(--dl-danger);stroke-width:2;stroke-dasharray:4 3" />
  <g style="fill:var(--dl-accent)">
    <circle cx="100" cy="120" r="6" />
    <circle cx="200" cy="30" r="6" />
  </g>
  <g style="fill:var(--dl-bg);stroke:var(--dl-heading);stroke-width:1.6">
    <circle cx="100" cy="120" r="10" />
    <circle cx="200" cy="120" r="10" />
  </g>
  <g style="fill:var(--dl-muted);font-size:11px">
    <text x="32" y="124" text-anchor="end">0</text>
    <text x="32" y="34" text-anchor="end">1</text>
    <text x="100" y="146" text-anchor="middle">flower 1</text>
    <text x="200" y="146" text-anchor="middle">flower 51</text>
    <text x="208" y="80">error 1</text>
  </g>
</svg>

<div class="text-xs dl-secondary">dot: y · ring: σ(z)</div>

<div v-click class="dl-callout">

All weights $0$: both outputs $0$.

$L = \tfrac{1}{2 \times 2}\bigl((0 - 0)^2 + (1 - 0)^2\bigr) = \tfrac14 = 0.25$

</div>

</div>
</div>

<!--
Same two flowers as before: flower 1 (setosa, y = 0) and flower 51
(versicolor, y = 1). Here n = 2 so the sum has two terms; the real training
set has n = 100 flowers. Nothing else changes.

Adaline starts like the code does, from all zeros, so every output is 0.
Flower 1 is already right; flower 51 is off by 1. Squared: 0 and 1. Sum 1,
divided by 2n = 4: L = 0.25.

Why square? A negative error and a positive error must not cancel, and a big
error should cost more than a small one. Why the 1/2? Only so the 2 from
differentiating cancels, on the derivation slide.

Learned: w and b. Data: x and y. Set by hand: nothing in this equation — eta
arrives with the update.
-->

---
layout: interactive
title: How gradient descent works
aside-width: 16rem
---

<GradientDescent1D />

::aside::

Where the gradient is positive, step in the **opposite** direction. How far is
the learning rate $\eta$.

Push $\eta$ past **2.0** and the loss climbs instead of falling: every step now
overshoots the minimum by more than it started away from it. That is why the
learning rate is the first thing to tune.

---
layout: default
title: The update, written out
---

# The update, written out

<div class="grid grid-cols-2 gap-6 mt-2 dl-math-xs">
<div>

$$ \mathbf{w} := \mathbf{w} + \Delta\mathbf{w}, \qquad b := b + \Delta b $$

<div v-click class="mt-6">

$$ \Delta\mathbf{w} = -\eta\,\nabla_{\mathbf{w}} L(\mathbf{w}, b) $$

$$ \Delta b = -\eta\,\nabla_{b} L(\mathbf{w}, b) $$

</div>

<div v-click class="mt-4 dl-secondary">
The gradient of the loss. But how do we actually calculate it?
</div>

</div>
<div v-click>

$$ \frac{\partial L}{\partial w_j} = -\frac{1}{n} \sum_i \bigl(y^{(i)} - \sigma(z^{(i)})\bigr)\, x_j^{(i)} $$

$$ \frac{\partial L}{\partial b} = -\frac{1}{n} \sum_i \bigl(y^{(i)} - \sigma(z^{(i)})\bigr) $$

<div class="mt-6">

$$ \Delta w_j = -\eta\,\frac{\partial L}{\partial w_j} $$

$$ \Delta b = -\eta\,\frac{\partial L}{\partial b} $$

</div>

</div>
</div>

<!--
The update rule in full. The next slide names every symbol and computes one
gradient step for the same two flowers.
-->

---
layout: default
title: "Reading the equation: the gradient"
---

# Reading the equation: the gradient

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $:=$ | assignment | overwrite with the new value | $w_1 := 0 + 0.35$ |
| $\nabla_{\mathbf{w}} L$ | gradient | all $m$ partial derivatives, as one vector | $[-3.5,\ -2.35]$ |
| $\frac{\partial L}{\partial w_j}$ | partial derivative | how fast $L$ changes if only $w_j$ moves | $-3.5$ |
| $\eta$ | learning rate | step size (set by hand) | $0.1$ |
| $y^{(i)} - \sigma(z^{(i)})$ | error | label minus output | $0,\ 1$ |
| $x_j^{(i)}$ | feature $j$ of flower $i$ | data | $5.1,\ 7.0$ |
| $\sum_i,\ n$ | sum over examples | average over the $n$ flowers | $n = 2$ |
| $\Delta w_j,\ \Delta b$ | update step | minus $\eta$ times the gradient | $0.35,\ 0.05$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" style="width:100%;max-width:19rem;height:auto" role="img" aria-label="Worked example: errors 0 and 1 times sepal lengths 5.1 and 7.0 give 0 and 7.0; minus one half of the sum is minus 3.5">
  <g style="fill:var(--dl-surface);stroke:var(--dl-border);stroke-width:1.5">
    <rect x="80" y="8" width="60" height="28" rx="3" />
    <rect x="150" y="8" width="60" height="28" rx="3" />
    <rect x="80" y="54" width="60" height="28" rx="3" />
    <rect x="150" y="54" width="60" height="28" rx="3" />
  </g>
  <g style="fill:var(--dl-accent-soft);stroke:var(--dl-accent);stroke-width:1.5">
    <rect x="80" y="100" width="60" height="28" rx="3" />
    <rect x="150" y="100" width="60" height="28" rx="3" />
  </g>
  <g style="fill:var(--dl-heading);font-size:13px" text-anchor="middle">
    <text x="110" y="27">0</text>
    <text x="180" y="27">1</text>
    <text x="110" y="73">5.1</text>
    <text x="180" y="73">7.0</text>
    <text x="110" y="119">0</text>
    <text x="180" y="119">7.0</text>
    <text x="256" y="119">−3.5</text>
  </g>
  <g style="fill:var(--dl-muted);font-size:11px">
    <text x="72" y="26" text-anchor="end">error</text>
    <text x="72" y="72" text-anchor="end">x₁</text>
    <text x="72" y="118" text-anchor="end">product</text>
    <text x="110" y="146" text-anchor="middle">flower 1</text>
    <text x="180" y="146" text-anchor="middle">flower 51</text>
    <text x="256" y="100" text-anchor="middle">−½ × sum</text>
  </g>
</svg>

<div v-click class="dl-callout">

$\frac{\partial L}{\partial w_1} = -\tfrac12(0 \times 5.1 + 1 \times 7.0) = -3.5$

$\frac{\partial L}{\partial b} = -\tfrac12(0 + 1) = -0.5$

$\Delta w_1 = -0.1 \times (-3.5) = 0.35$, $\ \Delta b = 0.05$

</div>

</div>
</div>

<!--
Same start as the loss slide: w = [0, 0], b = 0, so the errors are 0 for
flower 1 and 1 for flower 51.

The gradient is negative: making w1 bigger makes the loss smaller. So the
step, minus eta times the gradient, is positive. That minus sign is the whole
idea of gradient descent: walk downhill.

For w2 (petal length): -1/2 × (0 × 1.4 + 1 × 4.7) = -2.35, so delta w2 =
0.235. All three parameters move at once, from one gradient.

A question for the room: after this one step, w = [0.35, 0.235], b = 0.05,
and the loss goes UP, from 0.25 to 2.87. Why? Sepal length is about 5 to 7 cm,
so eta = 0.1 is too big a step for these raw features. Feature scaling, a few
slides on, is the fix.
-->

---
layout: default
title: How do we calculate the MSE derivative?
---

# How do we calculate the MSE derivative?

<div class="dl-secondary">

As before: loss $L$ over $n$ flowers, label $y^{(i)}$, feature $x_j^{(i)}$, weight $w_j$, bias $b$, output $\sigma(z^{(i)}) = z^{(i)}$.

</div>

<div class="dl-derivation dl-math-sm">

<div>

$$ \frac{\partial L}{\partial w_j} = \frac{\partial}{\partial w_j} \frac{1}{2n} \sum_i \Bigl(y^{(i)} - \sigma(z^{(i)})\Bigr)^2 $$

</div>

<div v-click>

$$ = \frac{1}{n} \sum_i \Bigl(y^{(i)} - \sigma(z^{(i)})\Bigr) \frac{\partial}{\partial w_j}\Bigl(y^{(i)} - \sigma(z^{(i)})\Bigr) $$

</div>

<div v-click>

$$ = \frac{1}{n} \sum_i \Bigl(y^{(i)} - \sigma(z^{(i)})\Bigr) \frac{\partial}{\partial w_j}\Bigl(y^{(i)} - \bigl(\textstyle\sum_k w_k x_k^{(i)} + b\bigr)\Bigr) $$

</div>

<div v-click>

$$ = \frac{1}{n} \sum_i \Bigl(y^{(i)} - \sigma(z^{(i)})\Bigr)\bigl(-x_j^{(i)}\bigr) = -\frac{1}{n} \sum_i \Bigl(y^{(i)} - \sigma(z^{(i)})\Bigr) x_j^{(i)} $$

</div>

</div>

<div v-click class="mt-2 dl-secondary">

Index $k$ runs over features; only $k = j$ holds $w_j$. Two flowers: $-\tfrac12(0 \times 5.1 + 1 \times 7.0) = -3.5$.

</div>

<!--
Step 3: only the k = j term of the inner sum contains w_j, so the inner
derivative is -x_j^(i). For dL/db the same steps give -1 in its place.

The 2025 deck stated the loss with 1/2n but derived it as if it were 1/n, so
the printed result was -2/n. Here the 1/2 cancels the 2 and the result is -1/n,
which is what makes the "for convenience" remark true.

Step 3 used to read sum_j (w_j x_j + b): the bias inside the sum would be
added m times, and j would be both the sum index and the weight we
differentiate by. It now sums over k, with b outside the sum.

The last line checks against the gradient slide: -3.5 for w1.
-->

---
layout: default
title: Why Adaline
---

# Why Adaline

<v-clicks>

- $\sigma(z)$ produces a **real number**, not an integer class label. There is a
  gradient to follow.
- The weight update is computed from **all** examples at once — full-batch
  gradient descent — rather than one at a time.

</v-clicks>

<div v-click class="mt-8 dl-callout">
Both of those become problems at scale. The two fixes come next: feature
scaling, then stochastic gradient descent.
</div>

---
layout: interactive
title: Feature scaling — standardisation
aside-width: 17rem
---

<FeatureScaling />

::aside::

$$ x_j' = \frac{x_j - \mu_j}{\sigma_j} $$

Each feature gets mean $0$ and standard deviation $1$, so a single learning rate
suits every weight.

<!--
Standardisation in one line: subtract the mean, divide by the spread. The
next slide puts one real flower through it.
-->

---
layout: default
title: "Reading the equation: standardisation"
---

# Reading the equation: standardisation

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $j$ | feature index | which column; each feature is scaled on its own | $2$ (petal length) |
| $x_j$ | raw feature | one measurement, in cm (data) | $4.7$ cm |
| $\mu_j$ | mean | average of feature $j$ over the training set | $2.86$ cm |
| $\sigma_j$ | standard deviation | typical distance from the mean — **not** the activation $\sigma$ | $1.44$ cm |
| $x_j'$ | standardised feature | distance from the mean, counted in standard deviations; no units | $1.28$ |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" style="width:100%;max-width:19rem;height:auto" role="img" aria-label="Worked example: on the centimetre scale the mean is 2.86 and flower 51 sits at 4.7; on the standardised scale the mean is 0 and flower 51 sits at 1.28">
  <g style="stroke:var(--dl-body);stroke-width:1.4">
    <line x1="20" y1="45" x2="290" y2="45" />
    <line x1="20" y1="115" x2="290" y2="115" />
  </g>
  <g style="stroke:var(--dl-border);stroke-width:1;stroke-dasharray:3 3">
    <line x1="117" y1="45" x2="155" y2="115" />
    <line x1="210" y1="45" x2="238" y2="115" />
  </g>
  <g style="fill:var(--dl-muted)">
    <circle cx="117" cy="45" r="4" />
    <circle cx="155" cy="115" r="4" />
  </g>
  <g style="fill:var(--dl-accent)">
    <circle cx="210" cy="45" r="6" />
    <circle cx="238" cy="115" r="6" />
  </g>
  <g style="fill:var(--dl-heading);font-size:13px" text-anchor="middle">
    <text x="117" y="32">μ = 2.86</text>
    <text x="210" y="32">4.7</text>
    <text x="155" y="102">0</text>
    <text x="238" y="102">1.28</text>
  </g>
  <g style="fill:var(--dl-muted);font-size:11px">
    <text x="20" y="64">raw, cm</text>
    <text x="20" y="134">standardised</text>
  </g>
</svg>

<div v-click class="dl-callout">

Flower 51, petal length: $x_2' = \dfrac{4.7 - 2.86}{1.44} = \dfrac{1.84}{1.44} = 1.28$

Flower 1: $\dfrac{1.4 - 2.86}{1.44} = -1.01$

</div>

</div>
</div>

<!--
mu and sigma are computed once, from the training set: here the 100 setosa
and versicolor flowers. Petal length: mean 2.861 cm, standard deviation
1.442 cm (the population formula, divide by n, as NumPy's std does).

Flower 51 has a petal 1.84 cm longer than average, which is 1.28 standard
deviations. Flower 1 is about one standard deviation below. After scaling,
both features live on the same scale, so one learning rate suits both.

Warn the room about the clash: sigma_j here is a standard deviation. The
sigma of the neuron is the activation function. Same letter, two meanings —
the context tells you which.

Nothing in this equation is learned. mu and sigma come from the data; they
are reused, unchanged, on the test set.
-->

---
layout: interactive
title: Large-scale ML and stochastic gradient descent
aside-width: 23rem
---

<SGDvsBatch />

::aside::

One **step** is one update of $\mathbf{w}$ and $b$.

Full-batch descent averages the gradient over the **whole** training set, so all
$n$ examples must be visited before the weights may move once — here $n = 500$;
on ImageNet it is 1.3 million.

**Stochastic gradient descent** estimates that same average from one example —
or a mini-batch — and steps immediately. Noisier, $n$ times cheaper per step,
and it supports **online learning**.

With SGD we normally use an adaptive learning rate, e.g.

<div class="dl-math-xs">

$$ \eta = \frac{c_1}{[\text{number of iterations}] + c_2} $$

</div>

---
layout: default
title: "Reading the equation: a shrinking learning rate"
---

# Reading the equation: a shrinking learning rate

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $\eta$ | learning rate | step size; now it gets smaller as training goes on | $0.1 \to 0.01$ |
| $c_1$ | constant | sets the size of the first steps (set by hand) | $1$ |
| $c_2$ | constant | delays the shrinking and keeps the first $\eta$ finite (set by hand) | $10$ |
| iterations | step counter | updates made so far: $0, 1, 2, \ldots$ | $0,\ 10,\ 90$ |

</v-clicks>

<div v-click class="mt-3 dl-secondary">
Why shrink it? Large early steps travel fast. Small late steps stop the noise
of stochastic gradient descent from jumping around the minimum.
</div>

</div>
<div>

<svg viewBox="0 0 300 150" style="width:100%;max-width:19rem;height:auto" role="img" aria-label="Worked example: the learning rate falls from 0.1 at iteration 0 to 0.05 at iteration 10, 0.02 at 40 and 0.01 at 90">
  <g style="stroke:var(--dl-body);stroke-width:1.4;fill:none">
    <polyline points="40,10 40,120 290,120" />
  </g>
  <polyline points="40,20.0 45,36.7 50,48.6 55,57.5 60,64.4 65,70.0 75,78.3 85,84.3 100,90.6 115,95.0 140,100.0 165,103.3 190,105.7 227.5,108.2 265,110.0" style="fill:none;stroke:var(--dl-accent);stroke-width:2" />
  <g style="fill:var(--dl-accent)">
    <circle cx="40" cy="20" r="4" />
    <circle cx="65" cy="70" r="4" />
    <circle cx="140" cy="100" r="4" />
    <circle cx="265" cy="110" r="4" />
  </g>
  <g style="fill:var(--dl-heading);font-size:12px">
    <text x="48" y="18">0.1</text>
    <text x="72" y="66">0.05</text>
    <text x="146" y="96">0.02</text>
    <text x="252" y="104" text-anchor="end">0.01</text>
  </g>
  <g style="fill:var(--dl-muted);font-size:11px" text-anchor="middle">
    <text x="40" y="136">0</text>
    <text x="65" y="136">10</text>
    <text x="140" y="136">40</text>
    <text x="265" y="136">90</text>
    <text x="165" y="149">iterations</text>
    <text x="20" y="70" transform="rotate(-90 20 70)">η</text>
  </g>
</svg>

<div v-click class="dl-callout">

$c_1 = 1$, $c_2 = 10$:

$\eta = \tfrac{1}{0 + 10} = 0.1, \quad \tfrac{1}{10 + 10} = 0.05, \quad \tfrac{1}{90 + 10} = 0.01$

</div>

</div>
</div>

<!--
The formula on the previous slide is one common choice of learning-rate
schedule: eta shrinks like 1 over the step count.

c1 and c2 are hyperparameters: nobody learns them, you pick them. c1 = 1 and
c2 = 10 are made-up values that make the arithmetic easy. With c2 = 0 the
first step would divide by zero; c2 also keeps eta from falling too fast.

Why shrink at all? With SGD, each step uses one example (or a few), so each
gradient is noisy. A fixed eta keeps the weights bouncing around the minimum
for ever. A shrinking eta lets them settle.

In PyTorch this is a learning-rate scheduler; lecture 03 onwards.
-->

---
layout: default
title: The perceptron, in code
---

# The perceptron, in code

```python {all|3-5|7-9|11-16|all}{lines:true}
import numpy as np

def net_input(X, w, b):
    """z = Xw + b, for every example at once."""
    return X @ w + b

def predict(X, w, b):
    """The unit step function."""
    return np.where(net_input(X, w, b) >= 0.0, 1, 0)

def fit(X, y, eta=0.01, epochs=50):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        for xi, target in zip(X, y):
            error = target - predict(xi, w, b)
            w += eta * error * xi      # no x on the bias update
            b += eta * error
    return w, b
```

<div class="absolute bottom-12 right-12">
  <Citation source="Runnable version in the course notebook" />
</div>

---
layout: default
title: Adaline, in code
---

# Adaline, in code

The only change is **where the error comes from** — the continuous activation
rather than the thresholded label.

```python {all|4-5|7-9|all}{lines:true}
def fit_adaline(X, y, eta=0.01, epochs=50):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(epochs):
        output = net_input(X, w, b)        # linear activation, not a step
        errors = y - output

        # dL/dw = -(1/n) sum (y - sigma(z)) x
        w += eta * (X.T @ errors) / X.shape[0]
        b += eta * errors.mean()
    return w, b
```

<div v-click class="mt-4 dl-callout">
One indentation level fewer, too: the whole dataset updates at once instead of
one example at a time.
</div>

---
layout: section
index: "03"
---

# Implementing a multilayer ANN from scratch

---
layout: interactive
title: The multilayer perceptron
aside-width: 16rem
---

<MLPDiagram mode="links" :layers="[3, 4, 2]" :width="600" :height="330" />

::aside::

Connect single neurons into a **multilayer feedforward** network: every unit is
joined to **every** unit of the next layer.

Each link carries one **weight**; each unit adds one **bias** (dashed).

More than one hidden layer makes it **deep** — and training those needs special
algorithms, which is where *deep learning* comes from.

<!--
Count the links out loud once: 3x4 + 4x2 = 20 weights, plus 6 biases. Then say
what the same count is for the MNIST network later in the deck — 784x50 + 50x10
= 39,700 — and the point about why we never write them out by hand makes itself.
-->

---
layout: interactive
title: One-hot representation
aside-width: 15rem
---

<OneHotDemo />

::aside::

One output unit per class, so the network never has to learn that class 2 is
"twice" class 1.

---
layout: interactive
title: The MLP learning procedure
aside-width: 16rem
---

<MLPDiagram />

::aside::

<v-clicks>

1. **Forward-propagate** the training patterns
2. **Calculate the loss**
3. **Backpropagate** it, finding the derivative with respect to every weight and bias
4. **Update** them

</v-clicks>

<div v-click class="mt-3 dl-secondary">
And all of it is wasted unless the activations are
<strong>non-linear</strong>. Next slide: why.
</div>

---
layout: default
title: Why the activation has to be non-linear
---

# Why the activation has to be non-linear

<div class="grid grid-cols-2 gap-8 mt-2 dl-tight">
<div>

Let both activations be the identity, $\sigma(z) = z$ — two **linear** layers:

<div class="dl-math-xs">

$$ \mathbf{a}^{(h)} = W^{(h)}\mathbf{x} + \mathbf{b}^{(h)} $$

$$ \mathbf{a}^{(\text{out})} = W^{(\text{out})}\mathbf{a}^{(h)} + \mathbf{b}^{(\text{out})} $$

</div>

<div v-click class="mt-3">

Substitute the first line into the second:

<div class="dl-math-xs">

$$ \mathbf{a}^{(\text{out})} = \underbrace{W^{(\text{out})}W^{(h)}}_{W'}\,\mathbf{x} + \underbrace{W^{(\text{out})}\mathbf{b}^{(h)} + \mathbf{b}^{(\text{out})}}_{\mathbf{b}'} $$

</div>

</div>

</div>
<div>

<div v-click class="dl-callout">

$W'$ is one matrix and $\mathbf{b}'$ is one vector, so the two layers **are** a
single layer $\mathbf{a} = W'\mathbf{x} + \mathbf{b}'$ — a straight decision
boundary again. Stack a hundred: still one matrix. The depth bought nothing.

</div>

<div v-click class="mt-4">

Put a non-linear $\sigma$ back between them:

<div class="dl-math-xs">

$$ \mathbf{a}^{(\text{out})} = W^{(\text{out})}\,\sigma\bigl(W^{(h)}\mathbf{x} + \mathbf{b}^{(h)}\bigr) + \mathbf{b}^{(\text{out})} $$

</div>

</div>

<div v-click class="mt-3">

Now $\sigma$ cannot be moved through the multiplication, so no single $W'$
reproduces it. The layers stop collapsing — which is the *only* reason depth
buys anything.

</div>

</div>
</div>

<!--
Go slowly here. Adaline was a linear model and could not solve XOR; a stack of
linear layers is the same model, so it cannot either. Sigmoid, tanh and ReLU all
supply the bend — compared on the last slide.
-->

---
layout: default
title: "Reading the equation: two linear layers"
---

# Reading the equation: two linear layers

<div class="grid grid-cols-[1.45fr_1fr] gap-5 mt-1 items-start">
<div class="dl-ledger dl-tight dl-eq-legend">

<v-clicks>

| symbol | name | what it is here | example |
| --- | --- | --- | --- |
| $\mathbf{x}$ | input vector | data | $[1,\ 2]$ |
| $^{(h)},\ ^{(\text{out})}$ | layer labels | hidden layer, output layer — not powers | |
| $W^{(h)},\ \mathbf{b}^{(h)}$ | hidden weights, bias | $2 \times 2$ and $2$ numbers, learned | rows $[1,\ 0]$, $[-1,\ 1]$; $[0,\ -2]$ |
| $\mathbf{a}^{(h)}$ | hidden activations | hidden layer's output | $[1,\ -1]$ |
| $W^{(\text{out})},\ \mathbf{b}^{(\text{out})}$ | output weights, bias | $1 \times 2$ and $1$ number, learned | $[2,\ -1]$; $0.5$ |
| $\mathbf{a}^{(\text{out})}$ | network output | | $3.5$ |
| $W',\ \mathbf{b}'$ | merged weights, bias | one layer, same job | $[3,\ -1]$; $2.5$ |
| $\sigma(z) = z$ | identity activation | changes nothing | |

</v-clicks>

</div>
<div>

<svg viewBox="0 0 300 150" style="width:100%;max-width:19rem;height:auto" role="img" aria-label="Worked example: inputs 1 and 2 give hidden values 1 and minus 1 and output 3.5; the single merged layer with weights 3 and minus 1 and bias 2.5 also gives 3.5">
  <g style="fill:none;stroke:var(--dl-border);stroke-width:1.4">
    <line x1="48" y1="30" x2="132" y2="30" />
    <line x1="48" y1="30" x2="132" y2="90" />
    <line x1="48" y1="90" x2="132" y2="30" />
    <line x1="48" y1="90" x2="132" y2="90" />
    <line x1="168" y1="30" x2="242" y2="60" />
    <line x1="168" y1="90" x2="242" y2="60" />
  </g>
  <g style="fill:var(--dl-surface);stroke:var(--dl-border);stroke-width:1.5">
    <circle cx="30" cy="30" r="18" />
    <circle cx="30" cy="90" r="18" />
    <circle cx="150" cy="30" r="18" />
    <circle cx="150" cy="90" r="18" />
  </g>
  <circle cx="260" cy="60" r="20" style="fill:var(--dl-accent-soft);stroke:var(--dl-accent);stroke-width:1.5" />
  <g style="fill:var(--dl-heading);font-size:13px" text-anchor="middle">
    <text x="30" y="35">1</text>
    <text x="30" y="95">2</text>
    <text x="150" y="35">1</text>
    <text x="150" y="95">−1</text>
    <text x="260" y="65">3.5</text>
  </g>
  <g style="fill:var(--dl-muted);font-size:11px" text-anchor="middle">
    <text x="30" y="124">x</text>
    <text x="150" y="124">a⁽ʰ⁾</text>
    <text x="260" y="96">a⁽ᵒᵘᵗ⁾</text>
    <text x="150" y="145">merged: W′x + b′ = 3.5</text>
  </g>
</svg>

<div v-click class="dl-callout">

Two layers: $\mathbf{a}^{(h)} = [1,\ -1 + 2 - 2] = [1,\ -1]$

then $2 \times 1 - 1 \times (-1) + 0.5 = 3.5$

One layer: $3 \times 1 - 1 \times 2 + 2.5 = 3.5$ — the same.

</div>

</div>
</div>

<!--
A tiny network, 2 inputs, 2 hidden units, 1 output, so every number fits on
the slide. The MNIST network has 784, 50 and 10; nothing else changes.

The superscripts are labels, not powers: W^(h) is "the hidden layer's W".

Merge the layers by hand. W' = W_out times W_h: [2, -1] times the rows
[1, 0] and [-1, 1] gives [2·1 + (-1)(-1), 2·0 + (-1)(1)] = [3, -1].
b' = W_out b_h + b_out = 2·0 + (-1)(-2) + 0.5 = 2.5. Then W'x + b' =
3 - 2 + 2.5 = 3.5, exactly what the two layers gave.

Now put a non-linear sigma between them: max(0, z) turns the hidden -1 into 0,
and the output becomes 2·1 - 1·0 + 0.5 = 2.5. The merged layer still says 3.5,
so it no longer matches. That mismatch is the point of the previous slide.
-->

---
layout: figure
title: Example — labelling handwritten digits
---

<MnistPipeline />

::caption::

The exercise for this week: an MLP on MNIST, written from scratch. Every box on
this diagram is one of the pieces we built today.

::citation::

<Citation source="After Raschka, Liu & Mirjalili, ch. 11" />

<!--
Walk it right to left once: 10 outputs because there are 10 digits, 50 hidden
units because someone picked 50, 784 inputs because the image is 28 by 28. Only
the middle number is a choice.
-->

---
layout: interactive
title: Backpropagation
aside-width: 20rem
---

<ActivationExplorer />

::aside::

**Why backpropagation?** To compute the partial derivatives of a complex,
non-convex function without doing the algebra by hand for every weight.

Select **Unit step**: the derivative is flat zero, which is exactly why the
perceptron could never be trained this way — and why the choice of activation
is the first thing that matters in a deep network.

---
layout: end
email: vajira@simula.no
next: PyTorch for Deep Learning
---

# To be continued…
