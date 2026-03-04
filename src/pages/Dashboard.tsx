import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Setlist } from '../types'

interface SetlistWithVenue extends Setlist {
  venue?: { name: string } | null
}

export function Dashboard() {
  const [setlists, setSetlists] = useState<SetlistWithVenue[]>([])
  const [songCount, setSongCount] = useState(0)
  const [venueCount, setVenueCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const [{ data: sl }, { count }, { count: vc }] = await Promise.all([
        supabase
          .from('setlists')
          .select('*, venue:venues(name)')
          .eq('is_archived', false)
          .order('updated_at', { ascending: false }),
        supabase
          .from('songs')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('venues')
          .select('*', { count: 'exact', head: true }),
      ])
      setSetlists(sl ?? [])
      setSongCount(count ?? 0)
      setVenueCount(vc ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  async function createSetlist() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('setlists')
      .insert({ user_id: user.id, name: 'Untitled Setlist' })
      .select()
      .single()
    if (data) navigate(`/setlists/${data.id}`)
  }

  async function deleteSetlist(id: string) {
    await supabase.from('setlists').delete().eq('id', id)
    setSetlists((prev) => prev.filter((sl) => sl.id !== id))
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-text-secondary">Loading...</p>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <button
          onClick={createSetlist}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
        >
          + New Setlist
        </button>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="Setlists" value={setlists.length} />
        <StatCard label="Songs" value={songCount} />
        <StatCard label="Venues" value={venueCount} />
      </div>

      {setlists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-text-secondary">No setlists yet.</p>
          <button
            onClick={createSetlist}
            className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
          >
            Create your first setlist
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {setlists.map((sl) => (
            <div
              key={sl.id}
              onClick={() => navigate(`/setlists/${sl.id}`)}
              className="group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/30"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{sl.name}</p>
                {(sl.description || sl.venue?.name) && (
                  <p className="text-xs text-text-secondary">
                    {sl.venue?.name && <span className="text-text-tertiary">{sl.venue.name}</span>}
                    {sl.venue?.name && sl.description && <span> · </span>}
                    {sl.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-tertiary">
                  {new Date(sl.updated_at).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSetlist(sl.id) }}
                  className="rounded p-1 text-text-tertiary opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  title="Delete setlist"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="mt-1 font-mono text-2xl font-medium text-text-primary">{value}</p>
    </div>
  )
}
