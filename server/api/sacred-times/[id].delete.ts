import { eq, and } from 'drizzle-orm'
import { sacredTimes } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

  const db = useDb()
  const [deleted] = await db
    .delete(sacredTimes)
    .where(and(eq(sacredTimes.id, id), eq(sacredTimes.coupleId, session.user.coupleId)))
    .returning()

  if (!deleted) throw createError({ statusCode: 404, message: 'Sacred time block not found' })

  sseBusPublish(session.user.coupleId, 'sacred:deleted', { id })

  return { success: true }
})
