import { useState, useEffect, type FormEvent } from 'react'
import type { RoomState } from '../types/multiplayer.ts'
import type { TrainingRun } from '../../training/api/training.api.ts'
import { TrackMap } from '../../../shared/game/TrackMap.tsx'
import { vehicleCatalog } from '../../garage/domain/appearance.ts'
import { ErrorNotice } from '../../../shared/components/ErrorNotice.tsx'
import './lobby.css'

export interface LobbyProps {
  busy: boolean
  currentUserId: string
  error: string | null
  onCreate: (maxPlayers: number) => void
  onJoin: (code: string) => void
  onLeave: () => void
  onReady: (ready: boolean) => void
  onSelectGenome: (trainingRunId: string) => void
  onSelectTrack: (seed: number) => void
  onStart: () => void
  room: RoomState | null
  trainingRuns: TrainingRun[]
}

export function Lobby({
  busy,
  currentUserId,
  error,
  onCreate,
  onJoin,
  onLeave,
  onReady,
  onSelectGenome,
  onSelectTrack,
  onStart,
  room,
  trainingRuns,
}: LobbyProps) {
  const [code, setCode] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('4')
  const capacity = Number(maxPlayers)
  const validCapacity =
    /^\d+$/.test(maxPlayers) &&
    Number.isInteger(capacity) &&
    capacity >= 2 &&
    capacity <= 64

  const [trackSeed, setTrackSeed] = useState(0)
  const roomTrackSeed = room?.track.seed
  useEffect(() => {
    if (roomTrackSeed !== undefined) setTrackSeed(roomTrackSeed)
  }, [roomTrackSeed])

  function handleJoin(event: FormEvent) {
    event.preventDefault()
    if (!busy && code.length === 6) onJoin(code)
  }

  /* ============================================================
     PANTALLA INICIAL: CREAR O UNIRSE (NO ROOM YET)
     ============================================================ */
  if (!room) {
    return (
      <section
        className="lobby-root lobby-root--entry"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(6, 9, 7, 0.94) 0%, rgba(10, 15, 12, 0.96) 100%), url('/assets/textures/asphalt.jpg')",
          backgroundRepeat: 'repeat',
          backgroundSize: 'cover',
          backgroundBlendMode: 'multiply',
          border: '3px solid #3c4840',
          borderLeft: '6px solid #00f0ff',
          boxShadow:
            'inset 0 0 45px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 240, 255, 0.25)',
        }}
      >
        {/* Hex Rivets */}
        <span style={rivetStyle('8px', '8px')} />
        <span style={rivetStyle('8px', undefined, undefined, '8px')} />
        <span style={rivetStyle(undefined, '8px', '8px', undefined)} />
        <span style={rivetStyle(undefined, undefined, '8px', '8px')} />

        {/* Top Decal Banner */}
        <div className="lobby-entry-heading">
          <div className="lobby-entry-heading__strip">
            <span
              style={{
                fontSize: '11px',
                color: '#00f0ff',
                letterSpacing: '0.15em',
                textShadow: '0 0 8px #00f0ff',
              }}
            >
              02 // TORNEO MULTIJUGADOR CALLEJERO
            </span>
            <span
              style={{
                background: '#ff007f',
                color: '#fff',
                padding: '2px 8px',
                fontSize: '10px',
                transform: 'skewX(-14deg)',
                boxShadow: '0 0 10px #ff007f',
              }}
            >
              STREET GRID 2005
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 42px)',
              margin: '6px 0 0',
              lineHeight: 1,
              color: '#fff',
              textShadow: '2px 2px 0 #000, 0 0 20px rgba(0, 240, 255, 0.7)',
            }}
          >
            GÁNATE LA PISTA.
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '12px',
              color: '#a3b5ab',
              fontWeight: 700,
              fontStyle: 'normal',
              textTransform: 'none',
            }}
          >
            Tu mejor piloto NEAT frente a otras escuderías. Prepara una carrera privada o entra a la parrilla con el código de un rival.
          </p>
        </div>

        {/* Split Grid: Crear vs Unirse */}
        <div className="lobby-panels lobby-panels--entry">
          {/* Box 1: Crear Sala */}
          <div
            className="bg-[url('/assets/textures/carbon-fiber.jpg')]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(8, 12, 10, 0.92) 0%, rgba(14, 20, 16, 0.95) 100%), url('/assets/textures/carbon-fiber.jpg')",
              backgroundSize: '16px 16px',
              backgroundBlendMode: 'multiply',
              border: '2px solid #4d5c52',
              borderTop: '3px solid #39ff14',
              padding: '20px',
              boxShadow: 'inset 0 0 25px #000, 0 0 15px rgba(57, 255, 20, 0.15)',
              clipPath:
                'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#39ff14', fontSize: '18px' }}>▶</span>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#fff', textShadow: '0 0 10px #39ff14', textTransform: 'uppercase' }}>
                Crear sala
              </h2>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#c4d4ca' }}>
              <span>Capacidad</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#090d0b',
                  border: validCapacity ? '2px solid #39ff14' : '2px solid #ff003c',
                  boxShadow: validCapacity
                    ? 'inset 0 0 10px #000, 0 0 10px rgba(57, 255, 20, 0.3)'
                    : 'inset 0 0 10px #000, 0 0 10px rgba(255, 0, 60, 0.4)',
                  padding: '4px 10px',
                }}
              >
                <input
                  aria-label="Capacidad"
                  type="number"
                  min={2}
                  max={64}
                  step={1}
                  required
                  aria-invalid={!validCapacity}
                  aria-describedby="capacity-hint"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 900,
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                />
                <span style={{ fontSize: '10px', color: '#7a8c82' }}>PILOTOS</span>
              </div>
            </label>

            <p id="capacity-hint" style={{ margin: 0, fontSize: '10px', color: '#88998f', fontStyle: 'normal' }}>
              Escribe un número entero entre 2 y 64 pilotos.
            </p>

            <button
              type="button"
              disabled={busy || !validCapacity}
              onClick={() => {
                if (validCapacity) onCreate(capacity)
              }}
              style={{
                background: validCapacity && !busy
                  ? 'linear-gradient(180deg, #39ff14 0%, #1c850b 100%)'
                  : 'linear-gradient(180deg, #444c47 0%, #1e2420 100%)',
                border: validCapacity && !busy ? '2px solid #6eff52' : '2px solid #555',
                borderTopColor: validCapacity && !busy ? '#fff' : '#888',
                boxShadow: validCapacity && !busy
                  ? '0 0 18px #39ff14, inset 0 1px 0 #fff'
                  : 'none',
                color: validCapacity && !busy ? '#000' : '#777',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: validCapacity && !busy ? 'pointer' : 'not-allowed',
                marginTop: 'auto',
              }}
            >
              Crear código
            </button>
          </div>

          {/* Box 2: Unirse a Sala */}
          <form
            onSubmit={handleJoin}
            className="bg-[url('/assets/textures/diamond-plate.jpg')]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(12, 16, 14, 0.94) 0%, rgba(6, 8, 7, 0.96) 100%), url('/assets/textures/diamond-plate.jpg')",
              backgroundSize: 'cover',
              backgroundBlendMode: 'multiply',
              border: '2px solid #4d5c52',
              borderTop: '3px solid #ff007f',
              padding: '20px',
              boxShadow: 'inset 0 0 25px #000, 0 0 15px rgba(255, 0, 127, 0.2)',
              clipPath:
                'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ff007f', fontSize: '18px' }}>▶</span>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#fff', textShadow: '0 0 10px #ff007f', textTransform: 'uppercase' }}>
                Unirse
              </h2>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#c4d4ca' }}>
              <span>Código de sala</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#090d0b',
                  border: '2px solid #ff007f',
                  boxShadow: 'inset 0 0 10px #000, 0 0 12px rgba(255, 0, 127, 0.35)',
                  padding: '4px 10px',
                }}
              >
                <input
                  aria-label="Código de sala"
                  maxLength={6}
                  placeholder="ABC123"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff007f',
                    fontSize: '20px',
                    fontWeight: 900,
                    letterSpacing: '0.25em',
                    fontFamily: 'monospace',
                    width: '100%',
                  }}
                />
              </div>
            </label>

            <p style={{ margin: 0, fontSize: '10px', color: '#88998f', fontStyle: 'normal' }}>
              Pide el código de 6 caracteres al creador de la sala.
            </p>

            <button
              type="submit"
              disabled={busy || code.length !== 6}
              style={{
                background: code.length === 6 && !busy
                  ? 'linear-gradient(180deg, #ff007f 0%, #a30052 100%)'
                  : 'linear-gradient(180deg, #444c47 0%, #1e2420 100%)',
                border: code.length === 6 && !busy ? '2px solid #ff66b2' : '2px solid #555',
                borderTopColor: code.length === 6 && !busy ? '#fff' : '#888',
                boxShadow: code.length === 6 && !busy
                  ? '0 0 18px #ff007f, inset 0 1px 0 #fff'
                  : 'none',
                color: code.length === 6 && !busy ? '#fff' : '#777',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: code.length === 6 && !busy ? 'pointer' : 'not-allowed',
                marginTop: 'auto',
              }}
            >
              Entrar
            </button>
            <ErrorNotice error={error} />
          </form>
        </div>
      </section>
    )
  }

  /* ============================================================
     SALA ACTIVA: LOBBY DE ESPERA (ROOM ACTIVE)
     ============================================================ */
  const currentPlayer = room.players.find(
    (player) => player.userId === currentUserId,
  )
  const isHost = room.hostUserId === currentUserId
  const compatibleRuns = trainingRuns.filter(
    (run) =>
      run.currentGeneration > 0 &&
      run.config.simulationVersion === 'race-sim-v1',
  )
  const selectedRun = compatibleRuns.find(
    (run) => run.name === currentPlayer?.genomeName,
  )
  const canStart =
    isHost &&
    room.players.length >= 2 &&
    room.players.every((player) => player.ready)

  return (
    <section
      className="lobby-root lobby-root--room"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(8, 12, 10, 0.94) 0%, rgba(12, 16, 14, 0.97) 100%), url('/assets/textures/carbon-fiber.jpg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '16px 16px',
        backgroundBlendMode: 'multiply',
        border: '3px solid #4a544e',
        borderLeft: '6px solid #39ff14',
        boxShadow:
          'inset 0 0 45px rgba(0, 0, 0, 0.95), 0 0 35px rgba(57, 255, 20, 0.3)',
      }}
    >
      {/* Corner Hex Rivets */}
      <span style={rivetStyle('8px', '8px')} />
      <span style={rivetStyle('8px', undefined, undefined, '8px')} />
      <span style={rivetStyle(undefined, '8px', '8px', undefined)} />
      <span style={rivetStyle(undefined, undefined, '8px', '8px')} />

      {/* Header & Giant Glowing Room Code */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: '2px solid #39ff14',
          paddingBottom: '14px',
          gap: '12px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              color: '#39ff14',
              letterSpacing: '0.15em',
              textShadow: '0 0 8px #39ff14',
            }}
          >
            TORNEO // SALA PRIVADA
          </span>
          <h1
            className="lobby-heading"
            style={{
              fontSize: 'clamp(28px, 4vw, 38px)',
              margin: '4px 0 0',
              lineHeight: 1,
              color: '#fff',
              textShadow: '2px 2px 0 #000, 0 0 15px rgba(57, 255, 20, 0.5)',
              textTransform: 'uppercase',
            }}
          >
            Parrilla de salida.
          </h1>
        </div>

        {/* Room Code Stamped Plate */}
        <div
          className="lobby-code bg-[url('/assets/textures/diamond-plate.jpg')]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(20,25,22,0.9), rgba(6,10,8,0.95)), url('/assets/textures/diamond-plate.jpg')",
            border: '2px solid #39ff14',
            boxShadow: '0 0 18px rgba(57, 255, 20, 0.5), inset 0 0 10px #000',
            transform: 'skewX(-10deg)',
            padding: '6px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '9px', color: '#c4d4ca', letterSpacing: '0.1em' }}>
            CÓDIGO PRIVADO
          </span>
          <strong
            style={{
              fontSize: '26px',
              color: '#39ff14',
              letterSpacing: '0.2em',
              fontFamily: 'monospace',
              textShadow: '0 0 12px #39ff14',
              lineHeight: 1.1,
            }}
          >
            {room.code}
          </strong>
          <small style={{ fontSize: '10px', color: '#97a39d' }}>
            {room.players.length}/{room.maxPlayers} pilotos
          </small>
        </div>
      </div>

      {/* Main Grid: Pilot Selection & Track Preview */}
      <div
        className="lobby-room-body"
        role="region"
        aria-label="Configuración y pilotos"
        tabIndex={0}
      >
        <div className="lobby-panels">
          {/* Pilot Select (NEAT) */}
          <section
            className="lobby-pilot-select bg-[url('/assets/textures/metal-scratch.jpg')]"
            aria-label="Selección de piloto"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(12, 16, 14, 0.94) 0%, rgba(6, 8, 7, 0.96) 100%), url('/assets/textures/metal-scratch.jpg')",
              backgroundSize: 'cover',
              backgroundBlendMode: 'multiply',
              border: '2px solid #5a665e',
              borderTop: '3px solid #00f0ff',
              padding: '16px',
              boxShadow: 'inset 0 0 20px #000',
              clipPath:
                'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div className="lobby-pilot-select__heading">
              <div>
                <span style={{ fontSize: '9px', color: '#00f0ff', letterSpacing: '0.1em' }}>
                  01 // CONFIGURA TU ESCUDERÍA
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: '18px', color: '#fff' }}>
                  Elige tu piloto NEAT
                </h2>
              </div>
              <small
                style={{
                  fontSize: '9px',
                  padding: '3px 8px',
                  transform: 'skewX(-10deg)',
                  background: currentPlayer?.genomeName ? '#39ff14' : '#fffb00',
                  color: '#000',
                  boxShadow: currentPlayer?.genomeName
                    ? '0 0 10px #39ff14'
                    : '0 0 10px #fffb00',
                }}
              >
                {currentPlayer?.genomeName ? 'PILOTO SELECCIONADO' : 'PASO OBLIGATORIO'}
              </small>
            </div>

            <label
              htmlFor="lobby-pilot-select"
              style={{ fontSize: '11px', color: '#c4d4ca', display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <span>Entrenamientos disponibles</span>
              <div
                style={{
                  background: '#090d0b',
                  border: '2px solid #00f0ff',
                  boxShadow: 'inset 0 0 8px #000, 0 0 10px rgba(0, 240, 255, 0.3)',
                  padding: '4px 8px',
                }}
              >
                <select
                  id="lobby-pilot-select"
                  disabled={busy || currentPlayer?.ready || compatibleRuns.length === 0}
                  onChange={(event) => onSelectGenome(event.target.value)}
                  value={selectedRun?.id ?? ''}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 900,
                    fontFamily: 'inherit',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ background: '#111', color: '#aaa' }}>
                    Selecciona tu piloto para esta carrera
                  </option>
                  {compatibleRuns.map((run) => (
                    <option key={run.id} value={run.id} style={{ background: '#111', color: '#fff' }}>
                      {run.name} · gen. {run.currentGeneration} · pista #{run.config.track?.seed ?? run.seed}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {selectedRun ? (
              <p style={{ margin: 0, fontSize: '10px', color: '#39ff14', textShadow: '0 0 6px #39ff14' }}>
                {selectedRun.name} · Generación {selectedRun.currentGeneration} · espera a que termine el guardado antes de competir.
              </p>
            ) : compatibleRuns.length > 0 ? (
              <p style={{ margin: 0, fontSize: '10px', color: '#fffb00' }}>
                Selecciona un entrenamiento guardado para habilitar la salida.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '10px', color: '#ff003c' }}>
                Completa y guarda una generación de entrenamiento para competir.
              </p>
            )}
          </section>

          {/* Track Info & Seed Controls */}
          <section
            className="lobby-track bg-[url('/assets/textures/metal-scratch.jpg')]"
            aria-label="Pista multijugador"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(12, 16, 14, 0.94) 0%, rgba(6, 8, 7, 0.96) 100%), url('/assets/textures/metal-scratch.jpg')",
              backgroundSize: 'cover',
              backgroundBlendMode: 'multiply',
              border: '2px solid #5a665e',
              borderTop: '3px solid #ff6600',
              padding: '16px',
              boxShadow: 'inset 0 0 20px #000',
              clipPath:
                'polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '9px', color: '#ff6600', letterSpacing: '0.1em' }}>
                  DISTRITO NEÓN // SEMILLA
                </span>
                <strong style={{ display: 'block', fontSize: '18px', color: '#fff' }}>
                  {room.track.version === 'grand-prix-v3'
                    ? 'Grand Prix'
                    : room.track.version === 'technical-loop-v2'
                      ? 'Circuito Técnico'
                      : room.track.version === 'curved-loop-v1'
                        ? 'Curved Loop'
                        : 'Clásico'}{' '}
                  #{room.track.seed}
                </strong>
              </div>
              <div
                style={{
                  width: '120px',
                  height: '70px',
                  background: '#0a0e0c',
                  border: '1px solid #3c4840',
                  padding: '4px',
                }}
              >
                <TrackMap recipe={room.track} />
              </div>
            </div>

            {isHost ? (
              <div className="lobby-track__controls">
                <input
                  aria-label="Semilla de pista multijugador"
                  min={0}
                  max={2_147_483_647}
                  onChange={(event) => setTrackSeed(Number(event.target.value))}
                  type="number"
                  value={trackSeed}
                  style={{
                    background: '#090d0b',
                    border: '2px solid #ff6600',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 900,
                    fontFamily: 'inherit',
                    padding: '6px 8px',
                    width: '110px',
                  }}
                />
                <button
                  type="button"
                  disabled={
                    busy ||
                    !Number.isSafeInteger(trackSeed) ||
                    trackSeed < 0 ||
                    trackSeed > 2_147_483_647
                  }
                  onClick={() => onSelectTrack(trackSeed)}
                  style={{
                    background: 'linear-gradient(180deg, #555f58 0%, #202623 100%)',
                    border: '2px solid #ff6600',
                    color: '#ff6600',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Aplicar semilla
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const seed = Math.floor(Math.random() * 2_147_483_648)
                    setTrackSeed(seed)
                    onSelectTrack(seed)
                  }}
                  style={{
                    background: 'linear-gradient(180deg, #444c47 0%, #1e2420 100%)',
                    border: '2px solid #737f77',
                    color: '#fff',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Generar otra
                </button>
              </div>
            ) : (
              <small style={{ fontSize: '10px', color: '#88998f', fontStyle: 'normal' }}>
                Solo el host puede cambiar la pista.
              </small>
            )}
          </section>
        </div>

        {/* Grid: Players in Room */}
        <div className="lobby-players">
          {room.players.map((player, index) => {
            const isReady = player.ready
            return (
              <article
                key={player.userId}
                style={{
                  background: isReady
                    ? 'linear-gradient(180deg, rgba(20,35,25,0.9), rgba(10,18,13,0.95))'
                    : 'linear-gradient(180deg, rgba(30,35,32,0.9), rgba(15,18,16,0.95))',
                  border: isReady ? '2px solid #39ff14' : '2px solid #5a665e',
                  boxShadow: isReady
                    ? '0 0 14px rgba(57, 255, 20, 0.4), inset 0 0 10px #000'
                    : 'inset 0 0 10px #000',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="lobby-player-info">
                  <span
                    style={{
                      fontSize: '18px',
                      color: isReady ? '#39ff14' : '#77887e',
                      fontFamily: 'monospace',
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="lobby-player-info__copy">
                    <strong style={{ display: 'block', fontSize: '14px', color: '#fff' }}>
                      {player.username}
                    </strong>
                    <div className="lobby-player-info__pilot">
                      <span style={{ color: player.userId === room.hostUserId ? '#39ff14' : '#c3cec7' }}>
                        {player.userId === room.hostUserId ? 'HOST' : 'PILOTO'}
                      </span>
                      <span>·</span>
                      <span>{player.genomeName ?? 'Sin piloto NEAT'}</span>
                    </div>
                    {player.appearance && (
                      <small style={{ fontSize: '9px', color: '#7a8c82' }}>
                        {vehicleCatalog.find((m) => m.id === player.appearance?.modelId)?.name ?? 'Auto'} · #{player.appearance.number}
                      </small>
                    )}
                  </div>
                </div>

                <span
                  className="lobby-player-state"
                  data-state={isReady ? 'ready' : 'waiting'}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    background: isReady ? '#39ff14' : '#ffaa00',
                    color: '#000',
                    boxShadow: isReady ? '0 0 10px #39ff14' : '0 0 10px #ffaa00',
                    transform: 'skewX(-8deg)',
                  }}
                >
                  {isReady ? 'Listo' : 'Esperando'}
                </span>
              </article>
            )
          })}

        </div>
      </div>

      <ErrorNotice error={error} />

      {/* Action Footer */}
      <div className="lobby-actions">
        <button
          type="button"
          onClick={onLeave}
          style={{
            background: 'linear-gradient(180deg, #444c47 0%, #1e2420 100%)',
            border: '2px solid #737f77',
            borderTopColor: '#b4c0b8',
            color: '#c4d1c9',
            padding: '10px 20px',
            fontSize: '12px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          Salir
        </button>

        <button
          type="button"
          className="primary-button"
          disabled={busy || !currentPlayer?.genomeName}
          onClick={() => onReady(!currentPlayer?.ready)}
          style={{
            background: currentPlayer?.ready
              ? 'linear-gradient(180deg, #ff007f 0%, #99004d 100%)'
              : 'linear-gradient(180deg, #39ff14 0%, #1c850b 100%)',
            border: currentPlayer?.ready ? '2px solid #ff66b2' : '2px solid #6eff52',
            borderTopColor: '#fff',
            boxShadow: currentPlayer?.ready
              ? '0 0 20px #ff007f, inset 0 1px 0 #fff'
              : '0 0 20px #39ff14, inset 0 1px 0 #fff',
            color: currentPlayer?.ready ? '#fff' : '#000',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 900,
            cursor: !currentPlayer?.genomeName ? 'not-allowed' : 'pointer',
            opacity: !currentPlayer?.genomeName ? 0.5 : 1,
          }}
        >
          {currentPlayer?.ready ? 'Cancelar listo' : 'Estoy listo'}
        </button>

        {isHost && (
          <button
            type="button"
            disabled={busy || !canStart}
            onClick={onStart}
            style={{
              background: canStart
                ? 'linear-gradient(180deg, #00f0ff 0%, #007a82 100%)'
                : 'linear-gradient(180deg, #333d37 0%, #181d1a 100%)',
              border: canStart ? '2px solid #70f7ff' : '2px solid #444',
              borderTopColor: canStart ? '#fff' : '#666',
              boxShadow: canStart
                ? '0 0 24px #00f0ff, inset 0 1px 0 #fff'
                : 'none',
              color: canStart ? '#000' : '#666',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: 900,
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            Iniciar carrera
          </button>
        )}
      </div>
    </section>
  )
}

function rivetStyle(top?: string, left?: string, bottom?: string, right?: string) {
  return {
    position: 'absolute' as const,
    top,
    left,
    bottom,
    right,
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #bbb, #333)',
    boxShadow: 'inset 1px 1px 0 #fff, 0 0 3px #000',
  }
}
