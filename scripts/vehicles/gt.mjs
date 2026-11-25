import { createBuilder } from './modeling.mjs'

// Compacto 3 puertas hatchback (estilo Saxo VTS / Golf GTI Mk3)
// El más corto y cuadrado de los tres (2 volúmenes, SIN alerón, portón trasero alisado)
// z, width, centerHeight, shoulderHeight, bottomHeight
const BODY = [
  [-1.02, 0.434, 0.345, 0.332, 0.112],
  [-0.98, 0.448, 0.398, 0.386, 0.102],
  [-0.90, 0.456, 0.445, 0.434, 0.094],
  [-0.78, 0.464, 0.458, 0.448, 0.090],
  [-0.60, 0.470, 0.464, 0.456, 0.090],
  [-0.40, 0.466, 0.470, 0.460, 0.088],
  [-0.05, 0.468, 0.474, 0.462, 0.088],
  [0.32, 0.470, 0.478, 0.464, 0.088],
  [0.60, 0.474, 0.480, 0.466, 0.090],
  [0.84, 0.464, 0.478, 0.464, 0.094],
  [0.98, 0.448, 0.472, 0.458, 0.100],
  [1.02, 0.434, 0.454, 0.440, 0.108],
]

// Cabina alta y cuadrada con portón trasero casi vertical sin maletero sobresaliente
// z, roofCenter, roofHalfWidth, beltHalfWidth, beltHeight
const CABIN = [
  [-0.39, 0.470, 0.406, 0.432, 0.460],
  [-0.31, 0.575, 0.386, 0.432, 0.462],
  [-0.18, 0.735, 0.364, 0.432, 0.464],
  [-0.08, 0.762, 0.358, 0.432, 0.466],
  [0.24, 0.768, 0.356, 0.434, 0.468],
  [0.62, 0.758, 0.356, 0.438, 0.470],
  [0.78, 0.738, 0.358, 0.438, 0.470],
  [0.90, 0.618, 0.384, 0.436, 0.470],
  [0.99, 0.472, 0.416, 0.428, 0.458],
]

function cabinSection(z) {
  const index = CABIN.findIndex((section) => section[0] >= z)
  if (index <= 0) return CABIN[index < 0 ? CABIN.length - 1 : 0]
  const a = CABIN[index - 1],
    c = CABIN[index]
  const span = c[0] - a[0],
    t = (z - a[0]) / span
  return a.map((value, field) =>
    field === 0 ? z : value + (c[field] - value) * t,
  )
}

function range(from, to, segments) {
  return Array.from(
    { length: segments + 1 },
    (_, index) => from + ((to - from) * index) / segments,
  )
}

