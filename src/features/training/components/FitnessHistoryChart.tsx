export interface GenerationDataPoint {
  generation: number
  bestFitness: number
  averageFitness: number
}

interface FitnessHistoryChartProps {
  history: GenerationDataPoint[]
}

export function FitnessHistoryChart({ history }: FitnessHistoryChartProps) {
  if (history.length < 2) {
    return (
      <div className="fitness-chart-empty" style={{ font: '10px monospace', color: '#8b9ea8' }}>
        [Evolución: Registrando generaciones...]
      </div>
    )
  }

  const maxFitness = Math.max(...history.map((p) => p.bestFitness), 10)
  const minFitness = 0
  const width = 280
  const height = 80
  const padding = 10

  const pointsBest = history.map((p, i) => {
    const x = padding + (i / (history.length - 1)) * (width - 2 * padding)
    const y =
      height -
      padding -
      ((p.bestFitness - minFitness) / (maxFitness - minFitness)) *
        (height - 2 * padding)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pointsAvg = history.map((p, i) => {
    const x = padding + (i / (history.length - 1)) * (width - 2 * padding)
    const y =
      height -
      padding -
      ((p.averageFitness - minFitness) / (maxFitness - minFitness)) *
        (height - 2 * padding)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <div className="fitness-chart" aria-label="Curva de aprendizaje">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '80px', background: '#0a0f12', border: '1px solid #26353d', borderRadius: '3px' }}
      >
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding}
          x2={width - padding}
          y2={padding}
          stroke="#162227"
          strokeDasharray="2 2"
        />
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="#162227"
          strokeDasharray="2 2"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#26353d"
        />

        {/* Lines */}
        <polyline
          fill="none"
          stroke="#8b9ea8"
          strokeWidth="1.2"
          points={pointsAvg.join(' ')}
          opacity={0.8}
        />
        <polyline
          fill="none"
          stroke="#ff692f"
          strokeWidth="1.8"
          points={pointsBest.join(' ')}
        />
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          fontFamily: 'monospace',
          color: '#8b9ea8',
          marginTop: '3px',
        }}
      >
        <span style={{ color: '#ff692f' }}>[Récord: {maxFitness.toFixed(0)}]</span>
        <span style={{ color: '#8b9ea8' }}>[Media]</span>
        <span>Gen {history[history.length - 1].generation}</span>
      </div>
    </div>
  )
}
