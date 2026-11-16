import { useState, type FormEvent } from 'react'
import {
  defaultAppearance,
  vehicleCatalog,
  type VehicleAppearance,
} from '../domain/appearance.ts'
import { CarSilhouette } from './CarSilhouette.tsx'

export interface GarageMenuProps {
  draft?: VehicleAppearance
  onChange?: (value: Partial<VehicleAppearance>) => void
  onSave?: () => void
  onSaveAndExit?: () => void
  onDiscard?: () => void
  onReset?: () => void
  onExit?: () => void
  saving?: boolean
  dirty?: boolean
  canSave?: boolean
  guestDesign?: VehicleAppearance | null
  onLoadGuestDesign?: (design: VehicleAppearance) => void
  statusMessage?: string
}

const TABS = [
  ['model', '01 // Modelo'],
  ['colors', '02 // Colores'],
  ['finish', '03 // Acabado'],
  ['number', '04 // Número'],
] as const

type TabKey = (typeof TABS)[number][0]

const PALETTE = [
  ['Verde Ácido', '#39ff14'],
  ['Rosa Tóxico', '#ff007f'],
  ['Azul Nitro', '#00f0ff'],
  ['Naranja Fuego', '#ff6600'],
  ['Amarillo Peligro', '#fffb00'],
  ['Blanco Cromo', '#f4ead3'],
  ['Rojo Sangre', '#d94149'],
  ['Negro Carbón', '#1a1f1c'],
] as const

const FINISHES = [
  ['matte', 'Mate'],
  ['satin', 'Satinado'],
  ['metallic', 'Metálico'],
] as const

const LIVERIES = [
  ['solid', 'Liso'],
  ['stripe', 'Franjas'],
  ['split', 'Bicolor'],
] as const

