import { useId, useRef } from 'react'
import { useGamePreferences } from './preferences.ts'
export function GameSettings() {
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const { preferences, update } = useGamePreferences()
  return (
    <>
      <button type="button" className="text-button" onClick={() => dialog.current?.showModal()}>
        Ajustes
      </button>
      <dialog
        ref={dialog}
        className="game-dialog"
        aria-labelledby={titleId}
      >
        <p className="eyebrow">Configuración del juego</p>
        <h2 id={titleId}>A tu medida.</h2>
        <label className="field">
          Calidad gráfica
          <select
            value={preferences.quality}
            onChange={(e) =>
              update({ quality: e.target.value as 'low' | 'high' })
            }
          >
            <option value="high">Alta · sombras y escenario completo</option>
            <option value="low">Rendimiento · escenario simplificado</option>
          </select>
        </label>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={preferences.music}
            onChange={(e) => update({ music: e.target.checked })}
          />{' '}
          Música del menú y carrera
        </label>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={preferences.pauseMenuAnimation}
            onChange={(e) => update({ pauseMenuAnimation: e.target.checked })}
          />{' '}
          Pausar animación de fondo
        </label>
        <button type="button" className="primary-button" onClick={() => dialog.current?.close()}>
          Volver al juego
        </button>
      </dialog>
    </>
  )
}
