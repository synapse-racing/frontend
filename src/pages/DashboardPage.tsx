import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/context/useAuth.ts'
import { ErrorNotice } from '../shared/components/ErrorNotice.tsx'
import { useMenuStage } from '../shared/game/menu-stage-context.ts'
import { GameSettings } from '../shared/game/GameSettings.tsx'
import { GuestProgressImport } from '../features/training/components/GuestProgressImport.tsx'
import { requestGuestImport } from '../features/training/persistence/import-guest-training.ts'
import { useAppearance } from '../features/garage/context/appearance-context.ts'
import { vehicleCatalog } from '../features/garage/domain/appearance.ts'
import {
  playMenuSound,
  useGamePreferences,
} from '../shared/game/preferences.ts'

export function DashboardPage() {
  const auth = useAuth()
  const guest = auth.status === 'visitor'
  const { appearance, guestAppearance, loading, loadError } = useAppearance()
  const car = vehicleCatalog.find((model) => model.id === appearance.modelId)!
  const { preview } = useMenuStage()
  const menu = useRef<HTMLElement>(null)
  const { preferences } = useGamePreferences()
  const [signingOut, setSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState<unknown>(null)

  async function handleLogout() {
    setSigningOut(true)
    setLogoutError(null)
    try {
      await auth.logout()
    } catch (error) {
      setLogoutError(error)
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <main className="game-shell dashboard">
      <header className="game-header">
        <Link className="wordmark" to="/">
          SYNAPSE RACING
        </Link>
        <div className="header-actions">
          <GameSettings />
          <button className="text-button" disabled={signingOut} onClick={() => void handleLogout()}>
            {signingOut ? 'Cerrando sesión…' : guest ? 'Salir del modo invitado' : 'Cerrar sesión'}
          </button>
        </div>
      </header>
      <section className="paddock-content">
        <ErrorNotice error={logoutError} fallback="No se pudo cerrar sesión. Inténtalo de nuevo." compact />
        <p className="eyebrow">
          CALLEJÓN CLANDESTINO // {guest ? 'Piloto invitado' : auth.user?.username}
        </p>
        {!guest && <GuestProgressImport />}
        <h1>
          A LA <br />
          PISTA.
        </h1>
        <nav
          className="game-menu"
          ref={menu}
          aria-label="Modos de juego"
          onKeyDown={(event) => {
            if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
            event.preventDefault()
            const links = Array.from(menu.current?.querySelectorAll('a') ?? [])
            const index = links.indexOf(
              document.activeElement as HTMLAnchorElement,
            )
            links[
              (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) %
                links.length
            ]?.focus()
          }}
        >
          <Link
            to="/training"
            onFocus={() => preview('desert')}
            onMouseEnter={() => preview('desert')}
            onClick={() => playMenuSound(preferences.sound)}
          >
            <span className="menu-index">01</span>
            <div>
              <h2>ENTRENAMIENTO</h2>
              <p>Quema rueda · Evoluciona tu piloto en el asfalto.</p>
            </div>
            <span className="menu-arrow">↗</span>
          </Link>
          <Link
            to="/multiplayer"
            onFocus={() => preview('tournament')}
            onMouseEnter={() => preview('tournament')}
            onClick={() => playMenuSound(preferences.sound)}
          >
            <span className="menu-index">02</span>
            <div>
              <h2>MULTIJUGADOR</h2>
              <p>
                {guest
                  ? 'Requiere cuenta · Guarda tu máquina y compite online.'
                  : 'Pique callejero online · Duelo en tiempo real.'}
              </p>
            </div>
            <span className="menu-arrow">↗</span>
          </Link>
          <Link to="/garage" onClick={() => playMenuSound(preferences.sound)}>
            <span className="menu-index">03</span>
            <div>
              <h2>GARAJE</h2>
              <p>Taller clandestino · Chapa, alerones y neones.</p>
            </div>
            <span className="menu-arrow">↗</span>
          </Link>
        </nav>
        {!guest && guestAppearance && (
          <Link className="paddock-guest-design" to="/garage">
            Tu diseño de invitado te espera en el taller ↗
          </Link>
        )}
      </section>
      <Link
        className="paddock-equipped"
        to="/garage"
        aria-label="Personalizar auto equipado"
      >
        <span>
          {loading
            ? 'Preparando bólido...'
            : loadError
              ? 'Abre el taller para cargar tu auto'
              : 'Tu máquina lista para el pique'}
        </span>
        <strong>
          {car.name} <b>#{String(appearance.number).padStart(2, '0')}</b>
        </strong>
        <small>METER AL TALLER ↗</small>
      </Link>
      {guest && (
        <footer className="guest-progress-bar">
          <span className="guest-progress-bar__icon" aria-hidden="true">↗</span>
          <div className="guest-progress-bar__copy">
            <strong>Progreso guardado localmente</strong>
            <span>Vincula una cuenta para conservarlo.</span>
          </div>
          <Link className="guest-progress-bar__create" to="/register" onClick={requestGuestImport}>
            Crear cuenta ↗
          </Link>
          <Link className="guest-progress-bar__login" to="/login" onClick={requestGuestImport}>
            Iniciar sesión
          </Link>
        </footer>
      )}
    </main>
  )
}
