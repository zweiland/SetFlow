export interface Song {
  id: string
  user_id: string
  title: string
  artist: string | null
  key: string | null
  bpm: number | null
  duration: number | null
  notes: string | null
  spotify_track_id: string | null
  spotify_image_url: string | null
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  user_id: string
  name: string
  address: string | null
  city: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Setlist {
  id: string
  user_id: string
  name: string
  description: string | null
  is_archived: boolean
  venue_id: string | null
  venue?: Venue
  created_at: string
  updated_at: string
}

export interface SetlistSong {
  id: string
  setlist_id: string
  song_id: string
  position: number
  notes: string | null
  song?: Song
}

export interface PracticeLog {
  id: string
  song_id: string
  user_id: string
  date: string
  tempo_practiced: number
  duration_seconds: number | null
  notes: string | null
  created_at: string
}

export interface SpotifyConnection {
  id: string
  user_id: string
  spotify_user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  scopes: string
  display_name: string | null
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface SpotifyTrackResult {
  id: string
  name: string
  artists: string[]
  album: string
  duration_ms: number
  image_url: string | null
  uri: string
}
