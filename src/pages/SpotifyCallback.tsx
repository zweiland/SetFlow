import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  exchangeSpotifyCode,
  fetchSpotifyProfile,
  saveSpotifyConnection,
} from '../lib/spotify-auth'
import { useSpotify } from '../lib/spotify'

export function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refetchConnection } = useSpotify()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const authError = searchParams.get('error')

    if (authError) {
      setError(`Spotify authorization failed: ${authError}`)
      return
    }

    if (!code) {
      setError('No authorization code received.')
      return
    }

    let cancelled = false

    async function handleCallback() {
      try {
        const tokens = await exchangeSpotifyCode(code!)
        const profile = await fetchSpotifyProfile(tokens.access_token)
        await saveSpotifyConnection(tokens, profile)
        if (!cancelled) {
          refetchConnection()
          navigate('/', { replace: true })
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to connect Spotify'
          )
        }
      }
    }

    handleCallback()
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
          <p className="mb-4 text-sm text-red-400">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent-hover"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="text-sm text-text-secondary">Connecting to Spotify...</p>
    </div>
  )
}
