import type { H3Event } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS_AUTH = 10 // auth endpoints: 10 req/min
const MAX_REQUESTS_API = 60 // API endpoints: 60 req/min

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, WINDOW_MS)

function getClientIp(event: H3Event): string {
  return getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || getHeader(event, 'x-real-ip')
    || event.node.req.socket.remoteAddress
    || 'unknown'
}

function checkRateLimit(key: string, max: number): { allowed: boolean, remaining: number, resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: max - 1, resetAt: now + WINDOW_MS }
  }

  entry.count++
  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  const ip = getClientIp(event)

  let max: number
  let key: string

  if (path.startsWith('/auth/')) {
    max = MAX_REQUESTS_AUTH
    key = `auth:${ip}`
  } else if (path.startsWith('/api/trpc/')) {
    max = MAX_REQUESTS_API
    key = `api:${ip}`
  } else {
    return
  }

  const result = checkRateLimit(key, max)

  setHeader(event, 'X-RateLimit-Limit', String(max))
  setHeader(event, 'X-RateLimit-Remaining', String(result.remaining))
  setHeader(event, 'X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

  if (!result.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    })
  }
})
