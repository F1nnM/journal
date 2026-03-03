<script setup lang="ts">
import { ChevronLeft, Pencil, Eye, Sun, Moon } from 'lucide-vue-next'

const route = useRoute()
const { $trpc } = useNuxtApp()
const colorMode = useColorMode()

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
const { status: saveStatus, debouncedSave, immediateSave } = useAutoSave(async () => {
  await $trpc.entries.save.mutate({
    date: date.value,
    content: content.value,
  })
})

function onInput() {
  debouncedSave()
  autoResize()
}

function autoResize() {
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }
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
      autoResize()
    })
  }
})

const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case 'saving': return 'Saving...'
    case 'saved': return 'Saved'
    case 'error': return 'Error'
    default: return ''
  }
})
</script>

<template>
  <div class="flex h-dvh flex-col bg-stone-50 dark:bg-stone-900">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pb-2 pt-4">
      <span class="text-sm text-stone-400 dark:text-stone-500">
        {{ formattedDate }}
      </span>
      <Transition name="status-fade">
        <span
          v-if="saveStatusText"
          :key="saveStatusText"
          class="text-xs"
          :class="[
            saveStatus === 'error'
              ? 'text-red-400 dark:text-red-500'
              : 'text-stone-400 dark:text-stone-500',
          ]"
        >
          {{ saveStatusText }}
        </span>
      </Transition>
    </div>

    <!-- Content area -->
    <div class="flex-1 overflow-y-auto pb-20">
      <div v-if="fetchStatus === 'pending'" class="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
        Loading...
      </div>

      <template v-else-if="initialized">
        <!-- Edit mode -->
        <textarea
          v-if="editing"
          ref="textareaRef"
          v-model="content"
          class="min-h-full w-full resize-none bg-transparent px-6 py-2 text-lg leading-relaxed text-stone-700 placeholder-stone-300 outline-none dark:text-stone-200 dark:placeholder-stone-600"
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
        :icon="colorMode.value === 'dark' ? Sun : Moon"
        @click="toggleTheme"
      />
    </BottomBar>
  </div>
</template>

<style scoped>
.status-fade-enter-active,
.status-fade-leave-active {
  transition: opacity 0.2s ease;
}
.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
}
</style>
