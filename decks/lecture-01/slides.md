---
theme: dl2026
addons:
  - dl2026
title: Introduction to Deep Learning
info: PGR207 Deep Learning 2026 — Lecture 01
author: Vajira Thambawita
routerMode: hash
transition: slide-left
mdc: true
themeConfig:
  courseCode: PGR207
  lecture: "01"
  lectureTitle: Introduction to Deep Learning
layout: title
courseCode: PGR207
lecture: "01"
email: vajira@simula.no
---

# Deep Learning

Course introduction, what deep learning actually is, and where it already works.

<!--
Phase 0 placeholder deck. Its job is to prove the build + release pipeline
end to end; the real 36-slide conversion lands in Phase 3.
-->

---
layout: section
index: "01"
---

# What is deep learning?

---

# Definition

<v-clicks>

- A **subset of machine learning**: a neural network with three or more layers.
- Networks that *learn* their own features from large amounts of data.
- One neuron computes a net input, then an activation:

</v-clicks>

<div v-click class="mt-6">

$$
z = \mathbf{w}^\top \mathbf{x} + b
\qquad
\hat{y} = \sigma(z)
$$

</div>

<div class="absolute bottom-12 left-12">
  <Citation source="IBM Cloud Learn Hub — Deep Learning" url="https://www.ibm.com/topics/deep-learning" />
</div>

---
layout: interactive
title: Where to practise
---

<div class="grid grid-cols-2 gap-4 w-full">
  <LinkCard href="https://www.kaggle.com/" title="Kaggle" blurb="Competitions, datasets and free GPU notebooks." icon="🏆" />
  <LinkCard href="https://grand-challenge.org/challenges/" title="Grand Challenge" blurb="Medical imaging challenges." icon="🩺" />
  <LinkCard href="https://www.aicrowd.com/" title="AIcrowd" blurb="Open research challenges." icon="🧩" />
  <LinkCard href="https://pytorch.org/" title="PyTorch" blurb="The framework used throughout this course." icon="🔥" />
</div>

::aside::

Six slides in the 2025 deck were a single bare URL each. They live here now.

---

<PollSlide
  question="Who are you?"
  :items="[
    'What level are you studying at?',
    'What do you already know about machine learning?',
    'How much time can you put into this course?',
    'What hardware do you have access to?',
    'How should we communicate?'
  ]"
/>

---
layout: end
email: vajira@simula.no
next: Basics of Neural Networks
---

# Practical session — Week 1
