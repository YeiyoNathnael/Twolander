export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user.coupleId) throw createError({ statusCode: 403, message: 'No couple found' })

  const body = await readBody(event)
  const { prompt, referenceDate, timezoneOffset } = body as {
    prompt: string
    referenceDate?: string
    timezoneOffset?: number // minutes from UTC
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw createError({ statusCode: 400, message: 'Prompt is required' })
  }

  const now = referenceDate ? new Date(referenceDate) : new Date()
  const nowIso = now.toISOString()
  const todayStr = nowIso.slice(0, 10)

  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY

  if (apiKey) {
    try {
      const systemInstruction = `You are a calendar assistant for Twolander, a modern calendar app for couples.
Current reference date & time is: ${nowIso} (today is ${now.toLocaleDateString('en-US', { weekday: 'long' })}).
Parse the user's natural language request into a single event JSON object matching this schema:
{
  "title": string,
  "description": string | null,
  "date": string (YYYY-MM-DD),
  "startTime": string (HH:MM in 24h format e.g. "19:30") or null if allDay,
  "endTime": string (HH:MM in 24h format e.g. "21:00") or null if allDay,
  "allDay": boolean,
  "isPrivate": boolean,
  "isSacred": boolean
}
Rules:
- If the text implies couple time, date night, dinner, romantic outing, intimacy, or us-time, set isSacred to true.
- If the text mentions "private", "busy", or "solo", set isPrivate to true.
- If the user specifies a day of week like "this Friday" or "tomorrow", compute the exact YYYY-MM-DD relative to ${todayStr}.
- If start time is given without duration, default duration to 90 minutes.
- If no time is given and it's a date or trip, default to allDay: true or 19:00 start.
- Return ONLY the JSON object, without markdown triple-backticks.`

      const response = await $fetch<any>(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          body: {
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemInstruction },
                  { text: `User request: "${prompt.trim()}"` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          },
        },
      )

      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleaned)

        const eventDate = parsed.date || todayStr
        const startTime = parsed.startTime || '19:00'
        const endTime = parsed.endTime || '20:30'
        const allDay = !!parsed.allDay

        const start = allDay
          ? `${eventDate}T00:00:00.000Z`
          : `${eventDate}T${startTime}:00.000Z`

        const end = allDay
          ? `${eventDate}T23:59:59.000Z`
          : `${eventDate}T${endTime}:00.000Z`

        return {
          success: true,
          event: {
            title: parsed.title || 'Special Plan',
            description: parsed.description || null,
            date: eventDate,
            startTime: allDay ? '00:00' : startTime,
            endTime: allDay ? '23:59' : endTime,
            start,
            end,
            allDay,
            isPrivate: !!parsed.isPrivate,
            isSacred: parsed.isSacred !== undefined ? !!parsed.isSacred : true,
          },
        }
      }
    } catch (err) {
      console.warn('[AI Parser] Gemini API failed, using heuristic fallback:', err)
    }
  }

  // Heuristic Fallback Parser
  const lower = prompt.toLowerCase()
  let targetDate = new Date(now)
  let isAllDay = false
  let isSacred = true
  let isPrivate = false
  let startTime = '19:00'
  let endTime = '20:30'

  if (lower.includes('tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 1)
  } else if (lower.includes('friday')) {
    const day = targetDate.getDay()
    const diff = (5 - day + 7) % 7 || 7
    targetDate.setDate(targetDate.getDate() + diff)
  } else if (lower.includes('saturday')) {
    const day = targetDate.getDay()
    const diff = (6 - day + 7) % 7 || 7
    targetDate.setDate(targetDate.getDate() + diff)
  } else if (lower.includes('sunday')) {
    const day = targetDate.getDay()
    const diff = (7 - day + 7) % 7 || 7
    targetDate.setDate(targetDate.getDate() + diff)
  }

  // Check time pattern (e.g. 7pm, 8:30pm, at 8)
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (timeMatch && (lower.includes('at ') || lower.includes('from ') || timeMatch[3])) {
    let hour = parseInt(timeMatch[1], 10)
    const min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : ''
    if (meridian === 'pm' && hour < 12) hour += 12
    if (meridian === 'am' && hour === 12) hour = 0
    const pad = (n: number) => String(n).padStart(2, '0')
    startTime = `${pad(hour)}:${pad(min)}`
    const endHour = (hour + 1) % 24
    endTime = `${pad(endHour)}:${pad(min + 30 >= 60 ? (min + 30) % 60 : min + 30)}`
  }

  if (lower.includes('all day') || lower.includes('all-day')) {
    isAllDay = true
  }
  if (lower.includes('private') || lower.includes('busy')) {
    isPrivate = true
    isSacred = false
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`

  // Clean title
  let title = prompt
    .replace(/(tomorrow|today|this friday|next saturday|at \d+(:\d+)?\s*(am|pm)?|from \d+ to \d+)/gi, '')
    .replace(/(mark as date night|sacred|private|please)/gi, '')
    .trim()
  if (!title) title = 'Planned Date'

  return {
    success: true,
    event: {
      title,
      description: null,
      date: dateStr,
      startTime,
      endTime,
      start: isAllDay ? `${dateStr}T00:00:00.000Z` : `${dateStr}T${startTime}:00.000Z`,
      end: isAllDay ? `${dateStr}T23:59:59.000Z` : `${dateStr}T${endTime}:00.000Z`,
      allDay: isAllDay,
      isPrivate,
      isSacred,
    },
  }
})
