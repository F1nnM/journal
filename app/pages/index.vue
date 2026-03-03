<script setup lang="ts">
const { user, clear } = useUserSession()
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-4">
    <p class="text-stone-600 dark:text-stone-300">
      Welcome, {{ user?.name ?? 'User' }}
    </p>
    <button
      class="mt-4 rounded-lg bg-stone-200 px-4 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600"
      @click="clear"
    >
      Sign out
    </button>
  </div>
</template>
