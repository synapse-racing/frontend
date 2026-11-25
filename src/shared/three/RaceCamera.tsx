import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import { Vector3 } from 'three'
import { useReducedMotion } from '../game/preferences.ts'
export interface CarPose {
  x: number
  z: number
  yaw: number
}
export type RaceCameraMode = 'follow' | 'free'

const cameraFloor = 0.25
const zoomPivotDistance = 2.5
const minPanDistance = 22
const keyboardSpeed = 20
const wheelStep = 1.5
const movementKeys = [
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
]

export function RaceCamera({
  mode,
  extent = 50,
  getTarget,
}: {
  extent?: number
  mode: RaceCameraMode
  getTarget: () => CarPose | undefined
}) {
  const { camera, events, gl } = useThree()
  const reduced = useReducedMotion()
  const desired = useMemo(() => new Vector3(), [])
  const targetLook = useMemo(() => new Vector3(), [])
  // Al remontar la escena, la vista libre arranca desde la orientación real de
  // la cámara para no dar un salto al regenerar la generación.
  const [look] = useState(() => {
    if (mode !== 'free') return new Vector3(0, 0.5, 0)
    return camera.position
      .clone()
      .add(camera.getWorldDirection(new Vector3()).multiplyScalar(25))
  })
  const smoothedYaw = useRef<number | null>(null)
  const wasFollowing = useRef(false)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const zoomDirection = useMemo(() => new Vector3(), [])
  const movement = useMemo(() => new Vector3(), [])
  const pressedKeys = useRef(new Set<string>())
  const eventTarget = events.connected || gl.domElement
  const updateFreeCamera = useCallback(() => {
    const orbit = controls.current
    if (!orbit) return

    // Move the virtual pivot with the camera so the floor doesn't change the view angle.
    if (camera.position.y < cameraFloor) {
      orbit.target.y += cameraFloor - camera.position.y
      camera.position.y = cameraFloor
      camera.updateMatrixWorld()
    }

    let distance = orbit.getDistance()
    if (distance < zoomPivotDistance) {
      // Keep a pivot ahead of the camera so the next zoom continues to move forward.
      camera.getWorldDirection(zoomDirection)
      orbit.target.copy(camera.position).addScaledVector(zoomDirection, zoomPivotDistance)
      distance = zoomPivotDistance
    }
    // OrbitControls scales world-space drag by distance from its target.
    orbit.panSpeed = Math.max(1, minPanDistance / distance)
  }, [camera, zoomDirection])

  useEffect(() => {
    if (mode !== 'free') return
    const keys = pressedKeys.current
    const resetKeys = () => keys.clear()
    const keyDown = (event: KeyboardEvent) => {
      if (!movementKeys.includes(event.code) || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.target instanceof Element &&
        event.target.closest('input, select, textarea, [contenteditable]:not([contenteditable="false"]), dialog[open]')) return
      event.preventDefault()
      keys.add(event.code)
    }
    const keyUp = (event: KeyboardEvent) => keys.delete(event.code)
    const setWheelSpeed = (event: WheelEvent) => {
      const orbit = controls.current
      if (!orbit || !event.deltaY) return
      const distance = Math.max(zoomPivotDistance, orbit.getDistance())
      // OrbitControls uses 0.95 ** zoomSpeed (or its inverse) for each wheel step.
      const ratio = 1 + Math.sign(event.deltaY) * wheelStep / distance
      orbit.zoomSpeed = Math.abs(Math.log(ratio) / Math.log(0.95))
    }
    const resetWheelSpeed = () => {
      if (controls.current) controls.current.zoomSpeed = 1
    }
    eventTarget?.addEventListener('wheel', setWheelSpeed, { capture: true, passive: true })
    window.addEventListener('wheel', resetWheelSpeed, { passive: true })
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', resetKeys)
    window.addEventListener('focusin', resetKeys)
    return () => {
      eventTarget?.removeEventListener('wheel', setWheelSpeed, true)
      window.removeEventListener('wheel', resetWheelSpeed)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', resetKeys)
      window.removeEventListener('focusin', resetKeys)
      resetKeys()
    }
  }, [mode, eventTarget])

  const orbitTarget = useMemo<[number, number, number]>(
    () => (mode === 'free' ? [look.x, look.y, look.z] : [0, 0, 0]),
    [mode, look],
  )
  useFrame((_, delta) => {
    if (mode !== 'follow') {
      wasFollowing.current = false
      smoothedYaw.current = null
      // OrbitControls can skip change events for the tail of a damped movement.
      if (camera.position.y < cameraFloor) updateFreeCamera()
      const orbit = controls.current
      const keys = pressedKeys.current
      if (!orbit || keys.size === 0) return
      const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) -
        Number(keys.has('KeyS') || keys.has('ArrowDown'))
      const right = Number(keys.has('KeyD') || keys.has('ArrowRight')) -
        Number(keys.has('KeyA') || keys.has('ArrowLeft'))
      if (!forward && !right) return
      camera.getWorldDirection(movement)
      const { x, z } = movement
      movement.set(x * forward - z * right, 0, z * forward + x * right)
        .normalize().multiplyScalar(keyboardSpeed * Math.min(delta, 0.1))
      camera.position.add(movement)
      orbit.target.add(movement)
      return
    }
    const target = getTarget()
    if (!target) return

    const dt = Math.min(delta, 0.1)

    if (smoothedYaw.current === null || !wasFollowing.current) {
      smoothedYaw.current = target.yaw
      look.set(target.x, 0.5, target.z)
    } else {
      const angleDiff = Math.atan2(
        Math.sin(target.yaw - smoothedYaw.current),
        Math.cos(target.yaw - smoothedYaw.current),
      )
      smoothedYaw.current += angleDiff * (1 - Math.exp(-6 * dt))

      targetLook.set(
        target.x - (reduced ? 0 : Math.sin(target.yaw) * 4.5),
        0.5,
        target.z - (reduced ? 0 : Math.cos(target.yaw) * 4.5),
      )
      look.lerp(targetLook, 1 - Math.exp(-10 * dt))
    }
    wasFollowing.current = true

    const followYaw = reduced ? 0 : smoothedYaw.current
    desired.set(
      target.x + (reduced ? 0 : Math.sin(followYaw) * 9),
      reduced ? 24 : 4.3,
      target.z + (reduced ? 16 : Math.cos(followYaw) * 9),
    )
    camera.position.lerp(desired, 1 - Math.exp(-7 * dt))
    camera.lookAt(look)
  })
  return mode !== 'follow' ? (
    <OrbitControls
      ref={controls}
      makeDefault
      target={orbitTarget}
      maxDistance={Math.max(100, extent * 4)}
      maxPolarAngle={Math.PI / 2.15}
      enableDamping
      dampingFactor={0.16}
      onStart={updateFreeCamera}
      onChange={updateFreeCamera}
      screenSpacePanning
      zoomToCursor
    />
  ) : null
}
