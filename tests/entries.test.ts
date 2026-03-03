import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createCaller } from '~/server/trpc/routers'
import type { Context } from '~/server/trpc/init'
import { testDb, setupSchema, createTestUser, cleanup, teardown } from './setup'

let userId: string

function authedCaller() {
  return createCaller({ db: testDb, userId } as Context)
}

function unauthenticatedCaller() {
  return createCaller({ db: testDb, userId: undefined } as Context)
}

beforeAll(async () => {
  await setupSchema()
  await cleanup()
  const user = await createTestUser('entries-test')
  userId = user.id
})

afterAll(async () => {
  await teardown()
})

beforeEach(async () => {
  await testDb.delete((await import('~/server/database/schema')).entries)
})

describe('entries.save', () => {
  it('creates a new entry', async () => {
    const caller = authedCaller()
    const entry = await caller.entries.save({ date: '2025-06-15', content: 'Hello world' })

    expect(entry).toBeDefined()
    expect(entry.date).toBe('2025-06-15')
    expect(entry.content).toBe('Hello world')
    expect(entry.userId).toBe(userId)
    expect(entry.id).toBeDefined()
  })

  it('upserts an existing entry', async () => {
    const caller = authedCaller()
    const first = await caller.entries.save({ date: '2025-06-15', content: 'First version' })
    const second = await caller.entries.save({ date: '2025-06-15', content: 'Updated version' })

    expect(second.id).toBe(first.id)
    expect(second.content).toBe('Updated version')
  })

  it('rejects unauthenticated calls', async () => {
    const caller = unauthenticatedCaller()
    await expect(caller.entries.save({ date: '2025-06-15', content: 'test' }))
      .rejects.toThrow('Not authenticated')
  })
})

describe('entries.getByDate', () => {
  it('returns entry for a given date', async () => {
    const caller = authedCaller()
    await caller.entries.save({ date: '2025-07-01', content: 'July entry' })

    const entry = await caller.entries.getByDate({ date: '2025-07-01' })
    expect(entry).not.toBeNull()
    expect(entry!.content).toBe('July entry')
  })

  it('returns null for a date with no entry', async () => {
    const caller = authedCaller()
    const entry = await caller.entries.getByDate({ date: '2099-01-01' })
    expect(entry).toBeNull()
  })

  it('rejects unauthenticated calls', async () => {
    const caller = unauthenticatedCaller()
    await expect(caller.entries.getByDate({ date: '2025-07-01' }))
      .rejects.toThrow('Not authenticated')
  })
})

describe('entries.listDates', () => {
  it('returns dates with entries for a given month', async () => {
    const caller = authedCaller()
    await caller.entries.save({ date: '2025-08-05', content: 'Entry 1' })
    await caller.entries.save({ date: '2025-08-15', content: 'Entry 2' })
    await caller.entries.save({ date: '2025-08-25', content: 'Entry 3' })
    await caller.entries.save({ date: '2025-09-01', content: 'Different month' })

    const dates = await caller.entries.listDates({ year: 2025, month: 8 })
    expect(dates).toHaveLength(3)
    expect(dates).toContain('2025-08-05')
    expect(dates).toContain('2025-08-15')
    expect(dates).toContain('2025-08-25')
    expect(dates).not.toContain('2025-09-01')
  })

  it('returns empty array for months with no entries', async () => {
    const caller = authedCaller()
    const dates = await caller.entries.listDates({ year: 2099, month: 1 })
    expect(dates).toEqual([])
  })

  it('rejects unauthenticated calls', async () => {
    const caller = unauthenticatedCaller()
    await expect(caller.entries.listDates({ year: 2025, month: 8 }))
      .rejects.toThrow('Not authenticated')
  })
})

describe('entries.search', () => {
  it('returns matching entries with snippets', async () => {
    const caller = authedCaller()
    await caller.entries.save({
      date: '2025-10-01',
      content: 'Today I went hiking in the mountains and enjoyed the beautiful scenery along the trail.',
    })
    await caller.entries.save({
      date: '2025-10-02',
      content: 'Spent the day reading a book about astronomy and the cosmos.',
    })

    const results = await caller.entries.search({ query: 'hiking mountains' })
    expect(results).toHaveLength(1)
    expect(results[0].date).toBe('2025-10-01')
    expect(results[0].snippet).toContain('<<HL>>')
    expect(results[0].snippet).toContain('<</HL>>')
  })

  it('returns empty array for no matches', async () => {
    const caller = authedCaller()
    await caller.entries.save({ date: '2025-10-05', content: 'A normal day at the office.' })

    const results = await caller.entries.search({ query: 'xylophone quantum' })
    expect(results).toEqual([])
  })

  it('does not return entries from other users', async () => {
    const caller = authedCaller()
    await caller.entries.save({
      date: '2025-10-10',
      content: 'This is a unique searchable phrase for isolation testing.',
    })

    const otherUser = await createTestUser('other-user')
    const otherCaller = createCaller({ db: testDb, userId: otherUser.id } as Context)
    const results = await otherCaller.entries.search({ query: 'isolation testing' })
    expect(results).toEqual([])
  })

  it('rejects unauthenticated calls', async () => {
    const caller = unauthenticatedCaller()
    await expect(caller.entries.search({ query: 'test' }))
      .rejects.toThrow('Not authenticated')
  })
})
