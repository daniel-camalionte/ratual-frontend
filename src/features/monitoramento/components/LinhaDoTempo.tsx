import { Icon } from '@/components/ui/Icon'
import { agrupar, horario, parseData, titulo, type ItemLinha } from '../dados'
import type { Evento } from '../types'

const ICONE: Record<Evento['tipo'], string> = {
  offline: 'wifi-off',
  fora_faixa: 'alert-triangle',
  subida_rapida: 'temperature-plus',
  rele_ligado: 'power',
  rele_desligado: 'power',
  camera_deteccao: 'info-circle',
  camera_offline: 'wifi-off',
}

function tom(e: Evento): 'danger' | 'warning' | 'success' | 'secondary' | 'info' {
  if (e.tipo === 'offline' || e.tipo === 'camera_offline') return e.ativo ? 'danger' : 'secondary'
  if (e.tipo === 'fora_faixa') return e.ativo ? 'warning' : 'secondary'
  if (e.tipo === 'subida_rapida') return 'warning'
  if (e.tipo === 'camera_deteccao') return 'info'
  return e.tipo === 'rele_ligado' ? 'success' : 'secondary'
}

function Linha({ item, mostrarAparelho }: { item: ItemLinha; mostrarAparelho: boolean }) {
  if (item.tipo === 'grupo') {
    const texto = `Compressor alternou ${item.eventos.length} vezes fora do app (temporizador, loop ou app eWeLink)`
    return (
      <li className="rt-tl-item">
        <span className="rt-tl-icon bg-secondary-subtle text-secondary">
          <Icon name="refresh" />
        </span>
        <div className="min-w-0 flex-grow-1">
          {mostrarAparelho && <div className="rt-tl-title text-truncate">{titulo(item.dispositivo.nome)}</div>}
          <div className="rt-tl-msg">{texto}</div>
        </div>
        <span className="rt-tl-when">
          {horario(item.de)} – {horario(item.ate)}
        </span>
      </li>
    )
  }
  const e = item.evento
  const t = tom(e)
  return (
    <li className="rt-tl-item">
      <span className={`rt-tl-icon bg-${t}-subtle text-${t}`}>
        <Icon name={ICONE[e.tipo]} />
      </span>
      <div className="min-w-0 flex-grow-1">
        {mostrarAparelho && (
          <div className="rt-tl-title text-truncate">
            {titulo(e.dispositivo.nome)}
            {e.empresa?.nome && <span className="text-muted fw-normal"> · {e.empresa.nome}</span>}
          </div>
        )}
        <div className={`rt-tl-msg ${e.origem === 'app' ? 'fw-medium' : ''}`}>{e.descricao}</div>
      </div>
      <span className={`rt-tl-when ${e.ativo ? 'is-new' : ''}`}>{e.ativo ? 'agora' : horario(parseData(e.inicio))}</span>
    </li>
  )
}

/** Lista de eventos (alertas, comandos do compressor, mudanças), com agrupamento de relé repetido. */
export function LinhaDoTempo({ eventos, mostrarAparelho = true, vazio }: { eventos: Evento[]; mostrarAparelho?: boolean; vazio: string }) {
  const itens = agrupar(eventos)
  if (!itens.length) return <p className="text-muted mb-0">{vazio}</p>
  return (
    <ul className="list-unstyled mb-0 rt-tl">
      {itens.map((i) => (
        <Linha key={i.chave} item={i} mostrarAparelho={mostrarAparelho} />
      ))}
    </ul>
  )
}
