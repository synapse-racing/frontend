import type { VehicleAppearance } from '../domain/appearance.ts'

export function CarSilhouette({
  modelId,
  color = 'currentColor',
}: {
  modelId: VehicleAppearance['modelId']
  color?: string
}) {
  return (
    <svg viewBox="0 0 160 68" aria-hidden="true" className="car-silhouette">
      <path d="M8 53h144" stroke="currentColor" opacity=".18" />
      <circle
        cx="37"
        cy="46"
        r="11"
        fill="#131a1c"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="127"
        cy="46"
        r="11"
        fill="#131a1c"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        fill={color}
        d={
          modelId === 'formula'
            ? // BMW E46 3-box widebody sedan: long hood, upright centered cabin, horizontal trunk
              'M10 35l39-2 15-16h33l14 14 35 1 4 14h-12l-7-12h-13l-7 12H51l-7-12H31l-7 12H10z'
            : modelId === 'gt'
              ? // Saxo VTS compact 2-box hatchback: shortest body, square tall roof, vertical hatch, NO wing
                'M20 33l28-3 14-18h54l16 18 4 16h-10l-7-12h-12l-7 12H52l-7-12H33l-7 12H18z'
              : // Calibra Turbo low wedge fastback coupe: lowest nose, sweeping rear glass to tail
                'M8 38l46-6 18-13h24l36 13 18 3 2 11h-12l-7-12h-13l-7 12H51l-7-12H31l-7 12H9z'
        }
      />
      <path
        d={
          modelId === 'formula'
            ? 'M66 19h29l11 11H54z'
            : modelId === 'gt'
              ? 'M64 14h48l12 15H53z'
              : 'M72 21h23l28 11H58z'
        }
        fill="#152b34"
      />
      {modelId === 'formula' && (
        <path
          d="M127 16h24v4h-24zM136 20v12M143 20v12"
          stroke={color}
          fill={color}
        />
      )}
      {modelId === 'prototype' && (
        <path
          d="M133 27h20v3.5h-20zM143 30.5v5"
          stroke={color}
          fill={color}
        />
      )}
      <path d="M57 43h48" stroke="#fff" strokeWidth="2" opacity=".7" />
    </svg>
  )
}
