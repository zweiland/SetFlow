import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotifySearchPanel } from './SpotifySearchPanel'
import type { Song, SpotifyTrackResult } from '../types'

interface SongModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: SongFormData) => void
  song?: Song | null
}

export interface SongFormData {
  title: string
  artist: string
  key: string
  bpm: string
  duration: string
  notes: string
  spotify_track_id: string
  spotify_image_url: string
}

const KEYS = [
  '', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm',
]

export function SongModal({ open, onClose, onSave, song }: SongModalProps) {
  const emptyForm: SongFormData = {
    title: '', artist: '', key: '', bpm: '', duration: '', notes: '',
    spotify_track_id: '', spotify_image_url: '',
  }

  const [form, setForm] = useState<SongFormData>(emptyForm)

  useEffect(() => {
    if (song) {
      setForm({
        title: song.title,
        artist: song.artist ?? '',
        key: song.key ?? '',
        bpm: song.bpm?.toString() ?? '',
        duration: song.duration?.toString() ?? '',
        notes: song.notes ?? '',
        spotify_track_id: song.spotify_track_id ?? '',
        spotify_image_url: song.spotify_image_url ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [song, open])

  function handleSpotifySelect(track: SpotifyTrackResult) {
    setForm((f) => ({
      ...f,
      title: track.name,
      artist: track.artists.join(', '),
      duration: Math.round(track.duration_ms / 1000).toString(),
      spotify_track_id: track.id,
      spotify_image_url: track.image_url ?? '',
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">
              {song ? 'Edit Song' : 'New Song'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <SpotifySearchPanel onSelect={handleSpotifySelect} />
              {form.spotify_track_id && (
                <div className="flex items-center gap-2 rounded-md bg-green-400/10 px-3 py-1.5">
                  {form.spotify_image_url && (
                    <img src={form.spotify_image_url} alt="" className="h-8 w-8 rounded" />
                  )}
                  <span className="flex-1 truncate text-xs text-green-400">
                    Linked to Spotify
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, spotify_track_id: '', spotify_image_url: '' }))}
                    className="text-xs text-text-tertiary hover:text-text-secondary"
                  >
                    Remove
                  </button>
                </div>
              )}
              <Field
                label="Title"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
                required
                autoFocus={!form.spotify_track_id}
              />
              <Field
                label="Artist"
                value={form.artist}
                onChange={(v) => setForm({ ...form, artist: v })}
                placeholder="Optional"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Key</label>
                  <select
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  >
                    {KEYS.map((k) => (
                      <option key={k} value={k}>{k || '—'}</option>
                    ))}
                  </select>
                </div>
                <Field
                  label="BPM"
                  value={form.bpm}
                  onChange={(v) => setForm({ ...form, bpm: v })}
                  type="number"
                  placeholder="120"
                />
                <Field
                  label="Duration (s)"
                  value={form.duration}
                  onChange={(v) => setForm({ ...form, duration: v })}
                  type="number"
                  placeholder="240"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  placeholder="Cues, transitions, reminders..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
                >
                  {song ? 'Save' : 'Add Song'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label, value, onChange, type = 'text', placeholder, required, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean; autoFocus?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />
    </div>
  )
}
