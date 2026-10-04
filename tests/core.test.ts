import test from 'node:test'
import assert from 'node:assert/strict'
import { dailyIndex, dateSeed } from '../src/utils/discovery.util.ts'
import { slangPath, searchPath } from '../src/utils/route.util.ts'

test('Word of the Day selection is stable for the same date', () => {
  const date = new Date('2026-08-23T12:00:00Z')
  assert.equal(dailyIndex(10, date), dailyIndex(10, date))
  assert.equal(dateSeed(date), dateSeed(date))
})

test('Word of the Day selection stays within the available entries', () => {
  assert.equal(dailyIndex(0, new Date('2026-08-23T12:00:00Z')), 0)
  assert.ok(dailyIndex(7, new Date('2026-08-23T12:00:00Z')) >= 0)
  assert.ok(dailyIndex(7, new Date('2026-08-23T12:00:00Z')) < 7)
})

test('localized detail and search paths encode user input', () => {
  assert.equal(slangPath('en', 'rage-bait'), '/en/slang/rage-bait')
  assert.equal(searchPath('th', '#Internet Culture'), '/th/search?q=%23Internet%20Culture')
})
