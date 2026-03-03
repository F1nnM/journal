import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { resolve } from 'node:path'

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 2000

async function runMigrations(url: string) {
  const migrationsFolder = resolve(process.cwd(), 'server/database/migrations')
  console.log(`[migrate] Migrations folder: ${migrationsFolder}`)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const sql = postgres(url, { max: 1 })
    try {
      const db = drizzle(sql)
      console.log(`[migrate] Running database migrations (attempt ${attempt}/${MAX_RETRIES})...`)
      await migrate(db, { migrationsFolder })
      console.log('[migrate] Migrations complete')
      return
    } catch (err) {
      console.error(`[migrate] Attempt ${attempt}/${MAX_RETRIES} failed:`, err)
      if (attempt < MAX_RETRIES) {
        console.log(`[migrate] Retrying in ${RETRY_DELAY_MS}ms...`)
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
      } else {
        throw new Error(`[migrate] All ${MAX_RETRIES} migration attempts failed`)
      }
    } finally {
      await sql.end()
    }
  }
}

export default defineNitroPlugin(async () => {
  const url = useRuntimeConfig().databaseUrl
  if (!url) {
    console.warn('[migrate] DATABASE_URL not configured, skipping migrations')
    return
  }

  await runMigrations(url)
})
