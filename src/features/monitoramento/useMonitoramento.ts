import { useCallback, useMemo } from 'react'
import { useApi } from '@/lib/useApi'
import { calcularKpis, ordenar, paraAlerta, paraCompressor, paraRefrigerador, paraSerie } from './dados'
import type { DispositivosResponse, EventosResponse, GraficosResponse } from './types'

/** Leitura da coleta a cada 5 min no backend: atualizamos a lista a cada 60 s e as séries a cada 5 min. */
const LISTA_MS = 60_000
const SERIES_MS = 5 * 60_000

/** Lista de refrigeradores já ordenada (offline, alerta, normal). */
export function useRefrigeradores() {
  const { data, loading, error, reload } = useApi<DispositivosResponse>('/v1/dispositivos', { refreshMs: LISTA_MS })
  const refrigeradores = useMemo(() => ordenar((data?.dispositivos ?? []).map(paraRefrigerador)), [data])
  return { refrigeradores, loading: loading && !data, error: data ? null : error, reload }
}

/** Dados do painel (rota `/`): refrigeradores, séries de temperatura/compressor e alertas ativos, todos reais. */
export function useMonitoramento() {
  const lista = useRefrigeradores()
  const graficos = useApi<GraficosResponse>('/v1/dashboard/graficos?horas=24&dias=7', { refreshMs: SERIES_MS })
  const alertasApi = useApi<EventosResponse>('/v1/alertas?limite=20', { refreshMs: LISTA_MS })

  const serie = useMemo(() => paraSerie(graficos.data), [graficos.data])
  const compressores = useMemo(() => paraCompressor(graficos.data), [graficos.data])
  const alertas = useMemo(() => (alertasApi.data?.eventos ?? []).map(paraAlerta), [alertasApi.data])
  const kpis = useMemo(() => calcularKpis(lista.refrigeradores), [lista.refrigeradores])

  const { reload: recarregarLista } = lista
  const { reload: recarregarGraficos } = graficos
  const { reload: recarregarAlertas } = alertasApi
  const atualizar = useCallback(() => {
    recarregarLista()
    recarregarGraficos()
    recarregarAlertas()
  }, [recarregarLista, recarregarGraficos, recarregarAlertas])

  // horário da leitura mais recente gravada pela coleta (não o da carga da tela)
  const ultimaLeitura = useMemo(
    () => lista.refrigeradores.reduce<Date | null>((m, r) => (r.dataLeitura && (!m || r.dataLeitura > m) ? r.dataLeitura : m), null),
    [lista.refrigeradores],
  )

  return {
    refrigeradores: lista.refrigeradores,
    serie,
    alertas,
    compressores,
    kpis,
    ultimaLeitura,
    loading: lista.loading,
    error: lista.error,
    atualizar,
  }
}
