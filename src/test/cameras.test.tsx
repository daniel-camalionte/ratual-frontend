import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  }
  return { ApiError, get: vi.fn(), post: vi.fn(), put: vi.fn() }
})

vi.mock('@/lib/api', () => ({
  ApiError: h.ApiError,
  api: { get: h.get, post: h.post, put: h.put },
  onUnauthorized: () => () => undefined,
}))

import { AuthProvider } from '@/lib/auth'
import CamerasPage from '@/pages/CamerasPage'
import { janelaDoMomento, paraApi } from '@/features/cameras/types'

const usuario = (tipo: 'master' | 'cliente') => ({
  id_usuario: 1,
  nome: 'Maria',
  login: 'm@e.com',
  telefone: null,
  perfil: 'admin',
  empresa: { id_empresa: 2, nome: 'Padaria Boa', tipo },
})

const cam = (id: number, extra = {}) => ({
  id_camera: id,
  deviceserial: `SN${id}`,
  canal: 1,
  nome: `Camara ${id}`,
  modelo: 'C6N',
  online: true,
  criptografada: false,
  codigo_cadastrado: true,
  ativo: true,
  data_status: null,
  ultimo_alarme_em: '2026-11-18 10:00:00',
  refrigerador: { deviceid: 'dev1', nome: 'Camara fria' },
  empresa: { id_empresa: 2, nome: 'Padaria Boa' },
  ...extra,
})

const alarme = { id_alarme: 9, tipo: 1, data: '2026-11-18 10:00:00', tem_foto: true, foto_criptografada: false }

function setup(opts: { tipo?: 'master' | 'cliente'; cameras?: ReturnType<typeof cam>[]; falha?: boolean } = {}) {
  h.get.mockImplementation((path: string) => {
    if (path === '/v1/auth/me') return Promise.resolve({ usuario: usuario(opts.tipo ?? 'cliente') })
    if (opts.falha) return Promise.reject(new h.ApiError(500, 'Falha ao carregar.'))
    if (path.startsWith('/v1/cameras/') && path.includes('/alarmes')) return Promise.resolve({ total: 1, alarmes: [alarme] })
    if (path.startsWith('/v1/cameras/') && path.includes('/gravacao'))
      return Promise.resolve({ url: null, protocolo: 'hls', expira_em: '2026-11-18 10:05:00', camera: { id_camera: 1 } })
    if (path.startsWith('/v1/cameras')) {
      const cameras = opts.cameras ?? [cam(1), cam(2, { nome: 'Camara 2', online: false })]
      return Promise.resolve({ total: cameras.length, cameras })
    }
    if (path === '/v1/ezviz/conta')
      return Promise.resolve({ total: 1, cameras: [{ deviceserial: 'NOVA1', canal: 1, nome: 'Nova', online: true, criptografada: false, id_camera: null }] })
    if (path === '/v1/ezviz/status') return Promise.resolve({ token: { valido: true }, ultimas_execucoes: [] })
    return Promise.reject(new Error('rota inesperada ' + path))
  })
  return render(
    <MemoryRouter initialEntries={['/cameras']}>
      <AuthProvider>
        <CamerasPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  h.get.mockReset()
  h.post.mockReset()
  h.put.mockReset()
})

describe('helpers de data', () => {
  it('converte para o horario de Brasilia e monta a janela do momento', () => {
    expect(paraApi(new Date('2026-11-18T13:00:00Z'))).toBe('2026-11-18 10:00:00')
    const j = janelaDoMomento(new Date('2026-11-18T13:00:00Z'))
    expect(j).toMatchObject({ tipo: 'gravacao', inicio: '2026-11-18 09:59:30', fim: '2026-11-18 10:02:00', origem: 'nuvem' })
  })
})

describe('CamerasPage', () => {
  it('lista as cameras, mostra o player e as deteccoes com foto (cliente sem acoes de master)', async () => {
    setup()
    expect(await screen.findByRole('button', { name: /Camara 2/ })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Ver ao vivo' })).toBeInTheDocument()
    const foto = await screen.findByAltText('Foto da detecção')
    expect(foto).toHaveAttribute('src', '/api/v1/cameras/alarmes/9/foto')
    expect(screen.queryByRole('button', { name: /Cadastrar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(h.get.mock.calls.some(([p]) => p === '/v1/cameras')).toBe(true)
  })

  it('estado vazio', async () => {
    setup({ cameras: [] })
    expect(await screen.findByText('Nenhuma câmera disponível')).toBeInTheDocument()
  })

  it('estado de erro', async () => {
    setup({ falha: true })
    expect(await screen.findByText(/Falha ao carregar/)).toBeInTheDocument()
  })

  it('assistir gravacao pede o link da gravacao com o intervalo escolhido', async () => {
    const user = userEvent.setup()
    setup({ cameras: [cam(1)] })
    await user.click(await screen.findByRole('button', { name: 'Assistir' }))
    await waitFor(() => expect(h.get.mock.calls.some(([p]) => String(p).startsWith('/v1/cameras/1/gravacao'))).toBe(true))
    const chamada = h.get.mock.calls.find(([p]) => String(p).startsWith('/v1/cameras/1/gravacao'))!
    expect(chamada[2]?.query).toMatchObject({ origem: 'nuvem' })
    expect(await screen.findByText(/não devolveu o vídeo/)).toBeInTheDocument()
  })

  it('master ve cadastrar/editar, busca todas e cadastra uma camera', async () => {
    const user = userEvent.setup()
    h.post.mockResolvedValue({ msg: 'ok', id_camera: 3 })
    setup({ tipo: 'master', cameras: [cam(1)] })
    await user.click(await screen.findByRole('button', { name: /Editar/ }))
    expect(await screen.findByText('Editar câmera')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await user.click(screen.getByRole('button', { name: /Cadastrar/ }))
    await user.type(await screen.findByLabelText('Número de série'), 'ABC123')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(h.post).toHaveBeenCalled())
    expect(h.post.mock.calls[0]?.[0]).toBe('/v1/cameras')
    expect(h.post.mock.calls[0]?.[1]).toMatchObject({ deviceserial: 'ABC123', canal: 1 })
    expect(h.get.mock.calls.some(([p]) => p === '/v1/cameras?todas=1')).toBe(true)
  })

  it('master abre o painel da conta EZVIZ', async () => {
    const user = userEvent.setup()
    setup({ tipo: 'master', cameras: [cam(1)] })
    await user.click(await screen.findByRole('button', { name: /Conta EZVIZ/ }))
    expect(await screen.findByText('Câmeras da conta (1)')).toBeInTheDocument()
    expect(screen.getByText('Nova')).toBeInTheDocument()
  })
})
