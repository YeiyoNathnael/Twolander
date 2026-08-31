import { defineStore } from 'pinia'
import type { SacredTimeItem, SSEMessage } from '~/shared/types'
import type { SacredTimeInput } from '~/shared/schemas/sacred-time.schema'

export interface ConflictItem {
  type: 'sacred' | 'event'
  title: string
  start: string
  end: string
  isSacred: boolean
  creatorName?: string
}

export const useSacredTimesStore = defineStore('sacredTimes', () => {
  const sacredTimes = ref<SacredTimeItem[]>([])
  const loading = ref(false)
  const eventsStore = useEventsStore()
  const auth = useAuthStore()
  const { loggedIn } = useUserSession()

  async function fetchSacredTimes() {
    if (!loggedIn.value) return
    loading.value = true
    try {
      const data = await $fetch<SacredTimeItem[]>('/api/sacred-times')
      sacredTimes.value = data
    } catch (err: any) {
      if (err?.statusCode === 401 || err?.status === 401) return
      console.error('Failed to load sacred times', err)
    } finally {
      loading.value = false
    }
  }

  async function createSacredTime(data: SacredTimeInput): Promise<SacredTimeItem> {
    const created = await $fetch<SacredTimeItem>('/api/sacred-times', {
      method: 'POST',
      body: data,
    })
    sacredTimes.value.push(created)
    return created
  }

  async function deleteSacredTime(id: string) {
    const previous = [...sacredTimes.value]
    sacredTimes.value = sacredTimes.value.filter((s) => s.id !== id)
    try {
      await $fetch(`/api/sacred-times/${id}`, { method: 'DELETE' })
    } catch (e) {
      sacredTimes.value = previous
      throw e
    }
  }

  /**
   * Dual-layer conflict check:
   * Only triggers when booking over protected "Sacred Us Time" blocks.
   * Individual / separate events can coexist freely without interference.
   */
  async function checkConflict(
    startIso: string,
    endIso: string,
    excludeId?: string,
  ): Promise<{ hasConflict: boolean; conflicts: ConflictItem[] }> {
    const conflicts: ConflictItem[] = []

    const startMs = new Date(startIso).getTime()
    const endMs = new Date(endIso).getTime()

    // 1. In-memory check against protected Sacred Us Time events
    for (const ev of eventsStore.events) {
      if (excludeId && ev.id === excludeId) continue
      if (!ev.isSacred) continue // Independent individual events coexist freely

      const evStartMs = new Date(ev.start).getTime()
      const evEndMs = new Date(ev.end).getTime()

      if (startMs < evEndMs && endMs > evStartMs) {
        const isPartner = ev.creatorId !== auth.user?.id
        const title = isPartner && ev.isPrivate ? 'Busy (Partner)' : ev.title
        conflicts.push({
          type: 'sacred',
          title,
          start: ev.start,
          end: ev.end,
          isSacred: true,
          creatorName: ev.creator?.name,
        })
      }
    }

    // 2. Server check against persisted Sacred Time rules
    try {
      const serverCheck = await $fetch<{ hasConflict: boolean; conflicts: ConflictItem[] }>(
        '/api/events/check-conflict',
        {
          method: 'POST',
          body: { start: startIso, end: endIso, excludeId },
        },
      )
      if (serverCheck.hasConflict) {
        // Merge without duplicates
        for (const c of serverCheck.conflicts) {
          if (!conflicts.some(item => item.title === c.title && item.start === c.start)) {
            conflicts.push(c)
          }
        }
      }
    } catch (err: any) {
      if (err?.statusCode === 401 || err?.status === 401) {
        return { hasConflict: false, conflicts: [] }
      }
      console.warn('Server conflict check failed, relying on client check', err)
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    }
  }

  function handleSseMessage(message: SSEMessage) {
    if (message.type === 'sacred:created') {
      const item = message.payload as SacredTimeItem
      if (!sacredTimes.value.some(s => s.id === item.id)) {
        sacredTimes.value.push(item)
      }
    } else if (message.type === 'sacred:deleted') {
      const { id } = message.payload as { id: string }
      sacredTimes.value = sacredTimes.value.filter(s => s.id !== id)
    }
  }

  return {
    sacredTimes,
    loading,
    fetchSacredTimes,
    createSacredTime,
    deleteSacredTime,
    checkConflict,
    handleSseMessage,
  }
})
