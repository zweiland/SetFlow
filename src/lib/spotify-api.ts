import { supabase } from './supabase'
import type { SpotifyTrackResult } from '../types'

export async function searchSpotifyTracks(
  query: string,
  limit = 10
): Promise<SpotifyTrackResult[]> {
  const { data, error } = await supabase.functions.invoke('spotify', {
    body: { action: 'search', query, limit },
  })

  if (error) {
    const msg = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : 'Spotify search failed'
    throw new Error(msg)
  }

  const tracks = data?.tracks?.items ?? []
  return tracks.map(mapTrack)
}

function mapTrack(track: Record<string, unknown>): SpotifyTrackResult {
  const artists = (track.artists as Array<{ name: string }>).map(
    (a) => a.name
  )
  const album = track.album as {
    name: string
    images: Array<{ url: string; height: number }>
  }
  const images = album.images ?? []
  // Prefer the 300px image, fall back to first available
  const image =
    images.find((i) => i.height === 300) ?? images[0] ?? null

  return {
    id: track.id as string,
    name: track.name as string,
    artists,
    album: album.name,
    duration_ms: track.duration_ms as number,
    image_url: image?.url ?? null,
    uri: track.uri as string,
  }
}

export async function refreshUserToken(userId: string): Promise<{
  access_token: string
  expires_at: string
}> {
  const { data, error } = await supabase.functions.invoke('spotify', {
    body: { action: 'refresh-user-token', user_id: userId },
  })

  if (error || !data?.access_token) {
    throw new Error('Failed to refresh Spotify token')
  }

  return data
}
