import { router, createCallerFactory } from '../init'
import { entriesRouter } from './entries'

export const appRouter = router({
  entries: entriesRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)
