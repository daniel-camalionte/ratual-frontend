import { useAuth } from '@/lib/auth'
import { CentralServicos } from '@/features/servicos/CentralServicos'
import { ServicosCliente } from '@/features/servicos/ServicosCliente'
import '@/features/servicos/servicos.css'

export default function ServicosPage() {
  const { isMaster } = useAuth()
  return (
    <div className="sv-page">
      <h4 className="mb-1">{isMaster ? 'Central de serviços' : 'Serviços'}</h4>
      <p className="text-muted mb-3">{isMaster ? 'Agenda, pedidos dos clientes e ordens de serviço' : 'Visitas técnicas e manutenção dos seus equipamentos'}</p>
      {isMaster ? <CentralServicos /> : <ServicosCliente />}
    </div>
  )
}
