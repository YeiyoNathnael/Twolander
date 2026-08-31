import { defineStore } from 'pinia'
import type { CalendarEvent, SSEMessage } from '~/shared/types'

export const useEventsStore = defineStore('events', () => {
  const events = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { loggedIn } = useUserSession()

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchForRange(from: Date, to: Date) {
    if (!loggedIn.value) return
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<CalendarEvent[]>('/api/events', {
        query: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      })
      // Merge: replace existing events in this range, keep others
      const fromStr = from.toISOString()
      const toStr = to.toISOString()
      events.value = [
        ...events.value.filter(
          (e) => e.start < fromStr || e.start > toStr,
        ),
        ...data,
      ]
    } catch (e: any) {
      if (e?.statusCode === 401 || e?.status === 401) return
      error.value = 'Failed to load events'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async function createEvent(payload: {
    title: string
    description?: string
    start: string
    end: string
    allDay: boolean
    isPrivate: boolean
    isSacred: boolean
  }): Promise<CalendarEvent> {
    const created = await $fetch<CalendarEvent>('/api/events', {
      method: 'POST',
      body: payload,
    })
    const idx = events.value.findIndex((e) => e.id === created.id)
    if (idx === -1) {
      events.value.push(created)
    } else {
      events.value[idx] = created
    }
    return created
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async function updateEvent(
    id: string,
    payload: Partial<{
      title: string
      description: string
      start: string
      end: string
      allDay: boolean
      isPrivate: boolean
      isSacred: boolean
    }>,
  ): Promise<CalendarEvent> {
    const updated = await $fetch<CalendarEvent>(`/api/events/${id}`, {
      method: 'PATCH',
      body: payload,
    })
    const idx = events.value.findIndex((e) => e.id === id)
    if (idx !== -1) {
      events.value[idx] = updated
    } else {
      events.value[idx] = updated
    }
    return updated
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function deleteEvent(id: string) {
    const removed = events.value.find((e) => e.id === id)
    events.value = events.value.filter((e) => e.id !== id)
    try {
      await $fetch(`/api/events/${id}`, { method: 'DELETE' })
    } catch (e) {
      if (removed) events.value.push(removed)
      throw e
    }
  }

  // ── Real-time SSE Handler ──────────────────────────────────────────────────

  function handleSseMessage(message: SSEMessage) {
    if (message.type === 'event:created') {
      const ev = message.payload as CalendarEvent
      const idx = events.value.findIndex((e) => e.id === ev.id)
      if (idx === -1) {
        events.value.push(ev)
      } else {
        events.value[idx] = ev
      }
    } else if (message.type === 'event:updated') {
      const ev = message.payload as CalendarEvent
      const idx = events.value.findIndex((e) => e.id === ev.id)
      if (idx !== -1) {
        events.value[idx] = ev
      } else {
        events.value[idx] = ev
      }
    } else if (message.type === 'event:deleted') {
      const { id } = message.payload as { id: string }
      events.value = events.value.filter((e) => e.id !== id)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toLocalDateKey(isoOrDate: string | Date): string {
    const d = new Date(isoOrDate)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function getEventsForDay(dateKey: string): CalendarEvent[] {
    return events.value
      .filter((e) => {
        if (e.allDay) {
          return e.start.slice(0, 10) === dateKey
        }
        return toLocalDateKey(e.start) === dateKey
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  return {
    events,
    loading,
    error,
    fetchForRange,
    createEvent,
    updateEvent,
    deleteEvent,
    handleSseMessage,
    getEventsForDay,
    toLocalDateKey,
  }
})
