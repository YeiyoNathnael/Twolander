import { eq, and, isNotNull } from 'drizzle-orm'
import { events, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDb()

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  const isConnected = !!user?.googleRefreshToken

  let syncedEventsCount = 0
  if (isConnected && session.user.coupleId) {
    const synced = await db.query.events.findMany({
      where: and(
        eq(events.creatorId, session.user.id),
        isNotNull(events.googleEventId),
      ),
      columns: { id: true },
    })
    syncedEventsCount = synced.length
  }

  return {
    connected: isConnected,
    syncedEventsCount,
  }
})
