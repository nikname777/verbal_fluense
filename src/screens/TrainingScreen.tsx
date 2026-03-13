import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Timer from '../components/Timer'
import WordChip from '../components/WordChip'
import RecordingIndicator from '../components/RecordingIndicator'
import MetronomeIndicator from '../components/MetronomeIndicator'
import { useTimer } from '../hooks/useTimer'
import { useMetronome } from '../hooks/useMetronome'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { validateSemanticWord, validatePhoneticWord } from '../exercises/validators'
import { EXERCISES } from '../exercises/types'
import type { ExerciseParams, WordResult } from '../exercises/types'

type Phase = 'countdown' | 'training' | 'done'

function playEndSound() {
  try {
    const ctx = new AudioContext()
    const tones = [523, 659, 784]
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.start(t)
      osc.stop(t + 0.3)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    // Web Audio not available
  }
}

export default function TrainingScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const exercise = EXERCISES.find(e => e.id === id)
  const params = useMemo<ExerciseParams>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`exercise_params_${id}`) ?? '{}')
    } catch {
      return {}
    }
  }, [id])

  const duration = params.duration ?? 60
  const [phase, setPhase] = useState<Phase>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [wordResults, setWordResults] = useState<WordResult[]>([])
  const wordResultsRef = useRef<WordResult[]>([])
  wordResultsRef.current = wordResults

  const timer = useTimer(duration)
  const { pulse } = useMetronome(params.bpm ?? 60, phase === 'training' && (params.bpmEnabled ?? false))

  const handleComplete = useCallback(() => {
    setPhase('done')
    const results = wordResultsRef.current
    const validCount = results.filter(w => w.status === 'valid').length
    const pendingCount = results.filter(w => w.status === 'pending').length
    const errorCount = results.filter(w => w.status === 'error').length
    const score = validCount

    const sessionData = {
      exerciseId: id ?? '',
      date: new Date(),
      duration,
      params: params as Record<string, unknown>,
      words: results.map(w => w.text),
      validCount,
      pendingCount,
      errorCount,
      confirmedCount: 0,
      score,
      errors: results
        .filter(w => w.status === 'error')
        .map(w => ({ word: w.text, reason: w.errorReason ?? '' })),
    }

    sessionStorage.setItem(`session_result_${id}`, JSON.stringify({
      ...sessionData,
      wordResults: results,
    }))

    navigate(`/exercise/${id}/results`)
  }, [id, duration, navigate, params])

  useEffect(() => {
    if (phase === 'training' && timer.timeLeft === 0 && !timer.isRunning) {
      playEndSound()
      handleComplete()
    }
  }, [timer.timeLeft, timer.isRunning, phase, handleComplete])

  const { isListening, error, start: startSpeech, stop: stopSpeech } = useSpeechRecognition(
    useCallback((word) => {
      if (phase !== 'training') return
      const prev = wordResultsRef.current.map(w => w.text)

      let validation: { status: WordResult['status']; errorReason?: string }

      if (exercise?.type === 'semantic') {
        validation = validateSemanticWord(word.text, params.category ?? '', prev)
      } else if (exercise?.type === 'phonetic') {
        validation = validatePhoneticWord(word.text, params.letter ?? 'А', prev)
      } else {
        validation = { status: 'valid' }
      }

      const result: WordResult = {
        text: word.text,
        timestamp: word.timestamp,
        status: validation.status,
        errorReason: validation.errorReason,
      }

      setWordResults(prev => [...prev, result])
    }, [phase, exercise?.type, params.category, params.letter])
  )

  useEffect(() => {
    if (phase === 'countdown') {
      const interval = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(interval)
            setPhase('training')
            return 0
          }
          return c - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'training') {
      startSpeech()
      timer.start()
    }
    if (phase === 'done') {
      stopSpeech()
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const wordsZoneRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (wordsZoneRef.current) {
      wordsZoneRef.current.scrollTop = wordsZoneRef.current.scrollHeight
    }
  }, [wordResults])

  if (!exercise) return null

  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-6 text-lg">{exercise.title}</p>
          {exercise.type === 'semantic' && params.category && (
            <p className="text-blue-400 mb-8 text-xl font-semibold">Категория: {params.category}</p>
          )}
          {exercise.type === 'phonetic' && params.letter && (
            <p className="text-blue-400 mb-8 text-xl font-semibold">Буква: {params.letter}</p>
          )}
          <div
            key={countdown}
            className="text-9xl font-bold text-white animate-ping-once"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >
            {countdown}
          </div>
          <p className="text-gray-500 mt-8">Приготовьтесь говорить...</p>
        </div>
        <style>{`
          @keyframes scaleIn {
            from { transform: scale(1.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  const wordCount = wordResults.length
  const validCount = wordResults.filter(w => w.status === 'valid').length
  const pendingCount = wordResults.filter(w => w.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-3">
            <RecordingIndicator isListening={isListening} />
            <MetronomeIndicator
              pulse={pulse}
              enabled={params.bpmEnabled ?? false}
              bpm={params.bpm ?? 60}
            />
          </div>
          <div className="text-sm text-gray-500">
            {exercise.type === 'semantic' && params.category}
            {exercise.type === 'phonetic' && `Буква «${params.letter}»`}
          </div>
        </div>

        <Timer
          timeLeft={timer.timeLeft}
          duration={duration}
          progress={timer.progress}
          size={180}
        />

        {error && (
          <div className="mt-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div
          ref={wordsZoneRef}
          className="
            flex-1 w-full mt-6 overflow-y-auto
            bg-gray-900/50 rounded-2xl p-4
            min-h-[200px] max-h-[300px]
          "
        >
          {wordResults.length === 0 ? (
            <p className="text-gray-600 text-center mt-8">Говорите слова...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {wordResults.map((w, i) => (
                <WordChip
                  key={`${w.text}-${w.timestamp}`}
                  word={w.text}
                  status={w.status}
                  errorReason={w.errorReason}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between w-full mt-4 px-2">
          <div className="flex gap-4 text-sm">
            <span className="text-white font-bold">{wordCount} слов</span>
            {validCount > 0 && <span className="text-green-400">{validCount} ✓</span>}
            {pendingCount > 0 && <span className="text-yellow-400">{pendingCount} ?</span>}
          </div>
          <button
            onClick={handleComplete}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Завершить
          </button>
        </div>
      </div>
    </div>
  )
}
