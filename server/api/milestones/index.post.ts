import { z } from 'zod'
import { milestones } from '../../db/schema'

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  date: z.string().datetime(),
  recurring: z.boolean().default(false),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const body = await readBody(event)
  const parsed = milestoneSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message })
  }

  const db = useDb()

  const [created] = await db
    .insert(milestones)
    .values({
      title: parsed.data.title.trim(),
      date: new Date(parsed.data.date),
      recurring: parsed.data.recurring,
      coupleId: session.user.coupleId,
    })
    .returning()

  sseBusPublish(session.user.coupleId, 'milestone:created', created)

  return created
})
