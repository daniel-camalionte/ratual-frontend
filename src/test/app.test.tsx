import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  class ApiError extends Error {
    readonly status: number
    readonly code: string
    constructor(status: number, message: string, code = '') {
      super(message)
      this.status = status
      this.code = code
    }
  }
  return {
    ApiError,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    // estado controlado por cada teste
    state: { user: null as unknown, falhaLista: false },
  }
})

vi.mock('@/lib/api', () => ({
  ApiError: h.ApiError,
  api: { get: h.get, post: h.post, put: h.put, patch: vi.fn(), delete: vi.fn() },
  onUnauthorized: () => () => undefined,
}))

// ApexCharts depende de APIs de SVG que o jsdom nao tem: troca por um stub nos testes.
vi.mock('react-apexcharts', () => ({ default: () => <div data-testid="chart" /> }))

import { App } from '@/App'
import { AuthProvider } from '@/lib/auth'
import { DataTable, type Column } from '@/components/data/DataTable'

const usuario = (perfil: 'admin' | 'operador' | 'visualizador', tipo: 'master' | 'cliente' = 'master') => ({
  usuario: { id_usuario: 1, nome: 'Maria Souza', login: 'maria@ratual.com', telefone: null, perfil, empresa: { id_empresa: 1, nome: 'Ratual', tipo } },
})

// 8 refrigeradores: 1 offline, 1 fora da faixa, 6 normais
const dispositivos = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1
  const base = { deviceid: `dev${n}`, nome: `CAMARA ${n}`, modelo: 'THR316D', tipo: 'congelado', faixa: { min: -25, max: -10, tolerancia_min: 15 }, online: true, temperatura: -18.2, rele: true, sinal: -55, data_leitura: '2026-11-18T10:00:00', empresa: { id_empresa: 2, nome: 'Padaria Boa' }, ativo: true }
  if (n === 1) return { ...base, nome: 'LEITERIA JLS', online: false, temperatura: null, rele: null }
  if (n === 2) return { ...base, nome: 'Ispira sorvetes', temperatura: -3.6 }
  return base
})

const graficos = {
  horas: 24,
  dias: 7,
  temperatura_media: [
    { data: '2026-11-18T08:00:00', congelados: -18.1, resfriados: 3.2 },
    { data: '2026-11-18T09:00:00', congelados: -17.5, resfriados: null },
  ],
  compressor_por_dia: [
    { dia: '2026-11-17', hoje: false, horas_media: 20, ligado_pct: 83, aparelhos: 8 },
    { dia: '2026-11-18', hoje: true, horas_media: 10, ligado_pct: 90, aparelhos: 8 },
  ],
}

const eventoAlerta = {
  id_evento: 7,
  tipo: 'fora_faixa',
  origem: 'sistema',
  ativo: true,
  inicio: '2026-11-18T09:42:00',
  fim: null,
  duracao_min: null,
  valor: -3.6,
  descricao: 'Temperatura acima da faixa (-25,0 a -10,0 °C) desde 09:42 · pico -3,6 °C',
  usuario: null,
  dispositivo: { deviceid: 'dev2', nome: 'Ispira sorvetes' },
  empresa: { id_empresa: 2, nome: 'Padaria Boa' },
}

const grafico = {
  deviceid: 'dev2',
  faixa: { min: -25, max: -10 },
  resumo: { temperatura_atual: -3.6, minima: -22.4, maxima: -3.6, media: -17.8, compressor_ligado_pct: 74, leituras: 288, leituras_offline: 0 },
  pontos: [
    { data: '2026-11-18T08:00:00', temperatura: -18, rele: true, online: true },
    { data: '2026-11-18T08:05:00', temperatura: -17, rele: true, online: true },
  ],
}

beforeEach(() => {
  h.get.mockReset()
  h.post.mockReset().mockResolvedValue({ msg: 'ok' })
  h.put.mockReset().mockResolvedValue({ msg: 'ok' })
  h.state.user = usuario('admin')
  h.state.falhaLista = false
  h.get.mockImplementation((path: string) => {
    if (path === '/v1/auth/me') return h.state.user ? Promise.resolve(h.state.user) : Promise.reject(new h.ApiError(401, 'Sessão expirada.', 'unauthenticated'))
    if (path === '/v1/dispositivos') return h.state.falhaLista ? Promise.reject(new h.ApiError(500, 'Erro no servidor. Tente novamente.')) : Promise.resolve({ total: dispositivos.length, intervalo_coleta_min: 5, dispositivos })
    if (path.startsWith('/v1/dashboard/graficos')) return Promise.resolve(graficos)
    if (path.startsWith('/v1/alertas')) return Promise.resolve({ total: 1, limite: 20, offset: 0, eventos: [eventoAlerta] })
    if (path.startsWith('/v1/eventos')) return Promise.resolve({ total: 1, limite: 100, offset: 0, eventos: [eventoAlerta] })
    if (path.startsWith('/v1/ewelink/dispositivo/')) return Promise.resolve(grafico)
    return Promise.reject(new h.ApiError(404, 'Não encontrado.'))
  })
})

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )

describe('rotas', () => {
  it('mostra 404 para rota desconhecida', async () => {
    renderAt('/nao-existe')
    expect(await screen.findByText('Página não encontrada.')).toBeInTheDocument()
  })

  it.each(['/formularios/basico', '/formularios/validacao', '/tabelas', '/graficos', '/ui/botoes', '/ui/cards', '/ui/modais'])('abre %s sem erro', async (path) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 4 })).toBeInTheDocument()
  })

  it('sem sessão manda para o login', async () => {
    h.state.user = null
    renderAt('/')
    expect(await screen.findByRole('button', { name: 'Enviar código' })).toBeInTheDocument()
  })
})

describe('painel', () => {
  it('mostra KPIs reais, alertas, gráficos e os 6 primeiros refrigeradores', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: /(Bom dia|Boa tarde|Boa noite), Maria Souza/, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(6)
    expect((await screen.findAllByTestId('chart')).length).toBeGreaterThanOrEqual(3)
    await waitFor(() => expect(screen.getByLabelText('Refrigeradores: 8')).toBeInTheDocument())
    expect(screen.getByLabelText('Normais: 6')).toBeInTheDocument()
    expect(screen.getByLabelText('Em alerta: 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Offline: 1')).toBeInTheDocument()
    expect(await screen.findByText(/Temperatura acima da faixa/)).toBeInTheDocument()
  })

  it('Ver todos expande a lista e cada card leva ao detalhe', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await screen.findAllByRole('article')
    await user.click(await screen.findByRole('button', { name: /Ver todos \(8\)/ }))
    expect(screen.getAllByRole('article')).toHaveLength(8)
    expect(screen.getByRole('link', { name: 'Ispira sorvetes' })).toHaveAttribute('href', '/refrigeradores/dev2')
  })

  it('offline mostra sem leitura e fora da faixa mostra alerta', async () => {
    renderAt('/')
    expect(await screen.findByRole('article', { name: 'Leiteria Jls: Offline' })).toHaveTextContent('Sem leitura')
    expect(screen.getByRole('article', { name: 'Ispira sorvetes: Alerta' })).toHaveTextContent('-3,6')
  })

  it('mostra erro com opção de tentar de novo quando a lista falha', async () => {
    h.state.falhaLista = true
    renderAt('/')
    expect(await screen.findByText(/Erro no servidor/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })
})

describe('refrigeradores (lista)', () => {
  it('filtra por situação e por nome, e mostra estado vazio', async () => {
    const user = userEvent.setup()
    renderAt('/refrigeradores')
    expect(await screen.findAllByRole('article')).toHaveLength(8)
    await user.click(screen.getByRole('button', { name: /Em alerta/ }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: /Todos/ }))
    await user.type(screen.getByLabelText('Buscar refrigerador'), 'camara 5')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await user.clear(screen.getByLabelText('Buscar refrigerador'))
    await user.type(screen.getByLabelText('Buscar refrigerador'), 'zzz')
    expect(screen.getByText('Nenhum refrigerador encontrado com esse filtro.')).toBeInTheDocument()
  })

  it('mostra a mensagem do servidor quando falha', async () => {
    h.state.falhaLista = true
    renderAt('/refrigeradores')
    expect(await screen.findByText(/Erro no servidor/)).toBeInTheDocument()
  })
})

