import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { SeededRandom } from '../../features/training/neat/random.ts'

export function createSurfaceTexture(kind: 'asphalt' | 'ground') {
  const canvas = document.createElement('canvas')
  const size = 256
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')!
  const pixels = context.createImageData(size, size)
  const rng = new SeededRandom(42170)
  for (let index = 0; index < pixels.data.length; index += 4) {
    const value = (kind === 'asphalt' ? 183 : 204) + rng.range(-10, 13)
    pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = value
    pixels.data[index + 3] = 255
  }
  context.putImageData(pixels, 0, 0)
  if (kind === 'ground') {
    for (let y = 0; y < size; y += 64) {
      context.fillStyle = '#888e97'
      context.fillRect(0, y, size, 2)
      for (let x = (y % 128) / 2; x < size; x += 64) context.fillRect(x, y, 2, 64)
    }
  } else {
    // Tar seams and worn aggregate stay in world space when the circuit turns.
    context.strokeStyle = 'rgba(46,47,54,.38)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(0, 163)
    for (let x = 0; x <= size; x += 8) {
      context.lineTo(
        x,
        163 + Math.sin((x * 2 * Math.PI) / size) * 15 + (x === size ? 0 : rng.range(-2, 2)),
      )
    }
    context.stroke()
    for (let i = 0; i < 34; i++) {
      context.fillStyle = 'rgba(57,59,62,.12)'
      context.fillRect(rng.range(0, size), rng.range(0, size), rng.range(1, 8), 1)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  if (kind === 'ground') texture.repeat.set(72, 72)
  texture.anisotropy = 4
  return texture
}
