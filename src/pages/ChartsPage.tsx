import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Chart } from '@/components/charts/Chart'

const CATS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']

export default function ChartsPage() {
  return (
    <>
      <PageHeader title="Gráficos" crumbs={[{ label: 'Gráficos' }]} />
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Card title="Linha">
            <Chart
              type="line"
              label="Gráfico de linha: vendas e metas por mês"
              series={[
                { name: 'Vendas', data: [10, 41, 35, 51, 49, 62] },
                { name: 'Meta', data: [20, 30, 40, 45, 50, 60] },
              ]}
              options={{ xaxis: { categories: CATS } }}
            />
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Barras">
            <Chart
              type="bar"
              label="Gráfico de barras: pedidos por mês"
              series={[{ name: 'Pedidos', data: [44, 55, 41, 67, 22, 43] }]}
              options={{ xaxis: { categories: CATS }, plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } } }}
            />
          </Card>
        </div>
        <div className="col-12 col-lg-4">
          <Card title="Pizza">
            <Chart type="pie" label="Gráfico de pizza: participação por região" series={[44, 55, 13, 33]} options={{ labels: ['Sul', 'Sudeste', 'Norte', 'Nordeste'] }} />
          </Card>
        </div>
        <div className="col-12 col-lg-4">
          <Card title="Rosca">
            <Chart type="donut" label="Gráfico de rosca: status dos pedidos" series={[60, 25, 15]} options={{ labels: ['Pago', 'Pendente', 'Cancelado'], stroke: { width: 0 } }} />
          </Card>
        </div>
        <div className="col-12 col-lg-4">
          <Card title="Radial">
            <Chart type="radialBar" label="Gráfico radial: meta atingida" series={[76]} options={{ labels: ['Meta'] }} />
          </Card>
        </div>
      </div>
    </>
  )
}
