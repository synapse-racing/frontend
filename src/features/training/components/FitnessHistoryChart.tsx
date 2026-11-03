import { useState } from 'react'

export interface EvaluationStats {
  bestProgress: number
  completedCars: number
  populationSize: number
  bestLapSeconds: number | null
}

export interface GenerationDataPoint extends Partial<EvaluationStats> {
  generation: number
  bestFitness: number
  averageFitness: number
}

export function EvaluationSummary({ stats }: { stats: Partial<EvaluationStats> }) {
  return (
    <div className="evaluation-summary">
      <div className="evaluation-summary__progress">
        <span>Mejor recorrido <strong>{stats.bestProgress === undefined ? 'Sin datos' : `${stats.bestProgress.toFixed(0)} %`}</strong></span>
        <progress aria-label="Mejor recorrido por sectores" max={100} value={stats.bestProgress ?? 0} />
      </div>
      <dl>
        <dt>Llegaron a meta</dt><dd>{stats.completedCars === undefined ? 'Sin datos' : `${stats.completedCars} de ${stats.populationSize}`}</dd>
        <dt>Mejor vuelta</dt><dd>{stats.bestLapSeconds == null ? 'Sin vuelta completa' : `${stats.bestLapSeconds.toFixed(2)} s`}</dd>
      </dl>
    </div>
  )
}

export function FitnessHistoryChart({ history }: { history: GenerationDataPoint[] }) {
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null)
  if (!history.length) {
    return <p className="fitness-chart-empty">Completa una generación para ver su evolución y comparar resultados.</p>
  }
  const selected = history.find((point) => point.generation === selectedGeneration) ?? history[history.length - 1]
  const max = Math.max(...history.map((point) => point.bestFitness), 10)
  const x = (index: number) => history.length === 1 ? 140 : 16 + index / (history.length - 1) * 248
  const y = (fitness: number) => 92 - fitness / max * 76
  const selectedIndex = history.indexOf(selected)
  const previousBest = Math.max(0, ...history.slice(0, selectedIndex).map((point) => point.bestFitness))
  const isRecord = selected.bestFitness > previousBest
  return (
    <div className="fitness-chart">
      <div className="fitness-chart__legend"><span>● Mejor piloto</span><span>● Promedio</span></div>
      <svg viewBox="0 0 280 110" role="img" aria-label="Puntuación por generación: naranja para el mejor piloto y gris para el promedio. Más alto indica mayor puntuación.">
        <title>Evolución de la puntuación</title>
        {[16, 54, 92].map((height) => <line key={height} x1={16} y1={height} x2={264} y2={height} stroke="#26353d" strokeDasharray="3 4" />)}
        <polyline fill="none" stroke="#9eb0bc" strokeWidth="2" points={history.map((point, index) => `${x(index)},${y(point.averageFitness)}`).join(' ')} />
        <polyline fill="none" stroke="#ff8a50" strokeWidth="2.5" points={history.map((point, index) => `${x(index)},${y(point.bestFitness)}`).join(' ')} />
        {history.map((point, index) => <circle key={point.generation} cx={x(index)} cy={y(point.bestFitness)} r={point === selected ? 5 : 2.5} fill={point === selected ? '#e1ff8b' : '#ff8a50'} />)}
        <text x={16} y={106} fill="#9eb0bc" fontSize={9}>Gen. {history[0].generation}</text>
        <text x={264} y={106} textAnchor="end" fill="#9eb0bc" fontSize={9}>Gen. {history[history.length - 1].generation}</text>
      </svg>
      <label className="fitness-chart__selector">Ver generación
        <select value={selected.generation} onChange={(event) => setSelectedGeneration(Number(event.target.value))}>
          {history.map((point) => <option key={point.generation} value={point.generation}>Generación {point.generation}</option>)}
        </select>
      </label>
      {isRecord && <div className="fitness-chart__record">★ Nuevo récord de puntuación</div>}
      <dl><dt>Mejor puntuación</dt><dd>{selected.bestFitness.toFixed(0)}</dd><dt>Promedio</dt><dd>{selected.averageFitness.toFixed(0)}</dd></dl>
      <EvaluationSummary stats={selected} />
      <p className="telemetry-help">Más alto = mejor puntuación. El recorrido se calcula por sectores superados; los tiempos corresponden a la simulación. Historial de esta sesión.</p>
    </div>
  )
}
