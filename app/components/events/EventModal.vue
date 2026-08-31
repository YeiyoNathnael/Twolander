<script setup lang="ts">
import type { CalendarEvent } from '~/shared/types'
import type { ConflictItem } from '~/stores/sacredTimes'
import { PhX, PhTrash, PhHeart, PhWine, PhFlame, PhMoon, PhSparkle, PhLock, PhClock, PhCheck, PhCalendar } from '@phosphor-icons/vue'
import ConflictWarningModal from './ConflictWarningModal.vue'

const props = defineProps<{
  open: boolean
  selectedDate?: Date | null
  editingEvent?: CalendarEvent | null
}>()

const emit = defineEmits<{
  close: []
  saved: [event: CalendarEvent]
  deleted: [id: string]
}>()

const eventsStore = useEventsStore()
const sacredTimesStore = useSacredTimesStore()
const auth = useAuthStore()
const haptics = useHaptics()

// ── Presets ───────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Date Night', icon: PhWine, title: 'Date Night', isSacred: true, isPrivate: false, cls: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300' },
  { label: 'Intimate Time', icon: PhHeart, title: 'Intimate Us Time', isSacred: true, isPrivate: false, cls: 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300' },
  { label: 'Movie & Relax', icon: PhMoon, title: 'Movie & Relax', isSacred: true, isPrivate: false, cls: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300' },
  { label: 'Getaway Trip', icon: PhSparkle, title: 'Weekend Getaway', isSacred: true, isPrivate: false, cls: 'hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300' },
  { label: 'Personal Busy', icon: PhLock, title: 'Busy', isSacred: false, isPrivate: true, cls: 'hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300' },
]

const TIME_SHORTCUTS = [
  { label: '7:00 PM', start: '19:00', end: '20:30' },
  { label: '8:00 PM', start: '20:00', end: '21:30' },
  { label: '8:30 PM', start: '20:30', end: '22:00' },
  { label: '9:00 PM', start: '21:00', end: '22:30' },
]

function applyPreset(p: typeof PRESETS[0]) {
  haptics.light()
  if (!form.title || PRESETS.some(preset => preset.title === form.title)) {
    form.title = p.title
  }
  form.isSacred = p.isSacred
  form.isPrivate = p.isPrivate
}

function setTimeShortcut(s: typeof TIME_SHORTCUTS[0]) {
  haptics.light()
  form.startTime = s.start
  form.endTime = s.end
}

function isShortcutActive(s: typeof TIME_SHORTCUTS[0]): boolean {
  return form.startTime === s.start && form.endTime === s.end
}

// ── Form state ────────────────────────────────────────────────────────────────

const form = reactive({
  title: '',
  description: '',
  date: '',
  startTime: '19:00',
  endTime: '20:30',
  allDay: false,
  isPrivate: false,
  isSacred: false,
})

const submitting = ref(false)
const deleting = ref(false)
const formError = ref('')

// Conflict Warning State
const conflictModalOpen = ref(false)
const pendingConflicts = ref<ConflictItem[]>([])

const isEditing = computed(() => !!props.editingEvent)

// ── Sync props → form ─────────────────────────────────────────────────────────

watch(
  () => props.open,
  (open) => {
    if (!open) return
    formError.value = ''
    conflictModalOpen.value = false
    pendingConflicts.value = []

    if (props.editingEvent) {
      const ev = props.editingEvent
      form.title = ev.title
      form.description = ev.description ?? ''
      form.date = ev.start.slice(0, 10)
      form.startTime = localTime(ev.start)
      form.endTime = localTime(ev.end)
      form.allDay = ev.allDay
      form.isPrivate = ev.isPrivate
      form.isSacred = ev.isSacred
    } else {
      const date = props.selectedDate ?? new Date()
      form.title = ''
      form.description = ''
      form.date = toDateStr(date)
      form.startTime = '19:00'
      form.endTime = '20:30'
      form.allDay = false
      form.isPrivate = false
      form.isSacred = true
    }
  },
  { immediate: true },
)

// ── Close on Escape ───────────────────────────────────────────────────────────

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && !conflictModalOpen.value) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

// ── Submit & Conflict Flow ───────────────────────────────────────────────────

async function handleInitialSubmit() {
  if (!form.title.trim()) {
    formError.value = 'Title is required'
    return
  }

  formError.value = ''

  const start = form.allDay
    ? `${form.date}T00:00:00.000Z`
    : fromLocalDateTime(form.date, form.startTime).toISOString()

  const end = form.allDay
    ? `${form.date}T23:59:59.000Z`
    : fromLocalDateTime(form.date, form.endTime).toISOString()

  // Check for conflicts with sacred time or other events if not all-day
  if (!form.allDay) {
    const check = await sacredTimesStore.checkConflict(start, end, props.editingEvent?.id)
    if (check.hasConflict) {
      haptics.warning()
      pendingConflicts.value = check.conflicts
      conflictModalOpen.value = true
      return
    }
  }

  await executeSave(start, end)
}

