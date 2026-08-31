<script setup lang="ts">
import { PhHeart, PhWine, PhFlame, PhSparkle } from '@phosphor-icons/vue'

const dashboardStore = useDashboardStore()

const sacredHours = computed(() => dashboardStore.stats.sacredHours)
const datesCount = computed(() => dashboardStore.stats.datesCount)
const harmonyScore = computed(() => dashboardStore.stats.harmonyScore)
const nextMilestone = computed(() => dashboardStore.stats.nextMilestone)
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">

    <!-- Card 1: Sacred Us Time -->
    <div class="app-card p-5 bg-white flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs font-bold text-gray-500">Sacred Us Time</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-3xl font-extrabold text-black font-sans">
              {{ sacredHours }}h
            </span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 font-mono">
              Protected
            </span>
          </div>
          <span class="text-[11px] text-gray-400 font-mono mt-0.5 block">Logged this month</span>
        </div>

        <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <PhHeart :size="18" weight="fill" />
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-4 flex items-center gap-3">
        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-purple-500 to-rose-500 rounded-full transition-all duration-500"
            :style="{ width: `${Math.min(100, Math.max(15, sacredHours * 10))}%` }"
          />
        </div>
        <span class="text-xs font-bold font-mono text-gray-500">{{ Math.min(100, sacredHours * 10) }}%</span>
      </div>
    </div>

    <!-- Card 2: Dates & Intimate Outings -->
    <div class="app-card p-5 bg-white flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs font-bold text-gray-500">Dates & Outings</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-3xl font-extrabold text-black font-sans">
              {{ datesCount }}
            </span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 font-mono">
              Plans
            </span>
          </div>
          <span class="text-[11px] text-gray-400 font-mono mt-0.5 block">Shared memories</span>
        </div>

        <div class="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <PhWine :size="18" weight="bold" />
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-4 flex items-center gap-3">
        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
            :style="{ width: `${Math.min(100, Math.max(20, datesCount * 15))}%` }"
          />
        </div>
        <span class="text-xs font-bold font-mono text-gray-500">{{ Math.min(100, datesCount * 15) }}%</span>
      </div>
    </div>

    <!-- Card 3: Harmony Rate -->
    <div class="app-card p-5 bg-white flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs font-bold text-gray-500">Harmony & Energy</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-3xl font-extrabold text-black font-sans">
              {{ harmonyScore }}%
            </span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 font-mono">
              In Sync
            </span>
          </div>
          <span class="text-[11px] text-gray-400 font-mono mt-0.5 block">Based on 30d check-ins</span>
        </div>

        <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <PhFlame :size="18" weight="bold" />
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-4 flex items-center gap-3">
        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            :style="{ width: `${harmonyScore}%` }"
          />
        </div>
        <span class="text-xs font-bold font-mono text-gray-500">{{ harmonyScore }}%</span>
      </div>
    </div>

    <!-- Card 4: Next Romantic Milestone -->
    <div class="app-card p-5 bg-white flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs font-bold text-gray-500">Next Milestone</span>
          <div class="flex items-baseline gap-2 mt-1">
            <template v-if="nextMilestone">
              <span class="text-3xl font-extrabold text-black font-sans">
                {{ nextMilestone.daysAway }}d
              </span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 font-mono truncate max-w-[120px]">
                {{ nextMilestone.title }}
              </span>
            </template>
            <template v-else>
              <span class="text-2xl font-bold text-gray-400 font-sans">
                No dates
              </span>
            </template>
          </div>
          <span class="text-[11px] text-gray-400 font-mono mt-0.5 block">
            {{ nextMilestone ? 'Upcoming celebration' : 'Add in Milestones tab' }}
          </span>
        </div>

        <div class="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
          <PhSparkle :size="18" weight="bold" />
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-4 flex items-center gap-3">
        <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-teal-500 to-purple-500 rounded-full transition-all duration-500"
            :style="{ width: nextMilestone ? `${Math.max(10, Math.min(100, 100 - nextMilestone.daysAway * 3))}%` : '20%' }"
          />
        </div>
        <span class="text-xs font-bold font-mono text-gray-500">
          {{ nextMilestone ? `${Math.max(10, 100 - nextMilestone.daysAway * 3)}%` : '—' }}
        </span>
      </div>
    </div>

  </div>
</template>
