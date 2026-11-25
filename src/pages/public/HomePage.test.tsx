import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ listar: vi.fn() }))
vi.mock('../../lib/api', () => ({ api: { setores: { listar: mocks.listar } } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))
import { HomePage, NotFoundPage } from './HomePage'

afterEach(() => { cleanup(); vi.clearAllMocks() })
function renderizar(page: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{page}</MemoryRouter></QueryClientProvider>)
}

describe('página inicial pública', () => {
  it('lista apenas setores ativos e mantém o acesso da equipe', async () => {
    mocks.listar.mockResolvedValue([
      { id: 1, nome: 'Recepção', slug: 'recepcao', ativo: true },
      { id: 2, nome: 'Fechado', slug: 'fechado', ativo: false },
    ])
    renderizar(<HomePage />)
    expect(await screen.findByRole('link', { name: /Recepção/ })).toHaveAttribute('href', '/recepcao')
    expect(screen.queryByRole('link', { name: /Fechado/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Acesso da equipe' })).toHaveAttribute('href', '/admin/login')
  })

  it('apresenta uma página 404 amigável', () => {
    renderizar(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
  })
})
