<script setup lang="ts">
import { PhPlus, PhX, PhClock, PhLock, PhHeart, PhTrash, PhPencilSimple, PhWaves, PhSun, PhFlame, PhMoon, PhSparkle } from '@phosphor-icons/vue'
import type { CalendarEvent, DayMood, MoodType } from '~/shared/types'

const props = defineProps<{
  date: Date
  events: CalendarEvent[]
  currentUserId: string
}>()

const emit = defineEmits<{
  close: []
  addEvent: [date: Date]
  editEvent: [event: CalendarEvent]
  deleteEvent: [id: string]
}>()

const cal = useCalendarStore()
const moodsStore = useMoodsStore()

const dateKey = computed(() => cal.toDateKey(props.date))
const dayMoods = computed(() => moodsStore.getMoodsForDate(dateKey.value))
const myMood = computed(() => moodsStore.getMyMoodForDate(dateKey.value))
const partnerMood = computed(() => moodsStore.getPartnerMoodForDate(dateKey.value))

const formattedDayNumber = computed(() => props.date.getDate())
const formattedWeekday = computed(() =>
  props.date.toLocaleDateString('en-US', { weekday: 'long' }),
)
const formattedMonthYear = computed(() =>
  props.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
)

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getMoodBadge(mood: MoodType) {
  switch (mood) {
    case 'calm': return { label: 'Calm', icon: PhWaves, cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    case 'happy': return { label: 'Happy', icon: PhSun, cls: 'bg-amber-100 text-amber-800 border-amber-300' }
    case 'excited': return { label: 'Excited', icon: PhFlame, cls: 'bg-rose-100 text-rose-800 border-rose-300' }
    case 'tired': return { label: 'Tired', icon: PhMoon, cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' }
    case 'stressed': return { label: 'Stressed', icon: PhSparkle, cls: 'bg-red-100 text-red-800 border-red-300' }
    default: return { label: 'Good', icon: PhSun, cls: 'bg-gray-100 text-gray-800 border-gray-300' }
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-white border-l border-gray-100 shadow-2xl md:shadow-none overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right-4 duration-300 font-sans">
    <!-- Drag handle indicator for mobile view -->
    <div class="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

    <!-- Header -->
    <div class="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between bg-rose-50/30">
      <div>
        <div class="flex items-baseline gap-3">
          <span class="text-4xl sm:text-5xl font-extrabold text-black font-serif tracking-tight">
            {{ formattedDayNumber }}
          </span>
          <div>
            <h3 class="text-base sm:text-lg font-bold text-black leading-tight">
              {{ formattedWeekday }}
            </h3>
            <p class="text-xs font-bold text-rose-600 uppercase tracking-widest font-mono mt-0.5">
              {{ formattedMonthYear }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-xs cursor-pointer active:scale-95"
          @click="emit('addEvent', date)"
        >
          <PhPlus :size="14" />
          <span>New plan</span>
        </button>
        <button
          class="p-2 rounded-full text-gray-400 hover:text-black hover:bg-white transition-colors cursor-pointer"
          title="Close day view"
          @click="emit('close')"
        >
          <PhX :size="18" />
        </button>
      </div>
    </div>

    <!-- Day Schedule & Mood Empathy List -->
    <div class="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">

      <!-- Empathy Mood Banner for this day -->
      <div v-if="dayMoods.length > 0" class="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-2.5 shadow-xs">
        <div class="flex items-center justify-between text-xs font-mono uppercase tracking-widest font-extrabold text-gray-400">
          <span>Daily Energy</span>
          <span class="text-rose-600 font-serif lowercase italic text-sm">empathy check</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <!-- Your mood -->
          <div v-if="myMood" class="p-2.5 rounded-xl bg-white border border-gray-100 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-gray-500">You</span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                :class="getMoodBadge(myMood.mood).cls"
              >
                <component :is="getMoodBadge(myMood.mood).icon" :size="11" />
                {{ getMoodBadge(myMood.mood).label }}
              </span>
            </div>
            <p v-if="myMood.note" class="text-xs text-gray-600 italic mt-0.5">
              "{{ myMood.note }}"
            </p>
          </div>

          <!-- Partner mood -->
          <div v-if="partnerMood" class="p-2.5 rounded-xl bg-white border border-gray-100 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-gray-500">Partner</span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                :class="getMoodBadge(partnerMood.mood).cls"
              >
                <component :is="getMoodBadge(partnerMood.mood).icon" :size="11" />
                {{ getMoodBadge(partnerMood.mood).label }}
              </span>
            </div>
            <p v-if="partnerMood.note" class="text-xs text-gray-600 italic mt-0.5">
              "{{ partnerMood.note }}"
            </p>
          </div>
        </div>
      </div>

      <!-- Schedule Content -->
      <div v-if="events.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
          <PhHeart :size="24" />
        </div>
        <h4 class="text-base font-bold text-black font-serif">No plans scheduled</h4>
        <p class="text-xs text-gray-500 mt-1 max-w-[240px] leading-relaxed">
          A blank canvas for the two of you. Perfect for a date or sacred quiet time.
        </p>
        <button
          class="mt-4 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer shadow-xs"
          @click="emit('addEvent', date)"
        >
          Schedule a plan
        </button>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div class="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest font-mono pb-1 border-b border-gray-100">
          <span>Schedule ({{ events.length }})</span>
          <span class="text-rose-600 font-serif lowercase italic text-sm">our timeline</span>
        </div>

        <div
          v-for="ev in events"
          :key="ev.id"
          class="p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer group"
          :class="ev.isSacred
            ? 'bg-purple-50/50 border-purple-200'
            : (ev.creatorId === currentUserId
              ? 'bg-rose-50/50 border-rose-200'
              : 'bg-teal-50/50 border-teal-200')"
          @click="emit('editEvent', ev)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs"
                :class="ev.isSacred
                  ? 'bg-purple-600 text-white'
                  : (ev.creatorId === currentUserId
                    ? 'bg-rose-600 text-white'
                    : 'bg-teal-600 text-white')"
              >
                {{ ev.isSacred ? 'Sacred Us Time' : (ev.creatorId === currentUserId ? 'You' : 'Partner') }}
              </span>

              <span v-if="ev.isPrivate" class="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                <PhLock :size="12" />
                <span>Private</span>
              </span>
            </div>

            <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                v-if="ev.creatorId === currentUserId"
                class="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-white transition-colors"
                title="Edit"
                @click.stop="emit('editEvent', ev)"
              >
                <PhPencilSimple :size="14" />
              </button>
              <button
                v-if="ev.creatorId === currentUserId"
                class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                title="Delete"
                @click.stop="emit('deleteEvent', ev.id)"
              >
                <PhTrash :size="14" />
              </button>
            </div>
          </div>

          <h4 class="text-base font-bold text-black mt-2 font-sans tracking-tight">
            {{ ev.isPrivate && ev.creatorId !== currentUserId ? 'Busy' : ev.title }}
          </h4>

          <div class="mt-2 flex items-center gap-1.5 text-xs font-bold text-gray-600 font-mono">
            <PhClock :size="14" />
            <span v-if="ev.allDay">All day event</span>
            <span v-else>{{ formatTime(ev.start) }} – {{ formatTime(ev.end) }}</span>
          </div>

          <p v-if="ev.description && (!ev.isPrivate || ev.creatorId === currentUserId)" class="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed bg-white p-2.5 rounded-xl border border-gray-100">
            {{ ev.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Quick action footer -->
    <div class="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs font-bold">
      <span class="text-gray-500 font-mono">Syncs in real-time</span>
      <button
        class="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
        @click="emit('addEvent', date)"
      >
        + Add plan for this day
      </button>
    </div>
  </div>
</template>
