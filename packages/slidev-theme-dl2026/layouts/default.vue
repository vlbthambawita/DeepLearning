<template>
  <div class="slidev-layout dl-default">
    <slot />
    <DeckFooter />
  </div>
</template>

<style scoped>
.dl-default {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
</style>
