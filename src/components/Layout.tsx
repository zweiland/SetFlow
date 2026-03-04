import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useSpotify } from '../lib/spotify'
import { initiateSpotifyAuth } from '../lib/spotify-auth'

export function Layout() {
  const { signOut, user } = useAuth()
  const { connection: spotifyConnection, disconnect: spotifyDisconnect } = useSpotify()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const avatarUrl = user?.user_metadata?.avatar_url
  const fullName = user?.user_metadata?.full_name
  const initials = (fullName || user?.email || '?')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-bg/80 px-6 py-3 backdrop-blur-md">
        <NavLink to="/" className="text-lg font-bold tracking-tight text-text-primary">
          SetFlow
        </NavLink>
        <div className="flex items-center gap-1">
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/songs" label="Songs" />
          <NavItem to="/venues" label="Venues" />
          <span className="mx-3 h-4 w-px bg-border" />
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Avatar'}
                  className="h-8 w-8 rounded-full ring-2 ring-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-black ring-2 ring-border">
                  {initials}
                </div>
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-1 shadow-lg">
                <div className="px-3 py-2">
                  {fullName && (
                    <p className="text-sm font-medium text-text-primary">{fullName}</p>
                  )}
                  <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-border" />
                {spotifyConnection ? (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-400">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                      <span className="text-xs text-green-400">
                        {spotifyConnection.display_name || 'Spotify Connected'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); spotifyDisconnect() }}
                      className="mt-1 text-xs text-text-tertiary hover:text-red-400"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); initiateSpotifyAuth() }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-400">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    Connect Spotify
                  </button>
                )}
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={() => { setMenuOpen(false); signOut() }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 pt-20 pb-12">
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-surface text-text-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
