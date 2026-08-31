import { eq } from 'drizzle-orm'
import { events } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')!

  const db = useDb()

  const existing = await db.query.events.findFirst({ where: eq(events.id, id) })
  if (!existing || existing.coupleId !== session.user.coupleId) {
    throw createError({ statusCode: 404 })
  }
  if (existing.creatorId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Cannot delete your partner\'s event' })
  }

  await db.delete(events).where(eq(events.id, id))

  // Broadcast to partner in real-time
  sseBusPublish(session.user.coupleId, 'event:deleted', { id })

  return { ok: true }
})
