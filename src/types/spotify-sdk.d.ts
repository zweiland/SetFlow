// Ambient types for Spotify Web Playback SDK
// https://developer.spotify.com/documentation/web-playback-sdk/reference

interface Window {
  Spotify: typeof Spotify
  onSpotifyWebPlaybackSDKReady: () => void
}

declare namespace Spotify {
  interface Player {
    new (options: PlayerInit): Player
    connect(): Promise<boolean>
    disconnect(): void
    addListener(event: 'ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'not_ready', cb: (data: { device_id: string }) => void): void
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): void
    addListener(event: 'initialization_error', cb: (data: { message: string }) => void): void
    addListener(event: 'authentication_error', cb: (data: { message: string }) => void): void
    addListener(event: 'account_error', cb: (data: { message: string }) => void): void
    removeListener(event: string): void
    getCurrentState(): Promise<PlaybackState | null>
    setName(name: string): Promise<void>
    getVolume(): Promise<number>
    setVolume(volume: number): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    togglePlay(): Promise<void>
    seek(position_ms: number): Promise<void>
    previousTrack(): Promise<void>
    nextTrack(): Promise<void>
  }

  interface PlayerInit {
    name: string
    getOAuthToken: (cb: (token: string) => void) => void
    volume?: number
  }

  interface PlaybackState {
    paused: boolean
    position: number
    duration: number
    track_window: {
      current_track: Track
    }
  }

  interface Track {
    uri: string
    id: string
    name: string
    artists: Array<{ name: string; uri: string }>
    album: {
      uri: string
      name: string
      images: Array<{ url: string; height: number; width: number }>
    }
    duration_ms: number
  }
}
