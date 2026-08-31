import { eq, and, isNotNull } from 'drizzle-orm'
import { events, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDb()

  // 1. Remove refresh token from user record
  await db
    .update(users)
    .set({
      googleRefreshToken: null,
    })
    .where(eq(users.id, session.user.id))

  // 2. Remove all imported Google events for this user
  await db
    .delete(events)
    .where(and(eq(events.creatorId, session.user.id), isNotNull(events.googleEventId)))

  // 3. Update session
  await setUserSession(event, {
    user: {
      ...session.user,
      googleCalendarConnected: false,
    },
  })

  return { success: true }
})
