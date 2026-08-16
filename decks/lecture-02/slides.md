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

Artificial neurons, the perceptron, Adaline, and gradient descent.

<!--
Stub. Built out in Phase 5 — it is the maths-heavy deck, so roughly 25 equations
currently shipped as book screenshots get retyped as KaTeX here.
-->

---
layout: section
index: "02"
---

# Under construction

This deck is not published yet — `decks.config.json` has `published: false`.

---
layout: interactive
title: The perceptron learning rule
---

<PerceptronPlayground />

::aside::

Each step applies the rule to one sample:

$$\Delta w_j = \eta\,(y^{(i)} - \hat{y}^{(i)})\,x_j^{(i)}$$

Turn off **linearly separable** and run a few epochs — the rule never settles.

---
layout: interactive
title: How gradient descent works
---

<GradientDescent1D />

::aside::

Push η past **2.0** and watch the loss climb instead of fall.

---
layout: interactive
title: Feature scaling — standardisation
---

<FeatureScaling />

::aside::

Same points, different axes. Standardising is what lets a single learning rate
suit every weight.

---
layout: interactive
title: The MLP learning procedure
---

<MLPDiagram />

::aside::

Forward-propagate → loss → backpropagate → update.

Backpropagation walks the **same** graph in reverse.

---
layout: interactive
title: One-hot representation
---

<OneHotDemo />

---
layout: interactive
title: Activation functions
---

<ActivationExplorer />

::aside::

The 2025 slide 30 showed this as a table screenshot.

Pick **Unit step** and look at the derivative: flat zero everywhere. That is the
whole reason Adaline swaps in a **linear** activation before gradient descent
can be applied.
