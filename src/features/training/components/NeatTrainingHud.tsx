import { useEffect, useState } from 'react'
import { ErrorNotice } from '../../../shared/components/ErrorNotice.tsx'
import { Link } from 'react-router-dom'
import type { GenerationMetrics } from '../neat/population.ts'
import {
  SimulationSpeedControl,
  type SimulationSpeed,
} from '../../../shared/game/SimulationSpeedControl.tsx'
import { GameSettings } from '../../../shared/game/GameSettings.tsx'
import type { CarPose, RaceCameraMode } from '../../../shared/three/RaceCamera.tsx'
import type { TrackDefinition } from '../domain/track.ts'
import { LiveLeaderboard, type LeaderboardEntry } from './LiveLeaderboard.tsx'
import { TrainingMinimap, type MinimapCarInfo } from './TrainingMinimap.tsx'
import { FitnessHistoryChart, EvaluationSummary, type EvaluationStats, type GenerationDataPoint } from './FitnessHistoryChart.tsx'
import './training-hud.css'

export type TrainingStatus = 'idle' | 'running' | 'paused' | 'evolving'
export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'error'

interface NeatTrainingHudProps {
  evaluation?: EvaluationStats
  timeScale?: SimulationSpeed
  onTimeScaleChange?: (speed: SimulationSpeed) => void
  alive: number
  currentBest: number
  generation: number
  metrics: GenerationMetrics
  onPauseToggle: () => void
  onRegenerateTrack: () => void
  onReset: () => void
  onSelectRun: () => void
  onStart: () => void
  onAdvanceGeneration?: () => void
  canAdvanceGeneration?: boolean
  inspectingCar?: boolean
  onDismissCar?: () => void
  persistenceStatus: PersistenceStatus
  localOnly?: boolean
  onRetrySave?: () => void
  populationSize: number
  status: TrainingStatus
  trainingName: string
  cameraMode?: RaceCameraMode
  onCameraModeChange?: (mode: RaceCameraMode) => void
  selectedCar?: number
  onSelectedCarChange?: (index: number) => void
  trackSeed?: number
  showRaycasts?: boolean
  onShowRaycastsChange?: (enabled: boolean) => void

  track?: TrackDefinition
  cars?: MinimapCarInfo[]
  leaderboardEntries?: LeaderboardEntry[]
  generationHistory?: GenerationDataPoint[]
  posesRef?: React.RefObject<Map<string, CarPose>>
  selectedGenomeId?: string
}

const statusLabels: Record<TrainingStatus, string> = {
  idle: 'Preparado',
  running: 'Evaluando',
  paused: 'Pausado',
  evolving: 'Evolucionando',
}

const saveLabels: Record<PersistenceStatus, string> = {
  idle: 'Sin evaluar',
  saving: 'Guardando',
  saved: 'Guardado',
  error: 'Error de guardado',
}

