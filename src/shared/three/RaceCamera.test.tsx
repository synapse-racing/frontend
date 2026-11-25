import { act, fireEvent, render } from '@testing-library/react'
import { useEffect, useImperativeHandle, type Ref } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import { beforeEach, expect, it, vi } from 'vitest'
import { RaceCamera } from './RaceCamera.tsx'

type Orbit = { getDistance: () => number; panSpeed: number; zoomSpeed: number; target: Vector3 }

const scene = vi.hoisted(() => ({
  camera: null as PerspectiveCamera | null,
  canvas: null as HTMLCanvasElement | null,
  frame: null as ((_: unknown, delta: number) => void) | null,
  controls: null as {
    target: [number, number, number]
    onStart: () => void
    onChange: () => void
  } | null,
  orbit: null as Orbit | null,
}))
vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: scene.camera,
    events: {},
    gl: { domElement: scene.canvas },
    size: { width: 1280, height: 720 },
  }),
  useFrame: (callback: typeof scene.frame) => {
    scene.frame = callback
  },
}))
vi.mock('../game/preferences.ts', () => ({ useReducedMotion: () => false }))
vi.mock('@react-three/drei', () => ({
  OrbitControls: (props: NonNullable<typeof scene.controls> & { ref: Ref<Orbit> }) => {
    scene.controls = props
    useImperativeHandle(props.ref, () => scene.orbit!, [])
    useEffect(() => {
      scene.orbit!.target.set(...props.target)
      scene.camera!.lookAt(...props.target)
    }, [props.target])
    return null
  },
}))

beforeEach(() => {
  scene.camera = new PerspectiveCamera(52, 16 / 9, 0.1, 2000)
  scene.camera.position.set(0, 52, 46)
  scene.canvas = document.createElement('canvas')
  scene.controls = null
  const target = new Vector3()
  scene.orbit = { getDistance: () => scene.camera!.position.distanceTo(target), panSpeed: 1, zoomSpeed: 1, target }
})

it('moves the same distance per wheel step near and far from the pivot', () => {
  const { container } = render(<RaceCamera mode="free" getTarget={() => undefined} />)
  const canvas = scene.canvas!
  const orbit = scene.orbit!
  let wheelSpeed = 1
  canvas.addEventListener('wheel', () => { wheelSpeed = orbit.zoomSpeed })
  container.append(canvas)
  for (const distance of [2.5, 25, 100]) {
    orbit.getDistance = () => distance
    fireEvent.wheel(canvas, { deltaY: -120 })
    expect(distance - distance * 0.95 ** wheelSpeed).toBeCloseTo(1.5)
    fireEvent.wheel(canvas, { deltaY: 120 })
    expect(distance / 0.95 ** wheelSpeed - distance).toBeCloseTo(1.5)
    expect(orbit.zoomSpeed).toBe(1)
  }
})

it('moves the free camera and its pivot with WASD and arrows without capturing text input', () => {
  const view = render(
    <><RaceCamera mode="free" getTarget={() => undefined} /><input aria-label="Prueba" /></>,
  )
  const camera = scene.camera!
  const orbit = scene.orbit!
  const initialOffset = orbit.target.clone().sub(camera.position)
  const initialPosition = camera.position.clone()
  fireEvent.keyDown(window, { code: 'KeyW' })
  act(() => scene.frame!(null, 0.1))
  expect(camera.position.z).toBeCloseTo(initialPosition.z - 2)
  fireEvent.keyUp(window, { code: 'KeyW' })
  fireEvent.keyDown(window, { code: 'ArrowRight' })
  act(() => scene.frame!(null, 0.1))
  expect(camera.position.x).toBeCloseTo(initialPosition.x + 2)
  expect(camera.position.y).toBe(initialPosition.y)
  expect(orbit.target.clone().sub(camera.position).distanceTo(initialOffset)).toBeLessThan(1e-7)

  fireEvent.blur(window)
  fireEvent.keyDown(view.getByRole('textbox'), { code: 'KeyD' })
  act(() => scene.frame!(null, 0.1))
  expect(camera.position.x).toBeCloseTo(initialPosition.x + 2)
})

