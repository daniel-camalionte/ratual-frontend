import { useMemo, useState } from 'react'
import { useApi } from '@/lib/useApi'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Abas, LinhaOrdem } from './Abas'
import { AgendaSemana } from './AgendaSemana'
import { AbaBloqueios, AbaGrade, AbaPlanos, AbaTecnicos, AbaTipos } from './Cadastros'
import { NovoAgendamento } from './NovoAgendamento'
import { OrdemEquipeModal } from './OrdemModais'
import { ABERTOS, inicioSemana, isoLocal, somarDias, type Bloqueio, type Janela, type Ordem, type StatusOS, type Tecnico } from './servicos'

type Filtro = 'abertos' | StatusOS | 'todos'
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'solicitado', label: 'Solicitados' },
  { id: 'abertos', label: 'Em aberto' },
  { id: 'concluido', label: 'Concluídos' },
  { id: 'cancelado', label: 'Cancelados' },
  { id: 'todos', label: 'Todos' },
]

function Pedidos({ ordens, onAbrir }: { ordens: Ordem[]; onAbrir: (o: Ordem) => void }) {
  const [filtro, setFiltro] = useState<Filtro>('solicitado')
  const lista = ordens.filter((o) => filtro === 'todos' || (filtro === 'abertos' ? ABERTOS.includes(o.status) : o.status === filtro))
  const ordenada = filtro === 'concluido' || filtro === 'cancelado' || filtro === 'todos' ? [...lista].reverse() : lista
  return (
    <div>
      <div className="sv-filtros" role="group" aria-label="Filtro de pedidos">
        {FILTROS.map((f) => {
          const n = f.id === 'solicitado' ? ordens.filter((o) => o.status === 'solicitado').length : 0
          return (
            <button key={f.id} type="button" className={`sv-chip ${filtro === f.id ? 'is-active' : ''}`} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.label}
              {n > 0 && ` (${n})`}
            </button>
          )
        })}
      </div>
      <Card bodyClassName="p-0">
        {ordenada.length ? (
          <ul className="list-unstyled mb-0 sv-lista">
            {ordenada.map((o) => (
              <LinhaOrdem key={o.id_os} o={o} equipe onAbrir={() => onAbrir(o)} />
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted py-4 mb-0">Nenhuma ordem neste filtro.</p>
        )}
      </Card>
    </div>
  )
}

type AbaEquipe = 'agenda' | 'pedidos' | 'cadastros'
type AbaCadastro = 'tipos' | 'tecnicos' | 'grade' | 'bloqueios' | 'planos'

/** Visão master/equipe: agenda semanal, pedidos dos clientes e cadastros. */
export function CentralServicos() {
  const [aba, setAba] = useState<AbaEquipe>('agenda')
  const [cadastro, setCadastro] = useState<AbaCadastro>('tipos')
  const [semana, setSemana] = useState(() => inicioSemana(new Date()))
  const [aberta, setAberta] = useState<Ordem | null>(null)
  const [novo, setNovo] = useState<{ data: string; hora_inicio?: string } | null>(null)
  const [avisos, setAvisos] = useState<string[]>([])

  const daSemana = useApi<{ ordens: Ordem[] }>(aba === 'agenda' ? `/v1/ordens?inicio=${isoLocal(semana)}&fim=${isoLocal(somarDias(semana, 6))}` : null)
  const todas = useApi<{ ordens: Ordem[] }>('/v1/ordens') // pedidos e contador de solicitados
  const grade = useApi<{ janelas: Janela[] }>('/v1/agenda/grade')
  const bloqueios = useApi<{ bloqueios: Bloqueio[] }>('/v1/agenda/bloqueios')
  const tecnicos = useApi<{ tecnicos: Tecnico[] }>('/v1/tecnicos')
  const solicitados = useMemo(() => (todas.data?.ordens ?? []).filter((o) => o.status === 'solicitado').length, [todas.data])

  const atualizar = (a: string[]) => {
    setAvisos(a)
    setAberta(null)
    setNovo(null)
    daSemana.reload()
    todas.reload()
  }
  const erroLista = (e: string, tentar: () => void) => (
    <Alert tone="danger">
      <span>{e} </span>
      <Button size="sm" variant="light" onClick={tentar}>
        Tentar de novo
      </Button>
    </Alert>
  )

  return (
    <div>
      <div className="sv-toolbar">
        <Abas
          label="Seções"
          atual={aba}
          onTrocar={setAba}
          abas={[
            { id: 'agenda', label: 'Agenda', icon: 'calendar' },
            { id: 'pedidos', label: 'Pedidos', icon: 'clipboard-list', contador: solicitados },
            { id: 'cadastros', label: 'Cadastros', icon: 'settings' },
          ]}
        />
        {aba !== 'cadastros' && (
          <Button icon="plus" onClick={() => setNovo({ data: isoLocal(somarDias(new Date(), 1)) })}>
            Novo agendamento
          </Button>
        )}
      </div>
      {avisos.map((a) => (
        <Alert key={a} tone="info" onClose={() => setAvisos((l) => l.filter((x) => x !== a))}>
          {a}
        </Alert>
      ))}

      {aba === 'agenda' &&
        (daSemana.error ? (
          erroLista(daSemana.error, daSemana.reload)
        ) : (
          <AgendaSemana
            semana={semana}
            onSemana={(d) => setSemana(inicioSemana(d))}
            ordens={daSemana.data?.ordens ?? []}
            janelas={grade.data?.janelas ?? []}
            bloqueios={bloqueios.data?.bloqueios ?? []}
            onAbrir={setAberta}
            onNovo={(data, hora) => setNovo({ data, hora_inicio: hora || undefined })}
          />
        ))}
      {aba === 'pedidos' && (todas.loading && !todas.data ? <Spinner /> : todas.error ? erroLista(todas.error, todas.reload) : <Pedidos ordens={todas.data?.ordens ?? []} onAbrir={setAberta} />)}
      {aba === 'cadastros' && (
        <div>
          <Abas
            label="Cadastros"
            atual={cadastro}
            onTrocar={setCadastro}
            abas={[
              { id: 'tipos', label: 'Tipos de serviço' },
              { id: 'tecnicos', label: 'Técnicos' },
              { id: 'grade', label: 'Grade de horários' },
              { id: 'bloqueios', label: 'Bloqueios' },
              { id: 'planos', label: 'Planos' },
            ]}
          />
          <div className="mt-3">
            {cadastro === 'tipos' && <AbaTipos />}
            {cadastro === 'tecnicos' && <AbaTecnicos />}
            {cadastro === 'grade' && <AbaGrade />}
            {cadastro === 'bloqueios' && <AbaBloqueios />}
            {cadastro === 'planos' && <AbaPlanos />}
          </div>
        </div>
      )}

      {aberta && <OrdemEquipeModal ordem={aberta} tecnicos={tecnicos.data?.tecnicos ?? []} onClose={() => setAberta(null)} onAlterado={atualizar} />}
      {novo && <NovoAgendamento inicial={novo} tecnicos={tecnicos.data?.tecnicos ?? []} onClose={() => setNovo(null)} onCriado={atualizar} />}
    </div>
  )
}
