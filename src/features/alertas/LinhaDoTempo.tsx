import { Icon } from '@/components/ui/Icon'
import { agrupar, dataEvento, horario, titulo, visual, type Evento, type ItemLinha } from './eventos'

function Linha({ item, mostrarEmpresa }: { item: ItemLinha; mostrarEmpresa: boolean }) {
  if (item.tipo === 'grupo') {
    return (
      <li className="al-item">
        <span className="al-icone al-icone-muted">
          <Icon name="repeat" />
        </span>
        <div className="al-corpo">
          <div className="al-topo">
            <span className="al-nome">{titulo(item.dispositivo.nome)}</span>
            <span className="al-hora">
              {horario(item.de)} – {horario(item.ate)}
            </span>
          </div>
          <div className="al-desc">Compressor alternou {item.eventos.length} vezes fora do app (temporizador, loop ou app eWeLink)</div>
        </div>
      </li>
    )
  }
  const e: Evento = item.evento
  const v = visual(e)
  return (
    <li className="al-item">
      <span className={`al-icone al-icone-${v.tone}`}>
        <Icon name={v.icon} />
      </span>
      <div className="al-corpo">
        <div className="al-topo">
          <span className="al-nome">
            {titulo(e.dispositivo.nome)}
            {mostrarEmpresa && e.empresa?.nome && <span className="text-muted fw-normal"> · {e.empresa.nome}</span>}
          </span>
          <span className={`al-hora ${e.ativo ? 'al-hora-ativo' : ''}`}>{e.ativo ? 'agora' : horario(dataEvento(e.inicio))}</span>
        </div>
        <div className={`al-desc ${e.origem === 'app' ? 'text-body fw-medium' : ''}`}>{e.descricao}</div>
      </div>
    </li>
  )
}

/** Lista de eventos com agrupamento de rele repetido. */
export function LinhaDoTempo({ eventos, mostrarEmpresa = false, vazio }: { eventos: Evento[]; mostrarEmpresa?: boolean; vazio: string }) {
  const itens = agrupar(eventos)
  if (!itens.length) return <p className="al-vazio text-muted mb-0">{vazio}</p>
  return (
    <ul className="al-lista">
      {itens.map((i) => (
        <Linha key={i.chave} item={i} mostrarEmpresa={mostrarEmpresa} />
      ))}
    </ul>
  )
}
