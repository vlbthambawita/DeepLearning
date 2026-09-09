---
theme: dl2026
addons:
  - dl2026
title: PyTorch for Deep Learning
info: PGR207 Deep Learning 2026 — Lecture 03
author: Vajira Thambawita
routerMode: hash
transition: slide-left
mdc: true
themeConfig:
  courseCode: PGR207
  lecture: "03"
  lectureTitle: PyTorch for Deep Learning
layout: title
courseCode: PGR207
lecture: "03"
email: vajira@simula.no
---

# PyTorch for Deep Learning

A tensor is an array that remembers how it was computed. Everything else in PyTorch is
bookkeeping built on that one fact — and by the end of today it will have trained a network
for you.

<!--
Two sessions. First: tensors, and nothing but tensors — shape, slicing,
reshaping, broadcasting, dim. Second: autograd, nn.Module, the loop, and the
evaluation.

Resist the urge to reach the model early. Every question in next week's lab is a
shape question, and the first half of this deck is the only place they get
answered.
-->

---
layout: interactive
heading: Where we are
title: Where we are
aside-width: 15rem
---

<SyllabusTimeline :current-week="3" />

::aside::

One week, one library.

Nothing new is learned about *neural networks* today. Everything learned today is about
writing down the network we already understand — and then letting the machine do the
calculus.

<!--
Say plainly that this is a tooling lecture, and that it is the most useful one
of the semester: every deck from week 4 on assumes this material without
re-explaining it.
-->

---
layout: default
title: What last week cost us
---

# What last week cost us

Last week's MLP worked. Three things about writing it hurt.

<v-clicks>

- **The gradient was ours to derive.** One slide of algebra, valid for one loss and one
  activation. Change either and you redo it.
- **It ran on the CPU.** A matrix multiply is the same operation on a GPU, a hundred times
  faster — and NumPy cannot reach one.
- **Everything was written twice.** Initialisation, shuffling, one-hot encoding: identical in
  every project on earth.

</v-clicks>

<div v-click class="mt-5 dl-callout">

None of these is a problem with the *idea* of a network. All three are problems with writing
one down.

</div>

<!--
Ask who got their from-scratch MLP working, and who found a bug in the gradient
rather than in the network. That show of hands is the argument for autograd, and
it is more convincing than anything on this slide.
-->

---
layout: section
index: "00"
---

# Why PyTorch

---
layout: interactive
heading: Three things, and that is all it is
title: Three things, and that is all it is
aside-width: 14rem
---

<PipelineBoard mode="pillars" />

::aside::

PyTorch is not a large library pretending to be small. It is genuinely three ideas.

<div class="mt-3 dl-secondary">

Each card names what you did by hand last week, so it is clear what is being replaced — and
what is not. The network is unchanged.

</div>

<!--
Spend most of the time on the middle card. Tensors are a convenience and the
layer library is a convenience; autograd is the one that changes what is
possible, because it makes the cost of trying a different architecture almost
zero.
-->

---
layout: default
title: Who uses it, and why that matters to you
---

# Who uses it, and why that matters to you

<v-clicks>

- Over 80% of papers at NeurIPS, ICML and ICLR that name a framework name PyTorch
- Hugging Face, Lightning, Diffusers, Detectron, nnU-Net — the ecosystem you will want later
  is PyTorch-first
- Which means: when you get stuck, someone has already asked your question in public

</v-clicks>

<div v-click class="mt-4 dl-callout">

The honest reason to teach it: reading other people's models is most of how you will learn
after this course, and those models are in PyTorch.

</div>

<div class="mt-2">
  <Citation source="Framework shares from Papers With Code trends; checked August 2026" url="https://pytorch.org/" />
</div>

<!--
If someone asks about JAX or TensorFlow: both are fine, neither is wrong, and
the concepts today transfer to either. What does not transfer is the muscle
memory, and you only have twelve weeks.
-->

---
layout: section
index: "01"
---

# Tensors

---
layout: interactive
heading: A tensor is an array with a rank
title: A tensor is an array with a rank
aside-width: 15rem
---

<TensorLadder start="scalar" />

::aside::

Click along the tabs. Each picture *contains* the one before it — a matrix is a stack of
vectors, a batch of images a stack of matrices.

<div class="mt-3 dl-secondary">

Then click a cell. The number in it is its position **in memory**; the index that reaches it
is what you type.

</div>

<!--
Do not skip the 0-D tab. Students are surprised that a loss is a tensor at all,
and that is exactly why `print(loss)` shows `tensor(0.324)` rather than a
number — and why `.item()` exists.

The word "rank" also gets used for matrix rank in linear algebra. Say out loud
that this is not that.
-->

