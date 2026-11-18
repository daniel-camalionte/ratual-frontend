import { useId } from 'react'

/** Barra de lados retos com pontas chanfradas: centro x, topo, base, largura e altura da ponta. */
function bar(cx: number, top: number, bottom: number, w: number, tip = 6): string {
  const l = cx - w / 2
  const r = cx + w / 2
  return `M${cx} ${top} L${r} ${top + tip} L${r} ${bottom - tip} L${cx} ${bottom} L${l} ${bottom - tip} L${l} ${top + tip} Z`
}

const BARS = [bar(20.2, 14, 52, 5.4, 4), bar(27.8, 4, 61, 6.6, 5), bar(35.8, 5, 56, 6.6, 5), bar(43.2, 14, 44, 4.6, 4)]
const RING = { cx: 32, cy: 37, rx: 26.5, ry: 4.4, transform: 'rotate(-39 32 37)' }

interface LogoMarkProps {
  size?: number
  /** cor chapada (sem degradê). Padrão: ciano da marca; use '#fff' sobre fundo azul. */
  color?: string
}

/**
 * Ícone da marca "Refrigeração Atual" (recriado em SVG a partir do logotipo): barras verticais
 * cruzadas por um anel elíptico inclinado. Cor chapada e vetorial: nítido em qualquer tamanho.
 * O texto da marca fica fora (ver Brand).
 */
export function LogoMark({ size = 36, color = '#25C2F5' }: LogoMarkProps) {
  const cut = `${useId()}-m`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Refrigeração Atual" className="rt-logo-mark">
      <defs>
        {/* recorta as barras em volta do anel, deixando o respiro entre eles */}
        <mask id={cut} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <ellipse {...RING} fill="none" stroke="#000" strokeWidth="5.8" />
        </mask>
      </defs>
      <g transform="rotate(5 32 32)" fill={color} stroke={color} strokeWidth="0.35" strokeLinejoin="round" mask={`url(#${cut})`}>
        {BARS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <ellipse {...RING} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
}
