import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { resolve } from 'node:path'

export default defineNitroPlugin(async () => {
  const url = useRuntimeConfig().databaseUrl
  if (!url) {
    console.warn('[migrate] DATABASE_URL not configured, skipping migrations')
    return
  }

  const sql = postgres(url, { max: 1 })
  const db = drizzle(sql)

  const migrationsFolder = resolve(process.cwd(), 'server/database/migrations')
  console.log('[migrate] Running database migrations...')
  await migrate(db, { migrationsFolder })
  console.log('[migrate] Migrations complete')

  await sql.end()
})