---
layout: interactive
heading: Shape is the whole vocabulary
title: Shape is the whole vocabulary
aside-width: 16rem
---

<TensorLadder start="batch" />

::aside::

Every tensor in the second half of today has this shape, or comes from it:

<div class="mt-2 dl-callout">

`images.shape` <span aria-hidden="true">&rarr;</span> `(64, 1, 28, 28)`

64 images · 1 channel · 28 rows · 28 columns

</div>

<div class="mt-3 dl-secondary">

Batch first, channels before the spatial axes — **NCHW**.

</div>

<!--
The picture is a small stand-in: two images of one channel at 4x4. Say the real
numbers while pointing at the axes.

Channels-first is a convention, not a law — TensorFlow defaults to the other
order, and image libraries hand you (H, W, C). That mismatch is the single most
common bug in week 4, so plant the flag now.
-->

---
layout: default
title: Making one
---

# Making one

```python {all|1|3-4|6-7|9-10|12-13|all}{lines:true}
import torch

x = torch.tensor([[1., 2., 3.],           # from a Python list
                  [4., 5., 6.]])          # shape (2, 3)

zeros = torch.zeros(64, 10)               # a shape, filled with 0.0
ones  = torch.ones(3)                     # (3,) of 1.0

steps = torch.arange(0, 10, 2)            # 0 2 4 6 8 — like range()
grid  = torch.linspace(-1, 1, 5)          # 5 points, endpoints included

noise = torch.randn(2, 3)                 # standard normal
same  = torch.from_numpy(np_array)        # shares memory with NumPy
```

<div v-click class="mt-3 dl-secondary">

`torch.tensor` copies data you already have. Everything else takes a **shape** and invents the
contents. That is the whole API.

</div>

<!--
Type `torch.randn(2, 3)` live and print it. Then print `.shape`, `.dtype` and
`.device` — the three attributes worth checking reflexively.

torch.manual_seed(0) before randn if you want the room to see your numbers.
-->

---
layout: default
title: dtype, and the two that bite
---

# `dtype`, and the two that bite

<div class="grid grid-cols-2 gap-8 mt-2">
<div>

<v-clicks>

- **`torch.float32`** — every image, every weight, every activation. The default for
  `randn`, `zeros` and float lists
- **`torch.int64`** — class labels, and only class labels. The default for integer lists
- `torch.float64` exists and you never want it: twice the memory, slow on a GPU

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

```text
RuntimeError: expected scalar type
Long but found Float
```

`nn.CrossEntropyLoss` wants labels as **integers**, not as floats and not one-hot. `.long()`
fixes it.

</div>

<div v-click class="mt-3 dl-secondary">

The mirror image — `... Float but found Long` — means an integer tensor stayed integral.
`.float()` fixes it.

</div>

</div>
</div>

<!--
Read both error messages out loud. Learning to map "Long" to "integer label" and
"Float" to "data" saves the room an hour each in the lab.

No one-hot encoding this year: CrossEntropyLoss takes the class index directly,
which is why Lecture 02's one-hot slide does not carry over.
-->

---
layout: interactive
heading: Indexing and slicing
title: Indexing and slicing
aside-width: 16rem
---

<TensorSlicer />

::aside::

Same syntax as NumPy, same syntax as Python lists.

<div class="mt-2 dl-callout">

An integer index **removes** an axis.
A slice **keeps** it.

</div>

<div class="mt-3 dl-secondary">

Compare `t[1]` with `t[1:2]`: same six numbers, different ranks. That difference is what
makes a broadcast fail three lines later.

</div>

<!--
Walk the tabs left to right. Every value is 10 * row + column, so the room can
check each answer without trusting the widget.

Ask before revealing t[1:3, 2:5]: how many numbers? Slicing off-by-one is worth
one deliberate mistake here rather than twenty in the lab.
-->

---
layout: interactive
heading: Reshape moves nothing
title: Reshape moves nothing
aside-width: 16rem
---

<ReshapeLab />

::aside::

The strip at the top is the tensor: 24 numbers, side by side in memory.

<div class="mt-2 dl-secondary">

Every button below re-reads that same strip. Click an element and watch it stay exactly where
it is while the grid rearranges around it.

</div>

<div v-click class="mt-3 dl-callout">

So the only thing `reshape` can refuse is a shape whose product is not 24.

</div>

<!--
This is the most load-bearing widget in the deck. Give it time.

Press (4, 6) then (6, 4) and ask whether that is a transpose. It is not — a
transpose changes which number sits where, and reshape cannot, because it never
touches the strip. That distinction fixes a whole class of silent bugs.

Finish on (-1, 6) and say where they will actually type it: x.view(x.size(0), -1).
-->

---
layout: default
title: view vs reshape vs flatten
---

