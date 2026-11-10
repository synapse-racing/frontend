import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorNotice } from '../../../shared/components/ErrorNotice.tsx'

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'success'

export function GarageTopBar({
  onBack,
  state,
  message,
}: {
  onBack: (event: MouseEvent<HTMLAnchorElement>) => void
  state: SaveState
  message: string
}) {
  return (
    <header className="garage-header">
      <Link to="/dashboard" className="garage-back" onClick={onBack}>
        ← Paddock
      </Link>
      <span className="garage-header__brand">
        SYNAPSE <b>/</b> RACING
      </span>
      <div className="garage-save-status" aria-live="polite">
        {state === 'error' ? <ErrorNotice error={message} compact /> : state === 'success' ? (
          <p
            role="status"
            className={`garage-chip is-${state}`}
          >
            {message}
          </p>
        ) : (
          <p className={`garage-chip is-${state}`}>{message}</p>
        )}
      </div>
    </header>
  )
}
