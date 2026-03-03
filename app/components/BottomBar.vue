<script setup lang="ts">
const { keyboardVisible } = useKeyboardVisible()
</script>

<template>
  <div
    v-show="!keyboardVisible"
    class="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-stone-50/80 backdrop-blur-lg dark:border-stone-800 dark:bg-stone-900/80"
  >
    <div class="mx-auto flex items-center justify-around px-4 py-2">
      <slot />
    </div>
    <div class="safe-area-bottom" />
  </div>
</template>

<style scoped>
.safe-area-bottom {
  height: env(safe-area-inset-bottom, 0px);
}
</style>
