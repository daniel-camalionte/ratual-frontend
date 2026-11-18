import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useApi } from '@/lib/useApi'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { LinhaOrdem } from './Abas'
import { OrdemClienteModal } from './OrdemModais'
import { SolicitarVisita } from './SolicitarVisita'
import { ABERTOS, pct, type Catalogo, type Ordem } from './servicos'

/** Visão do cliente: plano, pedir visita, acompanhar e cancelar as próprias ordens. */
export function ServicosCliente() {
  const { user } = useAuth()
  const catalogo = useApi<Catalogo>('/v1/servicos/catalogo')
  const ordens = useApi<{ ordens: Ordem[] }>('/v1/ordens')
  const [pedindo, setPedindo] = useState(false)
  const [aberta, setAberta] = useState<Ordem | null>(null)
  const [enviado, setEnviado] = useState(false)
  const podePedir = user?.perfil !== 'visualizador'

  if ((ordens.loading && !ordens.data) || (catalogo.loading && !catalogo.data)) return <Spinner />
  if (ordens.error)
    return (
      <Alert tone="danger">
        <span>{ordens.error} </span>
        <Button size="sm" variant="light" onClick={ordens.reload}>
          Tentar de novo
        </Button>
      </Alert>
    )

  const lista = ordens.data?.ordens ?? []
  const proximas = lista.filter((o) => ABERTOS.includes(o.status))
  const historico = lista.filter((o) => !ABERTOS.includes(o.status)).reverse()
  const plano = catalogo.data?.plano

  return (
    <div>
      <Card>
        <div className="sv-plano">
          <span className="sv-plano-icon">
            <Icon name="shield-check" />
          </span>
          <div className="flex-grow-1">
            {plano ? (
              <>
                <p className="fw-semibold mb-0">Plano {plano.nome}</p>
                <p className="text-muted mb-0">{pct(plano.desconto_servico)}% de desconto na mão de obra de cada serviço</p>
              </>
            ) : (
              <>
                <p className="fw-semibold mb-0">Visitas técnicas</p>
                <p className="text-muted mb-0">Peça uma visita e escolha o melhor horário.</p>
              </>
            )}
          </div>
          {podePedir && catalogo.data && (
            <Button
              icon="calendar-plus"
              className="sv-plano-btn"
              onClick={() => {
                setEnviado(false)
                setPedindo(true)
              }}
            >
              Solicitar visita
            </Button>
          )}
        </div>
      </Card>
      {catalogo.error && <Alert tone="warning">{catalogo.error}</Alert>}
      {enviado && <Alert tone="success">Pedido enviado! A equipe vai confirmar o horário e você acompanha por aqui.</Alert>}

      <h2 className="sv-secao">Próximas visitas</h2>
      <Card bodyClassName="p-0">
        {proximas.length ? (
          <ul className="list-unstyled mb-0 sv-lista">
            {proximas.map((o) => (
              <LinhaOrdem key={o.id_os} o={o} equipe={false} onAbrir={() => setAberta(o)} />
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted py-4 mb-0">Nenhuma visita marcada.</p>
        )}
      </Card>
      {historico.length > 0 && (
        <>
          <h2 className="sv-secao">Histórico</h2>
          <Card bodyClassName="p-0">
            <ul className="list-unstyled mb-0 sv-lista">
              {historico.map((o) => (
                <LinhaOrdem key={o.id_os} o={o} equipe={false} onAbrir={() => setAberta(o)} />
              ))}
            </ul>
          </Card>
        </>
      )}

      {pedindo && catalogo.data && (
        <SolicitarVisita
          catalogo={catalogo.data}
          onClose={() => setPedindo(false)}
          onEnviado={() => {
            setPedindo(false)
            setEnviado(true)
            ordens.reload()
          }}
        />
      )}
      {aberta && (
        <OrdemClienteModal
          ordem={aberta}
          podeCancelar={podePedir}
          onClose={() => setAberta(null)}
          onAlterado={() => {
            setAberta(null)
            ordens.reload()
          }}
        />
      )}
    </div>
  )
}
