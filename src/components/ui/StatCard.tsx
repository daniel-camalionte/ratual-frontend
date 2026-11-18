import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { ProgressBar } from './ProgressBar'

interface StatCardProps {
  label: string
  value: ReactNode
  icon?: string
  tone?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  progress?: number
  hint?: string
}

/** Card de métrica: ícone à esquerda, valor/rótulo à direita; nada é cortado em telas estreitas. */
export function StatCard({ label, value, icon, tone = 'primary', progress, hint }: StatCardProps) {
  return (
    <div className="card h-100 mb-0">
      <div className="card-body d-flex align-items-center gap-3">
        {icon && (
          <span className={`rt-stat-icon bg-${tone}-subtle text-${tone}`}>
            <Icon name={icon} />
          </span>
        )}
        <div className="flex-grow-1 min-w-0">
          <div className="rt-stat-value">{value}</div>
          <p className="card-subtitle mb-0 text-truncate">{label}</p>
          {progress !== undefined && (
            <div className="mt-2">
              <ProgressBar value={progress} tone={tone} label={label} />
            </div>
          )}
          {hint && <small className="text-muted d-block mt-1">{hint}</small>}
        </div>
      </div>
    </div>
  )
}
