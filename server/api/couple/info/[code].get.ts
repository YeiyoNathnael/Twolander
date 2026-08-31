import { eq } from 'drizzle-orm'
import { couples } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) throw createError({ statusCode: 400 })

  const db = useDb()

  const couple = await db.query.couples.findFirst({
    where: eq(couples.inviteCode, code),
    with: { users: true },
  })

  if (!couple) throw createError({ statusCode: 404, message: 'Invite not found' })
  if (couple.users.length >= 2) throw createError({ statusCode: 410, message: 'Calendar is already full' })

  const creator = couple.users[0]
  if (!creator) throw createError({ statusCode: 404 })

  return {
    creatorName: creator.name,
    creatorAvatar: creator.avatar,
  }
})
