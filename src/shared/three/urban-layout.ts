import type { TrackDefinition } from '../../features/training/domain/track.ts'
import { SeededRandom } from '../../features/training/neat/random.ts'
import { trackExtent } from './track-geometry.ts'

export type StreetDistrict = 'workshops' | 'night-race'

export const districts = {
  workshops: {
    accent: '#ffc473',
    secondary: '#adf88c',
    sky: '#26273b',
    name: 'DISTRITO INDUSTRIAL',
  },
  'night-race': { accent: '#57eeef', secondary: '#fa6eab', sky: '#212740', name: 'DISTRITO NEÓN' },
} as const

type Point = readonly [number, number]
export interface StreetPart {
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
  yaw: number
  color: string
}

function part(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  yaw = 0,
  color = '#ffffff',
): StreetPart {
  return { x, y, z, width, height, depth, yaw, color }
}

function streetPath(track: TrackDefinition): { points: readonly Point[]; halfWidth: number } {
  const g = track.geometry
  if (g.kind === 'centerline-loop') return { points: g.centerline, halfWidth: g.driveHalfWidth }
  const x = (g.outerX + g.innerX) / 2,
    z = (g.outerZ + g.innerZ) / 2
  return {
    points: [
      [-x, z],
      [-x, -z],
      [x, -z],
      [x, z],
    ],
    halfWidth: (g.outerX - g.innerX) / 2,
  }
}

