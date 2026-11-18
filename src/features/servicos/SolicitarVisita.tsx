import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { SelectField, TextAreaField } from '@/components/forms/Fields'
import { Chip, ModalTela } from './ModalTela'
import { useEnvio } from './useEnvio'
import { solicitarSchema, type SolicitarForm } from './schemas'
import { diaCurto, nomeEquip, pct, reais, type Catalogo, type DiaDisponivel, type Equipamento } from './servicos'

function Passo({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="h6 d-flex align-items-center gap-2 mb-2">
        <span className="sv-step">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Cliente: escolhe serviço, equipamento e um horário livre; a equipe confirma depois. */
export function SolicitarVisita({ catalogo, onClose, onEnviado }: { catalogo: Catalogo; onClose: () => void; onEnviado: () => void }) {
  const disp = useApi<{ dias: DiaDisponivel[] }>('/v1/agenda/disponibilidade?dias=30')
  const equipamentos = useApi<{ dispositivos: Equipamento[] }>('/v1/dispositivos')
  const { busy, erro, run } = useEnvio()
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SolicitarForm>({
    resolver: zodResolver(solicitarSchema),
    defaultValues: {
      id_tipo_servico: catalogo.tipos.length === 1 ? String(catalogo.tipos[0]?.id_tipo_servico) : '',
      deviceid: '',
      descricao: '',
      data: '',
      hora_inicio: '',
    },
  })
  const [idTipo, dia, hora] = useWatch({ control, name: ['id_tipo_servico', 'data', 'hora_inicio'] })
  const dias = useMemo(() => disp.data?.dias ?? [], [disp.data])
  const janelas = useMemo(() => dias.find((d) => d.data === dia)?.janelas ?? [], [dias, dia])

  const enviar = handleSubmit((v) =>
    run(async () => {
      try {
        await api.post('/v1/ordens', {
          id_tipo_servico: Number(v.id_tipo_servico),
          deviceid: v.deviceid || null,
          descricao: v.descricao.trim() || null,
          data: v.data,
          hora_inicio: v.hora_inicio,
        })
      } catch (e) {
        // o horário pode ter sido ocupado enquanto o cliente escolhia (409): recarrega as vagas
        setValue('hora_inicio', '')
        disp.reload()
        throw e
      }
      onEnviado()
    }),
  )

  return (
    <ModalTela
      title="Solicitar visita técnica"
      subtitle={catalogo.plano ? `Plano ${catalogo.plano.nome}: ${pct(catalogo.plano.desconto_servico)}% de desconto na mão de obra` : undefined}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={enviar} loading={busy}>
            Enviar pedido
          </Button>
        </>
      }
    >
      <form onSubmit={enviar} noValidate>
        <Passo n={1} title="Qual serviço?">
          {catalogo.tipos.length ? (
            <div className="d-grid gap-2" role="radiogroup" aria-label="Serviço">
              {catalogo.tipos.map((t) => {
                const ativo = String(t.id_tipo_servico) === idTipo
                return (
                  <button
                    key={t.id_tipo_servico}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    className={`sv-opt ${ativo ? 'is-active' : ''}`}
                    onClick={() => setValue('id_tipo_servico', String(t.id_tipo_servico), { shouldValidate: true })}
                  >
                    <span className="min-w-0">
                      <span className="d-block fw-semibold">{t.nome}</span>
                      {t.descricao && <span className="d-block small text-muted">{t.descricao}</span>}
                    </span>
                    <span className="text-end flex-shrink-0">
                      {(t.valor_com_desconto ?? 0) < (t.valor ?? 0) && <span className="d-block small text-muted text-decoration-line-through">{reais(t.valor)}</span>}
                      <span className="d-block fw-semibold">{reais(t.valor_com_desconto)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <Alert tone="info">Nenhum serviço disponível para pedido pelo app. Fale com a equipe.</Alert>
          )}
          {errors.id_tipo_servico && (
            <div className="text-danger small mt-1" role="alert">
              {errors.id_tipo_servico.message}
            </div>
          )}
          <p className="small text-muted mt-2 mb-0">Valor da mão de obra. Peças, se necessárias, são informadas na visita.</p>
        </Passo>

        <Passo n={2} title="Em qual equipamento? (opcional)">
          <SelectField
            label="Equipamento"
            placeholder="Não sei / outro equipamento"
            options={(equipamentos.data?.dispositivos ?? []).map((d) => ({ value: d.deviceid, label: nomeEquip(d.nome) }))}
            {...register('deviceid')}
          />
          <TextAreaField label="O que está acontecendo?" rows={3} maxLength={1000} placeholder="Ex.: a câmara não está gelando desde ontem à noite" error={errors.descricao?.message} {...register('descricao')} />
        </Passo>

        <Passo n={3} title="Escolha o dia e o horário">
          {disp.loading && !disp.data ? (
            <Spinner />
          ) : dias.length ? (
            <>
              <div className="sv-scroll" role="group" aria-label="Dias disponíveis">
                {dias.map((d) => (
                  <Chip
                    key={d.data}
                    active={d.data === dia}
                    onClick={() => {
                      setValue('data', d.data, { shouldValidate: true })
                      setValue('hora_inicio', '')
                    }}
                  >
                    {diaCurto(d.data)}
                  </Chip>
                ))}
              </div>
              {dia ? (
                <div className="sv-slots mt-2" role="group" aria-label="Horários livres">
                  {janelas.map((j) => (
                    <Chip key={j.hora_inicio} active={j.hora_inicio === hora} onClick={() => setValue('hora_inicio', j.hora_inicio, { shouldValidate: true })}>
                      {j.hora_inicio} – {j.hora_fim}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="small text-muted mt-2 mb-0">Toque em um dia para ver os horários livres.</p>
              )}
              {(errors.data || errors.hora_inicio) && (
                <div className="text-danger small mt-1" role="alert">
                  {errors.data?.message ?? errors.hora_inicio?.message}
                </div>
              )}
              <p className="small text-muted mt-2 mb-0">A equipe confirma o horário. Você acompanha a confirmação aqui.</p>
            </>
          ) : (
            <Alert tone="warning">Sem horários livres nos próximos dias. Fale com a equipe pelo WhatsApp.</Alert>
          )}
        </Passo>
        {disp.error && <Alert tone="danger">{disp.error}</Alert>}
        {erro && <Alert tone="danger">{erro}</Alert>}
      </form>
    </ModalTela>
  )
}