# `view` vs `reshape` vs `flatten`

<div class="grid grid-cols-2 gap-8 mt-2">
<div>

<v-clicks>

- **`reshape(...)`** — always works. Returns a view if it can, a copy if it must
- **`view(...)`** — never a copy. Fails when memory is no longer in order, e.g. after a
  `transpose`
- **`flatten(start_dim=1)`** — reshape's common case, named: keep the batch axis, collapse
  everything after it

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

**Use `reshape`**, and `flatten(1)` when the batch axis must survive.

</div>

<div v-click class="mt-4">

```python
x = torch.randn(64, 1, 28, 28)

x.flatten(1).shape       # (64, 784)
x.view(64, -1).shape     # (64, 784)
x.reshape(-1).shape      # (50176,)  — oops
```

</div>

</div>
</div>

<!--
The third line is the bug worth showing: reshape(-1) on a batch flattens the
batch away too, and the error appears later at the loss, complaining about batch
sizes. Say that the fix is always to name the axis you are keeping.
-->

---
layout: interactive
heading: Broadcasting
title: Broadcasting
aside-width: 16rem
---

<BroadcastLab />

::aside::

<div class="dl-callout">

1. Line the shapes up from the **right**
2. Stretch any axis of length **1**
3. Anything else is an error

</div>

<div class="mt-3 dl-secondary">

The dashed cells are the stretch, and are never allocated — which is why adding a bias to 64
samples costs what adding it to one costs.

</div>

<!--
The second tab is the one they will use every day without noticing: nn.Linear
adds a (out_features,) bias to a (batch, out_features) activation, and
broadcasting is why that line is written `x @ W.T + b` and not a loop.

End on the failing tab and read the error out loud. "Non-singleton dimension"
means "an axis that is not 1, so I cannot stretch it".
-->

---
layout: interactive
heading: Reductions, and the dim argument
title: Reductions, and the dim argument
aside-width: 17rem
---

<ReduceDim />

::aside::

<div class="dl-callout">

`dim` is the axis that **disappears**.

</div>

<div class="mt-3 dl-secondary">

Reduce over dim 0 and the answers land under their columns; over dim 1, beside their rows.
`keepdim=True` keeps the axis at length 1.

</div>

<div v-click class="mt-3">

Try **argmax** with **dim=1**: on a batch of logits, one predicted digit per image.

</div>

<!--
Do the mnemonic as a question, not a statement: "t is (3, 4), I call
t.sum(dim=0) — what shape comes back?" Wait for (4,).

The argmax + dim=1 combination is the last line of the evaluation function in
the second half, so make sure it lands before the break.
-->

---
layout: default
title: Matrix multiply is a linear layer
---

# Matrix multiply is a linear layer

```python {all|1-3|4|5|all}{lines:true}
X = torch.randn(64, 784)          # a batch of 64 flattened images
W = torch.randn(128, 784)         # 128 hidden units, one row of weights each
b = torch.randn(128)              # one bias per unit
Z = X @ W.T + b                   # (64, 784) @ (784, 128) -> (64, 128), + (128,)
A = torch.relu(Z)                 # element-wise, shape unchanged
```

<v-clicks>

- The inner dimensions must agree: `(64, **784**) @ (**784**, 128)`. That is the only rule
- The outer ones survive: 64 samples in, 64 out. `+ b` broadcasts, `relu` is element-wise —
  neither changes the shape

</v-clicks>

<div v-click class="mt-3 dl-callout">

Those lines are `nn.Linear(784, 128)` then `nn.ReLU()`. Nothing is hidden in a layer except
`W` and `b`.

</div>

<!--
Write the shapes on the board as a chain: 64x784 -> 64x128 -> 64x10. Every
architecture in this course is a chain like that, and being able to write it
down before running anything is the skill.

Note W is stored as (out, in) and transposed on use — that is a PyTorch
convention and the reason `Linear.weight.shape` surprises people.
-->

---
layout: default
title: Out of the tensor world
---

# Out of the tensor world

<div class="grid grid-cols-2 gap-8 mt-2">
<div>

<v-clicks>

- **`.item()`** — a 0-D tensor to a Python float. The only safe way to accumulate a loss
- **`.tolist()`** — any tensor to nested Python lists
- **`.numpy()`** — a NumPy array *sharing the same memory*
- **`.detach().cpu().numpy()`** — the incantation for plotting a model's output

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

```python
total += loss          # keeps the whole graph alive
total += loss.item()   # keeps a number
```

The first leaks memory for a whole epoch — the classic out-of-memory bug.

</div>

<div v-click class="mt-3 dl-secondary">

`.numpy()` refuses to run on a tensor that requires gradients, on purpose — hence
`.detach()`.

</div>

</div>
</div>

