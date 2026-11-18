import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { DataTable, type Column } from '@/components/data/DataTable'
import type { DispositivoG, Empresa } from '../types'
import { ErroLista } from './ErroLista'

type Filtro = 'todos' | 'sem' | 'inativos'

/** Vínculo refrigerador -> empresa e ativação (master). A faixa ideal é editada no detalhe do refrigerador. */
export function AbaRefrigeradores() {
  const disp = useApi<{ dispositivos: DispositivoG[] }>('/v1/dispositivos?todos=1')
  const empresas = useApi<{ empresas: Empresa[] }>('/v1/empresas')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [salvando, setSalvando] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tom: 'success' | 'danger'; texto: string } | null>(null)
  const [desativando, setDesativando] = useState<DispositivoG | null>(null)
  const clientes = (empresas.data?.empresas ?? []).filter((e) => e.tipo === 'cliente' && e.ativo)

  const salvar = async (d: DispositivoG, body: Record<string, unknown>, texto: string) => {
    setSalvando(d.deviceid)
    setMsg(null)
    try {
      await api.put(`/v1/dispositivos/${encodeURIComponent(d.deviceid)}`, body)
      setMsg({ tom: 'success', texto: `${d.nome}: ${texto}` })
      disp.reload()
    } catch (e) {
      setMsg({ tom: 'danger', texto: e instanceof ApiError ? e.message : 'Não foi possível salvar.' })
    } finally {
      setSalvando(null)
      setDesativando(null)
    }
  }

  if ((disp.loading && !disp.data) || (empresas.loading && !empresas.data)) return <Spinner />
  if (disp.error && !disp.data) return <ErroLista mensagem={disp.error} onRetry={disp.reload} />

  const todos = disp.data?.dispositivos ?? []
  const sem = todos.filter((d) => !d.empresa && d.ativo).length
  const lista = todos.filter((d) => (filtro === 'todos' ? true : filtro === 'sem' ? !d.empresa && d.ativo : !d.ativo))
  const chips: [Filtro, string][] = [['todos', 'Todos'], ['sem', `Sem empresa (${sem})`], ['inativos', 'Desativados']]

  const colunas: Column<DispositivoG>[] = [
    {
      key: 'nome',
      header: 'Refrigerador',
      sortable: true,
      value: (d) => `${d.nome} ${d.deviceid}`,
      render: (d) => (
        <div className="gt-nome">
          <strong>{d.nome}</strong>
          {!d.ativo && <Badge tone="secondary">Desativado</Badge>}
          {d.ativo && !d.empresa && <Badge tone="warning">Sem empresa</Badge>}
          <span className="text-muted w-100 text-end">
            {d.modelo ? `${d.modelo} · ` : ''}ID {d.deviceid} · {d.online ? 'online' : 'offline'}
          </span>
        </div>
      ),
    },
    {
      key: 'empresa',
      header: 'Empresa',
      value: (d) => d.empresa?.nome ?? '',
      render: (d) => (
        <select
          className="form-select gt-vinculo"
          aria-label={`Empresa de ${d.nome}`}
          value={d.empresa?.id_empresa ?? ''}
          disabled={salvando === d.deviceid || !d.ativo}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null
            const nome = clientes.find((c) => c.id_empresa === id)?.nome
            void salvar(d, { id_empresa: id }, id ? `vinculado a ${nome}` : 'sem empresa')
          }}
        >
          <option value="">Sem empresa</option>
          {clientes.map((c) => (
            <option key={c.id_empresa} value={c.id_empresa}>
              {c.nome}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'end',
      value: () => '',
      render: (d) => (
        <div className="gt-actions">
          <Button
            size="sm"
            variant={d.ativo ? 'danger' : 'success'}
            subtle
            disabled={salvando === d.deviceid}
            onClick={() => (d.ativo ? setDesativando(d) : void salvar(d, { ativo: true }, 'reativado'))}
            aria-label={`${d.ativo ? 'Desativar' : 'Reativar'} ${d.nome}`}
          >
            {d.ativo ? 'Desativar' : 'Reativar'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <div className="gt-chips" role="group" aria-label="Filtro">
        {chips.map(([v, l]) => (
          <button key={v} type="button" className={`btn btn-sm ${filtro === v ? 'btn-primary' : 'btn-outline-secondary'}`} aria-pressed={filtro === v} onClick={() => setFiltro(v)}>
            {l}
          </button>
        ))}
      </div>
      <p className="text-muted small">
        Refrigeradores novos aparecem sozinhos (pela coleta) como &quot;sem empresa&quot;. Vincule ao cliente para ele passar a ver. A faixa ideal é editada no detalhe de cada refrigerador.
      </p>
      {msg && (
        <Alert tone={msg.tom} onClose={() => setMsg(null)}>
          {msg.texto}
        </Alert>
      )}
      <DataTable columns={colunas} rows={lista} rowKey={(d) => d.deviceid} caption="Refrigeradores" emptyMessage="Nenhum refrigerador neste filtro." />
      {desativando && (
        <Modal show title="Desativar refrigerador?" onClose={() => setDesativando(null)} onConfirm={() => void salvar(desativando, { ativo: false }, 'desativado')} confirmLabel="Desativar" confirmVariant="danger" loading={salvando === desativando.deviceid}>
          <p>
            <strong>{desativando.nome}</strong> deixa de ser coletado e some para o cliente. Você pode reativar depois.
          </p>
        </Modal>
      )}
    </Card>
  )
}
