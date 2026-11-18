import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/auth'
import { formatarTelefone } from '@/lib/telefone'

const PERFIL: Record<string, string> = { admin: 'Administrador', operador: 'Operador', visualizador: 'Visualizador' }

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export default function ContaPage() {
  const { user, isAdmin, logout } = useAuth()
  if (!user) return null

  const linhas = [
    { icon: 'mail', label: 'E-mail', valor: user.login },
    { icon: 'phone', label: 'Telefone', valor: formatarTelefone(user.telefone) || '—' },
    { icon: 'shield', label: 'Perfil', valor: PERFIL[user.perfil] ?? user.perfil },
    { icon: 'building', label: 'Empresa', valor: user.empresa.nome },
  ]

  return (
    <div className="mx-auto d-flex flex-column gap-3" style={{ maxWidth: 560 }}>
      <h4 className="fw-medium mb-0">Minha conta</h4>

      <Card>
        <div className="d-flex align-items-center gap-3">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-semibold flex-shrink-0"
            style={{ width: 56, height: 56 }}
            aria-hidden="true"
          >
            {iniciais(user.nome)}
          </span>
          <div className="min-w-0">
            <p className="fw-semibold fs-5 mb-0 text-truncate">{user.nome}</p>
            <p className="text-muted mb-0 text-truncate">
              {user.empresa.tipo === 'master' ? <Badge tone="primary">Acesso master</Badge> : user.empresa.nome}
            </p>
          </div>
        </div>
      </Card>

      <Card bodyClassName="py-2">
        <dl className="mb-0">
          {linhas.map((l, i) => (
            <div key={l.label} className={`d-flex align-items-center gap-3 py-3 ${i ? 'border-top' : ''}`} style={{ minHeight: 48 }}>
              <Icon name={l.icon} className="fs-5 text-muted" />
              <dt className="fw-normal text-muted flex-grow-1 mb-0">{l.label}</dt>
              <dd className="fw-medium mb-0 text-end text-break">{l.valor}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {isAdmin && (
        <Link to="/gestao" className="btn btn-light d-flex align-items-center gap-2 w-100 py-3 d-lg-none">
          <Icon name="settings" />
          <span className="flex-grow-1 text-start">Gestão</span>
          <Icon name="chevron-right" />
        </Link>
      )}
      <Button variant="danger" outline className="w-100 py-3" icon="logout" onClick={() => void logout()}>
        Sair da conta
      </Button>
    </div>
  )
}
