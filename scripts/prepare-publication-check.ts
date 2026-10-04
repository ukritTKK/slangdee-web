import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL
if (url !== 'file:./.audit/m1-http.db') throw new Error('Publication fixtures require the isolated .audit/m1-http.db copy')
const client = new PrismaClient({ adapter: new PrismaLibSql({ url }) })
try {
  const tag = await client.tag.upsert({ where: { slug: 'private-check' }, update: {}, create: { slug: 'private-check', name: 'private-check' } })
  const publicEntry = await client.slang.findUniqueOrThrow({ where: { slug: 'rage-bait' }, include: { slangTags: true } })
  for (const [slug, status] of [['milestone-private-draft', 'DRAFT'], ['milestone-private-archive', 'ARCHIVED']] as const) {
    await client.slang.upsert({ where: { slug }, update: {}, create: {
      slug, status, headword: 'Milestone Private Secret', originalLanguage: 'en',
      aliases: { create: [{ value: `${slug}-alias` }] },
      translations: { create: [{ locale: 'en', word: 'Milestone Private Secret', meaning: 'PRIVATE_CONTENT_MUST_NOT_APPEAR' }] },
      slangTags: { create: [...new Set([tag.id, ...publicEntry.slangTags.map((item) => item.tagId)])].map((tagId) => ({ tagId })) },
    } })
  }
  console.log('Added draft and archived fixtures to the isolated database copy.')
} finally {
  await client.$disconnect()
}
