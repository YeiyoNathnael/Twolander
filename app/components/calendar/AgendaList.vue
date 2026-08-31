<script setup lang="ts">
import { PhPlus, PhHeart, PhFlame, PhWine, PhSparkle, PhLock, PhClock, PhUser, PhMoon, PhRadio } from '@phosphor-icons/vue'
import type { CalendarEvent } from '~/shared/types'

const props = defineProps<{
  date: Date
  events: CalendarEvent[]
  currentUserId: string
}>()

const emit = defineEmits<{
  addEvent: [date: Date]
  editEvent: [event: CalendarEvent]
}>()

const cal = useCalendarStore()
const haptics = useHaptics()

const dayLabel = computed(() => {
  if (cal.isToday(props.date)) return 'Today'
  return props.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
})

function formatEventTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function isEventNow(ev: CalendarEvent): boolean {
  if (ev.allDay) return false
  const now = Date.now()
  const start = new Date(ev.start).getTime()
  const end = new Date(ev.end).getTime()
  return now >= start && now <= end
}

function getTimeUntil(ev: CalendarEvent): string | null {
  if (ev.allDay || !cal.isToday(props.date)) return null
  const now = Date.now()
  const start = new Date(ev.start).getTime()
  const diffMs = start - now
  if (diffMs <= 0 || diffMs > 12 * 60 * 60 * 1000) return null
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (hours === 0) return `in ${mins}m`
  return `in ${hours}h ${mins}m`
}

function getEventIcon(event: CalendarEvent) {
  if (event.isSacred) return { icon: PhHeart, cls: 'bg-purple-100 text-purple-700' }
  const title = event.title.toLowerCase()
  if (title.includes('dinner') || title.includes('date') || title.includes('wine')) {
    return { icon: PhWine, cls: 'bg-rose-100 text-rose-700' }
  }
  if (title.includes('night') || title.includes('movie') || title.includes('relax')) {
    return { icon: PhMoon, cls: 'bg-amber-100 text-amber-700' }
  }
  if (title.includes('intimate') || title.includes('love') || title.includes('passion')) {
    return { icon: PhFlame, cls: 'bg-rose-100 text-rose-700' }
  }
  return { icon: PhSparkle, cls: 'bg-slate-100 text-slate-700' }
}
</script>

<template>
  <div class="flex flex-col gap-3 font-sans w-full min-w-0">
    <!-- Header with dynamic count -->
    <div class="flex items-center justify-between px-1 min-w-0">
      <div class="flex items-center gap-2 min-w-0">
        <h3 class="text-lg font-bold text-black font-sans truncate tracking-tight">
          {{ dayLabel }}
        </h3>
        <span
          v-if="cal.isToday(date)"
          class="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block"
        />
      </div>
      <span class="text-xs font-bold text-gray-400 font-mono shrink-0">
        {{ events.length }} {{ events.length === 1 ? 'Plan' : 'Plans' }}
      </span>
    </div>

    <!-- Smooth Transition Crossfade on day change -->
    <Transition name="fade-slide" mode="out-in">
      <div :key="cal.toDateKey(date)" class="w-full min-w-0">

        <!-- Empty State -->
        <div
          v-if="events.length === 0"
          class="app-card p-6 bg-white flex flex-col items-center justify-center text-center gap-2 w-full min-w-0"
        >
          <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <PhHeart :size="22" />
          </div>
          <p class="text-sm font-bold text-black">No plans for {{ dayLabel }}</p>
          <p class="text-xs text-gray-400 max-w-[220px]">
            A clear schedule. Plan a surprise date or protect it as sacred us-time.
          </p>
          <button
            class="mt-2 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-xs active:scale-95 select-none"
            @click="haptics.light(); emit('addEvent', date)"
          >
            + Add plan
          </button>
        </div>

        <!-- Event Cards -->
        <div v-else class="flex flex-col gap-2.5 w-full min-w-0">
          <div
            v-for="ev in events"
            :key="ev.id"
            class="app-card p-3.5 sm:p-4 bg-white flex items-center justify-between gap-3 transition-all duration-150 hover:border-rose-200 hover:shadow-md cursor-pointer group w-full min-w-0 select-none active:scale-[0.98]"
            :class="{ 'ring-1 ring-rose-400/50 bg-rose-50/20': isEventNow(ev) }"
            @click="haptics.light(); emit('editEvent', ev)"
          >
            <!-- Left: Category Icon + Title/Details -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <!-- Icon Circle -->
              <div
                class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs relative"
                :class="getEventIcon(ev).cls"
              >
                <component :is="getEventIcon(ev).icon" :size="20" weight="bold" />
                <span
                  v-if="isEventNow(ev)"
                  class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white animate-live-pulse"
                  title="Happening now"
                />
              </div>

              <!-- Title & Subtitle -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-bold text-black truncate group-hover:text-rose-600 transition-colors">
                    {{ ev.isPrivate && ev.creatorId !== currentUserId ? 'Busy' : ev.title }}
                  </h4>

                  <!-- Time until countdown badge -->
                  <span
                    v-if="getTimeUntil(ev)"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 shrink-0"
                  >
                    {{ getTimeUntil(ev) }}
                  </span>
                </div>

                <div class="flex items-center gap-2 mt-0.5 min-w-0">
                  <!-- Attendee / Creator Badge -->
                  <div class="flex items-center gap-1 text-[11px] font-semibold text-gray-500 truncate">
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0"
                      :class="ev.isSacred ? 'bg-purple-600' : (ev.creatorId === currentUserId ? 'bg-rose-600' : 'bg-teal-600')"
                    />
                    <span class="truncate">{{ ev.isSacred ? 'Us Time' : (ev.creatorId === currentUserId ? 'You' : (ev.creator?.name || 'Partner')) }}</span>
                  </div>

                  <span v-if="ev.isPrivate" class="flex items-center gap-1 text-[10px] font-bold text-gray-400 shrink-0">
                    <PhLock :size="10" />
                    <span>Private</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Time Pill -->
            <div class="shrink-0 flex items-center gap-1.5">
              <span
                v-if="isEventNow(ev)"
                class="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold font-mono uppercase tracking-wider animate-pulse shadow-xs"
              >
                Now
              </span>

              <span
                v-if="ev.allDay"
                class="px-3 py-1.5 rounded-full bg-gray-100 text-gray-900 text-xs font-bold font-mono inline-block"
              >
                All Day
              </span>
              <span
                v-else
                class="px-3 py-1.5 rounded-full bg-black text-white text-xs font-bold font-mono shadow-xs inline-block"
              >
                {{ formatEventTime(ev.start) }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>
