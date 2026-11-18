import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/lib/auth'
import { horario } from '@/features/monitoramento/dados'
import { useMonitoramento } from '@/features/monitoramento/useMonitoramento'
import { KpiCard } from '@/features/monitoramento/components/KpiCard'
import { TemperatureChart } from '@/features/monitoramento/components/TemperatureChart'
import { AlertsPanel } from '@/features/monitoramento/components/AlertsPanel'
import { FridgeCard } from '@/features/monitoramento/components/FridgeCard'
import { CompressorChart } from '@/features/monitoramento/components/CompressorChart'
import { FleetHealthCard } from '@/features/monitoramento/components/FleetHealthCard'

const VISIVEIS = 6

function saudacao(d: Date): string {
  const h = d.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { refrigeradores, serie, alertas, compressores, kpis, ultimaLeitura, loading, error, atualizar } = useMonitoramento()
  const [todos, setTodos] = useState(false)
  const [girando, setGirando] = useState(false)

  const agora = new Date()
  const lista = todos ? refrigeradores : refrigeradores.slice(0, VISIVEIS)
  const data = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(agora)

  const handleAtualizar = () => {
    setGirando(true)
    atualizar()
    window.setTimeout(() => setGirando(false), 900)
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div className="min-w-0">
          <h4 className="fw-medium mb-0 text-truncate">
            {saudacao(agora)}, {user?.nome ?? ''}
          </h4>
          <p className="text-muted small mb-0">
            {data} · <span className="rt-live">{ultimaLeitura ? `última leitura ${horario(ultimaLeitura)}` : 'aguardando leitura'}</span>
          </p>
        </div>
        <Button variant="light" size="sm" icon="refresh" onClick={handleAtualizar} className={`flex-shrink-0 ${girando ? 'rt-spin' : ''}`} aria-label="Atualizar dados">
          <span className="d-none d-sm-inline">Atualizar</span>
        </Button>
      </div>

      {error && (
        <Alert tone="danger">
          {error}{' '}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={atualizar}>
            Tentar novamente
          </button>
        </Alert>
      )}
      {loading && <Spinner />}

      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard index={0} label="Refrigeradores" value={kpis.total} sub={`${kpis.compressoresLigados} compressores ligados`} icon="fridge" tone="primary" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard index={1} label="Normais" value={kpis.normais} sub="dentro da faixa ideal" icon="circle-check" tone="success" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard index={2} label="Em alerta" value={kpis.alertas} sub="fora da faixa ideal" icon="alert-triangle" tone="warning" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard index={3} label="Offline" value={kpis.offline} sub="sem comunicação" icon="wifi-off" tone="danger" />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-8">
          <TemperatureChart serie={serie} />
        </div>
        <div className="col-12 col-xl-4">
          <AlertsPanel alertas={alertas} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="d-flex align-items-end justify-content-between mb-2">
            <div>
              <h5 className="mb-0">Refrigeradores</h5>
              <small className="text-muted">Leitura a cada 5 minutos</small>
            </div>
            {refrigeradores.length > VISIVEIS ? (
              <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" style={{ minHeight: 32 }} onClick={() => setTodos((t) => !t)} aria-expanded={todos}>
                {todos ? 'Ver menos' : `Ver todos (${refrigeradores.length})`} <i className="ti ti-arrow-right" aria-hidden="true" />
              </button>
            ) : (
              <Link to="/refrigeradores" className="btn btn-link btn-sm p-0 text-decoration-none" style={{ minHeight: 32 }}>
                Abrir lista <i className="ti ti-arrow-right" aria-hidden="true" />
              </Link>
            )}
          </div>
          {!loading && refrigeradores.length === 0 && !error && <p className="text-muted">Nenhum refrigerador cadastrado para a sua empresa.</p>}
          <div className="row g-3">
            {lista.map((r, i) => (
              <div key={r.id} className="col-12 col-md-6">
                <FridgeCard r={r} index={i} to={`/refrigeradores/${encodeURIComponent(r.id)}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <div className="d-flex flex-column gap-3 h-100">
            <CompressorChart dados={compressores} />
            <FleetHealthCard kpis={kpis} />
          </div>
        </div>
      </div>
    </>
  )
}
