import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

interface MetronomeContextValue {
  bpm: number
  setBpm: (bpm: number) => void
  isPlaying: boolean
  remaining: number | null
  toggle: () => void
  start: () => void
  stop: () => void
  startWithDuration: (bpm: number, durationSeconds: number) => void
  panelOpen: boolean
  openPanel: (bpm?: number) => void
  closePanel: () => void
}

const MetronomeContext = createContext<MetronomeContextValue | null>(null)

export function useMetronome() {
  const ctx = useContext(MetronomeContext)
  if (!ctx) throw new Error('useMetronome must be used within MetronomeProvider')
  return ctx
}

export function MetronomeProvider({ children }: { children: React.ReactNode }) {
  const [bpm, _setBpm] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  const bpmRef = useRef(120)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number | null>(null)
  const nextNoteTimeRef = useRef(0)

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }

  function scheduleClick(time: number) {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 1000
    gain.gain.setValueAtTime(0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time)
    osc.stop(time + 0.05)
  }

  function scheduler() {
    const ctx = getAudioCtx()
    const lookahead = 0.1 // 100ms
    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      scheduleClick(nextNoteTimeRef.current)
      nextNoteTimeRef.current += 60.0 / bpmRef.current
    }
    timerRef.current = setTimeout(scheduler, 25)
  }

  const start = useCallback(() => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    nextNoteTimeRef.current = ctx.currentTime
    setIsPlaying(true)
    scheduler()
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    endTimeRef.current = null
    setRemaining(null)
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (isPlaying) stop()
    else start()
  }, [isPlaying, start, stop])

  const setBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(20, Math.min(300, newBpm))
    _setBpm(clamped)
    bpmRef.current = clamped
  }, [])

  const startWithDuration = useCallback((newBpm: number, durationSeconds: number) => {
    stop()
    setBpm(newBpm)
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    nextNoteTimeRef.current = ctx.currentTime
    setIsPlaying(true)
    setPanelOpen(true)

    endTimeRef.current = Date.now() + durationSeconds * 1000
    setRemaining(durationSeconds)

    countdownRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTimeRef.current! - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        stop()
      }
    }, 500)

    scheduler()
  }, [stop, setBpm])

  const openPanel = useCallback((initialBpm?: number) => {
    if (initialBpm !== undefined) {
      setBpm(initialBpm)
    }
    setPanelOpen(true)
  }, [setBpm])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  return (
    <MetronomeContext.Provider value={{ bpm, setBpm, isPlaying, remaining, toggle, start, stop, startWithDuration, panelOpen, openPanel, closePanel }}>
      {children}
    </MetronomeContext.Provider>
  )
}
