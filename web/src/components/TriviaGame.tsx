'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Course, TriviaQuestion, GameStats, DailyStats } from '@/lib/types'
import { getDailyKey } from '@/lib/seed'
import { getTriviaDaily, recordTriviaResult, getTriviaStats } from '@/lib/storage'
import { fetchCommunityStats, fetchNextTriviaQuestion, postAnswer } from '@/lib/api'
import CommunityBar from './CommunityBar'

type Mode = 'daily' | 'infinite'
type Status = 'playing' | 'answered'

const LABELS = ['A', 'B', 'C', 'D'] as const

interface Props {
  dailyQuestion: TriviaQuestion
}

function fmt(value: number, metric: TriviaQuestion['metric']): string {
  return metric === 'gpa' ? value.toFixed(2) : `${(value * 100).toFixed(1)}%`
}

function OptionButton({
  course,
  index,
  question,
  status,
  selected,
  onSelect,
}: {
  course: Course
  index: number
  question: TriviaQuestion
  status: Status
  selected: number | null
  onSelect: (i: number) => void
}) {
  const isAnswered = status === 'answered'
  const isCorrect = index === question.correctIndex
  const isSelected = selected === index
  const value = question.metric === 'gpa' ? course.avgGpa : course.failRate

  let bg = 'transparent'
  let borderColor = 'var(--color-border)'
  let labelBg = 'var(--color-border)'
  let labelColor = 'var(--color-muted)'
  let textOpacity = 1

  if (isAnswered) {
    if (isCorrect) {
      bg = 'rgba(22, 163, 74, 0.08)'
      borderColor = 'var(--color-win)'
      labelBg = 'var(--color-win)'
      labelColor = '#fff'
    } else if (isSelected) {
      bg = 'rgba(239, 68, 68, 0.06)'
      borderColor = '#ef4444'
      labelBg = '#ef4444'
      labelColor = '#fff'
    } else {
      textOpacity = 0.4
    }
  }

  return (
    <button
      onClick={() => !isAnswered && onSelect(index)}
      disabled={isAnswered}
      className="trivia-option w-full rounded-2xl p-4 text-left"
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        cursor: isAnswered ? 'default' : 'pointer',
        opacity: textOpacity,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Letter label */}
        <div
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
          style={{ background: labelBg, color: labelColor, transition: 'background 0.15s, color 0.15s' }}
        >
          {LABELS[index]}
        </div>

        {/* Course info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: isAnswered && isCorrect ? 'var(--color-win)' : 'var(--color-muted)' }}
            >
              {course.subjectAbbrev}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {course.number}
            </span>
          </div>
          <div className={`font-medium text-sm leading-snug ${isAnswered ? 'truncate' : 'line-clamp-2'}`}>{course.name}</div>
        </div>

        {/* Revealed value */}
        {isAnswered && (
          <div className="shrink-0 text-right">
            <div
              className="text-xl font-black tabular-nums"
              style={{
                color: isCorrect ? 'var(--foreground)' : 'var(--color-muted)',
                letterSpacing: '-0.01em',
              }}
            >
              {fmt(value, question.metric)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {question.metricLabel}
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

export default function TriviaGame({ dailyQuestion }: Props) {
  const [mode, setMode] = useState<Mode>('daily')
  const [question, setQuestion] = useState<TriviaQuestion>(dailyQuestion)
  const [status, setStatus] = useState<Status>('playing')
  const [selected, setSelected] = useState<number | null>(null)
  const [gameStats, setGameStats] = useState<GameStats>({ streak: 0, bestStreak: 0 })
  const [communityStats, setCommunityStats] = useState<DailyStats | null>(null)
  const [infiniteScore, setInfiniteScore] = useState(0)
  const [infiniteTotal, setInfiniteTotal] = useState(0)

  // Hydrate from localStorage after first render so server and client agree on initial HTML
  useEffect(() => {
    setGameStats(getTriviaStats())
    const record = getTriviaDaily()
    const today = getDailyKey()
    if (record?.date === today && record.answered) {
      setStatus('answered')
      setSelected(record.correct ? dailyQuestion.correctIndex : (dailyQuestion.correctIndex === 0 ? 1 : 0))
      fetchCommunityStats('trivia', today).then(setCommunityStats)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback(async (index: number) => {
    setSelected(index)
    setStatus('answered')
    const correct = index === question.correctIndex
    if (mode === 'daily') {
      setGameStats(recordTriviaResult(getDailyKey(), correct))
      setCommunityStats(await postAnswer('trivia', getDailyKey(), correct))
    } else {
      setInfiniteTotal(t => t + 1)
      if (correct) setInfiniteScore(s => s + 1)
    }
  }, [question, mode])

  const nextQuestion = useCallback(() => {
    fetchNextTriviaQuestion().then(q => {
      setQuestion(q)
      setSelected(null)
      setStatus('playing')
    })
  }, [])

  const switchMode = useCallback((next: Mode) => {
    if (next === 'infinite') {
      fetchNextTriviaQuestion().then(q => {
        setQuestion(q)
        setSelected(null)
        setStatus('playing')
        setInfiniteScore(0)
        setInfiniteTotal(0)
      })
    } else {
      setQuestion(dailyQuestion)
      const record = getTriviaDaily()
      const today = getDailyKey()
      if (record?.date === today && record.answered) {
        setStatus('answered')
        setSelected(record.correct ? dailyQuestion.correctIndex : (dailyQuestion.correctIndex === 0 ? 1 : 0))
        fetchCommunityStats('trivia', today).then(setCommunityStats)
      } else {
        setStatus('playing')
        setSelected(null)
        setCommunityStats(null)
      }
    }
    setMode(next)
  }, [dailyQuestion])

  const isCorrect = selected === question.correctIndex

  return (
    <div className="flex flex-col gap-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
            {mode === 'daily' ? 'Daily challenge' : 'Infinite mode'}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight">{question.text}</h1>
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

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.options.map((course, i) => (
          <OptionButton
            key={course.uuid + i}
            course={course}
            index={i}
            question={question}
            status={status}
            selected={selected}
            onSelect={handleAnswer}
          />
        ))}
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
              onClick={nextQuestion}
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