<!--
The `total += loss` bug is worth a moment: it does not crash, it just grows,
and it is the reason every training loop you read online writes `.item()`.

Demonstrate the shared memory of from_numpy / .numpy() if there is time; it
surprises people, and it is occasionally useful.
-->

---
layout: default
title: Devices
---

# Devices

```python {all|1|3-5|all}{lines:true}
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = model.to(device)            # moves the parameters, in place
images = images.to(device)          # returns a *new* tensor on the device
labels = labels.to(device)
```

<v-clicks>

- One line at the top of the notebook, then `.to(device)` on the model and on every batch
- **A model and its input must be on the same device.** Nothing else about your code changes

</v-clicks>

<div v-click class="mt-4 dl-callout">

```text
RuntimeError: Expected all tensors to be on the same device,
but found at least two devices, cuda:0 and cpu!
```

</div>

<!--
Note the asymmetry: model.to() mutates, tensor.to() returns a copy. Forgetting
the assignment on a tensor is a real bug — `images.to(device)` on its own line
does nothing at all.

In Colab: Runtime > Change runtime type > GPU, then re-run the first cell.
Everything today also runs on the CPU, just slower.
-->

---
layout: default
title: Your turn — six shapes
---

# Your turn — six shapes

`x` is `(64, 1, 28, 28)`. What comes back?

<div class="grid grid-cols-2 gap-x-10 gap-y-1 mt-3 dl-tight">
<div>

<v-clicks>

- `x[0].shape` <span aria-hidden="true">&rarr;</span> `(1, 28, 28)`
- `x[:, 0].shape` <span aria-hidden="true">&rarr;</span> `(64, 28, 28)`
- `x.flatten(1).shape` <span aria-hidden="true">&rarr;</span> `(64, 784)`

</v-clicks>

</div>
<div>

<v-clicks>

- `x.mean(dim=(2, 3)).shape` <span aria-hidden="true">&rarr;</span> `(64, 1)`
- `x.reshape(64, -1).shape` <span aria-hidden="true">&rarr;</span> `(64, 784)`
- `(x + torch.ones(28)).shape` <span aria-hidden="true">&rarr;</span> `(64, 1, 28, 28)`

</v-clicks>

</div>
</div>

<div v-click class="mt-5 dl-callout">

Six answers, three rules: an integer index drops its axis, a reduction drops the axes it
names, and broadcasting aligns from the right.

</div>

<!--
Ask for each answer before clicking. Expect the fourth to be wrong — the
channel axis survives because it was not named, which catches almost everyone.

The last one is worth the pause: a (28,) tensor broadcasts against the width of
an image batch. It is legal, it is silent, and it is almost certainly not what
the author meant.
-->

---
layout: section
index: "02"
---

# Autograd

---
layout: interactive
heading: The graph PyTorch builds behind your back
title: The graph PyTorch builds behind your back
aside-width: 16rem
---

<AutogradGraph />

::aside::

One neuron and a squared error — Lecture 02's Adaline plus a sigmoid.

<div class="mt-2 dl-secondary">

**Step** three times for the forward pass, which computes the numbers *and* records where each
came from. Three more for the backward pass, which walks the same graph in reverse.

</div>

<div v-click class="mt-3 dl-callout">

Nobody derived $\partial L/\partial w$. It was multiplied along a path.

</div>

<!--
Drive it slowly. The single insight is that the arrows reverse and nothing else
changes — the backward pass is the forward graph, walked backwards, with a local
derivative on each edge.

Then move the w slider and step again, so it is clear that the graph is rebuilt
every iteration rather than compiled once. That is what "define-by-run" means,
and it is why a Python `if` inside forward() is allowed.
-->

---
layout: default
title: The gradient we derived by hand
---

# The gradient we derived by hand

Two weeks ago this took a slide of algebra, and it is true only for *this* loss and *this*
activation:

<div class="dl-math-sm">

$$ \frac{\partial L}{\partial w_j} = -\frac{1}{n} \sum_i \Bigl(y^{(i)} - \sigma(z^{(i)})\Bigr) x_j^{(i)} $$

</div>

<div v-click class="mt-2">

```python {all}{lines:false}
loss = ((y - torch.sigmoid(X @ w + b)) ** 2).mean() / 2
loss.backward()          # w.grad now holds exactly the expression above
```

</div>

<div v-click class="mt-5 dl-callout">

Change the loss to cross-entropy, add a layer, swap the sigmoid for a ReLU — the second line
is unchanged. That is the whole value of autograd, and it is why the rest of this course can
move fast.

</div>

<!--
Worth stating explicitly: autograd is not doing symbolic differentiation and it
is not approximating with finite differences. It applies the chain rule
numerically over the graph it recorded, which is exact and costs about as much
as the forward pass.
-->

