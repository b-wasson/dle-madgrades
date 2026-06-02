import type { DailyStats, HLPair, TriviaQuestion } from './types'

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(`stats API ${res.status}`)
  return res.json()
}

export function fetchCommunityStats(game: string, date: string): Promise<DailyStats> {
  return fetchJSON(`/api/stats?game=${game}&date=${date}`)
}

export function fetchNextHLPair(): Promise<HLPair> {
  return fetchJSON('/api/question/hl')
}

export function fetchNextTriviaQuestion(): Promise<TriviaQuestion> {
  return fetchJSON('/api/question/trivia')
}

export function postAnswer(game: string, date: string, correct: boolean): Promise<DailyStats> {
  return fetchJSON('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game, date, correct }),
  })
}
