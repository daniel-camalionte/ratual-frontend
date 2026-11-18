import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import type { Alerta } from '../types'

const VISIVEIS = 5

export function AlertsPanel({ alertas }: { alertas: Alerta[] }) {
  const [todos, setTodos] = useState(false)
  const lista = todos ? alertas : alertas.slice(0, VISIVEIS)

  return (
    <Card
      className="h-100"
      title="Alertas recentes"
      subtitle="Ativos e últimas ocorrências"
      actions={
        alertas.length > VISIVEIS && (
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" style={{ minHeight: 32 }} onClick={() => setTodos((t) => !t)} aria-expanded={todos}>
            {todos ? 'Ver menos' : 'Ver todos'}
          </button>
        )
      }
      bodyClassName="pb-2"
    >
      {alertas.length === 0 && <p className="text-muted small mb-3">Nenhum alerta ativo no momento.</p>}
      <ul className="list-unstyled mb-0 rt-alerts">
        {lista.map((a, i) => {
          const offline = a.tipo === 'offline'
          return (
            <li key={a.id} className="rt-alert-item rt-rise" style={{ ['--i' as string]: i }}>
              <span className={`rt-alert-icon ${offline ? 'is-offline' : 'is-temp'} ${a.novo ? 'rt-pulse' : ''}`}>
                <Icon name={offline ? 'wifi-off' : 'temperature-plus'} />
              </span>
              <div className="min-w-0 flex-grow-1">
                <div className="d-flex justify-content-between align-items-baseline gap-2">
                  <div className="rt-alert-title text-truncate">
                    {a.equipamento}
                    {a.cliente && <span className="text-muted fw-normal"> · {a.cliente}</span>}
                  </div>
                  <span className={`rt-alert-when ${a.novo ? 'is-new' : ''}`}>{a.quando}</span>
                </div>
                <div className="rt-alert-msg">{a.mensagem}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
