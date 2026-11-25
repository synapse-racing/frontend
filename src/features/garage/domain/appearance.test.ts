import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  defaultAppearance,
  parseAppearance,
  vehicleCatalog,
  vehicleSkinCatalog,
} from './appearance.ts'

describe('vehicle appearance', () => {
  it('accepts every catalog model and normalizes colors without carrying unknown fields', () => {
    for (const model of vehicleCatalog) {
      expect(
        parseAppearance({
          ...defaultAppearance,
          modelId: model.id,
          primaryColor: '#AABBCC',
          extra: true,
        }),
      ).toEqual({
        ...defaultAppearance,
        modelId: model.id,
        primaryColor: '#aabbcc',
      })
    }
  })

  it.each([
    null,
    [],
    {},
    { ...defaultAppearance, modelId: '/custom.glb' },
    { ...defaultAppearance, primaryColor: 'red' },
    { ...defaultAppearance, rimColor: '#abc' },
    { ...defaultAppearance, secondaryColor: null },
    { ...defaultAppearance, number: 0 },
    { ...defaultAppearance, number: 100 },
    { ...defaultAppearance, number: 1.5 },
    { ...defaultAppearance, number: '7' },
    { ...defaultAppearance, finish: 'chrome' },
    { ...defaultAppearance, livery: 'external' },
    { ...defaultAppearance, skin: 'malicious.png' },
    { ...defaultAppearance, skinScale: 0.2 },
    { ...defaultAppearance, skinScale: 4 },
    { ...defaultAppearance, skinMode: 'overlay' },
  ])('rejects invalid stored or remote data: %j', (input) => {
    expect(parseAppearance(input)).toBeNull()
  })

  it('defaults legacy records without skin fields and validates curated skins', () => {
    const legacy = {
      modelId: 'gt',
      primaryColor: '#112233',
      secondaryColor: '#445566',
      rimColor: '#778899',
      finish: 'metallic',
      livery: 'stripe',
      number: 12,
    }
    expect(parseAppearance(legacy)).toEqual({
      ...legacy,
      skin: 'none',
      skinScale: 1,
      skinMode: 'wrap',
    })
    expect(
      parseAppearance({
        ...legacy,
        skin: 'llamas',
        skinScale: 1.75,
        skinMode: 'tint',
      }),
    ).toEqual({
      ...legacy,
      skin: 'llamas',
      skinScale: 1.75,
      skinMode: 'tint',
    })
  })

  it('maps every catalog skin texture to an existing file in public/textures', () => {
    expect(vehicleSkinCatalog.length).toBe(47)
    for (const skin of vehicleSkinCatalog) {
      const diskPath = resolve('public', decodeURIComponent(skin.texture.slice(1)))
      expect(existsSync(diskPath), `Missing skin file ${diskPath}`).toBe(true)
    }
  })
})
