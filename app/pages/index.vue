<script setup lang="ts">
import { Search, CalendarDays, Sun, Moon, LogOut, Maximize, Minimize, Download } from 'lucide-vue-next'

const { $trpc } = useNuxtApp()
const { clear } = useUserSession()
const colorMode = useColorMode()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
const { canInstall, install: installPwa } = usePwaInstall()

const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

// Search functionality
const searchResults = ref<Array<{ id: string; date: string; snippet: string }>>([])
const searching = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchSeq = 0

watch(searchQuery, (query) => {
  if (searchTimer) clearTimeout(searchTimer)

  if (!query.trim()) {
    searchResults.value = []
    searching.value = false
    return
  }

  const seq = ++searchSeq
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const results = await $trpc.entries.search.query({ query: query.trim() })
      if (seq === searchSeq) {
        searchResults.value = results
      }
    } catch {
      if (seq === searchSeq) {
        searchResults.value = []
      }
    } finally {
      if (seq === searchSeq) {
        searching.value = false
      }
    }
  }, 300)
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

async function logout() {
  await clear()
  navigateTo('/login')
}

function toggleSearch() {
  if (isSearching.value) {
    searchQuery.value = ''
    searchInputRef.value?.blur()
  } else {
    searchInputRef.value?.focus()
  }
}

const isSearching = computed(() => searchQuery.value.trim().length > 0)
</script>

<template>
  <div class="flex h-dvh flex-col bg-stone-50 dark:bg-stone-900">
    <!-- Search bar -->
    <div class="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/80 px-4 pb-3 pt-4 backdrop-blur-lg dark:border-stone-800 dark:bg-stone-900/80">
      <div class="relative">
        <Search
          :size="18"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500"
        />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Search entries..."
          class="w-full rounded-lg bg-stone-100 py-2.5 pl-10 pr-4 text-sm text-stone-700 placeholder-stone-400 outline-none transition-colors focus:bg-stone-200/70 dark:bg-stone-800 dark:text-stone-200 dark:placeholder-stone-500 dark:focus:bg-stone-700/70"
        />
      </div>
    </div>

    <!-- Content area -->
    <div class="flex-1 overflow-y-auto pb-20 pt-4">
      <Transition name="fade" mode="out-in">
        <div v-if="isSearching" key="search">
          <div v-if="searching" class="py-12 text-center text-stone-400 dark:text-stone-500">
            Searching...
          </div>
          <SearchResults v-else :results="searchResults" />
        </div>
        <Calendar v-else key="calendar" />
      </Transition>
    </div>

    <!-- Bottom bar -->
    <BottomBar>
      <BottomBarButton :icon="isSearching ? CalendarDays : Search" @click="toggleSearch" />
      <BottomBarButton
        :key="colorMode.value"
        :icon="colorMode.value === 'dark' ? Sun : Moon"
        @click="toggleTheme"
      />
      <BottomBarButton :icon="isFullscreen ? Minimize : Maximize" @click="toggleFullscreen" />
      <BottomBarButton v-if="canInstall" :icon="Download" @click="installPwa" />
      <BottomBarButton :icon="LogOut" @click="logout" />
    </BottomBar>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
