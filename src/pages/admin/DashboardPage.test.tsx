import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../types'

const mocks = vi.hoisted(() => ({
  user: null as Usuario | null,
  excel: vi.fn().mockResolvedValue(new Blob(['excel'])),
  pdf: vi.fn().mockResolvedValue(new Blob(['pdf'])),
  setores: vi.fn().mockResolvedValue([{ setor_id: 2, nome: 'Enfermagem', nps: 75, media: 4.5 }]),
  turnos: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../lib/api', () => ({
  api: {
    dashboard: { setores: mocks.setores, turnos: mocks.turnos },
    exportacoes: { excel: mocks.excel, pdf: mocks.pdf },
  },
}))
vi.mock('../../lib/auth', () => ({ auth: { getUser: () => mocks.user } }))
vi.mock('../../lib/download', () => ({ baixarArquivo: vi.fn() }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))
vi.mock('../../components/NavegacaoAdmin', () => ({ NavegacaoAdmin: () => null }))
import { DashboardPage } from './DashboardPage'

function usuario(perfil: Usuario['perfil']): Usuario {
  return { id: 1, nome: 'Teste', email: 'teste@fundacao.com', perfil, permissoes: [] }
}

function renderDashboard() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><DashboardPage /></MemoryRouter></QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  mocks.excel.mockResolvedValue(new Blob(['excel']))
  mocks.pdf.mockResolvedValue(new Blob(['pdf']))
})

describe('painel admin', () => {
  it('não mostra o resumo do período nem o acompanhamento', async () => {
    mocks.user = usuario('super_admin')
    renderDashboard()

    await screen.findByRole('button', { name: /Enfermagem/ })
    expect(screen.queryByRole('heading', { name: 'Resumo do período' })).not.toBeInTheDocument()
    expect(screen.queryByText('Acompanhamento')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Em andamento' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra os dois botões a quem tem permissão e oculta para visualizador', async () => {
    mocks.user = usuario('gestao')
    const { unmount } = renderDashboard()
    expect(await screen.findByRole('button', { name: 'Exportar Excel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exportar PDF' })).toBeInTheDocument()
    unmount()

    mocks.user = usuario('visualizador')
    renderDashboard()
    await screen.findByText('Painel SGEP')
    expect(screen.queryByRole('button', { name: 'Exportar Excel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Exportar PDF' })).not.toBeInTheDocument()
  })

  it('envia os filtros atuais para as duas exportações', async () => {
    mocks.user = usuario('super_admin')
    renderDashboard()
    await screen.findByRole('button', { name: 'Exportar Excel' })
    await screen.findByRole('option', { name: 'Enfermagem' })
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: '2' } })
    await waitFor(() => expect(screen.getByLabelText('Setor')).toHaveValue('2'))
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }))
    await waitFor(() => expect(mocks.excel).toHaveBeenCalledWith(expect.objectContaining({ setor_id: 2, inicio: expect.any(String), fim: expect.any(String) })))
    fireEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))
    await waitFor(() => expect(mocks.pdf).toHaveBeenCalledWith(expect.objectContaining({ setor_id: 2, inicio: expect.any(String), fim: expect.any(String) })))
  })

  it('mantém Gestão restrita ao setor associado nos dashboards e exportações', async () => {
    mocks.user = { ...usuario('visualizador'), permissoes: ['gestao'], setor_id: 2 }
    renderDashboard()

    expect(screen.queryByLabelText('Setor')).not.toBeInTheDocument()
    const setor = await screen.findByRole('button', { name: /Enfermagem/ })
    await waitFor(() => {
      expect(mocks.setores).toHaveBeenCalledWith(expect.objectContaining({ setor_id: 2 }))
    })

    fireEvent.click(setor)
    await waitFor(() => expect(mocks.turnos).toHaveBeenCalledWith(2, expect.objectContaining({ setor_id: 2 })))

    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }))
    await waitFor(() => expect(mocks.excel).toHaveBeenCalledWith(expect.objectContaining({ setor_id: 2 })))
  })

  it('não consulta dashboards de Gestão sem setor associado', async () => {
    mocks.user = { ...usuario('gestao'), setor_id: undefined }
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('não está vinculado a um setor')
    expect(mocks.setores).not.toHaveBeenCalled()
  })

  it('mostra erro e reabilita o botão quando a exportação falha', async () => {
    mocks.user = { ...usuario('gestao'), setor_id: 2 }
    mocks.excel.mockRejectedValueOnce(new Error('Falha simulada'))
    renderDashboard()
    const botao = await screen.findByRole('button', { name: 'Exportar Excel' })
    fireEvent.click(botao)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível exportar. Tente novamente.')
    expect(botao).toBeEnabled()
  })

  it('informa quando a API nega a exportação', async () => {
    mocks.user = { ...usuario('gestao'), setor_id: 2 }
    mocks.excel.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403, data: { erro: 'Acesso negado' } } })
    renderDashboard()

    fireEvent.click(await screen.findByRole('button', { name: 'Exportar Excel' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('não tem permissão para exportar')
  })
})
