import { z } from 'zod'
import { parseNum } from './servicos'

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe o horário')
const dinheiro = z.string().refine((s) => s.trim() !== '' && !Number.isNaN(parseNum(s)) && parseNum(s) >= 0, 'Informe um valor válido')
const dinheiroOpc = z.string().refine((s) => s.trim() === '' || (!Number.isNaN(parseNum(s)) && parseNum(s) >= 0), 'Valor inválido')
const inteiroOpc = z.string().refine((s) => s.trim() === '' || /^\d+$/.test(s.trim()), 'Informe um número inteiro')
const fimDepoisInicio = { path: ['hora_fim'], message: 'O fim deve ser depois do início' }

export const solicitarSchema = z.object({
  id_tipo_servico: z.string().min(1, 'Escolha o serviço'),
  deviceid: z.string(),
  descricao: z.string().max(1000, 'Máximo de 1000 caracteres'),
  data: z.string().min(1, 'Escolha o dia'),
  hora_inicio: z.string().min(1, 'Escolha o horário'),
})
export type SolicitarForm = z.infer<typeof solicitarSchema>

export const agendarSchema = z
  .object({
    id_empresa: z.string().min(1, 'Selecione o cliente'),
    id_tipo_servico: z.string().min(1, 'Selecione o serviço'),
    deviceid: z.string(),
    data: z.string().min(1, 'Informe a data'),
    hora_inicio: hora,
    hora_fim: hora,
    id_tecnico: z.string(),
    valor_servico: dinheiro,
    descricao: z.string().max(1000, 'Máximo de 1000 caracteres'),
  })
  .refine((v) => v.hora_fim > v.hora_inicio, fimDepoisInicio)
export type AgendarForm = z.infer<typeof agendarSchema>

export const ordemEquipeSchema = z
  .object({
    data: z.string().min(1, 'Informe a data'),
    hora_inicio: hora,
    hora_fim: hora,
    id_tecnico: z.string(),
    valor_servico: dinheiro,
    valor_pecas: dinheiro,
    descricao_pecas: z.string().max(500, 'Máximo de 500 caracteres'),
    observacao_tecnica: z.string().max(5000, 'Máximo de 5000 caracteres'),
  })
  .refine((v) => v.hora_fim > v.hora_inicio, fimDepoisInicio)
export type OrdemEquipeForm = z.infer<typeof ordemEquipeSchema>

export const tipoSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(100),
  descricao: z.string().max(255),
  valor: dinheiro,
  cliente_pode_solicitar: z.boolean(),
  ativo: z.boolean(),
})
export type TipoForm = z.infer<typeof tipoSchema>

export const tecnicoSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(120),
  telefone: z.string().max(30),
  ativo: z.boolean(),
})
export type TecnicoForm = z.infer<typeof tecnicoSchema>

export const planoSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(60),
  descricao: z.string().max(255),
  preco_mensal: dinheiroOpc,
  desconto_servico: dinheiro.refine((s) => parseNum(s) <= 100, 'Máximo de 100%'),
  visitas_preventivas_ano: inteiroOpc,
  pontos_inclusos: inteiroOpc,
  ativo: z.boolean(),
})
export type PlanoForm = z.infer<typeof planoSchema>

export const janelaSchema = z
  .object({
    dias: z.array(z.number()).min(1, 'Marque ao menos um dia'),
    hora_inicio: hora,
    hora_fim: hora,
    vagas: z.string().regex(/^[1-9]\d*$/, 'Informe ao menos 1 vaga'),
    ativo: z.boolean(),
  })
  .refine((v) => v.hora_fim > v.hora_inicio, fimDepoisInicio)
export type JanelaForm = z.infer<typeof janelaSchema>

export const bloqueioSchema = z.object({
  data: z.string().min(1, 'Informe a data'),
  motivo: z.string().max(120, 'Máximo de 120 caracteres'),
})
export type BloqueioForm = z.infer<typeof bloqueioSchema>
