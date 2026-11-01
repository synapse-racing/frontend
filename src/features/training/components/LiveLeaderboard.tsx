import { useState } from 'react'

export interface LeaderboardEntry {
  index: number
  id: string
  name: string
  hue: number
  score: number
  passedCheckpoints: number
  status: 'leader' | 'running' | 'crashed' | 'finished'
}

interface LiveLeaderboardProps {
  entries: LeaderboardEntry[]
  selectedCar: number
  onSelectCar: (index: number) => void
}

export function LiveLeaderboard({
  entries,
  selectedCar,
  onSelectCar,
}: LiveLeaderboardProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`neat-standings ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="Clasificación en vivo"
    >
      <header className="neat-standings__header">
        <span className="neat-standings__title">Clasificación</span>
        <button
          type="button"
          className="neat-standings__toggle"
          aria-label={collapsed ? 'Expandir tabla' : 'Colapsar tabla'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '[+]' : '[−]'}
        </button>
      </header>
      {!collapsed && (
        <div className="neat-standings__list" role="list">
          {entries.map((entry, rank) => {
            const isSelected = entry.index === selectedCar
            const badgeClass =
              entry.status === 'leader'
                ? 'neat-standings__badge--lead'
                : entry.status === 'finished'
                  ? 'neat-standings__badge--fin'
                  : entry.status === 'crashed'
                    ? 'neat-standings__badge--ko'
                    : 'neat-standings__badge--run'

            const badgeText =
              entry.status === 'leader'
                ? '[P1]'
                : entry.status === 'finished'
                  ? '[FIN]'
                  : entry.status === 'crashed'
                    ? '[KO]'
                    : '[RUN]'

            return (
              <button
                type="button"
                key={entry.id}
                role="listitem"
                className={`neat-standings__row ${isSelected ? 'is-selected' : ''} ${entry.status === 'crashed' ? 'is-crashed' : ''}`}
                onClick={() => onSelectCar(entry.index)}
                aria-pressed={isSelected}
              >
                <span className="neat-standings__pos">
                  {String(rank + 1).padStart(2, '0')}
                </span>
                <span
                  className="neat-standings__dot"
                  style={{ backgroundColor: `hsl(${entry.hue}, 72%, 56%)` }}
                />
                <span className="neat-standings__name">{entry.name}</span>
                <span className={`neat-standings__badge ${badgeClass}`}>
                  {badgeText}
                </span>
                <span className="neat-standings__score">
                  {entry.score > 0 ? entry.score.toFixed(0) : `S${entry.passedCheckpoints}`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
