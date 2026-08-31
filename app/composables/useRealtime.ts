import type { SSEMessage } from '~/shared/types'

export function useRealtime() {
  const auth = useAuthStore()
  const eventsStore = useEventsStore()
  const moodsStore = useMoodsStore()
  const sacredTimesStore = useSacredTimesStore()

  const isConnected = ref(false)
  let eventSource: EventSource | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

  function connect() {
    if (import.meta.server) return
    if (!auth.loggedIn || !auth.user?.coupleId) return
    if (eventSource) return

    try {
      eventSource = new EventSource('/api/sse')

      eventSource.onopen = () => {
        isConnected.value = true
      }

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data)
          // Dispatch to stores
          eventsStore.handleSseMessage(data)
          moodsStore.handleSseMessage(data)
          sacredTimesStore.handleSseMessage(data)
        } catch (err) {
          console.error('[SSE] Failed to parse message', err)
        }
      }

      eventSource.onerror = () => {
        isConnected.value = false
        disconnect()
        // Try reconnecting after 3 seconds
        reconnectTimeout = setTimeout(() => {
          connect()
        }, 3000)
      }
    } catch (err) {
      console.error('[SSE] Failed to initialize EventSource', err)
    }
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    isConnected.value = false
  }

  // Watch session state to connect/disconnect automatically
  watch(
    () => [auth.loggedIn, auth.user?.coupleId],
    ([loggedIn, coupleId]) => {
      if (loggedIn && coupleId) {
        connect()
      } else {
        disconnect()
      }
    },
    { immediate: true },
  )

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    connect,
    disconnect,
  }
}
