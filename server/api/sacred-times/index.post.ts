import { sacredTimes } from '../../db/schema'
import { sacredTimeSchema } from '../../../shared/schemas/sacred-time.schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const body = await readBody(event)
  const parsed = sacredTimeSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid sacred time data' })
  }

  const { title, startTime, endTime, dayOfWeek, date } = parsed.data
  const db = useDb()

  const [created] = await db
    .insert(sacredTimes)
    .values({
      coupleId: session.user.coupleId,
      title,
      startTime,
      endTime,
      dayOfWeek: dayOfWeek ?? null,
      date: date ?? null,
    })
    .returning()

  sseBusPublish(session.user.coupleId, 'sacred:created', created)

  return created
})
