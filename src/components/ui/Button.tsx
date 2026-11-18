import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  outline?: boolean
  subtle?: boolean
  size?: 'sm' | 'lg'
  loading?: boolean
  icon?: string
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  outline = false,
  subtle = false,
  size,
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const base = subtle ? `btn btn-${variant}-subtle text-${variant}` : outline ? `btn btn-outline-${variant}` : `btn btn-${variant}`
  return (
    <button
      type={type}
      className={`${base} ${size ? `btn-${size}` : ''} d-inline-flex align-items-center justify-content-center gap-2 ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  )
}
