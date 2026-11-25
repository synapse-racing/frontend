import { createBuilder } from './modeling.mjs'

// BMW Serie 3 (E46 M-Spec) — Sedán/Coupé ancho de 3 volúmenes marcados + Widebody M3 GTR
// z, width, centerHeight, shoulderHeight, bottomHeight
const BODY = [
  [-1.16, 0.475, 0.345, 0.332, 0.112],
  [-1.11, 0.495, 0.398, 0.386, 0.102],
  [-1.02, 0.505, 0.440, 0.428, 0.094],
  [-0.84, 0.514, 0.456, 0.445, 0.090],
  [-0.70, 0.522, 0.464, 0.466, 0.090],
  [-0.32, 0.512, 0.472, 0.460, 0.088],
  [0.05, 0.510, 0.474, 0.462, 0.088],
  [0.42, 0.516, 0.476, 0.464, 0.088],
  [0.70, 0.524, 0.470, 0.466, 0.092],
  [0.86, 0.510, 0.456, 0.446, 0.096],
  [1.04, 0.496, 0.452, 0.442, 0.102],
  [1.16, 0.478, 0.442, 0.432, 0.110],
]

// Cabina centrada clásica de 3 volúmenes (deja un capó largo delante y un maletero horizontal definido detrás)
// z, roofCenter, roofHalfWidth, beltHalfWidth, beltHeight
const CABIN = [
  [-0.31, 0.470, 0.428, 0.462, 0.458],
  [-0.14, 0.668, 0.382, 0.460, 0.460],
  [-0.04, 0.692, 0.376, 0.460, 0.462],
  [0.34, 0.695, 0.376, 0.462, 0.464],
  [0.46, 0.665, 0.384, 0.462, 0.464],
  [0.68, 0.468, 0.424, 0.456, 0.458],
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

export function buildFormula(detail = 'high') {
  const b = createBuilder(detail)
  const high = detail === 'high'
  const archClearance = 0.032
  const archLip = 0.025

  // Ejes anchos con llantas multi-radio partidas estilo BBS / M3 GTR
  const wheels = [-1, 1].flatMap((side) => [
    {
      x: side * 0.465,
      y: 0.205,
      z: -0.70,
      radius: 0.205,
      width: 0.185,
      front: true,
      style: 'split',
    },
    {
      x: side * 0.465,
      y: 0.205,
      z: 0.70,
      radius: 0.205,
      width: 0.185,
      front: false,
      style: 'split',
    },
  ])

  const body = b.body(BODY, wheels, {
    archClearance,
    archLip,
    segments: high ? 66 : 26,
    frontSweep: 0.018,
    rearSweep: 0.014,
  })

  const topPoint = (x, z, lift = 0) => {
    const point = body.topPoint(x, z)
    point[1] += lift
    return point
  }
  const roofPoint = (z, ratio, lift = 0) => {
    const [, center, width] = cabinSection(z)
    return [ratio * width, center - 0.014 * Math.abs(ratio) ** 4 + lift, z]
  }
  const cabinSide = (side, z, height, lift = 0) => {
    const [, top, topWidth, bottomWidth, bottom] = cabinSection(z)
    return [
      side * (bottomWidth + (topWidth - bottomWidth) * height + lift),
      bottom + (top - 0.014 - bottom) * height,
      z,
    ]
  }

  // Cabina sedán/coupé centrada de 3 volúmenes
  const cabinRows = range(-0.31, 0.68, high ? 28 : 14)
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

  // Parabrisas delantero, luneta trasera hacia el maletero y ventanas laterales Hofmeister-kink
  for (const [start, end, width] of [
    [-0.28, -0.145, 0.87],
    [0.44, 0.645, 0.86],
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
      [-0.23, 0.16],
      [0.21, 0.54],
    ]) {
      b.patch(
        'glass',
        range(start, end, high ? 10 : 5).map((z) =>
          range(0.14, 0.88, 2).map((t) => cabinSide(side, z, t, 0.0025)),
        ),
        side > 0,
      )
    }
    // Pilar B negro y moldura Shadowline
    b.patch(
      'carbon',
      range(0.16, 0.21, 1).map((z) =>
        [0.12, 0.90].map((t) => cabinSide(side, z, t, 0.003)),
      ),
      side > 0,
    )
    b.tube(
      'carbon',
      range(-0.24, 0.56, high ? 8 : 4).map((z) =>
        cabinSide(side, z, 0.08, 0.003),
      ),
      0.004,
    )

    // Espejos retrovisores M3 pegados al marco delantero de la puerta
    const mirrorBase = cabinSide(side, -0.23, 0.22, 0.002)
    b.mirror(
      side,
      mirrorBase,
      [side * 0.585, 0.52, -0.24],
      [0.12, 0.050, 0.078],
    )

    // Faros delanteros agresivos E46 con cejas inclinadas (bad-boy look)
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
        [-1.142, 0.205, 0.455],
        [-1.045, 0.225, 0.440],
      ],
      0.003,
    )
    lampSurface(
      'glass',
      [
        [-1.132, 0.218, 0.442],
        [-1.056, 0.236, 0.428],
      ],
      0.0045,
    )
    // Doble proyector tipo Angel Eyes dentro de cada óptica
    lampSurface(
      'lights',
      [
        [-1.120, 0.232, 0.315],
        [-1.068, 0.245, 0.315],
      ],
      0.006,
    )
    lampSurface(
      'lights',
      [
        [-1.120, 0.345, 0.428],
        [-1.068, 0.345, 0.415],
      ],
      0.006,
    )
    // Ceja agresiva (pestaña) en el borde superior del faro hacia el doble riñón
    b.box(
      'paint',
      [0.24, 0.018, 0.032],
      [side * 0.33, 0.422, -1.035],
      [0.12, side * 0.14, side * -0.10],
      0.003,
    )

    // Pasos de rueda MUY ensanchados (widebody M3 GTR) fuera de la envolvente del neumático
    const wheelList = wheels.filter((w) => Math.sign(w.x) === side)
    for (const wheel of wheelList) {
      const rInner = wheel.radius + archClearance
      const rOuter = rInner + 0.052
      const angles = range(0.04, Math.PI - 0.04, high ? 18 : 8)
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
            [side * (widthBase + 0.045), yIn + 0.004, zIn],
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
            [side * (widthBase + 0.045), yIn + 0.004, zIn],
          ]
        }),
        side > 0,
      )
    }

    // Branquias laterales características del M3 en la aleta delantera
    b.box(
      'carbon',
      [0.016, 0.046, 0.125],
      [side * 0.514, 0.355, -0.43],
      [0, 0, 0],
      0.002,
    )
    if (high) {
      b.box(
        'metal',
        [0.018, 0.010, 0.11],
        [side * 0.516, 0.355, -0.43],
        [0, 0, 0],
        0.001,
      )
    }

    // Faldones laterales widebody enlazando los pasos de rueda ensanchados
    b.box(
      'paint',
      [0.072, 0.072, 0.85],
      [side * 0.525, 0.106, 0.0],
      [0, 0, side * -0.08],
      0.004,
    )
    b.box(
      'carbon',
      [0.078, 0.016, 0.87],
      [side * 0.530, 0.070, 0.0],
      [0, 0, 0],
      0.002,
    )
    b.box(
      'accent',
      [0.010, 0.014, 0.84],
      [side * 0.562, 0.086, 0.0],
      [0, 0, 0],
      0.002,
    )

    if (high) {
      b.box(
        'metal',
        [0.010, 0.012, 0.07],
        [side * 0.515, 0.405, 0.16],
        [0, 0, 0],
        0.002,
      )
    }
  }

  // Parrilla frontal característica de DOBLE RIÑÓN BMW
  for (const side of [-1, 1]) {
    b.box(
      'metal',
      [0.132, 0.098, 0.024],
      [side * 0.088, 0.308, -1.162],
      [0, 0, 0],
      0.004,
    )
    b.box(
      'carbon',
      [0.112, 0.080, 0.028],
      [side * 0.088, 0.308, -1.164],
      [0, 0, 0],
      0.003,
    )
    if (high) {
      for (const offset of [-0.032, 0, 0.032]) {
        b.box(
          'metal',
          [0.005, 0.072, 0.030],
          [side * 0.088 + offset, 0.308, -1.166],
          [0, 0, 0],
          0.001,
        )
      }
    }
  }

  // Parachoques delantero estilo M3 GTR con gran boca central y splitter
  b.box('paint', [0.98, 0.145, 0.070], [0, 0.155, -1.140], [0, 0, 0], 0.004)
  b.box('carbon', [1.02, 0.022, 0.10], [0, 0.076, -1.142], [0, 0, 0], 0.002)
  b.box('accent', [0.94, 0.012, 0.016], [0, 0.088, -1.182], [0, 0, 0], 0.002)
  b.box('carbon', [0.54, 0.102, 0.032], [0, 0.148, -1.168], [0, 0, 0], 0.002)
  b.box('metal', [0.48, 0.072, 0.024], [0, 0.148, -1.165], [0, 0, 0], 0.002)
  for (const side of [-1, 1]) {
    b.box(
      'carbon',
      [0.16, 0.088, 0.030],
      [side * 0.38, 0.150, -1.164],
      [0, 0, 0],
      0.002,
    )
  }

  // Capó largo con "Power Dome" central y tomas de aire M3 GTR
  b.box('paint', [0.24, 0.022, 0.56], [0, 0.468, -0.66], [0.02, 0, 0], 0.005)
  for (const side of [-1, 1]) {
    b.box(
      'carbon',
      [0.11, 0.016, 0.19],
      [side * 0.24, 0.468, -0.72],
      [-0.04, 0, 0],
      0.002,
    )
    if (high) {
      for (const z of [-0.78, -0.74, -0.70, -0.66]) {
        b.box(
          'metal',
          [0.095, 0.005, 0.010],
          [side * 0.24, 0.476, z],
          [0, 0, 0],
          0.001,
        )
      }
    }
  }

  // Parachoques trasero musculoso, difusor y CUÁDRUPLE salida de escape
  b.box('paint', [0.98, 0.155, 0.065], [0, 0.168, 1.142], [0, 0, 0], 0.004)
  b.box('carbon', [0.88, 0.064, 0.048], [0, 0.106, 1.160], [0, 0, 0], 0.002)
  b.box('accent', [0.82, 0.014, 0.018], [0, 0.148, 1.170], [0, 0, 0], 0.002)
  // Pilotos traseros anchos estilo E46
  for (const side of [-1, 1]) {
    b.box(
      'carbon',
      [0.24, 0.072, 0.020],
      [side * 0.34, 0.382, 1.154],
      [0, 0, 0],
      0.003,
    )
    b.box(
      'rearLights',
      [0.215, 0.048, 0.022],
      [side * 0.34, 0.382, 1.160],
      [0, 0, 0],
      0.002,
    )
  }
  b.box('carbon', [0.22, 0.062, 0.014], [0, 0.295, 1.154], [0, 0, 0], 0.002)

  // Cuádruple salida de escape trasera (2 pares simétricos)
  for (const side of [-1, 1]) {
    for (const offset of [0.24, 0.315]) {
      b.tube(
        'metal',
        [
          [side * offset, 0.118, 1.11],
          [side * offset, 0.118, 1.192],
        ],
        0.024,
      )
      b.ellipsoid(
        'carbon',
        [0.017, 0.017, 0.003],
        [side * offset, 0.118, 1.194],
      )
    }
  }

  // Alerón GT ALTO y agresivo montado sobre el maletero horizontal
  for (const side of [-1, 1]) {
    b.panel(
      'carbon',
      [
        [side * 0.27, 0.448, 0.87],
        [side * 0.27, 0.725, 0.99],
        [side * 0.27, 0.725, 1.07],
        [side * 0.27, 0.442, 1.01],
      ],
      0.022,
    )
    b.panel(
      'paint',
      [
        [side * 0.545, 0.655, 0.94],
        [side * 0.545, 0.775, 0.96],
        [side * 0.545, 0.770, 1.185],
        [side * 0.545, 0.655, 1.175],
      ],
      0.014,
    )
    b.panel(
      'accent',
      [
        [side * 0.553, 0.742, 0.955],
        [side * 0.553, 0.770, 0.962],
        [side * 0.553, 0.766, 1.180],
        [side * 0.553, 0.742, 1.178],
      ],
      0.006,
    )
  }
  // Plano superior del alerón GT (muy por encima del maletero)
  b.box('carbon', [1.09, 0.026, 0.22], [0, 0.728, 1.06], [-0.10, 0, 0], 0.004)
  b.box('accent', [1.07, 0.012, 0.04], [0, 0.744, 1.14], [-0.10, 0, 0], 0.002)

  // Calcomanías del número en el capó (sobre el power dome) y en las puertas
  const hoodZ = -0.78
  const hoodPosition = [0, 0.481, hoodZ]
  const leftDoor = body.sidePoint(-1, 0.05, 0.34)
  const rightDoor = body.sidePoint(1, 0.05, 0.34)

  return b.finish({
    wheels,
    decals: [
      {
        position: hoodPosition,
        normal: [0, 1, -0.02],
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
      cockpit: [0, 0.54, 0.12],
      frontAxle: [0, 0.205, -0.70],
      rearAxle: [0, 0.205, 0.70],
      roof: [0, 0.695, 0.15],
    },
  })
}
