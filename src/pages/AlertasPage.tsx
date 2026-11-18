import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/lib/useApi'
import { useAuth } from '@/lib/auth'
import { LinhaDoTempo } from '@/features/alertas/LinhaDoTempo'
import { diasAtras, type Evento } from '@/features/alertas/eventos'
import '@/features/alertas/alertas.css'

const LIMITE = 500
const REFRESH_MS = 60_000

const ATALHOS = [
  { label: 'Hoje', de: () => diasAtras(0), ate: () => diasAtras(0) },
  { label: 'Ontem', de: () => diasAtras(1), ate: () => diasAtras(1) },
  { label: '7 dias', de: () => diasAtras(6), ate: () => diasAtras(0) },
]

const br = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')

export default function AlertasPage() {
  const { isMaster } = useAuth()
  const hoje = diasAtras(0)
  const [de, setDe] = useState(hoje)
  const [ate, setAte] = useState(hoje)

  const ativos = useApi<{ eventos: Evento[] }>('/v1/alertas', { refreshMs: REFRESH_MS })
  const qs = new URLSearchParams({ inicio: `${de} 00:00:00`, fim: `${ate} 23:59:59`, limite: String(LIMITE) }).toString()
  const historico = useApi<{ eventos: Evento[] }>(`/v1/eventos?${qs}`, { refreshMs: REFRESH_MS })

  const listaAtivos = ativos.data?.eventos ?? []
  const encerrados = (historico.data?.eventos ?? []).filter((e) => !e.ativo)
  const atalhoAtivo = ATALHOS.find((a) => a.de() === de && a.ate() === ate)?.label
  const periodo = de === ate ? (de === hoje ? 'de hoje' : `de ${br(de)}`) : `de ${br(de)} a ${br(ate)}`
  const erro = ativos.error || historico.error

  if (ativos.loading && historico.loading && !ativos.data && !historico.data) return <Spinner />

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h4 className="fw-medium mb-0">Alertas</h4>
        <p className="text-muted mb-0">Alertas ativos e o histórico de cada refrigerador</p>
      </div>

      {erro && (
        <Alert tone="danger">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>{erro}</span>
            <Button
              size="sm"
              variant="danger"
              outline
              onClick={() => {
                ativos.reload()
                historico.reload()
              }}
            >
              Tentar de novo
            </Button>
          </div>
        </Alert>
      )}

      <section aria-labelledby="al-ativos">
        <h5 id="al-ativos" className="mb-2 fs-6 text-uppercase text-muted">
          Ativos ({listaAtivos.length})
        </h5>
        <div className="card mb-0">
          {listaAtivos.length ? (
            <LinhaDoTempo eventos={listaAtivos} mostrarEmpresa={isMaster} vazio="" />
          ) : (
            <div className="al-vazio">
              <Icon name="circle-check" className="fs-4 text-success" />
              <span>Tudo certo. Nenhum alerta ativo agora.</span>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="al-historico">
        <div className="mb-3 d-flex flex-column flex-md-row justify-content-md-between align-items-md-end gap-3">
          <h5 id="al-historico" className="mb-0 fs-6 text-uppercase text-muted">
            <Icon name="calendar" className="me-1" />
            Histórico {periodo}
          </h5>
          <div className="al-filtros">
            {ATALHOS.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={atalhoAtivo === a.label ? 'primary' : 'light'}
                aria-pressed={atalhoAtivo === a.label}
                onClick={() => {
                  setDe(a.de())
                  setAte(a.ate())
                }}
              >
                {a.label}
              </Button>
            ))}
            <div className="al-datas">
              <input
                type="date"
                className="form-control"
                aria-label="De"
                value={de}
                max={ate}
                onChange={(e) => e.target.value && setDe(e.target.value)}
              />
              <input
                type="date"
                className="form-control"
                aria-label="Até"
                value={ate}
                min={de}
                max={hoje}
                onChange={(e) => e.target.value && setAte(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card mb-0">
          {historico.loading && !historico.data ? (
            <Spinner />
          ) : (
            <LinhaDoTempo eventos={encerrados} mostrarEmpresa={isMaster} vazio="Nenhuma ocorrência neste período." />
          )}
        </div>
        {(historico.data?.eventos.length ?? 0) >= LIMITE && (
          <p className="mt-2 mb-0 small text-muted">
            Mostrando as {LIMITE} ocorrências mais recentes do período. Reduza o intervalo de datas para ver as demais.
          </p>
        )}
      </section>
    </div>
  )
}
