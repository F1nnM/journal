<template>
  <div class="h-dvh overflow-hidden bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 transition-colors">
    <VitePwaManifest />
    <NuxtPage />
  </div>
</template>

<style>
html {
  background-color: #fafaf9; /* stone-50 */
}
html.dark {
  background-color: #1c1917; /* stone-900 */
}
</style>
