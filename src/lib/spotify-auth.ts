import { supabase } from './supabase'

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_PROFILE_URL = 'https://api.spotify.com/v1/me'
const REDIRECT_URI = import.meta.env.DEV
  ? 'http://localhost:5173/spotify/callback'
  : `${window.location.origin}${import.meta.env.BASE_URL}spotify/callback`
const SCOPES = 'streaming user-read-email user-read-private'

function getClientId(): string {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

export function generateCodeVerifier(): string {
  return generateRandomString(64)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function initiateSpotifyAuth(): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)

  sessionStorage.setItem('spotify_code_verifier', verifier)

  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `${SPOTIFY_AUTH_URL}?${params}`
}

export async function exchangeSpotifyCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const verifier = sessionStorage.getItem('spotify_code_verifier')
  if (!verifier) throw new Error('Missing code verifier')

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || 'Token exchange failed')
  }

  sessionStorage.removeItem('spotify_code_verifier')
  return res.json()
}

export async function fetchSpotifyProfile(accessToken: string): Promise<{
  id: string
  display_name: string | null
  product: string
}> {
  const res = await fetch(SPOTIFY_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Spotify profile')
  return res.json()
}

export async function saveSpotifyConnection(
  tokens: { access_token: string; refresh_token: string; expires_in: number },
  profile: { id: string; display_name: string | null; product: string }
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString()

  const { error } = await supabase.from('spotify_connections').upsert(
    {
      user_id: user.id,
      spotify_user_id: profile.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      scopes: SCOPES,
      display_name: profile.display_name,
      is_premium: profile.product === 'premium',
    },
    { onConflict: 'user_id' }
  )

  if (error) throw new Error('Failed to save Spotify connection')
}
