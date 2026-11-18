import { useId } from 'react'

interface SparklineProps {
  data: number[]
  /** cor CSS (ex.: 'var(--bs-success)') */
  color?: string
  height?: number
  /** linha tracejada, para "sem dados" */
  muted?: boolean
  label?: string
}

/** Mini gráfico SVG (sem biblioteca): linha suave + degradê. Preenche a largura do container. */
export function Sparkline({ data, color = 'var(--bs-primary)', height = 32, muted = false, label }: SparklineProps) {
  const gid = useId()
  if (data.length < 2) return null
  const W = 100
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 3
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, pad + (1 - (v - min) / span) * (height - pad * 2)] as const)

  // curva suave (Catmull-Rom -> Bezier)
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  const area = `${d} L ${W} ${height} L 0 ${height} Z`

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" width="100%" height={height} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="d-block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={muted ? 0.08 : 0.32} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray={muted ? '3 3' : undefined} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
