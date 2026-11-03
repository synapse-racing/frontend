import { getUserError } from '../errors/user-errors.ts'
import { Link } from 'react-router-dom'

export function ErrorNotice({ error, fallback, compact = false }: { error: unknown; fallback?: string; compact?: boolean }) {
  if (!error) return null
  const detail = getUserError(error, fallback)
  return (
    <div className={`error-notice${compact ? ' error-notice--compact' : ''}`} role="alert">
      <span className="error-notice__icon" aria-hidden="true">!</span>
      <div>
        <strong>{detail.title}</strong>
        <p>{detail.message}</p>
        {detail.code === 'SESION_REQUERIDA' && <Link to="/login">Volver a iniciar sesión →</Link>}
        <small>Referencia: {detail.code}</small>
      </div>
    </div>
  )
}