async function handleProceedAnyway() {
  const start = form.allDay
    ? `${form.date}T00:00:00.000Z`
    : fromLocalDateTime(form.date, form.startTime).toISOString()

  const end = form.allDay
    ? `${form.date}T23:59:59.000Z`
    : fromLocalDateTime(form.date, form.endTime).toISOString()

  conflictModalOpen.value = false
  await executeSave(start, end)
}

async function executeSave(start: string, end: string) {
  submitting.value = true
  try {
    let saved: CalendarEvent

    if (isEditing.value && props.editingEvent) {
      saved = await eventsStore.updateEvent(props.editingEvent.id, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        start,
        end,
        allDay: form.allDay,
        isPrivate: form.isPrivate,
        isSacred: form.isSacred,
      })
    } else {
      saved = await eventsStore.createEvent({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        start,
        end,
        allDay: form.allDay,
        isPrivate: form.isPrivate,
        isSacred: form.isSacred,
      })
    }

    haptics.success()
    emit('saved', saved)
    emit('close')
  } catch {
    formError.value = 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function confirmDelete() {
  if (!props.editingEvent) return
  deleting.value = true
  try {
    await eventsStore.deleteEvent(props.editingEvent.id)
    haptics.light()
    emit('deleted', props.editingEvent.id)
    emit('close')
  } catch {
    formError.value = 'Failed to delete event.'
  } finally {
    deleting.value = false
  }
}

// ── Date/time helpers ─────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function localTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min)
}

