export const vehicleSkinCatalog = [
  { id: 'llamas', name: 'Llamas I', texture: '/textures/llamas.jpg' },
  { id: 'llamas2', name: 'Llamas II', texture: '/textures/llamas2.jpg' },
  { id: 'llamas3', name: 'Infierno', texture: '/textures/llamas3.jpg' },
  {
    id: 'llamas-fuego',
    name: 'Fuego Vivo',
    texture: '/textures/Llamas%20de%20fuego.jpg',
  },
  { id: 'calaveras', name: 'Calaveras I', texture: '/textures/calaveras.jpg' },
  { id: 'calaveras2', name: 'Calaveras II', texture: '/textures/calaveras2.jpg' },
  { id: 'calaveras3', name: 'Calaveras III', texture: '/textures/calaveras3.jpg' },
  { id: 'calaveras4', name: 'Calaveras IV', texture: '/textures/calaveras4.jpg' },
  { id: 'calaveras5', name: 'Calaveras V', texture: '/textures/calaveras5.jpg' },
  { id: 'calaveras6', name: 'Calaveras VI', texture: '/textures/calaveras6.jpg' },
  { id: 'calaveras7', name: 'Calaveras VII', texture: '/textures/calaveras7.jpg' },
  { id: 'calaveras8', name: 'Calaveras VIII', texture: '/textures/calaveras8.jpg' },
  { id: 'calaveras9', name: 'Calaveras IX', texture: '/textures/calaveras9.jpg' },
  { id: 'calaveras10', name: 'Calaveras X', texture: '/textures/calaveras10.jpg' },
  { id: 'calaveras11', name: 'Calaveras XI', texture: '/textures/calaveras11.jpg' },
  { id: 'calaveras12', name: 'Calaveras XII', texture: '/textures/calaveras12.jpg' },
  { id: 'toxico', name: 'Tóxico I', texture: '/textures/toxico.jpg' },
  { id: 'toxico3', name: 'Tóxico II', texture: '/textures/toxico3.jpg' },
  { id: 'toxico4', name: 'Ácido Neón', texture: '/textures/toxico4.jpg' },
  { id: 'ajedrez', name: 'Ajedrez', texture: '/textures/ajedrez.jpg' },
  {
    id: 'trippyajedrez',
    name: 'Ajedrez Trippy',
    texture: '/textures/trippyajedrez.jpg',
  },
  { id: 'trippy', name: 'Trippy', texture: '/textures/trippy.jpg' },
  { id: 'malla', name: 'Fibra Malla', texture: '/textures/malla.jpg' },
  { id: 'pinchos', name: 'Pinchos I', texture: '/textures/pinchos.jpg' },
  { id: 'pinchos2', name: 'Pinchos II', texture: '/textures/pinchos2.jpg' },
  { id: 'thorn', name: 'Espinas', texture: '/textures/thorn.png' },
  { id: 'metal', name: 'Chapa I', texture: '/textures/metal.jpg' },
  { id: 'metal2', name: 'Chapa II', texture: '/textures/metal2.jpg' },
  { id: 'metal3', name: 'Chapa III', texture: '/textures/metal3.jpg' },
  { id: 'metal4', name: 'Chapa IV', texture: '/textures/metal4.jpg' },
  { id: 'metal5', name: 'Chapa V', texture: '/textures/metal5.jpg' },
  { id: 'animal', name: 'Tigre', texture: '/textures/animal.jpg' },
  { id: 'animal2', name: 'Leopardo', texture: '/textures/animal2.jpg' },
  { id: 'animal3', name: 'Cebra', texture: '/textures/animal3.jpg' },
  { id: 'pintura', name: 'Graffiti', texture: '/textures/pintura.jpg' },
  { id: 'pistolas', name: 'Pistolas', texture: '/textures/pistolas.jpg' },
  { id: 'playboy', name: 'Bunny', texture: '/textures/playboy.jpg' },
  { id: 'mujeres', name: 'Pin-Up', texture: '/textures/mujeres.jpg' },
  { id: 'caras', name: 'Caras', texture: '/textures/caras.jpg' },
  { id: 'cerebro', name: 'Cerebro I', texture: '/textures/cerebro.jpg' },
  { id: 'cerebros', name: 'Cerebro II', texture: '/textures/cerebros.jpg' },
  { id: 'hormigas', name: 'Hormigas', texture: '/textures/hormigas.jpg' },
  {
    id: 'zombie',
    name: 'Zombie',
    texture: '/textures/zombie%20stampp%20_!!1.jpg',
  },
  { id: 'urban-1', name: 'Urban 01', texture: '/textures/1.jpg' },
  {
    id: 'urban-2',
    name: 'Urban 02',
    texture: '/textures/4fb5b9984fe67e728a8793b208e229e5.jpg',
  },
  { id: 'urban-3', name: 'Urban 03', texture: '/textures/jpg.jpg' },
  {
    id: 'photo-border',
    name: 'Sticker',
    texture: '/textures/Photo%20Border.jpg',
  },
] as const

