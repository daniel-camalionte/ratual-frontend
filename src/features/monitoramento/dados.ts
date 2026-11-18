import type { Alerta, DispositivoApi, Evento, Faixa, GraficosResponse, Kpis, PontoCompressor, Refrigerador, SeriesTemperatura, StatusRefrigerador } from './types'

const CONGELADO = /congelad|sorvete|c[aâ]mara|container|mister|americana|saint|peter/i

export const ORDEM_STATUS: Record<StatusRefrigerador, number> = { offline: 0, alerta: 1, normal: 2 }

/** O backend devolve horário de Brasília sem fuso ("2026-05-01T10:30:00" ou com espaço). */
export function parseData(v: string | null | undefined): Date | null {
  if (!v) return null
  const iso = v.replace(' ', 'T')
  const d = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}-03:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function statusDe(temperatura: number | null, faixa: Faixa, online = true): StatusRefrigerador {
  if (!online || temperatura === null) return 'offline'
  if (faixa.min !== null && temperatura < faixa.min) return 'alerta'
  if (faixa.max !== null && temperatura > faixa.max) return 'alerta'
  return 'normal'
}

/** "SEXTO SENTIDO " vira "Sexto Sentido"; nomes em caixa mista só ganham a inicial maiúscula. */
export function titulo(nome: string): string {
  const limpo = nome.trim()
  if (limpo !== limpo.toUpperCase()) return limpo.charAt(0).toUpperCase() + limpo.slice(1)
  return limpo.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

export function paraRefrigerador(d: DispositivoApi): Refrigerador {
  const tipo = d.tipo === 'congelado' || d.tipo === 'resfriado' ? d.tipo : CONGELADO.test(d.nome) ? 'congelado' : 'resfriado'
  const faixa: Faixa = { min: d.faixa.min ?? null, max: d.faixa.max ?? null }
  const temperatura = d.temperatura ?? null
  return {
    id: d.deviceid,
    nome: titulo(d.nome),
    tipo,
    modelo: d.modelo ?? '',
    online: d.online,
    temperatura,
    faixa,
    toleranciaMin: d.faixa.tolerancia_min ?? null,
    compressorLigado: d.rele ?? null,
    status: statusDe(temperatura, faixa, d.online),
    sinal: d.sinal ?? null,
    dataLeitura: parseData(d.data_leitura),
    empresa: d.empresa?.nome ?? null,
  }
}

export function ordenar(lista: Refrigerador[]): Refrigerador[] {
  return [...lista].sort((a, b) => ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] || a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function calcularKpis(lista: Refrigerador[]): Kpis {
  return {
    total: lista.length,
    compressoresLigados: lista.filter((r) => r.online && r.compressorLigado).length,
    normais: lista.filter((r) => r.status === 'normal').length,
    alertas: lista.filter((r) => r.status === 'alerta').length,
    offline: lista.filter((r) => r.status === 'offline').length,
  }
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const diaSemana = (iso: string): string => DIAS[new Date(`${iso}T12:00:00-03:00`).getDay()] ?? ''

export function paraSerie(g: GraficosResponse | null): SeriesTemperatura {
  const pts = g?.temperatura_media ?? []
  const ts = (data: string) => parseData(data)?.getTime() ?? 0
  return {
    congelados: pts.map((p) => [ts(p.data), p.congelados]),
    resfriados: pts.map((p) => [ts(p.data), p.resfriados]),
  }
}

export function paraCompressor(g: GraficosResponse | null): PontoCompressor[] {
  return (g?.compressor_por_dia ?? []).map((d) => ({ dia: diaSemana(d.dia), percentual: d.ligado_pct ?? 0 }))
}

/** "14:05", "ontem, 14:05" ou "12/05, 14:05". */
export function horario(d: Date | null): string {
  if (!d) return ''
  const hoje = new Date()
  const ontem = new Date(hoje.getTime() - 86_400_000)
  const hhmm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === hoje.toDateString()) return hhmm
  if (d.toDateString() === ontem.toDateString()) return `ontem, ${hhmm}`
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${hhmm}`
}

export function paraAlerta(e: Evento): Alerta {
  const offline = e.tipo === 'offline' || e.tipo === 'camera_offline'
  return {
    id: String(e.id_evento),
    tipo: offline ? 'offline' : 'temperatura',
    equipamento: titulo(e.dispositivo.nome),
    cliente: e.empresa?.nome ?? undefined,
    mensagem: e.descricao,
    quando: e.ativo ? 'agora' : horario(parseData(e.inicio)),
    novo: e.ativo,
  }
}

export const fmtTemp = (v: number | null, casas = 1): string =>
  v === null ? '--' : v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

export const fmtNum = (v: number | null): string => (v === null ? '' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }))

/** Item da linha do tempo: um evento ou um grupo de mudanças de relé repetidas (loop/temporizador). */
export type ItemLinha =
  | { tipo: 'evento'; chave: string; evento: Evento }
  | { tipo: 'grupo'; chave: string; eventos: Evento[]; dispositivo: Evento['dispositivo']; de: Date | null; ate: Date | null }

const ehReleExterno = (e: Evento) => e.origem === 'externo' && (e.tipo === 'rele_ligado' || e.tipo === 'rele_desligado')
const JANELA_GRUPO_MS = 15 * 60_000
const ms = (v: string) => parseData(v)?.getTime() ?? 0

/** Agrupa (3+) mudanças de relé "externas" do mesmo aparelho em até 15 min; eventos vêm do mais recente ao mais antigo. */
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
    if (grupo && ultimo && ms(ultimo.inicio) - ms(e.inicio) <= JANELA_GRUPO_MS) grupo.push(e)
    else {
      const g = [e]
      abertos.set(e.dispositivo.deviceid, g)
      slots.push({ grupo: g })
    }
  }
  const itens: ItemLinha[] = []
  for (const slot of slots) {
    if ('evento' in slot) itens.push({ tipo: 'evento', chave: `e-${slot.evento.id_evento}`, evento: slot.evento })
    else if (slot.grupo.length >= 3) {
      const g = slot.grupo
      itens.push({ tipo: 'grupo', chave: `g-${g[0]!.id_evento}`, eventos: g, dispositivo: g[0]!.dispositivo, de: parseData(g[g.length - 1]!.inicio), ate: parseData(g[0]!.inicio) })
    } else slot.grupo.forEach((e) => itens.push({ tipo: 'evento', chave: `e-${e.id_evento}`, evento: e }))
  }
  return itens
}
