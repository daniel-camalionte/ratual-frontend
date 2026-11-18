import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import CameraPlayer from '@/features/cameras/CameraPlayer'
import CameraFormModal from '@/features/cameras/CameraFormModal'
import ContaEzviz from '@/features/cameras/ContaEzviz'
import { CameraModal, FotoAlarme, FotoModal } from '@/features/cameras/CameraExtras'
import { useAlarmes, useCameras } from '@/features/cameras/useCameras'
import { dataHora, deApi, horario, paraApi, type Alarme, type Camera, type ModoVideo } from '@/features/cameras/types'
import '@/features/cameras/cameras.css'

const iso = (d: Date) => paraApi(d).slice(0, 16).replace(' ', 'T')

/** Abre a gravação de um horário escolhido (útil para investigar um pico de temperatura). */
function BuscarGravacao({ camera }: { camera: Camera }) {
  const [quando, setQuando] = useState(() => iso(new Date(Date.now() - 30 * 60_000)))
  const [minutos, setMinutos] = useState(10)
  const [modo, setModo] = useState<ModoVideo | null>(null)

  const abrir = () => {
    const ini = new Date(quando + ':00-03:00')
    if (Number.isNaN(ini.getTime())) return
    setModo({ tipo: 'gravacao', inicio: paraApi(ini), fim: paraApi(new Date(ini.getTime() + minutos * 60_000)), origem: 'nuvem' })
  }

  return (
    <Card title="Gravações" subtitle="Veja o que aconteceu em um horário específico">
      <label htmlFor="cam-quando" className="form-label">
        Início
      </label>
      <input id="cam-quando" type="datetime-local" className="form-control mb-2" value={quando} max={iso(new Date())} onChange={(e) => setQuando(e.target.value)} />
      <label htmlFor="cam-min" className="form-label">
        Duração
      </label>
      <select id="cam-min" className="form-select mb-3" value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}>
        {[5, 10, 30, 60].map((m) => (
          <option key={m} value={m}>
            {m} min
          </option>
        ))}
      </select>
      <Button className="w-100 cam-touch" onClick={abrir} icon="player-play">
        Assistir
      </Button>
      {modo && <CameraModal idCamera={camera.id_camera} titulo={camera.nome ?? camera.deviceserial} modo={modo} onFechar={() => setModo(null)} />}
    </Card>
  )
}

