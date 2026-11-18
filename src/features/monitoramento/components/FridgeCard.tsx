import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { fmtTemp } from '../dados'
import type { Refrigerador, StatusRefrigerador } from '../types'

const STATUS: Record<StatusRefrigerador, { label: string; tone: 'success' | 'warning' | 'danger'; strip: 'primary' | 'warning' | 'body-color' }> = {
  normal: { label: 'Normal', tone: 'success', strip: 'primary' },
  alerta: { label: 'Alerta', tone: 'warning', strip: 'warning' },
  offline: { label: 'Sem leitura', tone: 'danger', strip: 'body-color' },
}

const clamp = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Card discreto (padrão "weather card" do MaterialPro): faixa de cabeçalho em tom claro (nome + modelo),
 * ícone redondo, temperatura em destaque com o estado embaixo, e o compressor como segundo dado.
 * Com `to`, o card inteiro vira link para o detalhe (stretched-link no nome).
 */
export function FridgeCard({ r, index = 0, to }: { r: Refrigerador; index?: number; to?: string }) {
  const status = r.status
  const s = STATUS[status]
  const online = r.online && r.temperatura !== null
  const { min, max } = r.faixa
  const temFaixa = min !== null && max !== null && max > min
  const pos = online && temFaixa ? clamp((r.temperatura! - min) / (max - min)) : 0.5
  const fora = online && status === 'alerta'

  return (
    <article
      className={`card rt-fridge rt-rise h-100 mb-0 is-${status}`}
      style={{ '--rt-tone': `var(--bs-${s.tone})`, '--rt-strip': `var(--bs-${s.strip})`, '--i': index } as CSSProperties}
      aria-label={`${r.nome}: ${status === 'offline' ? 'Offline' : s.label}`}
    >
      <div className="card-body">
        <header className="rt-fridge-head">
          <h3 className="rt-fridge-name">
            {to ? (
              <Link to={to} className="text-reset text-decoration-none stretched-link">
                {r.nome}
              </Link>
            ) : (
              r.nome
            )}
          </h3>
          <span className="rt-fridge-meta">
            {r.tipo === 'congelado' ? 'Congelados' : 'Resfriados'}
            {r.modelo && ` · ${r.modelo}`}
          </span>
        </header>

        <div className="rt-fridge-main">
          <span className="rt-fridge-icon" aria-hidden="true">
            <Icon name={r.tipo === 'congelado' ? 'snowflake' : 'temperature'} />
          </span>
          <div className="min-w-0">
            <div className="rt-fridge-temp">
              {online ? fmtTemp(r.temperatura) : <span aria-hidden="true">--</span>} <small>°C</small>
            </div>
            <div className="rt-fridge-state">{s.label}</div>
          </div>
          <div className="rt-fridge-stat">
            <div className="rt-fridge-stat-v">{r.compressorLigado === null ? '--' : r.compressorLigado ? 'Ligado' : 'Desligado'}</div>
            <div className="rt-fridge-stat-l">Compressor</div>
          </div>
        </div>

        <div
          className="rt-range"
          role="img"
          aria-label={online ? `Temperatura ${fmtTemp(r.temperatura)} °C${temFaixa ? `, faixa ideal ${min} a ${max} °C` : ''}` : 'Sem leitura'}
        >
          <span className="rt-range-band" />
          {online && temFaixa && <span className={`rt-range-marker ${fora ? 'rt-pulse' : ''}`} style={{ left: `${pos * 100}%` }} />}
        </div>
        <div className="rt-range-labels">
          <span>{temFaixa ? `${min}°` : ''}</span>
          <span>{temFaixa ? 'faixa ideal' : 'sem faixa ideal'}</span>
          <span>{temFaixa ? `${max}°` : ''}</span>
        </div>
      </div>
    </article>
  )
}
