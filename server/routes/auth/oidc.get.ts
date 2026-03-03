import { users } from '~~/server/database/schema'

export default defineOAuthOidcEventHandler({
  config: {
    scope: ['openid', 'profile', 'email'],
  },
  async onSuccess(event, { user: oidcUser }) {
    const rows = await db
      .insert(users)
      .values({
        subject: oidcUser.sub,
        email: oidcUser.email ?? null,
        name: oidcUser.name ?? null,
      })
      .onConflictDoUpdate({
        target: users.subject,
        set: {
          email: oidcUser.email ?? null,
          name: oidcUser.name ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()

    const dbUser = rows[0]!

    await setUserSession(event, {
      user: {
        id: dbUser.id,
        sub: dbUser.subject,
        name: dbUser.name ?? '',
        email: dbUser.email ?? '',
      },
      loggedInAt: Date.now(),
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('OIDC auth error:', error.message)
    return sendRedirect(event, '/login')
  },
})
