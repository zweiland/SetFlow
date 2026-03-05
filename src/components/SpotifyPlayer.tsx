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
          className="fixed bottom-[3.5rem] left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md md:bottom-0"
        >
          {/* Desktop layout */}
          <div className="mx-auto hidden max-w-5xl items-center gap-4 px-6 py-3 md:flex">
            {playback.albumImageUrl ? (
              <img src={playback.albumImageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-md object-cover" />
            ) : (
              <AlbumPlaceholder size={48} />
            )}
            <div className="min-w-0 flex-shrink-0">
              <p className="truncate text-sm font-medium text-text-primary">{playback.trackName}</p>
              <p className="truncate text-xs text-text-secondary">{playback.artistName}</p>
            </div>
            <PlayPauseButton paused={playback.paused} onToggle={() => (playback.paused ? resume() : pause())} />
            <div className="flex flex-1 items-center gap-2">
              <span className="w-10 text-right font-mono text-xs text-text-tertiary">{formatMs(position)}</span>
              <SeekBar position={position} duration={playback.duration} onSeek={handleSeek} />
              <span className="w-10 font-mono text-xs text-text-tertiary">{formatMs(playback.duration)}</span>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="px-4 py-2 md:hidden">
            <div className="flex items-center gap-3">
              {playback.albumImageUrl ? (
                <img src={playback.albumImageUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
              ) : (
                <AlbumPlaceholder size={40} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{playback.trackName}</p>
                <p className="truncate text-xs text-text-secondary">{playback.artistName}</p>
              </div>
              <PlayPauseButton paused={playback.paused} onToggle={() => (playback.paused ? resume() : pause())} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-tertiary">{formatMs(position)}</span>
              <SeekBar position={position} duration={playback.duration} onSeek={handleSeek} />
              <span className="font-mono text-[10px] text-text-tertiary">{formatMs(playback.duration)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PlayPauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-text-primary text-bg transition-transform hover:scale-105"
    >
      {paused ? (
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
  )
}

function SeekBar({ position, duration, onSeek }: { position: number; duration: number; onSeek: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div onClick={onSeek} className="group relative h-1.5 flex-1 cursor-pointer rounded-full bg-border">
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }}
      />
    </div>
  )
}

function AlbumPlaceholder({ size }: { size: number }) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-md bg-border" style={{ width: size, height: size }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    </div>
  )
}
