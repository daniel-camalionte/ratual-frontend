import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { FridgeCard } from '@/features/monitoramento/components/FridgeCard'
import { useRefrigeradores } from '@/features/monitoramento/useMonitoramento'
import type { StatusRefrigerador } from '@/features/monitoramento/types'
import '@/features/monitoramento/monitoramento.css'

type Filtro = 'todos' | StatusRefrigerador
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'normal', label: 'Normais' },
  { id: 'alerta', label: 'Em alerta' },
  { id: 'offline', label: 'Offline' },
]

export default function RefrigeradoresPage() {
  const { refrigeradores, loading, error, reload } = useRefrigeradores()
  const [params, setParams] = useSearchParams()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const busca = params.get('q') ?? ''

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return refrigeradores.filter((r) => (filtro === 'todos' || r.status === filtro) && (!termo || r.nome.toLowerCase().includes(termo)))
  }, [refrigeradores, filtro, busca])

  const contagem = (id: Filtro) => (id === 'todos' ? refrigeradores.length : refrigeradores.filter((r) => r.status === id).length)

  return (
    <>
      <div className="mb-3">
        <h4 className="fw-medium mb-0">Refrigeradores</h4>
        <p className="text-muted small mb-0">{refrigeradores.length} equipamentos monitorados</p>
      </div>

      <div className="row g-3 mb-3 align-items-center">
        <div className="col-12 col-md-5 col-xl-4">
          <input
            type="search"
            className="form-control"
            placeholder="Buscar por nome..."
            aria-label="Buscar refrigerador"
            value={busca}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          />
        </div>
        <div className="col-12 col-md-7 col-xl-8">
          <div className="rt-chips" role="group" aria-label="Filtrar por situação">
            {FILTROS.map((f) => (
              <button key={f.id} type="button" className={`btn btn-sm ${filtro === f.id ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
                {f.label}
                <span className="opacity-75 ms-1">{contagem(f.id)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Alert tone="danger">
          {error}{' '}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={reload}>
            Tentar novamente
          </button>
        </Alert>
      )}
      {loading && <Spinner />}

      <div className="row g-3">
        {lista.map((r, i) => (
          <div key={r.id} className="col-12 col-md-6 col-xl-4">
            <FridgeCard r={r} index={i} to={`/refrigeradores/${encodeURIComponent(r.id)}`} />
          </div>
        ))}
      </div>

      {!loading && !error && lista.length === 0 && <p className="text-muted text-center py-5">Nenhum refrigerador encontrado com esse filtro.</p>}
    </>
  )
}
