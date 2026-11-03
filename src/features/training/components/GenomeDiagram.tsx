import { useState } from 'react'
import type { Genome } from '../neat/genes.ts'

const inputLabels = ['Rayo 1', 'Rayo 2', 'Rayo 3', 'Rayo 4', 'Rayo 5', 'Velocidad']

export function GenomeDiagram({ genome }: { genome: Genome }) {
  const [expanded, setExpanded] = useState(false)
  const layers = [...new Set(genome.nodes.map((node) => node.layer))].sort((a, b) => a - b)
  const height = Math.max(200, ...layers.map((layer) => genome.nodes.filter((node) => node.layer === layer).length * 27 + 24))
  const positions = new Map(genome.nodes.map((node) => {
    const siblings = genome.nodes.filter((other) => other.layer === node.layer).sort((a, b) => a.id - b.id)
    return [node.id, { x: 65 + layers.indexOf(node.layer) / Math.max(1, layers.length - 1) * 200, y: (siblings.indexOf(node) + 1) / (siblings.length + 1) * height }]
  }))
  const inputs = genome.nodes.filter((node) => node.type === 'input').sort((a, b) => a.id - b.id)
  const outputs = genome.nodes.filter((node) => node.type === 'output').sort((a, b) => a.id - b.id)
  const enabled = genome.connections.filter((connection) => connection.enabled)
  return (
    <div className="genome-diagram">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Ocultar red neuronal' : 'Ver red neuronal'}</button>
      {expanded && <>
        <p>{genome.nodes.length} neuronas · {enabled.length} conexiones activas</p>
        <div className="genome-diagram__canvas">
          <svg viewBox={`0 0 340 ${height}`} role="img" aria-label="Estructura de la red neuronal del auto seleccionado">
            <title>Entradas de sensores, neuronas intermedias y salidas de dirección y aceleración</title>
            {enabled.map((connection) => {
              const source = positions.get(connection.source)
              const target = positions.get(connection.target)
              return source && target ? <line key={connection.innovation} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={connection.weight >= 0 ? '#77dfbb' : '#ff918a'} strokeOpacity={0.45} strokeWidth={Math.min(3, 0.5 + Math.abs(connection.weight))}><title>Peso: {connection.weight.toFixed(3)}</title></line> : null
            })}
            {genome.nodes.map((node) => {
              const position = positions.get(node.id)!
              const label = node.type === 'input' ? inputLabels[inputs.indexOf(node)] ?? `Entrada ${node.id}` : node.type === 'bias' ? 'Sesgo' : node.type === 'output' ? ['Dirección', 'Aceleración'][outputs.indexOf(node)] : `N${node.id}`
              return <g key={node.id}><circle cx={position.x} cy={position.y} r={6} fill={node.type === 'output' ? '#f1c66a' : node.type === 'hidden' ? '#b6a1ff' : '#77dfbb'}><title>{label} · neurona {node.id}</title></circle>{node.type !== 'hidden' && <text x={position.x + (node.type === 'output' ? 10 : -10)} y={position.y + 3} textAnchor={node.type === 'output' ? 'start' : 'end'} fill="#dce6df" fontSize={9}>{label}</text>}</g>
            })}
          </svg>
        </div>
        <p className="genome-diagram__legend"><span>Verde: peso positivo</span><span>Rojo: peso negativo</span></p>
        <p>Estructura del genoma actual. El grosor indica la fuerza del peso. Las conexiones desactivadas se omiten. No representa activaciones en tiempo real.</p>
      </>}
    </div>
  )
}
