import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/lib/useApi'
import { deApi, dataHora, type ContaResposta, type StatusEzviz } from './types'

/** Painel master: câmeras da conta EZVIZ (cadastradas ou não) e estado das últimas coletas. */
export default function ContaEzviz({ onCadastrar }: { onCadastrar: (c: { deviceserial: string; canal: number; nome: string | null }) => void }) {
  const conta = useApi<ContaResposta>('/v1/ezviz/conta')
  const status = useApi<StatusEzviz>('/v1/ezviz/status')

  return (
    <Card title="Conta EZVIZ" subtitle="Somente administradores Ratual">
      {conta.loading || status.loading ? <Spinner /> : null}
      {conta.error && <Alert tone="danger">{conta.error}</Alert>}
      {status.error && <Alert tone="danger">{status.error}</Alert>}

      {status.data && (
        <section aria-label="Estado da coleta" className="mb-3">
          <h6 className="mb-2">Coleta</h6>
          <ul className="list-unstyled small mb-2">
            {Object.entries(status.data.token)
              .filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v))
              .map(([k, v]) => (
                <li key={k}>
                  <span className="text-muted">{k}:</span> {String(v)}
                </li>
              ))}
          </ul>
          {status.data.ultimas_execucoes.length === 0 ? (
            <p className="text-muted small mb-0">Nenhuma coleta registrada.</p>
          ) : (
            <ul className="list-unstyled small mb-0">
              {status.data.ultimas_execucoes.slice(0, 5).map((e, i) => (
                <li key={i} className="d-flex flex-wrap gap-2 align-items-center py-1 border-top">
                  <Badge tone={e.status === 'ok' ? 'success' : 'danger'}>{e.status}</Badge>
                  <span>{dataHora(deApi(e.inicio))}</span>
                  <span className="text-muted">
                    {e.cameras} câm. · {e.alarmes_novos} alarmes
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {conta.data && (
        <section aria-label="Câmeras da conta">
          <h6 className="mb-2">Câmeras da conta ({conta.data.total})</h6>
          <ul className="list-unstyled mb-0">
            {conta.data.cameras.map((c) => (
              <li key={`${c.deviceserial}-${c.canal}`} className="d-flex align-items-center justify-content-between gap-2 py-2 border-top">
                <div className="min-w-0">
                  <div className="text-truncate fw-medium">{c.nome ?? c.deviceserial}</div>
                  <small className="text-muted">
                    {c.deviceserial} · canal {c.canal} · {c.online ? 'online' : 'offline'}
                  </small>
                </div>
                {c.id_camera ? (
                  <Badge tone="success">Cadastrada</Badge>
                ) : (
                  <Button size="sm" outline className="cam-touch" onClick={() => onCadastrar({ deviceserial: c.deviceserial, canal: c.canal, nome: c.nome })}>
                    Cadastrar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  )
}
