import { z } from 'zod'

export const PERFIS = { admin: 'Administrador', operador: 'Operador', visualizador: 'Visualizador' } as const
export type Perfil = keyof typeof PERFIS

export const PERFIL_DICA: Record<Perfil, string> = {
  admin: 'Vê, liga/desliga o compressor e gerencia os usuários da empresa',
  operador: 'Vê os refrigeradores da empresa (não liga/desliga o compressor)',
  visualizador: 'Vê os refrigeradores da empresa',
}

export interface Empresa {
  id_empresa: number
  nome: string
  documento: string | null
  tipo: 'master' | 'cliente'
  ativo: boolean
  usuarios: number
  dispositivos: number
  plano: { id_plano: number; nome: string; desconto_servico: number } | null
}
export interface PlanoOpcao {
  id_plano: number
  nome: string
  desconto_servico: number | null
  ativo: boolean
}
export interface UsuarioG {
  id_usuario: number
  nome: string
  login: string
  telefone: string | null
  perfil: Perfil
  ativo: boolean
  ultimo_login: string | null
  eu: boolean
  empresa: { id_empresa: number; nome: string; tipo: string }
}
export interface DispositivoG {
  deviceid: string
  nome: string
  modelo: string | null
  online: boolean
  ativo: boolean
  empresa: { id_empresa: number; nome: string } | null
}
export interface Registro {
  id_auditoria: number
  acao: string
  entidade: string
  id_entidade: string | null
  detalhe: Record<string, unknown>
  quando: string | null
  usuario: { nome: string; login: string }
}

// ── telefone: o backend guarda só os dígitos (com DDD); a tela mostra com máscara ──

export function mascaraTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function formatarTelefone(d: string | null | undefined): string {
  if (!d) return ''
  const local = d.length > 11 && d.startsWith('55') ? d.slice(2) : d
  return mascaraTelefone(local)
}

export const telefoneValido = (v: string) => {
  const n = v.replace(/\D/g, '').length
  return n === 0 || n === 10 || n === 11
}

// ── formulários ──

export const usuarioSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'Máximo de 150 caracteres.'),
  login: z.string().trim().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.'),
  telefone: z.string().refine(telefoneValido, 'Informe o DDD e o número.'),
  perfil: z.enum(['admin', 'operador', 'visualizador']),
  id_empresa: z.string(),
  ativo: z.boolean(),
})
export type UsuarioForm = z.infer<typeof usuarioSchema>

export const empresaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'Máximo de 150 caracteres.'),
  documento: z.string().trim().max(30, 'Máximo de 30 caracteres.'),
  id_plano: z.string(),
  ativo: z.boolean(),
})
export type EmpresaForm = z.infer<typeof empresaSchema>

export const ACOES: Record<string, string> = {
  usuario_criado: 'criou o usuário',
  usuario_alterado: 'alterou o usuário',
  empresa_criada: 'criou a empresa',
  empresa_alterada: 'alterou a empresa',
  dispositivo_alterado: 'alterou o refrigerador',
  faixa_alterada: 'alterou a faixa do refrigerador',
  camera_cadastrada: 'cadastrou a câmera',
  camera_alterada: 'alterou a câmera',
  plano_criado: 'criou o plano',
  plano_alterado: 'alterou o plano',
  tipo_servico_criado: 'criou o tipo de serviço',
  tipo_servico_alterado: 'alterou o tipo de serviço',
  tecnico_criado: 'cadastrou o técnico',
  tecnico_alterado: 'alterou o técnico',
  janela_criado: 'criou a janela da agenda',
  janela_alterado: 'alterou a janela da agenda',
  janela_removida: 'removeu a janela da agenda',
  bloqueio_criado: 'bloqueou a data',
  bloqueio_removido: 'liberou a data',
  os_criada: 'criou a ordem de serviço',
  os_alterada: 'alterou a ordem de serviço',
  os_cancelada: 'cancelou a ordem de serviço',
}

export function resumoDetalhe(r: Registro): string {
  const d = r.detalhe as { antes?: Record<string, unknown>; depois?: Record<string, unknown>; login?: string; nome?: string }
  if (d.depois) return Object.entries(d.depois).map(([k, v]) => `${k}: ${String(d.antes?.[k] ?? '—')} → ${String(v ?? '—')}`).join(' · ')
  return d.login || d.nome || ''
}

export function quando(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
