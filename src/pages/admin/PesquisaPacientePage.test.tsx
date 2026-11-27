import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../types'

const mocks = vi.hoisted(() => ({
  user: null as Usuario | null,
  listarSetores: vi.fn().mockResolvedValue([{ id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }]),
  fluxo: vi.fn().mockResolvedValue({ setor: { id: 1, nome: 'Recepção', slug: 'recepcao' }, fluxo: [] }),
}))

vi.mock('../../lib/api', () => ({
  api: { setores: { listar: mocks.listarSetores, fluxo: mocks.fluxo } },
}))
vi.mock('../../lib/auth', () => ({ auth: { getUser: () => mocks.user } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))
vi.mock('../../components/CabecalhoAdmin', () => ({ CabecalhoAdmin: () => null }))
vi.mock('../../components/NavegacaoAdmin', () => ({ NavegacaoAdmin: () => null }))

import { PesquisaPacientePage } from './PesquisaPacientePage'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('atalhos da pesquisa do paciente', () => {
  it('abre a avaliação real do setor e mantém a prévia separada', async () => {
    mocks.user = { id: 1, nome: 'Admin', email: 'admin@fundacao.com', perfil: 'super_admin', permissoes: [] }
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter><PesquisaPacientePage /></MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('link', { name: 'Ver perguntas deste setor' }))
      .toHaveAttribute('href', '/recepcao')
    expect(screen.getByRole('link', { name: 'Ver como o paciente vê' }))
      .toHaveAttribute('href', '/recepcao?previa=1')
  })
})
