import { z } from 'zod'

// Eventos da linha do tempo (GET /v1/eventos e GET /v1/alertas).
export const eventoSchema = z.object({
  id_evento: z.number(),
  tipo: z.string(),
  origem: z.string(),
  ativo: z.boolean(),
  inicio: z.string(), // "YYYY-MM-DD HH:MM:SS" (Brasilia)
  fim: z.string().nullable().optional(),
  duracao_min: z.number().nullable().optional(),
  valor: z.number().nullable().optional(),
  descricao: z.string(),
  usuario: z.string().nullable().optional(),
  dispositivo: z.object({ deviceid: z.string(), nome: z.string() }),
  empresa: z.object({ id_empresa: z.number(), nome: z.string().nullable().optional() }).nullable().optional(),
})
export type Evento = z.infer<typeof eventoSchema>
export const eventosRespostaSchema = z.object({ total: z.number().optional(), eventos: z.array(eventoSchema) })

/** Item exibido: um evento ou um grupo de mudancas de rele repetidas (temporizador/loop). */
export type ItemLinha =
  | { tipo: 'evento'; chave: string; evento: Evento }
  | { tipo: 'grupo'; chave: string; eventos: Evento[]; dispositivo: Evento['dispositivo']; de: Date; ate: Date }

/** Icone (Tabler) e tom por tipo de evento. */
export function visual(e: Evento): { icon: string; tone: 'danger' | 'warning' | 'info' | 'success' | 'muted' } {
  const ativo = e.ativo
  switch (e.tipo) {
    case 'offline':
      return { icon: 'wifi-off', tone: ativo ? 'danger' : 'muted' }
    case 'fora_faixa':
      return { icon: 'alert-triangle', tone: ativo ? 'warning' : 'muted' }
    case 'camera_deteccao':
      return { icon: 'scan', tone: 'info' }
    case 'camera_offline':
      return { icon: 'video-off', tone: ativo ? 'danger' : 'muted' }
    case 'subida_rapida':
      return { icon: 'trending-up', tone: 'warning' }
    case 'rele_ligado':
      return { icon: 'power', tone: 'success' }
    default:
      return { icon: 'power', tone: 'muted' }
  }
}

export function dataEvento(v: string | null | undefined): Date | null {
  return v ? new Date(v.replace(' ', 'T') + '-03:00') : null
}

const ehReleExterno = (e: Evento) => e.origem === 'externo' && (e.tipo === 'rele_ligado' || e.tipo === 'rele_desligado')
const JANELA_GRUPO_MS = 15 * 60_000

/**
 * Agrupa mudancas de rele "externas" do mesmo aparelho proximas no tempo (ex.: loop que liga/desliga
 * a cada minuto). O grupo fica na posicao da mudanca mais recente. Eventos chegam do mais recente ao mais antigo.
 */
export function agrupar(eventos: Evento[]): ItemLinha[] {
  type Slot = { evento: Evento } | { grupo: Evento[] }
  const slots: Slot[] = []
  const abertos = new Map<string, Evento[]>()

  for (const e of eventos) {
    if (!ehReleExterno(e)) {
      slots.push({ evento: e })
      continue
    }
    const grupo = abertos.get(e.dispositivo.deviceid)
    const ultimo = grupo?.[grupo.length - 1]
    if (grupo && ultimo && dataEvento(ultimo.inicio)!.getTime() - dataEvento(e.inicio)!.getTime() <= JANELA_GRUPO_MS) {
      grupo.push(e)
    } else {
      const g = [e]
      abertos.set(e.dispositivo.deviceid, g)
      slots.push({ grupo: g })
    }
  }

  const itens: ItemLinha[] = []
  for (const slot of slots) {
    if ('evento' in slot) {
      itens.push({ tipo: 'evento', chave: `e-${slot.evento.id_evento}`, evento: slot.evento })
    } else if (slot.grupo.length >= 3) {
      const g = slot.grupo as [Evento, ...Evento[]]
      itens.push({
        tipo: 'grupo',
        chave: `g-${g[0].id_evento}`,
        eventos: g,
        dispositivo: g[0].dispositivo,
        de: dataEvento(g[g.length - 1]!.inicio)!,
        ate: dataEvento(g[0].inicio)!,
      })
    } else {
      slot.grupo.forEach((e) => itens.push({ tipo: 'evento', chave: `e-${e.id_evento}`, evento: e }))
    }
  }
  return itens
}

export function horario(d: Date | null): string {
  if (!d) return ''
  const hoje = new Date()
  const ontem = new Date(hoje.getTime() - 86_400_000)
  const hhmm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === hoje.toDateString()) return hhmm
  if (d.toDateString() === ontem.toDateString()) return `ontem, ${hhmm}`
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${hhmm}`
}

/** "SEXTO SENTIDO CERVEJARIA " -> "Sexto Sentido Cervejaria". */
export function titulo(nome: string): string {
  const limpo = nome.trim()
  if (limpo !== limpo.toUpperCase()) return limpo.charAt(0).toUpperCase() + limpo.slice(1)
  return limpo.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

/** Data local no formato do input type=date (YYYY-MM-DD). */
export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const diasAtras = (n: number): string => isoLocal(new Date(Date.now() - n * 86_400_000))
