import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { SharedSetlistData, SharedSetlistSong } from '../types'

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

export function SharedSetlist() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<SharedSetlistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetch() {
      if (!token) { setError(true); setLoading(false); return }
      const { data: result, error: err } = await supabase.rpc('get_shared_setlist', { token })
      if (err || !result) {
        setError(true)
      } else {
        setData(result as SharedSetlistData)
      }
      setLoading(false)
    }
    fetch()
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-lg font-medium text-text-primary">Setlist not found</p>
          <p className="mt-1 text-sm text-text-secondary">This link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  const totalDuration = data.songs.reduce((sum, s) => sum + (s.duration ?? 0), 0)

  return (
    <div className="min-h-screen bg-bg">
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-accent">Setlist</p>
          <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
            <span>{data.songs.length} {data.songs.length === 1 ? 'song' : 'songs'}</span>
            {totalDuration > 0 && (
              <span className="font-mono">
                {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')} total
              </span>
            )}
            {data.venue && (
              <>
                <span>·</span>
                <span>{data.venue.name}{data.venue.city ? `, ${data.venue.city}` : ''}</span>
              </>
            )}
          </div>
          {data.description && (
            <p className="mt-2 text-sm text-text-secondary">{data.description}</p>
          )}
        </div>

        <div className="space-y-2">
          {data.songs.map((song, idx) => (
            <SharedSongRow key={idx} song={song} index={idx} />
          ))}
        </div>

        {data.songs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-text-secondary">This setlist is empty.</p>
          </div>
        )}

        <p className="mt-12 text-center text-xs text-text-tertiary">
          Powered by SetFlow
        </p>
      </main>
    </div>
  )
}

function SharedSongRow({ song, index }: { song: SharedSetlistSong; index: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-right font-mono text-xs text-text-tertiary">{index + 1}</span>
      <div className="group flex flex-1 items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3">
        {song.spotify_image_url ? (
          <img src={song.spotify_image_url} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-border text-text-tertiary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{song.title}</p>
          {song.artist && <p className="truncate text-xs text-text-secondary">{song.artist}</p>}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {song.key && (
            <span className={`font-mono font-medium ${keyColor(song.key)}`}>{song.key}</span>
          )}
          {song.bpm && (
            <span className="font-mono text-text-secondary">
              {song.bpm} <span className="text-text-tertiary">bpm</span>
            </span>
          )}
          <span className="font-mono text-text-tertiary">{formatDuration(song.duration)}</span>
        </div>
      </div>
    </div>
  )
}
