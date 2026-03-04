import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMetronome } from '../lib/metronome'

export function Metronome() {
  const { bpm, setBpm, isPlaying, remaining, toggle, panelOpen, closePanel } = useMetronome()
  const [tapTimes, setTapTimes] = useState<number[]>([])
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTap = useCallback(() => {
    const now = Date.now()

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)
    tapTimeoutRef.current = setTimeout(() => setTapTimes([]), 3000)

    setTapTimes((prev) => {
      const recent = [...prev, now].filter((t) => now - t < 3000)
      if (recent.length >= 2) {
        const intervals: number[] = []
        for (let i = 1; i < recent.length; i++) {
          intervals.push(recent[i] - recent[i - 1])
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
        const tappedBpm = Math.round(60000 / avg)
        setBpm(tappedBpm)
      }
      return recent
    })
  }, [setBpm])

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-20 right-6 z-50 w-64 rounded-xl border border-border bg-surface p-4 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Metronome</span>
            <button
              onClick={closePanel}
              className="rounded p-0.5 text-text-tertiary hover:text-text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          <div className="mb-4 text-center">
            <span className="font-mono text-4xl font-bold text-text-primary">{bpm}</span>
            <span className="ml-1 text-sm text-text-tertiary">bpm</span>
            {remaining !== null && (
              <div className="mt-1 font-mono text-sm text-amber-400">
                {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')} remaining
              </div>
            )}
          </div>

          <div className="mb-3 flex items-center justify-center gap-1.5">
            <BpmButton label="-5" onClick={() => setBpm(bpm - 5)} />
            <BpmButton label="-1" onClick={() => setBpm(bpm - 1)} />
            <BpmButton label="+1" onClick={() => setBpm(bpm + 1)} />
            <BpmButton label="+5" onClick={() => setBpm(bpm + 5)} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggle}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                isPlaying
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-accent text-black hover:bg-accent-hover'
              }`}
            >
              {isPlaying ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={handleTap}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
            >
              Tap
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BpmButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
    >
      {label}
    </button>
  )
}
