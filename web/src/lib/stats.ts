export interface DailyStats {
  total: number
  correct: number
}

function key(game: string, date: string): string {
  return `${game}:${date}`
}

export async function getStats(kv: KVNamespace, game: string, date: string): Promise<DailyStats> {
  const entry = await kv.get<DailyStats>(key(game, date), 'json')
  return entry ?? { total: 0, correct: 0 }
}

export async function recordAnswer(kv: KVNamespace, game: string, date: string, correct: boolean): Promise<DailyStats> {
  const k = key(game, date)
  const entry = (await kv.get<DailyStats>(k, 'json')) ?? { total: 0, correct: 0 }
  entry.total += 1
  if (correct) entry.correct += 1
  await kv.put(k, JSON.stringify(entry))
  return entry
}
