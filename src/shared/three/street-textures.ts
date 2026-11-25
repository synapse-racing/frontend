import { BoxGeometry, CanvasTexture, EquirectangularReflectionMapping, SRGBColorSpace } from 'three'
import { SeededRandom } from '../../features/training/neat/random.ts'
import { districts, type StreetDistrict } from './urban-layout.ts'

function canvas2d(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas.getContext('2d')!
}

function texture(ctx: CanvasRenderingContext2D) {
  const result = new CanvasTexture(ctx.canvas)
  result.colorSpace = SRGBColorSpace
  return result
}

function rect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

// Front, service wall, roof and rear share one atlas and one draw call per building style.
export function facadeGeometry(windowFraction = 1) {
  const geometry = new BoxGeometry()
  const uv = geometry.getAttribute('uv')
  const normal = geometry.getAttribute('normal')
  for (let i = 0; i < uv.count; i++) {
    const column = Math.abs(normal.getX(i)) > 0.5 || normal.getZ(i) < -0.5 ? 1 : 0
    const row = normal.getY(i) !== 0 || normal.getZ(i) < -0.5 ? 0 : 1
    const crop = normal.getY(i) === 0 ? windowFraction : 1
    uv.setXY(
      i,
      (column + 0.003 + uv.getX(i) * 0.994) / 2,
      (row + 0.003 + uv.getY(i) * 0.994 * crop) / 2,
    )
  }
  return geometry
}

function windowPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glow: string,
) {
  rect(ctx, '#101920', x - 3, y - 4, w + 6, h + 10)
  const glass = ctx.createLinearGradient(0, y, 0, y + h)
  glass.addColorStop(0, glow)
  glass.addColorStop(1, '#33404d')
  ctx.fillStyle = glass
  ctx.fillRect(x, y, w, h)
  for (let bar = 0; bar < w; bar += 14) rect(ctx, '#25323d', x + bar, y, 2, h)
  rect(ctx, '#29313b', x, y + h * 0.45, w, 3)
  rect(ctx, '#69737c', x - 2, y + h, w + 4, 2)
}

export function createFacade(district: StreetDistrict, variant: number) {
  const ctx = canvas2d(1024, 1024),
    rng = new SeededRandom(174 + variant)
  const { accent, secondary } = districts[district]
  const tint = variant === 0 ? accent : secondary
  for (let tile = 0; tile < 4; tile++) {
    ctx.save()
    ctx.translate((tile % 2) * 512, Math.floor(tile / 2) * 512)
    const roof = tile === 2
    rect(ctx, roof ? '#3c454e' : variant ? '#51505b' : '#3c4955', 0, 0, 512, 512)
    const pitch = variant || roof ? 12 : 29
    for (let i = 0; i < 512; i += pitch) {
      if (variant || roof) {
        rect(ctx, '#24303a', i, 0, 2, 512)
        rect(ctx, '#76808a', i + 2, 0, 1, 512)
      } else {
        rect(ctx, '#2a3542', 0, i, 512, 2)
        for (let j = ((i / pitch) % 2) * 31; j < 512; j += 62) rect(ctx, '#33404a', j, i, 2, pitch)
      }
    }
    if (!roof) {
      windowPanel(ctx, 24, 49, 203, 68, tile === 0 ? '#c1b695' : '#637881')
      windowPanel(ctx, 262, 49, 213, 68, tile === 1 ? '#b9a87a' : '#6b909c')
      rect(ctx, '#28323d', 0, 145, 512, 9)
      rect(ctx, '#949497', 0, 145, 512, 2)
      if (tile === 0) {
        // Recessed roller door, shop sign and a painted race-team flash.
        rect(ctx, '#141e26', 29, 205, 282, 291)
        for (let y = 210; y < 490; y += 10) {
          rect(ctx, '#475461', 38, y, 264, 8)
          rect(ctx, '#66717a', 38, y, 264, 1)
        }
        rect(ctx, '#17212a', 22, 155, 434, 49)
        ctx.fillStyle = tint
        ctx.font = 'italic 900 30px Arial, sans-serif'
        const names =
          district === 'workshops'
            ? ['TALLER   NORTE', 'MUELLE   07']
            : ['RADIO   PIRATA', 'CLUB   MOTOR']
        ctx.fillText(names[variant], 34, 191, 394)
        ctx.save()
        ctx.translate(49, 402)
        ctx.transform(1, -0.15, -0.32, 1, 0, 0)
        ctx.globalAlpha = 0.7
        ctx.fillStyle = tint
        ctx.font = 'italic 900 97px Impact, sans-serif'
        ctx.fillText(variant ? '///' : 'SR', 0, 0)
        ctx.restore()
        rect(ctx, '#202d38', 357, 283, 96, 212)
        windowPanel(ctx, 368, 300, 72, 47, '#738894')
        rect(ctx, '#bbc2bd', 428, 403, 14, 4)
        for (const x of [25, 307]) {
          rect(ctx, '#192029', x, 348, 10, 146)
          for (let y = 350; y < 480; y += 22) rect(ctx, '#d6a652', x, y, 10, 9)
        }
      } else {
        windowPanel(ctx, 34, 205, 124, 79, '#667684')
        rect(ctx, '#202a36', 307, 189, 122, 103)
        for (let y = 198; y < 281; y += 8) rect(ctx, '#667480', 316, y, 104, 3)
        rect(ctx, '#1d2934', 133, 316, 8, 179)
        rect(ctx, '#848485', 136, 316, 2, 179)
        if (tile === 1) {
          ctx.save()
          ctx.translate(166, 320)
          ctx.transform(1, -0.09, -0.11, 1, 0, 0)
          // Two layers of spray paint, with the concrete visible through the stencil.
          const flash = new Path2D('M 0 76 L 112 14 L 97 43 L 203 0 L 156 55 L 246 31 L 120 111 L 144 69 L 48 108 L 76 68 Z')
          ctx.fillStyle = '#18232f'
          ctx.fill(flash)
          ctx.translate(-4, -6)
          ctx.globalAlpha = 0.72
          ctx.fillStyle = tint
          ctx.fill(flash)
          ctx.lineWidth = 2
          ctx.strokeStyle = '#d9dac8'
          ctx.stroke(flash)
          for (const [x, y, height] of [[49, 104, 24], [53, 102, 12], [120, 108, 16], [146, 90, 9]]) {
            ctx.fillRect(x, y, 2, height)
          }
          ctx.restore()
        }
      }
      rect(ctx, '#293641', 0, 495, 512, 17)
    }
    for (let j = 0; j < 1500; j++) {
      rect(
        ctx,
        j % 3 ? 'rgba(8,15,24,.12)' : 'rgba(219,213,186,.17)',
        rng.next() * 512,
        rng.next() * 512,
        rng.range(1, 4),
        rng.range(1, 5),
      )
    }
    ctx.restore()
  }
  return texture(ctx)
}

