// ─── Domain types ─────────────────────────────────────────────────────────────

export type MoodType = 'calm' | 'happy' | 'tired' | 'excited' | 'stressed'
export type UserColor = 'coral' | 'teal'

// ─── Session ──────────────────────────────────────────────────────────────────

export interface UserSession {
  id: string
  email: string
  name: string
  avatar?: string | null
  coupleId?: string | null
  color: UserColor
  googleCalendarConnected?: boolean
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface EventCreator {
  id: string
  name: string
  color: UserColor
  avatar?: string | null
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  start: string         // ISO string
  end: string
  allDay: boolean
  isPrivate: boolean
  isSacred: boolean
  coupleId: string
  creatorId: string
  googleEventId?: string | null
  createdAt: string
  creator: EventCreator
}

export interface DayMood {
  id: string
  userId: string
  date: string   // YYYY-MM-DD
  mood: MoodType
  note?: string | null
  user?: EventCreator
}

export interface MilestoneItem {
  id: string
  coupleId: string
  title: string
  date: string
  recurring: boolean
}

export interface SacredTimeItem {
  id: string
  coupleId: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek?: number | null
  date?: string | null
}

// ─── SSE ──────────────────────────────────────────────────────────────────────

export type SSEEventType =
  | 'event:created'
  | 'event:updated'
  | 'event:deleted'
  | 'mood:updated'
  | 'milestone:created'
  | 'milestone:deleted'
  | 'sacred:created'
  | 'sacred:deleted'

export interface SSEMessage<T = unknown> {
  type: SSEEventType
  payload: T
  timestamp: number
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

export type CalendarViewMode = 'month' | 'week'
