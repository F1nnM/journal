import type { H3Event } from 'h3'
import type { Context } from './init'

export async function createTRPCContext(event: H3Event): Promise<Context> {
  const session = await getUserSession(event).catch(() => null)
  return { db, userId: session?.user?.id as string | undefined }
}
