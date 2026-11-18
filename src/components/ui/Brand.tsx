import { LogoMark } from './LogoMark'

interface BrandProps {
  markSize?: number
  /** versão para fundo azul: ícone e texto brancos, chapados */
  light?: boolean
}

/** Marca completa: ícone + "Refrigeração Atual" (texto real, acessível). */
export function Brand({ markSize = 34, light = false }: BrandProps) {
  return (
    <span className={`rt-brand-lockup ${light ? 'is-light' : ''}`}>
      <LogoMark size={markSize} color={light ? '#fff' : undefined} />
      <span className="rt-brand-name">
        <span className="rt-brand-1">Refrigeração</span> <span className="rt-brand-2">Atual</span>
      </span>
    </span>
  )
}
