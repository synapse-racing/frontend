import type { CSSProperties } from 'react'
import type { VehicleAppearance } from '../domain/appearance.ts'

export function NumberPicker({
  draft,
  modelName,
  numberText,
  validNumber,
  exceedsMaximum,
  onNumberText,
}: {
  draft: VehicleAppearance
  modelName: string
  numberText: string
  validNumber: boolean
  exceedsMaximum: boolean
  onNumberText: (value: string) => void
}) {
  return (
    <div className="garage-identity">
      <label htmlFor="garage-number">Tu número en la parrilla</label>
      <div className="garage-number-row">
        <div className="garage-number-input">
          <span>#</span>
          <input
            id="garage-number"
            type="number"
            min="1"
            max="67"
            step="1"
            value={numberText}
            aria-invalid={!validNumber}
            aria-describedby={exceedsMaximum ? 'garage-number-error' : 'garage-number-hint'}
            onChange={(event) => onNumberText(event.target.value)}
          />
        </div>
        <div
          className="garage-number-preview"
          style={{ '--paint': draft.primaryColor } as CSSProperties}
        >
          <span>SYNAPSE RACING</span>
          <strong>{validNumber ? numberText.padStart(2, '0') : '—'}</strong>
          <small>{modelName}</small>
        </div>
      </div>
      {exceedsMaximum ? (
        <p id="garage-number-error" role="alert" className="garage-number-error">
          El número máximo permitido es 67.
        </p>
      ) : (
        <p id="garage-number-hint">
          Elige un número del 1 al 67. Aparecerá en tu auto.
        </p>
      )}
    </div>
  )
}
