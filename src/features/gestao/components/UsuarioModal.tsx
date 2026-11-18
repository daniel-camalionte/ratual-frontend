import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, ApiError } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { CheckField, SelectField, TextField } from '@/components/forms/Fields'
import { PERFIL_DICA, PERFIS, formatarTelefone, mascaraTelefone, usuarioSchema, type Empresa, type Perfil, type UsuarioForm, type UsuarioG } from '../types'

interface Props {
  usuario: UsuarioG | null
  empresas: Empresa[]
  master: boolean
  onClose: () => void
  onSaved: () => void
}

export function UsuarioModal({ usuario, empresas, master, onClose, onSaved }: Props) {
  const novo = !usuario
  const proprio = !!usuario?.eu
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: usuario?.nome ?? '',
      login: usuario?.login ?? '',
      telefone: formatarTelefone(usuario?.telefone),
      perfil: usuario?.perfil ?? 'operador',
      id_empresa: usuario ? String(usuario.empresa.id_empresa) : '',
      ativo: usuario?.ativo ?? true,
    },
  })
  const perfil = useWatch({ control, name: 'perfil' }) as Perfil
  const telefone = register('telefone')

  const salvar = handleSubmit(async (v) => {
    if (master && novo && !v.id_empresa) {
      setError('id_empresa', { message: 'Selecione a empresa.' })
      return
    }
    setErro('')
    setSalvando(true)
    try {
      const body: Record<string, unknown> = { nome: v.nome, login: v.login, telefone: v.telefone.replace(/\D/g, '') || null, perfil: proprio ? usuario.perfil : v.perfil }
      if (master && !proprio && v.id_empresa && (novo || Number(v.id_empresa) !== usuario?.empresa.id_empresa)) body.id_empresa = Number(v.id_empresa)
      if (!novo && !proprio) body.ativo = v.ativo
      if (novo) await api.post('/v1/usuarios', body)
      else await api.put(`/v1/usuarios/${usuario.id_usuario}`, body)
      onSaved()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  })

  return (
    <Modal show title={novo ? 'Novo usuário' : 'Editar usuário'} onClose={onClose} onConfirm={salvar} confirmLabel={novo ? 'Criar usuário' : 'Salvar'} loading={salvando}>
      <form onSubmit={salvar} noValidate>
        {novo && <p className="text-muted">O acesso é por e-mail: a pessoa recebe um código de 6 dígitos a cada entrada.</p>}
        <TextField label="Nome" autoComplete="off" placeholder="Nome completo" {...register('nome')} error={errors.nome?.message} />
        <TextField label="E-mail (login)" type="email" inputMode="email" autoComplete="off" placeholder="nome@empresa.com.br" {...register('login')} error={errors.login?.message} />
        <TextField
          label="Telefone / WhatsApp (opcional)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-0000"
          {...telefone}
          onChange={(e) => {
            e.target.value = mascaraTelefone(e.target.value)
            void telefone.onChange(e)
          }}
          error={errors.telefone?.message}
        />
        {master && (
          <SelectField
            label="Empresa"
            placeholder="Selecione…"
            disabled={proprio}
            options={empresas.filter((e) => e.ativo || e.id_empresa === usuario?.empresa.id_empresa).map((e) => ({ value: String(e.id_empresa), label: e.nome + (e.tipo === 'master' ? ' (master)' : '') }))}
            {...register('id_empresa')}
            error={errors.id_empresa?.message}
          />
        )}
        <SelectField
          label="Perfil"
          hint={PERFIL_DICA[perfil]}
          disabled={proprio}
          options={Object.entries(PERFIS).map(([value, label]) => ({ value, label }))}
          {...register('perfil')}
        />
        {!novo && !proprio && <CheckField kind="switch" label="Acesso ativo (desativar bloqueia o acesso na hora)" {...register('ativo')} />}
        {proprio && <Alert tone="info">Este é o seu usuário: perfil, empresa e status não podem ser alterados por você.</Alert>}
        {erro && <Alert tone="danger">{erro}</Alert>}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
