import { eq } from 'drizzle-orm'
import { users, couples } from '../../db/schema'

export default defineOAuthGoogleEventHandler({
  config: {
    // Include calendar.readonly for the optional Google Calendar sync feature
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
  },

  async onSuccess(event, { user: googleUser, tokens }) {
    const db = useDb()
    const session = await getUserSession(event)

    let user: typeof users.$inferSelect | undefined

    // 1. If user is already logged in with email/password and connecting Google Calendar:
    if (session?.user?.id) {
      user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      })
      if (user) {
        await db
          .update(users)
          .set({
            googleId: googleUser.sub,
            googleRefreshToken: tokens.refresh_token || user.googleRefreshToken || tokens.access_token,
            avatar: googleUser.picture ?? user.avatar,
          })
          .where(eq(users.id, user.id))
        user = await db.query.users.findFirst({ where: eq(users.id, user.id) })
      }
    }

    // 2. Otherwise look up by Google ID or email
    if (!user) {
      user = await db.query.users.findFirst({
        where: eq(users.googleId, googleUser.sub),
      })
    }

    if (!user) {
      user = await db.query.users.findFirst({
        where: eq(users.email, googleUser.email),
      })
    }

    if (!user) {
      // First time user registration via Google OAuth
      const [createdCouple] = await db
        .insert(couples)
        .values({
          inviteCode: crypto.randomUUID().slice(0, 8),
        })
        .returning()

      const [created] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          name: googleUser.name ?? googleUser.email.split('@')[0],
          avatar: googleUser.picture ?? null,
          googleId: googleUser.sub,
          googleRefreshToken: tokens.refresh_token || tokens.access_token || null,
          coupleId: createdCouple.id,
          color: 'coral',
        })
        .returning()
      user = created
    } else {
      // Update existing record
      await db
        .update(users)
        .set({
          googleId: googleUser.sub,
          googleRefreshToken: tokens.refresh_token || user.googleRefreshToken || tokens.access_token || null,
          avatar: googleUser.picture ?? user.avatar,
        })
        .where(eq(users.id, user.id))
    }

    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        coupleId: user.coupleId,
        color: user.color,
        googleCalendarConnected: !!user.googleRefreshToken || !!tokens.access_token,
      },
    })

    // Check if there is a pending invite from /invite/[code]
    const pendingInvite = getCookie(event, 'pending_invite')
    if (pendingInvite && !user.coupleId) {
      deleteCookie(event, 'pending_invite')
      return sendRedirect(event, `/invite/${pendingInvite}`)
    }

    return sendRedirect(event, '/calendar')
  },

  async onError(event, error) {
    console.error('[auth/google]', error)
    return sendRedirect(event, '/login?error=oauth')
  },
})
