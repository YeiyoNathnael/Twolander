import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pk = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}

// ─── Tables ──────────────────────────────────────────────────────────────────

export const couples = sqliteTable('couples', {
  ...timestamps,
  id: pk(),
  inviteCode: text('invite_code')
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
})

export const users = sqliteTable('users', {
  ...timestamps,
  id: pk(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  avatar: text('avatar'),
  googleId: text('google_id').unique(),
  // Encrypted refresh token used for optional Google Calendar sync
  googleRefreshToken: text('google_refresh_token'),
  coupleId: text('couple_id').references(() => couples.id, { onDelete: 'set null' }),
  // Which color represents this user on the shared calendar
  color: text('color', { enum: ['coral', 'teal'] }).notNull().default('coral'),
})

export const events = sqliteTable('events', {
  ...timestamps,
  id: pk(),
  title: text('title').notNull(),
  description: text('description'),
  start: integer('start', { mode: 'timestamp' }).notNull(),
  end: integer('end', { mode: 'timestamp' }).notNull(),
  allDay: integer('all_day', { mode: 'boolean' }).notNull().default(false),
  // isPrivate: true → partner sees "Busy" instead of the event title
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  // isSacred: true → this event is "us time"; conflicts trigger a warning
  isSacred: integer('is_sacred', { mode: 'boolean' }).notNull().default(false),
  // Populated when event was imported from Google Calendar
  googleEventId: text('google_event_id'),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  creatorId: text('creator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const moods = sqliteTable(
  'moods',
  {
    ...timestamps,
    id: pk(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // YYYY-MM-DD
    mood: text('mood', {
      enum: ['calm', 'happy', 'tired', 'excited', 'stressed'],
    }).notNull(),
    note: text('note'),
  },
  (t) => [uniqueIndex('mood_user_date').on(t.userId, t.date)],
)

export const milestones = sqliteTable('milestones', {
  ...timestamps,
  id: pk(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  // If true, milestone repeats every year on the same month/day
  recurring: integer('recurring', { mode: 'boolean' }).notNull().default(false),
})

export const sacredTimes = sqliteTable('sacred_times', {
  ...timestamps,
  id: pk(),
  coupleId: text('couple_id')
    .notNull()
    .references(() => couples.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  startTime: text('start_time').notNull(), // HH:MM (24h)
  endTime: text('end_time').notNull(),     // HH:MM (24h)
  // Recurring weekly: store day of week (0 = Sunday … 6 = Saturday)
  dayOfWeek: integer('day_of_week'),
  // One-off: store exact date. If null + dayOfWeek set → weekly recurrence
  date: integer('date', { mode: 'timestamp' }),
})

// ─── Relations ───────────────────────────────────────────────────────────────

export const couplesRelations = relations(couples, ({ many }) => ({
  users: many(users),
  events: many(events),
  milestones: many(milestones),
  sacredTimes: many(sacredTimes),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  couple: one(couples, {
    fields: [users.coupleId],
    references: [couples.id],
  }),
  events: many(events),
  moods: many(moods),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  couple: one(couples, {
    fields: [events.coupleId],
    references: [couples.id],
  }),
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
}))

export const moodsRelations = relations(moods, ({ one }) => ({
  user: one(users, {
    fields: [moods.userId],
    references: [users.id],
  }),
}))

export const milestonesRelations = relations(milestones, ({ one }) => ({
  couple: one(couples, {
    fields: [milestones.coupleId],
    references: [couples.id],
  }),
}))

export const sacredTimesRelations = relations(sacredTimes, ({ one }) => ({
  couple: one(couples, {
    fields: [sacredTimes.coupleId],
    references: [couples.id],
  }),
}))

// ─── Inferred types ──────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Couple = typeof couples.$inferSelect
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Mood = typeof moods.$inferSelect
export type NewMood = typeof moods.$inferInsert
export type Milestone = typeof milestones.$inferSelect
export type NewMilestone = typeof milestones.$inferInsert
export type SacredTime = typeof sacredTimes.$inferSelect
export type NewSacredTime = typeof sacredTimes.$inferInsert
