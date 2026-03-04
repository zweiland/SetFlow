import { useState, useRef } from 'react'
import { searchSpotifyTracks } from '../lib/spotify-api'
import type { SpotifyTrackResult } from '../types'

interface SpotifySearchPanelProps {
  onSelect: (track: SpotifyTrackResult) => void
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function SpotifySearchPanel({ onSelect }: SpotifySearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyTrackResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  function handleQueryChange(value: string) {
    setQuery(value)
    clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const tracks = await searchSpotifyTracks(value.trim())
        setResults(tracks)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        Search Spotify
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Spotify Search
        </span>
        <button
          type="button"
          onClick={() => { setOpen(false); setQuery(''); setResults([]) }}
          className="text-xs text-text-tertiary hover:text-text-secondary"
        >
          Close
        </button>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Search for a song..."
        autoFocus
        className="mb-2 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent"
      />
      {searching && (
        <p className="py-2 text-center text-xs text-text-secondary">Searching...</p>
      )}
      {!searching && results.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => {
                onSelect(track)
                setOpen(false)
                setQuery('')
                setResults([])
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface"
            >
              {track.image_url ? (
                <img
                  src={track.image_url}
                  alt={track.album}
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
                  {track.name}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {track.artists.join(', ')}
                </p>
              </div>
              <span className="flex-shrink-0 font-mono text-xs text-text-tertiary">
                {formatMs(track.duration_ms)}
              </span>
            </button>
          ))}
        </div>
      )}
      {!searching && query && results.length === 0 && (
        <p className="py-2 text-center text-xs text-text-secondary">No results found.</p>
      )}
    </div>
  )
}
