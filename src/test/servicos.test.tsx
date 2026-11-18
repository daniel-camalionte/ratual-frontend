import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/lib/auth'
import ServicosPage from '@/pages/ServicosPage'

const mocks = vi.hoisted(() => {
  class ApiError extends Error {
    status: number
    code: string
    constructor(status: number, message: string, code = '') {
      super(message)
      this.name = 'ApiError'
      this.status = status
      this.code = code
    }
  }
  return { ApiError, get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }
})

vi.mock('@/lib/api', () => ({
  ApiError: mocks.ApiError,
  api: { get: mocks.get, post: mocks.post, put: mocks.put, patch: vi.fn(), delete: mocks.del },
  onUnauthorized: () => () => undefined,
}))

const ordem = (o: Record<string, unknown> = {}) => ({
  id_os: 7,
  status: 'solicitado',
  origem: 'cliente',
  data: '2099-01-05',
  hora_inicio: '08:00',
  hora_fim: '10:00',
  empresa: { id_empresa: 2, nome: 'Mercado Bom Preço' },
  dispositivo: null,
  tipo_servico: { id_tipo_servico: 1, nome: 'Manutenção corretiva' },
  tecnico: null,
  descricao: 'Câmara não gela',
  valores: { servico: 100, desconto_percentual: 10, desconto: 10, pecas: 0, total: 90 },
  descricao_pecas: null,
  observacao_tecnica: null,
  motivo_cancelamento: null,
  solicitante: 'Maria',
  criado_em: null,
  concluido_em: null,
  ...o,
})

const catalogo = {
  plano: { id_plano: 1, nome: 'Ouro', desconto_servico: 10 },
  tipos: [
    { id_tipo_servico: 1, nome: 'Manutenção corretiva', descricao: 'Reparo', valor: 100, valor_com_desconto: 90, cliente_pode_solicitar: true, ativo: true },
    { id_tipo_servico: 2, nome: 'Limpeza', descricao: null, valor: 50, valor_com_desconto: 45, cliente_pode_solicitar: true, ativo: true },
  ],
}
const disponibilidade = { dias: [{ data: '2099-01-05', janelas: [{ hora_inicio: '08:00', hora_fim: '10:00', vagas_livres: 1 }] }] }

let rotas: Record<string, unknown>
const usuario = (empresaTipo: string, perfil = 'admin') => ({ usuario: { id_usuario: 1, nome: 'Ana', login: 'a@x.com', telefone: null, perfil, empresa: { id_empresa: 2, nome: 'Empresa', tipo: empresaTipo } } })

beforeEach(() => {
  vi.clearAllMocks()
  rotas = {}
  mocks.get.mockImplementation(async (path: string) => {
    const chave = path.split('?')[0] as string
    if (!(chave in rotas)) throw new Error(`sem rota ${path}`)
    const v = rotas[chave]
    if (v instanceof Error) throw v
    return v
  })
  mocks.post.mockResolvedValue({ msg: 'ok' })
  mocks.put.mockResolvedValue({ msg: 'ok', avisos: [] })
  mocks.del.mockResolvedValue(undefined)
})