export function createStreetLayout(
  track: TrackDefinition,
  district: StreetDistrict,
  high: boolean,
) {
  const rng = new SeededRandom(track.recipe.seed)
  const palette = districts[district]
  const industrial = district === 'workshops'
  const { points, halfWidth } = streetPath(track)
  let length = 0
  const segments = points.map(([x, z], i) => {
    const next = points[(i + 1) % points.length]
    const dx = next[0] - x,
      dz = next[1] - z
    const span = Math.hypot(dx, dz)
    length += span
    return { x, z, tx: dx / span, tz: dz / span, span, end: length }
  })
  // Each footprint must clear every street, including the other arm of a hairpin.
  function clearOfStreet(x: number, z: number, radius: number) {
    const clearance = halfWidth + radius + 1.5
    return segments.every((s) => {
      const dx = x - s.x,
        dz = z - s.z
      const t = Math.max(0, Math.min(s.span, dx * s.tx + dz * s.tz))
      return (dx - t * s.tx) ** 2 + (dz - t * s.tz) ** 2 > clearance ** 2
    })
  }

  const facades: StreetPart[][] = [[], []]
  const towers: StreetPart[] = [],
    upperFloors: StreetPart[] = [],
    solids: StreetPart[] = [],
    lights: StreetPart[] = []
  const paint: StreetPart[] = [],
    pools: StreetPart[] = []
  const tanks: StreetPart[] = [],
    tankCaps: StreetPart[] = []
  const wires: number[] = [],
    pennants: number[] = [],
    arrows: number[] = []
  const lots: { x: number; z: number; radius: number }[] = []
  function sample(spacing: number, visit: (x: number, z: number, yaw: number, i: number) => void) {
    const count = Math.max(1, Math.floor(length / spacing))
    let segment = 0
    for (let i = 0; i < count; i++) {
      const distance = ((i + 0.5) * length) / count
      while (segments[segment].end < distance) segment++
      const s = segments[segment]
      const offset = distance - s.end + s.span
      visit(s.x + s.tx * offset, s.z + s.tz * offset, Math.atan2(-s.tz, s.tx), i)
    }
  }

  for (const [ax, az, bx, bz] of track.boundaries) {
    const yaw = Math.atan2(az - bz, bx - ax),
      size = Math.hypot(bx - ax, bz - az)
    const x = (ax + bx) / 2,
      z = (az + bz) / 2
    solids.push(part(x, 0.11, z, size + 0.035, 0.22, 0.24, yaw, '#58646a'))
    paint.push(part(x, 0.225, z, size + 0.025, 0.012, 0.21, yaw, '#c4cba8'))
  }
  sample(8, (x, z, yaw) => {
    paint.push(part(x, 0.016, z, 2.35, 0.012, 0.085, yaw, '#a69b75'))
  })

  sample(20, (x, z, yaw, i) => {
    const side = i % 2 ? -1 : 1
    const nx = Math.sin(yaw) * side,
      nz = Math.cos(yaw) * side
    const offset = halfWidth + 2.5
    const px = x + nx * offset,
      pz = z + nz * offset
    if (!clearOfStreet(px, pz, 0.35)) return
    const height = industrial ? 4.6 : 5.6
    const tint = i % 4 < 2 ? palette.accent : palette.secondary
    lots.push({ x: px, z: pz, radius: 0.6 })
    solids.push(
      part(px, 0.24, pz, 0.55, 0.48, 0.55, yaw, '#79858c'),
      part(px, height / 2, pz, 0.11, height, 0.11, yaw, '#82929d'),
      part(px - nx * 0.75, height, pz - nz * 0.75, 0.15, 0.13, 1.65, yaw, '#687983'),
      part(px - nx * 1.6, height - 0.04, pz - nz * 1.6, 0.65, 0.19, 0.95, yaw, '#344550'),
    )
    lights.push(part(px - nx * 1.6, height - 0.15, pz - nz * 1.6, 0.57, 0.045, 0.84, yaw, tint))
    pools.push(
      part(x + nx * (halfWidth - 0.6), 0.023, z + nz * (halfWidth - 0.6), 12, 0, 9, yaw, tint),
    )
  })

  const finish = track.checkpoints.at(-1)!.position
  const stations: { x: number; z: number; yaw: number }[] = []
  sample(12, (x, z, yaw) => stations.push({ x, z, yaw }))
  let lastSign = -3
  stations.forEach(({ x, z, yaw }, i) => {
    const delta = yaw - stations[(i + 1) % stations.length].yaw
    const turn = Math.atan2(Math.sin(delta), Math.cos(delta))
    if (i - lastSign < 2 || Math.abs(turn) < 0.42 || Math.hypot(x - finish[0], z - finish[2]) < 10)
      return
    const direction = Math.sign(turn),
      offset = -(halfWidth + 3) * direction
    const nx = Math.sin(yaw),
      nz = Math.cos(yaw)
    const px = x + nx * offset,
      pz = z + nz * offset
    if (!clearOfStreet(px, pz, 1.2)) return
    lastSign = i
    const facing = yaw - Math.PI / 2
    lots.push({ x: px, z: pz, radius: 1.15 })
    solids.push(
      part(px, 0.65, pz, 0.13, 1.3, 0.13, facing, '#71818a'),
      part(px, 1.53, pz, 2.2, 0.79, 0.1, facing, '#1d2830'),
    )
    for (const center of [-0.61, 0, 0.61]) {
      const vertex = (u: number, v: number) => {
        const lateral = center + direction * u
        arrows.push(px + nx * lateral - nz * 0.057, 1.53 + v, pz + nz * lateral + nx * 0.057)
      }
      for (const vertical of [-1, 1]) {
        vertex(-0.24, 0.3 * vertical)
        vertex(-0.02, 0.3 * vertical)
        vertex(0.25, 0)
        vertex(-0.24, 0.3 * vertical)
        vertex(0.25, 0)
        vertex(0.03, 0)
      }
    }
  })

  sample(88, (x, z, yaw) => {
    if (Math.hypot(x - finish[0], z - finish[2]) < 17) return
    const span = halfWidth + 3.5,
      nx = Math.sin(yaw),
      nz = Math.cos(yaw)
    const sides = [-1, 1]
    if (!sides.every((side) => clearOfStreet(x + nx * span * side, z + nz * span * side, 0.45)))
      return
    for (const side of sides) {
      const px = x + nx * span * side,
        pz = z + nz * span * side
      lots.push({ x: px, z: pz, radius: 0.5 })
      solids.push(part(px, 3.45, pz, 0.16, 6.9, 0.16, yaw, '#65717c'))
    }
    const sag = (t: number) => 6.85 - 0.85 * (1 - t * t)
    for (let i = 0; i < 12; i++) {
      const a = i / 6 - 1,
        b = (i + 1) / 6 - 1
      wires.push(
        x + nx * span * a,
        sag(a),
        z + nz * span * a,
        x + nx * span * b,
        sag(b),
        z + nz * span * b,
      )
      if (!industrial && i % 2 === 0) {
        pennants.push(
          x + nx * span * a,
          sag(a),
          z + nz * span * a,
          x + nx * span * (a + 0.1),
          sag(a + 0.1),
          z + nz * span * (a + 0.1),
          x + nx * span * (a + 0.04),
          sag(a) - 0.55,
          z + nz * span * (a + 0.04),
        )
      }
    }
  })

  sample(13, (x, z, yaw, i) => {
    for (const side of [-1, 1]) {
      const width = rng.range(8, 16),
        depth = rng.range(5.5, 9)
      const height = industrial ? rng.range(3.7, 6.2) : rng.range(4.5, 8.5)
      const radius = Math.hypot(width, depth) / 2
      const offset = halfWidth + radius + rng.range(3.2, 6.2)
      const nx = Math.sin(yaw) * side,
        nz = Math.cos(yaw) * side
      const bx = x + nx * offset,
        bz = z + nz * offset
      if (
        !clearOfStreet(bx, bz, radius) ||
        lots.some((lot) => (bx - lot.x) ** 2 + (bz - lot.z) ** 2 < (radius + lot.radius + 0.6) ** 2)
      )
        continue
      lots.push({ x: bx, z: bz, radius })
      const facing = side === 1 ? yaw + Math.PI : yaw
      const variant = (i + (side === 1 ? 1 : 0)) % 2
      const serviceEntrance = (i + side) % 3 === 0
      facades[variant].push(
        part(bx, height / 2, bz, width, height, depth, serviceEntrance ? facing + Math.PI : facing),
      )
      solids.push(part(bx, 0.08, bz, width + 0.9, 0.16, depth + 0.95, facing, '#6a6870'))
      solids.push(part(bx, height + 0.11, bz, width + 0.18, 0.22, depth + 0.18, facing, '#495766'))
      if (serviceEntrance) {
        const upperHeight = industrial ? 3.5 : 6.8
        upperFloors.push(
          part(
            bx + nx * 0.8,
            height + upperHeight / 2,
            bz + nz * 0.8,
            width * 0.77,
            upperHeight,
            depth * 0.65,
            facing,
          ),
        )
      } else if (high) {
        if ((i + variant) % 4 === 0) {
          solids.push(part(bx, height + 0.65, bz, 1.65, 1.3, 1.65, facing, '#313c49'))
          tanks.push(part(bx, height + 2.45, bz, 2.6, 2.5, 2.6, facing, '#866d69'))
          tankCaps.push(part(bx, height + 4.0, bz, 2.9, 0.65, 2.9, facing, '#556272'))
        } else {
          solids.push(
            part(bx, height + 0.56, bz, width * 0.29, 0.8, 1.7, facing, '#68737c'),
            part(bx + nx * 1.7, height + 0.9, bz + nz * 1.7, 0.33, 1.8, 0.33, facing, '#5c626a'),
          )
        }
      }
      const front = depth / 2 + 0.08
      solids.push(
        part(
          bx - nx * (front + 0.32),
          height * 0.68 + 0.1,
          bz - nz * (front + 0.32),
          width * 0.5,
          0.16,
          0.92,
          facing,
          '#374552',
        ),
      )
      lights.push(
        part(
          bx - nx * (front + 0.73),
          height * 0.68,
          bz - nz * (front + 0.73),
          width * 0.48,
          0.065,
          0.12,
          facing,
          variant ? palette.secondary : palette.accent,
        ),
      )
    }
  })

  const extent = trackExtent(track)
  const radius = Math.hypot(extent.x, extent.z)
  const count = Math.max(26, Math.ceil((2 * Math.PI * (radius + 32)) / 14))
  for (let i = 0; i < count; i++) {
    const angle = ((i + rng.range(-0.16, 0.16)) * Math.PI * 2) / count
    const distance = radius + rng.range(28, 44)
    const x = Math.sin(angle) * distance,
      z = Math.cos(angle) * distance
    const width = rng.range(8, 16),
      depth = rng.range(7, 14)
    const height = industrial ? rng.range(10, 30) : rng.range(14, 40)
    if (!high && i % 2) continue
    towers.push(part(x, height / 2, z, width, height, depth, angle))
    if (i % 3 === 0) {
      towers.push(part(x, height + 2, z, width * 0.7, 4, depth * 0.72, angle))
      lights.push(part(x, height + 4.05, z, width * 0.7, 0.1, depth * 0.72, angle, palette.accent))
    }
  }

  for (const checkpoint of track.checkpoints) {
    const finish = checkpoint === track.checkpoints.at(-1)
    const width = checkpoint.size[0],
      yaw = checkpoint.rotationY
    for (let col = 0; col < (finish ? 16 : 4); col++) {
      const dx = finish
        ? (((col % 8) + 0.5) / 8 - 0.5) * width
        : (col < 2 ? -1 : 1) * (width / 2 - 0.42 - (col % 2) * 0.48)
      const dz = finish ? (Math.floor(col / 8) - 0.5) * 0.42 : 0
      const color = finish
        ? ((col % 2) + Math.floor(col / 8)) % 2
          ? '#172029'
          : '#f1f2de'
        : palette.accent
      paint.push(
        part(
          checkpoint.position[0] + Math.cos(yaw) * dx + Math.sin(yaw) * dz,
          0.035,
          checkpoint.position[2] - Math.sin(yaw) * dx + Math.cos(yaw) * dz,
          finish ? width / 8 : 0.32,
          0.015,
          finish ? 0.42 : 0.72,
          yaw,
          color,
        ),
      )
    }
  }
  return {
    facades,
    towers,
    upperFloors,
    solids,
    lights,
    paint,
    pools,
    tanks,
    tankCaps,
    radius,
    wires: new Float32Array(wires),
    pennants: new Float32Array(pennants),
    arrows: new Float32Array(arrows),
  }
}
