export const runtime = 'edge'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { getStats, recordAnswer } from '@/lib/stats'

const VALID_GAMES = new Set(['hl', 'trivia'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// In-process IP rate limit: one submission per IP per game+date combo.
// Resets on server restart; sufficient to deter casual abuse.
const submissions = new Map<string, Set<string>>()

function validate(game: unknown, date: unknown): string | null {
  if (typeof game !== 'string' || !VALID_GAMES.has(game)) return 'invalid game'
  if (typeof date !== 'string' || !DATE_RE.test(date)) return 'invalid date'
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const game = searchParams.get('game')
  const date = searchParams.get('date')
  const err = validate(game, date)
  if (err) return NextResponse.json({ error: err }, { status: 400 })
  const { env } = getRequestContext<CloudflareEnv>()
  return NextResponse.json(await getStats(env.STATS_KV, game!, date!))
}

export async function POST(request: NextRequest) {
  const { env } = getRequestContext<CloudflareEnv>()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const { game, date, correct } = body as Record<string, unknown>
  const err = validate(game, date)
  if (err) return NextResponse.json({ error: err }, { status: 400 })
  if (typeof correct !== 'boolean') {
    return NextResponse.json({ error: 'invalid correct' }, { status: 400 })
  }

  // IP-based deduplication
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const key = `${game}:${date}`
  if (!submissions.has(ip)) submissions.set(ip, new Set())
  const seen = submissions.get(ip)!
  if (seen.has(key)) {
    // Already submitted — return current stats without incrementing
    return NextResponse.json(await getStats(env.STATS_KV, game as string, date as string))
  }
  seen.add(key)

  try {
    const stats = await recordAnswer(env.STATS_KV, game as string, date as string, correct)
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
