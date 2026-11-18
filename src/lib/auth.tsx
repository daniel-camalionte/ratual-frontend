import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { ApiError, api, onUnauthorized } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

const usuarioSchema = z.object({
  id_usuario: z.number(),
  nome: z.string(),
  login: z.string(),
  telefone: z.string().nullable().optional(),
  perfil: z.enum(['admin', 'operador', 'visualizador']),
  empresa: z.object({ id_empresa: z.number(), nome: z.string(), tipo: z.enum(['master', 'cliente']) }),
})
export type Usuario = z.infer<typeof usuarioSchema>
const respostaSchema = z.object({ usuario: usuarioSchema })
const codigoEnviadoSchema = z.object({
  email: z.string(),
  expira_em: z.number(),
  reenvio_em: z.number(),
})
/** Etapa 1 concluida: se o e-mail estiver cadastrado, o codigo de 6 digitos foi enviado (e-mail mascarado). */
export type CodigoEnviado = z.infer<typeof codigoEnviadoSchema>

interface AuthState {
  user: Usuario | null
  /** true enquanto confirmamos a sessao do cookie na abertura do app. */
  loading: boolean
  isMaster: boolean
  isAdmin: boolean
  /** Etapa 1: pede o codigo de 6 digitos por e-mail (resposta igual para e-mail cadastrado ou nao). */
  solicitarCodigo: (email: string) => Promise<CodigoEnviado>
  /** Etapa 2: confere o codigo recebido por e-mail e abre a sessao. */
  verificarCodigo: (email: string, codigo: string) => Promise<void>
  logout: () => Promise<void>
  /** Atualiza o usuario em memoria (ex.: depois de alterar o telefone). */
  setUser: (u: Usuario | null) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // A sessao vive em cookie HttpOnly no servidor; aqui so ha o perfil, em memoria (nada em localStorage).
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setUser((await api.get('/v1/auth/me', respostaSchema)).usuario)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- confirma a sessao do cookie na abertura
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  // 401 em qualquer chamada encerra a sessao
  useEffect(() => onUnauthorized(() => setUser(null)), [])

  const solicitarCodigo = useCallback((email: string) => api.post('/v1/auth/solicitar-codigo', { email }, codigoEnviadoSchema), [])

  const verificarCodigo = useCallback(async (email: string, codigo: string) => {
    setUser((await api.post('/v1/auth/verificar-codigo', { email, codigo }, respostaSchema)).usuario)
  }, [])

  const logout = useCallback(async () => {
    await api.post('/v1/auth/logout', {}).catch((e: unknown) => {
      if (!(e instanceof ApiError)) throw e
    })
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isMaster: user?.empresa.tipo === 'master',
      isAdmin: user?.perfil === 'admin',
      solicitarCodigo,
      verificarCodigo,
      logout,
      setUser,
    }),
    [user, loading, solicitarCodigo, verificarCodigo, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}

/** Exige sessao. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

/** Rota so para master / admin (a autorizacao real e do backend; isto so evita telas inuteis). */
export function RequireRole({ role, children }: { role: 'master' | 'admin'; children: ReactNode }) {
  const { isMaster, isAdmin } = useAuth()
  const ok = role === 'master' ? isMaster : isAdmin
  return ok ? children : <Navigate to="/" replace />
}