export function GarageMenu({
  draft: controlledDraft,
  onChange: controlledOnChange,
  onSave,
  onSaveAndExit,
  onDiscard,
  onReset,
  onExit,
  saving = false,
  dirty: controlledDirty,
  canSave: controlledCanSave,
  guestDesign,
  onLoadGuestDesign,
  statusMessage,
}: GarageMenuProps) {
  const [internalDraft, setInternalDraft] = useState<VehicleAppearance>(defaultAppearance)
  const [activeTab, setActiveTab] = useState<TabKey>('model')
  const [numberInput, setNumberInput] = useState<string>(
    String(controlledDraft?.number ?? defaultAppearance.number),
  )

  const draft = controlledDraft ?? internalDraft
  const isDirty = controlledDirty ?? (JSON.stringify(draft) !== JSON.stringify(defaultAppearance))
  const validNumber =
    /^\d{1,2}$/.test(numberInput) &&
    Number(numberInput) >= 1 &&
    Number(numberInput) <= 67
  const isCanSave = controlledCanSave ?? (validNumber && !saving)

  const handleUpdate = (patch: Partial<VehicleAppearance>) => {
    if (controlledOnChange) {
      controlledOnChange(patch)
    } else {
      setInternalDraft((prev) => ({ ...prev, ...patch }))
    }
  }

  const currentModel =
    vehicleCatalog.find((m) => m.id === draft.modelId) ?? vehicleCatalog[0]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (onSave) onSave()
  }

  return (
    <div
      className="garage-menu-root bg-[url('/assets/textures/carbon-fiber.jpg')] text-white font-black italic uppercase tracking-tighter"
      style={{
        width: '100%',
        maxWidth: '460px',
        backgroundImage:
          "linear-gradient(135deg, rgba(8, 12, 10, 0.94) 0%, rgba(14, 20, 16, 0.96) 100%), url('/assets/textures/carbon-fiber.jpg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '16px 16px',
        backgroundBlendMode: 'multiply',
        border: '3px solid #4a544e',
        borderLeft: '5px solid #39ff14',
        boxShadow:
          'inset 0 0 35px rgba(0, 0, 0, 0.95), 0 0 25px rgba(57, 255, 20, 0.35), 0 15px 35px rgba(0,0,0,0.85)',
        clipPath:
          'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))',
        padding: '20px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        userSelect: 'none',
      }}
    >
      {/* Corner Hex Bolts */}
      <span
        style={{
          position: 'absolute',
          top: '6px',
          left: '6px',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #bbb, #333)',
          boxShadow: 'inset 1px 1px 0 #fff, 0 0 3px #000',
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: '6px',
          right: '6px',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #bbb, #333)',
          boxShadow: 'inset 1px 1px 0 #fff, 0 0 3px #000',
        }}
      />

      {/* Header Banner */}
      <div
        className="garage-menu-header"
        style={{
          borderBottom: '2px solid #39ff14',
          paddingBottom: '10px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: '#39ff14',
              textShadow: '0 0 8px #39ff14',
            }}
          >
            /// SYNAPSE TUNING // BOX 01
          </span>
          <span
            style={{
              fontSize: '10px',
              color: '#fff',
              background: '#ff007f',
              padding: '2px 6px',
              transform: 'skewX(-12deg)',
              boxShadow: '0 0 10px #ff007f',
            }}
          >
            2005 UNDERGROUND
          </span>
        </div>
        <h1
          style={{
            margin: '4px 0 0',
            fontSize: '28px',
            lineHeight: 1,
            color: '#fff',
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 0 0 15px rgba(57, 255, 20, 0.6)',
          }}
        >
          PERSONALIZACIÓN
        </h1>
        {statusMessage && (
          <div
            role="status"
            style={{
              marginTop: '6px',
              fontSize: '11px',
              color: '#39ff14',
              textShadow: '0 0 6px #39ff14',
            }}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {/* Aggressive Skewed Tabs */}
      <div
        role="tablist"
        aria-label="Personalización"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
        }}
      >
        {TABS.map(([tabId, label]) => {
          const isActive = activeTab === tabId
          return (
            <button
              type="button"
              key={tabId}
              id={`garage-tab-${tabId}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`garage-panel-${tabId}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tabId)}
              style={{
                transform: 'skewX(-12deg)',
                background: isActive
                  ? 'linear-gradient(180deg, #2b332d 0%, #151a17 100%)'
                  : 'linear-gradient(180deg, #444b46 0%, #202422 100%)',
                border: isActive ? '2px solid #39ff14' : '2px solid #636d66',
                borderTopColor: isActive ? '#39ff14' : '#9ca69f',
                boxShadow: isActive
                  ? '0 0 14px #39ff14, inset 0 0 10px rgba(57, 255, 20, 0.4)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.2)',
                color: isActive ? '#39ff14' : '#c3cec7',
                padding: '8px 2px',
                fontSize: '11px',
                fontWeight: 900,
                fontStyle: 'italic',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              <span style={{ display: 'inline-block', transform: 'skewX(12deg)' }}>
                {label.replace(' // ', ' ')}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Tab Panels Form */}
      <form
        onSubmit={handleSubmit}
        aria-label="Personalización del auto"
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        {/* Panel Container */}
        <div
          role="tabpanel"
          id={`garage-panel-${activeTab}`}
          aria-labelledby={`garage-tab-${activeTab}`}
          style={{
            background:
              "linear-gradient(180deg, rgba(12, 16, 14, 0.9) 0%, rgba(6, 8, 7, 0.95) 100%), url('/assets/textures/metal-scratch.jpg')",
            backgroundSize: 'cover',
            backgroundBlendMode: 'multiply',
            border: '2px solid #555f58',
            boxShadow: 'inset 0 0 20px #000',
            padding: '14px',
            minHeight: '220px',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)',
          }}
        >
          {/* TAB 1: MODEL */}
          {activeTab === 'model' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
                aria-label="Modelos disponibles"
              >
                {vehicleCatalog.map((model, idx) => {
                  const isSelected = draft.modelId === model.id
                  return (
                    <button
                      type="button"
                      key={model.id}
                      aria-pressed={isSelected}
                      onClick={() => handleUpdate({ modelId: model.id })}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(180deg, #1b261e 0%, #0d1410 100%)'
                          : 'linear-gradient(180deg, #373e39 0%, #1c211e 100%)',
                        border: isSelected ? '2px solid #39ff14' : '2px solid #58635c',
                        borderTopColor: isSelected ? '#39ff14' : '#8a968e',
                        boxShadow: isSelected
                          ? '0 0 16px #39ff14, inset 0 0 10px rgba(57, 255, 20, 0.3)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.2)',
                        padding: '8px 4px',
                        cursor: 'pointer',
                        transform: 'skewX(-6deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9px',
                          color: isSelected ? '#39ff14' : '#88948d',
                          alignSelf: 'flex-start',
                        }}
                      >
                        0{idx + 1}
                      </span>
                      <CarSilhouette
                        modelId={model.id}
                        color={isSelected ? draft.primaryColor : '#7a8580'}
                      />
                      <strong
                        style={{
                          fontSize: '12px',
                          color: isSelected ? '#39ff14' : '#fff',
                          textShadow: isSelected ? '0 0 8px #39ff14' : 'none',
                        }}
                      >
                        {model.name}
                      </strong>
                      <small style={{ fontSize: '9px', color: '#97a39d' }}>{model.category}</small>
                    </button>
                  )
                })}
              </div>
              <div
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  borderLeft: '3px solid #ff007f',
                  padding: '6px 10px',
                  marginTop: '4px',
                }}
              >
                <p style={{ margin: 0, fontSize: '11px', color: '#ff007f' }}>
                  {currentModel.description}
                </p>
                <small style={{ fontSize: '9px', color: '#7a8580' }}>
                  MISMO RENDIMIENTO · MÁXIMO ESTILO CALLEJERO
                </small>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS */}
          {activeTab === 'colors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(
                [
                  ['primaryColor', 'Carrocería'],
                  ['secondaryColor', 'Detalles'],
                  ['rimColor', 'Llantas'],
                ] as const
              ).map(([field, label]) => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ color: '#fff' }}>{label}</span>
                    <span style={{ color: '#39ff14', textShadow: '0 0 6px #39ff14' }}>
                      {draft[field].toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <label
                      style={{
                        position: 'relative',
                        width: '32px',
                        height: '24px',
                        cursor: 'pointer',
                        border: '2px solid #8b9991',
                        borderTopColor: '#d6e2db',
                        background: draft[field],
                        boxShadow: 'inset 0 0 4px #000, 0 0 8px rgba(0,0,0,0.8)',
                        transform: 'skewX(-10deg)',
                        flexShrink: 0,
                      }}
                    >
                      <input
                        type="color"
                        aria-label={`Color de ${label.toLowerCase()}`}
                        value={draft[field]}
                        onChange={(e) => handleUpdate({ [field]: e.target.value })}
                        style={{
                          opacity: 0,
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                        }}
                      />
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {PALETTE.map(([name, hex]) => {
                        const isChosen = draft[field].toLowerCase() === hex.toLowerCase()
                        return (
                          <button
                            type="button"
                            key={hex}
                            aria-label={`${label}: ${name}`}
                            aria-pressed={isChosen}
                            onClick={() => handleUpdate({ [field]: hex })}
                            style={{
                              width: '22px',
                              height: '22px',
                              background: hex,
                              border: isChosen ? '2px solid #fff' : '1px solid #222',
                              boxShadow: isChosen
                                ? '0 0 10px #39ff14, inset 0 0 4px #fff'
                                : 'inset 1px 1px 0 rgba(255,255,255,0.4)',
                              transform: 'skewX(-10deg)',
                              cursor: 'pointer',
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FINISH & LIVERY */}
          {activeTab === 'finish' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#c4d1c9', display: 'block', marginBottom: '6px' }}>
                  TIPO DE ACABADO
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {FINISHES.map(([val, name]) => {
                    const isSelected = draft.finish === val
                    return (
                      <button
                        type="button"
                        key={val}
                        aria-pressed={isSelected}
                        onClick={() => handleUpdate({ finish: val })}
                        style={{
                          transform: 'skewX(-10deg)',
                          background: isSelected
                            ? 'linear-gradient(180deg, #2b332d 0%, #151a17 100%)'
                            : 'linear-gradient(180deg, #444b46 0%, #202422 100%)',
                          border: isSelected ? '2px solid #00f0ff' : '2px solid #5a645d',
                          borderTopColor: isSelected ? '#00f0ff' : '#9ca69f',
                          boxShadow: isSelected
                            ? '0 0 14px #00f0ff, inset 0 0 8px rgba(0, 240, 255, 0.4)'
                            : 'none',
                          color: isSelected ? '#00f0ff' : '#fff',
                          padding: '10px 4px',
                          fontWeight: 900,
                          cursor: 'pointer',
                        }}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#c4d1c9', display: 'block', marginBottom: '6px' }}>
                  VINILOS // PATRÓN DE CARRERAS
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {LIVERIES.map(([val, name]) => {
                    const isSelected = draft.livery === val
                    return (
                      <button
                        type="button"
                        key={val}
                        aria-pressed={isSelected}
                        onClick={() => handleUpdate({ livery: val })}
                        style={{
                          transform: 'skewX(-10deg)',
                          background: isSelected
                            ? 'linear-gradient(180deg, #2b332d 0%, #151a17 100%)'
                            : 'linear-gradient(180deg, #444b46 0%, #202422 100%)',
                          border: isSelected ? '2px solid #ff007f' : '2px solid #5a645d',
                          borderTopColor: isSelected ? '#ff007f' : '#9ca69f',
                          boxShadow: isSelected
                            ? '0 0 14px #ff007f, inset 0 0 8px rgba(255, 0, 127, 0.4)'
                            : 'none',
                          color: isSelected ? '#ff007f' : '#fff',
                          padding: '10px 4px',
                          fontWeight: 900,
                          cursor: 'pointer',
                        }}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NUMBER */}
          {activeTab === 'number' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label htmlFor="garage-number" style={{ fontSize: '11px', color: '#c4d1c9' }}>
                TU NÚMERO EN LA PARRILLA (1 - 67)
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#090d0b',
                    border: '2px solid #39ff14',
                    boxShadow: 'inset 0 0 10px #000, 0 0 12px rgba(57, 255, 20, 0.4)',
                    padding: '2px 8px',
                    transform: 'skewX(-10deg)',
                  }}
                >
                  <span style={{ color: '#39ff14', fontSize: '18px', marginRight: '4px' }}>#</span>
                  <input
                    id="garage-number"
                    type="number"
                    min="1"
                    max="67"
                    step="1"
                    value={numberInput}
                    aria-invalid={!validNumber}
                    onChange={(e) => {
                      const val = e.target.value
                      setNumberInput(val)
                      if (/^\d{1,2}$/.test(val) && Number(val) >= 1 && Number(val) <= 67) {
                        handleUpdate({ number: Number(val) })
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '22px',
                      fontFamily: 'inherit',
                      fontWeight: 900,
                      width: '60px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Stamped Plate Preview */}
                <div
                  style={{
                    flex: 1,
                    backgroundImage:
                      "linear-gradient(135deg, rgba(20,25,22,0.9), rgba(5,8,6,0.95)), url('/assets/textures/diamond-plate.jpg')",
                    border: '2px solid #7d8b83',
                    borderTopColor: '#c3cec7',
                    padding: '6px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'skewX(-10deg)',
                    boxShadow: 'inset 0 0 8px #000',
                  }}
                >
                  <span style={{ fontSize: '8px', color: '#39ff14', letterSpacing: '0.1em' }}>
                    SYNAPSE RACING CALLEJERO
                  </span>
                  <span
                    style={{
                      fontSize: '32px',
                      lineHeight: 1,
                      color: validNumber ? draft.primaryColor : '#ff003c',
                      textShadow: validNumber ? '0 0 15px currentColor' : 'none',
                    }}
                  >
                    {validNumber ? numberInput.padStart(2, '0') : 'ERR'}
                  </span>
                  <small style={{ fontSize: '9px', color: '#97a39d' }}>{currentModel.name}</small>
                </div>
              </div>

              {!validNumber && (
                <p role="alert" style={{ margin: 0, fontSize: '11px', color: '#ff003c' }}>
                  El número debe ser un entero entre 1 y 67.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Guest Design Notice */}
        {guestDesign && onLoadGuestDesign && (
          <div
            style={{
              background: 'rgba(255, 102, 0, 0.15)',
              border: '2px solid #ff6600',
              padding: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transform: 'skewX(-8deg)',
              boxShadow: '0 0 10px rgba(255,102,0,0.4)',
            }}
          >
            <span style={{ fontSize: '10px', color: '#ff6600' }}>DISEÑO GUARDADO EN LOCAL</span>
            <button
              type="button"
              onClick={() => onLoadGuestDesign(guestDesign)}
              style={{
                background: '#ff6600',
                color: '#000',
                fontWeight: 900,
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              Cargar
            </button>
          </div>
        )}

        {/* Action Bar (Physical Bolted Metal Buttons) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #333d37',
            paddingTop: '10px',
          }}
        >
          {onReset && (
            <button
              type="button"
              disabled={saving}
              onClick={onReset}
              aria-label="Restablecer diseño"
              title="Restablecer por defecto"
              style={{
                transform: 'skewX(-12deg)',
                background: 'linear-gradient(180deg, #444c47 0%, #1e2420 100%)',
                border: '2px solid #737f77',
                borderTopColor: '#b4c0b8',
                color: '#fff',
                padding: '8px 12px',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ↺
            </button>
          )}

          {isDirty || saving ? (
            <>
              {onDiscard && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onDiscard}
                  style={{
                    transform: 'skewX(-12deg)',
                    background: 'linear-gradient(180deg, #444c47 0%, #1e2420 100%)',
                    border: '2px solid #737f77',
                    borderTopColor: '#b4c0b8',
                    color: '#c4d1c9',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Descartar
                </button>
              )}

              {onSave && (
                <button
                  type="submit"
                  disabled={saving || !isCanSave}
                  style={{
                    transform: 'skewX(-12deg)',
                    background: 'linear-gradient(180deg, #2f4034 0%, #142118 100%)',
                    border: '2px solid #39ff14',
                    borderTopColor: '#6eff52',
                    boxShadow: '0 0 12px rgba(57, 255, 20, 0.6)',
                    color: '#39ff14',
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: saving || !isCanSave ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              )}

              {onSaveAndExit && (
                <button
                  type="button"
                  disabled={saving || !isCanSave}
                  onClick={onSaveAndExit}
                  style={{
                    transform: 'skewX(-12deg)',
                    background: 'linear-gradient(180deg, #39ff14 0%, #20990d 100%)',
                    border: '2px solid #6eff52',
                    borderBottomColor: '#0c4d05',
                    boxShadow: '0 0 18px #39ff14, inset 0 1px 0 #fff',
                    color: '#000',
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: saving || !isCanSave ? 'not-allowed' : 'pointer',
                  }}
                >
                  Guardar y volver
                </button>
              )}
            </>
          ) : (
            onExit && (
              <button
                type="button"
                onClick={onExit}
                style={{
                  transform: 'skewX(-12deg)',
                  background: 'linear-gradient(180deg, #39ff14 0%, #20990d 100%)',
                  border: '2px solid #6eff52',
                  boxShadow: '0 0 16px #39ff14',
                  color: '#000',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                ← Volver al Paddock
              </button>
            )
          )}
        </div>
      </form>
    </div>
  )
}
