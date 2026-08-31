<script setup lang="ts">
import { PhMagnifyingGlass, PhPlus, PhSparkle, PhCalendar, PhChartLineUp, PhSun, PhMoon, PhSunHorizon } from '@phosphor-icons/vue'
import type { CalendarEvent } from '~/shared/types'
import MobileCalendarCard from '~/components/calendar/MobileCalendarCard.vue'
import AgendaList from '~/components/calendar/AgendaList.vue'
import DailyMoodBar from '~/components/moods/DailyMoodBar.vue'
import ConnectionTrendsCard from '~/components/dashboard/ConnectionTrendsCard.vue'
import BentoStatsGrid from '~/components/dashboard/BentoStatsGrid.vue'
import EventModal from '~/components/events/EventModal.vue'
import AiSchedulerModal from '~/components/ai/AiSchedulerModal.vue'
import PlanSearchModal from '~/components/calendar/PlanSearchModal.vue'

definePageMeta({ layout: 'default' })

const cal = useCalendarStore()
const eventsStore = useEventsStore()
const moodsStore = useMoodsStore()
const sacredTimesStore = useSacredTimesStore()
const dashboardStore = useDashboardStore()
const { user, loggedIn } = useUserSession()
const haptics = useHaptics()

// ── State ─────────────────────────────────────────────────────────────────────

const selectedDate = ref<Date>(new Date())

// Mobile Segmented Tab: 'calendar' | 'dashboard'
const mobileTab = ref<'calendar' | 'dashboard'>('calendar')

// Modals state
const searchModalOpen = ref(false)
const aiModalOpen = ref(false)
const modalOpen = ref(false)
const modalDate = ref<Date | null>(null)
const editingEvent = ref<CalendarEvent | null>(null)

// ── Contextual Greeting ───────────────────────────────────────────────────────

const greeting = computed(() => {
  const hour = new Date().getHours()
  const name = user.value?.name ? `, ${user.value.name.split(' ')[0]}` : ''
  if (hour >= 5 && hour < 12) return { text: `Good morning${name}`, icon: PhSun }
  if (hour >= 12 && hour < 17) return { text: `Good afternoon${name}`, icon: PhSun }
  if (hour >= 17 && hour < 21) return { text: `Good evening${name}`, icon: PhSunHorizon }
  return { text: `Good night${name}`, icon: PhMoon }
})

// ── Quick Date Jumps ──────────────────────────────────────────────────────────

const JUMP_OPTIONS = computed(() => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayOfWeek = now.getDay()
  const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
  const thisWeekend = new Date(now)
  thisWeekend.setDate(thisWeekend.getDate() + daysUntilSat)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)

  return [
    { label: 'Today', date: now },
    { label: 'Tomorrow', date: tomorrow },
    { label: 'Weekend', date: thisWeekend },
    { label: 'In 7d', date: nextWeek },
  ]
})

function jumpToDate(d: Date) {
  haptics.light()
  selectedDate.value = d
  if (d.getMonth() !== cal.currentMonth || d.getFullYear() !== cal.currentYear) {
    cal.currentMonth = d.getMonth()
    cal.currentYear = d.getFullYear()
  }
}

function isJumpActive(d: Date): boolean {
  return cal.toDateKey(selectedDate.value) === cal.toDateKey(d)
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleSelectDate(date: Date) {
  selectedDate.value = date
}

function openCreate(date?: Date) {
  haptics.light()
  modalDate.value = date || selectedDate.value || new Date()
  editingEvent.value = null
  modalOpen.value = true
}

function openEdit(event: CalendarEvent) {
  haptics.light()
  editingEvent.value = event
  modalDate.value = new Date(event.start)
  modalOpen.value = true
}

function handleOpenFullFromAi(draft: any) {
  modalDate.value = new Date(draft.start)
  editingEvent.value = {
    id: '',
    title: draft.title,
    description: draft.description,
    start: draft.start,
    end: draft.end,
    allDay: draft.allDay,
    isPrivate: draft.isPrivate,
    isSacred: draft.isSacred,
    coupleId: user.value?.coupleId || '',
    creatorId: user.value?.id || '',
    createdAt: new Date().toISOString(),
    creator: { id: user.value?.id || '', name: user.value?.name || '', color: user.value?.color || 'coral' },
  }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  dashboardStore.fetchStats()
}

const selectedDayEvents = computed(() => {
  return eventsStore.getEventsForDay(cal.toDateKey(selectedDate.value))
})

// ── Keyboard Shortcuts (Pro Craft) ────────────────────────────────────────────

function handleKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchModalOpen.value = true
  } else if (e.key === '/') {
    e.preventDefault()
    searchModalOpen.value = true
  } else if (e.key.toLowerCase() === 'n') {
    e.preventDefault()
    openCreate()
  } else if (e.key.toLowerCase() === 'm') {
    e.preventDefault()
    aiModalOpen.value = true
  } else if (e.key.toLowerCase() === 't') {
    e.preventDefault()
    cal.goToToday()
    selectedDate.value = new Date()
    haptics.light()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))

// ── Load events, moods, sacred times, stats ───────────────────────────────────

async function loadRange() {
  if (!loggedIn.value || !user.value?.coupleId) return
  const from = cal.rangeFrom
  const to = cal.rangeTo
  await Promise.all([
    eventsStore.fetchForRange(from, to),
    moodsStore.fetchForRange(cal.toDateKey(from), cal.toDateKey(to)),
    sacredTimesStore.fetchSacredTimes(),
    dashboardStore.fetchStats(),
  ])
}

