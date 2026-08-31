import { defineStore } from 'pinia'
import type { CalendarViewMode } from '~/shared/types'

export const useCalendarStore = defineStore('calendar', () => {
  const today = new Date()
  const currentYear = ref(today.getFullYear())
  const currentMonth = ref(today.getMonth()) // 0-indexed

  const viewMode = ref<CalendarViewMode>('month')

  // ── Derived ────────────────────────────────────────────────────────────────

  const monthLabel = computed(() =>
    new Date(currentYear.value, currentMonth.value, 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  )

  const calendarDays = computed(() =>
    buildCalendarDays(currentYear.value, currentMonth.value),
  )

  const rangeFrom = computed(() => calendarDays.value[0])
  const rangeTo = computed(() => calendarDays.value[calendarDays.value.length - 1])

  // ── Actions ────────────────────────────────────────────────────────────────

  function prevMonth() {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  function nextMonth() {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  function goToToday() {
    const now = new Date()
    currentYear.value = now.getFullYear()
    currentMonth.value = now.getMonth()
  }

  // ── Date helpers ───────────────────────────────────────────────────────────

  function isToday(date: Date): boolean {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  function isCurrentMonth(date: Date): boolean {
    return (
      date.getMonth() === currentMonth.value &&
      date.getFullYear() === currentYear.value
    )
  }

  function toDateKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  return {
    currentYear,
    currentMonth,
    viewMode,
    monthLabel,
    calendarDays,
    rangeFrom,
    rangeTo,
    prevMonth,
    nextMonth,
    goToToday,
    isToday,
    isCurrentMonth,
    toDateKey,
  }
})

// ── Pure function: build 42-day grid starting Monday ─────────────────────────

function buildCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7

  const days: Date[] = []

  // Fill leading days from previous month
  for (let i = startOffset; i > 0; i--) {
    days.push(new Date(year, month, 1 - i))
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d))
  }

  // Trailing days from next month to reach 42 cells (6 weeks)
  let next = 1
  while (days.length < 42) {
    days.push(new Date(year, month + 1, next++))
  }

  return days
}