export const vehicleSkinIds = [
  'none',
  ...vehicleSkinCatalog.map((skin) => skin.id),
] as const

export type VehicleSkinId = (typeof vehicleSkinIds)[number]
export type VehicleSkinMode = 'wrap' | 'tint'

export interface VehicleAppearance {
  modelId: 'formula' | 'gt' | 'prototype'
  primaryColor: string
  secondaryColor: string
  rimColor: string
  finish: 'matte' | 'satin' | 'metallic'
  livery: 'solid' | 'stripe' | 'split'
  number: number
  skin?: VehicleSkinId
  skinScale?: number
  skinMode?: VehicleSkinMode
}

export const defaultAppearance: VehicleAppearance = {
  modelId: 'formula',
  primaryColor: '#ff692f',
  secondaryColor: '#f4ead3',
  rimColor: '#d7dce0',
  finish: 'satin',
  livery: 'solid',
  number: 7,
  skin: 'none',
  skinScale: 1,
  skinMode: 'wrap',
}

export const vehicleCatalog: ReadonlyArray<{
  id: VehicleAppearance['modelId']
  name: string
  category: string
  description: string
}> = [
  {
    id: 'formula',
    name: 'Bavaria E46 M-Spec',
    category: 'Sedán Drift 3 Vol.',
    description:
      'Tracción trasera ensanchada para reventar rotondas. Doble riñón, alerón GT y cuatro escapes tronando.',
  },
  {
    id: 'gt',
    name: 'Saxo VTS "Poligonero"',
    category: 'Compacto 2 Vol.',
    description:
      'Corto, cuadrado y sin alerón (portón alisado). Faldones a ras de asfalto, rejillas XXL y un escape gordo.',
  },
  {
    id: 'prototype',
    name: 'Calibra Turbo 16V',
    category: 'Coupé Fastback',
    description:
      'El más bajo y afilado en cuña. Morro largo, faros rasgados, alerón bajo y doble salida de escape.',
  },
]

export function parseAppearance(value: unknown): VehicleAppearance | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  const color = (input: unknown): input is string =>
    typeof input === 'string' && /^#[0-9a-f]{6}$/i.test(input)
  if (
    !['formula', 'gt', 'prototype'].includes(data.modelId as string) ||
    !['matte', 'satin', 'metallic'].includes(data.finish as string) ||
    !['solid', 'stripe', 'split'].includes(data.livery as string) ||
    !color(data.primaryColor) ||
    !color(data.secondaryColor) ||
    !color(data.rimColor) ||
    typeof data.number !== 'number' ||
    !Number.isInteger(data.number) ||
    data.number < 1 ||
    data.number > 99
  )
    return null

  const skin = data.skin === undefined ? 'none' : data.skin
  if (
    typeof skin !== 'string' ||
    !(vehicleSkinIds as readonly string[]).includes(skin)
  )
    return null

  const skinScale = data.skinScale === undefined ? 1 : data.skinScale
  if (
    typeof skinScale !== 'number' ||
    !Number.isFinite(skinScale) ||
    skinScale < 0.5 ||
    skinScale > 3
  )
    return null

  const skinMode = data.skinMode === undefined ? 'wrap' : data.skinMode
  if (skinMode !== 'wrap' && skinMode !== 'tint') return null

  return {
    modelId: data.modelId as VehicleAppearance['modelId'],
    primaryColor: data.primaryColor.toLowerCase(),
    secondaryColor: data.secondaryColor.toLowerCase(),
    rimColor: data.rimColor.toLowerCase(),
    finish: data.finish as VehicleAppearance['finish'],
    livery: data.livery as VehicleAppearance['livery'],
    number: data.number,
    skin: skin as VehicleSkinId,
    skinScale: Math.round(skinScale * 100) / 100,
    skinMode,
  }
}
