import { eq, asc } from 'drizzle-orm'
import { milestones } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const db = useDb()

  const list = await db.query.milestones.findMany({
    where: eq(milestones.coupleId, session.user.coupleId),
    orderBy: [asc(milestones.date)],
  })

  return list
})
