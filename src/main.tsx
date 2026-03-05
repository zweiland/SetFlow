import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { SpotifyProvider } from './lib/spotify'
import { MetronomeProvider } from './lib/metronome'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <SpotifyProvider>
          <MetronomeProvider>
            <App />
          </MetronomeProvider>
        </SpotifyProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
