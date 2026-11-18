import { useSyncExternalStore } from 'react'

/** Reage a uma media query (ex.: '(max-width: 575.98px)'). Seguro sem matchMedia (SSR/testes). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== 'function') return () => undefined
      const mql = window.matchMedia(query)
      mql.addEventListener('change', notify)
      return () => mql.removeEventListener('change', notify)
    },
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
    () => false,
  )
}

export const useIsPhone = () => useMediaQuery('(max-width: 575.98px)')
