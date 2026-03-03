<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
    @click="$emit('click')"
  >
    <component :is="icon" :size="22" />
  </button>
</template>
