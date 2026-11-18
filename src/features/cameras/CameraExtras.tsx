import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import CameraPlayer from './CameraPlayer'
import { horario, janelaDoMomento, type ModoVideo } from './types'

/** Foto do alarme: o cookie de sessão autoriza a imagem direto no <img>. */
export function FotoAlarme({ idAlarme, className = '', onClick, label }: { idAlarme: number; className?: string; onClick?: () => void; label?: string }) {
  const [falhou, setFalhou] = useState(false)
  if (falhou)
    return (
      <div className={`cam-foto cam-foto--vazia ${className}`.trim()} role="img" aria-label="Foto indisponível">
        <Icon name="photo-off" />
      </div>
    )
  const img = (
    <img
      className={`cam-foto ${className}`.trim()}
      src={`/api/v1/cameras/alarmes/${idAlarme}/foto`}
      alt="Foto da detecção"
      width={320}
      height={180}
      loading="lazy"
      onError={() => setFalhou(true)}
    />
  )
  if (!onClick) return img
  return (
    <button type="button" className="cam-foto-btn" onClick={onClick} aria-label={label ?? 'Ampliar foto da detecção'}>
      {img}
    </button>
  )
}

/** Modal com o player: ao vivo ou gravação de um momento (mobile: tela cheia, via Modal compartilhado). */
export function CameraModal({ idCamera, titulo, modo, online = true, onFechar }: {
  idCamera: number
  titulo: string
  modo?: ModoVideo
  online?: boolean
  onFechar: () => void
}) {
  const [origem, setOrigem] = useState<'nuvem' | 'sd'>(modo?.tipo === 'gravacao' ? modo.origem : 'nuvem')
  const atual: ModoVideo = modo?.tipo === 'gravacao' ? { ...modo, origem } : { tipo: 'ao_vivo' }
  const gravacao = atual.tipo === 'gravacao'
  return (
    <Modal show title={titulo} onClose={onFechar}>
      <p className="text-muted small mb-2">{gravacao ? `Gravação de ${atual.inicio.slice(11, 16)} a ${atual.fim.slice(11, 16)}` : 'Ao vivo'}</p>
      <CameraPlayer idCamera={idCamera} modo={atual} autoIniciar online={online || gravacao} />
      {gravacao ? (
        <div className="btn-group w-100 mt-3" role="group" aria-label="Origem da gravação">
          {(['nuvem', 'sd'] as const).map((o) => (
            <button key={o} type="button" aria-pressed={origem === o} className={`btn cam-touch ${origem === o ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setOrigem(o)}>
              {o === 'nuvem' ? 'Nuvem (CloudPlay)' : 'Cartão da câmera'}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted small mt-3 mb-0">O vídeo pausa sozinho depois de alguns minutos para economizar dados.</p>
      )}
    </Modal>
  )
}

/** Foto ampliada com atalho para a gravação daquele momento. */
export function FotoModal({ idAlarme, idCamera, quando, titulo, onFechar }: {
  idAlarme: number
  idCamera: number
  quando: Date
  titulo: string
  onFechar: () => void
}) {
  const [video, setVideo] = useState(false)
  if (video) return <CameraModal idCamera={idCamera} titulo={titulo} modo={janelaDoMomento(quando)} onFechar={onFechar} />
  return (
    <Modal show title={titulo} onClose={onFechar} onConfirm={() => setVideo(true)} confirmLabel="Ver gravação deste momento">
      <p className="text-muted small mb-2">Detecção às {horario(quando)}</p>
      <FotoAlarme idAlarme={idAlarme} className="cam-foto--grande" />
    </Modal>
  )
}