---
layout: interactive
heading: Gradients accumulate
title: Gradients accumulate
aside-width: 17rem
---

<AutogradGraph mode="accumulate" />

::aside::

`.grad` is **added into**, never overwritten.

<div class="mt-2 dl-secondary">

Press `loss.backward()` twice without zeroing, and the gradient is twice what it should be.
The optimiser steps twice too far, the loss stops falling, and nothing errors.

</div>

<div v-click class="mt-3 dl-callout">

Hence one line in every training loop:

`optimiser.zero_grad()`

</div>

<!--
The obvious question: why is accumulation the default if it is a trap? Because
it is what makes gradient accumulation over several small batches possible on a
small GPU — a real technique, just not one for this course.

Show the failure mode honestly: no exception, just a model that will not train.
That is why the line is not optional.
-->

---
layout: default
title: Three rules for requires_grad
---

# Three rules for `requires_grad`

<div class="grid grid-cols-2 gap-8 mt-2">
<div>

<v-clicks>

- **Leaves opt in.** Data is `False`; parameters are `True`, set for you by `nn.Parameter`
- **Results inherit.** Any tensor computed from one that requires gradients requires them too,
  and carries a `grad_fn`
- **`.grad` only fills in on leaves.** Intermediate tensors are differentiated *through*, not
  *for*

</v-clicks>

</div>
<div>

<div v-click class="dl-callout">

```python
with torch.no_grad():
    logits = model(images)   # no graph built
```

Use it whenever you are not about to call `backward()`: evaluation, and inspection. Less
memory, faster.

</div>

<div v-click class="mt-3 dl-secondary">

`t.detach()` is the same idea for one tensor: same numbers, cut out of the graph.

</div>

</div>
</div>

<!--
`backward()` on a tensor that never required gradients raises "element 0 of
tensors does not require grad" — a confusing message that almost always means a
no_grad block, or a tensor that was rebuilt from .numpy() halfway through.
-->

---
layout: section
index: "03"
---

# Every PyTorch program is five pieces

---
layout: interactive
heading: The five pieces
title: The five pieces
aside-width: 15rem
---

<PipelineBoard />

::aside::

Click each box. Together they are every training script you will read this semester.

<div class="mt-3 dl-secondary">

What the picture says and a list cannot: the loop is not a fifth peer, it is the thing that
runs the other four.

</div>

<div class="mt-3 dl-callout">

Next week's CNN changes exactly one box.

</div>

<!--
Promise them that this diagram is worth memorising, and keep the promise: the
CNN deck literally reuses this loop and says so.

If asked where validation fits: it is a second loop, outside this one, with the
optimiser removed. That is slide 41.
-->

---
layout: interactive
heading: Dataset and DataLoader
title: Dataset and DataLoader
aside-width: 16rem
---

<BatchLoader />

::aside::

A **Dataset** fetches sample *i*. A **DataLoader** turns that into batches.

<div class="mt-2 dl-secondary">

Drag `batch_size` to 5: two batches of five and one of two. A short last batch is normal —
never hardcode a batch size in your model.

</div>

<div v-click class="mt-3 dl-callout">

`shuffle=True` reshuffles every epoch.

</div>

<!--
Three things to say out loud: len(loader) is the number of *batches*, not
samples; shuffle applies per epoch, not once; and drop_last=True is fine for
training and wrong for evaluation, because you would be scoring on less than the
whole test set.

Skip num_workers and pin_memory. They matter, and they are not today.
-->

---
layout: figure
heading: MNIST, and what one sample is
title: MNIST, and what one sample is
---

<MnistPipeline />

::caption::

70 000 handwritten digits, 28×28 pixels, grey-scale. One sample is a **tensor** of shape
`(1, 28, 28)` and an **integer** label from 0 to 9 — not a one-hot vector.

::citation::

<Citation source="LeCun, Cortes & Burges, The MNIST database" url="https://yann.lecun.com/exdb/mnist/" />

<!--
Same figure as Lecture 02, deliberately: the network is the one they wrote by
hand, and today it gets written again in twenty lines.

The 784 on the left is the flatten. Point at it and say that this is the line
Lecture 04 deletes.
-->

---
layout: default
title: transforms — ToTensor and Normalize
---

# `transforms` — two lines that matter

```python {all|1|3-6|8-11|all}{lines:true}
from torchvision import datasets, transforms

transform = transforms.Compose([
    transforms.ToTensor(),                        # PIL image -> (1, 28, 28) float32 in [0, 1]
    transforms.Normalize((0.1307,), (0.3081,)),   # (x - mean) / std, per channel
])

full_train = datasets.MNIST(root="data", train=True,
                            download=True, transform=transform)
test_set = datasets.MNIST(root="data", train=False,
                          download=True, transform=transform)
```

