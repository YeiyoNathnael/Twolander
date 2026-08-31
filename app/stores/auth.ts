import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { user, loggedIn, clear, fetch: fetchUserSession } = useUserSession()

  const hasCouple = computed(() => !!user.value?.coupleId)

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/login')
  }

  return {
    user,
    loggedIn,
    hasCouple,
    fetchUserSession,
    logout,
  }
})
