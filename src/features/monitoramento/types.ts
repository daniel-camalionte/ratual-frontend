export type StatusRefrigerador = 'normal' | 'alerta' | 'offline'
export type TipoRefrigerador = 'congelado' | 'resfriado'

export interface Faixa {
  min: number | null
  max: number | null
}

/** Refrigerador já convertido da resposta de `GET /v1/dispositivos`. */
export interface Refrigerador {
  id: string
  nome: string
  tipo: TipoRefrigerador
  modelo: string
  online: boolean
  /** null = sem leitura */
  temperatura: number | null
  faixa: Faixa
  toleranciaMin: number | null
  /** estado do relé do compressor; null = desconhecido */
  compressorLigado: boolean | null
  status: StatusRefrigerador
  sinal: number | null
  dataLeitura: Date | null
  empresa: string | null
}

export type TipoEvento = 'offline' | 'fora_faixa' | 'subida_rapida' | 'rele_ligado' | 'rele_desligado' | 'camera_deteccao' | 'camera_offline'

export interface Evento {
  id_evento: number
  tipo: TipoEvento
  origem: 'sistema' | 'app' | 'externo'
  ativo: boolean
  inicio: string
  fim: string | null
  duracao_min: number | null
  valor: number | null
  descricao: string
  usuario: string | null
  dispositivo: { deviceid: string; nome: string }
  empresa: { id_empresa: number; nome: string | null } | null
}

export interface Alerta {
  id: string
  tipo: 'temperatura' | 'offline'
  equipamento: string
  cliente?: string
  mensagem: string
  /** "agora", "ontem, 10:30"... */
  quando: string
  novo: boolean
}

export interface PontoCompressor {
  dia: string
  /** % do tempo ligado (0 quando não há leituras no dia) */
  percentual: number
}

/** [timestamp ms, °C | null] */
export type PontoTemperatura = [number, number | null]

export interface SeriesTemperatura {
  congelados: PontoTemperatura[]
  resfriados: PontoTemperatura[]
}

export interface Kpis {
  total: number
  compressoresLigados: number
  normais: number
  alertas: number
  offline: number
}

// ---- formatos da API (schemas Pydantic do backend) ----
export interface DispositivoApi {
  deviceid: string
  nome: string
  modelo?: string | null
  tipo?: string | null
  faixa: { min?: number | null; max?: number | null; tolerancia_min?: number | null }
  online: boolean
  temperatura?: number | null
  rele?: boolean | null
  sinal?: number | null
  data_leitura?: string | null
  empresa?: { id_empresa: number; nome?: string | null } | null
}

export interface DispositivosResponse {
  total: number
  dispositivos: DispositivoApi[]
}

export interface GraficosResponse {
  temperatura_media: { data: string; congelados: number | null; resfriados: number | null }[]
  compressor_por_dia: { dia: string; hoje: boolean; ligado_pct: number | null }[]
}

export interface EventosResponse {
  total: number
  eventos: Evento[]
}

export interface GraficoDispositivo {
  faixa: { min: number | null; max: number | null }
  resumo: {
    temperatura_atual: number | null
    minima: number | null
    maxima: number | null
    media: number | null
    compressor_ligado_pct: number | null
    leituras: number
    leituras_offline: number
  }
  pontos: { data: string; temperatura: number | null; rele: boolean | null; online: boolean }[]
}
