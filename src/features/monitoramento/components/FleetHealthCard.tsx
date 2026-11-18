import type { ApexOptions } from 'apexcharts'
import { Card } from '@/components/ui/Card'
import { Chart } from '@/components/charts/Chart'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCountUp } from '@/lib/useCountUp'
import type { Kpis } from '../types'

/** Gauge radial com a % de equipamentos dentro da faixa + distribuição por status. */
export function FleetHealthCard({ kpis }: { kpis: Kpis }) {
  const pct = kpis.total ? Math.round((kpis.normais / kpis.total) * 100) : 0
  const shown = useCountUp(pct)

  const options: ApexOptions = {
    colors: ['#1B84FF'],
    chart: { animations: { enabled: true, speed: 1000, dynamicAnimation: { enabled: true, speed: 600 } } },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: '64%' },
        track: { background: 'rgba(124,143,172,.16)', strokeWidth: '100%' },
        dataLabels: {
          name: { offsetY: 22, fontSize: '12px', color: '#7c8fac' },
          value: { offsetY: -16, fontSize: '34px', fontWeight: 600, formatter: (v: number) => `${Math.round(v)}%` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', gradientToColors: ['#2cd07e'], stops: [0, 100] } },
    stroke: { lineCap: 'round' },
    labels: ['dentro da faixa'],
    legend: { show: false },
  }

  const linhas = [
    { rotulo: 'Normais', valor: kpis.normais, tom: 'success' as const },
    { rotulo: 'Em alerta', valor: kpis.alertas, tom: 'warning' as const },
    { rotulo: 'Offline', valor: kpis.offline, tom: 'danger' as const },
  ]

  return (
    <Card className="flex-grow-1" title="Saúde da frota" subtitle="Equipamentos dentro da faixa ideal">
      <div aria-live="polite" className="visually-hidden">{`${shown}% da frota dentro da faixa ideal`}</div>
      <Chart type="radialBar" label={`Gauge: ${pct}% da frota dentro da faixa ideal`} series={[pct]} options={options} height={230} />
      <ul className="list-unstyled mb-0 d-grid gap-2">
        {linhas.map((l) => (
          <li key={l.rotulo}>
            <div className="d-flex justify-content-between small mb-1">
              <span>{l.rotulo}</span>
              <span className="fw-semibold">{l.valor}</span>
            </div>
            <ProgressBar value={kpis.total ? (l.valor / kpis.total) * 100 : 0} tone={l.tom} label={l.rotulo} height={6} />
          </li>
        ))}
      </ul>
    </Card>
  )
}
