import { memo, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { AdditiveBlending, Color, DoubleSide, InstancedMesh, Object3D } from 'three'
import type { BufferGeometry } from 'three'
import type { TrackDefinition } from '../../features/training/domain/track.ts'
import { useGamePreferences } from '../game/preferences.ts'
import { createRoadGeometry } from './track-geometry.ts'
import { createSurfaceTexture } from './surface-texture.ts'
import {
  createStreetLayout,
  districts,
  type StreetDistrict,
  type StreetPart,
} from './urban-layout.ts'
import {
  createFacade,
  createFinishSign,
  createLampPool,
  createNightSky,
  createTowerTexture,
  facadeGeometry,
} from './street-textures.ts'

function StreetBatch({
  parts,
  children,
  geometry,
  flat = false,
  shape = 'box',
  castShadow = false,
}: {
  parts: StreetPart[]
  children: ReactNode
  geometry?: BufferGeometry
  flat?: boolean
  shape?: 'box' | 'tank' | 'cap'
  castShadow?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const object = new Object3D(),
      color = new Color()
    parts.forEach((p, i) => {
      object.position.set(p.x, p.y, p.z)
      object.rotation.set(flat ? -Math.PI / 2 : 0, p.yaw, 0, 'YXZ')
      object.scale.set(p.width, flat ? p.depth : p.height, flat ? 1 : p.depth)
      object.updateMatrix()
      mesh.setMatrixAt(i, object.matrix)
      mesh.setColorAt(i, color.set(p.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [parts, flat])
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, parts.length]} castShadow={castShadow}>
      {!geometry &&
        (flat ? (
          <planeGeometry />
        ) : shape === 'box' ? (
          <boxGeometry />
        ) : (
          <cylinderGeometry args={[shape === 'cap' ? 0 : 0.5, 0.5, 1, 12]} />
        ))}
      {children}
    </instancedMesh>
  )
}

export const TrackEnvironment = memo(function TrackEnvironment({
  track,
  district,
  cinematic = false,
}: {
  track: TrackDefinition
  district: StreetDistrict
  cinematic?: boolean
}) {
  const { preferences } = useGamePreferences()
  const high = preferences.quality === 'high'
  const layout = useMemo(() => createStreetLayout(track, district, high), [track, district, high])
  const road = useMemo(() => createRoadGeometry(track), [track])
  const facade = useMemo(facadeGeometry, [])
  const upperFacade = useMemo(() => facadeGeometry(0.15), [])
  const textures = useMemo(
    () => ({
      asphalt: createSurfaceTexture('asphalt'),
      ground: createSurfaceTexture('ground'),
      garage: createFacade(district, 0),
      depot: createFacade(district, 1),
      tower: createTowerTexture(district),
      sky: createNightSky(district),
      pool: createLampPool(),
      sign: createFinishSign(district),
    }),
    [district],
  )
  useEffect(() => () => road.dispose(), [road])
  useEffect(() => () => facade.dispose(), [facade])
  useEffect(() => () => upperFacade.dispose(), [upperFacade])
  useEffect(() => () => Object.values(textures).forEach((map) => map.dispose()), [textures])
  const palette = districts[district]
  const finish = track.checkpoints.at(-1)!
  const gateWidth = finish.size[0] + 1.65
  const groundSize = Math.max(380, (layout.radius + 140) * 2)
  return (
    <>
      <primitive attach="background" object={textures.sky} />
      <primitive attach="environment" object={textures.sky} />
      <fog
        attach="fog"
        args={[palette.sky, Math.max(42, layout.radius * 0.7), Math.max(180, layout.radius * 3.1)]}
      />
      <hemisphereLight args={['#d5e7ff', '#81706e', 1.65]} />
      <directionalLight
        position={[-layout.radius * 0.64, layout.radius, layout.radius * 0.44]}
        color="#d4e3ff"
        intensity={cinematic ? 0.8 : 1.9}
        castShadow={high && !cinematic}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-layout.radius}
        shadow-camera-right={layout.radius}
        shadow-camera-top={layout.radius}
        shadow-camera-bottom={-layout.radius}
        shadow-camera-far={layout.radius * 3 + 30}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[24, 12, -35]} color={palette.accent} intensity={1.1} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#343b47" map={textures.ground} roughness={0.94} />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial
          color="#626b79"
          map={textures.asphalt}
          roughness={0.62}
          side={DoubleSide}
        />
      </mesh>
      <StreetBatch parts={layout.solids}>
        <meshStandardMaterial roughness={0.84} />
      </StreetBatch>
      <StreetBatch parts={layout.paint}>
        <meshBasicMaterial />
      </StreetBatch>
      <StreetBatch parts={layout.lights}>
        <meshBasicMaterial toneMapped={false} />
      </StreetBatch>
      <StreetBatch flat parts={layout.pools}>
        <meshBasicMaterial
          map={textures.pool}
          transparent
          opacity={0.34}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </StreetBatch>
      <StreetBatch parts={layout.facades[0]} geometry={facade} castShadow={high && !cinematic}>
        <meshBasicMaterial map={textures.garage} />
      </StreetBatch>
      <StreetBatch parts={layout.facades[1]} geometry={facade} castShadow={high && !cinematic}>
        <meshBasicMaterial map={textures.depot} />
      </StreetBatch>
      <StreetBatch parts={layout.towers} geometry={facade}>
        <meshBasicMaterial map={textures.tower} />
      </StreetBatch>
      <StreetBatch parts={layout.upperFloors} geometry={upperFacade} castShadow={high && !cinematic}>
        <meshBasicMaterial map={textures.tower} />
      </StreetBatch>
      {layout.arrows.length > 0 && (
        <mesh>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layout.arrows, 3]} />
          </bufferGeometry>
          <meshBasicMaterial color={palette.accent} toneMapped={false} side={DoubleSide} />
        </mesh>
      )}
      {layout.tanks.length > 0 && (
        <>
          <StreetBatch parts={layout.tanks} shape="tank">
            <meshStandardMaterial roughness={0.75} />
          </StreetBatch>
          <StreetBatch parts={layout.tankCaps} shape="cap">
            <meshStandardMaterial roughness={0.84} />
          </StreetBatch>
        </>
      )}
      {layout.wires.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layout.wires, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#293241" />
        </lineSegments>
      )}
      {layout.pennants.length > 0 && (
        <mesh>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layout.pennants, 3]} />
          </bufferGeometry>
          <meshBasicMaterial color={palette.secondary} side={DoubleSide} />
        </mesh>
      )}

      <group
        position={[finish.position[0], 0, finish.position[2]]}
        rotation={[0, finish.rotationY, 0]}
      >
        {[-1, 1].map((side) => (
          <group key={side} position={[(side * gateWidth) / 2, 0, 0]}>
            <mesh position={[0, 2.7, 0]}>
              <boxGeometry args={[0.23, 5.4, 0.34]} />
              <meshStandardMaterial color="#72808a" />
            </mesh>
            <mesh position={[0, 2.05, 0]}>
              <boxGeometry args={[0.25, 1.15, 0.36]} />
              <meshBasicMaterial color={palette.accent} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 5.12, 0]}>
          <boxGeometry args={[gateWidth + 0.35, 0.98, 0.36]} />
          <meshStandardMaterial color="#23313c" />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[0, 5.12, side * 0.19]}
            rotation={[0, side === 1 ? 0 : Math.PI, 0]}
          >
            <planeGeometry args={[gateWidth + 0.25, 0.94]} />
            <meshBasicMaterial map={textures.sign} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  )
})
