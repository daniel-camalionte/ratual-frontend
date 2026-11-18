import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { DIAS_CURTOS, STATUS_OS, isoLocal, minutos, somarDias, type Bloqueio, type Janela, type Ordem } from './servicos'

const ALTURA_HORA = 56 // px por hora na grade desktop

function useDesktop() {
  const q = '(min-width: 992px)'
  const [v, setV] = useState(() => (typeof window.matchMedia === 'function' ? window.matchMedia(q).matches : false))
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setV(m.matches)
    m.addEventListener('change', on)
    on()
    return () => m.removeEventListener('change', on)
  }, [])
  return v
}

/** Distribui visitas sobrepostas em colunas lado a lado. */
function emColunas(lista: Ordem[]) {
  const ordenadas = [...lista].sort((a, b) => minutos(a.hora_inicio) - minutos(b.hora_inicio))
  const fins: number[] = []
  const coluna = new Map<number, number>()
  for (const o of ordenadas) {
    let c = fins.findIndex((f) => f <= minutos(o.hora_inicio))
    if (c === -1) c = fins.length
    fins[c] = minutos(o.hora_fim)
    coluna.set(o.id_os, c)
  }
  return { coluna, total: Math.max(1, fins.length) }
}

interface Props {
  semana: Date // segunda-feira
  onSemana: (d: Date) => void
  ordens: Ordem[]
  janelas: Janela[]
  bloqueios: Bloqueio[]
  onAbrir: (o: Ordem) => void
  onNovo: (data: string, hora: string) => void
}

