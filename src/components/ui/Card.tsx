import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  children?: ReactNode
}

export function Card({ title, subtitle, actions, footer, className = '', bodyClassName = '', children }: CardProps) {
  return (
    <div className={`card ${className}`.trim()}>
      <div className={`card-body ${bodyClassName}`.trim()}>
        {(title || actions) && (
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 gap-sm-3 mb-3">
            <div className="min-w-0 flex-grow-1">
              {title && <h5 className="card-title mb-0">{title}</h5>}
              {subtitle && <p className="card-subtitle mt-1 mb-0">{subtitle}</p>}
            </div>
            {actions && <div className="d-flex gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}
