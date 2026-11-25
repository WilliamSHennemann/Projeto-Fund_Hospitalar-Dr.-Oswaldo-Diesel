import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mocks = vi.hoisted(() => ({ tvwall: vi.fn(), tvwallPublico: vi.fn(), getUser: vi.fn(), clear: vi.fn() }))
vi.mock('../../lib/api', () => ({ api: { tvwall: mocks.tvwall, tvwallPublico: mocks.tvwallPublico } }))
vi.mock('../../lib/auth', () => ({ auth: { getUser: mocks.getUser, clear: mocks.clear } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))

import { Protegido } from '../../components/Protegido'
import { TvWallPage } from './TvWallPage'

function renderRoute(path = '/tvwall') {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/tvwall" element={<Protegido acao="dashboard"><TvWallPage /></Protegido>} /><Route path="/admin/login" element={<p>Login compartilhado</p>} /></Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockReturnValue({ id: 8, nome: 'Gestor', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1 })
})

afterEach(cleanup)

describe('TV Wall', () => {
  it('carrega indicadores quando o usuário autenticado tem acesso ao dashboard', async () => {
    mocks.tvwall.mockResolvedValue({
      nps_geral: 0,
      media_geral: null,
      setores: [],
      elogios_gerais: 0,
      cache_seconds: 30,
    })

    renderRoute()

    expect(await screen.findByText('—')).toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
    expect(mocks.tvwall).toHaveBeenCalledOnce()
  })

  it('redireciona ao login compartilhado quando a sessão expirou', async () => {
    mocks.tvwall.mockRejectedValue(Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      response: { status: 401 },
    }))

    renderRoute()

    expect(await screen.findByText('Login compartilhado')).toBeInTheDocument()
    expect(mocks.clear).toHaveBeenCalledOnce()
    expect(mocks.tvwall).toHaveBeenCalledOnce()
  })

  it('exige autenticação antes de solicitar os indicadores', async () => {
    mocks.getUser.mockReturnValue(null)

    renderRoute()

    expect(await screen.findByText('Login compartilhado')).toBeInTheDocument()
    await waitFor(() => expect(mocks.tvwall).not.toHaveBeenCalled())
  })

  it('usa a rota pública quando a URL contém uma chave', async () => {
    mocks.tvwallPublico.mockResolvedValue({ nps_geral: 71, media_geral: 4.2, setores: [], elogios_gerais: 3, cache_seconds: 30 })
    render(<MemoryRouter initialEntries={['/tvwall?chave=visita']}><Routes><Route path="/tvwall" element={<TvWallPage />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('71')).toBeInTheDocument()
    expect(mocks.tvwallPublico).toHaveBeenCalledWith('visita')
    expect(mocks.tvwall).not.toHaveBeenCalled()
  })
})
