/**
 * In-memory pub/sub bus for Server-Sent Events.
 *
 * Each couple gets its own channel. When any mutation happens
 * (event created, mood updated, etc.) the server calls `sseBusPublish`
 * and all connected SSE clients for that couple receive the update instantly.
 *
 * This works perfectly for a two-person app on a single Nitro process.
 * For multi-instance deployments, swap this for Redis pub/sub.
 */

type Subscriber = (data: string) => void

const bus = new Map<string, Set<Subscriber>>()

/**
 * Subscribe to SSE updates for a given couple.
 * Returns an unsubscribe function — call it on connection close.
 */
export function sseBusSubscribe(coupleId: string, cb: Subscriber): () => void {
  if (!bus.has(coupleId)) {
    bus.set(coupleId, new Set())
  }
  bus.get(coupleId)!.add(cb)

  return () => {
    const subs = bus.get(coupleId)
    if (subs) {
      subs.delete(cb)
      if (subs.size === 0) bus.delete(coupleId)
    }
  }
}

/**
 * Publish an event to all SSE subscribers for a given couple.
 */
export function sseBusPublish(
  coupleId: string,
  type: string,
  payload: unknown,
): void {
  const subs = bus.get(coupleId)
  if (!subs || subs.size === 0) return

  const data = JSON.stringify({ type, payload, timestamp: Date.now() })
  for (const cb of subs) {
    cb(data)
  }
}
