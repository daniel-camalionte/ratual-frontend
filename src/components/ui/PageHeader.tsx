import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  title: string
  crumbs?: Crumb[]
  actions?: ReactNode
}

export function PageHeader({ title, crumbs = [], actions }: PageHeaderProps) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 className="fw-medium mb-0">{title}</h4>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link className="text-muted text-decoration-none" to="/">
                Início
              </Link>
            </li>
            {crumbs.map((c, i) => (
              <li key={c.label} className="breadcrumb-item text-muted" aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                {c.to ? (
                  <Link className="text-muted text-decoration-none" to={c.to}>
                    {c.label}
                  </Link>
                ) : (
                  c.label
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      {actions && <div className="d-flex gap-2">{actions}</div>}
    </div>
  )
}
