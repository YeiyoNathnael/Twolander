import { eq, and } from 'drizzle-orm'
import { moods, users } from '../../db/schema'
import { moodSchema } from '../../../shared/schemas/mood.schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const body = await readBody(event)
  const parsed = moodSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid mood data' })
  }

  const { date, mood, note } = parsed.data
  const db = useDb()

  // Check if mood for this user & date already exists
  const existing = await db.query.moods.findFirst({
    where: and(eq(moods.userId, session.user.id), eq(moods.date, date)),
  })

  let savedMood: typeof moods.$inferSelect

  if (existing) {
    const [updated] = await db
      .update(moods)
      .set({
        mood,
        note: note ?? null,
      })
      .where(eq(moods.id, existing.id))
      .returning()
    savedMood = updated
  } else {
    const [created] = await db
      .insert(moods)
      .values({
        userId: session.user.id,
        date,
        mood,
        note: note ?? null,
      })
      .returning()
    savedMood = created
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, name: true, color: true, avatar: true },
  })

  const payload = { ...savedMood, user }

  // Broadcast real-time mood update to partner
  sseBusPublish(session.user.coupleId, 'mood:updated', payload)

  return payload
})
