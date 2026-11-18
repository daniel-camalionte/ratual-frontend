// Câmeras EZVIZ: tipos (formato do backend, app/schemas/cameras.py) e helpers de data.

export interface Camera {
  id_camera: number
  deviceserial: string
  canal: number
  nome?: string | null
  modelo?: string | null
  online: boolean
  criptografada: boolean
  codigo_cadastrado: boolean
  ativo: boolean
  data_status?: string | null
  ultimo_alarme_em?: string | null
  refrigerador?: { deviceid: string; nome: string } | null
  empresa?: { id_empresa: number; nome?: string | null } | null
}

export interface CameraLista {
  total: number
  cameras: Camera[]
}

export interface Alarme {
  id_alarme: number
  tipo: number | null
  data: string | null
  tem_foto: boolean
  foto_criptografada: boolean
}

export interface AlarmesResposta {
  total: number
  alarmes: Alarme[]
}

export interface LinkVideo {
  url: string | null
  protocolo: string
  expira_em: string
}

export interface ContaCamera {
  deviceserial: string
  canal: number
  nome: string | null
  online: boolean
  criptografada: boolean
  id_camera: number | null
}

export interface ContaResposta {
  total: number
  cameras: ContaCamera[]
}

export interface StatusEzviz {
  token: Record<string, unknown>
  ultimas_execucoes: {
    inicio: string | null
    status: string
    cameras: number
    alarmes_novos: number
    chamadas_api: number
    duracao_ms: number | null
    mensagem: string | null
  }[]
}

/** Modo do player: ao vivo ou um trecho de gravação. */
export type ModoVideo = { tipo: 'ao_vivo' } | { tipo: 'gravacao'; inicio: string; fim: string; origem: 'nuvem' | 'sd' }

const pad = (n: number) => String(n).padStart(2, '0')

/** Date -> "YYYY-MM-DD HH:MM:SS" no horário de Brasília (formato da API). */
export function paraApi(d: Date): string {
  const b = new Date(d.getTime() - 3 * 3600_000)
  return `${b.getUTCFullYear()}-${pad(b.getUTCMonth() + 1)}-${pad(b.getUTCDate())} ${pad(b.getUTCHours())}:${pad(b.getUTCMinutes())}:${pad(b.getUTCSeconds())}`
}

/** "YYYY-MM-DD HH:MM:SS" (Brasília) -> Date. */
export function deApi(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s.replace(' ', 'T') + '-03:00')
  return Number.isNaN(d.getTime()) ? null : d
}

/** Janela de gravação em volta de um momento: 30 s antes até 2 min depois. */
export function janelaDoMomento(momento: Date, origem: 'nuvem' | 'sd' = 'nuvem'): ModoVideo {
  return { tipo: 'gravacao', inicio: paraApi(new Date(momento.getTime() - 30_000)), fim: paraApi(new Date(momento.getTime() + 120_000)), origem }
}

export const horario = (d: Date | null) => (d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--')
export const dataHora = (d: Date | null) =>
  d ? d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--'
