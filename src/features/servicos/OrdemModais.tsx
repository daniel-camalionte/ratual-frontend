import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { SelectField, TextAreaField, TextField } from '@/components/forms/Fields'
import { ModalTela } from './ModalTela'
import { useEnvio } from './useEnvio'
import { ordemEquipeSchema, type OrdemEquipeForm } from './schemas'
import { ACAO_STATUS, PROXIMOS, STATUS_OS, diaLongo, nomeEquip, parseNum, pct, reais, type Ordem, type StatusOS, type Tecnico } from './servicos'

function Linha({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="d-flex align-items-start gap-3 mb-2">
      <Icon name={icon} className="fs-5 text-muted mt-1" />
      <div className="min-w-0 flex-grow-1">{children}</div>
    </div>
  )
}

/** Quadro de valores: mão de obra, desconto do plano, peças e total. */
export function Valores({ v }: { v: Ordem['valores'] }) {
  return (
    <dl className="sv-valores mb-0">
      <div>
        <dt>Mão de obra</dt>
        <dd>{reais(v.servico)}</dd>
      </div>
      {(v.desconto ?? 0) > 0 && (
        <div className="text-success">
          <dt>Desconto do plano ({pct(v.desconto_percentual)}%)</dt>
          <dd>− {reais(v.desconto)}</dd>
        </div>
      )}
      {(v.pecas ?? 0) > 0 && (
        <div>
          <dt>Peças</dt>
          <dd>{reais(v.pecas)}</dd>
        </div>
      )}
      <div className="sv-total">
        <dt>Total</dt>
        <dd>{reais(v.total)}</dd>
      </div>
    </dl>
  )
}

function Resumo({ o }: { o: Ordem }) {
  return (
    <div className="mb-3">
      <Linha icon="calendar">
        <span className="fw-semibold">{diaLongo(o.data)}</span>
        <span className="d-block text-muted">
          {o.hora_inicio} às {o.hora_fim}
        </span>
      </Linha>
      {o.dispositivo && <Linha icon="fridge">{nomeEquip(o.dispositivo.nome)}</Linha>}
      <Linha icon="tool">
        {o.tecnico ? (
          <>
            {o.tecnico.nome}
            {o.tecnico.telefone && <span className="text-muted"> · {o.tecnico.telefone}</span>}
          </>
        ) : (
          <span className="text-muted">Técnico a definir</span>
        )}
      </Linha>
      {o.solicitante && (
        <Linha icon="user">
          <span className="text-muted">Pedido por</span> {o.solicitante}
        </Linha>
      )}
      {o.descricao && <p className="sv-nota mb-0">“{o.descricao}”</p>}
    </div>
  )
}

/** Cliente: vê a visita e cancela enquanto ainda não começou. */
export function OrdemClienteModal({ ordem: o, podeCancelar, onClose, onAlterado }: { ordem: Ordem; podeCancelar: boolean; onClose: () => void; onAlterado: () => void }) {
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const { busy, erro, run } = useEnvio()
  const cancelavel = podeCancelar && (o.status === 'solicitado' || o.status === 'confirmado')

  const cancelar = async () => {
    if (await run(async () => void (await api.post(`/v1/ordens/${o.id_os}/cancelar`, { motivo: motivo.trim() || null })))) onAlterado()
  }

  return (
    <ModalTela
      title={o.tipo_servico.nome}
      subtitle={`Ordem #${o.id_os}`}
      onClose={onClose}
      busy={busy}
      footer={
        cancelando ? (
          <>
            <Button variant="light" onClick={() => setCancelando(false)} disabled={busy}>
              Voltar
            </Button>
            <Button variant="danger" onClick={cancelar} loading={busy}>
              Cancelar visita
            </Button>
          </>
        ) : cancelavel ? (
          <Button variant="danger" outline onClick={() => setCancelando(true)}>
            Cancelar visita
          </Button>
        ) : undefined
      }
    >
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Badge tone={STATUS_OS[o.status].tone}>{STATUS_OS[o.status].label}</Badge>
        <span className="small text-muted">{STATUS_OS[o.status].dica}</span>
      </div>
      <Resumo o={o} />
      <Valores v={o.valores} />
      {o.descricao_pecas && (
        <p className="mt-3 mb-1">
          <strong>Peças:</strong> {o.descricao_pecas}
        </p>
      )}
      {o.observacao_tecnica && (
        <p className="mb-1">
          <strong>O que foi feito:</strong> {o.observacao_tecnica}
        </p>
      )}
      {o.motivo_cancelamento && <p className="text-muted mt-2 mb-0">Motivo do cancelamento: {o.motivo_cancelamento}</p>}
      {cancelando && (
        <div className="mt-3">
          <TextField label="Motivo (opcional)" value={motivo} maxLength={255} placeholder="Ex.: o problema foi resolvido" onChange={(e) => setMotivo(e.target.value)} />
        </div>
      )}
      {erro && <Alert tone="danger">{erro}</Alert>}
    </ModalTela>
  )
}

