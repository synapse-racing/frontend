import {
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three'
import {
  vehicleSkinCatalog,
  type VehicleAppearance,
  type VehicleSkinId,
} from '../../../features/garage/domain/appearance.ts'

function createCarbonTexture() {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#0f1214'
  ctx.fillRect(0, 0, 64, 64)
  for (let y = 0; y < 64; y += 16) {
    for (let x = 0; x < 64; x += 16) {
      if ((x / 16 + y / 16) % 2 === 0) {
        ctx.fillStyle = '#2b343a'
        ctx.fillRect(x, y, 16, 8)
        ctx.fillStyle = '#44515a'
        ctx.fillRect(x, y, 8, 8)
      } else {
        ctx.fillStyle = '#1c2226'
        ctx.fillRect(x, y + 8, 16, 8)
        ctx.fillStyle = '#2b343a'
        ctx.fillRect(x + 8, y + 8, 8, 8)
      }
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(16, 16)
  texture.colorSpace = SRGBColorSpace
  return texture
}

const carbonTexture = createCarbonTexture()
const skinTextures = new Map<VehicleSkinId, Texture>()
const textureLoader = typeof Image !== 'undefined' ? new TextureLoader() : null

/**
 * Loads and caches a shared GPU texture for a vehicle wrap skin so 64-player
 * rooms reuse the same Texture instance without duplicate uploads.
 */
export function getSkinTexture(skinId: VehicleSkinId): Texture | null {
  if (skinId === 'none' || !textureLoader) return null
  const cached = skinTextures.get(skinId)
  if (cached) return cached
  const entry = vehicleSkinCatalog.find((skin) => skin.id === skinId)
  if (!entry) return null
  const texture = textureLoader.load(entry.texture)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  skinTextures.set(skinId, texture)
  return texture
}

const finishes = {
  matte: {
    metalness: 0.12,
    roughness: 0.62,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
  },
  satin: {
    metalness: 0.3,
    roughness: 0.32,
    clearcoat: 0.5,
    clearcoatRoughness: 0.24,
  },
  metallic: {
    metalness: 0.65,
    roughness: 0.26,
    clearcoat: 0.85,
    clearcoatRoughness: 0.13,
  },
}

export function createVehicleMaterials(
  appearance: VehicleAppearance,
  faded: boolean,
) {
  const fade = {
    transparent: faded,
    opacity: faded ? 0.35 : 1,
    depthWrite: !faded,
  }
  const skinId = appearance.skin ?? 'none'
  const skinScale = appearance.skinScale ?? 1
  const skinMode = appearance.skinMode ?? 'wrap'
  const skinTexture = getSkinTexture(skinId)
  const hasSkin = skinId !== 'none' && skinTexture !== null

  const paint = new MeshPhysicalMaterial({
    color: appearance.primaryColor,
    ...finishes[appearance.finish],
    ...fade,
  })
  if (hasSkin) {
    paint.defines = { USE_VEHICLE_SKIN: 1 }
  }

  const secondary = new Color(appearance.secondaryColor)
  const mode =
    appearance.livery === 'stripe' ? 1 : appearance.livery === 'split' ? 2 : 0
  const skinModeValue = skinMode === 'tint' ? 1.0 : 0.0

  paint.onBeforeCompile = (shader) => {
    shader.uniforms.vehicleSecondary = { value: secondary }
    shader.uniforms.vehicleLivery = { value: mode }
    if (hasSkin && skinTexture) {
      shader.uniforms.uSkinMap = { value: skinTexture }
      shader.uniforms.uSkinScale = { value: skinScale }
      shader.uniforms.uSkinMode = { value: skinModeValue }
    }

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vVehicleX;
        #ifdef USE_VEHICLE_SKIN
          varying vec3 vVehiclePos;
          varying vec3 vVehicleNormal;
        #endif`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vVehicleX = position.x;
        #ifdef USE_VEHICLE_SKIN
          vVehiclePos = position;
          vVehicleNormal = normal;
        #endif`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vVehicleX;
        uniform vec3 vehicleSecondary;
        uniform float vehicleLivery;
        #ifdef USE_VEHICLE_SKIN
          varying vec3 vVehiclePos;
          varying vec3 vVehicleNormal;
          uniform sampler2D uSkinMap;
          uniform float uSkinScale;
          uniform float uSkinMode;
        #endif`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float line = 1.0 - smoothstep(0.062, 0.068, abs(vVehicleX));
        float split = step(0.0, vVehicleX);
        float mask = vehicleLivery < 0.5 ? 0.0 : (vehicleLivery < 1.5 ? line : split);
        vec3 basePaint = mix(diffuseColor.rgb, vehicleSecondary, mask);

        #ifdef USE_VEHICLE_SKIN
          vec3 n = normalize(vVehicleNormal);
          vec3 blend = pow(abs(n), vec3(4.0));
          blend /= max(blend.x + blend.y + blend.z, 1e-5);

          float tileScale = 0.62 * uSkinScale;
          // Invert Z on the negative-X side so directional graphics flow front-to-rear symmetrically.
          float sideZ = n.x < 0.0 ? -vVehiclePos.z : vVehiclePos.z;
          vec2 uvX = vec2(sideZ, vVehiclePos.y) * tileScale + vec2(0.5, 0.15);
          vec2 uvY = vVehiclePos.xz * tileScale + vec2(0.5, 0.5);
          vec2 uvZ = vVehiclePos.xy * tileScale + vec2(0.5, 0.15);

          vec3 skinSample =
            texture2D(uSkinMap, uvX).rgb * blend.x +
            texture2D(uSkinMap, uvY).rgb * blend.y +
            texture2D(uSkinMap, uvZ).rgb * blend.z;

          if (uSkinMode < 0.5) {
            diffuseColor.rgb = skinSample;
          } else {
            float patLuma = clamp(dot(skinSample, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
            vec3 tinted = mix(basePaint * 0.25, mix(basePaint, vehicleSecondary, 0.42) * 1.35, patLuma);
            diffuseColor.rgb = mix(tinted, skinSample * (0.45 + 0.75 * basePaint), 0.25);
          }
        #else
          diffuseColor.rgb = basePaint;
        #endif`,
      )
  }
  paint.customProgramCacheKey = () =>
    hasSkin ? 'vehicle-paint-v3-skin' : 'vehicle-paint-v3-none'

  const basic = (color: string, metalness: number, roughness: number) =>
    new MeshStandardMaterial({ color, metalness, roughness, ...fade })
  return {
    paint,
    accent: new MeshPhysicalMaterial({
      color: appearance.secondaryColor,
      ...finishes[appearance.finish],
      ...fade,
    }),
    rim: basic(appearance.rimColor, 0.75, 0.28),
    glass: new MeshPhysicalMaterial({
      color: '#1d303b',
      metalness: 0.3,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      ...fade,
    }),
    carbon: new MeshPhysicalMaterial({
      color: '#22282d',
      map: carbonTexture,
      metalness: 0.35,
      roughness: 0.35,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      ...fade,
    }),
    metal: basic('#8c959c', 0.75, 0.32),
    mirror: basic('#b7cdd7', 1, 0.08),
    lights: new MeshStandardMaterial({
      color: '#e1effa',
      emissive: '#c7e4fa',
      emissiveIntensity: 0.8,
      ...fade,
    }),
    rearLights: new MeshStandardMaterial({
      color: '#d52b24',
      emissive: '#e52714',
      emissiveIntensity: 0.65,
      ...fade,
    }),
  }
}

const numbers = new Map<number, CanvasTexture>()
export function numberTexture(number: number) {
  const normalized = Math.max(1, Math.min(99, Math.round(number)))
  const existing = numbers.get(normalized)
  if (existing) return existing
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')!
  context.fillStyle = '#efece0'
  context.fillRect(0, 0, 256, 256)
  context.fillStyle = '#1a2026'
  context.fillRect(0, 0, 256, 35)
  context.font = 'bold 17px Arial'
  context.textAlign = 'center'
  context.fillStyle = '#efece0'
  context.fillText('S Y N A P S E', 128, 24)
  context.fillStyle = '#182126'
  context.font = 'italic 900 172px Arial'
  context.textBaseline = 'middle'
  context.fillText(String(normalized).padStart(2, '0'), 122, 145, 227)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  numbers.set(normalized, texture)
  return texture
}
