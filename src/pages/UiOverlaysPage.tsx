import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/ui/PageHeader'

export default function UiOverlaysPage() {
  const [aberto, setAberto] = useState(false)
  const [excluir, setExcluir] = useState(false)

  return (
    <>
      <PageHeader title="Modais e abas" crumbs={[{ label: 'Componentes' }, { label: 'Modais e abas' }]} />
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Card title="Modais">
            <div className="d-flex gap-2">
              <Button onClick={() => setAberto(true)}>Abrir modal</Button>
              <Button variant="danger" outline onClick={() => setExcluir(true)}>
                Confirmar exclusão
              </Button>
            </div>
            <Modal show={aberto} title="Exemplo de modal" onClose={() => setAberto(false)} onConfirm={() => setAberto(false)} confirmLabel="Salvar">
              Conteúdo do modal. Foco preso, ESC fecha, acessível por padrão (react-bootstrap).
            </Modal>
            <Modal show={excluir} title="Excluir registro" onClose={() => setExcluir(false)} onConfirm={() => setExcluir(false)} confirmLabel="Excluir" confirmVariant="danger">
              Esta ação não pode ser desfeita.
            </Modal>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Abas">
            <Tabs
              items={[
                { key: 'perfil', label: 'Perfil', content: 'Conteúdo da aba Perfil.' },
                { key: 'atividade', label: 'Atividade', content: 'Conteúdo da aba Atividade.' },
                { key: 'config', label: 'Configurações', content: 'Conteúdo da aba Configurações.' },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  )
}
