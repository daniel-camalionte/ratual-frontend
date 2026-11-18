import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TextField } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAuth, type CodigoEnviado } from '@/lib/auth'
import { ApiError } from '@/lib/api'

const schema = z.object({
  email: z.string().trim().email('E-mail inválido.').max(254),
})
type FormData = z.infer<typeof schema>

/** Redireciona so para caminhos internos (evita open redirect via state/query). */
const safePath = (p: unknown): string => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? p : '/')

const msg = (e: unknown, padrao: string) => (e instanceof ApiError ? e.message : padrao)

/** Segundos restantes ate `reenvio_em`; zera sozinho. */
function useContagem(segundos: number | null, chave: number): number {
  const [restante, setRestante] = useState(segundos ?? 0)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia a contagem a cada novo codigo
    setRestante(segundos ?? 0)
    if (!segundos) return
    const id = setInterval(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [segundos, chave])
  return restante
}

export default function LoginPage() {
  const { user, solicitarCodigo, verificarCodigo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // Etapa 2: guardamos so o e-mail, em memoria (para reenviar/confirmar o codigo); nunca em storage.
  const [envio, setEnvio] = useState<{ dados: CodigoEnviado; stamp: number } | null>(null)
  const emailRef = useRef<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const restante = useContagem(envio ? envio.dados.reenvio_em : null, envio?.stamp ?? 0)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const destino = safePath((location.state as { from?: string } | null)?.from)
  if (user) return <Navigate to={destino} replace />

  const onSubmit = async (data: FormData) => {
    setErro(null)
    setAviso(null)
    try {
      const res = await solicitarCodigo(data.email)
      emailRef.current = data.email
      setCodigo('')
      setEnvio({ dados: res, stamp: Date.now() })
    } catch (e) {
      // 429 (muitas solicitacoes) e 503 (e-mail indisponivel) trazem a mensagem do backend.
      setErro(msg(e, 'Não foi possível enviar o código. Tente novamente.'))
    }
  }

  const confirmar = async (valor: string) => {
    if (!emailRef.current || valor.length !== 6 || verificando) return
    setErro(null)
    setVerificando(true)
    try {
      await verificarCodigo(emailRef.current, valor)
      emailRef.current = null
      navigate(destino, { replace: true })
    } catch (e) {
      setErro(msg(e, 'Não foi possível confirmar o código.'))
      setCodigo('')
      // codigo esgotado/expirado: volta para pedir outro
      if (e instanceof ApiError && (e.code === 'too_many_attempts' || e.code === 'code_expired')) voltar()
    } finally {
      setVerificando(false)
    }
  }

  const reenviar = async () => {
    if (!emailRef.current) return
    setErro(null)
    setReenviando(true)
    try {
      const res = await solicitarCodigo(emailRef.current)
      setEnvio({ dados: res, stamp: Date.now() })
      setCodigo('')
      setAviso('Enviamos um novo código.')
    } catch (e) {
      setErro(msg(e, 'Não foi possível reenviar o código.'))
    } finally {
      setReenviando(false)
    }
  }

  function voltar() {
    emailRef.current = null
    setEnvio(null)
    setCodigo('')
  }

  if (envio) {
    return (
      <>
        <h4 className="text-center mb-1">Acesse com seu e-mail</h4>
        <p className="text-center text-muted mb-4">
          Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos para <strong>{envio.dados.email}</strong>. Ele vale por {Math.round(envio.dados.expira_em / 60)} minutos.
        </p>
        {erro && <Alert tone="danger">{erro}</Alert>}
        {aviso && !erro && <Alert tone="success">{aviso}</Alert>}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void confirmar(codigo)
          }}
          noValidate
        >
          <div className="mb-3">
            <label htmlFor="codigo" className="form-label">
              Código
            </label>
            <input
              id="codigo"
              className="form-control form-control-lg text-center fw-semibold"
              style={{ letterSpacing: '0.5em' }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={codigo}
              autoFocus
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCodigo(v)
                if (v.length === 6) void confirmar(v)
              }}
              aria-describedby="codigo-ajuda"
            />
            <div id="codigo-ajuda" className="form-text">
              Confira também a caixa de spam.
            </div>
          </div>
          <Button type="submit" className="w-100" loading={verificando} disabled={codigo.length !== 6}>
            Confirmar
          </Button>
        </form>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button type="button" className="btn btn-link p-0" onClick={voltar}>
            Voltar
          </button>
          <button type="button" className="btn btn-link p-0" onClick={() => void reenviar()} disabled={restante > 0 || reenviando}>
            {restante > 0 ? `Reenviar código em ${restante}s` : 'Reenviar código'}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <h4 className="text-center mb-1">Acesse com seu e-mail</h4>
      <p className="text-center text-muted mb-4">Enviaremos um código de 6 dígitos, sem senha</p>
      {erro && <Alert tone="danger">{erro}</Alert>}
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
        <TextField label="E-mail" type="email" inputMode="email" autoCapitalize="none" autoComplete="username" autoFocus {...register('email')} error={errors.email?.message} />
        <Button type="submit" className="w-100 mt-2" loading={isSubmitting}>
          Enviar código
        </Button>
      </form>
    </>
  )
}
