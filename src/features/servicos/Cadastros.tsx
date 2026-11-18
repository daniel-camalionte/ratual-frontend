import { useState, type ReactNode } from 'react'
import { useForm, useWatch, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodType } from 'zod'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { CheckField, TextField } from '@/components/forms/Fields'
import { Chip, ModalTela } from './ModalTela'
import { useEnvio } from './useEnvio'
import {
  bloqueioSchema, janelaSchema, planoSchema, tecnicoSchema, tipoSchema,
  type BloqueioForm, type JanelaForm,
} from './schemas'
import { DIAS_SEMANA, diaLongo, parseNum, pct, reais, type Bloqueio, type Janela, type Plano, type Tecnico, type TipoServico } from './servicos'

// ── cadastro genérico (tipos de serviço, técnicos, planos) ────────────────────

interface CampoSpec {
  name: string
  label: string
  kind: 'text' | 'money' | 'int' | 'bool'
  hint?: string
  placeholder?: string
}

interface Spec<T> {
  url: string
  chaveLista: string
  id: (item: T) => number
  nome: string // "tipo de serviço"
  artigo: 'o' | 'a'
  campos: CampoSpec[]
  schema: ZodType<FieldValues>
  inicial: (item: T | null) => FieldValues
  corpo: (v: FieldValues) => Record<string, unknown>
  linha: (item: T) => { titulo: string; detalhe: string; selos?: ReactNode }
  ativo: (item: T) => boolean
}

const txt = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const nulo = (s: string) => (s.trim() === '' ? null : s.trim())
const numOuNulo = (s: string) => (s.trim() === '' ? null : parseNum(s))
const intOuNulo = (s: string) => (s.trim() === '' ? null : Number.parseInt(s, 10))

function CadastroModal<T>({ spec, item, onClose, onSalvo }: { spec: Spec<T>; item: T | null; onClose: () => void; onSalvo: () => void }) {
  const { busy, erro, run } = useEnvio()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({ resolver: zodResolver(spec.schema as ZodType<FieldValues, FieldValues>), defaultValues: spec.inicial(item) })

  const salvar = handleSubmit(async (v) => {
    const ok = await run(async () => {
      if (item) await api.put(`${spec.url}/${spec.id(item)}`, spec.corpo(v))
      else await api.post(spec.url, spec.corpo(v))
    })
    if (ok) onSalvo()
  })

  return (
    <ModalTela
      title={item ? `Editar ${spec.nome}` : `${spec.artigo === 'o' ? 'Novo' : 'Nova'} ${spec.nome}`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={busy}>
            {item ? 'Salvar' : 'Criar'}
          </Button>
        </>
      }
    >
      <form onSubmit={salvar} noValidate>
        {spec.campos.map((c) => {
          const msg = errors[c.name]?.message as string | undefined
          if (c.kind === 'bool')
            return (
              <div key={c.name} className="mb-2">
                <CheckField kind="switch" label={c.label} {...register(c.name)} />
                {c.hint && <div className="form-text mt-0 mb-2">{c.hint}</div>}
              </div>
            )
          return (
            <TextField
              key={c.name}
              label={c.label}
              hint={c.hint}
              placeholder={c.placeholder}
              inputMode={c.kind === 'money' ? 'decimal' : c.kind === 'int' ? 'numeric' : undefined}
              error={msg}
              {...register(c.name)}
            />
          )
        })}
        {erro && <Alert tone="danger">{erro}</Alert>}
      </form>
    </ModalTela>
  )
}