export function buildGt(detail = 'high') {
  const b = createBuilder(detail)
  const high = detail === 'high'
  const archClearance = 0.032
  const archLip = 0.024

  // Ejes cortos propios del compacto urbano con llantas 10-radios
  const wheels = [-1, 1].flatMap((side) => [
    {
      x: side * 0.430,
      y: 0.190,
      z: -0.60,
      radius: 0.190,
      width: 0.160,
      front: true,
      style: 'mesh',
    },
    {
      x: side * 0.430,
      y: 0.190,
      z: 0.60,
      radius: 0.190,
      width: 0.160,
      front: false,
      style: 'mesh',
    },
  ])

  const body = b.body(BODY, wheels, {
    archClearance,
    archLip,
    segments: high ? 62 : 24,
    frontSweep: 0.012,
    rearSweep: 0.010,
  })

  const topPoint = (x, z, lift = 0) => {
    const point = body.topPoint(x, z)
    point[1] += lift
    return point
  }
  const roofPoint = (z, ratio, lift = 0) => {
    const [, center, width] = cabinSection(z)
    return [ratio * width, center - 0.012 * Math.abs(ratio) ** 4 + lift, z]
  }
  const cabinSide = (side, z, height, lift = 0) => {
    const [, top, topWidth, bottomWidth, bottom] = cabinSection(z)
    return [
      side * (bottomWidth + (topWidth - bottomWidth) * height + lift),
      bottom + (top - 0.012 - bottom) * height,
      z,
    ]
  }

  // Cabina alta de 3 puertas (techo largo y caída trasera vertical limpia)
  const cabinRows = range(-0.39, 0.99, high ? 28 : 14)
  b.patch(
    'paint',
    cabinRows.map((z) =>
      range(-1, 1, high ? 10 : 6).map((u) => roofPoint(z, u)),
    ),
  )
  for (const side of [-1, 1]) {
    b.patch(
      'paint',
      cabinRows.map((z) => range(0, 1, 3).map((t) => cabinSide(side, z, t))),
      side > 0,
    )
  }

  // Cristales delantero, luneta trasera vertical y laterales 3 puertas
  for (const [start, end, width] of [
    [-0.355, -0.19, 0.87],
    [0.81, 0.96, 0.86],
  ]) {
    b.patch(
      'glass',
      range(start, end, high ? 10 : 5).map((z) =>
        range(-width, width, high ? 8 : 4).map((u) => roofPoint(z, u, 0.0025)),
      ),
    )
  }
  for (const side of [-1, 1]) {
    for (const [start, end] of [
      [-0.31, 0.20],
      [0.25, 0.72],
    ]) {
      b.patch(
        'glass',
        range(start, end, high ? 10 : 5).map((z) =>
          range(0.14, 0.88, 2).map((t) => cabinSide(side, z, t, 0.0025)),
        ),
        side > 0,
      )
    }
    // Pilar B negro
    b.patch(
      'carbon',
      range(0.20, 0.25, 1).map((z) =>
        [0.12, 0.90].map((t) => cabinSide(side, z, t, 0.003)),
      ),
      side > 0,
    )
    b.tube(
      'carbon',
      range(-0.32, 0.74, high ? 8 : 4).map((z) =>
        cabinSide(side, z, 0.08, 0.003),
      ),
      0.004,
    )

    // Espejos retrovisores anclados a la esquina delantera de la puerta
    const mirrorBase = cabinSide(side, -0.31, 0.22, 0.002)
    b.mirror(
      side,
      mirrorBase,
      [side * 0.540, 0.520, -0.32],
      [0.115, 0.052, 0.075],
    )

    // Faros delanteros rectangulares de compacto 90s/2000s
    const lampSurface = (role, rows, lift) => {
      const grid = []
      for (let row = 0; row < rows.length - 1; row++) {
        const from = rows[row],
          to = rows[row + 1]
        for (const t of range(0, 1, high ? 6 : 3).slice(row ? 1 : 0)) {
          const z = from[0] + (to[0] - from[0]) * t
          const inside = from[1] + (to[1] - from[1]) * t
          const outside = from[2] + (to[2] - from[2]) * t
          grid.push(
            range(inside, outside, high ? 8 : 4).map((x) => {
              const point = topPoint(side * x, z)
              return [point[0], point[2]]
            }),
          )
        }
      }
      b.bodyDetail(role, grid, lift, side < 0)
    }
    lampSurface(
      'carbon',
      [
        [-1.012, 0.215, 0.412],
        [-0.925, 0.215, 0.412],
      ],
      0.003,
    )
    lampSurface(
      'glass',
      [
        [-1.004, 0.228, 0.400],
        [-0.933, 0.228, 0.400],
      ],
      0.0045,
    )
    lampSurface(
      'lights',
      [
        [-0.994, 0.240, 0.312],
        [-0.944, 0.240, 0.312],
      ],
      0.006,
    )
    lampSurface(
      'lights',
      [
        [-0.994, 0.330, 0.388],
        [-0.944, 0.330, 0.388],
      ],
      0.006,
    )

    // Pasos de rueda ensanchados VTS sin tapar el neumático
    const wheelList = wheels.filter((w) => Math.sign(w.x) === side)
    for (const wheel of wheelList) {
      const rInner = wheel.radius + archClearance
      const rOuter = rInner + 0.044
      const angles = range(0.05, Math.PI - 0.05, high ? 16 : 8)
      b.patch(
        'paint',
        angles.map((theta) => {
          const zIn = wheel.z + Math.cos(theta) * rInner
          const yIn = wheel.y + Math.sin(theta) * rInner
          const zOut = wheel.z + Math.cos(theta) * rOuter
          const yOut = wheel.y + Math.sin(theta) * rOuter
          const widthBase = body.sample(zIn).width
          return [
            [side * widthBase, yOut, zOut],
            [side * (widthBase + 0.026), yIn + 0.004, zIn],
          ]
        }),
        side < 0,
      )
      b.patch(
        'carbon',
        angles.map((theta) => {
          const zIn = wheel.z + Math.cos(theta) * rInner
          const yIn = wheel.y + Math.sin(theta) * rInner
          const widthBase = body.sample(zIn).width
          return [
            [side * (widthBase - 0.055), yIn + 0.004, zIn],
            [side * (widthBase + 0.026), yIn + 0.004, zIn],
          ]
        }),
        side > 0,
      )
    }

    // Faldones laterales MUY bajos pegados al suelo (German/Poligonero look)
    b.box(
      'paint',
      [0.056, 0.078, 0.72],
      [side * 0.476, 0.106, 0.0],
      [0, 0, side * -0.08],
      0.004,
    )
    b.box(
      'carbon',
      [0.062, 0.018, 0.73],
      [side * 0.482, 0.068, 0.0],
      [0, 0, 0],
      0.002,
    )
    b.box(
      'accent',
      [0.010, 0.014, 0.70],
      [side * 0.506, 0.082, 0.0],
      [0, 0, 0],
      0.002,
    )

    // Moldura de puerta negra y tirador
    b.box(
      'carbon',
      [0.012, 0.024, 0.68],
      [side * 0.468, 0.275, 0.0],
      [0, 0, 0],
      0.002,
    )
    if (high) {
      b.box(
        'metal',
        [0.010, 0.012, 0.065],
        [side * 0.470, 0.405, 0.11],
        [0, 0, 0],
        0.002,
      )
    }
  }

  // Parachoques delantero cuadrado con rejillas XXL pegado al suelo
  b.box('paint', [0.89, 0.165, 0.065], [0, 0.172, -1.012], [0, 0, 0], 0.004)
  b.box('carbon', [0.91, 0.024, 0.105], [0, 0.076, -1.028], [0, 0, 0], 0.002)
  b.box('accent', [0.86, 0.012, 0.018], [0, 0.092, -1.068], [0, 0, 0], 0.002)
  // Gran entrada central + rejillas laterales
  b.box('carbon', [0.46, 0.120, 0.032], [0, 0.162, -1.038], [0, 0, 0], 0.002)
  b.box('metal', [0.41, 0.086, 0.024], [0, 0.162, -1.036], [0, 0, 0], 0.002)
  if (high) {
    for (const y of [0.132, 0.162, 0.192]) {
      b.box('carbon', [0.42, 0.007, 0.028], [0, y, -1.044], [0, 0, 0], 0.001)
    }
  }
  for (const side of [-1, 1]) {
    b.box(
      'carbon',
      [0.145, 0.098, 0.030],
      [side * 0.335, 0.162, -1.036],
      [0, 0, 0],
      0.002,
    )
  }
  // Calandra delantera oscura entre faros
  b.box('carbon', [0.39, 0.068, 0.024], [0, 0.312, -1.022], [0, 0, 0], 0.002)
  b.box('accent', [0.37, 0.012, 0.026], [0, 0.312, -1.026], [0, 0, 0], 0.001)

  // Toma de aire discreta en el capó corto (sin tapar calcomanía central en z=-0.68)
  for (const side of [-1, 1]) {
    b.box(
      'carbon',
      [0.09, 0.014, 0.12],
      [side * 0.23, 0.462, -0.58],
      [-0.04, 0, 0],
      0.002,
    )
  }

  // Parachoques trasero limpio ("portón trasero alisado" estilo German look, SIN alerón)
  b.box('paint', [0.89, 0.175, 0.065], [0, 0.172, 1.012], [0, 0, 0], 0.004)
  b.box('carbon', [0.82, 0.062, 0.045], [0, 0.104, 1.032], [0, 0, 0], 0.002)
  b.box('accent', [0.78, 0.014, 0.018], [0, 0.150, 1.044], [0, 0, 0], 0.002)

  // Matrícula movida al parachoques trasero (portón superior completamente alisado!)
  b.box('carbon', [0.22, 0.064, 0.014], [0, 0.212, 1.044], [0, 0, 0], 0.002)
  if (high) {
    b.box('metal', [0.19, 0.046, 0.016], [0, 0.212, 1.046], [0, 0, 0], 0.001)
  }

  // Faros traseros cuadrados en los laterales del portón alisado
  for (const side of [-1, 1]) {
    b.box(
      'carbon',
      [0.205, 0.084, 0.020],
      [side * 0.315, 0.378, 1.016],
      [0, 0, 0],
      0.003,
    )
    b.box(
      'rearLights',
      [0.180, 0.058, 0.022],
      [side * 0.315, 0.378, 1.022],
      [0, 0, 0],
      0.002,
    )
  }

  // UN SOLO tubo de escape gordo visible atrás (estilo escape libre / trompeta)
  b.tube(
    'metal',
    [
      [-0.24, 0.120, 0.98],
      [-0.24, 0.120, 1.095],
    ],
    0.040,
  )
  b.ellipsoid('carbon', [0.030, 0.030, 0.003], [-0.24, 0.120, 1.097])

  // Calcomanías del número en el capó corto y puertas
  const plaqueZ = -0.68
  const plaquePosition = topPoint(0, plaqueZ, 0.005)
  const slope =
    (topPoint(0, plaqueZ + 0.01)[1] - topPoint(0, plaqueZ - 0.01)[1]) / 0.02
  const normalLength = Math.hypot(1, slope)

  const leftDoor = body.sidePoint(-1, -0.02, 0.34)
  const rightDoor = body.sidePoint(1, -0.02, 0.34)

  return b.finish({
    wheels,
    decals: [
      {
        position: plaquePosition,
        normal: [0, 1 / normalLength, -slope / normalLength],
        width: 0.18,
        height: 0.18,
      },
      {
        position: leftDoor,
        normal: [-1, 0, 0],
        width: 0.16,
        height: 0.13,
      },
      {
        position: rightDoor,
        normal: [1, 0, 0],
        width: 0.16,
        height: 0.13,
      },
    ],
    anchors: {
      cockpit: [0, 0.58, 0.12],
      frontAxle: [0, 0.190, -0.60],
      rearAxle: [0, 0.190, 0.60],
      roof: [0, 0.768, 0.24],
    },
  })
}
