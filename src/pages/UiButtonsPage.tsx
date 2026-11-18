import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'

const VARIANTS = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark'] as const

export default function UiButtonsPage() {
  const [loading, setLoading] = useState(false)
  const simular = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1200)
  }

  return (
    <>
      <PageHeader title="Botões" crumbs={[{ label: 'Componentes' }, { label: 'Botões' }]} />
      <div className="row g-3">
        <div className="col-12">
          <Card title="Variantes">
            <div className="d-flex flex-wrap gap-2">
              {VARIANTS.map((v) => (
                <Button key={v} variant={v}>
                  {v}
                </Button>
              ))}
            </div>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Contorno">
            <div className="d-flex flex-wrap gap-2">
              {VARIANTS.map((v) => (
                <Button key={v} variant={v} outline>
                  {v}
                </Button>
              ))}
            </div>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Suave (subtle)">
            <div className="d-flex flex-wrap gap-2">
              {VARIANTS.slice(0, 6).map((v) => (
                <Button key={v} variant={v} subtle>
                  {v}
                </Button>
              ))}
            </div>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Tamanhos e ícones">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <Button size="sm" icon="plus">
                Pequeno
              </Button>
              <Button icon="download">Normal</Button>
              <Button size="lg" icon="send">
                Grande
              </Button>
            </div>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Estados">
            <div className="d-flex flex-wrap gap-2">
              <Button disabled>Desabilitado</Button>
              <Button loading={loading} onClick={simular}>
                {loading ? 'Salvando' : 'Clique para carregar'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
