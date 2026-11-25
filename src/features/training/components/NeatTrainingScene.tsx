import { useRef } from 'react'
import type { VehicleAppearance } from '../../garage/domain/appearance.ts'
import type { AgentRuntime } from '../domain/fitness.ts'
import type { TrackDefinition } from '../domain/track.ts'
import type { Genome } from '../neat/genes.ts'
import { NeatVehicle } from './NeatVehicle.tsx'
import { TrackEnvironment } from '../../../shared/three/TrackEnvironment.tsx'
import {
  RaceCamera,
  type CarPose,
  type RaceCameraMode,
} from '../../../shared/three/RaceCamera.tsx'
import type {
  AgentFinishReason,
  RegisterAgentControl,
} from '../domain/agent-control.ts'

interface NeatTrainingSceneProps {
  runKey: number
  generationKey: string
  genomes: Genome[]
  appearance?: VehicleAppearance
  onAgentFinish: (
    genomeId: string,
    runtime: AgentRuntime,
    reason?: AgentFinishReason,
  ) => void
  onInspectCar: (genomeId: string) => void
  onRegisterCar: RegisterAgentControl
  onCheckpoint: (index: number, rigidBodyName: string) => void
  timeScale: number
  running: boolean
  track: TrackDefinition
  cameraMode: RaceCameraMode
  selectedGenomeId: string
  showRaycasts: boolean
  posesRef?: React.RefObject<Map<string, CarPose>>
}

export function NeatTrainingScene({
  runKey,
  generationKey,
  genomes,
  appearance,
  onAgentFinish,
  onCheckpoint,
  timeScale,
  running,
  track,
  cameraMode,
  selectedGenomeId,
  showRaycasts,
  onInspectCar,
  onRegisterCar,
  posesRef,
}: NeatTrainingSceneProps) {
  const internalPoses = useRef(new Map<string, CarPose>())
  const poses = posesRef ?? internalPoses
  const startingGrid = {
    x: track.spawnPosition[0],
    z: track.spawnPosition[2],
    yaw: track.spawnYaw,
  }
  return (
    <>
      <TrackEnvironment track={track} district="workshops" />
      {genomes.map((genome, index) => (
        <NeatVehicle
          key={`${generationKey}-${genome.id}`}
          genome={genome}
          appearance={appearance}
          index={index}
          onFinish={onAgentFinish}
          onInspect={onInspectCar}
          onRegister={onRegisterCar}
          onCheckpoint={onCheckpoint}
          running={running}
          timeScale={timeScale}
          track={track}
          selected={genome.id === selectedGenomeId}
          showRaycasts={showRaycasts}
          onPose={(id, pose) => poses.current.set(id, pose)}
        />
      ))}
      <RaceCamera
        key={runKey}
        extent={Math.max(...track.groundSize)}
        mode={cameraMode}
        startingGrid={startingGrid}
        getTarget={() => poses.current.get(selectedGenomeId) ?? startingGrid}
      />
    </>
  )
}
