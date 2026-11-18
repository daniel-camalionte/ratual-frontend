import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type HlsType from 'hls.js'
import { api } from '@/lib/api'
import { Icon } from '@/components/ui/Icon'
import { deApi, type LinkVideo, type ModoVideo } from './types'

// Pausa automática: a EZVIZ cobra por tráfego, então ninguém deixa o vídeo rodando sem querer.
const LIMITE_MS = 3 * 60_000
// Renova o link (válido ~5 min) um pouco antes de vencer, sem interromper quem está assistindo.
const RENOVAR_ANTES_MS = 40_000

type Estado = 'parado' | 'carregando' | 'tocando' | 'pausa_auto' | 'erro'

/** O aparelho reproduz H.265 (HEVC)? Com suporte, pedimos o stream em H.265; senão a câmera deve estar em H.264. */
function suportaH265(): boolean {
  if (typeof window === 'undefined') return false
  const ms = (window as unknown as { MediaSource?: { isTypeSupported(t: string): boolean } }).MediaSource
  const mse = !!ms && ['video/mp4; codecs="hvc1.1.6.L93.B0"', 'video/mp4; codecs="hev1.1.6.L93.B0"'].some((t) => ms.isTypeSupported(t))
  const v = document.createElement('video')
  const nativo = !!v.canPlayType?.('application/vnd.apple.mpegurl') && !!v.canPlayType?.('video/mp4; codecs="hvc1"')
  return mse || nativo
}

/**
 * Câmeras EZVIZ/Hikvision põem delimitadores H.264 (00 00 01 09 30) dentro do stream H.265, o que derruba o decodificador
 * do Chrome. Troca pelo delimitador H.265 (46 01 50), sem mudar o tamanho do segmento.
 */
function limparDelimitadores(dados: ArrayBuffer) {
  const b = new Uint8Array(dados)
  for (let i = 0; i + 5 < b.length; i++) {
    if (b[i + 2] === 1 && b[i + 3] === 0x09 && b[i + 4] === 0x30 && b[i] === 0 && b[i + 1] === 0) {
      if (b[i + 5] === 0) {
        b[i + 3] = 0x46
        b[i + 4] = 0x01
        b[i + 5] = 0x50
      } else {
        b[i + 3] = 0x60
        b[i + 4] = 0x01
      }
    }
  }
}

const vencimento = (link: LinkVideo) => deApi(link.expira_em)?.getTime() ?? Date.now() + 240_000

function caminhoApi(idCamera: number, modo: ModoVideo, qualidade: 'hd' | 'sd', h265: boolean) {
  const base = modo.tipo === 'ao_vivo' ? `/v1/cameras/${idCamera}/ao-vivo` : `/v1/cameras/${idCamera}/gravacao`
  const query: Record<string, string | number | undefined> =
    modo.tipo === 'ao_vivo' ? { qualidade } : { inicio: modo.inicio, fim: modo.fim, origem: modo.origem }
  if (h265) query.h265 = 1
  return { path: base, query }
}

interface Props {
  idCamera: number
  modo?: ModoVideo
  /** ex.: nome/temperatura sobre o vídeo */
  overlay?: ReactNode
  autoIniciar?: boolean
  online?: boolean
}

const AO_VIVO: ModoVideo = { tipo: 'ao_vivo' }

/**
 * Player de câmera (ao vivo ou gravação). O backend entrega só um link HLS temporário; o vídeo vai direto da nuvem EZVIZ.
 * O hls.js (Chrome/Android não tocam HLS nativamente) é carregado por import dinâmico só quando alguém assiste.
 */
