import type { DailyRecord, GameStats } from './types'

function get<T>(key: string, guard: (v: unknown) => v is T): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}

function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function isDailyRecord(v: unknown): v is DailyRecord {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as DailyRecord).date === 'string' &&
    typeof (v as DailyRecord).answered === 'boolean' &&
    typeof (v as DailyRecord).correct === 'boolean'
  )
}

function isGameStats(v: unknown): v is GameStats {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as GameStats).streak === 'number' &&
    typeof (v as GameStats).bestStreak === 'number'
  )
}

// --- Higher/Lower ---

export function getHLDaily(): DailyRecord | null {
  return get('hl_daily', isDailyRecord)
}

export function setHLDaily(record: DailyRecord): void {
  set('hl_daily', record)
}

export function getHLStats(): GameStats {
  return get('hl_stats', isGameStats) ?? { streak: 0, bestStreak: 0 }
}

export function recordHLResult(date: string, correct: boolean): GameStats {
  const record = getHLDaily()
  const stats = getHLStats()
  if (record?.date === date && record.answered) return stats
  setHLDaily({ date, answered: true, correct })
  const newStreak = correct ? stats.streak + 1 : 0
  const newBest = Math.max(newStreak, stats.bestStreak)
  const newStats = { streak: newStreak, bestStreak: newBest }
  set('hl_stats', newStats)
  return newStats
}

// --- Trivia ---

export function getTriviaDaily(): DailyRecord | null {
  return get('trivia_daily', isDailyRecord)
}

export function setTriviaDaily(record: DailyRecord): void {
  set('trivia_daily', record)
}

export function getTriviaStats(): GameStats {
  return get('trivia_stats', isGameStats) ?? { streak: 0, bestStreak: 0 }
}

export function recordTriviaResult(date: string, correct: boolean): GameStats {
  const record = getTriviaDaily()
  const stats = getTriviaStats()
  if (record?.date === date && record.answered) return stats
  setTriviaDaily({ date, answered: true, correct })
  const newStreak = correct ? stats.streak + 1 : 0
  const newBest = Math.max(newStreak, stats.bestStreak)
  const newStats = { streak: newStreak, bestStreak: newBest }
  set('trivia_stats', newStats)
  return newStats
}
