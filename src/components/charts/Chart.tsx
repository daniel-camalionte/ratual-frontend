import { lazy, Suspense } from 'react'
import type { ApexOptions } from 'apexcharts'
import { Spinner } from '@/components/ui/Spinner'
import { useIsPhone } from '@/lib/useMediaQuery'
import { useThemeMode } from '@/lib/useThemeMode'

// ApexCharts e pesado: so e baixado quando um grafico aparece na tela (chunk separado).
const ReactApexChart = lazy(() => import('react-apexcharts'))

const CHART_COLORS = ['#1B84FF', '#5D87FF', '#2cd07e', '#ffae1f', '#F8285A', '#2cabe3']

type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'radar'

interface ChartProps {
  type: ChartType
  series: ApexOptions['series']
  options?: ApexOptions
  height?: number
  /** descricao curta para leitores de tela */
  label: string
}

const isCartesian = (t: ChartType) => t === 'line' || t === 'area' || t === 'bar'

/** Grafico responsivo: no celular fica mais baixo, sem rotulos rotacionados/sobrepostos e com fonte menor. */
export function Chart({ type, series, options = {}, height = 300, label }: ChartProps) {
  const phone = useIsPhone()
  const mode = useThemeMode()
  const h = phone ? Math.min(height, type === 'donut' || type === 'pie' ? 260 : 240) : height
  const font = phone ? '11px' : '12px'

  const merged: ApexOptions = {
    colors: CHART_COLORS,
    dataLabels: { enabled: false },
    grid: { borderColor: 'rgba(124,143,172,.25)', strokeDashArray: 3, padding: { left: phone ? 0 : 8, right: phone ? 8 : 12 } },
    stroke: { curve: 'smooth', width: type === 'bar' ? 0 : 2 },
    legend: { show: true, position: 'bottom', fontSize: font, itemMargin: { horizontal: 8, vertical: 2 } },
    theme: { mode },
    ...options,
    chart: {
      toolbar: { show: false },
      fontFamily: 'Poppins, sans-serif',
      animations: { enabled: false },
      background: 'transparent',
      foreColor: mode === 'dark' ? '#aab4c3' : '#7c8fac',
      parentHeightOffset: 0,
      ...options.chart,
    },
    ...(isCartesian(type)
      ? {
          xaxis: {
            ...options.xaxis,
            tooltip: { enabled: false },
            labels: { rotate: 0, rotateAlways: false, hideOverlappingLabels: true, trim: false, minHeight: 20, style: { fontSize: phone ? '10px' : font }, ...options.xaxis?.labels },
          },
          yaxis: { ...(options.yaxis as object), labels: { style: { fontSize: font }, ...(options.yaxis as { labels?: object } | undefined)?.labels } },
        }
      : {}),
  }

  return (
    <div role="img" aria-label={label}>
      <Suspense fallback={<Spinner />}>
        <ReactApexChart type={type} series={series} options={merged} height={h} width="100%" />
      </Suspense>
    </div>
  )
}
