import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { api, ApiError } from '@/lib/api'

const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.restoreAllMocks())

describe('api client', () => {
  it('envia cookies da mesma origem e cabecalhos seguros', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ message: 'oi' }))
    await api.get('/v1/hello')
    const [url, init] = spy.mock.calls[0] ?? []
    expect(url).toBe('/api/v1/hello')
    expect(init?.credentials).toBe('same-origin')
    expect((init?.headers as Record<string, string>)['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('valida a resposta com zod', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ message: 123 }))
    await expect(api.get('/v1/hello', z.object({ message: z.string() }))).rejects.toBeInstanceOf(ApiError)
  })

  it('devolve erro generico em 5xx (sem vazar detalhe)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ detail: 'Traceback secreto' }, 500))
    await expect(api.get('/v1/x')).rejects.toMatchObject({ status: 500, message: 'Erro no servidor. Tente novamente.' })
  })

  it('recusa caminhos que nao comecam com /', async () => {
    await expect(api.get('https://evil.example/x')).rejects.toThrow()
  })
})
