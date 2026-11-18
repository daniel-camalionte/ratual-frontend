import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  }
  return { ApiError, get: vi.fn() }
})

vi.mock('@/lib/api', () => ({
  ApiError: h.ApiError,
  api: { get: h.get, post: vi.fn() },
  onUnauthorized: () => () => undefined,
}))

import { AuthProvider } from '@/lib/auth'
import AlertasPage from '@/pages/AlertasPage'
import { agrupar, type Evento } from '@/features/alertas/eventos'

const ev = (id: number, extra: Partial<Evento> = {}): Evento => ({
  id_evento: id,
  tipo: 'offline',
  origem: 'sistema',
  ativo: false,
  inicio: '2026-11-18 10:00:00',
  descricao: 'Ficou offline',
  dispositivo: { deviceid: `d${id}`, nome: `CAMARA ${id}` },
  empresa: { id_empresa: 2, nome: 'Padaria Boa' },
  ...extra,
})

const usuario = (tipo: 'master' | 'cliente') => ({
  id_usuario: 1,
  nome: 'Maria',
  login: 'm@e.com',
  telefone: null,
  perfil: 'admin',
  empresa: { id_empresa: 2, nome: 'Padaria Boa', tipo },
})

function setup(opts: { tipo?: 'master' | 'cliente'; alertas?: Evento[]; eventos?: Evento[]; falha?: boolean }) {
  h.get.mockImplementation((path: string) => {
    if (path === '/v1/auth/me') return Promise.resolve({ usuario: usuario(opts.tipo ?? 'cliente') })
    if (opts.falha) return Promise.reject(new h.ApiError('Falha ao carregar.', 500))
    if (path.startsWith('/v1/alertas')) return Promise.resolve({ eventos: opts.alertas ?? [] })
    if (path.startsWith('/v1/eventos')) return Promise.resolve({ eventos: opts.eventos ?? [] })
    return Promise.reject(new Error('rota inesperada ' + path))
  })
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AlertasPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  h.get.mockReset()
})

describe('AlertasPage', () => {
  it('lista alertas ativos e historico encerrado', async () => {
    setup({
      alertas: [ev(1, { ativo: true, tipo: 'fora_faixa', descricao: 'Temperatura fora da faixa' })],
      eventos: [ev(1, { ativo: true }), ev(2, { descricao: 'Voltou online' })],
    })
    expect(await screen.findByText('Ativos (1)')).toBeInTheDocument()
    expect(screen.getByText('Camara 1')).toBeInTheDocument()
    expect(screen.getByText('agora')).toBeInTheDocument()
    expect(await screen.findByText('Voltou online')).toBeInTheDocument()
    // evento ativo nao se repete no historico
    expect(screen.getAllByText('Camara 1')).toHaveLength(1)
  })

  it('estado vazio', async () => {
    setup({})
    expect(await screen.findByText('Tudo certo. Nenhum alerta ativo agora.')).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma ocorrência neste período.')).toBeInTheDocument()
  })

  it('mostra erro e tenta de novo', async () => {
    const user = userEvent.setup()
    setup({ falha: true })
    expect(await screen.findByText('Falha ao carregar.')).toBeInTheDocument()
    h.get.mockClear()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(h.get).toHaveBeenCalled()
  })

  it('atalho Ontem refaz a consulta com o novo periodo', async () => {
    const user = userEvent.setup()
    setup({})
    await screen.findByText('Nenhuma ocorrência neste período.')
    h.get.mockClear()
    await user.click(screen.getByRole('button', { name: 'Ontem' }))
    expect(screen.getByRole('button', { name: 'Ontem' })).toHaveAttribute('aria-pressed', 'true')
    const chamadas = h.get.mock.calls.map((c) => c[0] as string)
    expect(chamadas.some((p) => p.startsWith('/v1/eventos?') && p.includes('inicio='))).toBe(true)
  })

  it('so a master ve o nome da empresa', async () => {
    const { unmount } = setup({ tipo: 'master', alertas: [ev(1, { ativo: true })] })
    const item = (await screen.findByText('Camara 1')).closest('li')!
    expect(within(item).getByText(/Padaria Boa/)).toBeInTheDocument()
    unmount()
    setup({ tipo: 'cliente', alertas: [ev(1, { ativo: true })] })
    const item2 = (await screen.findByText('Camara 1')).closest('li')!
    expect(within(item2).queryByText(/Padaria Boa/)).not.toBeInTheDocument()
  })
})

describe('agrupar', () => {
  it('agrupa 3 ou mais mudancas de rele externas proximas', () => {
    const rele = (id: number, min: number) =>
      ev(id, { tipo: 'rele_ligado', origem: 'externo', dispositivo: { deviceid: 'x', nome: 'X' }, inicio: `2026-11-18 10:${String(50 - min).padStart(2, '0')}:00` })
    const itens = agrupar([rele(1, 0), rele(2, 1), rele(3, 2), ev(9)])
    expect(itens).toHaveLength(2)
    expect(itens[0]?.tipo).toBe('grupo')
  })
})
