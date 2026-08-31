import { defineStore } from 'pinia'

export interface DashboardStats {
  totalMinutes: number
  sacredHours: number
  datesCount: number
  harmonyScore: number
  nextMilestone: {
    id: string
    title: string
    date: string
    daysAway: number
  } | null
  waveHeights: number[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats>({
    totalMinutes: 120,
    sacredHours: 0,
    datesCount: 0,
    harmonyScore: 95,
    nextMilestone: null,
    waveHeights: [30, 35, 45, 55, 48, 40, 35, 38, 45, 60, 75, 85, 78, 65, 50, 42, 48, 62, 80, 92, 88, 70, 52, 40, 48, 65, 82, 95, 90, 75, 60, 50, 45, 40, 35],
  })
  const loading = ref(false)
  const { loggedIn } = useUserSession()

  async function fetchStats() {
    if (!loggedIn.value) return
    loading.value = true
    try {
      const data = await $fetch<DashboardStats>('/api/dashboard/stats')
      stats.value = data
    } catch (err: any) {
      if (err?.statusCode === 401 || err?.status === 401) return
      console.error('Failed to fetch dashboard stats', err)
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    loading,
    fetchStats,
  }
})
