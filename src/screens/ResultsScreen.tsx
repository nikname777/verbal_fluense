import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import WordChip from '../components/WordChip'
import VerdictCard from '../components/VerdictCard'
import { saveSession, getPrevScoreForSubcategory } from '../db/sessions'
import { getSemanticVerdict, getPhoneticVerdict } from '../exercises/scoring'
import type { Verdict } from '../exercises/scoring'
import type { WordResult } from '../exercises/types'

interface SessionResult {
  exerciseId: string
  date: string
  duration: number
  params: Record<string, unknown>
  words: string[]
  wordResults: WordResult[]
  validCount: number
  pendingCount: number
  errorCount: number
  confirmedCount: number
  score: number
  errors: Array<{ word: string; reason: string }>
}

export default function ResultsScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [result, setResult] = useState<SessionResult | null>(null)
  const [wordResults, setWordResults] = useState<WordResult[]>([])
  const [prevScore, setPrevScore] = useState<number | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(`session_result_${id}`)
    if (!raw) {
      navigate(`/exercise/${id}/setup`)
      return
    }
    const data: SessionResult = JSON.parse(raw)
    setResult(data)
    setWordResults(data.wordResults ?? [])

    // Compare only within the same subcategory
    const p = data.params as Record<string, unknown>
    let subKey = ''
    if (data.exerciseId === 'semantic') subKey = String(p.category ?? '')
    if (data.exerciseId === 'phonetic') subKey = String(p.letter ?? '')

    getPrevScoreForSubcategory(data.exerciseId, subKey).then(score => {
      setPrevScore(score)
    })
  }, [id, navigate])

  const doSave = useCallback(async () => {
    if (!result) return
    const valid = wordResults.filter(w => w.status === 'valid').length
    const pending = wordResults.filter(w => w.status === 'pending').length
    const error = wordResults.filter(w => w.status === 'error').length
    await saveSession({
      exerciseId: result.exerciseId,
      date: new Date(result.date),
      duration: result.duration,
      params: result.params,
      words: wordResults.map(w => w.text),
      validCount: valid,
      pendingCount: pending,
      errorCount: error,
      confirmedCount: valid,
      score: valid,
      errors: wordResults
        .filter(w => w.status === 'error')
        .map(w => ({ word: w.text, reason: w.errorReason ?? '' })),
    })
  }, [result, wordResults])

  const handleNavigate = useCallback(async (path: string) => {
    if (isSaving) return
    setIsSaving(true)
    await doSave()
    navigate(path)
  }, [isSaving, doSave, navigate])

  const handleTogglePending = (index: number, confirm: boolean) => {
    setWordResults(prev =>
      prev.map((w, i) =>
        i === index ? { ...w, status: confirm ? 'valid' : 'error' } : w
      )
    )
  }

  if (!result) return null

  const validCount = wordResults.filter(w => w.status === 'valid').length
  const pendingCount = wordResults.filter(w => w.status === 'pending').length
  const errorCount = wordResults.filter(w => w.status === 'error').length
  const score = validCount

  const verdict: Verdict = result.exerciseId === 'phonetic'
    ? getPhoneticVerdict(score, prevScore)
    : getSemanticVerdict(score, prevScore)

  const p = result.params as Record<string, unknown>
  const subcategoryLabel = result.exerciseId === 'semantic'
    ? String(p.category ?? '')
    : result.exerciseId === 'phonetic'
      ? `Буква ${String(p.letter ?? '')}`
      : ''

  const scoreLabel = subcategoryLabel
    ? `слов · ${subcategoryLabel}`
    : `слов за ${result.duration} сек`

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 max-w-2xl mx-auto">
      <VerdictCard verdict={verdict} scoreLabel={scoreLabel} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{validCount}</div>
          <div className="text-xs text-green-600 mt-1">Верно</div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
          <div className="text-xs text-yellow-600 mt-1">Под вопросом</div>
        </div>
        <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{errorCount}</div>
          <div className="text-xs text-red-600 mt-1">Ошибки</div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-4 mb-5">
          <p className="text-sm text-yellow-400 font-medium mb-1">
            Жёлтые слова — нажми ✓ чтобы засчитать, ✗ чтобы отклонить
          </p>
          <p className="text-xs text-yellow-700">
            Слово не в словаре, но может быть правильным — ты знаешь лучше
          </p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">
          Все слова ({wordResults.length})
        </h2>
        {wordResults.length === 0 ? (
          <p className="text-gray-600 text-sm">Слова не были распознаны</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {wordResults.map((w, i) => (
              <div key={`${w.text}-${i}`} className="flex items-center gap-1">
                <WordChip
                  word={w.text}
                  status={w.status}
                  errorReason={w.errorReason}
                  index={i}
                />
                {w.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleTogglePending(i, true)}
                      className="w-7 h-7 rounded-full bg-green-900/60 text-green-400 text-sm hover:bg-green-800 flex items-center justify-center transition-colors"
                      title="Засчитать"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleTogglePending(i, false)}
                      className="w-7 h-7 rounded-full bg-red-900/60 text-red-400 text-sm hover:bg-red-800 flex items-center justify-center transition-colors"
                      title="Отклонить"
                    >
                      ✗
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleNavigate(`/exercise/${id}/train`)}
          disabled={isSaving}
          className="py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium transition-all text-sm"
        >
          Ещё раз
        </button>
        <button
          onClick={() => handleNavigate(`/exercise/${id}/setup`)}
          disabled={isSaving}
          className="py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium transition-all text-sm"
        >
          Параметры
        </button>
        <button
          onClick={() => handleNavigate('/')}
          disabled={isSaving}
          className="py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-all text-sm"
        >
          {isSaving ? 'Сохраняю...' : 'Главная'}
        </button>
      </div>
    </div>
  )
}
