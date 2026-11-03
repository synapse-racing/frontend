import { ErrorNotice } from '../../../shared/components/ErrorNotice.tsx'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { TrainingRun } from '../api/training.api.ts'
import { Link } from 'react-router-dom'
import { TrackMap } from '../../../shared/game/TrackMap.tsx'

interface TrainingRunSelectorProps {
  busy: boolean
  error: string | null
  onCreate: (name: string, seed: number) => Promise<void>
  onDelete: (trainingRun: TrainingRun) => Promise<void>
  onLoad: (trainingRun: TrainingRun) => Promise<void>
  runs: TrainingRun[]
  localOnly?: boolean
}

export function TrainingRunSelector({
  busy,
  error,
  onCreate,
  onDelete,
  onLoad,
  runs,
  localOnly = false,
}: TrainingRunSelectorProps) {
  const [name, setName] = useState('Entrenamiento NEAT')
  const [pendingDelete, setPendingDelete] = useState<TrainingRun | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteDialog = useRef<HTMLDialogElement>(null)
  const cancelDelete = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (pendingDelete) {
      deleteDialog.current?.showModal()
      cancelDelete.current?.focus()
    } else if (deleteDialog.current?.open) deleteDialog.current.close()
  }, [pendingDelete])

  async function confirmDelete() {
    if (!pendingDelete || deleting || busy) return
    setDeleting(true)
    try {
      await onDelete(pendingDelete)
      setPendingDelete(null)
    } catch {
      setDeleteError('No se pudo eliminar el entrenamiento. Inténtalo de nuevo.')
    } finally {
      setDeleting(false)
    }
  }
  const [seed, setSeed] = useState(() =>
    Math.floor(Math.random() * 2_147_483_648),
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length < 3) return
    await onCreate(name.trim(), seed)
  }

  return (
    <section className="run-selector" aria-label="Entrenamientos guardados">
      <div className="run-selector__panel">
        <div className="garage-heading">
          <p className="eyebrow">01 / Campo de pruebas</p>
          <Link to="/dashboard">← Paddock</Link>
        </div>
        <h1>Prepara tu escudería.</h1>
        <p className="run-selector__lead">
          Genera un circuito reproducible, lanza una nueva temporada o recupera
          una partida guardada.
        </p>
        {localOnly && (
          <p className="guest-training-note">
            Modo invitado · Guardado en este navegador. Crea una cuenta desde el
            Paddock para llevar tu progreso a otros dispositivos.
          </p>
        )}

        <form
          className="run-selector__create run-setup"
          onSubmit={(event) => void submit(event)}
        >
          <label>
            Nombre de la escudería
            <input
              aria-label="Nombre del entrenamiento"
              maxLength={80}
              minLength={3}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>
          <div className="track-preset track-preset--selected">
            <span>Desierto / Circuito procedural</span>
            <strong>Test Field</strong>
            <TrackMap
              recipe={{
                version: 'grand-prix-v3',
                seed: Number.isSafeInteger(seed) ? seed : 0,
              }}
            />
            <small>
              Rectas, horquillas y chicanes · 16 sectores · reproducible por
              semilla
            </small>
          </div>
          <label>
            Semilla del circuito
            <span className="seed-control">
              <input
                aria-label="Semilla del circuito"
                min={0}
                max={2147483647}
                onChange={(event) => setSeed(Number(event.target.value))}
                type="number"
                value={seed}
              />
              <button
                type="button"
                onClick={() =>
                  setSeed(Math.floor(Math.random() * 2_147_483_648))
                }
              >
                Generar otra
              </button>
            </span>
          </label>
          <details className="neat-advanced">
            <summary>Telemetría avanzada</summary>
            <p>
              24 pilotos · 5 sensores · 6 entradas y 2 salidas. Cada semilla
              reproduce el mismo trazado.
            </p>
          </details>
          <button
            className="primary-button"
            disabled={busy || name.trim().length < 3}
          >
            Crear temporada
          </button>
        </form>

        <ErrorNotice error={error} />

        <div className="run-list">
          {runs.length === 0 && !busy && (
            <p className="run-list__empty">
              Todavia no hay entrenamientos guardados.
            </p>
          )}
          {runs.map((run) => (
            <article className="run-item" key={run.id}>
              <button
                className="run-item__load"
                disabled={busy}
                onClick={() => void onLoad(run)}
              >
                <span>{run.name}</span>
                <small>
                  Gen. {run.currentGeneration} · Mejor{' '}
                  {run.bestFitness.toFixed(0)} · Seed{' '}
                  {run.config.track?.seed ?? run.seed}
                </small>
              </button>
              <button
                aria-label={`Eliminar ${run.name}`}
                className="run-item__delete"
                disabled={busy}
                onClick={() => {
                  setDeleteError(null)
                  setPendingDelete(run)
                }}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
                Eliminar
              </button>
            </article>
          ))}
        </div>
        <dialog
          ref={deleteDialog}
          className="run-delete-dialog"
          aria-labelledby="run-delete-title"
          aria-describedby="run-delete-description"
          onCancel={(event) => {
            if (deleting) event.preventDefault()
            else setPendingDelete(null)
          }}
          onClose={() => setPendingDelete(null)}
        >
          <p className="eyebrow">Entrenamiento guardado</p>
          <h2 id="run-delete-title">¿Eliminar entrenamiento?</h2>
          <strong className="run-delete-dialog__name">{pendingDelete?.name}</strong>
          <p id="run-delete-description">Se eliminarán su progreso y sus puntos de guardado. Esta acción no se puede deshacer.</p>
          <ErrorNotice error={deleteError} />
          <div className="run-delete-dialog__actions">
            <button ref={cancelDelete} type="button" disabled={deleting} onClick={() => setPendingDelete(null)}>Conservar</button>
            <button type="button" className="run-delete-dialog__confirm" disabled={deleting || busy} onClick={() => void confirmDelete()}>{deleting ? 'Eliminando…' : 'Eliminar entrenamiento'}</button>
          </div>
        </dialog>
      </div>
    </section>
  )
}
