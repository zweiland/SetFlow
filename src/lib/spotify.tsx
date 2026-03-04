import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { supabase } from './supabase'
import { refreshUserToken } from './spotify-api'
import { useAuth } from './auth'
import type { SpotifyConnection } from '../types'

interface PlaybackState {
  trackId: string
  trackName: string
  artistName: string
  albumImageUrl: string | null
  paused: boolean
  position: number
  duration: number
}

interface SpotifyContextValue {
  connection: SpotifyConnection | null
  loading: boolean
  deviceId: string | null
  playback: PlaybackState | null
  play: (spotifyUri: string) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
  disconnect: () => Promise<void>
}

const SpotifyContext = createContext<SpotifyContextValue | null>(null)

export function useSpotify() {
  const ctx = useContext(SpotifyContext)
  if (!ctx) throw new Error('useSpotify must be inside SpotifyProvider')
  return ctx
}

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [connection, setConnection] = useState<SpotifyConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [playback, setPlayback] = useState<PlaybackState | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)
  const tokenRef = useRef<string | null>(null)

  // Fetch connection on mount / user change
  useEffect(() => {
    if (!user) {
      setConnection(null)
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('spotify_connections')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (!cancelled) {
        setConnection(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  // Get a valid access token, refreshing if needed
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!connection || !user) return null
    const expiresAt = new Date(connection.token_expires_at).getTime()
    if (Date.now() < expiresAt - 60_000) {
      tokenRef.current = connection.access_token
      return connection.access_token
    }
    try {
      const { access_token, expires_at } = await refreshUserToken(user.id)
      setConnection((c) =>
        c ? { ...c, access_token, token_expires_at: expires_at } : c
      )
      tokenRef.current = access_token
      return access_token
    } catch {
      return null
    }
  }, [connection, user])

  // Load SDK script & init player when we have a premium connection
  useEffect(() => {
    if (!connection?.is_premium) return

    // Only add script once
    if (!document.querySelector(`script[src="${SDK_URL}"]`)) {
      const script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      document.body.appendChild(script)
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'SetFlow',
        getOAuthToken: async (cb) => {
          const token = await getToken()
          if (token) cb(token)
        },
        volume: 0.5,
      })

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id)
      })

      player.addListener('not_ready', () => {
        setDeviceId(null)
      })

      player.addListener('player_state_changed', (state) => {
        if (!state) {
          setPlayback(null)
          return
        }
        const track = state.track_window.current_track
        setPlayback({
          trackId: track.id,
          trackName: track.name,
          artistName: track.artists.map((a) => a.name).join(', '),
          albumImageUrl: track.album.images[0]?.url ?? null,
          paused: state.paused,
          position: state.position,
          duration: state.duration,
        })
      })

      player.connect()
      playerRef.current = player
    }

    // If SDK already loaded, trigger manually
    if (window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady()
    }

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
      setDeviceId(null)
      setPlayback(null)
    }
  }, [connection?.is_premium, getToken])

  const play = useCallback(
    async (spotifyUri: string) => {
      const token = await getToken()
      if (!token || !deviceId) return
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [spotifyUri] }),
        }
      )
    },
    [getToken, deviceId]
  )

  const pause = useCallback(async () => {
    await playerRef.current?.pause()
  }, [])

  const resume = useCallback(async () => {
    await playerRef.current?.resume()
  }, [])

  const seek = useCallback(async (positionMs: number) => {
    await playerRef.current?.seek(positionMs)
  }, [])

  const disconnect = useCallback(async () => {
    playerRef.current?.disconnect()
    playerRef.current = null
    setDeviceId(null)
    setPlayback(null)

    if (user) {
      await supabase
        .from('spotify_connections')
        .delete()
        .eq('user_id', user.id)
    }
    setConnection(null)
  }, [user])

  return (
    <SpotifyContext.Provider
      value={{
        connection,
        loading,
        deviceId,
        playback,
        play,
        pause,
        resume,
        seek,
        disconnect,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  )
}
