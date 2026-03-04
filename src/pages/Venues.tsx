import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { VenueModal } from '../components/VenueModal'
import type { VenueFormData } from '../components/VenueModal'
import type { Venue } from '../types'

export function Venues() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)

  useEffect(() => {
    fetchVenues()
  }, [])

  async function fetchVenues() {
    setLoading(true)
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('updated_at', { ascending: false })
    setVenues(data ?? [])
    setLoading(false)
  }

  async function handleSave(form: VenueFormData) {
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      notes: form.notes.trim() || null,
    }

    if (editingVenue) {
      await supabase.from('venues').update(payload).eq('id', editingVenue.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('venues').insert({ ...payload, user_id: user.id })
    }

    setModalOpen(false)
    setEditingVenue(null)
    fetchVenues()
  }

  async function handleDelete(venue: Venue) {
    await supabase.from('venues').delete().eq('id', venue.id)
    fetchVenues()
  }

  const filtered = venues.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.name.toLowerCase().includes(q) ||
      (v.city?.toLowerCase().includes(q) ?? false) ||
      (v.address?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Venues</h1>
        <button
          onClick={() => { setEditingVenue(null); setModalOpen(true) }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
        >
          + Add Venue
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search venues..."
        className="mb-4 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent"
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-text-secondary">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-secondary">
            {venues.length === 0 ? 'No venues yet. Add your first venue.' : 'No matches.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((venue) => (
            <div
              key={venue.id}
              onClick={() => { setEditingVenue(venue); setModalOpen(true) }}
              className="group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{venue.name}</p>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  {venue.city && <span>{venue.city}</span>}
                  {venue.address && venue.city && <span>·</span>}
                  {venue.address && <span className="truncate">{venue.address}</span>}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(venue) }}
                className="rounded p-1 text-text-tertiary opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                title="Delete"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <VenueModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingVenue(null) }}
        onSave={handleSave}
        venue={editingVenue}
      />
    </div>
  )
}
