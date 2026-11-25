import {
  vehicleSkinCatalog,
  type VehicleAppearance,
  type VehicleSkinId,
  type VehicleSkinMode,
} from '../domain/appearance.ts'

const skinModes: ReadonlyArray<readonly [VehicleSkinMode, string]> = [
  ['wrap', 'Wrap completo'],
  ['tint', 'Vinilo teñido'],
]

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

  return (
    <div className="garage-skins">
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
          <label htmlFor="garage-skin-scale-input">Escala del patrón</label>
          <span aria-live="polite">{activeScale.toFixed(2)}×</span>
        </div>
        <input
          id="garage-skin-scale-input"
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

      <fieldset className="garage-skin-fieldset">
        <legend>Catálogo de vinilos</legend>
        <div className="garage-skin-grid">
          <button
            type="button"
            className="garage-skin-card garage-skin-card--none"
            aria-pressed={activeSkin === 'none'}
            onClick={() => onChange({ skin: 'none' })}
          >
            <span className="garage-skin-thumb garage-skin-thumb--none">
              NO VINYL
            </span>
            <span className="garage-skin-name">Sin skin (Pintura)</span>
          </button>
          {vehicleSkinCatalog.map((skin) => (
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
      </fieldset>
    </div>
  )
}
