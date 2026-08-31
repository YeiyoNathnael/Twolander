<script setup lang="ts">
import { PhCalendar, PhSparkle, PhGearSix } from '@phosphor-icons/vue'

const route = useRoute()
const haptics = useHaptics()
</script>

<template>
  <div class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 mb-[env(safe-area-inset-bottom,0px)]">
    <nav class="dock-pill px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1 sm:gap-2 shadow-2xl border border-slate-800">

      <!-- Calendar Tab -->
      <NuxtLink
        to="/calendar"
        class="flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-150 cursor-pointer active:scale-95 select-none"
        :class="route.path === '/calendar'
          ? 'bg-white text-black font-extrabold shadow-sm'
          : 'text-gray-400 hover:text-white'"
        @click="haptics.light()"
      >
        <PhCalendar :size="17" weight="bold" />
        <span class="text-xs tracking-tight" :class="route.path === '/calendar' ? 'inline' : 'hidden sm:inline'">
          Calendar
        </span>
      </NuxtLink>

      <!-- Milestones Tab -->
      <NuxtLink
        to="/milestones"
        class="flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-150 cursor-pointer active:scale-95 select-none"
        :class="route.path === '/milestones'
          ? 'bg-white text-black font-extrabold shadow-sm'
          : 'text-gray-400 hover:text-white'"
        @click="haptics.light()"
      >
        <PhSparkle :size="17" weight="bold" />
        <span class="text-xs tracking-tight" :class="route.path === '/milestones' ? 'inline' : 'hidden sm:inline'">
          Milestones
        </span>
      </NuxtLink>

      <!-- Settings Tab -->
      <NuxtLink
        to="/settings"
        class="flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-150 cursor-pointer active:scale-95 select-none"
        :class="route.path === '/settings'
          ? 'bg-white text-black font-extrabold shadow-sm'
          : 'text-gray-400 hover:text-white'"
        @click="haptics.light()"
      >
        <PhGearSix :size="17" weight="bold" />
        <span class="text-xs tracking-tight" :class="route.path === '/settings' ? 'inline' : 'hidden sm:inline'">
          Settings
        </span>
      </NuxtLink>

    </nav>
  </div>
</template>
