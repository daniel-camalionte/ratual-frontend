import { useApi } from '@/lib/useApi'
import type { AlarmesResposta, CameraLista } from './types'

/** Lista de câmeras visíveis; master vê também as inativas. */
export function useCameras(master: boolean) {
  return useApi<CameraLista>(master ? '/v1/cameras?todas=1' : '/v1/cameras')
}

export function useAlarmes(idCamera: number) {
  return useApi<AlarmesResposta>(`/v1/cameras/${idCamera}/alarmes?limite=24`)
}
