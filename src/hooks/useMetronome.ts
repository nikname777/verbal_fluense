import { useEffect, useRef, useState, useCallback } from 'react'

export function useMetronome(bpm: number, enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pulse, setPulse] = useState(false)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }, [])

  const playClick = useCallback(() => {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)

    setPulse(true)
    setTimeout(() => setPulse(false), 100)
  }, [getAudioCtx])

  useEffect(() => {
    if (!enabled || bpm <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const interval = (60 / bpm) * 1000

    const tick = () => {
      playClick()
      timeoutRef.current = setTimeout(tick, interval)
    }

    playClick()
    timeoutRef.current = setTimeout(tick, interval)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [bpm, enabled, playClick])

  return { pulse }
}
