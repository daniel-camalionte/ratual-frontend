export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  if (src) return <img src={src} alt={name} width={size} height={size} className="rounded-circle object-fit-cover" loading="lazy" />
  return (
    <span
      className="rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fw-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      role="img"
      aria-label={name}
    >
      {initials}
    </span>
  )
}