function Deteccoes({ camera }: { camera: Camera }) {
  const alarmes = useAlarmes(camera.id_camera)
  const [foto, setFoto] = useState<Alarme | null>(null)
  const lista = alarmes.data?.alarmes ?? []
  const comFoto = lista.filter((a) => a.tem_foto)
  const semFoto = lista.filter((a) => !a.tem_foto)
  const titulo = camera.nome ?? camera.deviceserial

  return (
    <Card title="Detecções" subtitle="Movimento ou pessoa identificados pela câmera" actions={<Badge tone="secondary">{lista.length}</Badge>}>
      {alarmes.loading && !alarmes.data ? (
        <Spinner />
      ) : alarmes.error ? (
        <Alert tone="danger">{alarmes.error}</Alert>
      ) : lista.length === 0 ? (
        <p className="text-muted text-center py-3 mb-0">Nenhuma detecção registrada ainda.</p>
      ) : (
        <>
          {comFoto.length > 0 && (
            <div className="cam-fotos">
              {comFoto.slice(0, 12).map((a) => (
                <div key={a.id_alarme} className="position-relative">
                  <FotoAlarme idAlarme={a.id_alarme} onClick={() => setFoto(a)} label={`Ampliar detecção das ${horario(deApi(a.data))}`} />
                  <small className="position-absolute bottom-0 start-0 m-1 px-1 rounded bg-dark bg-opacity-75 text-white" style={{ pointerEvents: 'none' }}>
                    {horario(deApi(a.data))}
                  </small>
                </div>
              ))}
            </div>
          )}
          {semFoto.length > 0 && (
            <ul className={`list-unstyled small mb-0 ${comFoto.length ? 'mt-3 pt-2 border-top' : ''}`}>
              {semFoto.slice(0, 6).map((a) => (
                <li key={a.id_alarme} className="d-flex justify-content-between gap-2 py-1 text-muted">
                  <span>Detecção {a.foto_criptografada ? 'sem foto (câmera estava com criptografia)' : 'sem foto'}</span>
                  <span>{dataHora(deApi(a.data))}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {foto && deApi(foto.data) && <FotoModal idAlarme={foto.id_alarme} idCamera={camera.id_camera} quando={deApi(foto.data)!} titulo={titulo} onFechar={() => setFoto(null)} />}
    </Card>
  )
}

export default function CamerasPage() {
  const { isMaster } = useAuth()
  const cameras = useCameras(isMaster)
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState<{ camera?: Camera; inicial?: { deviceserial: string; canal: number; nome?: string | null } } | null>(null)
  const [conta, setConta] = useState(false)
  const lista = cameras.data?.cameras ?? []
  const selecionada = lista.find((c) => String(c.id_camera) === params.get('camera')) ?? lista[0]

  const acoes = isMaster ? (
    <>
      <Button outline size="sm" className="cam-touch" icon="brand-youtube" onClick={() => setConta((v) => !v)} aria-expanded={conta}>
        Conta EZVIZ
      </Button>
      <Button size="sm" className="cam-touch" icon="plus" onClick={() => setForm({})}>
        Cadastrar
      </Button>
    </>
  ) : undefined

  return (
    <>
      <PageHeader title="Câmeras" crumbs={[{ label: 'Câmeras' }]} actions={acoes} />

      {isMaster && conta && (
        <div className="mb-4">
          <ContaEzviz onCadastrar={(inicial) => setForm({ inicial })} />
        </div>
      )}

      {cameras.loading && !cameras.data ? (
        <Spinner />
      ) : cameras.error ? (
        <Alert tone="danger">
          {cameras.error}{' '}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={cameras.reload}>
            Tentar de novo
          </button>
        </Alert>
      ) : !selecionada ? (
        <Card>
          <div className="text-center py-4">
            <Icon name="video-off" className="cam-ico-lg text-muted" />
            <p className="fw-medium mt-2 mb-1">Nenhuma câmera disponível</p>
            <p className="text-muted small mb-0">O monitoramento por câmera é um serviço da Refrigeração Atual. Fale com a gente para instalar uma câmera na sua câmara fria.</p>
          </div>
        </Card>
      ) : (
        <>
          {lista.length > 1 && (
            <div className="cam-chips mb-3" role="group" aria-label="Câmeras">
              {lista.map((c) => (
                <button key={c.id_camera} type="button" className="cam-card" aria-pressed={c.id_camera === selecionada.id_camera} onClick={() => setParams({ camera: String(c.id_camera) })}>
                  <span className={`cam-dot ${c.online ? 'cam-dot--on' : ''}`} role="img" aria-label={c.online ? 'Online' : 'Offline'} />
                  <span className="min-w-0 flex-grow-1">
                    <span className="d-block text-truncate fw-medium">{c.nome ?? c.deviceserial}</span>
                    <small className="d-block text-truncate text-muted">{c.refrigerador?.nome ?? 'Sem refrigerador vinculado'}</small>
                  </span>
                  {!c.ativo && <Badge tone="secondary">Inativa</Badge>}
                </button>
              ))}
            </div>
          )}

          <div className="row g-3">
            <div className="col-lg-8">
              <Card>
                <CameraPlayer key={selecionada.id_camera} idCamera={selecionada.id_camera} online={selecionada.online} />
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                  <div className="min-w-0">
                    <div className="fw-semibold text-truncate">{selecionada.nome ?? selecionada.deviceserial}</div>
                    <small className="text-muted">
                      {selecionada.online ? 'Online' : 'Offline'} · {selecionada.modelo ?? 'EZVIZ'}
                      {selecionada.refrigerador && ` · ${selecionada.refrigerador.nome}`}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {selecionada.ultimo_alarme_em && <small className="text-muted">Última detecção {dataHora(deApi(selecionada.ultimo_alarme_em))}</small>}
                    {isMaster && (
                      <Button size="sm" outline variant="secondary" className="cam-touch" icon="pencil" onClick={() => setForm({ camera: selecionada })}>
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
              <div className="mt-3">
                <Deteccoes key={selecionada.id_camera} camera={selecionada} />
              </div>
            </div>
            <div className="col-lg-4">
              <BuscarGravacao key={selecionada.id_camera} camera={selecionada} />
            </div>
          </div>
        </>
      )}

      {form && (
        <CameraFormModal
          camera={form.camera}
          inicial={form.inicial}
          onFechar={() => setForm(null)}
          onSalvo={() => {
            setForm(null)
            cameras.reload()
          }}
        />
      )}
    </>
  )
}
