interface IconProps {
  /** nome sem prefixo, ex.: "home" => classe `ti ti-home` (fonte local, sem CDN). */
  name: string
  className?: string
  title?: string
}

export function Icon({ name, className = '', title }: IconProps) {
  return (
    <i
      className={`ti ti-${name} ${className}`.trim()}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    />
  )
}