<v-clicks>

- `ToTensor` does two jobs: rearranges to channels-first, and divides by 255
- `0.1307` and `0.3081` are MNIST's own mean and standard deviation. **Standardisation, from
  Lecture 02** — same idea, one line

</v-clicks>

<!--
Callback to the feature-scaling slide in Lecture 02: gradient descent converges
faster when the inputs are centred and scaled, and that argument has not
changed. The numbers are computed from the training set only.

If someone asks why not compute them at runtime: you can, and for a real dataset
you should — over the training split, never the test split.
-->

---
layout: default
title: Three splits, one rule
---

# Three splits, one rule

<div class="grid grid-cols-2 gap-8 mt-2">
<div>

<v-clicks>

- **train** — 54 000 images. The optimiser sees these
- **validation** — 6 000 images. You see these, every epoch, to decide when to stop and what
  to change
- **test** — 10 000 images. Touched **once**, at the very end, to report a number

</v-clicks>

</div>
<div>

<div v-click>

```python
train_set, val_set = random_split(
    full_train, [54_000, 6_000],
    generator=torch.Generator().manual_seed(0),
)
```

</div>

<div v-click class="mt-4 dl-callout">

Tune on the test set and its number stops meaning anything — you have fitted your *choices*
to it, and there is nothing left to estimate generalisation with.

</div>

</div>
</div>

<!--
The seeded generator is not decoration: without it the split changes on every
run and two experiments are no longer comparable.

Most published MNIST numbers use the 60 000 / 10 000 split with no validation
set at all, which is why so many of them are quietly optimistic.
-->

---
layout: default
title: An nn.Module has exactly two parts
---

# An `nn.Module` has exactly two parts

```python {all|1-2|4-5|6-13|15-16|all}{lines:true}
import torch.nn as nn

class MnistFCNN(nn.Module):
    def __init__(self, hidden1=128, hidden2=64):
        super().__init__()                      # never forget this line
        self.flatten = nn.Flatten()
        self.net = nn.Sequential(
            nn.Linear(28 * 28, hidden1),
            nn.ReLU(),
            nn.Linear(hidden1, hidden2),
            nn.ReLU(),
            nn.Linear(hidden2, 10),             # 10 logits, no activation
        )

    def forward(self, x):                       # x: (batch, 1, 28, 28)
        return self.net(self.flatten(x))        # -> (batch, 10)
```

<div v-click class="mt-1 dl-secondary">

`__init__` **registers** the pieces that own parameters; `forward` says what to do with an
input. There is no third part.

</div>

<!--
Two things that catch people. Assigning a layer to `self` is what registers its
parameters — a layer built inside forward() is invisible to the optimiser. And
you call `model(x)`, never `model.forward(x)`, because __call__ does bookkeeping
around it that hooks and eval mode depend on.
-->

---
layout: interactive
heading: The network, priced
title: The network, priced
aside-width: 15rem
---

<FcnnBuilder />

::aside::

The same network, as a shape ledger you can write down before running anything.

<div class="mt-2 dl-secondary">

Each `Linear` costs `in × out + out`. `ReLU` and `Flatten` cost nothing — they have no
parameters to learn.

</div>

<div v-click class="mt-3 dl-callout">

Drag **hidden 1**. It is wired to all 784 pixels, so it dominates the bill.

</div>

<!--
Do the arithmetic for the first layer out loud: 784 x 128 = 100,352 weights,
plus 128 biases, 100,480. Then note that the other two layers together are under
9,000.

That imbalance is exactly where Lecture 04 starts, so say the sentence now: most
of this model is one layer trying to look at every pixel at once.
-->

---
layout: default
title: Why flatten, and why no softmax
---

# Why flatten, and why no softmax

<div class="grid grid-cols-2 gap-8 mt-2">
<div>

<v-clicks>

- `nn.Linear` takes a **vector** per sample, so the image must be flattened: `(1, 28, 28)`
  becomes `(784,)`
- Flattening throws away which pixels were neighbours. The network has to rediscover that
  from data — **and that is what Lecture 04 fixes**

</v-clicks>

</div>
<div>

<v-clicks>

- The last layer outputs 10 raw numbers, called **logits**. Bigger means more confident
- `nn.CrossEntropyLoss` applies `log_softmax` **itself**. Add your own softmax and you have
  applied it twice

</v-clicks>

<div v-click class="mt-4 dl-callout">

Softmax twice does not crash. It trains slowly and badly, which is worse.

</div>

</div>
</div>

<!--
The double-softmax bug is common and silent, so name it before they meet it. If
they want probabilities to look at, `torch.softmax(logits, dim=1)` outside the
loss is fine — just never inside the model.

