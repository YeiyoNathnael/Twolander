import { eq } from 'drizzle-orm'
import { events, users } from '../../db/schema'
import { createEventSchema } from '../../../shared/schemas/event.schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const body = await readBody(event)
  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.message })
  }

  const db = useDb()

  const [created] = await db
    .insert(events)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      start: new Date(parsed.data.start),
      end: new Date(parsed.data.end),
      allDay: parsed.data.allDay,
      isPrivate: parsed.data.isPrivate,
      isSacred: parsed.data.isSacred,
      coupleId: session.user.coupleId,
      creatorId: session.user.id,
    })
    .returning()

  const creator = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, name: true, color: true, avatar: true },
  })

  const payload = { ...created, creator }

  // Broadcast to partner in real-time
  sseBusPublish(session.user.coupleId, 'event:created', payload)

  return payload
})
