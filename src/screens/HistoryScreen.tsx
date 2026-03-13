import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import { getSubcategoryKey, getSubcategoryLabel } from '../db/sessions'
import type { Session } from '../db'

const EXERCISE_OPTIONS = [
  { value: '', label: 'Все упражнения' },
  { value: 'semantic', label: 'Семантическая беглость' },
  { value: 'phonetic', label: 'Фонетическая беглость' },
  { value: 'picnaming', label: 'Пикнейминг' },
]

function ScoreBadge({ score, exerciseId }: { score: number; exerciseId: string }) {
  let color = 'text-blue-400'
  if (exerciseId === 'semantic') {
    if (score >= 22) color = 'text-green-400'
    else if (score >= 13) color = 'text-yellow-400'
    else color = 'text-red-400'
  } else if (exerciseId === 'phonetic') {
    if (score >= 15) color = 'text-green-400'
    else if (score >= 11) color = 'text-yellow-400'
    else color = 'text-red-400'
  }
  return <span className={`text-2xl font-bold tabular-nums ${color}`}>{score}</span>
}

function SessionRow({ session }: { session: Session }) {
  const subKey = getSubcategoryKey(session)
  const subLabel = getSubcategoryLabel(session.exerciseId, subKey)

  const EXERCISE_ICONS: Record<string, string> = {
    semantic: '🧠',
    phonetic: '🔤',
    picnaming: '🖼️',
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/30 transition-colors">
      <span className="text-xl shrink-0">
        {EXERCISE_ICONS[session.exerciseId] ?? '📊'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">
          {subLabel || 'Пикнейминг'}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {new Date(session.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {' · '}
          {session.duration} сек
        </div>
        {session.validCount > 0 && (
          <div className="flex gap-3 mt-1 text-xs">
            <span className="text-green-500">{session.validCount} верно</span>
            {session.pendingCount > 0 && (
              <span className="text-yellow-500">{session.pendingCount} ?</span>
            )}
            {session.errorCount > 0 && (
              <span className="text-red-500">{session.errorCount} ошиб.</span>
            )}
          </div>
        )}
      </div>
      <ScoreBadge score={session.score} exerciseId={session.exerciseId} />
    </div>
  )
}

export default function HistoryScreen() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const filterExercise = searchParams.get('exercise') ?? ''
  const filterSub = searchParams.get('sub') ?? ''

  const allSessions = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().toArray(),
    []
  )

  // Derive available subcategory options from actual data
  const subcategoryOptions = useMemo(() => {
    if (!allSessions) return []
    const pool = filterExercise
      ? allSessions.filter(s => s.exerciseId === filterExercise)
      : allSessions
    const seen = new Map<string, string>()
    pool.forEach(s => {
      const key = getSubcategoryKey(s)
      if (key && !seen.has(key)) {
        seen.set(key, getSubcategoryLabel(s.exerciseId, key))
      }
    })
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  }, [allSessions, filterExercise])

  const filtered = useMemo((): Session[] => {
    if (!allSessions) return []
    return allSessions.filter(s => {
      if (filterExercise && s.exerciseId !== filterExercise) return false
      if (filterSub && getSubcategoryKey(s) !== filterSub) return false
      return true
    })
  }, [allSessions, filterExercise, filterSub])

  // Compute per-subcategory stats for the current filter
  const subStats = useMemo(() => {
    if (filtered.length === 0) return null
    const scores = filtered.map(s => s.score)
    return {
      count: filtered.length,
      best: Math.max(...scores),
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      last: scores[0] ?? 0,
    }
  }, [filtered])

  const setFilter = (key: 'exercise' | 'sub', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    // Reset sub when exercise changes
    if (key === 'exercise') next.delete('sub')
    setSearchParams(next)
  }

  const currentExerciseLabel = EXERCISE_OPTIONS.find(o => o.value === filterExercise)?.label ?? ''
  const currentSubLabel = subcategoryOptions.find(o => o.value === filterSub)?.label ?? ''

  return (
    <div className="min-h-screen bg-gray-950 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-4 z-10">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-white flex-1">История тренировок</h1>
            <span className="text-sm text-gray-500">{filtered.length} сессий</span>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterExercise}
              onChange={e => setFilter('exercise', e.target.value)}
              className="
                bg-gray-800 border border-gray-700 text-gray-200 text-sm
                rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500
                appearance-none cursor-pointer
              "
            >
              {EXERCISE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {filterExercise && subcategoryOptions.length > 0 && (
              <select
                value={filterSub}
                onChange={e => setFilter('sub', e.target.value)}
                className="
                  bg-gray-800 border border-gray-700 text-gray-200 text-sm
                  rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500
                  appearance-none cursor-pointer flex-1
                "
              >
                <option value="">Все подкатегории</option>
                {subcategoryOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Active filter chips */}
          {(filterExercise || filterSub) && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {filterExercise && (
                <span className="flex items-center gap-1 text-xs bg-blue-900/50 border border-blue-700/50 text-blue-300 px-2.5 py-1 rounded-full">
                  {currentExerciseLabel}
                  <button onClick={() => setFilter('exercise', '')} className="hover:text-white ml-0.5">✕</button>
                </span>
              )}
              {filterSub && (
                <span className="flex items-center gap-1 text-xs bg-purple-900/50 border border-purple-700/50 text-purple-300 px-2.5 py-1 rounded-full">
                  {currentSubLabel}
                  <button onClick={() => setFilter('sub', '')} className="hover:text-white ml-0.5">✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats for current selection */}
        {subStats && filtered.length >= 2 && (
          <div className="grid grid-cols-3 gap-3 px-4 py-4">
            {[
              { label: 'Тренировок', value: subStats.count },
              { label: 'Лучший', value: subStats.best },
              { label: 'Среднее', value: subStats.avg },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sessions list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <div className="text-4xl mb-3">📭</div>
            <p>Нет тренировок для этого фильтра</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl mx-4 mt-2 divide-y divide-gray-800/60 overflow-hidden">
            {filtered.map(session => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
