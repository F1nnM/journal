<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { $trpc } = useNuxtApp()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1) // 1-based

const monthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long' })
})

const { data: entryDates } = $trpc.entries.listDates.useQuery(
  () => ({ year: currentYear.value, month: currentMonth.value }),
)

const entryDateSet = computed(() => new Set(entryDates.value ?? []))

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarCell {
  day: number
  date: string
  isCurrentMonth: boolean
}

const cells = computed<CalendarCell[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month - 1, 1)
  // getDay() returns 0=Sun..6=Sat; we want Mon=0..Sun=6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const daysInMonth = new Date(year, month, 0).getDate()

  const result: CalendarCell[] = []

  // Leading days from previous month
  const prevMonthDays = new Date(year, month - 1, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    result.push({
      day,
      date: formatDate(prevYear, prevMonth, day),
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    result.push({
      day: d,
      date: formatDate(year, month, d),
      isCurrentMonth: true,
    })
  }

  // Trailing days to fill the last row
  const remaining = 7 - (result.length % 7)
  if (remaining < 7) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    for (let d = 1; d <= remaining; d++) {
      result.push({
        day: d,
        date: formatDate(nextYear, nextMonth, d),
        isCurrentMonth: false,
      })
    }
  }

  return result
})

const todayStr = computed(() => {
  const d = new Date()
  return formatDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
})

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToToday() {
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth() + 1
}

function onDayClick(cell: CalendarCell) {
  navigateTo(`/entry/${cell.date}`)
}

defineExpose({ goToToday })
</script>

<template>
  <div class="w-full px-2">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <button
        class="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
        @click="prevMonth"
      >
        <ChevronLeft :size="20" />
      </button>

      <h2 class="text-lg font-medium text-stone-700 dark:text-stone-200">
        {{ monthName }} {{ currentYear }}
      </h2>

      <button
        class="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
        @click="nextMonth"
      >
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- Day headers -->
    <div class="mb-2 grid grid-cols-7 text-center">
      <div
        v-for="header in dayHeaders"
        :key="header"
        class="py-1 text-xs font-medium text-stone-400 dark:text-stone-500"
      >
        {{ header }}
      </div>
    </div>

    <!-- Day cells -->
    <div class="grid grid-cols-7">
      <button
        v-for="(cell, idx) in cells"
        :key="idx"
        class="relative flex flex-col items-center py-2 transition-colors"
        :class="[
          cell.isCurrentMonth
            ? 'text-stone-700 dark:text-stone-200'
            : 'text-stone-300 dark:text-stone-600',
        ]"
        @click="onDayClick(cell)"
      >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-full text-sm"
          :class="[
            cell.date === todayStr
              ? 'ring-2 ring-stone-300 dark:ring-stone-600'
              : '',
          ]"
        >
          {{ cell.day }}
        </span>
        <span
          v-if="cell.isCurrentMonth && entryDateSet.has(cell.date)"
          class="mt-0.5 h-1 w-1 rounded-full bg-amber-500"
        />
        <span v-else class="mt-0.5 h-1 w-1" />
      </button>
    </div>
  </div>
</template>
