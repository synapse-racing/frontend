import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { requestGuestImport } from '../../training/persistence/import-guest-training.ts'
import { useAuth } from '../context/useAuth.ts'

export function ProtectedRoute({
  allowGuest = false,
}: {
  allowGuest?: boolean
}) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <main className="page">
        <p className="eyebrow">Sincronizando sesión</p>
        <h1>Cargando</h1>
      </main>
    )
  }

  if (auth.status === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (auth.status === 'visitor' && !allowGuest) {
    return (
      <main className="guest-multiplayer-gate">
        <section className="guest-multiplayer-gate__card">
          <div className="guest-multiplayer-gate__stripe" aria-hidden="true" />
          <p className="guest-multiplayer-gate__eyebrow">
            <span aria-hidden="true">●</span> ACCESO A TORNEO
          </p>
          <h1>La parrilla te espera.</h1>
          <p className="guest-multiplayer-gate__description">
            Crea una cuenta para llevar tu piloto y competir en línea con otros corredores.
          </p>
          <div className="guest-multiplayer-gate__actions">
            <Link
              className="guest-multiplayer-gate__create"
              to="/register"
              onClick={requestGuestImport}
            >
              Crear cuenta <span aria-hidden="true">↗</span>
            </Link>
            <Link
              className="guest-multiplayer-gate__login"
              to="/login"
              onClick={requestGuestImport}
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="guest-multiplayer-gate__save-note">
            Tu progreso de invitado seguirá guardado en este dispositivo.
          </p>
          <Link className="guest-multiplayer-gate__back" to="/dashboard">
            ← Volver al paddock
          </Link>
        </section>
      </main>
    )
  }

  return <Outlet />
}
