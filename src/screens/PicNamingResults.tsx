import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import VerdictCard from '../components/VerdictCard'
import { saveSession, getRecentSessions } from '../db/sessions'
import { getPicNamingVerdict } from '../exercises/scoring'

interface WordLog {
  imageIndex: number
  word: string
  timestamp: number
}

interface ImageEntry {
  filename: string
  name: string
  synonyms: string[]
}

interface PicResult {
  images: string[]
  wordLog: WordLog[]
  picMap: Record<string, ImageEntry>
  duration: number
  params: Record<string, unknown>
}

function checkAnswer(said: string, entry: ImageEntry | undefined): boolean {
  if (!entry) return false
  const w = said.trim().toLowerCase()
  return (
    w === entry.name.toLowerCase() ||
    entry.synonyms.some(s => s.toLowerCase() === w)
  )
}

export default function PicNamingResults() {
  const navigate = useNavigate()
  const [result, setResult] = useState<PicResult | null>(null)
  const [prevScore, setPrevScore] = useState<number | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('session_result_picnaming')
    if (!raw) {
      navigate('/exercise/picnaming/setup')
      return
    }
    const data: PicResult = JSON.parse(raw)
    setResult(data)

    getRecentSessions('picnaming', 1).then(sessions => {
      if (sessions.length > 0) {
        setPrevScore(sessions[0]!.score)
      }
    })
  }, [navigate])

  const doSave = useCallback(async (correctCount: number, total: number) => {
    if (!result) return
    await saveSession({
      exerciseId: 'picnaming',
      date: new Date(),
      duration: result.duration ?? 0,
      params: result.params ?? {},
      words: result.wordLog.map(w => w.word),
      validCount: correctCount,
      pendingCount: 0,
      errorCount: total - correctCount,
      confirmedCount: correctCount,
      score: correctCount,
      errors: [],
    })
  }, [result])

  const handleNavigate = useCallback(async (path: string, correctCount: number, total: number) => {
    if (isSaving) return
    setIsSaving(true)
    await doSave(correctCount, total)
    navigate(path)
  }, [isSaving, doSave, navigate])

  if (!result) return null

  const rows = result.images.map((filename, idx) => {
    const wordsForImage = result.wordLog.filter(w => w.imageIndex === idx)
    const said = wordsForImage.map(w => w.word).join(', ')
    const entry = result.picMap[filename]
    const correct = wordsForImage.some(w => checkAnswer(w.word, entry))
    return { filename, idx, said, correct, expected: entry?.name ?? '?' }
  })

  const correctCount = rows.filter(r => r.correct).length
  const total = rows.length

  const verdict = getPicNamingVerdict(correctCount, total, prevScore)

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 max-w-2xl mx-auto">
      <VerdictCard
        verdict={verdict}
        scoreLabel={`из ${total} картинок`}
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{correctCount}</div>
          <div className="text-xs text-green-600 mt-1">Правильно</div>
        </div>
        <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{total - correctCount}</div>
          <div className="text-xs text-red-600 mt-1">Ошибки / пропуски</div>
        </div>
      </div>

      {Object.keys(result.picMap).length === 0 && (
        <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 mb-5">
          <p className="text-sm text-blue-400">
            Маппинг картинок не загружен — проверка недоступна.
            Речь записана, слова отображены ниже.
          </p>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
        <div className="grid grid-cols-4 gap-0 px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500 font-medium">
          <span>Картинка</span>
          <span>Правильно</span>
          <span>Вы сказали</span>
          <span className="text-center">Итог</span>
        </div>
        <div className="divide-y divide-gray-800/50 max-h-[50vh] overflow-y-auto">
          {rows.map(row => (
            <div key={row.idx} className="grid grid-cols-4 gap-0 px-4 py-3 items-center">
              <img
                src={`/images/${row.filename}`}
                alt=""
                className="w-10 h-10 object-contain opacity-70"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="text-sm text-gray-300">{row.expected}</span>
              <span className="text-sm text-gray-400 truncate pr-2">{row.said || '—'}</span>
              <span className={`text-center text-lg ${row.correct ? 'text-green-400' : 'text-red-400'}`}>
                {row.correct ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleNavigate('/exercise/picnaming/train', correctCount, total)}
          disabled={isSaving}
          className="py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium transition-all text-sm"
        >
          Ещё раз
        </button>
        <button
          onClick={() => handleNavigate('/exercise/picnaming/setup', correctCount, total)}
          disabled={isSaving}
          className="py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-medium transition-all text-sm"
        >
          Параметры
        </button>
        <button
          onClick={() => handleNavigate('/', correctCount, total)}
          disabled={isSaving}
          className="py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-all text-sm"
        >
          {isSaving ? 'Сохраняю...' : 'Главная'}
        </button>
      </div>
    </div>
  )
}
