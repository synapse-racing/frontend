import { useId, useState } from 'react'
import {
  vehicleSkinCatalog,
  type VehicleAppearance,
  type VehicleSkinId,
  type VehicleSkinMode,
} from '../domain/appearance.ts'

const skinModes: ReadonlyArray<readonly [VehicleSkinMode, string]> = [
  ['wrap', 'Vinilo completo'],
  ['tint', 'Vinilo teñido'],
]

function searchable(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function SkinPicker({
  draft,
  onChange,
}: {
  draft: VehicleAppearance
  onChange: (value: Partial<VehicleAppearance>) => void
}) {
  const activeSkin: VehicleSkinId = draft.skin ?? 'none'
  const activeMode: VehicleSkinMode = draft.skinMode ?? 'wrap'
  const activeScale = draft.skinScale ?? 1
  const scaleId = useId()
  const [search, setSearch] = useState('')
  const query = searchable(search.trim())
  const skins = vehicleSkinCatalog.filter((skin) => searchable(skin.name).includes(query))
  const showPaint = searchable('Solo pintura sin vinilo').includes(query)

  return (
    <div className="garage-skins">
      <div className="garage-skin-search">
        <div className="garage-skin-search__field">
          <input
            type="search"
            aria-label="Buscar vinilo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault()
            }}
            placeholder="Buscar vinilo"
          />
        </div>
        <span role="status">
          {query ? `${skins.length + Number(showPaint)} resultados` : `${vehicleSkinCatalog.length} vinilos`}
        </span>
      </div>
      <details className="garage-skin-settings">
        <summary>Ajustar vinilo</summary>
        <fieldset className="garage-choice">
          <legend>Modo de aplicación</legend>
          <div>
            {skinModes.map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={activeMode === value}
                disabled={activeSkin === 'none'}
                onClick={() => onChange({ skinMode: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="garage-skin-scale">
          <div className="garage-skin-scale__header">
            <label htmlFor={scaleId}>Escala del patrón</label>
            <span aria-live="polite">{activeScale.toFixed(2)}×</span>
          </div>
          <input
            id={scaleId}
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            disabled={activeSkin === 'none'}
            value={activeScale}
            onChange={(event) =>
              onChange({ skinScale: Number(event.target.value) })
            }
          />
        </div>
      </details>

      <fieldset className="garage-skin-fieldset">
        <legend>Catálogo de vinilos</legend>
        <div className="garage-skin-grid">
          {showPaint && (
            <button
              type="button"
              className="garage-skin-card"
              aria-pressed={activeSkin === 'none'}
              onClick={() => onChange({ skin: 'none' })}
            >
              <span className="garage-skin-thumb garage-skin-thumb--none" aria-hidden="true">
                —
              </span>
              <span className="garage-skin-name">Solo pintura</span>
            </button>
          )}
          {skins.map((skin) => (
            <button
              type="button"
              key={skin.id}
              className="garage-skin-card"
              aria-pressed={activeSkin === skin.id}
              onClick={() => onChange({ skin: skin.id })}
            >
              <img
                src={skin.texture}
                alt=""
                aria-hidden="true"
                className="garage-skin-thumb"
                loading="lazy"
              />
              <span className="garage-skin-name">{skin.name}</span>
            </button>
          ))}
        </div>
        {!showPaint && !skins.length && <p className="garage-skin-empty">No encontramos vinilos con ese nombre.</p>}
      </fieldset>
    </div>
  )
}