/** Equipe: confirma, atribui técnico, remarca, lança peças e conclui. */
export function OrdemEquipeModal({ ordem: o, tecnicos, onClose, onAlterado }: { ordem: Ordem; tecnicos: Tecnico[]; onClose: () => void; onAlterado: (avisos: string[]) => void }) {
  const finalizada = o.status === 'concluido' || o.status === 'cancelado'
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const { busy, erro, run } = useEnvio()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OrdemEquipeForm>({
    resolver: zodResolver(ordemEquipeSchema),
    defaultValues: {
      data: o.data,
      hora_inicio: o.hora_inicio ?? '',
      hora_fim: o.hora_fim ?? '',
      id_tecnico: o.tecnico ? String(o.tecnico.id_tecnico) : '',
      valor_servico: String(o.valores.servico ?? 0),
      valor_pecas: String(o.valores.pecas ?? 0),
      descricao_pecas: o.descricao_pecas ?? '',
      observacao_tecnica: o.observacao_tecnica ?? '',
    },
  })
  const [vServ, vPecas] = useWatch({ control, name: ['valor_servico', 'valor_pecas'] })
  const servico = parseNum(vServ) || 0
  const pecas = parseNum(vPecas) || 0
  const perc = o.valores.desconto_percentual ?? 0
  const desconto = Math.round(servico * perc) / 100
  const previa = { ...o.valores, servico, pecas, desconto, total: servico - desconto + pecas }

  const salvar = (status?: StatusOS) =>
    handleSubmit((v) =>
      run(async () => {
        const body: Record<string, unknown> = {
          valor_servico: parseNum(v.valor_servico),
          valor_pecas: parseNum(v.valor_pecas),
          descricao_pecas: v.descricao_pecas.trim() || null,
          observacao_tecnica: v.observacao_tecnica.trim() || null,
        }
        if (o.status !== 'concluido') Object.assign(body, { data: v.data, hora_inicio: v.hora_inicio, hora_fim: v.hora_fim, id_tecnico: v.id_tecnico ? Number(v.id_tecnico) : null })
        if (status) body.status = status
        if (status === 'cancelado') body.motivo_cancelamento = motivo.trim() || null
        const r = await api.put<{ avisos?: string[] }>(`/v1/ordens/${o.id_os}`, body)
        onAlterado(r?.avisos ?? [])
      }),
    )()

  const proximos = PROXIMOS[o.status].filter((s) => s !== 'cancelado')
  const footer =
    o.status === 'cancelado' ? undefined : cancelando ? (
      <>
        <Button variant="light" onClick={() => setCancelando(false)} disabled={busy}>
          Voltar
        </Button>
        <Button variant="danger" onClick={() => salvar('cancelado')} loading={busy}>
          Confirmar cancelamento
        </Button>
      </>
    ) : (
      <>
        {PROXIMOS[o.status].includes('cancelado') && (
          <Button variant="danger" subtle onClick={() => setCancelando(true)} disabled={busy}>
            Cancelar ordem
          </Button>
        )}
        <Button variant="light" onClick={() => salvar()} loading={busy}>
          Salvar
        </Button>
        {proximos.map((s) => (
          <Button key={s} onClick={() => salvar(s)} disabled={busy}>
            {ACAO_STATUS[s]}
          </Button>
        ))}
      </>
    )

  return (
    <ModalTela title={o.empresa.nome} subtitle={`#${o.id_os} · ${o.tipo_servico.nome}`} onClose={onClose} busy={busy} footer={footer}>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Badge tone={STATUS_OS[o.status].tone}>{STATUS_OS[o.status].label}</Badge>
        <Badge tone="secondary">{o.origem === 'cliente' ? 'Pedido do cliente' : 'Agendado pela equipe'}</Badge>
      </div>
      {o.descricao && <p className="sv-nota">“{o.descricao}”</p>}
      {o.dispositivo && (
        <p className="d-flex align-items-center gap-2">
          <Icon name="fridge" className="fs-5 text-muted" />
          {nomeEquip(o.dispositivo.nome)}
        </p>
      )}

      {!finalizada && (
        <>
          <TextField label="Data" type="date" error={errors.data?.message} {...register('data')} />
          <div className="row g-2">
            <div className="col-6">
              <TextField label="Início" type="time" error={errors.hora_inicio?.message} {...register('hora_inicio')} />
            </div>
            <div className="col-6">
              <TextField label="Fim" type="time" error={errors.hora_fim?.message} {...register('hora_fim')} />
            </div>
          </div>
          <SelectField
            label="Técnico"
            placeholder="A definir"
            options={tecnicos.filter((t) => t.ativo || t.id_tecnico === o.tecnico?.id_tecnico).map((t) => ({ value: String(t.id_tecnico), label: t.nome }))}
            {...register('id_tecnico')}
          />
        </>
      )}
      {finalizada && <Resumo o={o} />}

      {o.status !== 'cancelado' && (
        <>
          <div className="row g-2">
            <div className="col-6">
              <TextField label="Mão de obra (R$)" inputMode="decimal" error={errors.valor_servico?.message} {...register('valor_servico')} />
            </div>
            <div className="col-6">
              <TextField label="Peças (R$)" inputMode="decimal" error={errors.valor_pecas?.message} {...register('valor_pecas')} />
            </div>
          </div>
          <TextField label="Peças utilizadas" placeholder="Ex.: relé, capacitor" error={errors.descricao_pecas?.message} {...register('descricao_pecas')} />
          <TextAreaField label="O que foi feito" rows={3} placeholder="Diagnóstico e serviço realizado (o cliente vê)" error={errors.observacao_tecnica?.message} {...register('observacao_tecnica')} />
          <Valores v={previa} />
        </>
      )}
      {o.status === 'cancelado' && o.motivo_cancelamento && <p className="text-muted">Motivo: {o.motivo_cancelamento}</p>}
      {cancelando && (
        <div className="mt-3">
          <TextField label="Motivo do cancelamento (opcional)" value={motivo} maxLength={255} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      )}
      {erro && <Alert tone="danger">{erro}</Alert>}
    </ModalTela>
  )
}
