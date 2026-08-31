<script setup lang="ts">
import {
  PhX,
  PhWaves,
  PhSun,
  PhFlame,
  PhMoon,
  PhSparkle,
  PhHeart,
  PhGearSix,
  PhSignOut,
  PhCheck,
} from '@phosphor-icons/vue'
import type { MoodType } from '~/shared/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

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

const MOOD_OPTIONS: Array<{
  type: MoodType
  label: string
  icon: any
  activeBg: string
  activeRing: string
  colorCls: string
  desc: string
}> = [
  {
    type: 'calm',
    label: 'Calm',
    icon: PhWaves,
    activeBg: 'bg-emerald-600 text-white',
    activeRing: 'ring-emerald-500',
    colorCls: 'text-emerald-600 bg-emerald-50',
    desc: 'Peaceful & grounded',
  },
  {
    type: 'happy',
    label: 'Happy',
    icon: PhSun,
    activeBg: 'bg-amber-500 text-white',
    activeRing: 'ring-amber-500',
    colorCls: 'text-amber-600 bg-amber-50',
    desc: 'Joyful & upbeat',
  },
  {
    type: 'excited',
    label: 'Excited',
    icon: PhFlame,
    activeBg: 'bg-rose-600 text-white',
    activeRing: 'ring-rose-500',
    colorCls: 'text-rose-600 bg-rose-50',
    desc: 'Full of passion & energy',
  },
  {
    type: 'tired',
    label: 'Tired',
    icon: PhMoon,
    activeBg: 'bg-indigo-600 text-white',
    activeRing: 'ring-indigo-500',
    colorCls: 'text-indigo-600 bg-indigo-50',
    desc: 'Low battery, needing rest',
  },
  {
    type: 'stressed',
    label: 'Stressed',
    icon: PhSparkle,
    activeBg: 'bg-red-600 text-white',
    activeRing: 'ring-red-500',
    colorCls: 'text-red-600 bg-red-50',
    desc: 'Overwhelmed or tense',
  },
]

async function selectMood(mood: MoodType) {
  haptics.light()
  try {
    await moodsStore.setMood(todayStr.value, mood)
  } catch (err) {
    console.error('Failed to set mood', err)
  }
}

function getMoodBadge(moodType?: string) {
  return MOOD_OPTIONS.find((m) => m.type === moodType)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        @click="emit('close')"
      />

      <!-- Sheet Card -->
      <div
        class="relative z-10 w-full sm:max-w-md bg-white border border-gray-100 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Mobile drag pill -->
        <div class="sm:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-1 shrink-0" />

        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div class="flex items-center gap-3">
            <!-- User Avatar with Mood Glow -->
            <div
              class="w-11 h-11 rounded-full overflow-hidden ring-3 transition-all shrink-0"
              :class="getMoodBadge(myMood?.mood)?.activeRing || 'ring-gray-200'"
            >
              <img
                v-if="auth.user?.avatar"
                :src="auth.user.avatar"
                :alt="auth.user.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-sm font-extrabold bg-rose-50 text-rose-600"
              >
                {{ auth.user?.name?.charAt(0).toUpperCase() }}
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-black font-serif italic tracking-tight">
                {{ auth.user?.name || 'Your Profile' }}
              </h3>
              <p class="text-xs font-semibold text-gray-400">
                Daily energy & couple harmony
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

        <!-- Section 1: Your Mood Selector -->
        <div class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              Your Energy Today
            </span>
            <span
              v-if="myMood"
              class="text-[11px] font-bold capitalize px-2.5 py-0.5 rounded-full font-mono"
              :class="getMoodBadge(myMood.mood)?.colorCls"
            >
              {{ myMood.mood }}
            </span>
          </div>

          <!-- 5 Mood Option Buttons -->
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="m in MOOD_OPTIONS"
              :key="m.type"
              type="button"
              class="flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 cursor-pointer active:scale-[0.98] select-none"
              :class="
                myMood?.mood === m.type
                  ? m.activeBg + ' border-transparent shadow-xs font-extrabold scale-[1.01]'
                  : 'bg-gray-50/80 hover:bg-gray-100/80 border-gray-200/70 text-gray-800'
              "
              @click="selectMood(m.type)"
            >
              <div class="flex items-center gap-2.5">
                <component
                  :is="m.icon"
                  :size="18"
                  weight="bold"
                  :class="myMood?.mood === m.type ? 'text-white' : m.colorCls.split(' ')[0]"
                />
                <div class="text-left">
                  <p class="text-xs font-bold">{{ m.label }}</p>
                  <p
                    class="text-[10px]"
                    :class="myMood?.mood === m.type ? 'text-white/80' : 'text-gray-400'"
                  >
                    {{ m.desc }}
                  </p>
                </div>
              </div>

              <div
                v-if="myMood?.mood === m.type"
                class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                <PhCheck :size="12" weight="bold" />
              </div>
            </button>
          </div>
        </div>

        <!-- Section 2: Partner's Status Card -->
        <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              Partner's Energy
            </span>
            <span class="text-[10px] font-bold text-gray-400">Live Status</span>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <PhHeart :size="16" weight="fill" class="text-teal-600" />
              </div>
              <div>
                <p class="text-xs font-bold text-black">Partner</p>
                <p class="text-[11px] font-medium text-gray-500">
                  {{ partnerMood ? `Feeling ${partnerMood.mood}` : 'Waiting for check-in' }}
                </p>
              </div>
            </div>

            <span
              v-if="partnerMood"
              class="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full capitalize"
              :class="getMoodBadge(partnerMood.mood)?.colorCls || 'bg-rose-50 text-rose-700'"
            >
              {{ partnerMood.mood }}
            </span>
            <span v-else class="text-[11px] font-semibold text-gray-400">Not checked in</span>
          </div>
        </div>

        <!-- Section 3: Quick Navigation to Settings / Sign Out -->
        <div class="pt-2 border-t border-gray-100 flex items-center justify-between">
          <NuxtLink
            to="/settings"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
            @click="emit('close')"
          >
            <PhGearSix :size="15" />
            <span>Settings & Google Sync</span>
          </NuxtLink>

          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            @click="auth.logout(); emit('close')"
          >
            <PhSignOut :size="15" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
