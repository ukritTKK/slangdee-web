/** Return a stable integer for a calendar date. */
export function dateSeed(date: Date = new Date()): number {
  const value = date.toISOString().slice(0, 10)
  let hash = 2166136261

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function dailyIndex(total: number, date: Date = new Date()): number {
  if (total <= 0) return 0
  return dateSeed(date) % total
}
