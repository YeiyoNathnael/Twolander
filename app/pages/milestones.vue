<script setup lang="ts">
import { PhPlus, PhTrash, PhCalendar, PhSparkle, PhHeart, PhWine, PhGift, PhHouse } from '@phosphor-icons/vue'
import type { MilestoneItem } from '~/shared/types'

definePageMeta({ layout: 'default' })

const milestones = ref<MilestoneItem[]>([])
const loading = ref(true)
const modalOpen = ref(false)

const PRESETS = [
  { title: 'Official Anniversary', icon: PhHeart, recurring: true },
  { title: 'First Date', icon: PhWine, recurring: true },
  { title: 'Moved in Together', icon: PhHouse, recurring: true },
  { title: 'First Trip Together', icon: PhSparkle, recurring: false },
  { title: 'Engagement / Special Day', icon: PhGift, recurring: true },
]

function applyPreset(p: typeof PRESETS[0]) {
  form.title = p.title
  form.recurring = p.recurring
}

const form = reactive({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  recurring: true,
})
const saving = ref(false)
const formError = ref('')

async function loadMilestones() {
  loading.value = true
  try {
    const data = await $fetch<MilestoneItem[]>('/api/milestones')
    milestones.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function createMilestone() {
  if (!form.title.trim()) {
    formError.value = 'Title is required'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    const created = await $fetch<MilestoneItem>('/api/milestones', {
      method: 'POST',
      body: {
        title: form.title.trim(),
        date: new Date(form.date).toISOString(),
        recurring: form.recurring,
      },
    })
    milestones.value.push(created)
    modalOpen.value = false
    form.title = ''
    form.recurring = true
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
    formError.value = msg || 'Failed to create milestone'
  } finally {
    saving.value = false
  }
}

async function deleteMilestone(id: string) {
  const previous = [...milestones.value]
  milestones.value = milestones.value.filter((m) => m.id !== id)
  try {
    await $fetch(`/api/milestones/${id}`, { method: 'DELETE' })
  } catch {
    milestones.value = previous
  }
}

function getDaysDiff(targetIso: string, recurring: boolean): { count: number; isFuture: boolean; label: string } {
  const target = new Date(targetIso)
  const now = new Date()
  
  if (recurring) {
    const thisYearTarget = new Date(now.getFullYear(), target.getMonth(), target.getDate())
    if (thisYearTarget < now) {
      thisYearTarget.setFullYear(now.getFullYear() + 1)
    }
    const diffTime = thisYearTarget.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return { count: 0, isFuture: true, label: 'Today!' }
    return { count: diffDays, isFuture: true, label: `${diffDays} days away` }
  }

  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays >= 0) {
    if (diffDays === 0) return { count: 0, isFuture: true, label: 'Today!' }
    return { count: diffDays, isFuture: true, label: `${diffDays} days away` }
  } else {
    const passed = Math.abs(diffDays)
    return { count: passed, isFuture: false, label: `${passed} days ago` }
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(() => {
  loadMilestones()
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 font-sans w-full flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between pb-6 border-b border-gray-100">
      <div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-black font-serif italic tracking-tight">
          Relationship Milestones
        </h1>
        <p class="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
          Special moments, anniversaries, and shared countdowns.
        </p>
      </div>

      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
        @click="modalOpen = true"
      >
        <PhPlus :size="16" weight="bold" />
        <span>Add milestone</span>
      </button>
    </div>

    <!-- Milestones Grid -->
    <div v-if="loading" class="text-sm font-semibold text-gray-400 py-16 text-center font-mono">
      Loading milestones...
    </div>

    <div v-else-if="milestones.length === 0" class="app-card p-12 text-center shadow-xs bg-white">
      <div class="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
        <PhSparkle :size="28" weight="fill" />
      </div>
      <h3 class="text-lg font-bold text-black font-serif italic">No milestones added yet</h3>
      <p class="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed font-medium">
        Track your official anniversary, memorable trips, first date, or future dreams together.
      </p>
      <button
        class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-xs cursor-pointer"
        @click="modalOpen = true"
      >
        <PhPlus :size="15" weight="bold" />
        <span>Add first milestone</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="item in milestones"
        :key="item.id"
        class="app-card p-6 bg-white flex flex-col justify-between hover:border-rose-300 hover:shadow-md transition-all group relative"
      >
        <div>
          <div class="flex items-start justify-between gap-3">
            <span
              class="px-3 py-1 rounded-full text-xs font-bold font-mono"
              :class="getDaysDiff(item.date, item.recurring).isFuture
                ? 'bg-rose-100 text-rose-800'
                : 'bg-gray-100 text-gray-800'"
            >
              {{ getDaysDiff(item.date, item.recurring).label }}
            </span>

            <button
              class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              title="Delete milestone"
              @click="deleteMilestone(item.id)"
            >
              <PhTrash :size="16" />
            </button>
          </div>

          <h3 class="text-xl font-bold text-black mt-4 line-clamp-2 font-serif tracking-tight">
            {{ item.title }}
          </h3>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 font-semibold">
          <div class="flex items-center gap-1.5 font-mono">
            <PhCalendar :size="15" class="text-rose-600" />
            <span>{{ formatDate(item.date) }}</span>
          </div>
          <span v-if="item.recurring" class="text-xs font-bold text-teal-600 font-mono">
            Yearly
          </span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-xs" @click="modalOpen = false" />
        <div class="relative z-10 w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <h2 class="text-2xl font-bold text-black font-serif italic tracking-tight">
            Add relationship milestone
          </h2>
          <p class="text-xs font-semibold text-gray-500 mt-1 mb-5">
            Record an unforgettable anniversary or date.
          </p>

          <!-- Quick Presets -->
          <div class="flex flex-col gap-1.5 mb-4">
            <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              Suggestions:
            </span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in PRESETS"
                :key="p.title"
                type="button"
                class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 hover:bg-rose-50 hover:text-rose-700 text-gray-700 text-[11px] font-bold border border-gray-200 transition-all cursor-pointer"
                @click="applyPreset(p)"
              >
                <component :is="p.icon" :size="12" />
                <span>{{ p.title }}</span>
              </button>
            </div>
          </div>

          <form class="flex flex-col gap-4" @submit.prevent="createMilestone">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-black">Milestone title</label>
              <input
                v-model="form.title"
                type="text"
                required
                placeholder="e.g. Official Anniversary, Moving In, First Date"
                class="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-black
                       placeholder:text-gray-400 focus:outline-none focus:border-rose-600 focus:bg-white transition-all font-medium"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-black">Date</label>
              <input
                v-model="form.date"
                type="date"
                required
                class="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-black font-mono
                       focus:outline-none focus:border-rose-600 focus:bg-white transition-all"
              />
            </div>

            <div class="flex items-center justify-between py-2 border-t border-gray-100">
              <div>
                <p class="text-xs font-bold text-black">Repeat yearly</p>
                <p class="text-[11px] text-gray-500">Auto-calculates annual anniversaries.</p>
              </div>
              <button
                type="button"
                class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer"
                :class="form.recurring ? 'bg-rose-600' : 'bg-gray-200'"
                @click="form.recurring = !form.recurring"
              >
                <span
                  class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-xs"
                  :class="form.recurring ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
            </div>

            <p v-if="formError" class="text-xs text-rose-700 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">{{ formError }}</p>

            <div class="mt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
                @click="modalOpen = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {{ saving ? 'Saving...' : 'Save milestone' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
