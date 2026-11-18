import { useApi } from '@/lib/useApi'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ACOES, quando, resumoDetalhe, type Registro } from '../types'
import { ErroLista } from './ErroLista'

export function AbaAuditoria() {
  const aud = useApi<{ registros: Registro[] }>('/v1/auditoria?limite=200')
  if (aud.loading && !aud.data) return <Spinner />
  if (aud.error && !aud.data) return <ErroLista mensagem={aud.error} onRetry={aud.reload} />
  const lista = aud.data?.registros ?? []
  return (
    <Card>
      {lista.length ? (
        <ul className="gt-audit">
          {lista.map((r) => (
            <li key={r.id_auditoria}>
              <div className="d-flex justify-content-between gap-2">
                <span>
                  <strong>{r.usuario.nome}</strong> {ACOES[r.acao] ?? r.acao} <strong>{r.entidade === 'dispositivo' ? r.id_entidade : `#${r.id_entidade}`}</strong>
                </span>
                <small className="text-muted flex-shrink-0">{quando(r.quando)}</small>
              </div>
              {resumoDetalhe(r) && <small className="text-muted">{resumoDetalhe(r)}</small>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-muted py-4 mb-0">Nenhuma ação registrada ainda.</p>
      )}
    </Card>
  )
}
