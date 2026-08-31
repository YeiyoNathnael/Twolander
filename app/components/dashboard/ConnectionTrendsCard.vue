<script setup lang="ts">
import { PhHeart, PhSparkle } from '@phosphor-icons/vue'

const dashboardStore = useDashboardStore()

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const totalMinutes = computed(() => dashboardStore.stats.totalMinutes)
const harmonyScore = computed(() => dashboardStore.stats.harmonyScore)
const waveHeights = computed(() => dashboardStore.stats.waveHeights)
</script>

<template>
  <div class="app-card p-6 bg-white flex flex-col justify-between overflow-hidden relative font-sans">
    <!-- Top Row: Title + Percentage badge -->
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-bold text-gray-500 font-sans">
            Connection Rhythm
          </h3>
          <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        </div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-4xl font-extrabold text-black font-sans tracking-tight">
            {{ totalMinutes }}
          </span>
          <span class="text-xs font-bold text-gray-400 font-mono">min together this month</span>
        </div>
      </div>

      <!-- Sync Score Pill -->
      <div class="flex flex-col items-end gap-1.5">
        <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-extrabold font-mono border border-emerald-200">
          {{ harmonyScore }}%
        </span>
        <div class="flex items-center gap-2 text-[10px] font-mono text-gray-400">
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-400" /> &lt;2h</span>
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400" /> ≈4h</span>
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400" /> &gt;6h</span>
        </div>
      </div>
    </div>

    <!-- Harmonic Wave Chart (Computed from real activity per day) -->
    <div class="mt-6 flex flex-col gap-2">
      <div class="h-28 w-full flex items-end justify-between gap-[3px] px-1 overflow-hidden">
        <div
          v-for="(h, idx) in waveHeights"
          :key="idx"
          class="flex-1 rounded-full transition-all duration-500 hover:opacity-80"
          :style="{
            height: `${h}%`,
            background: idx < 12
              ? 'linear-gradient(to top, #fda4af, #f43f5e)'
              : (idx < 24
                ? 'linear-gradient(to top, #fed7aa, #f59e0b)'
                : 'linear-gradient(to top, #a7f3d0, #10b981)'),
          }"
        />
      </div>

      <!-- Days labels -->
      <div class="flex justify-between text-xs font-bold text-gray-400 font-mono px-2 pt-2 border-t border-gray-100">
        <span v-for="d in days" :key="d">{{ d }}</span>
      </div>
    </div>
  </div>
</template>
