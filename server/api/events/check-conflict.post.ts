import { and, eq, ne, lt, gt } from 'drizzle-orm'
import { events, sacredTimes } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const body = await readBody(event)
  const { start, end, excludeId } = body as { start: string; end: string; excludeId?: string }

  if (!start || !end) {
    throw createError({ statusCode: 400, message: 'start and end times are required' })
  }

  const db = useDb()

  const startDate = new Date(start)
  const endDate = new Date(end)

  // 1. Check overlapping events in the calendar for this couple
  const conditions = [
    eq(events.coupleId, session.user.coupleId),
    lt(events.start, endDate),
    gt(events.end, startDate),
  ]
  if (excludeId) {
    conditions.push(ne(events.id, excludeId))
  }

  const overlappingEvents = await db.query.events.findMany({
    where: and(...conditions),
    with: {
      creator: {
        columns: { id: true, name: true, color: true },
      },
    },
  })

  const conflicts: Array<{
    type: 'sacred' | 'event'
    title: string
    start: string
    end: string
    isSacred: boolean
    creatorName?: string
  }> = []

  for (const ev of overlappingEvents) {
    const isPartner = ev.creatorId !== session.user.id
    const title = isPartner && ev.isPrivate ? 'Busy (Partner)' : ev.title
    conflicts.push({
      type: ev.isSacred ? 'sacred' : 'event',
      title,
      start: typeof ev.start === 'object' ? (ev.start as Date).toISOString() : String(ev.start),
      end: typeof ev.end === 'object' ? (ev.end as Date).toISOString() : String(ev.end),
      isSacred: ev.isSacred,
      creatorName: ev.creator?.name,
    })
  }

  // 2. Check overlapping Sacred Time rules
  const allSacredRules = await db.query.sacredTimes.findMany({
    where: eq(sacredTimes.coupleId, session.user.coupleId),
  })

  const startMs = startDate.getTime()
  const endMs = endDate.getTime()
  const eventDateStr = start.slice(0, 10)
  const eventDayOfWeek = startDate.getUTCDay()

  for (const rule of allSacredRules) {
    let matches = false
    if (rule.date && rule.date === eventDateStr) {
      matches = true
    } else if (rule.dayOfWeek !== null && rule.dayOfWeek !== undefined && rule.dayOfWeek === eventDayOfWeek) {
      matches = true
    }

    if (matches) {
      // Build ISO for rule on this event's date
      const ruleStartIso = `${eventDateStr}T${rule.startTime}:00.000Z`
      const ruleEndIso = `${eventDateStr}T${rule.endTime}:00.000Z`
      const ruleStartMs = new Date(ruleStartIso).getTime()
      const ruleEndMs = new Date(ruleEndIso).getTime()

      if (startMs < ruleEndMs && endMs > ruleStartMs) {
        conflicts.push({
          type: 'sacred',
          title: `Sacred Us Time: ${rule.title}`,
          start: ruleStartIso,
          end: ruleEndIso,
          isSacred: true,
          creatorName: 'Couple Rule',
        })
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  }
})
