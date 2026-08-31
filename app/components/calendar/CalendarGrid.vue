<script setup lang="ts">
import type { CalendarEvent, DayMood, MoodType } from '~/shared/types'
import EventPill from './EventPill.vue'
import { PhHeart, PhWaves, PhSun, PhFlame, PhMoon, PhSparkle } from '@phosphor-icons/vue'

const props = defineProps<{
  selectedDate?: Date | null
}>()

const emit = defineEmits<{
  dayClick: [date: Date]
  eventClick: [event: CalendarEvent]
}>()

const cal = useCalendarStore()
const eventsStore = useEventsStore()
const moodsStore = useMoodsStore()
const auth = useAuthStore()

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_VISIBLE = 3

function getEvents(date: Date): CalendarEvent[] {
  return eventsStore.getEventsForDay(cal.toDateKey(date))
}

function isSelected(date: Date): boolean {
  if (!props.selectedDate) return false
  return cal.toDateKey(date) === cal.toDateKey(props.selectedDate)
}

function hasSacred(date: Date): boolean {
  return getEvents(date).some(e => e.isSacred)
}

function getMoods(date: Date): DayMood[] {
  return moodsStore.getMoodsForDate(cal.toDateKey(date))
}

function getMoodColor(mood: MoodType): string {
  switch (mood) {
    case 'calm': return 'bg-emerald-500 text-white'
    case 'happy': return 'bg-amber-500 text-white'
    case 'excited': return 'bg-rose-500 text-white'
    case 'tired': return 'bg-indigo-500 text-white'
    case 'stressed': return 'bg-red-500 text-white'
    default: return 'bg-gray-400 text-white'
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">

    <!-- Day-of-week header row -->
    <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 shrink-0">
      <div
        v-for="day in DAY_HEADERS"
        :key="day"
        class="py-3 text-center text-xs font-mono uppercase tracking-widest font-extrabold text-black"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar cells grid -->
    <div class="grid grid-cols-7 flex-1 bg-gray-200 gap-px" style="grid-template-rows: repeat(6, minmax(0, 1fr))">
      <div
        v-for="(date, i) in cal.calendarDays"
        :key="i"
        class="bg-white p-2 sm:p-2.5 flex flex-col gap-1.5 cursor-pointer select-none transition-all relative group"
        :class="[
          !cal.isCurrentMonth(date) ? 'bg-gray-50/60 opacity-30' : 'hover:bg-rose-50/30',
          isSelected(date) ? 'ring-2 ring-rose-600 ring-inset bg-rose-50/40 z-10' : ''
        ]"
        @click="emit('dayClick', date)"
      >
        <!-- Top bar of cell: Date number & Indicators (Mood + Sacred) -->
        <div class="flex items-center justify-between mb-0.5">
          <span
            class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-transform group-hover:scale-105"
            :class="cal.isToday(date)
              ? 'bg-rose-600 text-white font-extrabold shadow-sm'
              : (isSelected(date) ? 'bg-black text-white font-bold' : (cal.isCurrentMonth(date) ? 'text-black font-extrabold' : 'text-gray-400'))"
          >
            {{ date.getDate() }}
          </span>

          <div class="flex items-center gap-1.5">
            <!-- Mood Tags on this day -->
            <div v-if="getMoods(date).length > 0" class="flex items-center -space-x-1">
              <span
                v-for="m in getMoods(date)"
                :key="m.id"
                class="w-2.5 h-2.5 rounded-full ring-1 ring-white"
                :class="getMoodColor(m.mood)"
                :title="`${m.userId === auth.user?.id ? 'You' : 'Partner'}: ${m.mood}`"
              />
            </div>

            <!-- Sacred time indicator -->
            <div v-if="hasSacred(date)" class="text-purple-600 animate-pulse" title="Protected Us Time scheduled">
              <PhHeart :size="13" weight="fill" />
            </div>
          </div>
        </div>

        <!-- Event pills list -->
        <div class="flex flex-col gap-1 flex-1 overflow-hidden">
          <EventPill
            v-for="ev in getEvents(date).slice(0, MAX_VISIBLE)"
            :key="ev.id"
            :event="ev"
            :current-user-id="auth.user?.id ?? ''"
            @click="emit('eventClick', $event)"
          />
          <span
            v-if="getEvents(date).length > MAX_VISIBLE"
            class="text-[10px] font-bold text-rose-600 pl-1"
          >
            +{{ getEvents(date).length - MAX_VISIBLE }} more plans
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