And argmax over logits needs no softmax at all: softmax is monotonic, so the
largest logit is the largest probability.
-->

---
layout: default
title: Loss and optimiser
---

# Loss and optimiser

```python {all|1|3|5|all}{lines:true}
loss_fn = nn.CrossEntropyLoss()          # logits in, integer labels in, one scalar out

optimiser = torch.optim.SGD(model.parameters(), lr=0.1)         # Lecture 02's rule
optimiser = torch.optim.Adam(model.parameters(), lr=1e-3)        # a per-parameter step size
```

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

<v-clicks>

- **`model.parameters()`** is the handle. The optimiser holds references to the same tensors
  the model uses
- **`lr`** is the single most important number in the file. Too big diverges, too small
  crawls

</v-clicks>

</div>
<div>

<v-clicks>

- **SGD** is exactly the update from Lecture 02: subtract `lr` times the gradient
- **Adam** keeps a running scale per parameter, so it needs far less tuning. Start with
  `Adam(lr=1e-3)`

</v-clicks>

</div>
</div>

<!--
Do not derive Adam. The honest teaching line is: it is SGD with a per-parameter
step size that adapts, its default learning rate works on almost everything, and
you will meet the details in a later course.

Point out the two lines are alternatives, not a sequence — only one optimiser.
-->

---
layout: default
title: The training loop
---

# The training loop

```python {all|1-3|5-6|7-9|10-11|12-14|all}{lines:true}
model = MnistFCNN().to(device)
loss_fn = nn.CrossEntropyLoss()
optimiser = torch.optim.Adam(model.parameters(), lr=1e-3)

for epoch in range(10):
    model.train()                                # training mode, every epoch
    for images, labels in train_loader:          # one batch
        images = images.to(device)
        labels = labels.to(device)
        logits = model(images)                   # forward
        loss = loss_fn(logits, labels)           # one scalar
        optimiser.zero_grad()                    # clear last batch's gradients
        loss.backward()                          # fill every .grad
        optimiser.step()                         # change every parameter
```

<div v-click class="mt-2 dl-secondary">

Four lines do the work: **forward, loss, backward, step**. They are in that order in every
PyTorch program ever written.

</div>

<!--
Say the four words as a chant, and have the room say them back. That is not a
gimmick: reciting the order is what stops the zero_grad from drifting to the
wrong place.

zero_grad before backward, not after step — both work, one is easier to reason
about. Pick this one and be consistent.
-->

---
layout: section
index: "04"
---

# Did it work?

---
layout: default
title: train, eval and no_grad
---

# `train()`, `eval()` and `no_grad()`

```python {all|1-2|3-4|5-11|12|all}{lines:true}
@torch.no_grad()                                    # no graph, no gradients, less memory
def evaluate(model, loader, loss_fn, device):
    model.eval()                                    # evaluation mode
    total_loss = correct = seen = 0
    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)
        logits = model(images)
        total_loss += loss_fn(logits, labels).item() * labels.size(0)
        correct += (logits.argmax(dim=1) == labels).sum().item()
        seen += labels.size(0)
    return total_loss / seen, correct / seen
```

<div v-click class="mt-1 dl-secondary">

`model.eval()` switches layers that behave differently at test time; `no_grad()` saves memory.
Two concerns, both needed. And `argmax(dim=1)` is one predicted digit per image.

</div>

<!--
Our network has no dropout or batch-norm, so eval() changes nothing yet — write
it anyway, because the habit is what saves them in week 5 and forgetting it
produces no error at all.

The multiply-by-batch-size in the loss accumulation is deliberate: the last
batch is smaller, so a plain average of batch averages is subtly wrong.
-->

---
layout: interactive
heading: Accuracy is one number over 10 000 images
title: Accuracy is one number over 10 000 images
aside-width: 17rem
---

<ConfusionMatrix />

::aside::

**98.2%.** The useful question: *which* 180 did it get wrong?

<div class="mt-2 dl-secondary">

A row is one true digit, a column is what the model said. The diagonal has its own colour
scale — 981 beside 16 would flatten everything else to nothing.

</div>

<div v-click class="mt-3 dl-callout">

Press **the 4/9 pair**: 31 of the 180 errors are those two digits.

</div>

<!--
Ask what a human confusion matrix on MNIST would look like before showing this.
The answer is that it would have the same hot cells — 4/9, 3/5, 7/2 — which is
the most reassuring thing a confusion matrix can tell you.

Toggle row % and say what a row summing to 100% means: that is recall, per
class, which is the next slide.
-->

---
layout: interactive
heading: Precision, recall, F1 — per class
title: Precision, recall, F1 — per class
aside-width: 17rem
---

