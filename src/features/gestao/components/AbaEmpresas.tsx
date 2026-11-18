import { useState } from 'react'
import { useApi } from '@/lib/useApi'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { DataTable, type Column } from '@/components/data/DataTable'
import type { Empresa, PlanoOpcao } from '../types'
import { EmpresaModal } from './EmpresaModal'
import { ErroLista } from './ErroLista'

export function AbaEmpresas() {
  const empresas = useApi<{ empresas: Empresa[] }>('/v1/empresas')
  const planos = useApi<{ planos: PlanoOpcao[] }>('/v1/planos')
  const [editando, setEditando] = useState<Empresa | null | undefined>(undefined)

  if (empresas.loading && !empresas.data) return <Spinner />
  if (empresas.error && !empresas.data) return <ErroLista mensagem={empresas.error} onRetry={empresas.reload} />

  const colunas: Column<Empresa>[] = [
    {
      key: 'nome',
      header: 'Empresa',
      sortable: true,
      render: (e) => (
        <div className="gt-nome">
          <strong>{e.nome}</strong>
          {e.tipo === 'master' && <Badge tone="primary">Master</Badge>}
          {!e.ativo && <Badge tone="secondary">Inativa</Badge>}
          {e.plano && <Badge tone="success">{e.plano.nome}</Badge>}
        </div>
      ),
    },
    { key: 'documento', header: 'CNPJ', value: (e) => e.documento ?? '—' },
    { key: 'usuarios', header: 'Usuários', sortable: true, align: 'end' },
    { key: 'dispositivos', header: 'Refrigeradores', sortable: true, align: 'end' },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'end',
      value: () => '',
      render: (e) => (
        <div className="gt-actions">
          <Button size="sm" variant="primary" subtle icon="pencil" onClick={() => setEditando(e)} aria-label={`Editar ${e.nome}`}>
            Editar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <div className="gt-toolbar">
        <span />
        <Button icon="plus" onClick={() => setEditando(null)}>
          Nova empresa
        </Button>
      </div>
      <DataTable columns={colunas} rows={empresas.data?.empresas ?? []} rowKey={(e) => e.id_empresa} caption="Empresas" emptyMessage="Nenhuma empresa encontrada." />
      {editando !== undefined && (
        <EmpresaModal
          empresa={editando}
          planos={planos.data?.planos ?? []}
          onClose={() => setEditando(undefined)}
          onSaved={() => {
            setEditando(undefined)
            empresas.reload()
          }}
        />
      )}
    </Card>
  )
}
