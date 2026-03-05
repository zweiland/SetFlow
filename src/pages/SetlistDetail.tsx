import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../lib/supabase'
import { useSpotify } from '../lib/spotify'
import { useMetronome } from '../lib/metronome'
import { SongRow } from '../components/SongRow'
import type { Setlist, SetlistSong, Song, Venue } from '../types'

export function SetlistDetail() {
  const { id } = useParams<{ id: string }>()
  const { play: spotifyPlay, connection } = useSpotify()
  const { openPanel: openMetronome, startWithDuration, stop: stopMetronome, isPlaying: metronomeIsPlaying } = useMetronome()
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [items, setItems] = useState<SetlistSong[]>([])
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [showAddSong, setShowAddSong] = useState(false)
  const [songSearch, setSongSearch] = useState('')
  const [practiceMode, setPracticeMode] = useState(false)
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchSetlist = useCallback(async () => {
    if (!id) return
    const [{ data: sl }, { data: songs }, { data: v }] = await Promise.all([
      supabase.from('setlists').select('*, venue:venues(*)').eq('id', id).single(),
      supabase
        .from('setlist_songs')
        .select('*, song:songs(*)')
        .eq('setlist_id', id)
        .order('position'),
      supabase.from('venues').select('*').order('name'),
    ])
    if (sl) {
      setSetlist(sl)
      setName(sl.name)
    }
    setItems(songs ?? [])
    setVenues(v ?? [])
  }, [id])

  useEffect(() => {
    fetchSetlist()
  }, [fetchSetlist])

  async function handleNameSave() {
    if (!id || !name.trim()) return
    await supabase.from('setlists').update({ name: name.trim() }).eq('id', id)
    setIsEditing(false)
    fetchSetlist()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const reordered = [...items]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    setItems(reordered)

    await Promise.all(
      reordered.map((item, idx) =>
        supabase.from('setlist_songs').update({ position: idx }).eq('id', item.id)
      )
    )
  }

  async function addSongToSetlist(songId: string) {
    if (!id) return
    const position = items.length
    await supabase.from('setlist_songs').insert({
      setlist_id: id,
      song_id: songId,
      position,
    })
    setShowAddSong(false)
    setSongSearch('')
    fetchSetlist()
  }

  async function removeSong(itemId: string) {
    await supabase.from('setlist_songs').delete().eq('id', itemId)
    fetchSetlist()
  }

  async function fetchAllSongs() {
    const { data } = await supabase.from('songs').select('*').order('title')
    setAllSongs(data ?? [])
  }

  function openAddSong() {
    fetchAllSongs()
    setShowAddSong(true)
  }

  function startPractice(index: number) {
    const song = items[index]?.song
    if (!song) return
    setPracticeMode(true)
    setPracticeIndex(index)
    if (song.bpm && song.duration) {
      startWithDuration(song.bpm, song.duration)
    } else if (song.bpm) {
      openMetronome(song.bpm)
    }
  }

  function practiceNext() {
    if (practiceIndex < items.length - 1) {
      startPractice(practiceIndex + 1)
    } else {
      stopMetronome()
      setPracticeMode(false)
    }
  }

  function practicePrev() {
    if (practiceIndex > 0) {
      startPractice(practiceIndex - 1)
    }
  }

  function exitPractice() {
    stopMetronome()
    setPracticeMode(false)
  }

  async function handleShare() {
    if (!id || !setlist) return
    let token = setlist.share_token
    if (!token) {
      token = crypto.randomUUID()
      await supabase.from('setlists').update({ share_token: token }).eq('id', id)
      setSetlist({ ...setlist, share_token: token })
    }
    const url = `${window.location.origin}${import.meta.env.BASE_URL}s/${token}`
    await navigator.clipboard.writeText(url)
    setShareStatus('copied')
    setTimeout(() => setShareStatus('idle'), 2000)
  }

  const totalDuration = items.reduce((sum, i) => sum + (i.song?.duration ?? 0), 0)
  const existingSongIds = new Set(items.map((i) => i.song_id))
  const availableSongs = allSongs
    .filter((s) => !existingSongIds.has(s.id))
    .filter((s) => {
      if (!songSearch) return true
      const q = songSearch.toLowerCase()
      return s.title.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false)
    })

  if (!setlist) {
    return <p className="py-12 text-center text-sm text-text-secondary">Loading...</p>
  }

  return (
    <div>
      {practiceMode && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-2.5">
          <span className="text-xs font-medium text-amber-400">Practice</span>
          <span className="flex-1 truncate text-sm text-text-primary">
            {items[practiceIndex]?.song?.title ?? '—'}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={practicePrev}
              disabled={practiceIndex === 0}
              className="rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={practiceNext}
              className="rounded bg-accent px-2 py-1 text-xs font-medium text-black transition-colors hover:bg-accent-hover"
            >
              {practiceIndex < items.length - 1 ? 'Next' : 'Finish'}
            </button>
            <button
              onClick={exitPractice}
              className="rounded px-2 py-1 text-xs text-text-tertiary hover:text-text-primary"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              autoFocus
              className="border-b border-accent bg-transparent text-2xl font-bold tracking-tight text-text-primary outline-none"
            />
            <button
              onClick={handleNameSave}
              className="text-sm text-accent hover:text-accent-hover"
            >
              Save
            </button>
          </div>
        ) : (
          <h1
            onClick={() => setIsEditing(true)}
            className="cursor-pointer text-2xl font-bold tracking-tight hover:text-accent"
            title="Click to rename"
          >
            {setlist.name}
          </h1>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
          <span>{items.length} {items.length === 1 ? 'song' : 'songs'}</span>
          {totalDuration > 0 && (
            <span className="font-mono">
              {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')} total
            </span>
          )}
          {items.length > 0 && !practiceMode && (
            <>
              <span>·</span>
              <button
                onClick={() => startPractice(0)}
                className="font-medium text-accent hover:text-accent-hover"
              >
                Practice
              </button>
            </>
          )}
          <span>·</span>
          <button
            onClick={handleShare}
            className="font-medium text-accent hover:text-accent-hover"
          >
            {shareStatus === 'copied' ? 'Link copied!' : 'Share'}
          </button>
          <span>·</span>
          <select
            value={setlist.venue_id ?? ''}
            onChange={async (e) => {
              const venueId = e.target.value || null
              await supabase.from('setlists').update({ venue_id: venueId }).eq('id', id!)
              fetchSetlist()
            }}
            className="rounded border border-border bg-bg px-2 py-0.5 text-xs text-text-secondary outline-none focus:border-accent"
          >
            <option value="">No venue</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <SortableItem
                key={item.id}
                item={item}
                index={idx}
                isActive={practiceMode && idx === practiceIndex}
                onRemove={() => removeSong(item.id)}
                onPlay={
                  connection?.is_premium && item.song?.spotify_track_id
                    ? () => spotifyPlay(`spotify:track:${item.song!.spotify_track_id}`)
                    : undefined
                }
                onBpmClick={(bpm) => openMetronome(bpm)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && !showAddSong && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-text-secondary">This setlist is empty.</p>
        </div>
      )}

      {showAddSong ? (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <input
            value={songSearch}
            onChange={(e) => setSongSearch(e.target.value)}
            placeholder="Search your songs..."
            autoFocus
            className="mb-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent"
          />
          {availableSongs.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-secondary">
              {allSongs.length === 0 ? 'No songs in your library yet.' : 'No matching songs.'}
            </p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {availableSongs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onClick={() => addSongToSetlist(song.id)}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => { setShowAddSong(false); setSongSearch('') }}
            className="mt-3 text-xs text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={openAddSong}
          className="mt-4 w-full rounded-lg border border-dashed border-border py-2.5 text-sm text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
        >
          + Add Song
        </button>
      )}
    </div>
  )
}

function bpmToColor(bpm: number | null): string | undefined {
  if (!bpm) return undefined
  // 60 bpm → green (hue 120), 140 bpm → yellow (60), 200+ → red (0)
  const hue = Math.max(0, Math.min(120, 120 - ((bpm - 60) / 140) * 120))
  return `hsl(${hue}, 70%, 45%)`
}

function SortableItem({ item, index, isActive, onRemove, onPlay, onBpmClick }: { item: SetlistSong; index: number; isActive?: boolean; onRemove: () => void; onPlay?: () => void; onBpmClick?: (bpm: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!item.song) return null

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 ${isActive ? 'rounded-lg ring-2 ring-amber-400/40' : ''}`}>
      <button
        {...attributes}
        {...listeners}
        className="flex cursor-grab touch-none items-center text-text-tertiary hover:text-text-secondary active:cursor-grabbing"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="6" cy="4" r="1.5" />
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="6" cy="8" r="1.5" />
          <circle cx="10" cy="8" r="1.5" />
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
        </svg>
      </button>
      <span className="w-6 text-right font-mono text-xs text-text-tertiary">{index + 1}</span>
      <div className="flex-1">
        <SongRow
          song={item.song}
          onBpmClick={onBpmClick}
          bpmColor={bpmToColor(item.song.bpm)}
          trailing={
            <div className="flex items-center gap-1">
              {onPlay && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPlay() }}
                  className="rounded p-1 text-green-400 opacity-0 transition-opacity hover:text-green-300 group-hover:opacity-100"
                  title="Play on Spotify"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2l10 6-10 6V2z" />
                  </svg>
                </button>
              )}
              <button
                onClick={onRemove}
                className="rounded p-1 text-text-tertiary opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          }
        />
      </div>
    </div>
  )
}
