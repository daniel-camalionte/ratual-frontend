interface Props {
  value: number
  tone?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  label?: string
  height?: number
}

export function ProgressBar({ value, tone = 'primary', label, height = 6 }: Props) {
  const v = Math.min(100, Math.max(0, value))
  return (
    <div className="progress" style={{ height }}>
      <div
        className={`progress-bar text-bg-${tone}`}
        role="progressbar"
        style={{ width: `${v}%` }}
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      />
    </div>
  )
}
