import { eq, and, gte, inArray } from 'drizzle-orm'
import { events, moods, milestones, sacredTimes, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const db = useDb()
  const coupleId = session.user.coupleId

  // 1. Fetch couple members
  const coupleUsers = await db.query.users.findMany({
    where: eq(users.coupleId, coupleId),
    columns: { id: true, name: true },
  })
  const userIds = coupleUsers.map((u) => u.id)

  // 2. Fetch all events for the current month using Date objects
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthEvents = await db.query.events.findMany({
    where: and(
      eq(events.coupleId, coupleId),
      gte(events.start, startOfMonth),
    ),
  })

  // Calculate total minutes together and sacred hours
  let totalMinutes = 0
  let sacredMinutes = 0
  let datesCount = 0

  for (const ev of monthEvents) {
    const startMs = new Date(ev.start).getTime()
    const endMs = new Date(ev.end).getTime()
    const diffMins = Math.max(0, Math.round((endMs - startMs) / (1000 * 60)))

    // If sacred or shared (not private), count as time together
    if (ev.isSacred) {
      sacredMinutes += diffMins
      datesCount++
    }
    if (!ev.isPrivate || ev.isSacred) {
      totalMinutes += diffMins
    }

    const titleLower = ev.title.toLowerCase()
    if (!ev.isSacred && (titleLower.includes('dinner') || titleLower.includes('date') || titleLower.includes('night') || titleLower.includes('trip'))) {
      datesCount++
    }
  }

  // 3. Fetch moods for the couple in the past 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  let harmonyScore = 95 // default base

  if (userIds.length > 0) {
    const recentMoods = await db.query.moods.findMany({
      where: and(
        inArray(moods.userId, userIds),
        gte(moods.date, thirtyDaysAgo),
      ),
    })

    if (recentMoods.length > 0) {
      const positiveCount = recentMoods.filter((m) => ['calm', 'happy', 'excited'].includes(m.mood)).length
      harmonyScore = Math.max(50, Math.round((positiveCount / recentMoods.length) * 100))
    }
  }

  // 4. Fetch closest upcoming milestone
  const allMilestones = await db.query.milestones.findMany({
    where: eq(milestones.coupleId, coupleId),
  })

  let nextMilestone = null
  let minDaysDiff = Infinity

  for (const m of allMilestones) {
    const target = new Date(m.date)
    let diffDays = 0

    if (m.recurring) {
      const thisYearTarget = new Date(now.getFullYear(), target.getMonth(), target.getDate())
      if (thisYearTarget < now) {
        thisYearTarget.setFullYear(now.getFullYear() + 1)
      }
      diffDays = Math.ceil((thisYearTarget.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    if (diffDays >= 0 && diffDays < minDaysDiff) {
      minDaysDiff = diffDays
      nextMilestone = {
        id: m.id,
        title: m.title,
        date: m.date,
        daysAway: diffDays,
      }
    }
  }

  // 5. Generate wave heights based on real activity per day of week
  const dayMinutes = [0, 0, 0, 0, 0, 0, 0] // Sun=0, Mon=1...
  for (const ev of monthEvents) {
    const day = new Date(ev.start).getDay()
    const diff = Math.max(0, (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / (1000 * 60))
    dayMinutes[day] += diff
  }

  // Interpolate 35 wave bars (5 per day of week Mon-Sun)
  const daysOrder = [1, 2, 3, 4, 5, 6, 0] // Mon to Sun
  const maxDayMins = Math.max(...dayMinutes, 120)

  const waveHeights: number[] = []
  for (let d = 0; d < 7; d++) {
    const dayIdx = daysOrder[d]
    const baseVal = Math.max(25, Math.min(95, Math.round((dayMinutes[dayIdx] / maxDayMins) * 90) + 20))
    // 5 bars per day with smooth natural curve
    waveHeights.push(Math.max(20, baseVal - 10))
    waveHeights.push(Math.max(25, baseVal - 5))
    waveHeights.push(baseVal)
    waveHeights.push(Math.max(25, baseVal - 4))
    waveHeights.push(Math.max(20, baseVal - 8))
  }

  return {
    totalMinutes: totalMinutes || 120, // default if no events yet
    sacredHours: Math.round(sacredMinutes / 60) || (monthEvents.some(e => e.isSacred) ? 2 : 0),
    datesCount,
    harmonyScore,
    nextMilestone,
    waveHeights,
  }
})