it('maintains useful drag travel when zooming in and restores normal sensitivity when zooming out', () => {
  render(<RaceCamera mode="free" getTarget={() => undefined} />)
  const { onStart, onChange } = scene.controls!
  const orbit = scene.orbit!
  orbit.getDistance = () => 40
  onStart()
  expect(orbit.panSpeed).toBe(1)

  // Perspective OrbitControls multiplies the drag gain by the orbit distance.
  orbit.getDistance = () => 12
  onChange()
  const dragTravel = orbit.getDistance() * orbit.panSpeed
  orbit.getDistance = () => 3
  onChange()
  expect(orbit.getDistance() * orbit.panSpeed).toBeCloseTo(dragTravel)
  expect(orbit.panSpeed).toBeGreaterThan(2)

  orbit.getDistance = () => 40
  onChange()
  expect(orbit.panSpeed).toBe(1)
})

it('moves the pivot forward for repeated zoom without stopping at the previous target', () => {
  render(<RaceCamera mode="free" getTarget={() => undefined} />)
  const camera = scene.camera!
  const orbit = scene.orbit!
  const direction = camera.getWorldDirection(new Vector3())
  for (let step = 0; step < 3; step++) {
    const previousTarget = orbit.target.clone()
    camera.position.copy(previousTarget).addScaledVector(direction, -0.1)
    scene.controls!.onChange()
    expect(orbit.target.clone().sub(previousTarget).dot(direction)).toBeGreaterThan(1)
    expect(camera.getWorldDirection(new Vector3()).distanceTo(direction)).toBeLessThan(1e-7)
  }
})

it('keeps the camera above the course even when a damped movement has no change event', () => {
  render(<RaceCamera mode="free" getTarget={() => undefined} />)
  const camera = scene.camera!
  const orbit = scene.orbit!
  camera.position.y = -0.3
  orbit.target.set(2, -0.7, 40)
  camera.lookAt(orbit.target)
  const offset = orbit.target.clone().sub(camera.position)
  scene.controls!.onChange()
  expect(camera.position.y).toBeGreaterThan(camera.near)
  expect(orbit.target.clone().sub(camera.position).distanceTo(offset)).toBeLessThan(1e-7)

  const floor = camera.position.y
  camera.position.y -= 0.00001
  act(() => scene.frame!(null, 0.016))
  expect(camera.position.y).toBe(floor)
})

it('releases following without changing the view and leaves camera movement under user control', () => {
  const getTarget = vi.fn(() => ({ x: 50, z: 80, yaw: 1 }))
  const view = render(<RaceCamera mode="follow" getTarget={getTarget} />)
  act(() => scene.frame!(null, 0.1))
  const position = scene.camera!.position.clone()
  const rotation = scene.camera!.quaternion.clone()
  view.rerender(<RaceCamera mode="free" getTarget={getTarget} />)
  expect(scene.controls!.target).toEqual([50, 0.5, 80])
  expect(scene.camera!.position.equals(position)).toBe(true)
  expect(scene.camera!.quaternion.angleTo(rotation)).toBeLessThan(1e-7)
  const orbitTarget = scene.controls!.target
  const calls = getTarget.mock.calls.length
  scene.camera!.position.add(new Vector3(10, 0, 10))
  const moved = scene.camera!.position.clone()
  act(() => scene.frame!(null, 0.1))
  view.rerender(<RaceCamera mode="free" extent={100} getTarget={getTarget} />)
  expect(scene.controls!.target).toBe(orbitTarget)
  expect(getTarget).toHaveBeenCalledTimes(calls)
  expect(scene.camera!.position.equals(moved)).toBe(true)
})

it('preserves a free view when the generation scene remounts', () => {
  const getTarget = () => ({ x: 50, z: 80, yaw: 1 })
  const view = render(<RaceCamera mode="follow" getTarget={getTarget} />)
  act(() => scene.frame!(null, 0.1))
  const position = scene.camera!.position.clone()
  const direction = scene.camera!.getWorldDirection(new Vector3())
  view.unmount()
  render(<RaceCamera mode="free" getTarget={getTarget} />)
  expect(scene.camera!.position.equals(position)).toBe(true)
  expect(
    scene.camera!.getWorldDirection(new Vector3()).distanceTo(direction),
  ).toBeLessThan(1e-7)
})
