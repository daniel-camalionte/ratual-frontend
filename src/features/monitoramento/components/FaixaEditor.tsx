import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SelectField, TextField } from '@/components/forms/Fields'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Refrigerador } from '../types'

const num = (msg: string) => z.string().trim().min(1, msg).transform((v) => Number(v.replace(',', '.'))).pipe(z.number({ message: msg }).finite(msg))

const schema = z
  .object({
    tipo: z.enum(['congelado', 'resfriado'], { message: 'Selecione o tipo.' }),
    min: num('Informe a mínima.'),
    max: num('Informe a máxima.'),
    tolerancia: z
      .string()
      .trim()
      .min(1, 'Informe a tolerância.')
      .transform((v) => Number(v.replace(',', '.')))
      .pipe(z.number({ message: 'Informe a tolerância.' }).int('Use minutos inteiros.').min(0, 'De 0 a 1440 minutos.').max(1440, 'De 0 a 1440 minutos.')),
  })
  .refine((v) => v.min < v.max, { path: ['max'], message: 'A mínima deve ser menor que a máxima.' })

type Entrada = z.input<typeof schema>
type Saida = z.output<typeof schema>

/** Botão + modal para o master calibrar tipo, faixa ideal e tolerância (`PUT /v1/dispositivos/<id>`). */
export function FaixaEditor({ r, onSalvo }: { r: Refrigerador; onSalvo: () => void }) {
  const { isMaster } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Entrada, unknown, Saida>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: r.tipo, min: String(r.faixa.min ?? ''), max: String(r.faixa.max ?? ''), tolerancia: String(r.toleranciaMin ?? 0) },
  })

  if (!isMaster) return null

  const abrir = () => {
    reset({ tipo: r.tipo, min: String(r.faixa.min ?? ''), max: String(r.faixa.max ?? ''), tolerancia: String(r.toleranciaMin ?? 0) })
    setErro('')
    setAberto(true)
  }

  const salvar = handleSubmit(async (v) => {
    setErro('')
    setSalvando(true)
    try {
      await api.put(`/v1/dispositivos/${encodeURIComponent(r.id)}`, { tipo: v.tipo, temp_min: v.min, temp_max: v.max, tolerancia_min: v.tolerancia })
      setAberto(false)
      onSalvo()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  })

  return (
    <>
      <Button variant="primary" outline size="sm" icon="temperature" onClick={abrir}>
        Editar faixa
      </Button>
      <Modal show={aberto} title="Faixa ideal" onClose={() => !salvando && setAberto(false)} onConfirm={() => void salvar()} confirmLabel="Salvar" loading={salvando}>
        <p className="text-muted">{r.nome}</p>
        <form onSubmit={(e) => void salvar(e)} noValidate>
          <SelectField
            label="Tipo"
            options={[
              { value: 'congelado', label: 'Congelados' },
              { value: 'resfriado', label: 'Resfriados' },
            ]}
            {...register('tipo')}
            error={errors.tipo?.message}
          />
          <div className="row">
            <div className="col-6">
              <TextField label="Mínima (°C)" inputMode="decimal" {...register('min')} error={errors.min?.message} />
            </div>
            <div className="col-6">
              <TextField label="Máxima (°C)" inputMode="decimal" {...register('max')} error={errors.max?.message} />
            </div>
          </div>
          <TextField
            label="Tolerância antes do alerta (min)"
            inputMode="numeric"
            hint="Tempo fora da faixa até virar alerta. Evita alarme durante o degelo."
            {...register('tolerancia')}
            error={errors.tolerancia?.message}
          />
          <button type="submit" className="d-none" tabIndex={-1} aria-hidden="true" />
        </form>
        {erro && <Alert tone="danger">{erro}</Alert>}
      </Modal>
    </>
  )
}
