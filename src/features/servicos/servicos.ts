// Central de serviços: tipos da API, rótulos e formatação (datas da agenda, dinheiro).
import { formatBRL } from '@/lib/format'

export type StatusOS = 'solicitado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado'
type Tone = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark'

export interface Ordem {
  id_os: number
  status: StatusOS
  origem: 'cliente' | 'interno' | null
  data: string // AAAA-MM-DD
  hora_inicio: string | null
  hora_fim: string | null
  empresa: { id_empresa: number; nome: string }
  dispositivo: { deviceid: string; nome: string | null } | null
  tipo_servico: { id_tipo_servico: number; nome: string }
  tecnico: { id_tecnico: number; nome: string; telefone: string | null } | null
  descricao: string | null
  valores: { servico: number | null; desconto_percentual: number | null; desconto: number | null; pecas: number | null; total: number | null }
  descricao_pecas: string | null
  observacao_tecnica: string | null
  motivo_cancelamento: string | null
  solicitante: string | null
  criado_em: string | null
  concluido_em: string | null
}

export interface TipoServico {
  id_tipo_servico: number
  nome: string
  descricao: string | null
  valor: number | null
  cliente_pode_solicitar: boolean
  ativo: boolean
}
export interface Tecnico {
  id_tecnico: number
  nome: string
  telefone: string | null
  ativo: boolean
}
export interface Plano {
  id_plano: number
  nome: string
  descricao: string | null
  preco_mensal: number | null
  desconto_servico: number | null
  visitas_preventivas_ano: number | null
  pontos_inclusos: number | null
  ativo: boolean
  clientes: number
}
export interface Janela {
  id_janela: number
  dia_semana: number
  dia: string
  hora_inicio: string
  hora_fim: string
  vagas: number
  ativo: boolean
}
export interface Bloqueio {
  id_bloqueio: number
  data: string
  motivo: string | null
}
export interface DiaDisponivel {
  data: string
  janelas: { hora_inicio: string; hora_fim: string; vagas_livres: number }[]
}
export interface Catalogo {
  plano: { id_plano: number; nome: string; desconto_servico: number } | null
  tipos: (TipoServico & { valor_com_desconto: number })[]
}
export interface EmpresaPlano {
  id_empresa: number
  nome: string
  tipo: string
  ativo: boolean
  plano: { nome: string; desconto_servico: number } | null
}
export interface Equipamento {
  deviceid: string
  nome: string
  empresa: { id_empresa: number } | null
}

export const STATUS_OS: Record<StatusOS, { label: string; tone: Tone; dica: string }> = {
  solicitado: { label: 'Solicitado', tone: 'warning', dica: 'Aguardando a confirmação da equipe' },
  confirmado: { label: 'Confirmado', tone: 'primary', dica: 'Visita confirmada' },
  em_atendimento: { label: 'Em atendimento', tone: 'info', dica: 'O técnico está no local' },
  concluido: { label: 'Concluído', tone: 'success', dica: 'Serviço finalizado' },
  cancelado: { label: 'Cancelado', tone: 'secondary', dica: 'Visita cancelada' },
}

// próximos passos possíveis a partir de cada status (o backend valida de novo)
export const PROXIMOS: Record<StatusOS, StatusOS[]> = {
  solicitado: ['confirmado', 'cancelado'],
  confirmado: ['em_atendimento', 'concluido', 'cancelado'],
  em_atendimento: ['concluido', 'cancelado'],
  concluido: [],
  cancelado: [],
}

export const ACAO_STATUS: Partial<Record<StatusOS, string>> = {
  confirmado: 'Confirmar visita',
  em_atendimento: 'Iniciar atendimento',
  concluido: 'Concluir serviço',
}

export const ABERTOS: StatusOS[] = ['solicitado', 'confirmado', 'em_atendimento']

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export const reais = (v: number | null | undefined) => formatBRL(v ?? 0)
export const pct = (v: number | null | undefined) => (v ?? 0).toLocaleString('pt-BR')
export const nomeEquip = (n: string | null | undefined) => n || 'Equipamento'

/** "2026-10-28" -> Date local (sem o deslocamento de fuso do new Date(iso)). */
export function dataLocal(iso: string) {
  const [a = 0, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "qua, 28/10" */
export function diaCurto(iso: string) {
  const d = dataLocal(iso)
  return `${DIAS_CURTOS[d.getDay()]}, ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
}

/** "Quarta-feira, 28 de outubro" */
export function diaLongo(iso: string) {
  const t = dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export const minutos = (hhmm: string | null) => {
  const [h = 0, m = 0] = (hhmm ?? '00:00').split(':').map(Number)
  return h * 60 + m
}

/** Segunda-feira da semana de `d`. */
export function inicioSemana(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}

export function somarDias(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** "1.234,50" ou "12.5" -> número (NaN se inválido). */
export const parseNum = (s: string) => Number(s.trim().replace(',', '.'))