describe('refrigerador (detalhe)', () => {
  it('mostra dados, estatísticas do período, linha do tempo e troca o período', async () => {
    const user = userEvent.setup()
    renderAt('/refrigeradores/dev2')
    expect(await screen.findByRole('heading', { name: 'Ispira sorvetes', level: 4 })).toBeInTheDocument()
    expect(screen.getByText('Alerta')).toBeInTheDocument()
    expect(await screen.findByText('Mínima no período')).toBeInTheDocument()
    expect(await screen.findByText(/desde 09:42/)).toBeInTheDocument()
    expect(await screen.findByTestId('chart')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '3 dias' }))
    await waitFor(() => expect(h.get).toHaveBeenCalledWith(expect.stringContaining('/v1/ewelink/dispositivo/dev2/grafico?horas=72'), undefined, expect.anything()))
  })

  it('refrigerador inexistente mostra aviso e link de volta', async () => {
    renderAt('/refrigeradores/nao-existe')
    expect(await screen.findByText('Refrigerador não encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a lista' })).toBeInTheDocument()
  })

  it('master edita a faixa ideal (PUT) e valida mínima < máxima', async () => {
    const user = userEvent.setup()
    renderAt('/refrigeradores/dev2')
    await user.click(await screen.findByRole('button', { name: 'Editar faixa' }))
    const dialog = await screen.findByRole('dialog')
    const min = within(dialog).getByLabelText('Mínima (°C)')
    const max = within(dialog).getByLabelText('Máxima (°C)')
    await user.clear(min)
    await user.type(min, '5')
    await user.clear(max)
    await user.type(max, '2')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(await within(dialog).findByText('A mínima deve ser menor que a máxima.')).toBeInTheDocument()
    expect(h.put).not.toHaveBeenCalled()

    await user.clear(min)
    await user.type(min, '-26,5')
    await user.clear(max)
    await user.type(max, '-12')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(h.put).toHaveBeenCalledWith('/v1/dispositivos/dev2', { tipo: 'congelado', temp_min: -26.5, temp_max: -12, tolerancia_min: 15 }))
  })

  it('admin desliga o compressor só depois de confirmar a ciência', async () => {
    const user = userEvent.setup()
    renderAt('/refrigeradores/dev2')
    await user.click(await screen.findByRole('button', { name: /Compressor ligado/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Desligar o compressor?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Desligar' }))
    expect(await within(dialog).findByText('Marque a confirmação para desligar o compressor.')).toBeInTheDocument()
    expect(h.post).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('checkbox'))
    await user.click(within(dialog).getByRole('button', { name: 'Desligar' }))
    await waitFor(() => expect(h.post).toHaveBeenCalledWith('/v1/ewelink/dispositivo/dev2/rele', { ligado: false }))
    expect(await within(dialog).findByText(/Comando enviado/)).toBeInTheDocument()
  })

  it('exibe a mensagem do backend quando o comando do relé falha', async () => {
    h.post.mockRejectedValue(new h.ApiError(400, 'Aparelho sem comunicação.'))
    const user = userEvent.setup()
    renderAt('/refrigeradores/dev3')
    await user.click(await screen.findByRole('button', { name: /Compressor ligado/ }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('checkbox'))
    await user.click(within(dialog).getByRole('button', { name: 'Desligar' }))
    expect(await within(dialog).findByText('Aparelho sem comunicação.')).toBeInTheDocument()
  })

  it('cliente visualizador não vê editor de faixa nem botão do relé', async () => {
    h.state.user = usuario('visualizador', 'cliente')
    renderAt('/refrigeradores/dev2')
    expect(await screen.findByRole('heading', { name: 'Ispira sorvetes', level: 4 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar faixa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Compressor ligado/ })).not.toBeInTheDocument()
    expect(screen.getAllByText('Compressor ligado')).toHaveLength(2) // selo + estatística (sem botão)
  })

  it('admin de cliente comanda o relé mas não edita a faixa', async () => {
    h.state.user = usuario('admin', 'cliente')
    renderAt('/refrigeradores/dev2')
    expect(await screen.findByRole('button', { name: /Compressor ligado/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar faixa' })).not.toBeInTheDocument()
  })
})

describe('login', () => {
  it('valida o e-mail antes de enviar e nao pede senha', async () => {
    h.state.user = null
    const user = userEvent.setup()
    renderAt('/login')
    await user.click(await screen.findByRole('button', { name: 'Enviar código' }))
    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
  })
})

describe('cadastro com validacao', () => {
  it('exige aceite dos termos e exibe erros acessiveis', async () => {
    const user = userEvent.setup()
    renderAt('/formularios/validacao')
    await user.click(await screen.findByRole('button', { name: 'Salvar' }))
    const nome = await screen.findByLabelText('Nome')
    await waitFor(() => expect(nome).toHaveAttribute('aria-invalid', 'true'))
    expect(screen.getByText('É preciso aceitar os termos.')).toBeInTheDocument()
  })
})

describe('DataTable', () => {
  interface Row {
    id: number
    nome: string
  }
  const cols: Column<Row>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'nome', header: 'Nome', sortable: true },
  ]
  const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, nome: `Item ${i + 1}` }))

  it('busca, ordena e pagina', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={cols} rows={rows} rowKey={(r) => r.id} pageSize={10} />)
    expect(screen.getAllByRole('row')).toHaveLength(11) // cabecalho + 10
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(screen.getByText('Item 11')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Buscar na tabela'), 'Item 2')
    expect(screen.queryByText('Item 11')).not.toBeInTheDocument()
    expect(screen.getByText('Item 25')).toBeInTheDocument()
  })

  it('mostra mensagem quando nao ha resultados', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={cols} rows={rows} rowKey={(r) => r.id} />)
    await user.type(screen.getByLabelText('Buscar na tabela'), 'zzz')
    expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument()
  })
})
