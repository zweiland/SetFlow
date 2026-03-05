import { useMetronome } from '../lib/metronome'

export function MetronomeFAB() {
  const { isPlaying, panelOpen, openPanel } = useMetronome()

  if (panelOpen) return null

  return (
    <button
      onClick={() => openPanel()}
      className={`fixed bottom-[4.5rem] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface shadow-lg transition-all hover:border-accent/30 md:bottom-20 md:right-6 ${
        isPlaying ? 'ring-2 ring-amber-400/60 ring-offset-2 ring-offset-bg' : ''
      }`}
      title="Metronome"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isPlaying ? 'text-amber-400' : 'text-text-secondary'}>
        <path d="M12 2L6 22h12L12 2z" />
        <path d="M12 12l4-7" />
      </svg>
    </button>
  )
}
