import { Link } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { GameSettings } from '../../../shared/game/GameSettings.tsx'

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <main className="auth-shell">
      <header className="auth-access-header">
        <Link className="auth-brand" to="/">
          ← SYNAPSE / RACING
        </Link>
        <GameSettings />
      </header>
      <section className="auth-intro">
        <div>
          <p className="eyebrow">Acceso al paddock</p>
          <h1>
            CADA VUELTA <br />
            ES UNA <br />
            <em>LECCIÓN.</em>
          </h1>
          <p>Cada generación, una evolución.</p>
        </div>
      </section>
      <section className="auth-form-panel">{children}</section>
    </main>
  )
}
