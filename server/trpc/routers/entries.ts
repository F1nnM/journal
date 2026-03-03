import { z } from 'zod'
import { eq, and, sql, gte, lt } from 'drizzle-orm'
import { entries } from '../../database/schema'
import { protectedProcedure, router } from '../init'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const entriesRouter = router({
  save: protectedProcedure
    .input(z.object({
      date: dateString,
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .insert(entries)
        .values({
          userId: ctx.userId,
          date: input.date,
          content: input.content,
        })
        .onConflictDoUpdate({
          target: [entries.userId, entries.date],
          set: {
            content: sql`excluded.content`,
            updatedAt: sql`now()`,
          },
        })
        .returning()
      return entry
    }),

  getByDate: protectedProcedure
    .input(z.object({
      date: dateString,
    }))
    .query(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .select()
        .from(entries)
        .where(and(
          eq(entries.userId, ctx.userId),
          eq(entries.date, input.date),
        ))
        .limit(1)
      return entry ?? null
    }),

  listDates: protectedProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = `${input.year}-${String(input.month).padStart(2, '0')}-01`
      const nextMonth = input.month === 12
        ? `${input.year + 1}-01-01`
        : `${input.year}-${String(input.month + 1).padStart(2, '0')}-01`

      const result = await ctx.db
        .select({ date: entries.date })
        .from(entries)
        .where(and(
          eq(entries.userId, ctx.userId),
          gte(entries.date, startDate),
          lt(entries.date, nextMonth),
        ))

      return result.map(r => r.date)
    }),

  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
    }))
    .query(async ({ ctx, input }) => {
      const tsQuery = sql`plainto_tsquery('english', ${input.query})`
      const tsVector = sql`to_tsvector('english', ${entries.content})`

      const results = await ctx.db
        .select({
          id: entries.id,
          date: entries.date,
          snippet: sql<string>`ts_headline('english', ${entries.content}, ${tsQuery}, 'StartSel=<<HL>>,StopSel=<</HL>>,MaxWords=35,MinWords=15')`,
        })
        .from(entries)
        .where(and(
          eq(entries.userId, ctx.userId),
          sql`${tsVector} @@ ${tsQuery}`,
        ))
        .orderBy(sql`ts_rank(${tsVector}, ${tsQuery}) desc`)
        .limit(20)

      return results
    }),
})
