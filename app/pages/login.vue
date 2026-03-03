<script setup lang="ts">
const config = useRuntimeConfig()
const authUrl = config.public.oidcEnabled ? '/auth/oidc' : '/auth/dev'
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-8 text-center">
      <div class="space-y-2">
        <h1 class="text-4xl font-light tracking-tight text-stone-700 dark:text-stone-200">
          Journal
        </h1>
        <p class="text-sm text-stone-500 dark:text-stone-400">
          Your daily thoughts, one page at a time.
        </p>
      </div>

      <a
        :href="authUrl"
        class="inline-flex w-full items-center justify-center rounded-lg bg-stone-800 px-6 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        Sign in
      </a>
    </div>
  </div>
</template>
