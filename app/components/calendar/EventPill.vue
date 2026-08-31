<script setup lang="ts">
import type { CalendarEvent } from '~/shared/types'

const props = defineProps<{
  event: CalendarEvent
  currentUserId: string
}>()

const emit = defineEmits<{
  click: [event: CalendarEvent]
}>()

const isOwn = computed(() => props.event.creatorId === props.currentUserId)
const color = computed(() => {
  if (props.event.isSacred) return 'sacred'
  return props.event.creator?.color || 'coral'
})

const displayTitle = computed(() => props.event.title) // already masked server-side if private

const pillClass = computed(() => {
  if (color.value === 'sacred') {
    return 'bg-purple-100 text-purple-900 border-l-3 border-purple-600 font-semibold'
  }
  if (color.value === 'coral') {
    return 'bg-rose-100 text-rose-900 border-l-3 border-rose-600 font-semibold'
  }
  return 'bg-teal-100 text-teal-900 border-l-3 border-teal-600 font-semibold'
})
</script>

<template>
  <button
    class="w-full text-left px-2 py-1 rounded-[4px] text-xs leading-tight truncate
           transition-all hover:shadow-xs active:scale-[0.98] cursor-pointer"
    :class="pillClass"
    @click.stop="emit('click', event)"
  >
    <span v-if="event.allDay" class="text-[10px] font-bold uppercase tracking-wider mr-1 text-slate-700">All day</span>
    <span v-else-if="!isOwn && event.isPrivate" class="italic text-slate-600">Busy</span>
    <span v-else>{{ displayTitle }}</span>
  </button>
</template>
