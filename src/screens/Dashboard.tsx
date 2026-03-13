import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import { EXERCISES } from '../exercises/types'
import { getCombinedVerdict, getSemanticVerdict, getPhoneticVerdict } from '../exercises/scoring'
import SkillsMap from '../components/SkillsMap'
import type { SubcategoryGroup, SkillData } from '../db/sessions'
import { getSubcategoryKey, getSubcategoryLabel } from '../db/sessions'

function getTodayStart(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function getTrend(scores: number[]): '↑' | '↓' | '→' | null {
  if (scores.length < 2) return null
  const last = scores[scores.length - 1]!
  const prev = scores[scores.length - 2]!
  if (last > prev) return '↑'
  if (last < prev) return '↓'
  return '→'
}

function getTrendColor(trend: '↑' | '↓' | '→' | null): string {
  if (trend === '↑') return 'text-green-400'
  if (trend === '↓') return 'text-red-400'
  return 'text-gray-500'
}

const EXERCISE_LABELS: Record<string, string> = {
  semantic: 'Семантическая беглость',
  phonetic: 'Фонетическая беглость',
  picnaming: 'Пикнейминг',
}

export default function Dashboard() {
  const navigate = useNavigate()

  const totalSessions = useLiveQuery(() => db.sessions.count(), [])

  const todaySessions = useLiveQuery(async () => {
    const today = getTodayStart()
    const all = await db.sessions.orderBy('date').reverse().toArray()
    return all.filter(s => new Date(s.date) >= today)
  }, [])

  // Grouped history: { exerciseId, key, label, scores[], mostRecentDate }
  const groupedHistory = useLiveQuery(async (): Promise<SubcategoryGroup[]> => {
    const sessions = await db.sessions.orderBy('date').reverse().toArray()
    const map = new Map<string, { scores: number[]; mostRecentDate: Date }>()
    const reversed = [...sessions].reverse()
    reversed.forEach(s => {
      const subKey = getSubcategoryKey(s)
      const mapKey = `${s.exerciseId}::${subKey}`
      if (!map.has(mapKey)) {
        map.set(mapKey, { scores: [], mostRecentDate: new Date(s.date) })
      }
      const entry = map.get(mapKey)!
      entry.scores.push(s.score)
      entry.mostRecentDate = new Date(s.date)
    })
    return Array.from(map.entries())
      .map(([mapKey, entry]) => {
        const sepIdx = mapKey.indexOf('::')
        const exerciseId = mapKey.slice(0, sepIdx)
        const subKey = mapKey.slice(sepIdx + 2)
        return {
          exerciseId,
          key: subKey,
          label: getSubcategoryLabel(exerciseId, subKey),
          scores: entry.scores.slice(-5),
          mostRecentDate: entry.mostRecentDate,
        }
      })
      .sort((a, b) => b.mostRecentDate.getTime() - a.mostRecentDate.getTime())
  }, [])

  // Skills map data
  const skillsData = useLiveQuery(async (): Promise<SkillData[]> => {
    const sessions = await db.sessions.orderBy('date').reverse().toArray()
    const map = new Map<string, { lastScore: number; count: number }>()
    sessions.forEach(s => {
      const subKey = getSubcategoryKey(s)
      const mapKey = `${s.exerciseId}::${subKey}`
      if (!map.has(mapKey)) {
        map.set(mapKey, { lastScore: s.score, count: 0 })
      }
      map.get(mapKey)!.count++
    })
    return Array.from(map.entries()).map(([mapKey, data]) => {
      const sepIdx = mapKey.indexOf('::')
      const exerciseId = mapKey.slice(0, sepIdx)
      const key = mapKey.slice(sepIdx + 2)
      return {
        exerciseId, key,
        label: getSubcategoryLabel(exerciseId, key),
        lastScore: data.lastScore,
        sessionCount: data.count,
      }
    })
  }, [])

  // Average scores per exercise type (mean of most recent per subcategory)
  const averages = useLiveQuery(async () => {
    const skills = await (async (): Promise<SkillData[]> => {
      const sessions = await db.sessions.orderBy('date').reverse().toArray()
      const map = new Map<string, number>()
      sessions.forEach(s => {
        const mapKey = `${s.exerciseId}::${getSubcategoryKey(s)}`
        if (!map.has(mapKey)) map.set(mapKey, s.score)
      })
      return Array.from(map.entries()).map(([k, score]) => {
        const sepIdx = k.indexOf('::')
        return {
          exerciseId: k.slice(0, sepIdx),
          key: k.slice(sepIdx + 2),
          label: '',
          lastScore: score,
          sessionCount: 1,
        }
      })
    })()

    const semanticScores = skills.filter(s => s.exerciseId === 'semantic').map(s => s.lastScore)
    const phoneticScores = skills.filter(s => s.exerciseId === 'phonetic').map(s => s.lastScore)

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null

    return {
      semantic: avg(semanticScores),
      semanticCount: semanticScores.length,
      phonetic: avg(phoneticScores),
      phoneticCount: phoneticScores.length,
    }
  }, [])

  // Combined verdict for today
  const combinedVerdict = (() => {
    if (!todaySessions || todaySessions.length < 2) return null
    const semantic = todaySessions.find(s => s.exerciseId === 'semantic')?.score
    const phonetic = todaySessions.find(s => s.exerciseId === 'phonetic')?.score
    const picSession = todaySessions.find(s => s.exerciseId === 'picnaming')
    const picnaming = picSession
      ? { correct: picSession.score, total: picSession.validCount + picSession.errorCount || picSession.score }
      : undefined
    if (!semantic && !phonetic) return null
    return getCombinedVerdict(semantic, phonetic, picnaming)
  })()

  // Group history by exerciseId for display
  const historyByExercise = (() => {
    if (!groupedHistory) return {}
    const result: Record<string, SubcategoryGroup[]> = {}
    groupedHistory.forEach(g => {
      if (!result[g.exerciseId]) result[g.exerciseId] = []
      result[g.exerciseId]!.push(g)
    })
    return result
  })()

  const hasAnyHistory = (groupedHistory?.length ?? 0) > 0

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Verbal Fluency</h1>
        <p className="text-gray-500 mt-1">Тренировка речевой беглости</p>
      </header>

      {/* Today's combined verdict */}
      {combinedVerdict && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Сводка за сегодня</div>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed mb-3">
            {combinedVerdict.summary}
          </pre>
          <p className="text-sm text-blue-400 font-medium">{combinedVerdict.recommendation}</p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalSessions ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Сессий</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{todaySessions?.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Сегодня</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {averages?.semantic ?? '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {averages?.semanticCount ? `Сем. ср. (${averages.semanticCount})` : 'Сем. ср.'}
          </div>
        </div>
      </div>

      {/* Average scores */}
      {(averages?.semantic || averages?.phonetic) && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {averages.semantic !== null && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">
                Семантика · среднее по {averages.semanticCount} кат.
              </div>
              <div className={`text-xl font-bold ${getSemanticVerdict(averages.semantic).color}`}>
                {averages.semantic} — {getSemanticVerdict(averages.semantic).label}
              </div>
            </div>
          )}
          {averages.phonetic !== null && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">
                Фонетика · среднее по {averages.phoneticCount} букв.
              </div>
              <div className={`text-xl font-bold ${getPhoneticVerdict(averages.phonetic).color}`}>
                {averages.phonetic} — {getPhoneticVerdict(averages.phonetic).label}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick exercise access */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Упражнения</h2>
        </div>
        <div className="grid gap-2">
          {EXERCISES.map(ex => {
            const doneToday = todaySessions?.some(s => s.exerciseId === ex.id)
            return (
              <button
                key={ex.id}
                onClick={() => navigate(`/exercise/${ex.id}/setup`)}
                className="
                  flex items-center gap-4 w-full text-left
                  bg-gray-900 hover:bg-gray-800
                  border border-gray-800 hover:border-gray-700
                  rounded-xl px-4 py-3
                  transition-all duration-200 active:scale-[0.98]
                "
              >
                <span className="text-xl">{ex.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{ex.title}</div>
                  <div className="text-xs text-gray-500">{ex.subtitle}</div>
                </div>
                {doneToday && (
                  <span className="text-xs text-green-500 font-medium">✓</span>
                )}
                <span className="text-gray-600">→</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Skills map */}
      {skillsData && skillsData.length > 0 && (
        <SkillsMap skills={skillsData} />
      )}

      {/* Grouped history */}
      {hasAnyHistory && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">История</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Вся история →
            </button>
          </div>

          <div className="space-y-4">
            {['semantic', 'phonetic', 'picnaming']
              .filter(exId => historyByExercise[exId]?.length)
              .map(exId => (
                <div key={exId} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <span className="text-sm font-semibold text-white">
                      {EXERCISE_LABELS[exId]}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-800/60">
                    {historyByExercise[exId]!.slice(0, 5).map(group => {
                      const trend = getTrend(group.scores)
                      const latest = group.scores[group.scores.length - 1]!
                      return (
                        <button
                          key={`${group.exerciseId}::${group.key}`}
                          onClick={() => navigate(`/history?exercise=${group.exerciseId}&sub=${encodeURIComponent(group.key)}`)}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
                        >
                          <div className="w-24 text-sm font-medium text-gray-300 shrink-0 truncate">
                            {group.label}
                          </div>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {group.scores.map((score, i) => (
                              <span
                                key={i}
                                className={`
                                  text-xs px-2 py-0.5 rounded-full font-medium
                                  ${i === group.scores.length - 1
                                    ? 'bg-white/10 text-white'
                                    : 'bg-gray-800 text-gray-400'
                                  }
                                `}
                              >
                                {score}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {trend && (
                              <span className={`text-base font-bold ${getTrendColor(trend)}`}>
                                {trend}
                              </span>
                            )}
                            <span className="text-lg font-bold text-white">{latest}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {!hasAnyHistory && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-gray-400 font-medium">Начни первую тренировку!</p>
          <p className="text-sm text-gray-600 mt-2">Карта навыков появится после первых результатов</p>
        </div>
      )}
    </div>
  )
}
