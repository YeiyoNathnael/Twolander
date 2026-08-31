import { defineStore } from 'pinia'
import type { DayMood, MoodType, SSEMessage } from '~/shared/types'

export const useMoodsStore = defineStore('moods', () => {
  const moods = ref<DayMood[]>([])
  const loading = ref(false)
  const auth = useAuthStore()
  const { loggedIn } = useUserSession()

  async function fetchForRange(from: string, to: string) {
    if (!loggedIn.value) return
    loading.value = true
    try {
      const data = await $fetch<DayMood[]>('/api/moods', {
        query: { from, to },
      })
      // Merge into local list
      const filtered = moods.value.filter((m) => m.date < from || m.date > to)
      moods.value = [...filtered, ...data]
    } catch (err: any) {
      if (err?.statusCode === 401 || err?.status === 401) return
      console.error('Failed to load moods', err)
    } finally {
      loading.value = false
    }
  }

  async function setMood(date: string, mood: MoodType, note?: string): Promise<DayMood> {
    const saved = await $fetch<DayMood>('/api/moods', {
      method: 'POST',
      body: { date, mood, note },
    })
    const idx = moods.value.findIndex((m) => m.userId === saved.userId && m.date === saved.date)
    if (idx === -1) {
      moods.value.push(saved)
    } else {
      moods.value[idx] = saved
    }
    return saved
  }

  function handleSseMessage(message: SSEMessage) {
    if (message.type === 'mood:updated') {
      const payload = message.payload as DayMood
      const idx = moods.value.findIndex(
        (m) => m.userId === payload.userId && m.date === payload.date,
      )
      if (idx === -1) {
        moods.value.push(payload)
      } else {
        moods.value[idx] = payload
      }
    }
  }

  function getMoodsForDate(dateStr: string): DayMood[] {
    return moods.value.filter((m) => m.date === dateStr)
  }

  function getMyMoodForDate(dateStr: string): DayMood | undefined {
    return moods.value.find((m) => m.date === dateStr && m.userId === auth.user?.id)
  }

  function getPartnerMoodForDate(dateStr: string): DayMood | undefined {
    return moods.value.find((m) => m.date === dateStr && m.userId !== auth.user?.id)
  }

  return {
    moods,
    loading,
    fetchForRange,
    setMood,
    handleSseMessage,
    getMoodsForDate,
    getMyMoodForDate,
    getPartnerMoodForDate,
  }
})
