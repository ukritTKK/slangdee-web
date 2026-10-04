import 'dotenv/config'
import { createClient } from '@libsql/client'
import { writeFile } from 'node:fs/promises'

const db = createClient({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
const entries = await db.execute('SELECT id, slug, createdAt FROM Slang ORDER BY id')
await writeFile('.audit/milestone-1-baseline.json', JSON.stringify(entries.rows, null, 2))
console.log(`Captured ${entries.rows.length} existing canonical entries.`)
db.close()
