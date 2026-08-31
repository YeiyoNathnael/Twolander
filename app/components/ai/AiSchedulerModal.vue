<script setup lang="ts">
import { PhSparkle, PhX, PhClock, PhHeart, PhLock, PhCheck, PhPencilSimple, PhArrowRight } from '@phosphor-icons/vue'
import type { CalendarEvent } from '~/shared/types'
import type { ConflictItem } from '~/stores/sacredTimes'
import ConflictWarningModal from '../events/ConflictWarningModal.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  created: [event: CalendarEvent]
  openFullForm: [eventDraft: Partial<CalendarEvent>]
}>()

const eventsStore = useEventsStore()
const sacredTimesStore = useSacredTimesStore()
const haptics = useHaptics()

const promptText = ref('')
const parsing = ref(false)
const saving = ref(false)
const parseError = ref('')

const parsedResult = ref<{
  title: string
  description?: string | null
  date: string
  startTime: string
  endTime: string
  start: string
  end: string
  allDay: boolean
  isPrivate: boolean
  isSacred: boolean
} | null>(null)

// Conflict Modal
const conflictModalOpen = ref(false)
const pendingConflicts = ref<ConflictItem[]>([])

const EXAMPLES = [
  'Romantic dinner this Friday from 8 to 10pm',
  'Weekend cabin trip next Saturday all day',
  'Late night movie date tomorrow at 9pm',
  'Morning workout tomorrow at 7am private',
]

function useExample(example: string) {
  haptics.light()
  promptText.value = example
  parsePrompt()
}

async function parsePrompt() {
  if (!promptText.value.trim()) return
  haptics.medium()
  parsing.value = true
  parseError.value = ''
  parsedResult.value = null

  try {
    const res = await $fetch<{ success: boolean; event: any }>('/api/ai/parse-event', {
      method: 'POST',
      body: {
        prompt: promptText.value.trim(),
        referenceDate: new Date().toISOString(),
      },
    })
    if (res.success && res.event) {
      haptics.success()
      parsedResult.value = res.event
    } else {
      parseError.value = 'Could not parse the event. Please try again.'
    }
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    parseError.value = msg || 'AI Parsing failed. Please check your prompt.'
  } finally {
    parsing.value = false
  }
}

async function confirmAndCreate() {
  if (!parsedResult.value) return

  const ev = parsedResult.value

  // Check for conflicts if not all-day
  if (!ev.allDay) {
    const check = await sacredTimesStore.checkConflict(ev.start, ev.end)
    if (check.hasConflict) {
      haptics.warning()
      pendingConflicts.value = check.conflicts
      conflictModalOpen.value = true
      return
    }
  }

  await executeSave()
}

async function executeSave() {
  if (!parsedResult.value) return
  saving.value = true
  try {
    const ev = parsedResult.value
    const created = await eventsStore.createEvent({
      title: ev.title,
      description: ev.description || undefined,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      isPrivate: ev.isPrivate,
      isSacred: ev.isSacred,
    })
    haptics.success()
    emit('created', created)
    emit('close')
    promptText.value = ''
    parsedResult.value = null
  } catch (err) {
    console.error('Failed to create event', err)
    parseError.value = 'Failed to save event.'
  } finally {
    saving.value = false
  }
}

function handleEditInFull() {
  if (!parsedResult.value) return
  haptics.light()
  emit('openFullForm', parsedResult.value)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" @click="emit('close')" />

      <!-- Responsive Bottom Sheet on Mobile / Centered Card on Desktop -->
      <div class="relative z-10 w-full sm:max-w-lg bg-white border border-gray-100 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        <!-- Drag pill for mobile view -->
        <div class="sm:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-1 shrink-0" />

        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
              <PhSparkle :size="20" weight="fill" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-black font-serif italic tracking-tight">
                AI Schedule Magic
              </h3>
              <p class="text-xs font-semibold text-gray-500">
                Type naturally — Gemini drafts your couple plans.
              </p>
            </div>
          </div>

          <button
            class="p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <PhX :size="18" />
          </button>
        </div>

        <!-- Prompt Input Area -->
        <div class="flex flex-col gap-2">
          <div class="relative">
            <textarea
              v-model="promptText"
              rows="3"
              placeholder="e.g. Surprise rooftop dinner with her this Friday at 8pm, sacred time"
              class="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-black
                     placeholder:text-gray-400 focus:outline-none focus:border-rose-600 focus:bg-white transition-all resize-none font-medium"
              @keydown.enter.prevent="parsePrompt"
            />
          </div>

          <!-- Quick inspiration chips -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono mr-1">
              Try:
            </span>
            <button
              v-for="(ex, i) in EXAMPLES"
              :key="i"
              type="button"
              class="px-2.5 py-1 rounded-full bg-gray-50 hover:bg-rose-50 hover:text-rose-700 text-gray-600 text-[11px] font-bold border border-gray-200 transition-all cursor-pointer truncate max-w-[200px] active:scale-95"
              @click="useExample(ex)"
            >
              {{ ex }}
            </button>
          </div>
        </div>

        <!-- Parse Button -->
        <button
          class="w-full py-3 rounded-2xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          :disabled="parsing || !promptText.trim()"
          @click="parsePrompt"
        >
          <PhSparkle :size="15" weight="bold" class="text-rose-400" />
          <span>{{ parsing ? 'Gemini is drafting...' : 'Draft Plan with AI' }}</span>
        </button>

        <!-- Error Message -->
        <p v-if="parseError" class="text-xs text-rose-700 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
          {{ parseError }}
        </p>

        <!-- Parsed Event Preview Card -->
        <div
          v-if="parsedResult"
          class="p-4 sm:p-5 rounded-2xl border bg-rose-50/40 border-rose-200 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs"
                  :class="parsedResult.isSacred ? 'bg-purple-600' : 'bg-rose-600'"
                >
                  {{ parsedResult.isSacred ? 'Sacred Us Time' : 'Couple Plan' }}
                </span>
                <span v-if="parsedResult.isPrivate" class="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                  <PhLock :size="11" />
                  <span>Private</span>
                </span>
              </div>

              <h4 class="text-base font-bold text-black mt-2 font-sans">
                {{ parsedResult.title }}
              </h4>
            </div>

            <button
              class="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
              title="Edit in full form"
              @click="handleEditInFull"
            >
              <PhPencilSimple :size="13" />
              <span>Edit</span>
            </button>
          </div>

          <div class="flex items-center gap-2 text-xs font-bold text-gray-700 font-mono bg-white/80 p-2.5 rounded-xl border border-gray-100">
            <PhClock :size="14" class="text-rose-600" />
            <span>{{ parsedResult.date }}</span>
            <span class="text-gray-300">•</span>
            <span v-if="parsedResult.allDay">All Day</span>
            <span v-else>{{ parsedResult.startTime }} – {{ parsedResult.endTime }}</span>
          </div>

          <!-- Confirm Button -->
          <div class="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer active:scale-95"
              @click="parsedResult = null"
            >
              Discard
            </button>

            <button
              type="button"
              :disabled="saving"
              class="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all active:scale-[0.98] shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              @click="confirmAndCreate"
            >
              <PhCheck :size="14" weight="bold" />
              <span>{{ saving ? 'Saving...' : 'Add to Calendar' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Conflict Warning Modal -->
    <ConflictWarningModal
      :open="conflictModalOpen"
      :conflicts="pendingConflicts"
      :saving="saving"
      @proceed-anyway="executeSave"
      @change-time="conflictModalOpen = false"
    />
  </Teleport>
</template>