const renderPage = (empresaTipo: string, perfil = 'admin') => {
  rotas['/v1/auth/me'] = usuario(empresaTipo, perfil)
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ServicosPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('serviços do cliente', () => {
  beforeEach(() => {
    rotas['/v1/servicos/catalogo'] = catalogo
    rotas['/v1/ordens'] = { total: 2, ordens: [ordem(), ordem({ id_os: 8, status: 'concluido', data: '2020-01-01', tipo_servico: { id_tipo_servico: 2, nome: 'Limpeza' } })] }
    rotas['/v1/agenda/disponibilidade'] = disponibilidade
    rotas['/v1/dispositivos'] = { total: 0, dispositivos: [] }
  })

  it('mostra plano, próximas visitas e histórico, sem as áreas da equipe', async () => {
    renderPage('cliente')
    expect(await screen.findByText('Plano Ouro')).toBeInTheDocument()
    expect(screen.getByText(/10% de desconto na mão de obra/)).toBeInTheDocument()
    expect(screen.getByText('Próximas visitas')).toBeInTheDocument()
    expect(screen.getByText('Histórico')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Serviços', level: 4 })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Cadastros/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Central de serviços')).not.toBeInTheDocument()
  })

  it('solicita visita escolhendo serviço, dia e horário', async () => {
    const user = userEvent.setup()
    renderPage('cliente')
    await user.click(await screen.findByRole('button', { name: /Solicitar visita/ }))
    await user.click(await screen.findByRole('radio', { name: /Manutenção corretiva/ }))
    await user.click(await screen.findByRole('button', { name: 'seg, 05/01' }))
    await user.click(screen.getByRole('button', { name: '08:00 – 10:00' }))
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/v1/ordens', expect.objectContaining({ id_tipo_servico: 1, data: '2099-01-05', hora_inicio: '08:00' })))
    expect(await screen.findByText(/Pedido enviado/)).toBeInTheDocument()
  })

  it('exige serviço, dia e horário antes de enviar', async () => {
    const user = userEvent.setup()
    renderPage('cliente')
    await user.click(await screen.findByRole('button', { name: /Solicitar visita/ }))
    await user.click(await screen.findByRole('button', { name: 'Enviar pedido' }))
    expect(await screen.findByText('Escolha o serviço')).toBeInTheDocument()
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('erro 409 de horário ocupado mostra a mensagem e recarrega os horários', async () => {
    mocks.post.mockRejectedValueOnce(new mocks.ApiError(409, 'Esse horário acabou de ser ocupado. Escolha outro.', 'conflict'))
    const user = userEvent.setup()
    renderPage('cliente')
    await user.click(await screen.findByRole('button', { name: /Solicitar visita/ }))
    await user.click(await screen.findByRole('radio', { name: /Limpeza/ }))
    await user.click(await screen.findByRole('button', { name: 'seg, 05/01' }))
    await user.click(screen.getByRole('button', { name: '08:00 – 10:00' }))
    const antes = mocks.get.mock.calls.filter((c) => String(c[0]).startsWith('/v1/agenda/disponibilidade')).length
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }))
    expect(await screen.findByText('Esse horário acabou de ser ocupado. Escolha outro.')).toBeInTheDocument()
    await waitFor(() => expect(mocks.get.mock.calls.filter((c) => String(c[0]).startsWith('/v1/agenda/disponibilidade')).length).toBeGreaterThan(antes))
    // o pedido não foi concluído: o modal segue aberto e o horário foi desmarcado
    expect(screen.getByRole('button', { name: '08:00 – 10:00' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText(/Pedido enviado/)).not.toBeInTheDocument()
  })

  it('cancela a própria visita', async () => {
    const user = userEvent.setup()
    renderPage('cliente')
    await user.click(await screen.findByRole('button', { name: /Manutenção corretiva/ }))
    const modal = await screen.findByRole('dialog')
    expect(within(modal).getByText('Total')).toBeInTheDocument()
    await user.click(within(modal).getByRole('button', { name: 'Cancelar visita' }))
    await user.click(within(modal).getByRole('button', { name: 'Cancelar visita' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/v1/ordens/7/cancelar', { motivo: null }))
  })

  it('visualizador acompanha mas não pede nem cancela', async () => {
    const user = userEvent.setup()
    renderPage('cliente', 'visualizador')
    await screen.findByText('Plano Ouro')
    expect(screen.queryByRole('button', { name: /Solicitar visita/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Manutenção corretiva/ }))
    const modal = await screen.findByRole('dialog')
    expect(within(modal).queryByRole('button', { name: 'Cancelar visita' })).not.toBeInTheDocument()
  })

  it('mostra a mensagem de erro da lista', async () => {
    rotas['/v1/ordens'] = new mocks.ApiError(500, 'Erro no servidor. Tente novamente.')
    renderPage('cliente')
    expect(await screen.findByText(/Erro no servidor/)).toBeInTheDocument()
  })
})

describe('central de serviços (master)', () => {
  beforeEach(() => {
    rotas['/v1/ordens'] = { total: 1, ordens: [ordem()] }
    rotas['/v1/agenda/grade'] = { total: 1, janelas: [{ id_janela: 1, dia_semana: 1, dia: 'Segunda', hora_inicio: '08:00', hora_fim: '10:00', vagas: 2, ativo: true }] }
    rotas['/v1/agenda/bloqueios'] = { total: 0, bloqueios: [] }
    rotas['/v1/tecnicos'] = { total: 1, tecnicos: [{ id_tecnico: 3, nome: 'Carlos', telefone: null, ativo: true }] }
  })

  it('mostra agenda, pedidos e cadastros, e não oferece solicitar visita', async () => {
    renderPage('master')
    expect(await screen.findByRole('heading', { name: 'Central de serviços', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Agenda/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Pedidos/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Cadastros/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Solicitar visita/ })).not.toBeInTheDocument()
  })

  it('confirma um pedido atribuindo técnico', async () => {
    const user = userEvent.setup()
    renderPage('master')
    await user.click(await screen.findByRole('tab', { name: /Pedidos/ }))
    await user.click(await screen.findByRole('button', { name: /Mercado Bom Preço/ }))
    const modal = await screen.findByRole('dialog')
    await user.selectOptions(within(modal).getByLabelText('Técnico'), '3')
    await user.click(within(modal).getByRole('button', { name: 'Confirmar visita' }))
    await waitFor(() =>
      expect(mocks.put).toHaveBeenCalledWith('/v1/ordens/7', expect.objectContaining({ status: 'confirmado', id_tecnico: 3, data: '2099-01-05', hora_inicio: '08:00', hora_fim: '10:00', valor_servico: 100 })),
    )
  })

  it('erro 409 ao remarcar mostra a mensagem do backend e mantém o modal', async () => {
    mocks.put.mockRejectedValueOnce(new mocks.ApiError(409, 'Janela sem vagas nesse horário.', 'conflict'))
    const user = userEvent.setup()
    renderPage('master')
    await user.click(await screen.findByRole('tab', { name: /Pedidos/ }))
    await user.click(await screen.findByRole('button', { name: /Mercado Bom Preço/ }))
    const modal = await screen.findByRole('dialog')
    await user.click(within(modal).getByRole('button', { name: 'Salvar' }))
    expect(await within(modal).findByText('Janela sem vagas nesse horário.')).toBeInTheDocument()
  })

  it('cadastra um técnico na aba Cadastros', async () => {
    const user = userEvent.setup()
    renderPage('master')
    await user.click(await screen.findByRole('tab', { name: /Cadastros/ }))
    await user.click(await screen.findByRole('tab', { name: 'Técnicos' }))
    expect(await screen.findByText('Carlos')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Novo técnico/ }))
    const modal = await screen.findByRole('dialog')
    await user.click(within(modal).getByRole('button', { name: 'Criar' }))
    expect(await within(modal).findByText('Informe o nome')).toBeInTheDocument()
    await user.type(within(modal).getByLabelText('Nome'), 'Paulo')
    await user.click(within(modal).getByRole('button', { name: 'Criar' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/v1/tecnicos', { nome: 'Paulo', telefone: null, ativo: true }))
  })

  it('lista a grade de horários e bloqueia uma data', async () => {
    const user = userEvent.setup()
    renderPage('master')
    await user.click(await screen.findByRole('tab', { name: /Cadastros/ }))
    await user.click(await screen.findByRole('tab', { name: 'Grade de horários' }))
    expect(await screen.findByText('08:00–10:00')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Bloqueios' }))
    expect(await screen.findByText('Nenhuma data bloqueada.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Data'), '2099-12-25')
    await user.type(screen.getByLabelText('Motivo (opcional)'), 'Natal')
    await user.click(screen.getByRole('button', { name: 'Bloquear data' }))
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/v1/agenda/bloqueios', { data: '2099-12-25', motivo: 'Natal' }))
  })
})
