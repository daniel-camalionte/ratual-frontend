import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from './useMediaQuery'

/** Anima um número de 0 (ou do valor anterior) até `target`. Sem animação se o usuário prefere movimento reduzido. */
export function useCountUp(target: number, durationMs = 900): number {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [value, setValue] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    if (reduced) return
    const start = performance.now()
    const origin = from.current
    let raf = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      const next = origin + (target - origin) * eased
      from.current = next
      setValue(next)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, reduced])

  return reduced ? target : Math.round(value)
}
