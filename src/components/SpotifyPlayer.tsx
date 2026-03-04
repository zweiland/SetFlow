import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpotify } from '../lib/spotify'

export function SpotifyPlayer() {
  const { playback, pause, resume, seek } = useSpotify()
  const [position, setPosition] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  // Track position locally for smooth progress
  useEffect(() => {
    if (playback) {
      setPosition(playback.position)
    }
  }, [playback])

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (playback && !playback.paused) {
      intervalRef.current = setInterval(() => {
        setPosition((p) => Math.min(p + 500, playback.duration))
      }, 500)
    }
    return () => clearInterval(intervalRef.current)
  }, [playback])

  function formatMs(ms: number): string {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!playback) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const ms = Math.floor(pct * playback.duration)
    seek(ms)
    setPosition(ms)
  }

  return (
    <AnimatePresence>
      {playback && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
            {/* Album art */}
            {playback.albumImageUrl ? (
              <img
                src={playback.albumImageUrl}
                alt="Album art"
                className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-border">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}

            {/* Track info */}
            <div className="min-w-0 flex-shrink-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {playback.trackName}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {playback.artistName}
              </p>
            </div>

            {/* Play/pause */}
            <button
              onClick={() => (playback.paused ? resume() : pause())}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-text-primary text-bg transition-transform hover:scale-105"
            >
              {playback.paused ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2l10 6-10 6V2z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="2" width="4" height="12" rx="1" />
                  <rect x="9" y="2" width="4" height="12" rx="1" />
                </svg>
              )}
            </button>

            {/* Seek bar */}
            <div className="flex flex-1 items-center gap-2">
              <span className="w-10 text-right font-mono text-xs text-text-tertiary">
                {formatMs(position)}
              </span>
              <div
                onClick={handleSeek}
                className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-border"
              >
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{
                    width: `${playback.duration > 0 ? (position / playback.duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="w-10 font-mono text-xs text-text-tertiary">
                {formatMs(playback.duration)}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