watch([() => cal.currentYear, () => cal.currentMonth, () => loggedIn.value], loadRange, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 py-2 sm:py-4 font-sans w-full min-w-0">

    <!-- Top Action Bar with Contextual Time Greeting -->
    <div class="flex items-center justify-between min-w-0 gap-2">
      <div class="min-w-0">
        <h1 class="text-2xl sm:text-4xl font-extrabold text-black font-sans tracking-tight truncate">
          Calendar
        </h1>
        <div class="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-gray-500 truncate">
          <component :is="greeting.icon" :size="13" class="text-amber-500 shrink-0" weight="bold" />
          <span class="truncate">{{ greeting.text }}</span>
        </div>
      </div>

      <!-- Action Buttons with subtle keyboard shortcut hints -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Search Button with ⌘K -->
        <button
          class="flex items-center gap-1.5 px-3 h-9 sm:h-10 rounded-full bg-white border border-gray-200 text-black hover:bg-gray-50 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
          title="Search plans (⌘K)"
          @click="haptics.light(); searchModalOpen = true"
        >
          <PhMagnifyingGlass :size="16" weight="bold" />
          <span class="hidden md:inline text-[10px] font-mono font-bold text-gray-400">⌘K</span>
        </button>

        <!-- AI Magic Button -->
        <button
          class="flex items-center gap-1.5 px-3.5 h-9 sm:h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
          title="Draft plans with AI (M)"
          @click="haptics.light(); aiModalOpen = true"
        >
          <PhSparkle :size="14" weight="fill" class="text-rose-600" />
          <span class="hidden sm:inline">AI Magic</span>
        </button>

        <!-- Add Event Button with N -->
        <button
          class="flex items-center gap-1.5 px-3.5 h-9 sm:h-10 rounded-full bg-black text-white hover:bg-gray-800 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          title="Add new event (N)"
          @click="openCreate()"
        >
          <PhPlus :size="15" weight="bold" />
          <span class="hidden sm:inline text-xs font-bold">New Plan</span>
        </button>
      </div>
    </div>

    <!-- Mobile Segmented View Control (visible on < lg) -->
    <div class="lg:hidden flex items-center bg-gray-100 p-1 rounded-2xl w-full min-w-0">
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate min-w-0 active:scale-95"
        :class="mobileTab === 'calendar'
          ? 'bg-white text-black shadow-xs'
          : 'text-gray-500 hover:text-black'"
        @click="haptics.light(); mobileTab = 'calendar'"
      >
        <PhCalendar :size="15" weight="bold" class="shrink-0" />
        <span class="truncate">Calendar</span>
      </button>

      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer truncate min-w-0 active:scale-95"
        :class="mobileTab === 'dashboard'
          ? 'bg-white text-black shadow-xs'
          : 'text-gray-500 hover:text-black'"
        @click="haptics.light(); mobileTab = 'dashboard'"
      >
        <PhChartLineUp :size="15" weight="bold" class="shrink-0" />
        <span class="truncate">Rhythm & Stats</span>
      </button>
    </div>

    <!-- Daily Responsive Empathy Mood Strip -->
    <DailyMoodBar />

    <!-- 1-Tap Quick Date Jump Row (Amie / Linear Style) -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full min-w-0">
      <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono shrink-0 mr-1">
        Jump to:
      </span>
      <button
        v-for="opt in JUMP_OPTIONS"
        :key="opt.label"
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-150 cursor-pointer active:scale-95 shrink-0 select-none"
        :class="isJumpActive(opt.date)
          ? 'bg-black text-white shadow-2xs font-extrabold'
          : 'bg-white hover:bg-rose-50 hover:text-rose-700 text-gray-700 border border-gray-200/80'"
        @click="jumpToDate(opt.date)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Main Dual Grid: Responsive Column Behavior -->
    <div class="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start w-full min-w-0">

      <!-- Left Column: Mobile Calendar Card + Inline Agenda -->
      <div
        class="flex flex-col gap-5 w-full min-w-0"
        :class="{ 'hidden lg:flex': mobileTab !== 'calendar' }"
      >
        <!-- Interactive Month Calendar Card -->
        <MobileCalendarCard
          :selected-date="selectedDate"
          @select-date="handleSelectDate"
          @open-new-event="openCreate"
        />

        <!-- Inline Day Agenda List (with smooth crossfades and live indicators) -->
        <AgendaList
          :date="selectedDate"
          :events="selectedDayEvents"
          :current-user-id="user?.id ?? ''"
          @add-event="openCreate"
          @edit-event="openEdit"
        />
      </div>

      <!-- Right Column: Real Connection Trends Wave Chart & Bento Grid -->
      <div
        class="flex flex-col gap-6 w-full min-w-0"
        :class="{ 'hidden lg:flex': mobileTab !== 'dashboard' }"
      >
        <!-- Connection Trends Wave Chart -->
        <ConnectionTrendsCard />

        <!-- Bento KPI Stats Grid -->
        <BentoStatsGrid />
      </div>

    </div>

    <!-- Quick Plan Search Modal -->
    <PlanSearchModal
      :open="searchModalOpen"
      @close="searchModalOpen = false"
      @select-event="openEdit"
    />

    <!-- AI Natural Language Scheduler Modal -->
    <AiSchedulerModal
      :open="aiModalOpen"
      @close="aiModalOpen = false"
      @open-full-form="handleOpenFullFromAi"
    />

    <!-- Event Create/Edit Modal -->
    <EventModal
      :open="modalOpen"
      :selected-date="modalDate"
      :editing-event="editingEvent"
      @close="closeModal"
      @saved="closeModal"
      @deleted="closeModal"
    />
  </div>
</template>
