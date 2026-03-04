import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SongRow } from '../components/SongRow'
import { SongModal } from '../components/SongModal'
import type { SongFormData } from '../components/SongModal'
import type { Song } from '../types'

export function SongLibrary() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)

  useEffect(() => {
    fetchSongs()
  }, [])

  async function fetchSongs() {
    setLoading(true)
    const { data } = await supabase
      .from('songs')
      .select('*')
      .order('updated_at', { ascending: false })
    setSongs(data ?? [])
    setLoading(false)
  }

  async function handleSave(form: SongFormData) {
    const payload = {
      title: form.title.trim(),
      artist: form.artist.trim() || null,
      key: form.key || null,
      bpm: form.bpm ? parseInt(form.bpm) : null,
      duration: form.duration ? parseInt(form.duration) : null,
      notes: form.notes.trim() || null,
      spotify_track_id: form.spotify_track_id || null,
      spotify_image_url: form.spotify_image_url || null,
    }

    if (editingSong) {
      await supabase.from('songs').update(payload).eq('id', editingSong.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('songs').insert({ ...payload, user_id: user.id })
    }

    setModalOpen(false)
    setEditingSong(null)
    fetchSongs()
  }

  async function handleDelete(song: Song) {
    await supabase.from('songs').delete().eq('id', song.id)
    fetchSongs()
  }

  const filtered = songs.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      (s.artist?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Songs</h1>
        <button
          onClick={() => { setEditingSong(null); setModalOpen(true) }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
        >
          + Add Song
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search songs..."
        className="mb-4 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent"
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-text-secondary">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-secondary">
            {songs.length === 0 ? 'No songs yet. Add your first song.' : 'No matches.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              onClick={() => { setEditingSong(song); setModalOpen(true) }}
              trailing={
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(song) }}
                  className="rounded p-1 text-text-tertiary opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              }
            />
          ))}
        </div>
      )}

      <SongModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSong(null) }}
        onSave={handleSave}
        song={editingSong}
      />
    </div>
  )
}
