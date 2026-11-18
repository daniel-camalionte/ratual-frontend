import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, ApiError } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { CheckField, TextField } from '@/components/forms/Fields'
import type { Camera } from './types'

const schema = z.object({
  deviceserial: z.string().trim().min(1, 'Informe o número de série.').max(20, 'No máximo 20 caracteres.'),
  canal: z.coerce.number({ message: 'Informe o canal.' }).int('Canal inteiro.').min(1, 'Mínimo 1.'),
  nome: z.string().trim().max(150, 'No máximo 150 caracteres.'),
  deviceid: z.string().trim(),
  codigo: z.string().trim().max(10, 'Código muito longo.'),
  ativo: z.boolean(),
})
type Form = z.input<typeof schema>
type Saida = z.output<typeof schema>

interface Props {
  /** câmera a editar; ausente = cadastro */
  camera?: Camera | null
  /** valores iniciais ao cadastrar a partir da conta EZVIZ */
  inicial?: { deviceserial: string; canal: number; nome?: string | null }
  onFechar: () => void
  onSalvo: () => void
}

/** Cadastro/edição de câmera (somente master; o backend também exige). */
export default function CameraFormModal({ camera, inicial, onFechar, onSalvo }: Props) {
  const edicao = !!camera
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form, unknown, Saida>({
    resolver: zodResolver(schema),
    defaultValues: {
      deviceserial: camera?.deviceserial ?? inicial?.deviceserial ?? '',
      canal: camera?.canal ?? inicial?.canal ?? 1,
      nome: camera?.nome ?? inicial?.nome ?? '',
      deviceid: camera?.refrigerador?.deviceid ?? '',
      codigo: '',
      ativo: camera?.ativo ?? true,
    },
  })

  const enviar = handleSubmit(async (v) => {
    setErro('')
    setSalvando(true)
    try {
      if (camera) {
        await api.put(`/v1/cameras/${camera.id_camera}`, {
          nome: v.nome || undefined,
          deviceid: v.deviceid || null,
          ativo: v.ativo,
          ...(v.codigo && { codigo: v.codigo }),
        })
      } else {
        await api.post('/v1/cameras', {
          deviceserial: v.deviceserial,
          canal: v.canal,
          nome: v.nome || undefined,
          deviceid: v.deviceid || undefined,
          codigo: v.codigo || undefined,
        })
      }
      onSalvo()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar a câmera.')
    } finally {
      setSalvando(false)
    }
  })

  return (
    <Modal show title={edicao ? 'Editar câmera' : 'Cadastrar câmera'} onClose={onFechar} onConfirm={() => void enviar()} confirmLabel="Salvar" loading={salvando}>
      <form onSubmit={(e) => void enviar(e)} noValidate>
        {erro && <Alert tone="danger">{erro}</Alert>}
        <TextField label="Número de série" error={errors.deviceserial?.message} disabled={edicao} autoComplete="off" {...register('deviceserial')} />
        <TextField label="Canal" type="number" inputMode="numeric" error={errors.canal?.message} disabled={edicao} {...register('canal')} />
        <TextField label="Nome" error={errors.nome?.message} {...register('nome')} />
        <TextField label="ID do refrigerador vigiado" hint="Deixe em branco para não vincular." error={errors.deviceid?.message} autoComplete="off" {...register('deviceid')} />
        <TextField
          label="Código da etiqueta (6 letras)"
          hint={camera?.codigo_cadastrado ? 'Já cadastrado; preencha só para trocar.' : 'Necessário para câmeras com criptografia.'}
          error={errors.codigo?.message}
          autoComplete="off"
          {...register('codigo')}
        />
        {edicao && <CheckField kind="switch" label="Câmera ativa" {...register('ativo')} />}
        <button type="submit" className="d-none" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
