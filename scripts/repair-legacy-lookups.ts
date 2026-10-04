import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { restoreBaselineLookups } from '../src/lib/editorial.ts'

const client = new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' }) })
try {
  let repaired = 0
  const entries = await client.slang.findMany({ select: { id: true, revision: true } })
  for (const entry of entries) {
    const changed = await restoreBaselineLookups(client, entry.id, {
      expectedRevision: entry.revision, actor: 'milestone-1-editorial',
      note: 'Restore previous translated-word URLs from the immutable baseline after preservation review.',
    })
    if (changed) repaired++
  }
  console.log(`Restored legacy lookups for ${repaired} entries without changing content or visibility.`)
} finally {
  await client.$disconnect()
}
