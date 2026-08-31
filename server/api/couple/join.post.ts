import { eq } from 'drizzle-orm'
import { users, couples } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { code } = await readBody<{ code: string }>(event)

  if (!code?.trim()) {
    throw createError({ statusCode: 400, message: 'Invite code is required' })
  }

  const db = useDb()

  const couple = await db.query.couples.findFirst({
    where: eq(couples.inviteCode, code.trim()),
    with: { users: true },
  })

  if (!couple) throw createError({ statusCode: 404, message: 'Invalid invite code' })

  if (couple.users.length >= 2) {
    throw createError({ statusCode: 400, message: 'This calendar already has two members' })
  }

  const alreadyMember = couple.users.some((u) => u.id === session.user.id)
  if (alreadyMember) {
    throw createError({ statusCode: 400, message: 'You are already in this calendar' })
  }

  await db
    .update(users)
    .set({ coupleId: couple.id, color: 'teal' })
    .where(eq(users.id, session.user.id))

  await setUserSession(event, {
    user: { ...session.user, coupleId: couple.id, color: 'teal' },
  })

  return { ok: true, coupleId: couple.id }
})
