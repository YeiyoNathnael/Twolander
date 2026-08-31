import { and, eq, gte, lte, asc } from 'drizzle-orm'
import { events, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const query = getQuery(event)
  const from = new Date(query.from as string)
  const to = new Date(query.to as string)

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw createError({ statusCode: 400, message: 'Invalid date range' })
  }

  const db = useDb()

  const results = await db.query.events.findMany({
    where: and(
      eq(events.coupleId, session.user.coupleId),
      gte(events.start, from),
      lte(events.start, to),
    ),
    with: {
      creator: {
        columns: { id: true, name: true, color: true, avatar: true },
      },
    },
    orderBy: [asc(events.start)],
  })

  // Mask private events that belong to the partner
  return results.map((e) => {
    if (e.isPrivate && e.creatorId !== session.user.id) {
      return { ...e, title: 'Busy', description: null }
    }
    return e
  })
})
