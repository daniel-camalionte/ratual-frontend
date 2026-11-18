import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number
    code?: string
    constructor(message: string, status: number, code?: string) {
      super(message)
      this.status = status
      this.code = code
    }
  }
  return { ApiError, get: vi.fn(), post: vi.fn() }
})

vi.mock('@/lib/api', () => ({
  ApiError: h.ApiError,
  api: { get: h.get, post: h.post },
  onUnauthorized: () => () => undefined,
}))

import { AuthProvider, RequireAuth } from '@/lib/auth'
import LoginPage from '@/pages/LoginPage'
import ContaPage from '@/pages/ContaPage'
import { formatarTelefone, mascaraTelefone, telefoneValido } from '@/lib/telefone'

const usuario = (extra: Record<string, unknown> = {}) => ({
  id_usuario: 1,
  nome: 'Maria Souza',
  login: 'maria@empresa.com.br',
  telefone: '11999990000',
  perfil: 'admin',
  empresa: { id_empresa: 2, nome: 'Padaria Boa', tipo: 'cliente' },
  ...extra,
})

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/conta"
            element={
              <RequireAuth>
                <ContaPage />
              </RequireAuth>
            }
          />
          <Route path="/" element={<p>Painel</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  h.get.mockReset()
  h.post.mockReset()
})

describe('login sem senha', () => {
  const enviado = { email: 'm***@empresa.com.br', expira_em: 600, reenvio_em: 60 }
  const naoAutenticado = () => h.get.mockRejectedValue(new h.ApiError('Não autenticado.', 401))

  async function etapaEmail(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('E-mail'), 'maria@empresa.com.br')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  }

  it('e-mail, depois o codigo recebido, e vai ao painel', async () => {
    naoAutenticado()
    h.post.mockResolvedValueOnce(enviado).mockResolvedValueOnce({ usuario: usuario() })
    const user = userEvent.setup()
    renderApp('/login')
    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
    await etapaEmail(user)
    expect(h.post).toHaveBeenNthCalledWith(1, '/v1/auth/solicitar-codigo', { email: 'maria@empresa.com.br' }, expect.anything())
    expect(await screen.findByText('m***@empresa.com.br')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Código'), '123456')
    expect(await screen.findByText('Painel')).toBeInTheDocument()
    expect(h.post).toHaveBeenNthCalledWith(2, '/v1/auth/verificar-codigo', { email: 'maria@empresa.com.br', codigo: '123456' }, expect.anything())
  })

  it('codigo incorreto mostra o erro e continua na etapa do codigo', async () => {
    naoAutenticado()
    h.post.mockResolvedValueOnce(enviado).mockRejectedValueOnce(new h.ApiError('Código incorreto.', 400, 'invalid_code'))
    const user = userEvent.setup()
    renderApp('/login')
    await etapaEmail(user)
    await user.type(await screen.findByLabelText('Código'), '000000')
    expect(await screen.findByText('Código incorreto.')).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toHaveValue('')
  })

  it.each([
    ['too_many_attempts', 429, 'Muitas tentativas. Peça outro código.'],
    ['code_expired', 400, 'Código expirado.'],
  ])('%s volta para a etapa do e-mail', async (code, status, mensagem) => {
    naoAutenticado()
    h.post.mockResolvedValueOnce(enviado).mockRejectedValueOnce(new h.ApiError(mensagem, status, code))
    const user = userEvent.setup()
    renderApp('/login')
    await etapaEmail(user)
    await user.type(await screen.findByLabelText('Código'), '000000')
    expect(await screen.findByRole('button', { name: 'Enviar código' })).toBeInTheDocument()
    expect(screen.getByText(mensagem)).toBeInTheDocument()
  })

  it('reenvio fica bloqueado durante a contagem e Voltar retorna ao e-mail', async () => {
    naoAutenticado()
    h.post.mockResolvedValueOnce(enviado)
    const user = userEvent.setup()
    renderApp('/login')
    await etapaEmail(user)
    expect(await screen.findByRole('button', { name: /Reenviar código em \d+s/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByRole('button', { name: 'Enviar código' })).toBeInTheDocument()
  })

  it('mostra a mensagem do backend em 429 e valida o e-mail', async () => {
    naoAutenticado()
    h.post.mockRejectedValue(new h.ApiError('Muitas solicitações. Tente novamente em alguns minutos.', 429, 'rate_limited'))
    const user = userEvent.setup()
    renderApp('/login')
    await user.type(await screen.findByLabelText('E-mail'), 'invalido')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument()
    expect(h.post).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText('E-mail'))
    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(await screen.findByText(/Muitas solicitações/)).toBeInTheDocument()
  })

  it('nao tem link de cadastro', async () => {
    naoAutenticado()
    renderApp('/login')
    await screen.findByLabelText('E-mail')
    expect(screen.queryByText(/Cadastre-se/)).not.toBeInTheDocument()
  })
})

describe('conta', () => {
  it('mostra dados do usuario, telefone formatado e o atalho de gestao para admin', async () => {
    h.get.mockResolvedValue({ usuario: usuario() })
    renderApp('/conta')
    expect(await screen.findByText('Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('(11) 99999-0000')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getAllByText('Padaria Boa').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Gestão/ })).toBeInTheDocument()
  })

  it('visualizador nao ve Gestao nem Trocar senha; Sair encerra a sessao', async () => {
    h.get.mockResolvedValue({ usuario: usuario({ perfil: 'visualizador', telefone: null }) })
    h.post.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderApp('/conta')
    await screen.findByText('Maria Souza')
    expect(screen.queryByRole('link', { name: /Gestão/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Trocar senha/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Sair da conta/ }))
    await waitFor(() => expect(h.post).toHaveBeenCalledWith('/v1/auth/logout', {}))
  })
})

describe('telefone', () => {
  it('aplica mascara, ignora DDI e valida', () => {
    expect(mascaraTelefone('11999990000')).toBe('(11) 99999-0000')
    expect(mascaraTelefone('1133334444')).toBe('(11) 3333-4444')
    expect(formatarTelefone('5511999990000')).toBe('(11) 99999-0000')
    expect(formatarTelefone(null)).toBe('')
    expect(telefoneValido('')).toBe(true)
    expect(telefoneValido('(11) 99999-0000')).toBe(true)
    expect(telefoneValido('999')).toBe(false)
  })
})
