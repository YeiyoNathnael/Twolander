import { and, eq, gte, lte, inArray } from 'drizzle-orm'
import { moods, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const query = getQuery(event)
  const from = query.from as string
  const to = query.to as string

  if (!from || !to) {
    throw createError({ statusCode: 400, message: 'from and to date query parameters are required' })
  }

  const db = useDb()

  // Get all users in this couple
  const coupleUsers = await db.query.users.findMany({
    where: eq(users.coupleId, session.user.coupleId),
    columns: { id: true, name: true, color: true, avatar: true },
  })

  const userIds = coupleUsers.map((u) => u.id)
  if (userIds.length === 0) return []

  const list = await db.query.moods.findMany({
    where: and(
      inArray(moods.userId, userIds),
      gte(moods.date, from),
      lte(moods.date, to),
    ),
    with: {
      user: {
        columns: { id: true, name: true, color: true, avatar: true },
      },
    },
  })

  return list
})
