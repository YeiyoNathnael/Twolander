import { eq, and } from 'drizzle-orm'
import { events, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const db = useDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user || !user.googleRefreshToken) {
    throw createError({
      statusCode: 400,
      message: 'Google Calendar is not connected. Please connect via Settings.',
    })
  }

  let accessToken = user.googleRefreshToken

  // If googleRefreshToken is a refresh token (starts with '1//'), get a fresh access token
  const clientId = process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID
  const clientSecret = process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET

  if (clientId && clientSecret && user.googleRefreshToken.startsWith('1//')) {
    try {
      const tokenRes = await $fetch<{ access_token: string }>('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: user.googleRefreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      })
      if (tokenRes.access_token) {
        accessToken = tokenRes.access_token
      }
    } catch (err) {
      console.warn('[Google Sync] Could not refresh access token with refresh_token, using raw token:', err)
    }
  }

  // Window: 30 days past to 90 days future
  const now = new Date()
  const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()

  let googleEvents: any[] = []
  let pageToken: string | undefined = undefined

  try {
    // Paginate through Google Calendar API with singleEvents=true to expand all recurring instances
    do {
      const res: { items?: any[]; nextPageToken?: string } = await $fetch<{ items?: any[]; nextPageToken?: string }>(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          query: {
            timeMin,
            timeMax,
            singleEvents: 'true', // Expands recurring events into individual concrete instances
            orderBy: 'startTime',
            maxResults: 250,
            pageToken,
          },
        },
      )
      if (res.items) {
        googleEvents.push(...res.items)
      }
      pageToken = res.nextPageToken
    } while (pageToken && googleEvents.length < 1000)
  } catch (err: unknown) {
    console.error('[Google Sync Error]', err)
    throw createError({
      statusCode: 502,
      message: 'Failed to fetch events from Google Calendar. Token may be expired. Try reconnecting.',
    })
  }

  let importedCount = 0

  for (const item of googleEvents) {
    if (!item.id) continue

    // Handle cancelled / deleted instances in Google Calendar
    if (item.status === 'cancelled') {
      await db
        .delete(events)
        .where(
          and(
            eq(events.googleEventId, item.id),
            eq(events.coupleId, session.user.coupleId),
          ),
        )
      continue
    }

    const isAllDay = !!item.start?.date
    let startIso: string
    let endIso: string

    if (isAllDay) {
      startIso = `${item.start.date}T00:00:00.000Z`
      endIso = `${item.end?.date || item.start.date}T23:59:59.000Z`
    } else {
      // Parse timezone-aware Google ISO strings (e.g. 2026-08-31T09:00:00+04:00) into standardized UTC
      startIso = new Date(item.start.dateTime || item.start.date).toISOString()
      endIso = new Date(item.end?.dateTime || item.end?.date || startIso).toISOString()
    }

    const title = item.summary || 'Google Calendar Event'
    const description = item.description || null

    // Check if event with this googleEventId already exists in couple calendar
    const existing = await db.query.events.findFirst({
      where: and(
        eq(events.googleEventId, item.id),
        eq(events.coupleId, session.user.coupleId),
      ),
    })

    if (existing) {
      await db
        .update(events)
        .set({
          title,
          description,
          start: new Date(startIso),
          end: new Date(endIso),
          allDay: isAllDay,
        })
        .where(eq(events.id, existing.id))
    } else {
      await db.insert(events).values({
        title,
        description,
        start: new Date(startIso),
        end: new Date(endIso),
        allDay: isAllDay,
        isPrivate: true, // Default to private for partner view
        isSacred: false,
        googleEventId: item.id,
        coupleId: session.user.coupleId,
        creatorId: session.user.id,
      })
      importedCount++
    }
  }

  return {
    success: true,
    count: importedCount,
    totalFound: googleEvents.length,
  }
})
