import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, type Column } from '@/components/data/DataTable'
import { formatBRL } from '@/lib/format'

interface Produto {
  sku: string
  nome: string
  categoria: string
  estoque: number
  preco: number
}

const CATEGORIAS = ['Software', 'Serviço', 'Hardware', 'Suporte']
// Dados gerados so para demonstrar ordenacao/busca/paginacao.
const PRODUTOS: Produto[] = Array.from({ length: 47 }, (_, i) => ({
  sku: `SKU-${String(i + 1).padStart(4, '0')}`,
  nome: `Produto ${i + 1}`,
  categoria: CATEGORIAS[i % CATEGORIAS.length] ?? 'Software',
  estoque: (i * 7) % 40,
  preco: 49.9 + i * 13.37,
}))

const COLUNAS: Column<Produto>[] = [
  { key: 'sku', header: 'SKU', sortable: true },
  { key: 'nome', header: 'Nome', sortable: true },
  { key: 'categoria', header: 'Categoria', sortable: true },
  {
    key: 'estoque',
    header: 'Estoque',
    align: 'end',
    sortable: true,
    render: (p) => (p.estoque === 0 ? <Badge tone="danger">Sem estoque</Badge> : p.estoque < 10 ? <Badge tone="warning">{p.estoque}</Badge> : p.estoque),
  },
  { key: 'preco', header: 'Preço', align: 'end', sortable: true, render: (p) => formatBRL(p.preco) },
]

export default function TablesPage() {
  return (
    <>
      <PageHeader title="Tabelas" crumbs={[{ label: 'Tabelas' }]} />
      <Card title="Produtos" subtitle="Busca, ordenação e paginação (sem jQuery/DataTables)">
        <DataTable columns={COLUNAS} rows={PRODUTOS} rowKey={(p) => p.sku} pageSize={10} caption="Lista de produtos" />
      </Card>
    </>
  )
}
