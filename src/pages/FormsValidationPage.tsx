import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PageHeader } from '@/components/ui/PageHeader'
import { CheckField, SelectField, TextAreaField, TextField } from '@/components/forms/Fields'

// Regra de seguranca: toda entrada e validada aqui (UX) E de novo no backend (autoridade).
const schema = z.object({
  nome: z.string().trim().min(3, 'Informe ao menos 3 caracteres.').max(120, 'Máximo de 120 caracteres.'),
  email: z.string().trim().email('E-mail inválido.').max(254),
  tipo: z.enum(['pf', 'pj'], { message: 'Selecione o tipo.' }),
  telefone: z
    .string()
    .trim()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido. Ex.: (11) 99999-9999.'),
  observacoes: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
  aceite: z.literal(true, { message: 'É preciso aceitar os termos.' }),
})

type FormData = z.infer<typeof schema>

export default function FormsValidationPage() {
  const [enviado, setEnviado] = useState<FormData | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  const onSubmit = async (data: FormData) => {
    // Aqui entraria: await api.post('/v1/clientes', data, clienteSchema)
    await new Promise((r) => setTimeout(r, 400))
    setEnviado(data)
    reset()
  }

  return (
    <>
      <PageHeader title="Cadastro com validação" crumbs={[{ label: 'Formulários' }, { label: 'Validação' }]} />
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <Card title="Novo cliente" subtitle="react-hook-form + zod">
            {enviado && (
              <Alert tone="success" onClose={() => setEnviado(null)}>
                Cadastro de <strong>{enviado.nome}</strong> validado. (Demonstração: nada foi enviado ao servidor.)
              </Alert>
            )}
            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
              <TextField label="Nome" autoComplete="name" {...register('nome')} error={errors.nome?.message} />
              <TextField label="E-mail" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
              <div className="row">
                <div className="col-md-6">
                  <SelectField
                    label="Tipo"
                    placeholder="Selecione..."
                    options={[
                      { value: 'pf', label: 'Pessoa física' },
                      { value: 'pj', label: 'Pessoa jurídica' },
                    ]}
                    {...register('tipo')}
                    error={errors.tipo?.message}
                  />
                </div>
                <div className="col-md-6">
                  <TextField label="Telefone" inputMode="tel" autoComplete="tel" {...register('telefone')} error={errors.telefone?.message} />
                </div>
              </div>
              <TextAreaField label="Observações" {...register('observacoes')} error={errors.observacoes?.message} />
              <CheckField label="Li e aceito os termos" {...register('aceite')} error={errors.aceite?.message} />
              <div className="d-flex gap-2 mt-3">
                <Button type="submit" loading={isSubmitting} icon="device-floppy">
                  Salvar
                </Button>
                <Button variant="light" onClick={() => reset()}>
                  Limpar
                </Button>
              </div>
            </form>
          </Card>
        </div>
        <div className="col-12 col-lg-5">
          <Card title="Boas práticas aplicadas">
            <ul className="mb-0 rt-list">
              <li>Validação no cliente só melhora a experiência; o backend revalida tudo.</li>
              <li>Limites de tamanho em todo campo de texto.</li>
              <li>Textos são renderizados pelo React (escapados); nunca HTML cru.</li>
              <li>Erros ligados ao campo por <code>aria-describedby</code>.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
