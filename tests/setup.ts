import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '~/server/database/schema'

const TEST_DB_URL = process.env.DATABASE_URL || 'postgresql://journal:journal@localhost:5432/journal'

const client = postgres(TEST_DB_URL)
export const testDb = drizzle(client, { schema })

export async function setupSchema() {
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject TEXT NOT NULL UNIQUE,
      email TEXT,
      name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await client`
    CREATE TABLE IF NOT EXISTS entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await client`CREATE UNIQUE INDEX IF NOT EXISTS entries_user_date_idx ON entries(user_id, date)`
  await client`CREATE INDEX IF NOT EXISTS entries_content_search_idx ON entries USING gin(to_tsvector('english', content))`
}

export async function createTestUser(suffix?: string) {
  const [user] = await testDb
    .insert(schema.users)
    .values({
      subject: `test-user-${suffix ?? Date.now()}`,
      email: 'test@test.com',
      name: 'Test User',
    })
    .returning()
  return user
}

export async function cleanup() {
  await testDb.delete(schema.entries)
  await testDb.delete(schema.users)
}

export async function teardown() {
  await cleanup()
  await client.end()
}
