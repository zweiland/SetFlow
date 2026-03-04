import { createContext, useContext, useState, useRef, useCallback } from 'react'

interface MetronomeContextValue {
  bpm: number
  setBpm: (bpm: number) => void
  isPlaying: boolean
  toggle: () => void
  start: () => void
  stop: () => void
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

  const bpmRef = useRef(120)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    <MetronomeContext.Provider value={{ bpm, setBpm, isPlaying, toggle, start, stop, panelOpen, openPanel, closePanel }}>
      {children}
    </MetronomeContext.Provider>
  )
}
