import { useEffect, useRef, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { CheckField } from '@/components/forms/Fields'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Refrigerador } from '../types'

/**
 * Estado do compressor; para admin vira botão liga/desliga com confirmação (desligar exige marcar a ciência).
 * `POST /v1/ewelink/dispositivo/<id>/rele` — a eWeLink leva alguns segundos para refletir, por isso recarregamos de novo depois.
 */
export function ReleBotao({ r, onAlterado }: { r: Refrigerador; onAlterado: () => void }) {
  const { isAdmin } = useAuth()
  const [aberto, setAberto] = useState(false)
  const [ciente, setCiente] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const ligado = r.compressorLigado === true
  const ligar = !ligado
  const rotulo = r.compressorLigado === null ? 'Compressor --' : `Compressor ${ligado ? 'ligado' : 'desligado'}`
  const tone = ligado ? 'success' : 'secondary'

  if (!isAdmin) {
    return (
      <span className={`badge bg-${tone}-subtle text-${tone} d-inline-flex align-items-center gap-1 fs-3 py-2`}>
        <Icon name="power" /> {rotulo}
      </span>
    )
  }

  const fechar = () => {
    if (enviando) return
    setAberto(false)
    setCiente(false)
    setErro('')
    setOk(false)
  }

  const enviar = async () => {
    if (!ligar && !ciente) {
      setErro('Marque a confirmação para desligar o compressor.')
      return
    }
    setErro('')
    setEnviando(true)
    try {
      await api.post(`/v1/ewelink/dispositivo/${encodeURIComponent(r.id)}/rele`, { ligado: ligar })
      setOk(true)
      onAlterado()
      timer.current = window.setTimeout(onAlterado, 3000)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível enviar o comando.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Button
        variant={tone}
        subtle
        icon="power"
        disabled={!r.online}
        title={r.online ? `Toque para ${ligado ? 'desligar' : 'ligar'}` : 'Aparelho offline'}
        onClick={() => setAberto(true)}
      >
        {rotulo}
      </Button>
      <Modal
        show={aberto}
        title={`${ligar ? 'Ligar' : 'Desligar'} o compressor?`}
        onClose={fechar}
        onConfirm={ok ? undefined : () => void enviar()}
        confirmLabel={ligar ? 'Ligar' : 'Desligar'}
        confirmVariant={ligar ? 'success' : 'danger'}
        loading={enviando}
      >
        {ok ? (
          <Alert tone="success">
            Comando enviado. Compressor de <strong>{r.nome}</strong> {ligar ? 'ligado' : 'desligado'}.
          </Alert>
        ) : (
          <>
            <p className="fw-medium mb-2">{r.nome}</p>
            <p className="mb-2">
              {ligar
                ? 'O compressor volta a refrigerar imediatamente.'
                : 'Com o compressor desligado a temperatura vai subir. Isso pode comprometer os produtos armazenados.'}
            </p>
            <p className="text-muted small">Se o termostato estiver no modo Automático, ele pode alterar o compressor sozinho conforme a temperatura.</p>
            {!ligar && <CheckField label="Estou ciente e quero desligar o compressor deste refrigerador." checked={ciente} onChange={(e) => setCiente(e.target.checked)} />}
            {erro && <Alert tone="danger">{erro}</Alert>}
          </>
        )}
      </Modal>
    </>
  )
}
