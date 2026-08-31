import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users, couples } from '../../db/schema'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(50),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Invalid registration data',
    })
  }

  const { email, password, name } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()
  const db = useDb()

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'An account with this email already exists',
    })
  }

  const passwordHash = await hashPassword(password)

  // Check if there is a pending invite code cookie from partner
  const pendingInvite = getCookie(event, 'pending_invite')
  let coupleId: string

  if (pendingInvite) {
    const couple = await db.query.couples.findFirst({
      where: eq(couples.inviteCode, pendingInvite.trim()),
      with: { users: true },
    })
    if (couple && couple.users.length < 2) {
      coupleId = couple.id
      deleteCookie(event, 'pending_invite')
    } else {
      const [newCouple] = await db
        .insert(couples)
        .values({
          inviteCode: crypto.randomUUID().slice(0, 8),
        })
        .returning()
      coupleId = newCouple.id
    }
  } else {
    // Automatically create couple space for new user
    const [newCouple] = await db
      .insert(couples)
      .values({
        inviteCode: crypto.randomUUID().slice(0, 8),
      })
      .returning()
    coupleId = newCouple.id
  }

  const [created] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      coupleId,
      color: 'coral',
    })
    .returning()

  await setUserSession(event, {
    user: {
      id: created.id,
      email: created.email,
      name: created.name,
      avatar: created.avatar,
      coupleId: created.coupleId,
      color: created.color,
    },
  })

  return {
    user: {
      id: created.id,
      email: created.email,
      name: created.name,
      coupleId: created.coupleId,
      color: created.color,
    },
  }
})
