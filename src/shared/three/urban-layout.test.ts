import { describe, expect, it } from 'vitest'
import { generateTrack, type TrackRecipe } from '../../features/training/domain/track.ts'
import { isDrivable } from '../../features/training/simulation/race-contract.ts'
import { createStreetLayout } from './urban-layout.ts'

describe('street scenery', () => {
  const versions: TrackRecipe['version'][] = [
    'rectangular-ring-v1',
    'curved-loop-v1',
    'technical-loop-v2',
    'grand-prix-v3',
  ]
  it.each(versions)('keeps building footprints off the road on %s', (version) => {
    for (const seed of [42, 42170, 79]) {
      const track = generateTrack({ version, seed })
      const { facades, towers } = createStreetLayout(track, 'night-race', true)
      expect(facades.flat().length).toBeGreaterThan(0)
      for (const b of [...facades.flat(), ...towers]) {
        for (const u of [-0.5, 0, 0.5]) {
          for (const v of [-0.5, 0, 0.5]) {
            const x = b.x + Math.cos(b.yaw) * u * b.width + Math.sin(b.yaw) * v * b.depth
            const z = b.z - Math.sin(b.yaw) * u * b.width + Math.cos(b.yaw) * v * b.depth
            expect(isDrivable(x, z, track)).toBe(false)
          }
        }
      }
    }
  })

  it('keeps the same street landmarks when players use different graphics settings', () => {
    const track = generateTrack({ version: 'grand-prix-v3', seed: 818 })
    const low = createStreetLayout(track, 'night-race', false)
    const high = createStreetLayout(track, 'night-race', true)
    expect(low.facades).toEqual(high.facades)
    expect(low.paint).toEqual(high.paint)
    expect(low.pools).toEqual(high.pools)
    expect(low.towers.length).toBeLessThan(high.towers.length)
  })
})
