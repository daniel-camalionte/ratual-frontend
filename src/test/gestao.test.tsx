import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get, post, put, MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    status: number
    code: string
    constructor(status: number, message: string, code = '') {
      super(message)
      this.status = status
      this.code = code
    }
  }
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), MockApiError }
})

vi.mock('@/lib/api', () => ({
  api: { get, post, put, patch: vi.fn(), delete: vi.fn() },
  ApiError: MockApiError,
  onUnauthorized: () => () => undefined,
}))

import { AuthProvider } from '@/lib/auth'
import GestaoPage from '@/pages/GestaoPage'
import { mascaraTelefone, formatarTelefone } from '@/features/gestao/types'

const cliente = { id_usuario: 2, nome: 'Ana Admin', login: 'ana@cliente.com', perfil: 'admin', telefone: null, empresa: { id_empresa: 7, nome: 'Cliente X', tipo: 'cliente' } }
const master = { ...cliente, id_usuario: 1, nome: 'Mestre', login: 'm@ratual.com', empresa: { id_empresa: 1, nome: 'Ratual', tipo: 'master' } }

const usuarios = [
  { ...cliente, ativo: true, ultimo_login: null, eu: true },
  { id_usuario: 3, nome: 'Bruno Operador', login: 'bruno@cliente.com', telefone: '11999990000', perfil: 'operador', ativo: true, ultimo_login: null, eu: false, empresa: cliente.empresa },
]
const empresas = [
  { id_empresa: 1, nome: 'Ratual', documento: null, tipo: 'master', ativo: true, usuarios: 2, dispositivos: 0, plano: null },
  { id_empresa: 7, nome: 'Cliente X', documento: '123', tipo: 'cliente', ativo: true, usuarios: 2, dispositivos: 1, plano: null },
]

function rotas(me: typeof cliente) {
  get.mockImplementation((path: string) => {
    if (path === '/v1/auth/me') return Promise.resolve({ usuario: me })
    if (path === '/v1/usuarios') return Promise.resolve({ total: 2, usuarios })
    if (path === '/v1/empresas') return Promise.resolve({ total: 2, empresas })
    if (path === '/v1/planos') return Promise.resolve({ total: 0, planos: [] })
    if (path === '/v1/dispositivos?todos=1')
      return Promise.resolve({ dispositivos: [{ deviceid: 'abc1', nome: 'Câmara 1', modelo: 'TH16', online: true, ativo: true, empresa: null }] })
    if (path.startsWith('/v1/auditoria'))
      return Promise.resolve({ registros: [{ id_auditoria: 1, acao: 'usuario_criado', entidade: 'usuario', id_entidade: '3', detalhe: { login: 'bruno@cliente.com' }, quando: '2026-01-02T10:00:00', usuario: { nome: 'Mestre', login: 'm@ratual.com' } }] })
    return Promise.reject(new MockApiError(404, 'não encontrado'))
  })
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <GestaoPage />
      </AuthProvider>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Gestão', () => {
  it('admin de cliente vê só a aba Usuários, com a lista', async () => {
    rotas(cliente)
    renderPage()
    expect(await screen.findAllByText('Bruno Operador')).not.toHaveLength(0)
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getByText('Usuários de Cliente X')).toBeInTheDocument()
    // não busca dados de master
    expect(get).not.toHaveBeenCalledWith('/v1/empresas', undefined, expect.anything())
  })

  it('master vê as abas Empresas, Refrigeradores e Auditoria', async () => {
    rotas(master)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('tab', { name: 'Empresas' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Usuários' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Auditoria' }))
    expect(await screen.findByText('criou o usuário')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Refrigeradores' }))
    expect(await screen.findByLabelText('Empresa de Câmara 1')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Empresa de Câmara 1'), '7')
    await waitFor(() => expect(put).toHaveBeenCalledWith('/v1/dispositivos/abc1', { id_empresa: 7 }))
  })

  it('cria usuário (telefone só dígitos) sem senha provisória', async () => {
    rotas(cliente)
    post.mockResolvedValue({ usuario: { id_usuario: 9 } })
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Bruno Operador')
    await user.click(screen.getByRole('button', { name: 'Novo usuário' }))
    await user.type(await screen.findByLabelText('Nome'), 'Novo Fulano')
    await user.type(screen.getByLabelText('E-mail (login)'), 'novo@cliente.com')
    await user.type(screen.getByLabelText('Telefone / WhatsApp (opcional)'), '11988887777')
    expect(screen.getByLabelText('Telefone / WhatsApp (opcional)')).toHaveValue('(11) 98888-7777')
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(post).toHaveBeenCalledWith('/v1/usuarios', { nome: 'Novo Fulano', login: 'novo@cliente.com', telefone: '11988887777', perfil: 'operador' })
  })

  it('valida o e-mail antes de enviar e mostra o erro 409 do backend', async () => {
    rotas(cliente)
    post.mockRejectedValue(new MockApiError(409, 'Já existe um usuário com este e-mail.', 'conflict'))
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Bruno Operador')
    await user.click(screen.getByRole('button', { name: 'Novo usuário' }))
    await user.type(await screen.findByLabelText('Nome'), 'Fulano')
    await user.type(screen.getByLabelText('E-mail (login)'), 'invalido')
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }))
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
    await user.clear(screen.getByLabelText('E-mail (login)'))
    await user.type(screen.getByLabelText('E-mail (login)'), 'bruno@cliente.com')
    await user.click(screen.getByRole('button', { name: 'Criar usuário' }))
    expect(await screen.findByText('Já existe um usuário com este e-mail.')).toBeInTheDocument()
  })

  it('mostra erro com opção de tentar novamente quando a lista falha', async () => {
    rotas(cliente)
    get.mockImplementation((path: string) =>
      path === '/v1/auth/me' ? Promise.resolve({ usuario: cliente }) : Promise.reject(new MockApiError(500, 'Erro no servidor. Tente novamente.')),
    )
    renderPage()
    expect(await screen.findByText('Erro no servidor. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tentar novamente/ })).toBeInTheDocument()
  })
})

describe('telefone', () => {
  it('aplica máscara e formata números do backend', () => {
    expect(mascaraTelefone('11999990000')).toBe('(11) 99999-0000')
    expect(mascaraTelefone('1133334444')).toBe('(11) 3333-4444')
    expect(formatarTelefone('5511999990000')).toBe('(11) 99999-0000')
    expect(formatarTelefone(null)).toBe('')
  })
})
