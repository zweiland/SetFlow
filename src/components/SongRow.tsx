import type { Song } from '../types'

interface SongRowProps {
  song: Song
  onClick?: () => void
  onBpmClick?: (bpm: number) => void
  bpmColor?: string
  trailing?: React.ReactNode
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const KEY_COLORS: Record<string, string> = {
  C: 'text-red-400', 'C#': 'text-red-300', Db: 'text-red-300',
  D: 'text-orange-400', 'D#': 'text-orange-300', Eb: 'text-orange-300',
  E: 'text-amber-400',
  F: 'text-yellow-400', 'F#': 'text-yellow-300', Gb: 'text-yellow-300',
  G: 'text-green-400', 'G#': 'text-green-300', Ab: 'text-green-300',
  A: 'text-blue-400', 'A#': 'text-blue-300', Bb: 'text-blue-300',
  B: 'text-violet-400',
}

function keyColor(key: string | null): string {
  if (!key) return 'text-text-tertiary'
  const base = key.replace('m', '').replace('min', '').trim()
  return KEY_COLORS[base] ?? 'text-text-secondary'
}

export function SongRow({ song, onClick, onBpmClick, bpmColor, trailing }: SongRowProps) {
  return (
    <div
      onClick={onClick}
      style={bpmColor ? { borderLeftColor: bpmColor, borderLeftWidth: 3 } : undefined}
      className={`group flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors ${
        onClick ? 'cursor-pointer hover:border-accent/30 hover:bg-surface' : ''
      }`}
    >
      {song.spotify_image_url ? (
        <img
          src={song.spotify_image_url}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-border text-text-tertiary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {song.title}
        </p>
        {song.artist && (
          <p className="truncate text-xs text-text-secondary">{song.artist}</p>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs">
        {song.key && (
          <span className={`font-mono font-medium ${keyColor(song.key)}`}>
            {song.key}
          </span>
        )}
        {song.bpm && (
          <span
            onClick={onBpmClick ? (e) => { e.stopPropagation(); onBpmClick(song.bpm!) } : undefined}
            className={`font-mono text-text-secondary ${onBpmClick ? 'cursor-pointer rounded px-1 -mx-1 hover:bg-amber-400/10 hover:text-amber-400' : ''}`}
          >
            {song.bpm} <span className="text-text-tertiary">bpm</span>
          </span>
        )}
        <span className="font-mono text-text-tertiary">
          {formatDuration(song.duration)}
        </span>
      </div>

      {trailing && <div className="ml-2">{trailing}</div>}
    </div>
  )
}
