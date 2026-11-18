import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '@/lib/api'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Busca de novo (mantem os dados antigos na tela enquanto carrega). */
  reload: () => void
}

/**
 * GET com estado de carregamento/erro, cancelamento ao sair da tela e atualizacao periodica opcional.
 * `path = null` desliga a busca (ex.: espera um id). Sem cache global: cada tela busca o que precisa.
 */
export function useApi<T>(path: string | null, opts: { refreshMs?: number } = {}): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(path !== null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (path === null) return
    const ctrl = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inicio da busca: marca o carregamento
    setLoading(true)
    api
      .get<T>(path, undefined, { signal: ctrl.signal })
      .then((d) => {
        if (ctrl.signal.aborted) return
        setData(d)
        setError(null)
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return
        setError(e instanceof ApiError ? e.message : 'Erro inesperado.')
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [path, tick])

  useEffect(() => {
    if (!opts.refreshMs || path === null) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setTick((t) => t + 1)
    }, opts.refreshMs)
    return () => clearInterval(id)
  }, [opts.refreshMs, path])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}
