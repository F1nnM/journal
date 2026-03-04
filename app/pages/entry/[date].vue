<script setup lang="ts">
import { ChevronLeft, Pencil, Eye, Sun, Moon, Maximize, Minimize } from 'lucide-vue-next'

const route = useRoute()
const { $trpc } = useNuxtApp()
const colorMode = useColorMode()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

const date = computed(() => route.params.date as string)

const formattedDate = computed(() => {
  const [year, month, day] = date.value.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

// Fetch existing entry
const { data: entry, status: fetchStatus } = $trpc.entries.getByDate.useQuery(
  () => ({ date: date.value }),
)

// Local content ref
const content = ref('')
const editing = ref(false)
const initialized = ref(false)

// Initialize content and mode when data loads
watch(
  () => ({ entry: entry.value, status: fetchStatus.value }),
  ({ entry: entryVal, status }) => {
    if (status === 'success' && !initialized.value) {
      initialized.value = true
      if (entryVal) {
        content.value = entryVal.content
        editing.value = false
      } else {
        content.value = ''
        editing.value = true
      }
    }
  },
  { immediate: true },
)

// Auto-save
const { status: saveStatus, pending: savePending, debouncedSave, immediateSave } = useAutoSave(async () => {
  await $trpc.entries.save.mutate({
    date: date.value,
    content: content.value,
  })
})

function onInput() {
  debouncedSave()
}

async function toggleMode() {
  if (editing.value) {
    // Switching from edit to read: save immediately
    await immediateSave()
    editing.value = false
  } else {
    editing.value = true
  }
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

function goBack() {
  navigateTo('/')
}

const textareaRef = ref<HTMLTextAreaElement | null>(null)

watch(editing, (isEditing) => {
  if (isEditing) {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})

// Lock entry when mobile keyboard is dismissed
let viewportHeight = 0
function onViewportResize() {
  const newHeight = window.visualViewport!.height
  if (editing.value && newHeight > viewportHeight * 1.15) {
    immediateSave()
    textareaRef.value?.blur()
    editing.value = false
  }
  viewportHeight = newHeight
}
onMounted(() => {
  if (window.visualViewport) {
    viewportHeight = window.visualViewport.height
    window.visualViewport.addEventListener('resize', onViewportResize)
  }
})
onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', onViewportResize)
})

const dotColor = computed(() => {
  if (saveStatus.value === 'error') return 'bg-red-400'
  if (saveStatus.value === 'saving' || savePending.value) return 'bg-orange-400'
  return 'bg-green-400'
})
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-stone-50 dark:bg-stone-900">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pb-2 pt-4">
      <span class="text-sm text-stone-400 dark:text-stone-500">
        {{ formattedDate }}
      </span>
      <span class="h-2 w-2 rounded-full transition-colors duration-300" :class="dotColor" />
    </div>

    <!-- Content area -->
    <div class="flex min-h-0 flex-1 flex-col" :class="editing ? 'overflow-hidden' : 'overflow-y-auto pb-20'">
      <div v-if="fetchStatus === 'pending'" class="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
        Loading...
      </div>

      <template v-else-if="initialized">
        <!-- Edit mode -->
        <textarea
          v-if="editing"
          ref="textareaRef"
          v-model="content"
          class="min-h-0 flex-1 w-full resize-none overflow-y-auto bg-transparent px-6 py-2 pb-20 text-lg leading-relaxed text-stone-700 placeholder-stone-300 outline-none dark:text-stone-200 dark:placeholder-stone-600"
          placeholder="Write something..."
          @input="onInput"
        />

        <!-- Read mode -->
        <div
          v-else
          class="whitespace-pre-wrap px-6 py-2 text-lg leading-relaxed text-stone-700 dark:text-stone-200"
        >
          {{ content || 'No entry for this day.' }}
        </div>
      </template>
    </div>

    <!-- Bottom bar -->
    <BottomBar>
      <BottomBarButton :icon="ChevronLeft" @click="goBack" />
      <BottomBarButton
        :icon="editing ? Eye : Pencil"
        @click="toggleMode"
      />
      <BottomBarButton
        :key="colorMode.value"
        :icon="colorMode.value === 'dark' ? Sun : Moon"
        @click="toggleTheme"
      />
      <BottomBarButton :icon="isFullscreen ? Minimize : Maximize" @click="toggleFullscreen" />
    </BottomBar>
  </div>
</template>