export function createTowerTexture(district: StreetDistrict) {
  const ctx = canvas2d(256, 512),
    rng = new SeededRandom(89)
  rect(ctx, '#283444', 0, 0, 256, 512)
  for (let y = 10; y < 503; y += 25) {
    rect(ctx, '#47505f', 0, y - 5, 256, 2)
    for (let x = 7; x < 250; x += 20) {
      const lit = rng.chance(0.34)
      rect(
        ctx,
        lit ? rng.pick(['#b8a382', '#91a7ab', districts[district].accent]) : '#1b2837',
        x,
        y,
        13,
        12,
      )
      if (lit) rect(ctx, '#394857', x, y + 7, 13, 1)
    }
  }
  const atlas = canvas2d(512, 512)
  for (const [x, y] of [
    [0, 0],
    [256, 0],
    [256, 256],
  ])
    atlas.drawImage(ctx.canvas, x, y, 256, 256)
  rect(atlas, '#35404a', 0, 256, 256, 256)
  rect(atlas, '#53606a', 7, 263, 242, 242)
  rect(atlas, '#38434e', 10, 266, 236, 236)
  return texture(atlas)
}

export function createNightSky(district: StreetDistrict) {
  const ctx = canvas2d(1024, 512),
    rng = new SeededRandom(430)
  const sky = ctx.createLinearGradient(0, 0, 0, 512)
  sky.addColorStop(0, '#090f21')
  sky.addColorStop(0.32, '#17243e')
  sky.addColorStop(0.48, district === 'workshops' ? '#5c4451' : '#4e435f')
  sky.addColorStop(0.55, districts[district].sky)
  sky.addColorStop(1, districts[district].sky)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 1024, 512)
  for (let i = 0; i < 185; i++)
    rect(ctx, 'rgba(208,224,242,.43)', rng.next() * 1024, rng.range(8, 203), 1, 1)
  const result = texture(ctx)
  result.mapping = EquirectangularReflectionMapping
  return result
}

export function createLampPool() {
  const ctx = canvas2d(96, 96)
  const falloff = ctx.createRadialGradient(48, 48, 0, 48, 48, 48)
  falloff.addColorStop(0, 'rgba(255,255,255,.55)')
  falloff.addColorStop(0.36, 'rgba(255,255,255,.28)')
  falloff.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = falloff
  ctx.fillRect(0, 0, 96, 96)
  return texture(ctx)
}

export function createFinishSign(district: StreetDistrict) {
  const ctx = canvas2d(768, 96)
  const { accent, name } = districts[district]
  rect(ctx, '#14222c', 0, 0, 768, 96)
  rect(ctx, accent, 0, 89, 768, 7)
  for (let i = 0; i < 3; i++) {
    ctx.save()
    ctx.transform(1, 0, -0.36, 1, 0, 0)
    rect(ctx, accent, 46 + i * 25, 12, 13, 65)
    ctx.restore()
  }
  ctx.textAlign = 'center'
  ctx.fillStyle = '#e9f3ef'
  ctx.font = 'italic 900 51px Arial, sans-serif'
  ctx.fillText('SALIDA  /  META', 341, 68, 388)
  rect(ctx, '#48606a', 557, 23, 2, 43)
  ctx.fillStyle = accent
  ctx.font = 'bold 14px monospace'
  ctx.fillText(name, 654, 52, 150)
  return texture(ctx)
}
