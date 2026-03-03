import { createTRPCNuxtHandler } from 'trpc-nuxt/server'
import { appRouter } from '~~/server/trpc/routers'
import { createTRPCContext } from '~~/server/trpc/context'

export default createTRPCNuxtHandler({
  endpoint: '/api/trpc',
  router: appRouter,
  createContext: createTRPCContext,
})
