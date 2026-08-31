<script setup lang="ts">
import { PhHeart, PhWarningCircle, PhClock, PhX } from '@phosphor-icons/vue'
import type { ConflictItem } from '~/stores/sacredTimes'

const props = defineProps<{
  open: boolean
  conflicts: ConflictItem[]
  saving: boolean
}>()

const emit = defineEmits<{
  proceedAnyway: []
  changeTime: []
}>()

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" @click="emit('changeTime')" />

      <!-- Modal Card -->
      <div class="relative z-10 w-full max-w-md bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 font-sans">
        <!-- Icon & Header -->
        <div class="flex items-center gap-3.5 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <PhHeart :size="24" weight="fill" />
          </div>
          <div>
            <h3 class="text-lg sm:text-xl font-bold text-black font-serif italic">
              Schedule Conflict Detected
            </h3>
            <p class="text-xs font-semibold text-gray-500">
              This overlaps with protected couple time.
            </p>
          </div>
        </div>

        <!-- Conflicting Items List -->
        <div class="my-5 flex flex-col gap-2.5">
          <div
            v-for="(c, idx) in conflicts"
            :key="idx"
            class="p-4 rounded-2xl border transition-all"
            :class="c.isSacred ? 'bg-purple-50/70 border-purple-200' : 'bg-rose-50/70 border-rose-200'"
          >
            <div class="flex items-center justify-between">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs"
                :class="c.isSacred ? 'bg-purple-600' : 'bg-rose-600'"
              >
                {{ c.isSacred ? 'Sacred Us Time' : 'Existing Event' }}
              </span>
              <span v-if="c.creatorName" class="text-[11px] font-bold text-gray-500">
                {{ c.creatorName }}
              </span>
            </div>

            <h4 class="text-sm font-bold text-black mt-2">
              {{ c.title }}
            </h4>

            <div class="mt-1 flex items-center gap-1.5 text-xs font-bold text-gray-600 font-mono">
              <PhClock :size="13" />
              <span>{{ formatTime(c.start) }} – {{ formatTime(c.end) }}</span>
            </div>
          </div>
        </div>

        <p class="text-xs text-gray-500 leading-relaxed mb-6">
          You can keep your schedule in harmony by choosing another time, or proceed if this was intentionally agreed upon.
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            @click="emit('changeTime')"
          >
            Choose another time
          </button>

          <button
            type="button"
            :disabled="saving"
            class="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            @click="emit('proceedAnyway')"
          >
            {{ saving ? 'Scheduling...' : 'Schedule anyway' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
