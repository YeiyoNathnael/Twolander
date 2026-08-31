import { eq } from 'drizzle-orm'
import { events, users } from '../../db/schema'
import { updateEventSchema } from '../../../shared/schemas/event.schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')!

  const db = useDb()

  const existing = await db.query.events.findFirst({ where: eq(events.id, id) })
  if (!existing || existing.coupleId !== session.user.coupleId) {
    throw createError({ statusCode: 404 })
  }
  if (existing.creatorId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Cannot edit your partner\'s event' })
  }

  const body = await readBody(event)
  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.message })

  const updateData: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.start) updateData.start = new Date(parsed.data.start)
  if (parsed.data.end) updateData.end = new Date(parsed.data.end)

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(eq(events.id, id))
    .returning()

  const creator = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, name: true, color: true, avatar: true },
  })

  const payload = { ...updated, creator }

  // Broadcast to partner in real-time
  sseBusPublish(session.user.coupleId, 'event:updated', payload)

  return payload
})
