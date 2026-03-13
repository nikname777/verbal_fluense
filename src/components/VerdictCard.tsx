import type { Verdict } from '../exercises/scoring'

interface VerdictCardProps {
  verdict: Verdict
  scoreLabel?: string
  extraStats?: React.ReactNode
}

const LEVEL_ICONS: Record<string, string> = {
  critical: '⚠️',
  low: '📉',
  basic: '📊',
  average: '👍',
  good: '⭐',
  advanced: '🚀',
  master: '🏆',
}

export default function VerdictCard({ verdict, scoreLabel = 'слов', extraStats }: VerdictCardProps) {
  const icon = LEVEL_ICONS[verdict.level] ?? '📊'

  return (
    <div className={`rounded-2xl border p-5 mb-6 ${verdict.bgColor} ${verdict.borderColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Результат</div>
          <div className={`text-6xl font-bold tabular-nums ${verdict.color}`}>
            {verdict.score}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">{scoreLabel}</div>
        </div>
        <div className={`flex flex-col items-end gap-1`}>
          <span className="text-3xl">{icon}</span>
          <span className={`
            px-3 py-1 rounded-full text-sm font-semibold border
            ${verdict.color} ${verdict.borderColor}
            bg-black/20
          `}>
            {verdict.label}
          </span>
        </div>
      </div>

      <p className={`text-sm font-medium mb-2 ${verdict.color}`}>{verdict.message}</p>
      <p className="text-xs text-gray-500 mb-3">{verdict.benchmark}</p>

      {verdict.delta && (
        <div className={`
          flex items-center gap-2 text-sm font-medium
          ${verdict.delta.change >= 0 ? 'text-green-400' : 'text-red-400'}
        `}>
          <span>{verdict.delta.change >= 0 ? '↑' : '↓'}</span>
          <span>
            Прошлый раз: {verdict.delta.previous} → Сейчас: {verdict.score}
            {' '}
            ({verdict.delta.change >= 0 ? '+' : ''}{verdict.delta.change},{' '}
            {verdict.delta.change >= 0 ? 'рост' : 'снижение'} {verdict.delta.percentChange}%)
          </span>
        </div>
      )}

      {extraStats && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {extraStats}
        </div>
      )}
    </div>
  )
}