export default function CameraPlayer({ idCamera, modo = AO_VIVO, overlay, autoIniciar = false, online = true }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const hls = useRef<HlsType | null>(null)
  const timers = useRef<number[]>([])
  const h265 = useRef<boolean | null>(null)
  const [estado, setEstado] = useState<Estado>('parado')
  const [erro, setErro] = useState('')
  const [qualidade, setQualidade] = useState<'hd' | 'sd'>('hd')
  const [mudo, setMudo] = useState(true)
  const aoVivo = modo.tipo === 'ao_vivo'
  const modoChave = JSON.stringify(modo)

  const limparTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const parar = useCallback((proximo: Estado = 'parado') => {
    limparTimers()
    hls.current?.destroy()
    hls.current = null
    const v = video.current
    if (v) {
      v.pause?.()
      v.removeAttribute('src')
      v.load?.()
    }
    setEstado(proximo)
  }, [])

  const falhar = useCallback(
    (msg: string) => {
      parar('erro')
      setErro(msg)
    },
    [parar],
  )

  const tocar = useCallback(
    async (src: string) => {
      const v = video.current
      if (!v) return
      const { default: Hls } = await import('hls.js')
      if (Hls.isSupported()) {
        if (!hls.current) {
          const usaH265 = h265.current === true
          const LoaderBase = Hls.DefaultConfig.loader as unknown as new (cfg: unknown) => { load(ctx: unknown, cfg: unknown, cb: { onSuccess: (...a: unknown[]) => void }): void }
          class LoaderSegmento extends LoaderBase {
            load(ctx: unknown, cfg: unknown, cb: { onSuccess: (...a: unknown[]) => void }) {
              super.load(ctx, cfg, {
                ...cb,
                onSuccess: (resp: unknown, ...resto: unknown[]) => {
                  const data = (resp as { data: unknown }).data
                  if (data instanceof ArrayBuffer) limparDelimitadores(data)
                  cb.onSuccess(resp, ...resto)
                },
              })
            }
          }
          const h = new Hls({
            lowLatencyMode: true,
            liveDurationInfinity: true,
            manifestLoadingMaxRetry: 3,
            liveSyncDurationCount: 1,
            liveMaxLatencyDurationCount: 4,
            maxLiveSyncPlaybackRate: 1.2,
            ...(usaH265 && { fLoader: LoaderSegmento as never }),
          })
          h.on(Hls.Events.MANIFEST_PARSED, () => {
            v.play().catch(() => {})
          })
          // a EZVIZ entrega o link mesmo quando não vai mandar vídeo: o erro vem como trecho .../ErrCode/9053_0.ts
          h.on(Hls.Events.LEVEL_LOADED, (_, d) => {
            const f = d.details.fragments.find((x) => x.url.includes('ErrCode/'))
            if (!f) return
            const codigo = (f.url.split('ErrCode/')[1] ?? '').split(/[_.]/)[0]
            falhar(
              codigo === '9053'
                ? 'A câmera transmite em H.265 e este aparelho não reproduz esse formato. Mude a codificação de vídeo da câmera para H.264 no app EZVIZ.'
                : `A EZVIZ não entregou o vídeo (código ${codigo}). Verifique se a câmera está online.`,
            )
          })
          h.on(Hls.Events.ERROR, (_, d) => {
            if (!d.fatal) return
            if (d.type === Hls.ErrorTypes.MEDIA_ERROR) {
              h.recoverMediaError()
              return
            }
            falhar('O vídeo não carregou. Verifique se a câmera está online e tente de novo.')
          })
          h.attachMedia(v)
          hls.current = h
        }
        ;(hls.current as HlsType).loadSource(src)
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = src // Safari/iPhone toca HLS nativamente
        v.play().catch(() => {})
      } else {
        falhar('Este navegador não reproduz o vídeo da câmera.')
      }
    },
    [falhar],
  )

  const iniciar = useCallback(
    async (q: 'hd' | 'sd' = qualidade) => {
      limparTimers()
      setErro('')
      setEstado('carregando')
      try {
        h265.current ??= suportaH265()
        const { path, query } = caminhoApi(idCamera, modo, q, h265.current)
        const link = await api.get<LinkVideo>(path, undefined, { query })
        if (!link.url) throw new Error('A câmera não devolveu o vídeo agora.')
        await tocar(link.url)
        setEstado('tocando')
        // renova o link antes de vencer (só ao vivo; a gravação é um trecho curto)
        if (aoVivo) {
          const espera = Math.max(30_000, vencimento(link) - Date.now() - RENOVAR_ANTES_MS)
          timers.current.push(window.setTimeout(() => void iniciar(q), espera))
        }
        timers.current.push(window.setTimeout(() => parar('pausa_auto'), LIMITE_MS))
      } catch (e) {
        falhar(e instanceof Error ? e.message : 'Não foi possível abrir o vídeo.')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idCamera, modoChave, qualidade, aoVivo, tocar, parar, falhar],
  )

  // troca de câmera/trecho: começa do zero. O stream (que consome tráfego) só abre no clique, salvo autoIniciar.
  useEffect(() => {
    parar()
    if (autoIniciar && online) void iniciar()
    return () => parar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCamera, modoChave])

  useEffect(() => {
    if (video.current) video.current.muted = mudo
  }, [mudo])

  const trocarQualidade = (q: 'hd' | 'sd') => {
    setQualidade(q)
    if (estado === 'tocando') void iniciar(q)
  }

  const telaCheia = () => {
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (caixa.current?.requestFullscreen) caixa.current.requestFullscreen().catch(() => {})
    else v?.webkitEnterFullscreen?.() // iPhone
  }

  return (
    <div ref={caixa} className="cam-player">
      <video ref={video} playsInline muted className={estado === 'tocando' ? '' : 'invisible'} aria-label="Vídeo da câmera" />

      {estado !== 'tocando' && (
        <div className="cam-player__estado">
          {estado === 'carregando' ? (
            <div className="d-flex flex-column align-items-center gap-2">
              <span className="spinner-border text-light" aria-hidden="true" />
              <span role="status">Conectando à câmera…</span>
            </div>
          ) : !online && aoVivo ? (
            <div className="d-flex flex-column align-items-center gap-1">
              <Icon name="video-off" className="cam-ico-lg" />
              <strong>Câmera offline</strong>
              <small className="opacity-75">Sem comunicação com a câmera agora. As gravações anteriores podem continuar disponíveis.</small>
            </div>
          ) : estado === 'erro' ? (
            <div className="d-flex flex-column align-items-center gap-2">
              <Icon name="video-off" className="cam-ico-lg text-danger" />
              <span role="alert">{erro}</span>
              <button type="button" className="btn btn-light btn-sm cam-touch" onClick={() => void iniciar()}>
                <Icon name="refresh" /> Tentar de novo
              </button>
            </div>
          ) : (
            <button type="button" className="cam-player__play" onClick={() => void iniciar()}>
              <span className="cam-player__play-ico">
                <Icon name="player-play-filled" />
              </span>
              <span>
                {estado === 'pausa_auto' ? 'Pausado para economizar dados · continuar assistindo' : aoVivo ? 'Ver ao vivo' : 'Ver gravação'}
              </span>
            </button>
          )}
        </div>
      )}

      <div className="cam-player__topo">
        {estado === 'tocando' ? (
          <span className={`badge ${aoVivo ? 'bg-danger' : 'bg-dark'}`}>{aoVivo ? 'AO VIVO' : 'GRAVAÇÃO'}</span>
        ) : (
          <span />
        )}
        {overlay}
      </div>

      {estado === 'tocando' && (
        <div className="cam-player__controles">
          <button type="button" className="cam-player__btn" onClick={() => parar()} aria-label="Parar">
            <Icon name="player-stop-filled" />
          </button>
          <button type="button" className="cam-player__btn" onClick={() => setMudo((m) => !m)} aria-label={mudo ? 'Ativar som' : 'Silenciar'}>
            <Icon name={mudo ? 'volume-off' : 'volume'} />
          </button>
          <div className="btn-group ms-auto" role="group" aria-label="Qualidade">
            {(['hd', 'sd'] as const).map((q) => (
              <button
                key={q}
                type="button"
                className={`btn btn-sm cam-touch text-uppercase ${qualidade === q ? 'btn-light' : 'btn-outline-light'}`}
                aria-pressed={qualidade === q}
                onClick={() => trocarQualidade(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <button type="button" className="cam-player__btn" onClick={telaCheia} aria-label="Tela cheia">
            <Icon name="maximize" />
          </button>
        </div>
      )}
    </div>
  )
}
