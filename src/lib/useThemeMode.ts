import { useSyncExternalStore } from 'react'

const read = (): 'light' | 'dark' => (document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light')

/** Tema atual (light/dark) reativo: acompanha o atributo data-bs-theme do <html>. */
export function useThemeMode(): 'light' | 'dark' {
  return useSyncExternalStore(
    (notify) => {
      const obs = new MutationObserver(notify)
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })
      return () => obs.disconnect()
    },
    read,
    () => 'light',
  )
}
