import { eq } from 'drizzle-orm'
import { sacredTimes } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const db = useDb()
  const list = await db.query.sacredTimes.findMany({
    where: eq(sacredTimes.coupleId, session.user.coupleId),
  })

  return list
})
