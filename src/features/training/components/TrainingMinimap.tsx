import { useEffect, useMemo, useRef, useState } from 'react'
import type { TrackDefinition } from '../domain/track.ts'
import type { CarPose } from '../../../shared/three/RaceCamera.tsx'

export interface MinimapCarInfo {
  id: string
  hue: number
}

interface TrainingMinimapProps {
  track: TrackDefinition
  cars: MinimapCarInfo[]
  selectedGenomeId?: string
  posesRef?: React.RefObject<Map<string, CarPose>>
}

export function TrainingMinimap({
  track,
  cars,
  selectedGenomeId,
  posesRef,
}: TrainingMinimapProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [width, height] = track.groundSize
  const carNodesRef = useRef<Map<string, SVGCircleElement>>(new Map())
  const ringNodeRef = useRef<SVGCircleElement>(null)

  const boundaryLines = useMemo(() => {
    return track.boundaries.map(([x1, z1, x2, z2], index) => (
      <line
        key={index}
        x1={x1}
        y1={z1}
        x2={x2}
        y2={z2}
        stroke="#2e3f48"
        strokeWidth={1}
      />
    ))
  }, [track.boundaries])

  // Real-time 60fps position update directly on SVG DOM (0 React re-renders)
  useEffect(() => {
    if (collapsed || !posesRef) return
    let animId: number

    const tick = () => {
      const poses = posesRef.current
      if (poses) {
        for (const car of cars) {
          const pose = poses.get(car.id)
          const node = carNodesRef.current.get(car.id)
          if (node && pose) {
            node.setAttribute('cx', pose.x.toFixed(2))
            node.setAttribute('cy', pose.z.toFixed(2))
            if (car.id === selectedGenomeId && ringNodeRef.current) {
              ringNodeRef.current.setAttribute('cx', pose.x.toFixed(2))
              ringNodeRef.current.setAttribute('cy', pose.z.toFixed(2))
            }
          }
        }
      }
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [collapsed, posesRef, cars, selectedGenomeId])

  return (
    <div
      className="training-minimap"
      role="region"
      aria-label="Minimapa del circuito"
    >
      <header className="training-minimap__header">
        <span className="training-minimap__label">Radar Circuito</span>
        <button
          type="button"
          className="neat-standings__toggle"
          aria-label={collapsed ? 'Expandir minimapa' : 'Colapsar minimapa'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '[+]' : '[−]'}
        </button>
      </header>
      {!collapsed && (
        <svg
          className="training-minimap__svg"
          viewBox={`${-width / 2 - 3} ${-height / 2 - 3} ${width + 6} ${height + 6}`}
          role="img"
          aria-label="Trazado y posiciones"
        >
          {boundaryLines}

          {/* Spawn line / start */}
          <circle
            cx={track.spawnPosition[0]}
            cy={track.spawnPosition[2]}
            r={2}
            fill="#ff692f"
            opacity={0.85}
          />

          {/* Following target ring */}
          <circle
            ref={ringNodeRef}
            cx={track.spawnPosition[0]}
            cy={track.spawnPosition[2]}
            r={4.2}
            fill="none"
            stroke="#ff692f"
            strokeWidth={1}
            strokeDasharray="2 2"
          />

          {/* Car position dots */}
          {cars.map((car) => (
            <circle
              key={car.id}
              ref={(el) => {
                if (el) carNodesRef.current.set(car.id, el)
                else carNodesRef.current.delete(car.id)
              }}
              cx={track.spawnPosition[0]}
              cy={track.spawnPosition[2]}
              r={1.8}
              fill={`hsl(${car.hue}, 80%, 55%)`}
              stroke="#0d1417"
              strokeWidth={0.4}
            />
          ))}
        </svg>
      )}
    </div>
  )
}