export function AgendaSemana({ semana, onSemana, ordens, janelas, bloqueios, onAbrir, onNovo }: Props) {
  const desktop = useDesktop()
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(semana, i))
  const hoje = isoLocal(new Date())
  const bloqueio = (iso: string) => bloqueios.find((b) => b.data === iso)
  const porDia = (iso: string) => ordens.filter((o) => o.data === iso && o.status !== 'cancelado')
  const rotulo = `${semana.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${somarDias(semana, 6).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`

  // faixa de horas visível: o expediente padrão, ampliado se houver visita ou janela fora dele
  const [horaIni, horaFim] = useMemo(() => {
    const ini = [7 * 60, ...ordens.map((o) => minutos(o.hora_inicio)), ...janelas.map((j) => minutos(j.hora_inicio))]
    const fim = [19 * 60, ...ordens.map((o) => minutos(o.hora_fim)), ...janelas.map((j) => minutos(j.hora_fim))]
    return [Math.floor(Math.min(...ini) / 60), Math.ceil(Math.max(...fim) / 60)]
  }, [ordens, janelas])
  const horas = Array.from({ length: horaFim - horaIni + 1 }, (_, i) => horaIni + i)
  const topo = (hhmm: string | null) => ((minutos(hhmm) - horaIni * 60) / 60) * ALTURA_HORA

  return (
    <div>
      <div className="sv-agenda-nav">
        <div className="d-flex gap-2">
          <Button variant="light" icon="chevron-left" aria-label="Semana anterior" onClick={() => onSemana(somarDias(semana, -7))} />
          <Button variant="light" icon="chevron-right" aria-label="Próxima semana" onClick={() => onSemana(somarDias(semana, 7))} />
          <Button variant="light" onClick={() => onSemana(new Date())}>
            Hoje
          </Button>
        </div>
        <p className="fw-semibold mb-0">{rotulo}</p>
      </div>

      {desktop ? (
        <div className="card overflow-hidden">
          <div className="sv-grid sv-grid-head">
            <div />
            {dias.map((d) => {
              const iso = isoLocal(d)
              return (
                <div key={iso} className={`text-center py-2 ${iso === hoje ? 'bg-primary-subtle' : ''}`}>
                  <p className="small text-uppercase text-muted mb-0">{DIAS_CURTOS[d.getDay()]}</p>
                  <p className={`fs-5 fw-semibold mb-0 ${iso === hoje ? 'text-primary' : ''}`}>{d.getDate()}</p>
                </div>
              )
            })}
          </div>
          <div className="sv-grid position-relative" style={{ height: horas.length * ALTURA_HORA }}>
            <div className="position-relative">
              {horas.map((h) => (
                <span key={h} className="sv-hora" style={{ top: (h - horaIni) * ALTURA_HORA }}>
                  {h > horaIni && `${String(h).padStart(2, '0')}:00`}
                </span>
              ))}
            </div>
            {dias.map((d) => {
              const iso = isoLocal(d)
              const bloq = bloqueio(iso)
              const lista = porDia(iso)
              const { coluna, total } = emColunas(lista)
              return (
                <div
                  key={iso}
                  className={`sv-col ${bloq ? 'is-bloq' : ''}`}
                  onClick={(e) => {
                    if (bloq || e.target !== e.currentTarget) return
                    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
                    onNovo(iso, `${String(horaIni + Math.floor(y / ALTURA_HORA)).padStart(2, '0')}:00`)
                  }}
                >
                  {horas.map((h) => (
                    <div key={h} className="sv-linha-hora" style={{ top: (h - horaIni) * ALTURA_HORA }} />
                  ))}
                  {!bloq &&
                    janelas
                      .filter((j) => j.ativo && j.dia_semana === d.getDay())
                      .map((j) => <div key={j.id_janela} className="sv-janela" style={{ top: topo(j.hora_inicio), height: topo(j.hora_fim) - topo(j.hora_inicio) }} />)}
                  {bloq && (
                    <p className="sv-bloq-rotulo">
                      <Icon name="lock" /> {bloq.motivo || 'Bloqueado'}
                    </p>
                  )}
                  {lista.map((o) => {
                    const c = coluna.get(o.id_os) ?? 0
                    return (
                      <button
                        key={o.id_os}
                        type="button"
                        className={`sv-bloco sv-bloco-${STATUS_OS[o.status].tone}`}
                        onClick={() => onAbrir(o)}
                        style={{
                          top: topo(o.hora_inicio) + 1,
                          height: Math.max(topo(o.hora_fim) - topo(o.hora_inicio) - 2, 22),
                          left: `calc(${(c / total) * 100}% + 2px)`,
                          width: `calc(${100 / total}% - 4px)`,
                        }}
                      >
                        <strong className="d-block text-truncate">{o.empresa.nome}</strong>
                        <span className="d-block text-truncate">
                          {o.hora_inicio} · {o.tipo_servico.nome}
                        </span>
                        {o.tecnico && <span className="d-block text-truncate">{o.tecnico.nome}</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          {dias.map((d) => {
            const iso = isoLocal(d)
            const lista = [...porDia(iso)].sort((a, b) => minutos(a.hora_inicio) - minutos(b.hora_inicio))
            const bloq = bloqueio(iso)
            return (
              <section key={iso} className="mb-3" aria-label={d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <p className={`sv-dia-titulo mb-0 ${iso === hoje ? 'text-primary' : ''}`}>{d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                  {!bloq && (
                    <button type="button" className="btn btn-link btn-sm p-0 sv-add" aria-label={`Agendar em ${iso}`} onClick={() => onNovo(iso, '')}>
                      <Icon name="plus" /> Agendar
                    </button>
                  )}
                </div>
                {bloq ? (
                  <p className="sv-bloq mb-0">
                    <Icon name="lock" /> {bloq.motivo || 'Dia bloqueado'}
                  </p>
                ) : lista.length ? (
                  <ul className="list-unstyled card mb-0 sv-lista">
                    {lista.map((o) => (
                      <li key={o.id_os}>
                        <button type="button" className="sv-item" onClick={() => onAbrir(o)}>
                          <span className="sv-hora-m">{o.hora_inicio}</span>
                          <span className="min-w-0 flex-grow-1 text-start">
                            <span className="d-block fw-semibold text-truncate">{o.empresa.nome}</span>
                            <span className="d-block small text-muted text-truncate">
                              {o.tipo_servico.nome}
                              {o.tecnico ? ` · ${o.tecnico.nome}` : ''}
                            </span>
                          </span>
                          <Badge tone={STATUS_OS[o.status].tone}>{STATUS_OS[o.status].label}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="small text-muted mb-0">Sem visitas</p>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
