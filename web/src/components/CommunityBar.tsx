import type { DailyStats } from '@/lib/types'

export default function CommunityBar({ stats }: { stats: DailyStats }) {
  if (stats.total === 0) return null

  const pct = Math.round((stats.correct / stats.total) * 100)
  const incorrectPct = 100 - pct

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-muted)' }}
        >
          Today's results
        </span>
        <span className="text-xs tabular-nums" style={{ color: 'var(--color-muted)' }}>
          {stats.total.toLocaleString()} {stats.total === 1 ? 'player' : 'players'}
        </span>
      </div>

      {/* Two-tone bar */}
      <div className="flex rounded-full overflow-hidden h-2 mb-3" style={{ gap: 2 }}>
        <div
          className="rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'var(--color-uw-red)', minWidth: pct > 0 ? 4 : 0 }}
        />
        <div
          className="flex-1 rounded-full"
          style={{ background: 'var(--color-border)' }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        <span className="text-sm font-semibold tabular-nums">
          {pct}%{' '}
          <span className="font-normal text-xs" style={{ color: 'var(--color-muted)' }}>
            correct
          </span>
        </span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-muted)' }}>
          {incorrectPct}%{' '}
          <span className="font-normal text-xs">
            incorrect
          </span>
        </span>
      </div>
    </div>
  )
}
