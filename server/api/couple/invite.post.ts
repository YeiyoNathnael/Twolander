import { eq } from 'drizzle-orm'
import { users, couples } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDb()

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: { couple: true },
  })

  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  if (user.couple) {
    return { inviteCode: user.couple.inviteCode }
  }

  const [couple] = await db.insert(couples).values({}).returning()

  await db.update(users).set({ coupleId: couple.id }).where(eq(users.id, user.id))

  await setUserSession(event, {
    user: { ...session.user, coupleId: couple.id },
  })

  return { inviteCode: couple.inviteCode }
})
