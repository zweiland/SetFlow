import { Routes, Route } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { SongLibrary } from './pages/SongLibrary'
import { SetlistDetail } from './pages/SetlistDetail'
import { Venues } from './pages/Venues'
import { SpotifyCallback } from './pages/SpotifyCallback'
import { SpotifyPlayer } from './components/SpotifyPlayer'
import { Metronome } from './components/Metronome'
import { MetronomeFAB } from './components/MetronomeFAB'
import { Auth } from './pages/Auth'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/songs" element={<SongLibrary />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/setlists/:id" element={<SetlistDetail />} />
        </Route>
        <Route path="/spotify/callback" element={<SpotifyCallback />} />
      </Routes>
      <SpotifyPlayer />
      <Metronome />
      <MetronomeFAB />
    </>
  )
}

export default App
