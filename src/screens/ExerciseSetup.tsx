import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CATEGORY_NAMES } from '../exercises/categories'
import { EXERCISES } from '../exercises/types'
import type { ExerciseParams } from '../exercises/types'

const RUSSIAN_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')

const DURATION_OPTIONS = [
  { label: '30 сек', value: 30 },
  { label: '45 сек', value: 45 },
  { label: '60 сек', value: 60 },
  { label: '90 сек', value: 90 },
]

const SPEED_OPTIONS = [
  { label: '0.5 сек', value: 0.5 },
  { label: '1 сек', value: 1 },
  { label: '1.5 сек', value: 1.5 },
  { label: '2 сек', value: 2 },
  { label: '3 сек', value: 3 },
]

const IMAGE_COUNT_OPTIONS = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '30', value: 30 },
  { label: '50', value: 50 },
  { label: 'Все', value: 999 },
]

export default function ExerciseSetup() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const exercise = EXERCISES.find(e => e.id === id)

  const [params, setParams] = useState<ExerciseParams>({
    category: CATEGORY_NAMES[0],
    letter: 'А',
    duration: 60,
    bpmEnabled: true,
    bpm: 60,
    speed: 1,
    imageCount: 20,
  })

  if (!exercise) {
    navigate('/')
    return null
  }

  const handleStart = () => {
    const stored = JSON.stringify(params)
    sessionStorage.setItem(`exercise_params_${id}`, stored)
    navigate(`/exercise/${id}/train`)
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8 max-w-lg mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/exercises')} className="text-gray-400 hover:text-white">
          ← Назад
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{exercise.title}</h1>
          <p className="text-sm text-gray-500">{exercise.subtitle}</p>
        </div>
      </header>

      <div className="space-y-6">
        {exercise.type === 'semantic' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Категория</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_NAMES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setParams(p => ({ ...p, category: cat }))}
                  className={`
                    px-4 py-3 rounded-xl text-sm font-medium text-left
                    border transition-all duration-150
                    ${params.category === cat
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'phonetic' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Буква</label>
            <div className="grid grid-cols-8 gap-1.5">
              {RUSSIAN_ALPHABET.map(letter => (
                <button
                  key={letter}
                  onClick={() => setParams(p => ({ ...p, letter }))}
                  className={`
                    h-10 rounded-lg text-sm font-medium
                    border transition-all duration-150
                    ${params.letter === letter
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }
                  `}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'picnaming' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Скорость показа</label>
              <div className="flex gap-2 flex-wrap">
                {SPEED_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setParams(p => ({ ...p, speed: opt.value }))}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium
                      border transition-all duration-150
                      ${params.speed === opt.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Количество картинок</label>
              <div className="flex gap-2 flex-wrap">
                {IMAGE_COUNT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setParams(p => ({ ...p, imageCount: opt.value }))}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium
                      border transition-all duration-150
                      ${params.imageCount === opt.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(exercise.type === 'semantic' || exercise.type === 'phonetic') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Длительность</label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setParams(p => ({ ...p, duration: opt.value }))}
                    className={`
                      flex-1 py-2.5 rounded-xl text-sm font-medium
                      border transition-all duration-150
                      ${params.duration === opt.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300">Метроном</label>
                <button
                  onClick={() => setParams(p => ({ ...p, bpmEnabled: !p.bpmEnabled }))}
                  className={`
                    w-12 h-6 rounded-full transition-all duration-200 relative
                    ${params.bpmEnabled ? 'bg-blue-600' : 'bg-gray-700'}
                  `}
                >
                  <span className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200
                    ${params.bpmEnabled ? 'left-7' : 'left-1'}
                  `} />
                </button>
              </div>
              {params.bpmEnabled && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>30 bpm</span>
                    <span className="text-blue-400 font-medium">{params.bpm} bpm</span>
                    <span>120 bpm</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={120}
                    value={params.bpm}
                    onChange={e => setParams(p => ({ ...p, bpm: Number(e.target.value) }))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={handleStart}
          className="
            w-full py-4 rounded-2xl
            bg-blue-600 hover:bg-blue-500
            text-white text-lg font-semibold
            transition-all duration-200 active:scale-[0.98]
            shadow-lg shadow-blue-900/50
          "
        >
          Начать →
        </button>
      </div>
    </div>
  )
}
