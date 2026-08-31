<script setup lang="ts">
import { PhCaretLeft, PhCaretRight, PhHeart } from '@phosphor-icons/vue'
import { useSwipe } from '@vueuse/core'
import type { CalendarEvent } from '~/shared/types'

const props = defineProps<{
  selectedDate: Date
}>()

const emit = defineEmits<{
  selectDate: [date: Date]
  openNewEvent: [date: Date]
}>()

const cal = useCalendarStore()
const eventsStore = useEventsStore()
const auth = useAuthStore()
const haptics = useHaptics()

const cardRef = ref<HTMLElement | null>(null)

function onSelectDay(date: Date) {
  haptics.light()
  emit('selectDate', date)
}

function onPrevMonth() {
  haptics.light()
  cal.prevMonth()
}

function onNextMonth() {
  haptics.light()
  cal.nextMonth()
}

function onGoToday() {
  haptics.light()
  cal.goToToday()
}

// Enable smooth swipe left / right on mobile touch
useSwipe(cardRef, {
  onSwipeEnd(e, dir) {
    if (dir === 'LEFT') {
      onNextMonth()
    } else if (dir === 'RIGHT') {
      onPrevMonth()
    }
  },
})

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getDayEvents(date: Date): CalendarEvent[] {
  return eventsStore.getEventsForDay(cal.toDateKey(date))
}

function isSelected(date: Date): boolean {
  return cal.toDateKey(date) === cal.toDateKey(props.selectedDate)
}

function hasSacred(date: Date): boolean {
  return getDayEvents(date).some(e => e.isSacred)
}

function getDayAvatar(date: Date): { avatar?: string | null; name: string; isPartner: boolean } | null {
  const evs = getDayEvents(date)
  if (evs.length === 0) return null
  const first = evs[0]
  const isPartner = first.creatorId !== auth.user?.id
  return {
    avatar: first.creator?.avatar,
    name: first.creator?.name || (isPartner ? 'Partner' : 'You'),
    isPartner,
  }
}
</script>

<template>
  <div
    ref="cardRef"
    class="app-card p-4 sm:p-6 bg-white flex flex-col gap-4 font-sans select-none touch-pan-y w-full min-w-0 shadow-xs"
  >
    <!-- Card Header: Month + Controls (4px rhythm) -->
    <div class="flex items-center justify-between min-w-0">
      <div class="flex items-center gap-2 min-w-0">
        <h3 class="text-base sm:text-lg font-bold text-black font-sans truncate tracking-tight">
          {{ cal.monthLabel }}
        </h3>
      </div>

      <!-- Month switch controls -->
      <div class="flex items-center gap-1 bg-gray-50 border border-gray-100 p-1 rounded-full shrink-0">
        <button
          class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-gray-700 transition-all cursor-pointer active:scale-90"
          title="Previous month"
          @click="onPrevMonth"
        >
          <PhCaretLeft :size="14" weight="bold" />
        </button>

        <button
          class="px-2.5 py-0.5 text-xs font-bold text-black hover:text-rose-600 transition-colors cursor-pointer active:scale-95"
          @click="onGoToday"
        >
          Today
        </button>

        <button
          class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-gray-700 transition-all cursor-pointer active:scale-90"
          title="Next month"
          @click="onNextMonth"
        >
          <PhCaretRight :size="14" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Day of week headers (M T W T F S S) -->
    <div class="grid grid-cols-7 text-center w-full min-w-0">
      <span
        v-for="d in DAY_HEADERS"
        :key="d"
        class="text-xs font-bold text-gray-400 font-mono uppercase"
      >
        {{ d }}
      </span>
    </div>

    <!-- Month Day Grid with fluid cells and 44px touch targets -->
    <div class="grid grid-cols-7 gap-y-1 sm:gap-y-2 text-center place-items-center w-full min-w-0">
      <div
        v-for="(date, i) in cal.calendarDays"
        :key="i"
        class="relative flex flex-col items-center justify-center cursor-pointer group py-0.5 w-full min-w-0 active:scale-95 transition-transform duration-100"
        @click="onSelectDay(date)"
      >
        <!-- Day Touch Target -->
        <div
          class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 relative select-none shrink-0"
          :class="[
            isSelected(date)
              ? 'bg-black text-white shadow-md scale-105 z-10'
              : (cal.isToday(date)
                ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-300 font-extrabold'
                : (cal.isCurrentMonth(date) ? 'text-black hover:bg-gray-100' : 'text-gray-300 opacity-40'))
          ]"
        >
          <!-- If day has plans and is NOT selected: show photo avatar or heart -->
          <template v-if="getDayEvents(date).length > 0 && !isSelected(date)">
            <div
              v-if="hasSacred(date)"
              class="w-full h-full rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs"
              title="Sacred Us Time"
            >
              <PhHeart :size="15" weight="fill" />
            </div>

            <div
              v-else-if="getDayAvatar(date)?.avatar"
              class="w-full h-full rounded-full overflow-hidden ring-2"
              :class="getDayAvatar(date)?.isPartner ? 'ring-teal-500' : 'ring-rose-500'"
            >
              <img
                :src="getDayAvatar(date)!.avatar!"
                :alt="getDayAvatar(date)!.name"
                class="w-full h-full object-cover"
              />
            </div>

            <div
              v-else
              class="w-full h-full rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-xs text-white"
              :class="getDayAvatar(date)?.isPartner ? 'bg-teal-600' : 'bg-rose-600'"
            >
              {{ getDayAvatar(date)?.name.charAt(0).toUpperCase() }}
            </div>
          </template>

          <!-- Normal day number -->
          <span v-else>
            {{ date.getDate() }}
          </span>
        </div>

        <!-- Activity indicator dot below day for multi-events -->
        <span
          v-if="getDayEvents(date).length > 1 && !isSelected(date)"
          class="w-1 h-1 rounded-full bg-rose-500 mt-0.5"
        />
      </div>
    </div>
  </div>
</template>
