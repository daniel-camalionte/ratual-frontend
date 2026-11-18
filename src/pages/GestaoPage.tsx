import { useAuth } from '@/lib/auth'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { AbaUsuarios } from '@/features/gestao/components/AbaUsuarios'
import { AbaEmpresas } from '@/features/gestao/components/AbaEmpresas'
import { AbaRefrigeradores } from '@/features/gestao/components/AbaRefrigeradores'
import { AbaAuditoria } from '@/features/gestao/components/AbaAuditoria'
import '@/features/gestao/gestao.css'

export default function GestaoPage() {
  const { user, isMaster } = useAuth()
  const abas: TabItem[] = [
    { key: 'usuarios', label: 'Usuários', content: <AbaUsuarios master={isMaster} /> },
    ...(isMaster
      ? [
          { key: 'empresas', label: 'Empresas', content: <AbaEmpresas /> },
          { key: 'refrigeradores', label: 'Refrigeradores', content: <AbaRefrigeradores /> },
          { key: 'auditoria', label: 'Auditoria', content: <AbaAuditoria /> },
        ]
      : []),
  ]
  return (
    <div className="gt-wrap">
      <h4 className="mb-1">Gestão</h4>
      <p className="text-muted mb-3">{isMaster ? 'Empresas, usuários e refrigeradores' : `Usuários de ${user?.empresa.nome ?? ''}`}</p>
      {abas.length > 1 ? <Tabs items={abas} /> : abas[0]?.content}
    </div>
  )
}
