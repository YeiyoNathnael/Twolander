import { eq } from 'drizzle-orm'
import { milestones } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')!

  const db = useDb()

  const existing = await db.query.milestones.findFirst({ where: eq(milestones.id, id) })
  if (!existing || existing.coupleId !== session.user.coupleId) {
    throw createError({ statusCode: 404 })
  }

  await db.delete(milestones).where(eq(milestones.id, id))

  sseBusPublish(session.user.coupleId, 'milestone:deleted', { id })

  return { ok: true }
})
