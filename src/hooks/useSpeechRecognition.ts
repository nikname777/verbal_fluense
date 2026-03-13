import { useState, useRef, useCallback } from 'react'

export interface RecognizedWord {
  text: string
  timestamp: number
  isFinal: boolean
}

interface SpeechRecognitionResult {
  transcript: string
  words: RecognizedWord[]
  isListening: boolean
  error: string | null
  isSupported: boolean
  start: () => void
  stop: () => void
  reset: () => void
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export function useSpeechRecognition(
  onWord?: (word: RecognizedWord) => void
): SpeechRecognitionResult {
  const [words, setWords] = useState<RecognizedWord[]>([])
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onWordRef = useRef(onWord)
  onWordRef.current = onWord

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Распознавание речи не поддерживается в этом браузере')
      return
    }

    setError(null)
    setWords([])

    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionApi()

    recognition.lang = 'ru-RU'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      if (recognitionRef.current) {
        try {
          recognition.start()
        } catch {
          // already stopped
        }
      }
    }
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech') return
      if (e.error === 'aborted') return
      setError(
        e.error === 'not-allowed'
          ? 'Нет доступа к микрофону. Разрешите доступ в настройках браузера.'
          : `Ошибка: ${e.error}`
      )
    }

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const transcript = result[0]?.transcript?.trim() ?? ''
        if (!transcript) continue

        if (result.isFinal) {
          const rawWords = transcript.split(/\s+/).filter(Boolean)
          rawWords.forEach(w => {
            const word: RecognizedWord = {
              text: w.toLowerCase(),
              timestamp: Date.now(),
              isFinal: true,
            }
            setWords(prev => [...prev, word])
            onWordRef.current?.(word)
          })
        }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (err) {
      setError('Не удалось запустить распознавание речи')
      console.error(err)
    }
  }, [isSupported])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    setWords([])
    setError(null)
  }, [])

  const transcript = words
    .filter(w => w.isFinal)
    .map(w => w.text)
    .join(' ')

  return { transcript, words, isListening, error, isSupported, start, stop, reset }
}
