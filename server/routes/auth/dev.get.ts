import { users } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const config = useRuntimeConfig()

  // Only active when OIDC is not configured
  if (config.oauth.oidc.clientId) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const rows = await db
    .insert(users)
    .values({
      subject: 'dev-user',
      email: 'dev@localhost',
      name: 'Dev User',
    })
    .onConflictDoUpdate({
      target: users.subject,
      set: {
        email: 'dev@localhost',
        name: 'Dev User',
        updatedAt: new Date(),
      },
    })
    .returning()

  const devUser = rows[0]!

  await setUserSession(event, {
    user: {
      id: devUser.id,
      sub: devUser.subject,
      name: devUser.name ?? '',
      email: devUser.email ?? '',
    },
    loggedInAt: Date.now(),
  })

  return sendRedirect(event, '/')
})
