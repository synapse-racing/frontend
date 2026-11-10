import { ErrorNotice } from '../../../shared/components/ErrorNotice.tsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { TrainingRun } from '../api/training.api.ts'
import { Link } from 'react-router-dom'
import { TrackMap } from '../../../shared/game/TrackMap.tsx'
import { generateTrack } from '../domain/track.ts'

const TRACK_VERSION = 'grand-prix-v3'
const statusLabels: Record<TrainingRun['status'], string> = {
  PAUSED: 'Pausado',
  RUNNING: 'En curso',
  COMPLETED: 'Completado',
}

function savedAtLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function sectorCountFor(run: TrainingRun) {
  return generateTrack(
    run.config.track ?? { version: TRACK_VERSION, seed: run.seed },
  ).checkpoints.length
}

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
  const safeSeed = Number.isSafeInteger(seed) ? seed : 0
  const newSectorCount = useMemo(
    () => generateTrack({ version: TRACK_VERSION, seed: safeSeed }).checkpoints.length,
    [safeSeed],
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length < 3) return
    await onCreate(name.trim(), seed)
  }

  return (
    <section className="run-selector" aria-label="Entrenamiento NEAT">
      <div className="run-selector__panel">
        <div className="run-selector__header">
          <p className="eyebrow">01 / PADDOCK</p>
          <Link to="/dashboard" className="run-selector__back">← Paddock</Link>
        </div>
        <h1>Entrenamiento NEAT</h1>
        <p className="run-selector__lead">
          Configura el circuito, inicia una nueva población de pilotos o continúa
          un entrenamiento guardado.
        </p>
        {localOnly && (
          <p className="guest-training-note">
            Modo invitado · Progreso guardado localmente en este navegador. Vincula
            una cuenta desde el Paddock para conservarlo en la nube.
          </p>
        )}

        <div className="run-selector__grid">
          <form
            className="run-selector__create run-setup"
            onSubmit={(event) => void submit(event)}
          >
            <h2>Nuevo entrenamiento NEAT</h2>
            <label>
              Nombre del entrenamiento
              <input
                aria-label="Nombre del entrenamiento"
                maxLength={80}
                minLength={3}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>

            <div className="track-preset track-preset--selected">
              <div className="track-preset__header">
                <span>Pista de pruebas · Desierto</span>
                <span className="track-preset__seed-badge">Semilla #{safeSeed}</span>
              </div>
              <TrackMap recipe={{ version: TRACK_VERSION, seed: safeSeed }} />
              <small>
                Circuito cerrado · {newSectorCount} sectores de control
              </small>
            </div>

            <label>
              Semilla del trazado
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
                  Nueva semilla
                </button>
              </span>
            </label>

            <details className="neat-advanced">
              <summary>Parámetros de la red (NEAT)</summary>
              <p>
                Población de 24 autos autónomos · 5 sensores de distancia · 6
                entradas de red y 2 salidas de control (dirección y aceleración).
              </p>
            </details>

            <button
              className="primary-button"
              disabled={busy || name.trim().length < 3}
            >
              Iniciar entrenamiento
            </button>
          </form>

          <section className="run-selector__saved-section" aria-label="Entrenamientos guardados">
            <div className="run-list__header">
              <h2>Entrenamientos guardados</h2>
              <span>
                {runs.length} {runs.length === 1 ? 'guardado' : 'guardados'}
              </span>
            </div>

            <ErrorNotice error={error} />

            <div className="run-list">
              {runs.length === 0 && !busy && (
                <p className="run-list__empty">
                  Aún no tienes entrenamientos guardados. Configura uno a la izquierda
                  para comenzar a evaluar tus pilotos.
                </p>
              )}
              {runs.map((run) => (
                <article className="run-item" key={run.id}>
                  <button
                    className="run-item__load"
                    disabled={busy}
                    onClick={() => void onLoad(run)}
                  >
                    <span className="run-item__title">{run.name}</span>
                    <div className="run-item__stats">
                      <span
                        className="run-item__status"
                        data-status={run.status.toLowerCase()}
                      >
                        {statusLabels[run.status]}
                      </span>
                      <span className="run-item__pill">
                        Generación {run.currentGeneration}
                      </span>
                      <span className="run-item__metric">
                        Mejor puntuación:{' '}
                        <strong>{run.bestFitness.toFixed(0)} pts</strong>
                      </span>
                      <span className="run-item__seed">
                        Semilla #{run.config.track?.seed ?? run.seed}
                      </span>
                      <span className="run-item__sectors">
                        {sectorCountFor(run)} sectores
                      </span>
                      <time className="run-item__date" dateTime={run.updatedAt}>
                        Guardado el {savedAtLabel(run.updatedAt)}
                      </time>
                    </div>
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
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
                    Eliminar
                  </button>
                </article>
              ))}
            </div>
          </section>
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
          <p className="eyebrow">Eliminar entrenamiento</p>
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