export function NeatTrainingHud({
  timeScale = 1,
  onTimeScaleChange,
  alive,
  currentBest,
  generation,
  metrics,
  onPauseToggle,
  onRegenerateTrack,
  onReset,
  onSelectRun,
  onStart,
  onAdvanceGeneration,
  canAdvanceGeneration = false,
  inspectingCar = false,
  onDismissCar,
  persistenceStatus,
  localOnly = false,
  onRetrySave,
  populationSize,
  status,
  trainingName,
  cameraMode = 'free',
  onCameraModeChange,
  selectedCar = 0,
  onSelectedCarChange,
  trackSeed,
  showRaycasts = false,
  onShowRaycastsChange,
  track,
  cars = [],
  leaderboardEntries = [],
  generationHistory = [],
  posesRef,
  selectedGenomeId,
  evaluation,
}: NeatTrainingHudProps) {
  const [telemetry, setTelemetry] = useState(false)
  const [controls, setControls] = useState(false)

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        document.querySelector('dialog[open]') ||
        (event.target as HTMLElement).closest('input, select, textarea')
      )
        return
      if (
        event.key === 'Escape' &&
        (status === 'running' || status === 'paused')
      )
        onPauseToggle()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onPauseToggle, status])

  // Fallback entries if none provided by parent
  const activeEntries =
    leaderboardEntries.length > 0
      ? leaderboardEntries
      : Array.from({ length: populationSize }, (_, index) => ({
          index,
          id: `car-${index}`,
          name: `Auto ${String(index + 1).padStart(2, '0')}`,
          hue: (index * 47) % 360,
          score: index === 0 ? currentBest : 0,
          passedCheckpoints: 0,
          status: (index === 0 && currentBest > 0 ? 'leader' : 'running') as 'leader' | 'running',
        }))

  return (
    <div className="neat-hud">
      {/* Top Bar */}
      <header className="neat-hud__topbar">
        <div className="neat-hud__brand-group">
          <Link to="/dashboard" className="neat-hud__back-link">
            ← Paddock
          </Link>
          <div className="neat-hud__gen-badge">
            <h2 style={{ margin: 0, fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
              Generación {generation + 1}
            </h2>
            <span>/ {trainingName} {trackSeed !== undefined && `#${trackSeed}`}</span>
          </div>
          <span className={`neat-hud__status-pill training-status--${status}`}>
            {statusLabels[status]}
          </span>
        </div>

        <div className="neat-hud__top-actions">
          {onCameraModeChange && (
            <button
              type="button"
              onClick={() =>
                onCameraModeChange(cameraMode === 'follow' ? 'free' : 'follow')
              }
            >
              {cameraMode === 'follow' ? 'Vista libre' : 'Seguir auto'}
            </button>
          )}

          {/* Accessible Piloto Select (hidden visually or inline) */}
          {onSelectedCarChange && (
            <label style={{ display: 'none' }}>
              Piloto
              <select
                aria-label="Auto observado"
                value={selectedCar}
                onChange={(event) =>
                  onSelectedCarChange(Number(event.target.value))
                }
              >
                {Array.from({ length: populationSize }, (_, index) => (
                  <option key={index} value={index}>
                    Auto {String(index + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            aria-expanded={telemetry}
            onClick={() => {
              setTelemetry(!telemetry)
              setControls(false)
              onDismissCar?.()
            }}
          >
            Telemetría
          </button>

          <button
            type="button"
            aria-expanded={controls}
            onClick={() => {
              setControls(!controls)
              setTelemetry(false)
              onDismissCar?.()
            }}
          >
            Opciones
          </button>
        </div>
      </header>

      {/* Persistence Error Alert */}
      {persistenceStatus === 'error' && onRetrySave && (
        <section className="telemetry-panel" style={{ top: '4.5rem', left: '1rem', right: 'auto' }}>
          <ErrorNotice error="No se pudo guardar la generación. El entrenamiento está pausado para conservarla. Reintenta el guardado." />
          <button type="button" className="primary-button" onClick={onRetrySave}>
            Reintentar guardado
          </button>
        </section>
      )}

      {/* Main Area: Standings on Left, Minimap / Telemetry on Right */}
      <div className="neat-hud__main-area">
        <LiveLeaderboard
          entries={activeEntries}
          selectedCar={selectedCar}
          onSelectCar={(index) => {
            onSelectedCarChange?.(index)
            if (cameraMode !== 'follow') {
              onCameraModeChange?.('follow')
            }
          }}
        />

        <div className="neat-hud__right-column">
          {track && (
            <TrainingMinimap
              track={track}
              cars={cars}
              selectedGenomeId={selectedGenomeId}
              posesRef={posesRef}
            />
          )}

          {/* Telemetry Panel */}
          {telemetry && !inspectingCar && (
            <section className="telemetry-panel" aria-label="Telemetría NEAT">
              <h3>Esta generación</h3>
              {evaluation && <EvaluationSummary stats={evaluation} />}
              <label className="raycast-toggle">
                <input
                  type="checkbox"
                  aria-label="Mostrar raycasts"
                  checked={showRaycasts}
                  onChange={(event) =>
                    onShowRaycastsChange?.(event.target.checked)
                  }
                />
                <span>Mostrar raycasts<small aria-hidden="true">{showRaycasts ? 'Sensores activados' : 'Sensores desactivados'}</small></span>
              </label>
              {showRaycasts && <p className="telemetry-help">Rojo: borde · Turquesa: libre · Amarillo: auto observado.</p>}
              <details className="telemetry-disclosure">
                <summary>Evolución del entrenamiento</summary>
              <FitnessHistoryChart history={generationHistory} />
              </details>
              <details className="telemetry-disclosure">
                <summary>Detalles NEAT</summary>
              <p className="telemetry-help">Resultados de la última generación evaluada.</p>
              <dl>
                <dt>Mejor puntuación</dt>
                <dd>{metrics.bestFitness.toFixed(0)}</dd>
                <dt>Promedio</dt>
                <dd>{metrics.averageFitness.toFixed(0)}</dd>
                <dt>Especies</dt>
                <dd>{metrics.speciesCount}</dd>
              </dl>
              <p className="telemetry-help">Las especies agrupan redes neuronales similares. La puntuación combina sectores superados, vueltas, distancia y supervivencia.</p>
              </details>
            </section>
          )}

          {/* Options / Settings Panel */}
          {!inspectingCar && controls && !telemetry && (
            <section
              className="telemetry-panel"
              aria-label="Opciones del entrenamiento"
            >
              <h3>
                {status === 'paused' ? 'En boxes / Pausa' : 'Control de escudería'}
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={onReset}
                  disabled={
                    persistenceStatus === 'saving' || status === 'evolving'
                  }
                >
                  Recargar
                </button>
                <button
                  type="button"
                  onClick={onRegenerateTrack}
                  disabled={
                    status === 'evolving' || persistenceStatus === 'saving'
                  }
                >
                  Regenerar pista
                </button>
                <button
                  type="button"
                  onClick={onSelectRun}
                  disabled={
                    persistenceStatus === 'saving' || status === 'evolving'
                  }
                >
                  Cambiar entrenamiento
                </button>
                <GameSettings />
              </div>
              <p style={{ fontSize: '11px', color: '#9eb0a4', margin: 0 }}>
                <kbd style={{ padding: '2px 4px', border: '1px solid #4d685c', background: '#0e1613' }}>
                  ESC
                </kbd>{' '}
                Pausar / reanudar
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Bottom Arcade Tape-Deck & Metrics Bar */}
      <footer className="neat-hud__bottom-bar">
        {/* Live Metrics Cluster */}
        <section className="neat-metrics neat-hud__stats-cluster" aria-label="Métricas NEAT" style={{ position: 'static', margin: 0, padding: 0, background: 'none', border: 0 }}>
          <div className="neat-hud__stat">
            <span className="neat-hud__stat-label">Vivos</span>
            <strong className="neat-hud__stat-value is-success">
              {alive}/{populationSize}
            </strong>
          </div>
          <div className="neat-hud__stat">
            <span className="neat-hud__stat-label">Mejor actual</span>
            <strong className="neat-hud__stat-value is-accent">
              {currentBest.toFixed(0)}
            </strong>
          </div>
          <div className="neat-hud__stat">
            <span className="neat-hud__stat-label">Mejor anterior</span>
            <strong className="neat-hud__stat-value">
              {metrics.bestFitness.toFixed(0)}
            </strong>
          </div>
          <div className="neat-hud__stat">
            <span className="neat-hud__stat-label">
              {localOnly ? 'En este dispositivo' : 'En tu cuenta'}
            </span>
            <strong
              role="status"
              className={`neat-hud__stat-value persistence-state persistence-state--${persistenceStatus}`}
            >
              {saveLabels[persistenceStatus]}
            </strong>
          </div>
        </section>

        {/* Simulation Arcade Controls */}
        <div className="neat-hud__tape-controls">
          {onAdvanceGeneration && (
            <button
              type="button"
              disabled={!canAdvanceGeneration}
              onClick={onAdvanceGeneration}
            >
              Pasar de generación
            </button>
          )}

          <SimulationSpeedControl
            speed={timeScale}
            onChange={onTimeScaleChange}
          />

          {status === 'idle' ? (
            <button
              type="button"
              className="primary-button play-button"
              onClick={onStart}
            >
              Iniciar
            </button>
          ) : (
            <button
              type="button"
              className="primary-button play-button"
              onClick={onPauseToggle}
              disabled={status === 'evolving' || persistenceStatus === 'saving'}
            >
              {status === 'paused' ? 'Reanudar' : 'Pausar'}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
