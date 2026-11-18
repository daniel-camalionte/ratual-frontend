import type { ReactNode } from 'react'
import { Icon } from './Icon'

type Tone = 'primary' | 'success' | 'danger' | 'warning' | 'info'
const ICONS: Record<Tone, string> = {
  primary: 'info-circle',
  info: 'info-circle',
  success: 'circle-check',
  warning: 'alert-triangle',
  danger: 'alert-circle',
}

interface AlertProps {
  tone?: Tone
  onClose?: () => void
  children: ReactNode
}

export function Alert({ tone = 'info', onClose, children }: AlertProps) {
  return (
    <div className={`alert alert-${tone} d-flex align-items-center gap-2`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon name={ICONS[tone]} className="fs-5" />
      <div className="flex-grow-1">{children}</div>
      {onClose && <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />}
    </div>
  )
}
