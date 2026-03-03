import { initTRPC, TRPCError } from '@trpc/server'
import type { db } from '../utils/db'

export interface Context {
  db: typeof db
  userId: string | undefined
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})
