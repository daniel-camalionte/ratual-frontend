import { ZodError, type ZodType } from 'zod'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api'
const TIMEOUT_MS = 15_000

export class ApiError extends Error {
  readonly status: number
  /** Codigo estavel do backend (ex.: "invalid_credentials"); vazio em falhas de rede. */
  readonly code: string
  constructor(status: number, message: string, code = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  body?: unknown
  signal?: AbortSignal
  /** Parametros de query; valores vazios (undefined/null/'') sao ignorados. */
  query?: Record<string, string | number | boolean | null | undefined>
}

// Avisos globais: o AuthProvider escuta para encerrar a sessao (401).
type Listener = () => void
const unauthorized = new Set<Listener>()
export const onUnauthorized = (fn: Listener) => {
  unauthorized.add(fn)
  return () => void unauthorized.delete(fn)
}

function withQuery(path: string, query?: RequestOptions['query']): string {
  if (!query) return path
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  const s = qs.toString()
  return s ? `${path}?${s}` : path
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string }
}

/**
 * Cliente HTTP unico da aplicacao.
 * - Mesma origem + cookie de sessao HttpOnly (nunca guardamos token em localStorage).
 * - Timeout, JSON apenas. Erros 4xx mostram a mensagem em portugues do backend (regra de negocio);
 *   erros 5xx e de rede viram mensagem generica (o detalhe fica no log do servidor, via request_id).
 * - Se um schema zod for passado, a resposta e validada antes de chegar na UI.
 */
async function request<T>(method: Method, path: string, schema?: ZodType<T>, opts: RequestOptions = {}): Promise<T> {
  if (!path.startsWith('/')) throw new Error('path da API deve comecar com "/"')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  opts.signal?.addEventListener('abort', () => controller.abort(), { once: true })

  try {
    const res = await fetch(`${BASE}${withQuery(path, opts.query)}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        // a hospedagem recusa POST/PUT sem corpo: sempre enviamos um JSON nas escritas
        ...(opts.body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : method === 'GET' || method === 'DELETE' ? undefined : '{}',
      signal: controller.signal,
    })

    if (!res.ok) {
      const env = (await res.json().catch(() => ({}))) as ErrorEnvelope
      const code = env.error?.code ?? ''
      if (res.status === 401 && code === 'unauthenticated') unauthorized.forEach((fn) => fn())
      const msg =
        res.status >= 500
          ? 'Erro no servidor. Tente novamente.'
          : (env.error?.message ?? (res.status === 429 ? 'Muitas tentativas. Aguarde um pouco.' : 'Requisição recusada.'))
      throw new ApiError(res.status, msg, code)
    }
    if (res.status === 204) return undefined as T

    const data: unknown = await res.json()
    return schema ? schema.parse(data) : (data as T)
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') throw new ApiError(0, 'Tempo de resposta esgotado.')
    if (err instanceof ZodError) throw new ApiError(502, 'Resposta inesperada do servidor.')
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.')
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  get: <T>(path: string, schema?: ZodType<T>, opts?: RequestOptions) => request<T>('GET', path, schema, opts),
  post: <T>(path: string, body?: unknown, schema?: ZodType<T>, opts?: RequestOptions) =>
    request<T>('POST', path, schema, { ...opts, body }),
  put: <T>(path: string, body?: unknown, schema?: ZodType<T>, opts?: RequestOptions) =>
    request<T>('PUT', path, schema, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, schema?: ZodType<T>, opts?: RequestOptions) =>
    request<T>('PATCH', path, schema, { ...opts, body }),
  delete: <T>(path: string, schema?: ZodType<T>, opts?: RequestOptions) => request<T>('DELETE', path, schema, opts),
}
