import { Component, type ErrorInfo, type PropsWithChildren } from 'react'

interface ErrorBoundaryState {
  failed: boolean
}

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unrecoverable render error', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <p className="eyebrow">Error de aplicación</p>
          <h1>No pudimos mostrar esta pantalla.</h1>
          <p>
            Ocurrió un error inesperado. Puedes recargar o volver al inicio.
            Los cambios que aún no se hayan guardado podrían perderse.
          </p>
          <div>
            <button onClick={() => window.location.reload()}>Recargar</button>
            <button onClick={() => window.location.assign('/')}>Ir al inicio</button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