const canEdit = computed(() => {
  if (!props.editingEvent) return true
  return props.editingEvent.creatorId === auth.user?.id
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" @click="emit('close')" />

      <!-- Responsive Sheet: Slide-Up Bottom Sheet on Mobile / Center Dialog on Desktop -->
      <div
        class="relative z-10 w-full sm:max-w-lg bg-white border border-gray-100 rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden"
        @click.stop
      >
        <!-- Drag pill for mobile view -->
        <div class="sm:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 shrink-0" />

        <!-- Header -->
        <div class="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-black font-serif italic tracking-tight">
              {{ isEditing ? 'Edit shared plan' : 'Plan a moment together' }}
            </h2>
            <p class="text-xs font-semibold text-gray-500 mt-0.5">
              Keep your schedules coordinated and harmonious.
            </p>
          </div>
          <button
            class="p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <PhX :size="18" />
          </button>
        </div>

        <!-- View-only notice for partner's event -->
        <div
          v-if="isEditing && !canEdit"
          class="px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 border-b border-teal-200 rounded-xl my-2 shrink-0"
        >
          Created by your partner. View-only access.
        </div>

        <!-- Form Body with shrink-0 protected rows -->
        <form
          class="flex-1 overflow-y-auto py-4 flex flex-col gap-4 pr-1"
          @submit.prevent="handleInitialSubmit"
        >
          <!-- Quick Preset Chips -->
          <div v-if="!isEditing" class="flex flex-col gap-1.5 shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              Quick Vibe
            </span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in PRESETS"
                :key="p.label"
                type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-700 bg-white transition-all shadow-2xs cursor-pointer active:scale-95 select-none"
                :class="p.cls"
                @click="applyPreset(p)"
              >
                <component :is="p.icon" :size="13" weight="bold" />
                <span>{{ p.label }}</span>
              </button>
            </div>
          </div>

          <!-- Title -->
          <div class="flex flex-col gap-1.5 shrink-0">
            <label class="text-xs font-bold text-black">Event Title</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="What are you planning?"
              :disabled="!canEdit"
              class="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-black
                     placeholder:text-gray-400 focus:outline-none focus:border-rose-600 focus:bg-white transition-all disabled:opacity-50 font-medium"
            />
          </div>

          <!-- Date & Time Row -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
            <div class="flex flex-col gap-1 sm:col-span-1">
              <label class="text-xs font-bold text-black">Date</label>
              <input
                v-model="form.date"
                type="date"
                :disabled="!canEdit"
                class="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black font-mono
                       focus:outline-none focus:border-rose-600 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>

            <div v-if="!form.allDay" class="flex flex-col gap-1">
              <label class="text-xs font-bold text-black">Start Time</label>
              <input
                v-model="form.startTime"
                type="time"
                :disabled="!canEdit"
                class="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black font-mono
                       focus:outline-none focus:border-rose-600 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>

            <div v-if="!form.allDay" class="flex flex-col gap-1">
              <label class="text-xs font-bold text-black">End Time</label>
              <input
                v-model="form.endTime"
                type="time"
                :disabled="!canEdit"
                class="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black font-mono
                       focus:outline-none focus:border-rose-600 focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Quick Time Shortcuts (Fixed Un-squished Row) -->
          <div v-if="!form.allDay && !isEditing" class="flex flex-col gap-1.5 shrink-0 min-h-[36px]">
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span class="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider shrink-0">
                Suggested Times:
              </span>
              <button
                v-for="st in TIME_SHORTCUTS"
                :key="st.label"
                type="button"
                class="px-3 py-1.5 rounded-full text-xs font-mono font-bold shrink-0 transition-all duration-150 cursor-pointer active:scale-95 select-none"
                :class="isShortcutActive(st)
                  ? 'bg-black text-white shadow-xs scale-102'
                  : 'bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-700 border border-gray-200/60'"
                @click="setTimeShortcut(st)"
              >
                {{ st.label }}
              </button>
            </div>
          </div>

          <!-- All Day Toggle -->
          <div class="flex items-center justify-between py-1 px-1 shrink-0">
            <span class="text-xs font-bold text-gray-700">All day plan</span>
            <button
              type="button"
              :disabled="!canEdit"
              class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
              :class="form.allDay ? 'bg-rose-600' : 'bg-gray-200'"
              @click="form.allDay = !form.allDay; haptics.light()"
            >
              <span
                class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-xs"
                :class="form.allDay ? 'translate-x-5' : 'translate-x-1'"
              />
            </button>
          </div>

          <!-- Sacred Time & Privacy Badges -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-100 shrink-0">
            <!-- Sacred Us Time Card -->
            <div
              class="p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between active:scale-[0.98]"
              :class="form.isSacred ? 'bg-purple-50/70 border-purple-300' : 'bg-gray-50 border-gray-200'"
              @click="form.isSacred = !form.isSacred; haptics.light()"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <PhHeart :size="16" weight="fill" />
                </div>
                <div>
                  <p class="text-xs font-bold text-black">Sacred Us Time</p>
                  <p class="text-[10px] text-gray-500">Protected block</p>
                </div>
              </div>

              <div
                class="w-4 h-4 rounded-full border flex items-center justify-center"
                :class="form.isSacred ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 bg-white'"
              >
                <PhCheck v-if="form.isSacred" :size="10" weight="bold" />
              </div>
            </div>

            <!-- Anonymous Busy Card -->
            <div
              class="p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between active:scale-[0.98]"
              :class="form.isPrivate ? 'bg-rose-50/70 border-rose-300' : 'bg-gray-50 border-gray-200'"
              @click="form.isPrivate = !form.isPrivate; haptics.light()"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <PhLock :size="16" weight="bold" />
                </div>
                <div>
                  <p class="text-xs font-bold text-black">Anonymous Busy</p>
                  <p class="text-[10px] text-gray-500">Partner sees 'Busy'</p>
                </div>
              </div>

              <div
                class="w-4 h-4 rounded-full border flex items-center justify-center"
                :class="form.isPrivate ? 'bg-rose-600 border-rose-600 text-white' : 'border-gray-300 bg-white'"
              >
                <PhCheck v-if="form.isPrivate" :size="10" weight="bold" />
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="flex flex-col gap-1.5 shrink-0">
            <label class="text-xs font-bold text-black">Notes & Details (Optional)</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Location, reservations, or notes for your partner..."
              :disabled="!canEdit"
              class="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black
                     placeholder:text-gray-400 focus:outline-none focus:border-rose-600 focus:bg-white transition-all resize-none disabled:opacity-50 font-medium"
            />
          </div>

          <!-- Error Alert -->
          <p v-if="formError" class="text-xs text-rose-700 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200 shrink-0">
            {{ formError }}
          </p>
        </form>

        <!-- Footer Actions -->
        <div class="pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            v-if="isEditing && canEdit"
            type="button"
            :disabled="deleting"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
            @click="confirmDelete"
          >
            <PhTrash :size="14" />
            <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
          </button>
          <div v-else />

          <div class="flex items-center gap-2.5">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer active:scale-95"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              v-if="canEdit"
              type="button"
              :disabled="submitting"
              class="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50"
              @click="handleInitialSubmit"
            >
              {{ submitting ? 'Saving...' : (isEditing ? 'Save changes' : 'Create plan') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Conflict Warning Modal -->
    <ConflictWarningModal
      :open="conflictModalOpen"
      :conflicts="pendingConflicts"
      :saving="submitting"
      @proceed-anyway="handleProceedAnyway"
      @change-time="conflictModalOpen = false"
    />
  </Teleport>
</template>
