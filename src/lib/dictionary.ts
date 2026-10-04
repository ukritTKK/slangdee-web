import type { Prisma, PrismaClient } from '@prisma/client'
import { dailyIndex } from '../utils/discovery.util.ts'

const published = { status: 'PUBLISHED' } satisfies Prisma.SlangWhereInput

const cardInclude = {
  translations: true,
  slangTags: { include: { tag: true } },
} satisfies Prisma.SlangInclude

const detailInclude = {
  translations: { include: { sources: { include: { source: true } } } },
  examples: { include: { source: true } },
  aliases: true,
  slangTags: { include: { tag: true } },
  sources: { include: { source: true } },
} satisfies Prisma.SlangInclude

export type PublishedEntry = Prisma.SlangGetPayload<{
  include: typeof detailInclude
}>

export function createDictionary(client: PrismaClient) {
  return {
    async findPublished(lookup: string) {
      const canonical = await client.slang.findUnique({
        where: { slug: lookup },
        select: { id: true, status: true },
      })

      if (canonical) {
        if (canonical.status !== 'PUBLISHED') return null
        return client.slang.findFirst({
          where: { id: canonical.id, ...published },
          include: detailInclude,
        })
      }

      return client.slang.findFirst({
        where: {
          ...published,
          OR: [
            { headword: lookup },
            { romanization: lookup },
            { aliases: { some: { value: lookup } } },
            { translations: { some: { word: lookup } } },
          ],
        },
        include: detailInclude,
      })
    },

    async searchPublished(query: string, limit = 30) {
      const term = query.trim()
      if (!term) return []

      const where: Prisma.SlangWhereInput = term.startsWith('#')
        ? {
            ...published,
            slangTags: {
              some: { tag: { name: { equals: term.slice(1).trim() } } },
            },
          }
        : {
            ...published,
            OR: [
              { slug: { contains: term } },
              { headword: { contains: term } },
              { romanization: { contains: term } },
              { aliases: { some: { value: { contains: term } } } },
              { translations: { some: { word: { contains: term } } } },
            ],
          }

      if (term === '#') return []
      return client.slang.findMany({ where, include: cardInclude, take: limit })
    },

    async getHome(date: Date = new Date()) {
      const totalSlangs = await client.slang.count({ where: published })
      const [wordOfTheDay] = totalSlangs
        ? await client.slang.findMany({
            where: published,
            orderBy: { id: 'asc' },
            skip: dailyIndex(totalSlangs, date),
            take: 1,
            include: { ...cardInclude, examples: true },
          })
        : []

      const trendingSlangs = await client.slang.findMany({
        where: published,
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: cardInclude,
      })

      const tagsWithPublishedCounts = await client.tag.findMany({
        where: { slangTags: { some: { slang: published } } },
        include: {
          _count: {
            select: { slangTags: { where: { slang: published } } },
          },
        },
      })
      const trendingTags = tagsWithPublishedCounts
        .sort((a, b) => b._count.slangTags - a._count.slangTags || a.name.localeCompare(b.name))
        .slice(0, 12)

      return {
        totalSlangs,
        wordOfTheDay: wordOfTheDay ?? null,
        trendingSlangs,
        trendingTags,
      }
    },

    getRelated(entryId: number, tagIds: number[]) {
      if (tagIds.length === 0) return Promise.resolve([])
      return client.slang.findMany({
        where: {
          ...published,
          id: { not: entryId },
          slangTags: { some: { tagId: { in: tagIds } } },
        },
        take: 6,
        include: cardInclude,
      })
    },

    publishedUrls() {
      return client.slang.findMany({
        where: published,
        select: { slug: true, updatedAt: true },
      })
    },
  }
}
