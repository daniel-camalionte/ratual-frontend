import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'

export default function UiCardsPage() {
  const [aviso, setAviso] = useState(true)
  return (
    <>
      <PageHeader title="Cards, alertas e badges" crumbs={[{ label: 'Componentes' }, { label: 'Cards' }]} />
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Card title="Card com ações" subtitle="Subtítulo opcional" actions={<Button size="sm" subtle icon="refresh">Atualizar</Button>} footer="Rodapé do card">
            Conteúdo do card.
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <div className="row g-3">
            <div className="col-6">
              <StatCard label="Usuários" value="1.248" icon="users" progress={64} />
            </div>
            <div className="col-6">
              <StatCard label="Receita" value="R$ 58 mil" icon="coin" tone="success" progress={82} />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Alertas">
            <div className="d-grid gap-2">
              <Alert tone="success">Operação concluída.</Alert>
              <Alert tone="info">Informação importante.</Alert>
              <Alert tone="warning">Atenção ao prazo.</Alert>
              <Alert tone="danger">Falha ao salvar.</Alert>
              {aviso && (
                <Alert tone="primary" onClose={() => setAviso(false)}>
                  Alerta dispensável.
                </Alert>
              )}
            </div>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Badges, avatares e progresso">
            <div className="d-flex flex-wrap gap-2 mb-3">
              {(['primary', 'secondary', 'success', 'danger', 'warning', 'info'] as const).map((t) => (
                <Badge key={t} tone={t}>
                  {t}
                </Badge>
              ))}
            </div>
            <div className="d-flex gap-2 mb-3">
              <Avatar name="Ana Souza" />
              <Avatar name="Bruno Lima" size={48} />
              <Avatar name="Carla" size={32} />
            </div>
            <div className="d-grid gap-3">
              <ProgressBar value={25} label="25%" />
              <ProgressBar value={60} tone="success" label="60%" height={10} />
              <ProgressBar value={90} tone="danger" label="90%" height={14} />
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
