import type { CSSProperties } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useCountUp } from '@/lib/useCountUp'

interface KpiCardProps {
  label: string
  value: number
  sub: string
  icon: string
  tone: 'primary' | 'success' | 'warning' | 'danger'
  /** ordem para a animação de entrada escalonada */
  index?: number
}

/** KPI discreto (padrão MaterialPro): círculo sólido com ícone branco, valor animado e rótulo. */
export function KpiCard({ label, value, sub, icon, tone, index = 0 }: KpiCardProps) {
  const shown = useCountUp(value)
  return (
    <div className="card rt-kpi rt-rise h-100 mb-0" style={{ '--rt-tone': `var(--bs-${tone})`, '--i': index } as CSSProperties}>
      <div className="card-body">
        <span className="rt-kpi-icon" aria-hidden="true">
          <Icon name={icon} />
        </span>
        <div className="min-w-0">
          <div className="rt-kpi-value" aria-label={`${label}: ${value}`}>
            {shown}
          </div>
          <div className="rt-kpi-label">{label}</div>
          <div className="rt-kpi-sub">{sub}</div>
        </div>
      </div>
    </div>
  )
}