<ConfusionMatrix mode="metrics" />

::aside::

<div class="dl-callout">

**precision** — when it said 9, was it right?

**recall** — of the real 9s, how many did it find?

</div>

<div class="mt-3 dl-secondary">

The same 100 numbers, read two ways. F1 is their harmonic mean.

</div>

<div v-click class="mt-3">

Report this table, not just the accuracy — three lines with `classification_report`.

</div>

<!--
MNIST is balanced, so accuracy is not actively misleading here — say that, then
say that almost nothing else you will ever work on is balanced. On a dataset
that is 99% healthy scans, a model that always says "healthy" scores 99%.

Class 9 is worst on both metrics: 28 nines missed, 30 other digits wrongly
called nine. Those two numbers are the row and the column of the matrix.
-->

---
layout: interactive
heading: Learning curves
title: Learning curves
aside-width: 17rem
---

<LearningCurves />

::aside::

The **shape of the pair** is the diagnosis.

<div class="mt-2 dl-secondary">

**underfitting** — both high and flat. Bigger model, higher lr, more epochs.

**overfitting** — training falls, validation turns and climbs. Stop at the marker.

</div>

<div v-click class="mt-3 dl-callout">

A final accuracy cannot tell these two apart. They have opposite fixes.

</div>

<!--
Walk the three tabs in order and let them name each one before you do.

On the overfitting tab, switch the metric to accuracy: training accuracy goes to
99.9% and stays there, looking wonderful. That is the slide's real point — the
number you are most tempted to report is the one that hides the problem.

Say plainly that plotting these two curves every epoch is not optional in the
assignment.
-->

---
layout: default
title: Five bugs, and the symptom of each
---

# Five bugs, and the symptom of each

<div class="dl-tight">

<v-clicks>

- **Forgot `zero_grad()`** → loss wanders or explodes, no error message
- **Forgot `.to(device)` on the batch** → `Expected all tensors to be on the same device`
- **Softmax inside the model** *and* `CrossEntropyLoss` → trains, badly, no error message
- **Float labels** → `expected scalar type Long but found Float`
- **Wrong flatten** → a shape mismatch at the first `Linear`, which names both shapes

</v-clicks>

</div>

<div v-click class="mt-5 dl-callout">

Three of the five raise nothing at all. When a model trains but will not learn, check those
three before you touch the architecture.

</div>

<!--
Worth the slide: these five account for nearly every question in the lab.

Break the flatten live and read the error together — it prints both shapes, and
learning to read it is a skill they will use every week from here on.
-->

---
layout: default
title: The exercise
---

# The exercise

<div class="grid grid-cols-2 gap-10 mt-2 dl-tight">
<div>

**Build it**

<v-clicks>

- The FCNN from slide 33, on MNIST, in PyTorch
- `random_split` for a validation set, seeded
- `Adam(lr=1e-3)`, ten epochs

</v-clicks>

</div>
<div>

**Then report it properly**

<v-clicks>

- Train and validation loss per epoch, plotted
- The confusion matrix, plus per-class precision and recall
- Test accuracy, computed **once**
- One sentence: underfitting, overfitting or neither — and how you can tell

</v-clicks>

</div>
</div>

<div v-click class="mt-3 dl-callout">

Then change one thing — width, learning rate, optimiser — and report what it did to the
*validation* curve.

</div>

<!--
The last paragraph is the actual assessment. Anyone can reach 97% by copying a
tutorial; the skill being examined is whether they can say what a change did and
support it with a plot.

Expect 97.5-98.2% with this architecture. Anything above 99% on MNIST needs
convolution, which is next week.
-->

---
layout: default
title: Where we got to
---

# Where we got to

<div class="grid grid-cols-2 gap-10 mt-2">
<div>

<v-clicks>

- A tensor is an array **plus a shape**, and reshape only changes the shape
- `dim` is the axis that disappears; broadcasting aligns from the right
- The graph is recorded as you compute, so `backward()` needs no algebra

</v-clicks>

</div>
<div>

<v-clicks>

- Five pieces: data, model, loss, optimiser, loop
- Four lines: forward, loss, backward, step
- An evaluation is a matrix and two curves, not one number

</v-clicks>

</div>
</div>

<div v-click class="mt-2 dl-callout">

98% on MNIST, from a network that discards which pixels were neighbours. Next week we stop.

</div>

<!--
End on the flatten. It is the one line in today's model that is obviously
throwing information away, and noticing that is the whole motivation for the
CNN deck.

Say the rest of the sentence out loud rather than putting it on the slide: the
CNN is smaller *and* better, which is a rare combination and worth flagging.
-->

---
layout: end
email: vajira@simula.no
next: Deep Convolutional Neural Networks
---

# To be continued…
