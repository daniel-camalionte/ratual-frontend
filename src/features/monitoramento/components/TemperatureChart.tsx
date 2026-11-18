import { useMemo, useState } from 'react'
import type { ApexOptions } from 'apexcharts'
import { Card } from '@/components/ui/Card'
import { Chart } from '@/components/charts/Chart'
import type { SeriesTemperatura } from '../types'

const CIANO = '#43CED7'
const ROXO = '#7460EE'
const RANGES = [
  { label: '6 h', horas: 6 },
  { label: '12 h', horas: 12 },
  { label: '24 h', horas: 24 },
] as const

const fmt = (v: number) => v.toFixed(1).replace('.', ',')

export function TemperatureChart({ serie }: { serie: SeriesTemperatura }) {
  const [horas, setHoras] = useState<number>(24)
  const series = useMemo(() => {
    // janela relativa ao último ponto recebido (a coleta pode atrasar)
    const fim = Math.max(serie.congelados.at(-1)?.[0] ?? 0, serie.resfriados.at(-1)?.[0] ?? 0)
    const corte = fim - horas * 3_600_000
    return [
      { name: 'Congelados', data: serie.congelados.filter((p) => p[0] >= corte) },
      { name: 'Resfriados', data: serie.resfriados.filter((p) => p[0] >= corte) },
    ]
  }, [serie, horas])
  const vazio = !series.some((s) => s.data.some((p) => p[1] !== null))

  const options: ApexOptions = {
    colors: [CIANO, ROXO],
    chart: {
      zoom: { enabled: false },
      animations: { enabled: true, speed: 900, animateGradually: { enabled: true, delay: 40 }, dynamicAnimation: { enabled: true, speed: 450 } },
    },
    stroke: { curve: 'smooth', width: 2.2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.02, stops: [0, 90, 100] } },
    legend: { show: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: 'datetime',
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 5,
      labels: { datetimeUTC: false, format: 'HH:mm' },
      crosshairs: { stroke: { color: '#7c8fac', dashArray: 4 } },
    },
    yaxis: { labels: { formatter: (v: number) => `${Math.round(v)}°` } },
    tooltip: {
      shared: true,
      intersect: false,
      x: { format: 'dd/MM HH:mm' },
      y: { formatter: (v: number) => `${fmt(v)} °C` },
    },
  }

  return (
    <Card
      className="h-100"
      title="Temperatura média"
      subtitle="Últimas horas · aparelhos online"
      actions={
        <div className="btn-group btn-group-sm flex-nowrap" role="group" aria-label="Período do gráfico">
          {RANGES.map((r) => (
            <button
              key={r.horas}
              type="button"
              className={`btn text-nowrap ${horas === r.horas ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ minHeight: 32 }}
              aria-pressed={horas === r.horas}
              onClick={() => setHoras(r.horas)}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="d-flex flex-wrap column-gap-3 row-gap-1 mb-2 small" aria-hidden="true">
        <span className="d-inline-flex align-items-center gap-1 text-nowrap">
          <span className="rt-legend-dot" style={{ background: CIANO }} /> Congelados
        </span>
        <span className="d-inline-flex align-items-center gap-1 text-nowrap">
          <span className="rt-legend-dot" style={{ background: ROXO }} /> Resfriados
        </span>
      </div>
      {vazio ? (
        <p className="text-muted text-center py-5 mb-0">Sem leituras neste período.</p>
      ) : (
        <Chart type="area" label="Gráfico de área: temperatura média dos refrigeradores Congelados e Resfriados nas últimas horas" series={series} options={options} height={340} />
      )}
    </Card>
  )
}
