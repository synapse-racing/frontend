import { createBuilder } from './modeling.mjs'

// Coupé Noventero (estilo Opel Calibra / Kadett GSI)
// El más bajo, más largo y afilado en forma de cuña (fastback con luneta muy inclinada + alerón bajo/medio)
// z, width, centerHeight, shoulderHeight, bottomHeight
const BODY = [
  [-1.18, 0.432, 0.240, 0.228, 0.098],
  [-1.10, 0.454, 0.305, 0.292, 0.090],
  [-0.98, 0.468, 0.360, 0.348, 0.084],
  [-0.80, 0.478, 0.398, 0.388, 0.082],
  [-0.70, 0.486, 0.422, 0.448, 0.084],
  [-0.34, 0.478, 0.436, 0.430, 0.080],
  [0.02, 0.478, 0.440, 0.434, 0.080],
  [0.42, 0.486, 0.442, 0.436, 0.082],
  [0.72, 0.492, 0.444, 0.448, 0.086],
  [0.98, 0.474, 0.426, 0.418, 0.092],
  [1.18, 0.448, 0.402, 0.392, 0.102],
]

// Cabina fastback muy baja y tendida hasta casi el borde trasero
// z, roofCenter, roofHalfWidth, beltHalfWidth, beltHeight
const CABIN = [
  [-0.36, 0.434, 0.402, 0.430, 0.426],
  [-0.12, 0.576, 0.358, 0.430, 0.428],
  [0.06, 0.595, 0.346, 0.432, 0.432],
  [0.24, 0.592, 0.348, 0.434, 0.434],
  [0.64, 0.496, 0.382, 0.438, 0.436],
  [0.96, 0.424, 0.412, 0.436, 0.422],
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

export function buildPrototype(detail = 'high') {
  const b = createBuilder(detail)
  const high = detail === 'high'
  const archClearance = 0.032
  const archLip = 0.024

  // Llantas anchas con perfil bajo
  const wheels = [-1, 1].flatMap((side) => [
    {
      x: side * 0.445,
      y: 0.200,
      z: -0.70,
      radius: 0.200,
      width: 0.175,
      front: true,
      style: 'split',
    },
    {
      x: side * 0.445,
      y: 0.200,
      z: 0.72,
      radius: 0.200,
      width: 0.175,
      front: false,
      style: 'split',
    },
  ])

  const body = b.body(BODY, wheels, {
    archClearance,
    archLip,
    segments: high ? 66 : 26,
    frontSweep: 0.025,
    rearSweep: 0.015,
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

  // Cabina coupé fastback baja y muy tendida
  const cabinRows = range(-0.36, 0.96, high ? 28 : 14)
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

  // Luneta trasera muy inclinada bajando suavemente hacia la cola (fastback)
  for (const [start, end, width] of [
    [-0.325, -0.13, 0.86],
    [0.28, 0.89, 0.84],
  ]) {
    b.patch(
      'glass',
      range(start, end, high ? 12 : 6).map((z) =>
        range(-width, width, high ? 8 : 4).map((u) => roofPoint(z, u, 0.0025)),
      ),
    )
  }
  for (const side of [-1, 1]) {
    for (const [start, end] of [
      [-0.28, 0.16],
      [0.21, 0.72],
    ]) {
      b.patch(
        'glass',
        range(start, end, high ? 10 : 5).map((z) =>
          range(0.14, 0.88, 2).map((t) => cabinSide(side, z, t, 0.0025)),
        ),
        side > 0,
      )
    }
    b.patch(
      'carbon',
      range(0.16, 0.21, 1).map((z) =>
        [0.12, 0.90].map((t) => cabinSide(side, z, t, 0.003)),
      ),
      side > 0,
    )
    b.tube(
      'carbon',
      range(-0.29, 0.74, high ? 8 : 4).map((z) =>
        cabinSide(side, z, 0.08, 0.003),
      ),
      0.004,
    )

    // Espejos estrechos aerodinámicos
    const mirrorBase = cabinSide(side, -0.26, 0.22, 0.002)
    b.mirror(
      side,
      mirrorBase,
      [side * 0.558, 0.470, -0.27],
      [0.12, 0.044, 0.078],
    )

    // Faros rectangulares MUY estrechos y rasgados sobre el morro plano y afilado
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
        [-1.162, 0.20, 0.422],
        [-1.088, 0.20, 0.422],
      ],
      0.003,
    )
    lampSurface(
      'glass',
      [
        [-1.155, 0.212, 0.412],
        [-1.095, 0.212, 0.412],
      ],
      0.0045,
    )
    lampSurface(
      'lights',
      [
        [-1.148, 0.225, 0.315],
        [-1.102, 0.225, 0.315],
      ],
      0.006,
    )
    lampSurface(
      'lights',
      [
        [-1.148, 0.332, 0.400],
        [-1.102, 0.332, 0.400],
      ],
      0.006,
    )

    // Pasos de rueda angulosos en línea con el perfil bajo
    const wheelList = wheels.filter((w) => Math.sign(w.x) === side)
    for (const wheel of wheelList) {
      const rInner = wheel.radius + archClearance
      const rOuter = rInner + 0.040
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
            [side * (widthBase - 0.058), yIn + 0.004, zIn],
            [side * (widthBase + 0.026), yIn + 0.004, zIn],
          ]
        }),
        side > 0,
      )
    }

    // Faldones laterales angulosos en cuña
    b.box(
      'paint',
      [0.058, 0.064, 0.88],
      [side * 0.490, 0.100, 0.01],
      [0, 0, side * -0.10],
      0.004,
    )
    b.box(
      'carbon',
      [0.064, 0.016, 0.90],
      [side * 0.496, 0.068, 0.01],
      [0, 0, 0],
      0.002,
    )
    b.box(
      'accent',
      [0.010, 0.014, 0.86],
      [side * 0.518, 0.082, 0.01],
      [0, 0, 0],
      0.002,
    )
    b.box(
      'carbon',
      [0.028, 0.088, 0.11],
      [side * 0.486, 0.168, 0.39],
      [0, 0, 0],
      0.002,
    )

    if (high) {
      b.box(
        'metal',
        [0.010, 0.011, 0.068],
        [side * 0.480, 0.378, 0.16],
        [0, 0, 0],
        0.002,
      )
    }
  }

  // Morro plano y alargado con labio "quitanieves" rasante al suelo
  b.box('paint', [0.90, 0.100, 0.075], [0, 0.130, -1.158], [0, 0, 0], 0.004)
  b.panel(
    'carbon',
    [
      [-0.41, 0.068, -1.195],
      [-0.505, 0.068, -1.11],
      [-0.495, 0.068, -1.01],
      [0.495, 0.068, -1.01],
      [0.505, 0.068, -1.11],
      [0.41, 0.068, -1.195],
    ],
    0.018,
  )
  b.box('paint', [0.89, 0.024, 0.056], [0, 0.090, -1.170], [0, 0, 0], 0.003)
  b.box('accent', [0.81, 0.010, 0.016], [0, 0.078, -1.188], [0, 0, 0], 0.002)

  // Intercooler ancho y calandra horizontal estilizada noventera
  b.box('carbon', [0.50, 0.076, 0.030], [0, 0.136, -1.178], [0, 0, 0], 0.002)
  b.box('metal', [0.44, 0.054, 0.024], [0, 0.136, -1.175], [0, 0, 0], 0.002)
  b.box('carbon', [0.38, 0.036, 0.020], [0, 0.228, -1.172], [0, 0, 0], 0.002)

  // Tomas de aire marcadas en el capó largo en cuña (sin pisar dorsal x=[-0.04..0.04], z=[-0.85..-0.76])
  for (const side of [-1, 1]) {
    b.box(
      'paint',
      [0.13, 0.018, 0.21],
      [side * 0.22, 0.415, -0.64],
      [-0.08, 0, 0],
      0.003,
    )
    b.box(
      'carbon',
      [0.10, 0.014, 0.17],
      [side * 0.22, 0.422, -0.64],
      [-0.08, 0, 0],
      0.002,
    )
  }

  // Cola afilada fastback + doble salida de escape
  b.box('paint', [0.90, 0.125, 0.060], [0, 0.146, 1.158], [0, 0, 0], 0.004)
  b.box('carbon', [0.82, 0.056, 0.045], [0, 0.098, 1.172], [0, 0, 0], 0.002)
  b.box('accent', [0.78, 0.012, 0.016], [0, 0.132, 1.182], [0, 0, 0], 0.002)
  b.box('carbon', [0.85, 0.058, 0.018], [0, 0.345, 1.164], [0, 0, 0], 0.002)
  for (const side of [-1, 1]) {
    b.box(
      'rearLights',
      [0.24, 0.036, 0.020],
      [side * 0.29, 0.345, 1.170],
      [0, 0, 0],
      0.002,
    )
  }
  b.box('carbon', [0.21, 0.056, 0.014], [0, 0.240, 1.168], [0, 0, 0], 0.002)

  // Doble salida de escape (izquierda y derecha)
  for (const side of [-1, 1]) {
    b.tube(
      'metal',
      [
        [side * 0.275, 0.112, 1.12],
        [side * 0.275, 0.112, 1.194],
      ],
      0.028,
    )
    b.ellipsoid(
      'carbon',
      [0.021, 0.021, 0.003],
      [side * 0.275, 0.112, 1.196],
    )
  }

  // Alerón BAJO/MEDIO pegado a la carrocería (claramente distinto al GT alto del E46)
  for (const side of [-1, 1]) {
    b.panel(
      'paint',
      [
        [side * 0.33, 0.402, 0.96],
        [side * 0.33, 0.495, 1.04],
        [side * 0.33, 0.495, 1.14],
        [side * 0.33, 0.398, 1.11],
      ],
      0.022,
    )
    b.panel(
      'paint',
      [
        [side * 0.475, 0.468, 1.00],
        [side * 0.475, 0.535, 1.02],
        [side * 0.475, 0.532, 1.182],
        [side * 0.475, 0.468, 1.175],
      ],
      0.012,
    )
  }
  b.box('paint', [0.95, 0.022, 0.155], [0, 0.500, 1.095], [-0.08, 0, 0], 0.004)
  b.box('carbon', [0.93, 0.012, 0.040], [0, 0.514, 1.148], [-0.08, 0, 0], 0.002)

  // Calcomanías del número en el capó (z=-0.805) y en las puertas
  const hoodZ = -0.805
  const hoodPos = topPoint(0, hoodZ, 0.005)
  const hoodSlope =
    (topPoint(0, hoodZ + 0.01)[1] - topPoint(0, hoodZ - 0.01)[1]) / 0.02
  const hoodNormalLen = Math.hypot(1, hoodSlope)

  const leftDoor = body.sidePoint(-1, 0.05, 0.31)
  const rightDoor = body.sidePoint(1, 0.05, 0.31)

  return b.finish({
    wheels,
    decals: [
      {
        position: hoodPos,
        normal: [0, 1 / hoodNormalLen, -hoodSlope / hoodNormalLen],
        width: 0.16,
        height: 0.18,
      },
      {
        position: leftDoor,
        normal: [-1, 0, 0],
        width: 0.15,
        height: 0.13,
      },
      {
        position: rightDoor,
        normal: [1, 0, 0],
        width: 0.15,
        height: 0.13,
      },
    ],
    anchors: {
      cockpit: [0, 0.50, 0.12],
      headlights: [
        [-0.32, 0.27, -1.12],
        [0.32, 0.27, -1.12],
      ],
      taillights: [
        [-0.29, 0.345, 1.170],
        [0.29, 0.345, 1.170],
      ],
    },
  })
}
