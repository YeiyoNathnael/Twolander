import { z } from 'zod'

export const moodSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.enum(['calm', 'happy', 'tired', 'excited', 'stressed']),
  note: z.string().max(300).optional(),
})

export type MoodInput = z.infer<typeof moodSchema>
