import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import RecordingIndicator from '../components/RecordingIndicator'

interface ImageEntry {
  filename: string
  name: string
  synonyms: string[]
}

interface WordLog {
  imageIndex: number
  word: string
  timestamp: number
}

type Phase = 'countdown' | 'training' | 'done'

export default function PicNaming() {
  const navigate = useNavigate()

  const params = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('exercise_params_picnaming') ?? '{}')
    } catch {
      return {}
    }
  })()

  const speed: number = params.speed ?? 1
  const imageCountParam: number = params.imageCount ?? 20

  const [images, setImages] = useState<string[]>([])
  const [picMap, setPicMap] = useState<Record<string, ImageEntry>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [wordLog, setWordLog] = useState<WordLog[]>([])
  const currentIndexRef = useRef(0)
  currentIndexRef.current = currentIndex

  useEffect(() => {
    fetch('/picnaming-map.json')
      .then(r => r.json())
      .then((data: Record<string, ImageEntry>) => setPicMap(data))
      .catch(() => setPicMap({}))
  }, [])

  useEffect(() => {
    const allImages = Object.keys(picMap).length > 0
      ? Object.keys(picMap)
      : Array.from({ length: 20 }, (_, i) => `image_${i + 1}.png`)

    const shuffled = [...allImages].sort(() => Math.random() - 0.5)
    setImages(shuffled.slice(0, Math.min(imageCountParam, shuffled.length)))
  }, [picMap, imageCountParam])

  const { isListening, start: startSpeech, stop: stopSpeech } = useSpeechRecognition(
    useCallback((word) => {
      setWordLog(prev => [...prev, {
        imageIndex: currentIndexRef.current,
        word: word.text,
        timestamp: word.timestamp,
      }])
    }, [])
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
    if (phase !== 'training' || images.length === 0) return

    startSpeech()

    const intervalMs = speed * 1000
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1
        if (next >= images.length) {
          clearInterval(interval)
          stopSpeech()
          setPhase('done')
          return prev
        }
        return next
      })
    }, intervalMs)

    return () => clearInterval(interval)
  }, [phase, images, speed, startSpeech, stopSpeech])

  useEffect(() => {
    if (phase === 'done') {
      const resultData = {
        exerciseId: 'picnaming',
        date: new Date().toISOString(),
        duration: Math.round(images.length * speed),
        params: params as Record<string, unknown>,
        images,
        wordLog,
        picMap,
      }
      sessionStorage.setItem('session_result_picnaming', JSON.stringify(resultData))
      navigate('/exercise/picnaming/results')
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-8 text-lg">Пикнейминг</p>
        <div
          key={countdown}
          className="text-9xl font-bold text-white"
          style={{ animation: 'scaleIn 0.3s ease-out' }}
        >
          {countdown}
        </div>
        <p className="text-gray-500 mt-8">Называйте картинки вслух</p>
        <style>{`@keyframes scaleIn { from { transform: scale(1.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Загрузка картинок...
      </div>
    )
  }

  const currentImage = images[currentIndex]
  const progress = (currentIndex + 1) / images.length

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-between px-4 py-8">
      <div className="flex items-center justify-between w-full max-w-lg">
        <RecordingIndicator isListening={isListening} />
        <span className="text-gray-400 text-sm">{currentIndex + 1} / {images.length}</span>
        <button
          onClick={() => {
            stopSpeech()
            setPhase('done')
          }}
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          Стоп
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-lg">
        <div
          key={currentImage}
          className="w-full"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <img
            src={`/images/${currentImage}`}
            alt="Назовите картинку"
            className="max-h-[60vh] max-w-full mx-auto object-contain filter brightness-90"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}
