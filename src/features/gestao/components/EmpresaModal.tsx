import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, ApiError } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { CheckField, SelectField, TextField } from '@/components/forms/Fields'
import { empresaSchema, type Empresa, type EmpresaForm, type PlanoOpcao } from '../types'

interface Props {
  empresa: Empresa | null
  planos: PlanoOpcao[]
  onClose: () => void
  onSaved: () => void
}

export function EmpresaModal({ empresa, planos, onClose, onSaved }: Props) {
  const nova = !empresa
  const cliente = nova || empresa.tipo === 'cliente'
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome: empresa?.nome ?? '',
      documento: empresa?.documento ?? '',
      id_plano: empresa?.plano ? String(empresa.plano.id_plano) : '',
      ativo: empresa?.ativo ?? true,
    },
  })
  const idPlano = useWatch({ control, name: 'id_plano' })
  const plano = planos.find((p) => String(p.id_plano) === idPlano)

  const salvar = handleSubmit(async (v) => {
    setErro('')
    setSalvando(true)
    try {
      const body: Record<string, unknown> = { nome: v.nome }
      if (!nova || v.documento) body.documento = v.documento || null
      if (!nova && empresa.tipo !== 'master') body.ativo = v.ativo
      let id: number
      if (nova) id = (await api.post<{ id_empresa: number }>('/v1/empresas', body)).id_empresa
      else {
        await api.put(`/v1/empresas/${empresa.id_empresa}`, body)
        id = empresa.id_empresa
      }
      // o plano é gravado em seguida (na criação, depois de a empresa existir)
      if (cliente && v.id_plano !== (empresa?.plano ? String(empresa.plano.id_plano) : '')) {
        await api.put(`/v1/empresas/${id}`, { id_plano: v.id_plano ? Number(v.id_plano) : null })
      }
      onSaved()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  })

  return (
    <Modal show title={nova ? 'Nova empresa' : 'Editar empresa'} onClose={onClose} onConfirm={salvar} confirmLabel={nova ? 'Criar empresa' : 'Salvar'} loading={salvando}>
      <form onSubmit={salvar} noValidate>
        <TextField label="Nome" placeholder="Nome do cliente" {...register('nome')} error={errors.nome?.message} />
        <TextField label="CNPJ (opcional)" placeholder="00.000.000/0000-00" inputMode="numeric" {...register('documento')} error={errors.documento?.message} />
        {cliente && (
          <SelectField
            label="Plano"
            placeholder="Sem plano"
            hint={plano ? `${(plano.desconto_servico ?? 0).toLocaleString('pt-BR')}% de desconto na mão de obra de cada serviço` : 'Sem plano: serviços pelo valor cheio'}
            options={planos.filter((p) => p.ativo || p.id_plano === empresa?.plano?.id_plano).map((p) => ({ value: String(p.id_plano), label: p.nome }))}
            {...register('id_plano')}
          />
        )}
        {!nova && empresa.tipo !== 'master' && <CheckField kind="switch" label="Empresa ativa (desativar bloqueia o acesso de todos os usuários dela)" {...register('ativo')} />}
        {erro && <Alert tone="danger">{erro}</Alert>}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
