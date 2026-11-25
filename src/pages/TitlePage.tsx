import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/context/useAuth.ts'
import { GameSettings } from '../shared/game/GameSettings.tsx'
import {
  playMenuSound,
  useGamePreferences,
} from '../shared/game/preferences.ts'
export function TitlePage() {
  const auth = useAuth(),
    navigate = useNavigate()
  const { preferences } = useGamePreferences()
  const destination =
    auth.status === 'authenticated' || auth.status === 'visitor'
      ? '/dashboard'
      : '/login'
  useEffect(() => {
    const enter = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' ||
        event.repeat ||
        document.querySelector('dialog[open]')
      )
        return
      if ((event.target as HTMLElement).closest('button, input, select, a'))
        return
      playMenuSound(preferences.sound)
      navigate(destination)
    }
    window.addEventListener('keydown', enter)
    return () => window.removeEventListener('keydown', enter)
  }, [auth.status, destination, navigate, preferences.sound])
  return (
    <main className="game-shell title-screen">
      <header className="game-header">
        <span className="wordmark">
          <img
            src="/synapse.png"
            alt=""
            className="brand-logo"
            aria-hidden="true"
          />
          SYNAPSE <span className="wordmark__accent">RACING</span>
        </span>
        <GameSettings />
      </header>
      <div className="title-content">
        <p className="eyebrow title-kicker">
          <span /> STREET TUNING SIMULATOR // 2000s
        </p>
        <div className="title-brand-row">
          <img
            src="/synapse.png"
            alt=""
            className="title-hero-logo"
          />
          <h1>
            SYNAPSE <span>RACING</span>
          </h1>
        </div>
        <p className="title-tagline">
          ASFALTO NOCTURNO · MOTORES RUGIENDO · SIN REGLAS
        </p>
        <button
          className="enter-button"
          onClick={() => {
            playMenuSound(preferences.sound)
            navigate(destination)
          }}
        >
          <kbd>ENTER</kbd>
          PISAR A FONDO · Presiona Enter
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <footer className="game-footer">
        <span>
          TUNING EDITION <span className="footer-separator">//</span> FLASH ARCADE
        </span>
        <span>QUEMA RUEDA · DEJA TU MARCA</span>
      </footer>
    </main>
  )
}