function ListaCadastro<T>({ spec, descricao }: { spec: Spec<T>; descricao: string }) {
  const dados = useApi<Record<string, T[]>>(spec.url)
  const [editando, setEditando] = useState<T | null | undefined>(undefined)
  if (dados.loading && !dados.data) return <Spinner />
  if (dados.error) return <Alert tone="danger">{dados.error}</Alert>
  const lista = dados.data?.[spec.chaveLista] ?? []

  return (
    <div>
      <div className="sv-toolbar">
        <p className="small text-muted mb-0">{descricao}</p>
        <Button icon="plus" onClick={() => setEditando(null)}>
          {spec.artigo === 'o' ? 'Novo' : 'Nova'} {spec.nome}
        </Button>
      </div>
      <Card bodyClassName="p-0">
        {lista.length ? (
          <ul className="list-unstyled mb-0 sv-lista">
            {lista.map((item) => {
              const l = spec.linha(item)
              return (
                <li key={spec.id(item)} className={`sv-item sv-item-static ${spec.ativo(item) ? '' : 'is-inativo'}`}>
                  <div className="min-w-0 flex-grow-1">
                    <p className="fw-semibold mb-0 d-flex flex-wrap align-items-center gap-1">
                      {l.titulo}
                      {!spec.ativo(item) && <Badge tone="secondary">Inativo</Badge>}
                      {l.selos}
                    </p>
                    <p className="small text-muted mb-0">{l.detalhe}</p>
                  </div>
                  <Button variant="light" icon="pencil" aria-label={`Editar ${l.titulo}`} onClick={() => setEditando(item)} />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-center text-muted py-4 mb-0">Nenhum {spec.nome} cadastrado.</p>
        )}
      </Card>
      {editando !== undefined && (
        <CadastroModal
          spec={spec}
          item={editando}
          onClose={() => setEditando(undefined)}
          onSalvo={() => {
            setEditando(undefined)
            dados.reload()
          }}
        />
      )}
    </div>
  )
}

const TIPOS: Spec<TipoServico> = {
  url: '/v1/tipos-servico', chaveLista: 'tipos', id: (t) => t.id_tipo_servico, nome: 'tipo de serviço', artigo: 'o', ativo: (t) => t.ativo,
  schema: tipoSchema as ZodType<FieldValues>,
  campos: [
    { name: 'nome', label: 'Nome', kind: 'text', placeholder: 'Ex.: Manutenção corretiva' },
    { name: 'descricao', label: 'Descrição (opcional)', kind: 'text', hint: 'Aparece para o cliente ao escolher o serviço' },
    { name: 'valor', label: 'Valor da mão de obra (R$)', kind: 'money', hint: 'Valor cheio: o desconto do plano é aplicado em cada ordem' },
    { name: 'cliente_pode_solicitar', label: 'Cliente pode solicitar pelo app', kind: 'bool', hint: 'Desligado: só a equipe agenda (ex.: instalação)' },
    { name: 'ativo', label: 'Ativo', kind: 'bool' },
  ],
  inicial: (t) => ({ nome: t?.nome ?? '', descricao: t?.descricao ?? '', valor: txt(t?.valor), cliente_pode_solicitar: t?.cliente_pode_solicitar ?? true, ativo: t?.ativo ?? true }),
  corpo: (v) => ({ nome: v.nome.trim(), descricao: nulo(v.descricao), valor: parseNum(v.valor), cliente_pode_solicitar: v.cliente_pode_solicitar, ativo: v.ativo }),
  linha: (t) => ({
    titulo: t.nome,
    detalhe: `${reais(t.valor)}${t.descricao ? ` · ${t.descricao}` : ''}`,
    selos: !t.cliente_pode_solicitar && <Badge tone="warning">Só a equipe agenda</Badge>,
  }),
}

const TECNICOS: Spec<Tecnico> = {
  url: '/v1/tecnicos', chaveLista: 'tecnicos', id: (t) => t.id_tecnico, nome: 'técnico', artigo: 'o', ativo: (t) => t.ativo,
  schema: tecnicoSchema as ZodType<FieldValues>,
  campos: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'telefone', label: 'Telefone (opcional)', kind: 'text', placeholder: '(11) 99999-9999' },
    { name: 'ativo', label: 'Ativo', kind: 'bool', hint: 'Inativo some das opções de agendamento' },
  ],
  inicial: (t) => ({ nome: t?.nome ?? '', telefone: t?.telefone ?? '', ativo: t?.ativo ?? true }),
  corpo: (v) => ({ nome: v.nome.trim(), telefone: nulo(v.telefone), ativo: v.ativo }),
  linha: (t) => ({ titulo: t.nome, detalhe: t.telefone || 'Sem telefone' }),
}

const PLANOS: Spec<Plano> = {
  url: '/v1/planos', chaveLista: 'planos', id: (p) => p.id_plano, nome: 'plano', artigo: 'o', ativo: (p) => p.ativo,
  schema: planoSchema as ZodType<FieldValues>,
  campos: [
    { name: 'nome', label: 'Nome', kind: 'text' },
    { name: 'descricao', label: 'Descrição (opcional)', kind: 'text' },
    { name: 'preco_mensal', label: 'Mensalidade (R$)', kind: 'money', hint: 'Em branco = sob medida' },
    { name: 'desconto_servico', label: 'Desconto na mão de obra (%)', kind: 'money', hint: 'Aplicado em cada serviço dos clientes deste plano' },
    { name: 'visitas_preventivas_ano', label: 'Visitas preventivas por ano', kind: 'int' },
    { name: 'pontos_inclusos', label: 'Pontos de monitoramento inclusos', kind: 'int', hint: 'Em branco = sob medida' },
    { name: 'ativo', label: 'Ativo', kind: 'bool', hint: 'Inativo não pode ser escolhido para novos clientes' },
  ],
  inicial: (p) => ({
    nome: p?.nome ?? '', descricao: p?.descricao ?? '', preco_mensal: txt(p?.preco_mensal), desconto_servico: txt(p?.desconto_servico),
    visitas_preventivas_ano: txt(p?.visitas_preventivas_ano), pontos_inclusos: txt(p?.pontos_inclusos), ativo: p?.ativo ?? true,
  }),
  corpo: (v) => ({
    nome: v.nome.trim(), descricao: nulo(v.descricao), preco_mensal: numOuNulo(v.preco_mensal), desconto_servico: parseNum(v.desconto_servico),
    visitas_preventivas_ano: intOuNulo(v.visitas_preventivas_ano) ?? 0, pontos_inclusos: intOuNulo(v.pontos_inclusos), ativo: v.ativo,
  }),
  linha: (p) => ({
    titulo: p.nome,
    detalhe: [
      p.preco_mensal === null ? 'Sob medida' : `${reais(p.preco_mensal)}/mês`,
      `${pct(p.desconto_servico)}% em serviços`,
      p.visitas_preventivas_ano ? `${p.visitas_preventivas_ano} preventivas/ano` : null,
    ].filter(Boolean).join(' · '),
    selos: <Badge tone="primary">{p.clientes} cliente(s)</Badge>,
  }),
}

export const AbaTipos = () => <ListaCadastro spec={TIPOS} descricao="Serviços e valores cheios da mão de obra. O cliente vê o valor já com o desconto do plano dele." />
export const AbaTecnicos = () => <ListaCadastro spec={TECNICOS} descricao="Técnicos de campo para atribuir às visitas (eles não acessam o app)." />
export const AbaPlanos = () => <ListaCadastro spec={PLANOS} descricao="O plano de cada cliente é escolhido em Gestão > Empresas." />

// ── grade semanal ─────────────────────────────────────────────────────────────

function JanelaModal({ janela, onClose, onSalvo }: { janela: Janela | null; onClose: () => void; onSalvo: () => void }) {
  const { busy, erro, run } = useEnvio()
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<JanelaForm>({
    resolver: zodResolver(janelaSchema),
    defaultValues: { dias: janela ? [janela.dia_semana] : [1, 2, 3, 4, 5], hora_inicio: janela?.hora_inicio ?? '08:00', hora_fim: janela?.hora_fim ?? '10:00', vagas: String(janela?.vagas ?? 1), ativo: janela?.ativo ?? true },
  })
  const dias = useWatch({ control, name: 'dias' })

  const salvar = handleSubmit(async (v) => {
    const ok = await run(async () => {
      if (janela) {
        await api.put(`/v1/agenda/grade/${janela.id_janela}`, { hora_inicio: v.hora_inicio, hora_fim: v.hora_fim, vagas: Number(v.vagas), ativo: v.ativo })
        return
      }
      // uma janela por dia marcado; segue nos demais se algum dia já tiver esse horário
      const falhas: string[] = []
      for (const d of v.dias) {
        try {
          await api.post('/v1/agenda/grade', { dia_semana: d, hora_inicio: v.hora_inicio, hora_fim: v.hora_fim, vagas: Number(v.vagas) })
        } catch (e) {
          falhas.push(`${DIAS_SEMANA[d]}: ${e instanceof Error ? e.message : 'erro'}`)
        }
      }
      if (falhas.length) throw new Error(falhas.join(' · '))
    })
    if (ok) onSalvo()
  })

  return (
    <ModalTela
      title={janela ? 'Editar janela' : 'Nova janela de atendimento'}
      subtitle={janela ? DIAS_SEMANA[janela.dia_semana] : 'Crie o mesmo horário em vários dias de uma vez'}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={busy}>
            {janela ? 'Salvar' : 'Criar'}
          </Button>
        </>
      }
    >
      <form onSubmit={salvar} noValidate>
        {!janela && (
          <div className="mb-3">
            <span className="form-label d-block">Dias da semana</span>
            <div className="d-flex flex-wrap gap-2" role="group" aria-label="Dias da semana">
              {DIAS_SEMANA.map((nome, d) => (
                <Chip key={d} active={dias.includes(d)} onClick={() => setValue('dias', dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d], { shouldValidate: true })}>
                  {nome.slice(0, 3)}
                </Chip>
              ))}
            </div>
            {errors.dias && (
              <div className="text-danger small mt-1" role="alert">
                {errors.dias.message}
              </div>
            )}
          </div>
        )}
        <div className="row g-2">
          <div className="col-6">
            <TextField label="Início" type="time" error={errors.hora_inicio?.message} {...register('hora_inicio')} />
          </div>
          <div className="col-6">
            <TextField label="Fim" type="time" error={errors.hora_fim?.message} {...register('hora_fim')} />
          </div>
        </div>
        <TextField label="Vagas" inputMode="numeric" hint="Quantas visitas cabem nessa janela (ex.: número de técnicos)" error={errors.vagas?.message} {...register('vagas')} />
        {janela && <CheckField kind="switch" label="Ativa (inativa não aparece para os clientes)" {...register('ativo')} />}
        {erro && <Alert tone="danger">{erro}</Alert>}
      </form>
    </ModalTela>
  )
}

