import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../types'

const mocks = vi.hoisted(() => ({
  user: null as Usuario | null,
  listarSetores: vi.fn(),
  listarUsuarios: vi.fn(),
  criarGestor: vi.fn(),
}))
vi.mock('../../lib/api', () => ({
  api: {
    admin: {
      setores: { listar: mocks.listarSetores },
      usuarios: { listar: mocks.listarUsuarios, criar: mocks.criarGestor },
    },
  },
}))
vi.mock('../../lib/auth', () => ({ auth: { getUser: () => mocks.user } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))
vi.mock('../../components/NavegacaoAdmin', () => ({ NavegacaoAdmin: () => null }))

import { UsuariosPage } from './UsuariosPage'

function renderPage() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><UsuariosPage /></MemoryRouter></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.user = { id: 1, nome: 'Admin', email: 'admin@fundacao.com', perfil: 'super_admin', permissoes: [] }
  mocks.listarSetores.mockResolvedValue([
    { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true },
    { id: 2, nome: 'Setor inativo', slug: 'inativo', url: '/inativo', qrcode: '', ativo: false },
  ])
  mocks.listarUsuarios.mockResolvedValue([])
  mocks.criarGestor.mockResolvedValue({ id: 3 })
})

afterEach(cleanup)

describe('administração de gestores', () => {
  it('cria gestor com perfil gestao e apenas permite escolher setores ativos', async () => {
    renderPage()

    const seletor = screen.getByLabelText('Setor')
    await screen.findByRole('option', { name: 'Recepção' })
    expect(seletor.querySelectorAll('option')).toHaveLength(2)
    expect(screen.queryByRole('option', { name: 'Setor inativo' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Gestor Recepção' } })
    fireEvent.change(screen.getByLabelText('E-mail de acesso'), { target: { value: 'gestor@fundacao.com' } })
    fireEvent.change(screen.getByLabelText(/Senha inicial/), { target: { value: 'senha-forte-123' } })
    fireEvent.change(seletor, { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar gestor' }))

    await waitFor(() => expect(mocks.criarGestor).toHaveBeenCalledWith({
      nome: 'Gestor Recepção',
      email: 'gestor@fundacao.com',
      senha: 'senha-forte-123',
      perfil: 'gestao',
      setor_id: 1,
    }))
    expect(await screen.findByRole('status')).toHaveTextContent('Gestor criado')
  })
})
