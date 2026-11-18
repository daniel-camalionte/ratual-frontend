import type { ReactNode } from 'react'

type Tone = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark'

export function Badge({ tone = 'primary', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge bg-${tone}-subtle text-${tone}`}>{children}</span>
}