export function AbaGrade() {
  const grade = useApi<{ janelas: Janela[] }>('/v1/agenda/grade')
  const [editando, setEditando] = useState<Janela | null | undefined>(undefined)
  const { erro, run } = useEnvio()
  if (grade.loading && !grade.data) return <Spinner />
  if (grade.error) return <Alert tone="danger">{grade.error}</Alert>
  const janelas = grade.data?.janelas ?? []

  const remover = async (j: Janela) => {
    if (await run(async () => void (await api.delete(`/v1/agenda/grade/${j.id_janela}`)))) grade.reload()
  }

  const ordem = [1, 2, 3, 4, 5, 6, 0] // segunda a domingo
  return (
    <div>
      <div className="sv-toolbar">
        <p className="small text-muted mb-0">Janelas de atendimento da semana. O cliente só vê as janelas com vaga, a partir de amanhã.</p>
        <Button icon="plus" onClick={() => setEditando(null)}>
          Nova janela
        </Button>
      </div>
      {erro && <Alert tone="danger">{erro}</Alert>}
      <div className="sv-grade">
        {ordem.map((d) => {
          const doDia = janelas.filter((j) => j.dia_semana === d)
          return (
            <Card key={d} bodyClassName="p-3">
              <p className="sv-dia-titulo mb-2">{DIAS_SEMANA[d]}</p>
              {doDia.length ? (
                <ul className="list-unstyled mb-0 d-grid gap-2">
                  {doDia.map((j) => (
                    <li key={j.id_janela} className={`sv-janela-item ${j.ativo ? '' : 'is-inativo'}`}>
                      <button type="button" className="sv-janela-edit" onClick={() => setEditando(j)} aria-label={`Editar janela ${j.hora_inicio} às ${j.hora_fim} de ${DIAS_SEMANA[d]}`}>
                        <span className="d-block fw-semibold">
                          {j.hora_inicio}–{j.hora_fim}
                        </span>
                        <span className="d-block small text-muted">
                          {j.vagas} vaga(s){!j.ativo && ' · inativa'}
                        </span>
                      </button>
                      <button type="button" className="sv-icon-btn text-danger" onClick={() => remover(j)} aria-label={`Remover janela ${j.hora_inicio} de ${DIAS_SEMANA[d]}`}>
                        <Icon name="trash" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small text-muted mb-0">Sem atendimento</p>
              )}
            </Card>
          )
        })}
      </div>
      {editando !== undefined && (
        <JanelaModal
          janela={editando}
          onClose={() => setEditando(undefined)}
          onSalvo={() => {
            setEditando(undefined)
            grade.reload()
          }}
        />
      )}
    </div>
  )
}

// ── bloqueios de data ─────────────────────────────────────────────────────────

export function AbaBloqueios() {
  const bloqueios = useApi<{ bloqueios: Bloqueio[] }>('/v1/agenda/bloqueios')
  const { busy, erro, run } = useEnvio()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BloqueioForm>({ resolver: zodResolver(bloqueioSchema), defaultValues: { data: '', motivo: '' } })

  const bloquear = handleSubmit(async (v) => {
    const ok = await run(async () => void (await api.post('/v1/agenda/bloqueios', { data: v.data, motivo: v.motivo.trim() || null })))
    if (ok) {
      reset()
      bloqueios.reload()
    }
  })
  const liberar = async (b: Bloqueio) => {
    if (await run(async () => void (await api.delete(`/v1/agenda/bloqueios/${b.id_bloqueio}`)))) bloqueios.reload()
  }

  const lista = bloqueios.data?.bloqueios ?? []
  return (
    <div>
      <p className="small text-muted">Feriados e folgas: nesses dias o cliente não vê horários. Visitas já marcadas não são canceladas.</p>
      <Card>
        <form onSubmit={bloquear} noValidate className="sv-bloq-form">
          <TextField label="Data" type="date" error={errors.data?.message} {...register('data')} />
          <TextField label="Motivo (opcional)" placeholder="Ex.: Feriado" error={errors.motivo?.message} {...register('motivo')} />
          <div className="mb-3">
            <Button type="submit" variant="dark" loading={busy} className="w-100">
              Bloquear data
            </Button>
          </div>
        </form>
      </Card>
      {erro && <Alert tone="danger">{erro}</Alert>}
      <div className="mt-3">
        {bloqueios.loading && !bloqueios.data ? (
          <Spinner />
        ) : bloqueios.error ? (
          <Alert tone="danger">{bloqueios.error}</Alert>
        ) : (
          <Card bodyClassName="p-0">
            {lista.length ? (
              <ul className="list-unstyled mb-0 sv-lista">
                {lista.map((b) => (
                  <li key={b.id_bloqueio} className="sv-item sv-item-static">
                    <Icon name="calendar-off" className="fs-5 text-muted" />
                    <div className="min-w-0 flex-grow-1">
                      <p className="fw-semibold mb-0">{diaLongo(b.data)}</p>
                      {b.motivo && <p className="small text-muted mb-0">{b.motivo}</p>}
                    </div>
                    <Button variant="light" onClick={() => liberar(b)} aria-label={`Liberar ${diaLongo(b.data)}`}>
                      Liberar
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted py-4 mb-0">Nenhuma data bloqueada.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
