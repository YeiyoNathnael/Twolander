import { z } from 'zod'

export const sacredTimeSchema = z.object({
  title: z.string().min(1).max(100),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),   // HH:MM
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

export type SacredTimeInput = z.infer<typeof sacredTimeSchema>
