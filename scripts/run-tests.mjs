import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const directory = await mkdtemp(join(tmpdir(), 'slangdee-m1-'))
try {
  const result = spawnSync(process.execPath, ['--test', '--experimental-strip-types', 'tests/**/*.test.ts'], {
    stdio: 'inherit', env: { ...process.env, SLANGDEE_TEST_DB_DIR: directory },
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
}
