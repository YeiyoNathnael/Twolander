import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users, couples } from '../../db/schema'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Invalid login data',
    })
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()
  const db = useDb()

  const user = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  })

  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    })
  }

  let coupleId = user.coupleId
  if (!coupleId) {
    const [newCouple] = await db.insert(couples).values({}).returning()
    await db.update(users).set({ coupleId: newCouple.id }).where(eq(users.id, user.id))
    coupleId = newCouple.id
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      coupleId,
      color: user.color,
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      coupleId,
      color: user.color,
    },
  }
})
