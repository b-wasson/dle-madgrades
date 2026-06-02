'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Course, HLPair, GameStats, DailyStats } from '@/lib/types'
import { getDailyKey } from '@/lib/seed'
import { getHLDaily, recordHLResult, getHLStats } from '@/lib/storage'
import { fetchCommunityStats, fetchNextHLPair, postAnswer } from '@/lib/api'
import CommunityBar from './CommunityBar'

type Mode = 'daily' | 'infinite'
type Status = 'playing' | 'answered'

interface Props {
  dailyPair: HLPair
}

function fmt(value: number, metric: HLPair['metric']): string {
  return metric === 'gpa' ? value.toFixed(2) : `${(value * 100).toFixed(1)}%`
}

function CourseCard({
  course,
  pair,
  label,
  status,
  selected,
  side,
  onSelect,
}: {
  course: Course
  pair: HLPair
  label: 'A' | 'B'
  status: Status
  selected: 'a' | 'b' | null
  side: 'a' | 'b'
  onSelect: (side: 'a' | 'b') => void
}) {
  const isAnswered = status === 'answered'
  const isWinner = side === pair.answer
  const isSelected = selected === side
  const dim = isAnswered && !isSelected && !isWinner
  const value = pair.metric === 'gpa' ? course.avgGpa : course.failRate

  let borderColor = 'var(--color-border)'
  let boxShadow: string | undefined
  if (isAnswered && isSelected) {
    if (isWinner) {
      borderColor = 'var(--color-win)'
      boxShadow = '0 0 0 1px var(--color-win), 0 8px 32px rgba(22,163,74,0.15)'
    } else {
      borderColor = '#ef4444'
      boxShadow = '0 0 0 1px #ef4444, 0 8px 32px rgba(239,68,68,0.15)'
    }
  }

  return (
    <button
      onClick={() => !isAnswered && onSelect(side)}
      disabled={isAnswered}
      className="hl-card flex-1 w-full rounded-2xl p-5 text-left"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${borderColor}`,
        cursor: isAnswered ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        opacity: dim ? 0.45 : 1,
        boxShadow,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <span
          className="text-2xl font-black"
          style={{ lineHeight: 1 }}
        >
          {label}
        </span>
        {isAnswered && isWinner && (
          <span
            className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-win)', color: '#fff', letterSpacing: '0.08em' }}
          >
            Higher
          </span>
        )}
      </div>

      {/* Subject + number */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs font-semibold tracking-widest uppercase px-2 py-0.5 rounded"
          style={{
            background: 'var(--color-border)',
            color: '#999',
          }}
        >
          {course.subjectAbbrev}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {course.number}
        </span>
      </div>

      {/* Course name */}
      <div
        className="font-semibold leading-snug"
        style={{
          fontSize: 15,
          color: 'var(--foreground)',
          flexGrow: 1,
        }}
      >
        {course.name}
      </div>

      {/* Metric */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        {isAnswered ? (
          <div>
            <div
              className="font-black tabular-nums"
              style={{
                fontSize: 36,
                lineHeight: 1,
                color: isWinner ? 'var(--foreground)' : 'var(--color-muted)',
                letterSpacing: '-0.02em',
              }}
            >
              {fmt(value, pair.metric)}
            </div>
            <div className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
              {pair.metric === 'gpa' ? 'avg GPA' : 'fail rate'}
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="rounded-full"
                style={{ width: 5, height: 5, background: 'var(--color-border)' }}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function VsBadge() {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full text-xs font-black h-8 w-16 sm:w-9 sm:h-9"
      style={{
        border: '1px solid var(--color-border)',
        color: 'var(--color-muted)',
        background: 'var(--color-surface)',
        letterSpacing: '0.05em',
      }}
    >
      VS
    </div>
  )
}

export default function HigherLowerGame({ dailyPair }: Props) {
  const [mode, setMode] = useState<Mode>('daily')
  const [pair, setPair] = useState<HLPair>(dailyPair)
  const [status, setStatus] = useState<Status>('playing')
  const [selected, setSelected] = useState<'a' | 'b' | null>(null)
  const [gameStats, setGameStats] = useState<GameStats>({ streak: 0, bestStreak: 0 })
  const [communityStats, setCommunityStats] = useState<DailyStats | null>(null)
  const [infiniteScore, setInfiniteScore] = useState(0)
  const [infiniteTotal, setInfiniteTotal] = useState(0)

  // Hydrate from localStorage after first render so server and client agree on initial HTML
  useEffect(() => {
    setGameStats(getHLStats())
    const record = getHLDaily()
    const today = getDailyKey()
    if (record?.date === today && record.answered) {
      setStatus('answered')
      setSelected(record.correct ? dailyPair.answer : (dailyPair.answer === 'a' ? 'b' : 'a'))
      fetchCommunityStats('hl', today).then(setCommunityStats)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback(async (side: 'a' | 'b') => {
    setSelected(side)
    setStatus('answered')
    const correct = side === pair.answer
    if (mode === 'daily') {
      setGameStats(recordHLResult(getDailyKey(), correct))
      setCommunityStats(await postAnswer('hl', getDailyKey(), correct))
    } else {
      setInfiniteTotal(t => t + 1)
      if (correct) setInfiniteScore(s => s + 1)
    }
  }, [pair, mode])

  const nextRound = useCallback(() => {
    fetchNextHLPair().then(p => {
      setPair(p)
      setSelected(null)
      setStatus('playing')
    })
  }, [])

  const switchMode = useCallback((next: Mode) => {
    if (next === 'infinite') {
      fetchNextHLPair().then(p => {
        setPair(p)
        setSelected(null)
        setStatus('playing')
        setInfiniteScore(0)
        setInfiniteTotal(0)
      })
    } else {
      setPair(dailyPair)
      const record = getHLDaily()
      const today = getDailyKey()
      if (record?.date === today && record.answered) {
        setStatus('answered')
        setSelected(record.correct ? dailyPair.answer : (dailyPair.answer === 'a' ? 'b' : 'a'))
        fetchCommunityStats('hl', today).then(setCommunityStats)
      } else {
        setStatus('playing')
        setSelected(null)
        setCommunityStats(null)
      }
    }
    setMode(next)
  }, [dailyPair])

  const isCorrect = selected === pair.answer

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Which has the higher {pair.metric === 'gpa' ? 'GPA' : 'fail rate'}?
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {mode === 'daily' ? 'Daily challenge' : 'Infinite mode'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl p-1 self-start sm:self-auto shrink-0" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {(['daily', 'infinite'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="mode-tab px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
              style={{
                background: mode === m ? 'var(--color-uw-red)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--color-muted)',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {mode === 'daily' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--color-uw-red)' }}>🔥</span>
            <span className="text-sm font-semibold tabular-nums">{gameStats.streak}</span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>streak</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--color-border)' }}>·</div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tabular-nums">{gameStats.bestStreak}</span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>best</span>
          </div>
        </div>
      )}
      {mode === 'infinite' && infiniteTotal > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tabular-nums">{infiniteScore}</span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>of</span>
          <span className="text-sm font-semibold tabular-nums">{infiniteTotal}</span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>correct</span>
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-3">
        <CourseCard
          course={pair.courseA} pair={pair} label="A"
          status={status} selected={selected} side="a" onSelect={handleAnswer}
        />
        <VsBadge />
        <CourseCard
          course={pair.courseB} pair={pair} label="B"
          status={status} selected={selected} side="b" onSelect={handleAnswer}
        />
      </div>

      {/* Post-answer row */}
      {status === 'answered' && (
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-semibold"
            style={{ color: isCorrect ? 'var(--color-win)' : '#ef4444' }}
          >
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
          {mode === 'daily' ? (
            <button
              onClick={() => switchMode('infinite')}
              className="action-btn text-sm px-4 py-2 rounded-xl font-medium"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--foreground)' }}
            >
              Keep playing →
            </button>
          ) : (
            <button
              onClick={nextRound}
              className="action-btn text-sm px-4 py-2 rounded-xl font-semibold"
              style={{ background: 'var(--color-uw-red)', color: '#fff' }}
            >
              Next →
            </button>
          )}
        </div>
      )}

      {/* Community stats */}
      {status === 'answered' && mode === 'daily' && communityStats && (
        <CommunityBar stats={communityStats} />
      )}
    </div>
  )
}
