<script setup lang="ts">
import FloatingDock from '~/components/navigation/FloatingDock.vue'
import ProfileMoodModal from '~/components/profile/ProfileMoodModal.vue'

const auth = useAuthStore()
const moodsStore = useMoodsStore()
const { isConnected } = useRealtime()
const haptics = useHaptics()

const profileModalOpen = ref(false)

const todayStr = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

const myMood = computed(() => moodsStore.getMyMoodForDate(todayStr.value))

const moodRingClass = computed(() => {
  switch (myMood.value?.mood) {
    case 'calm':
      return 'ring-emerald-500 bg-emerald-50 text-emerald-700'
    case 'happy':
      return 'ring-amber-500 bg-amber-50 text-amber-700'
    case 'excited':
      return 'ring-rose-500 bg-rose-50 text-rose-700'
    case 'tired':
      return 'ring-indigo-500 bg-indigo-50 text-indigo-700'
    case 'stressed':
      return 'ring-red-500 bg-red-50 text-red-700'
    default:
      return 'ring-rose-300 bg-rose-50 text-rose-600'
  }
})
</script>

<template>
  <div class="min-h-screen w-full bg-[#f8fafc] text-black flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900 pb-36">
    <!-- Top Minimalist Brand Header -->
    <header
      class="h-14 sm:h-16 w-full bg-[#f8fafc]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 shrink-0 border-b border-gray-100/60"
    >
      <!-- Brand & Live Indicator -->
      <div class="flex items-center gap-2 min-w-0">
        <NuxtLink to="/calendar" class="flex items-center gap-2 group min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block transition-transform group-hover:scale-110 shadow-xs shrink-0" />
          <span class="text-xl font-bold font-serif tracking-tight text-black italic truncate">
            Twolander
          </span>
        </NuxtLink>

        <!-- Live Sync Status -->
        <span
          class="w-2 h-2 rounded-full transition-colors shrink-0 ml-0.5"
          :class="isConnected ? 'bg-emerald-500' : 'bg-gray-300'"
          :title="isConnected ? 'Live sync connected' : 'Connecting...'"
        />
      </div>

      <!-- Right: User Avatar & Mood Launcher -->
      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          class="flex items-center gap-2 p-0.5 rounded-full transition-transform active:scale-95 cursor-pointer select-none"
          title="Your Energy & Profile"
          @click="haptics.light(); profileModalOpen = true"
        >
          <div
            v-if="auth.user?.avatar"
            class="w-8 h-8 rounded-full overflow-hidden ring-2 shrink-0 shadow-xs transition-all"
            :class="moodRingClass"
          >
            <img
              :src="auth.user.avatar"
              :alt="auth.user.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ring-2 shadow-xs shrink-0 transition-all"
            :class="moodRingClass"
          >
            {{ auth.user?.name?.charAt(0).toUpperCase() }}
          </div>
        </button>
      </div>
    </header>

    <!-- Page Content Container -->
    <main class="flex-1 max-w-7xl mx-auto w-full min-w-0 px-3 sm:px-8 flex flex-col">
      <slot />
    </main>

    <!-- Floating Dock -->
    <FloatingDock />

    <!-- Profile & Energy Modal -->
    <ProfileMoodModal
      :open="profileModalOpen"
      @close="profileModalOpen = false"
    />
  </div>
</template>
