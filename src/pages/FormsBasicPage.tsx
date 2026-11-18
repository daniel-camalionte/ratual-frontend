import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { CheckField, SelectField, TextAreaField, TextField } from '@/components/forms/Fields'

export default function FormsBasicPage() {
  return (
    <>
      <PageHeader title="Campos básicos" crumbs={[{ label: 'Formulários' }, { label: 'Campos básicos' }]} />
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Card title="Entradas de texto">
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              <TextField label="Nome" placeholder="Seu nome" hint="Como aparece nos documentos." />
              <TextField label="E-mail" type="email" placeholder="voce@empresa.com" autoComplete="email" />
              <TextField label="Senha" type="password" autoComplete="new-password" />
              <TextField label="Campo com erro" error="Este campo é obrigatório." defaultValue="" />
              <TextField label="Desabilitado" disabled defaultValue="Somente leitura" />
              <TextAreaField label="Observações" placeholder="Digite aqui..." />
            </form>
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card title="Seleção">
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              <SelectField
                label="Categoria"
                placeholder="Selecione..."
                options={[
                  { value: 'a', label: 'Categoria A' },
                  { value: 'b', label: 'Categoria B' },
                ]}
              />
              <p className="mb-1 fw-semibold">Checkbox</p>
              <CheckField label="Receber e-mails" />
              <CheckField label="Aceito os termos" defaultChecked />
              <p className="mt-3 mb-1 fw-semibold">Radio</p>
              <CheckField kind="radio" name="plano" label="Mensal" defaultChecked />
              <CheckField kind="radio" name="plano" label="Anual" />
              <p className="mt-3 mb-1 fw-semibold">Switch</p>
              <CheckField kind="switch" label="Notificações ativas" defaultChecked />
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
