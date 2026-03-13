import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(duration: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setTimeLeft(duration)
    setIsRunning(true)
  }, [duration])

  const pause = useCallback(() => {
    setIsRunning(false)
    clear()
  }, [clear])

  const resume = useCallback(() => {
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(duration)
    clear()
  }, [duration, clear])

  useEffect(() => {
    if (!isRunning) {
      clear()
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clear()
          setIsRunning(false)
          onCompleteRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clear
  }, [isRunning, clear])

  const progress = timeLeft / duration

  return { timeLeft, isRunning, progress, start, pause, resume, stop }
}
