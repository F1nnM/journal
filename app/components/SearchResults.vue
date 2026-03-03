<script setup lang="ts">
defineProps<{
  results: Array<{
    id: string
    date: string
    snippet: string
  }>
}>()

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function onResultClick(date: string) {
  navigateTo(`/entry/${date}`)
}
</script>

<template>
  <div class="space-y-2 px-2">
    <div v-if="results.length === 0" class="py-12 text-center text-stone-400 dark:text-stone-500">
      No results found.
    </div>

    <button
      v-for="result in results"
      :key="result.id"
      class="w-full rounded-lg p-4 text-left transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
      @click="onResultClick(result.date)"
    >
      <div class="mb-1 text-xs font-medium text-stone-400 dark:text-stone-500">
        {{ formatDate(result.date) }}
      </div>
      <div class="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
        <HighlightedText :text="result.snippet" />
      </div>
    </button>
  </div>
</template>
