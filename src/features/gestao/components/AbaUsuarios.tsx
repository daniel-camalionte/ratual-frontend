import { useState } from 'react'
import { useApi } from '@/lib/useApi'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErroLista } from './ErroLista'
import { Spinner } from '@/components/ui/Spinner'
import { DataTable, type Column } from '@/components/data/DataTable'
import { PERFIS, formatarTelefone, quando, type Empresa, type UsuarioG } from '../types'
import { UsuarioModal } from './UsuarioModal'

export function AbaUsuarios({ master }: { master: boolean }) {
  const usuarios = useApi<{ usuarios: UsuarioG[] }>('/v1/usuarios')
  const empresas = useApi<{ empresas: Empresa[] }>(master ? '/v1/empresas' : null)
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [editando, setEditando] = useState<UsuarioG | null | undefined>(undefined) // null = novo
  if (usuarios.loading && !usuarios.data) return <Spinner />
  if (usuarios.error && !usuarios.data) return <ErroLista mensagem={usuarios.error} onRetry={usuarios.reload} />

  const lista = (usuarios.data?.usuarios ?? []).filter((u) => !filtroEmpresa || u.empresa.id_empresa === Number(filtroEmpresa))
  const colunas: Column<UsuarioG>[] = [
    {
      key: 'nome',
      header: 'Usuário',
      sortable: true,
      value: (u) => `${u.nome} ${u.login}`,
      render: (u) => (
        <div className="gt-nome">
          <strong>{u.nome}</strong>
          {u.eu && <span className="text-muted">(você)</span>}
          <Badge tone={u.perfil === 'admin' ? 'primary' : 'secondary'}>{PERFIS[u.perfil]}</Badge>
          {!u.ativo && <Badge tone="secondary">Inativo</Badge>}
          <span className="text-muted w-100 text-end">{u.login}</span>
        </div>
      ),
    },
    { key: 'telefone', header: 'Telefone', value: (u) => formatarTelefone(u.telefone) || '—' },
    ...(master ? [{ key: 'empresa', header: 'Empresa', sortable: true, value: (u: UsuarioG) => u.empresa.nome }] : []),
    { key: 'ultimo', header: 'Último acesso', value: (u) => quando(u.ultimo_login) },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'end',
      value: () => '',
      render: (u) => (
        <div className="gt-actions">
          <Button size="sm" variant="primary" subtle icon="pencil" onClick={() => setEditando(u)} aria-label={`Editar ${u.nome}`}>
            Editar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <div className="gt-toolbar">
        {master && (
          <select className="form-select" aria-label="Filtrar por empresa" value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} style={{ maxWidth: '18rem' }}>
            <option value="">Todas as empresas</option>
            {(empresas.data?.empresas ?? []).map((e) => (
              <option key={e.id_empresa} value={e.id_empresa}>
                {e.nome}
              </option>
            ))}
          </select>
        )}
        <Button icon="plus" onClick={() => setEditando(null)}>
          Novo usuário
        </Button>
      </div>
      <DataTable columns={colunas} rows={lista} rowKey={(u) => u.id_usuario} caption="Usuários" emptyMessage="Nenhum usuário encontrado." />

      {editando !== undefined && (
        <UsuarioModal
          usuario={editando}
          empresas={empresas.data?.empresas ?? []}
          master={master}
          onClose={() => setEditando(undefined)}
          onSaved={() => {
            setEditando(undefined)
            usuarios.reload()
          }}
        />
      )}
    </Card>
  )
}
