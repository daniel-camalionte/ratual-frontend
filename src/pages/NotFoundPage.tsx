import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="display-1 fw-bold text-primary">404</h1>
      <p className="lead">Página não encontrada.</p>
      <Link to="/">
        <Button icon="home">Voltar ao painel</Button>
      </Link>
    </div>
  )
}
