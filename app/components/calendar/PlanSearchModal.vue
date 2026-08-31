<script setup lang="ts">
import { PhMagnifyingGlass, PhX, PhClock, PhHeart, PhLock, PhCalendar } from '@phosphor-icons/vue'
import type { CalendarEvent } from '~/shared/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  selectEvent: [event: CalendarEvent]
}>()

const eventsStore = useEventsStore()
const auth = useAuthStore()

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

watch(() => props.open, (open) => {
  if (open) {
    searchQuery.value = ''
    setTimeout(() => searchInput.value?.focus(), 100)
  }
})

const filteredEvents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return eventsStore.events.slice(0, 10)
  return eventsStore.events.filter(e => {
    return e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))
  })
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 font-sans">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" @click="emit('close')" />

      <!-- Search Dialog -->
      <div class="relative z-10 w-full max-w-lg bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        <!-- Search Input Bar -->
        <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl">
          <PhMagnifyingGlass :size="18" class="text-gray-400 shrink-0" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Search plans, dates, dinners, trips..."
            class="flex-1 bg-transparent text-sm text-black placeholder:text-gray-400 focus:outline-none font-medium"
          />
          <button
            v-if="searchQuery"
            class="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
            @click="searchQuery = ''"
          >
            <PhX :size="14" />
          </button>
        </div>

        <!-- Results List -->
        <div class="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          <div v-if="filteredEvents.length === 0" class="py-8 text-center text-xs text-gray-400">
            No matching plans found for "{{ searchQuery }}".
          </div>

          <div
            v-for="ev in filteredEvents"
            :key="ev.id"
            class="p-3.5 rounded-2xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            @click="emit('selectEvent', ev); emit('close')"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                :class="ev.isSacred ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-rose-700'"
              >
                <PhHeart v-if="ev.isSacred" :size="16" weight="fill" />
                <PhCalendar v-else :size="16" weight="bold" />
              </div>

              <div class="min-w-0">
                <h4 class="text-xs sm:text-sm font-bold text-black truncate group-hover:text-rose-600 transition-colors">
                  {{ ev.isPrivate && ev.creatorId !== auth.user?.id ? 'Busy' : ev.title }}
                </h4>
                <div class="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 font-mono">
                  <span>{{ formatDate(ev.start) }}</span>
                  <span class="text-gray-300">•</span>
                  <span v-if="ev.allDay">All day</span>
                  <span v-else>{{ formatTime(ev.start) }}</span>
                </div>
              </div>
            </div>

            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
              :class="ev.isSacred ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ ev.isSacred ? 'Us Time' : (ev.creatorId === auth.user?.id ? 'You' : 'Partner') }}
            </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] font-semibold text-gray-400">
          <span>{{ filteredEvents.length }} results</span>
          <button
            class="text-gray-600 hover:text-black font-bold cursor-pointer"
            @click="emit('close')"
          >
            Esc to close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
