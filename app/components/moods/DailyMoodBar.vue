<script setup lang="ts">
import { PhSun, PhSparkle, PhMoon, PhFlame, PhWaves, PhHeart, PhCheckCircle } from '@phosphor-icons/vue'
import type { MoodType } from '~/shared/types'

const auth = useAuthStore()
const moodsStore = useMoodsStore()
const haptics = useHaptics()

const todayStr = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

const myMood = computed(() => moodsStore.getMyMoodForDate(todayStr.value))
const partnerMood = computed(() => moodsStore.getPartnerMoodForDate(todayStr.value))
const bothCheckedIn = computed(() => !!myMood.value && !!partnerMood.value)

const MOODS: Array<{ type: MoodType; label: string; icon: any; activeClass: string }> = [
  { type: 'calm', label: 'Calm', icon: PhWaves, activeClass: 'bg-emerald-600 text-white' },
  { type: 'happy', label: 'Happy', icon: PhSun, activeClass: 'bg-amber-500 text-white' },
  { type: 'excited', label: 'Excited', icon: PhFlame, activeClass: 'bg-rose-600 text-white' },
  { type: 'tired', label: 'Tired', icon: PhMoon, activeClass: 'bg-indigo-600 text-white' },
  { type: 'stressed', label: 'Stressed', icon: PhSparkle, activeClass: 'bg-red-600 text-white' },
]

async function selectMood(mood: MoodType) {
  haptics.light()
  try {
    await moodsStore.setMood(todayStr.value, mood)
  } catch (err) {
    console.error('Failed to set mood', err)
  }
}
</script>

<template>
  <div class="w-full min-w-0 bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-2xs text-xs font-sans flex flex-col gap-2.5">
    <!-- Top row: Energy Label & 5-Column Responsive Mood Grid -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider shrink-0">
          Today's Energy:
        </span>
        <span
          v-if="bothCheckedIn"
          class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono border border-emerald-200"
        >
          <PhCheckCircle :size="11" weight="bold" />
          <span>Both checked in</span>
        </span>
      </div>

      <!-- 5-Column Fluid Button Grid -->
      <div class="grid grid-cols-5 gap-1.5 w-full sm:w-auto min-w-0">
        <button
          v-for="m in MOODS"
          :key="m.type"
          type="button"
          class="flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2.5 rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer truncate min-w-0 select-none active:scale-95"
          :class="myMood?.mood === m.type
            ? m.activeClass + ' shadow-2xs font-extrabold'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100/80'"
          @click="selectMood(m.type)"
        >
          <component :is="m.icon" :size="12" class="shrink-0" />
          <span class="truncate hidden xs:inline sm:inline">{{ m.label }}</span>
        </button>
      </div>
    </div>

    <!-- Bottom row: Partner's Real-Time Status -->
    <div class="pt-2 border-t border-gray-50 flex items-center justify-between text-xs min-w-0">
      <span class="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">
        Partner:
      </span>
      <template v-if="partnerMood">
        <span class="inline-flex items-center gap-1 font-bold text-black bg-rose-50 px-2.5 py-0.5 rounded-full text-[11px] border border-rose-100 animate-in fade-in duration-200">
          <PhHeart :size="11" weight="fill" class="text-rose-600" />
          <span class="capitalize">{{ partnerMood.mood }}</span>
        </span>
      </template>
      <span v-else class="text-[11px] font-semibold text-gray-400">Waiting for check-in</span>
    </div>
  </div>
</template>
