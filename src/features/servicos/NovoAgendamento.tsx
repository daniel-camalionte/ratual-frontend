import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SelectField, TextAreaField, TextField } from '@/components/forms/Fields'
import { Chip, ModalTela } from './ModalTela'
import { useEnvio } from './useEnvio'
import { agendarSchema, type AgendarForm } from './schemas'
import { dataLocal, nomeEquip, parseNum, pct, reais, type EmpresaPlano, type Equipamento, type Janela, type Tecnico, type TipoServico } from './servicos'

/** Master: agenda direto (já entra confirmado) para um cliente. */
export function NovoAgendamento({ inicial, tecnicos, onClose, onCriado }: { inicial?: { data: string; hora_inicio?: string }; tecnicos: Tecnico[]; onClose: () => void; onCriado: (avisos: string[]) => void }) {
  const empresas = useApi<{ empresas: EmpresaPlano[] }>('/v1/empresas')
  const tipos = useApi<{ tipos: TipoServico[] }>('/v1/tipos-servico')
  const grade = useApi<{ janelas: Janela[] }>('/v1/agenda/grade')
  const disp = useApi<{ dispositivos: Equipamento[] }>('/v1/dispositivos?todos=1')
  const { busy, erro, run } = useEnvio()
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AgendarForm>({
    resolver: zodResolver(agendarSchema),
    defaultValues: { id_empresa: '', id_tipo_servico: '', deviceid: '', data: inicial?.data ?? '', hora_inicio: inicial?.hora_inicio ?? '', hora_fim: '', id_tecnico: '', valor_servico: '', descricao: '' },
  })
  const [idEmpresa, data, inicio, fim, valor] = useWatch({ control, name: ['id_empresa', 'data', 'hora_inicio', 'hora_fim', 'valor_servico'] })

  const clientes = (empresas.data?.empresas ?? []).filter((e) => e.tipo === 'cliente' && e.ativo)
  const empresa = clientes.find((e) => String(e.id_empresa) === idEmpresa)
  const tiposAtivos = (tipos.data?.tipos ?? []).filter((t) => t.ativo)
  const equipamentos = (disp.data?.dispositivos ?? []).filter((d) => String(d.empresa?.id_empresa) === idEmpresa)
  // atalhos: janelas da grade no dia da semana escolhido
  const janelasDoDia = useMemo(() => {
    if (!data) return []
    const dia = dataLocal(data).getDay()
    return (grade.data?.janelas ?? []).filter((j) => j.ativo && j.dia_semana === dia)
  }, [data, grade.data])

  const valorNum = parseNum(valor)
  const desconto = empresa?.plano?.desconto_servico ?? 0
  const total = Number.isNaN(valorNum) ? null : valorNum - Math.round(valorNum * desconto) / 100

  const salvar = handleSubmit(async (v) => {
    let avisos: string[] = []
    const ok = await run(async () => {
      const r = await api.post<{ avisos?: string[] }>('/v1/ordens', {
        id_empresa: Number(v.id_empresa),
        id_tipo_servico: Number(v.id_tipo_servico),
        deviceid: v.deviceid || null,
        data: v.data,
        hora_inicio: v.hora_inicio,
        hora_fim: v.hora_fim,
        id_tecnico: v.id_tecnico ? Number(v.id_tecnico) : null,
        valor_servico: parseNum(v.valor_servico),
        descricao: v.descricao.trim() || null,
      })
      avisos = r?.avisos ?? []
    })
    if (ok) onCriado(avisos)
  })

  return (
    <ModalTela
      title="Novo agendamento"
      subtitle="Já entra confirmado na agenda"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={busy}>
            Agendar
          </Button>
        </>
      }
    >
      <form onSubmit={salvar} noValidate>
        <SelectField
          label="Cliente"
          placeholder="Selecione..."
          hint={empresa ? (empresa.plano ? `Plano ${empresa.plano.nome}: ${pct(desconto)}% de desconto na mão de obra` : 'Sem plano: valor cheio') : undefined}
          options={clientes.map((e) => ({ value: String(e.id_empresa), label: e.nome }))}
          error={errors.id_empresa?.message}
          {...register('id_empresa', { onChange: () => setValue('deviceid', '') })}
        />
        <SelectField
          label="Serviço"
          placeholder="Selecione..."
          options={tiposAtivos.map((t) => ({ value: String(t.id_tipo_servico), label: `${t.nome} · ${reais(t.valor)}` }))}
          error={errors.id_tipo_servico?.message}
          {...register('id_tipo_servico', {
            onChange: (e: { target: { value: string } }) => {
              const t = tiposAtivos.find((x) => String(x.id_tipo_servico) === e.target.value)
              if (t) setValue('valor_servico', String(t.valor ?? ''), { shouldValidate: true })
            },
          })}
        />
        {idEmpresa !== '' && <SelectField label="Equipamento (opcional)" placeholder="Não informado" options={equipamentos.map((d) => ({ value: d.deviceid, label: nomeEquip(d.nome) }))} {...register('deviceid')} />}
        <TextField label="Data" type="date" error={errors.data?.message} {...register('data')} />
        {janelasDoDia.length > 0 && (
          <div className="sv-slots mb-3" role="group" aria-label="Janelas da grade">
            {janelasDoDia.map((j) => (
              <Chip
                key={j.id_janela}
                active={inicio === j.hora_inicio && fim === j.hora_fim}
                onClick={() => {
                  setValue('hora_inicio', j.hora_inicio, { shouldValidate: true })
                  setValue('hora_fim', j.hora_fim, { shouldValidate: true })
                }}
              >
                {j.hora_inicio} – {j.hora_fim}
              </Chip>
            ))}
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
        <SelectField label="Técnico" placeholder="A definir" options={tecnicos.filter((t) => t.ativo).map((t) => ({ value: String(t.id_tecnico), label: t.nome }))} {...register('id_tecnico')} />
        <TextField
          label="Mão de obra (R$)"
          inputMode="decimal"
          placeholder="Preenchido pelo serviço"
          hint={total !== null && valor !== '' ? `Total para o cliente: ${reais(total)}${desconto ? ` (com ${pct(desconto)}% de desconto)` : ''}` : undefined}
          error={errors.valor_servico?.message}
          {...register('valor_servico')}
        />
        <TextAreaField label="Observação (opcional)" rows={2} error={errors.descricao?.message} {...register('descricao')} />
        {erro && <Alert tone="danger">{erro}</Alert>}
      </form>
    </ModalTela>
  )
}
