import { Icon } from '@/components/ui/Icon'
import { ABERTOS, STATUS_OS, diaCurto, reais, type Ordem } from './servicos'
import { Badge } from '@/components/ui/Badge'

/** Abas roláveis na horizontal (celular), com alvo de toque grande e contador opcional. */
export function Abas<T extends string>({ abas, atual, onTrocar, label }: { abas: { id: T; label: string; icon?: string; contador?: number }[]; atual: T; onTrocar: (a: T) => void; label: string }) {
  return (
    <div className="sv-abas" role="tablist" aria-label={label}>
      {abas.map((a) => (
        <button key={a.id} type="button" role="tab" aria-selected={atual === a.id} className={`sv-aba ${atual === a.id ? 'is-active' : ''}`} onClick={() => onTrocar(a.id)}>
          {a.icon && <Icon name={a.icon} />}
          {a.label}
          {!!a.contador && <span className="sv-contador">{a.contador}</span>}
        </button>
      ))}
    </div>
  )
}

/** Linha de uma ordem nas listas (cliente e equipe). */
export function LinhaOrdem({ o, equipe, onAbrir }: { o: Ordem; equipe: boolean; onAbrir: () => void }) {
  return (
    <li>
      <button type="button" className="sv-item" onClick={onAbrir}>
        <span className="sv-data">
          <span className="sv-data-dia">{diaCurto(o.data).split(',')[0]}</span>
          <span className="sv-data-num">
            {o.data.slice(8, 10)}/{o.data.slice(5, 7)}
          </span>
        </span>
        <span className="min-w-0 flex-grow-1 text-start">
          <span className="d-flex flex-wrap align-items-center gap-1 fw-semibold">
            {equipe ? o.empresa.nome : o.tipo_servico.nome}
            <Badge tone={STATUS_OS[o.status].tone}>{STATUS_OS[o.status].label}</Badge>
          </span>
          <span className="d-block small text-muted text-truncate">
            {o.hora_inicio}–{o.hora_fim}
            {equipe && ` · ${o.tipo_servico.nome}`}
            {o.tecnico ? ` · ${o.tecnico.nome}` : equipe && ABERTOS.includes(o.status) ? ' · sem técnico' : ''}
          </span>
        </span>
        <span className="fw-semibold flex-shrink-0">{reais(o.valores.total)}</span>
      </button>
    </li>
  )
}
