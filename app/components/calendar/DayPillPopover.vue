<script setup lang="ts">
import { PhPlus, PhX, PhHeart, PhWine, PhFlame, PhMoon, PhSparkle, PhClock, PhLock, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'
import type { CalendarEvent } from '~/shared/types'

const props = defineProps<{
  open: boolean
  date: Date
  events: CalendarEvent[]
  currentUserId: string
}>()

const emit = defineEmits<{
  close: []
  addPlan: [date: Date]
  editPlan: [event: CalendarEvent]
  deletePlan: [id: string]
}>()

const eventsStore = useEventsStore()

const formattedDate = computed(() => {
  return props.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
})

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
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

async function handleDelete(id: string) {
  await eventsStore.deleteEvent(id)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" @click="emit('close')" />

      <!-- Floating Pill Card -->
      <div class="relative z-10 w-full max-w-md bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        <!-- Card Header -->
        <div class="flex items-center justify-between pb-3 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-600 inline-block shadow-2xs" />
            <h3 class="text-base font-extrabold text-black font-sans">
              {{ formattedDate }}
            </h3>
            <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold font-mono">
              {{ events.length }} {{ events.length === 1 ? 'plan' : 'plans' }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-xs cursor-pointer active:scale-95"
              @click="emit('addPlan', date)"
            >
              <PhPlus :size="13" weight="bold" />
              <span>Add</span>
            </button>
            <button
              class="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              @click="emit('close')"
            >
              <PhX :size="16" />
            </button>
          </div>
        </div>

        <!-- Plans List -->
        <div v-if="events.length === 0" class="py-8 flex flex-col items-center justify-center text-center gap-2">
          <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <PhHeart :size="24" />
          </div>
          <p class="text-sm font-bold text-black">No plans scheduled yet</p>
          <p class="text-xs text-gray-400 max-w-[220px]">
            Schedule a date, dinner, or protect it as sacred us-time.
          </p>
          <div class="flex items-center gap-2 mt-2">
            <button
              class="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-xs cursor-pointer"
              @click="emit('addPlan', date)"
            >
              + Create plan
            </button>
          </div>
        </div>

        <div v-else class="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
          <div
            v-for="ev in events"
            :key="ev.id"
            class="p-3.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex items-center justify-between gap-3 group"
            :class="ev.isSacred ? 'bg-purple-50/60 border-purple-200' : 'bg-gray-50/70 border-gray-200'"
            @click="emit('editPlan', ev)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                :class="getEventIcon(ev).cls"
              >
                <component :is="getEventIcon(ev).icon" :size="18" weight="bold" />
              </div>

              <div class="min-w-0">
                <h4 class="text-xs sm:text-sm font-bold text-black truncate group-hover:text-rose-600 transition-colors">
                  {{ ev.isPrivate && ev.creatorId !== currentUserId ? 'Busy' : ev.title }}
                </h4>
                <div class="flex items-center gap-2 mt-0.5">
                  <span
                    class="text-[10px] font-bold uppercase tracking-wider"
                    :class="ev.isSacred ? 'text-purple-700' : (ev.creatorId === currentUserId ? 'text-rose-600' : 'text-teal-600')"
                  >
                    {{ ev.isSacred ? 'Us Time' : (ev.creatorId === currentUserId ? 'You' : 'Partner') }}
                  </span>
                  <span v-if="ev.isPrivate" class="flex items-center gap-0.5 text-[10px] text-gray-400">
                    <PhLock :size="9" />
                    <span>Private</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Time badge & actions -->
            <div class="flex items-center gap-2 shrink-0">
              <span
                v-if="ev.allDay"
                class="px-2.5 py-1 rounded-full bg-white text-gray-800 text-[10px] font-bold font-mono border border-gray-200"
              >
                All Day
              </span>
              <span
                v-else
                class="px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-bold font-mono shadow-xs"
              >
                {{ formatTime(ev.start) }}
              </span>

              <!-- Hover delete for own events -->
              <button
                v-if="ev.creatorId === currentUserId"
                class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                title="Delete event"
                @click.stop="handleDelete(ev.id)"
              >
                <PhTrash :size="13" />
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
          <span class="text-gray-400 font-mono text-[11px]">Real-time linked</span>
          <button
            class="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-bold"
            @click="emit('addPlan', date)"
          >
            + Add another plan
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
