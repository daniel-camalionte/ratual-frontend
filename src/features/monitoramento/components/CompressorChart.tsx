import type { ApexOptions } from 'apexcharts'
import { Card } from '@/components/ui/Card'
import { Chart } from '@/components/charts/Chart'
import { Icon } from '@/components/ui/Icon'
import { useCountUp } from '@/lib/useCountUp'
import type { PontoCompressor } from '../types'

export function CompressorChart({ dados }: { dados: PontoCompressor[] }) {
  const hoje = dados[dados.length - 1]?.percentual ?? 0
  const shown = useCountUp(hoje)
  const cores = dados.map((_, i) => (i === dados.length - 1 ? '#0FA6D6' : '#BDE9F6'))

  const options: ApexOptions = {
    colors: cores,
    chart: { animations: { enabled: true, speed: 800, animateGradually: { enabled: true, delay: 80 } } },
    plotOptions: { bar: { distributed: true, borderRadius: 8, borderRadiusApplication: 'end', columnWidth: '58%' } },
    legend: { show: false },
    xaxis: { categories: dados.map((d) => d.dia), axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, max: 100, tickAmount: 4, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
    states: { hover: { filter: { type: 'darken' } } },
    tooltip: { y: { formatter: (v: number) => `${v}% do tempo ligado` } },
  }

  return (
    <Card
      title="Compressores"
      subtitle="% do tempo ligado por dia · média dos aparelhos"
      actions={
        <span className="rt-bubble bg-primary-subtle text-primary" aria-hidden="true">
          <Icon name="bolt" />
        </span>
      }
    >
      <div className="d-flex align-items-baseline gap-2 mb-1">
        <span className="rt-big">{shown}%</span>
        <span className="text-muted small">do tempo ligado hoje</span>
      </div>
      {dados.length === 0 ? (
        <p className="text-muted text-center py-5 mb-0">Sem leituras no período.</p>
      ) : (
        <Chart type="bar" label="Gráfico de barras: percentual do tempo de compressor ligado nos últimos 7 dias" series={[{ name: 'Tempo ligado', data: dados.map((d) => d.percentual) }]} options={options} height={220} />
      )}
    </Card>
  )
}
