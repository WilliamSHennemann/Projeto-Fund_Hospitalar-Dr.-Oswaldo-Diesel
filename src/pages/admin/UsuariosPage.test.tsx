import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AtualizarGestor, Usuario } from '../../types'

const mocks = vi.hoisted(() => ({
  user: null as Usuario | null,
  listarSetores: vi.fn(),
  listarUsuarios: vi.fn(),
  criarGestor: vi.fn(),
  atualizarGestor: vi.fn(),
  excluirGestor: vi.fn(),
  redefinirSenha: vi.fn(),
  reativar: vi.fn(),
}))
vi.mock('../../lib/api', () => ({
  api: {
    admin: {
      setores: { listar: mocks.listarSetores },
      usuarios: { listar: mocks.listarUsuarios, criar: mocks.criarGestor, atualizar: mocks.atualizarGestor, excluir: mocks.excluirGestor, redefinirSenha: mocks.redefinirSenha, reativar: mocks.reativar },
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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

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

  it('mostra o erro EMAIL_EXISTS na criação', async () => {
    mocks.criarGestor.mockRejectedValue(new Error('EMAIL_EXISTS'))
    renderPage()

    await screen.findByRole('option', { name: 'Recepção' })
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Gestor Recepção' } })
    fireEvent.change(screen.getByLabelText('E-mail de acesso'), { target: { value: 'gestor@fundacao.com' } })
    fireEvent.change(screen.getByLabelText(/Senha inicial/), { target: { value: 'senha-forte-123' } })
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar gestor' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta com esse e-mail (pode estar na lista de acessos removidos — reative por lá).')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('preenche e salva somente os campos editados, atualizando a listagem', async () => {
    const gestor: Usuario = { id: 8, nome: 'Gestor Recepção', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: ['dashboard'], setor_id: 1 }
    let lista = [gestor]
    mocks.listarSetores.mockResolvedValue([
      { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true },
      { id: 2, nome: 'Setor inativo', slug: 'inativo', url: '/inativo', qrcode: '', ativo: false },
      { id: 3, nome: 'Triagem', slug: 'triagem', url: '/triagem', qrcode: '', ativo: true },
    ])
    mocks.listarUsuarios.mockImplementation(async () => lista)
    mocks.atualizarGestor.mockImplementation(async (id: number, dados: AtualizarGestor) => {
      lista = lista.map(item => item.id === id ? { ...item, ...dados } : item)
      return lista.find(item => item.id === id) ?? gestor
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Gestor Recepção' }))
    const form = screen.getByRole('form', { name: 'Editar gestor' })
    expect(within(form).getByLabelText('Nome do gestor')).toHaveValue('Gestor Recepção')
    expect(within(form).getByLabelText('E-mail do gestor')).toHaveValue('gestor@fundacao.com')
    expect(within(form).getByLabelText('Setor')).toHaveValue('1')
    expect(within(form).queryByLabelText(/senha|perfil|permissões/i)).not.toBeInTheDocument()

    fireEvent.change(within(form).getByLabelText('Nome do gestor'), { target: { value: 'Gestor Atualizado' } })
    fireEvent.change(within(form).getByLabelText('E-mail do gestor'), { target: { value: 'novo@fundacao.com' } })
    fireEvent.change(within(form).getByLabelText('Setor'), { target: { value: '3' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(mocks.atualizarGestor).toHaveBeenCalledWith(8, {
      nome: 'Gestor Atualizado',
      email: 'novo@fundacao.com',
      setor_id: 3,
    }))
    expect(await screen.findByText('Gestor Atualizado')).toBeInTheDocument()
    expect(screen.getByText('novo@fundacao.com')).toBeInTheDocument()
    expect(screen.getByText('Setor: Triagem')).toBeInTheDocument()
    expect(mocks.listarUsuarios).toHaveBeenCalledTimes(2)
  })

  it('permite editar nome/e-mail mantendo o setor inativo sem enviá-lo', async () => {
    const gestor: Usuario = { id: 8, nome: 'Gestor Recepção', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 2 }
    mocks.listarUsuarios.mockResolvedValue([gestor])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Gestor Recepção' }))
    const form = screen.getByRole('form', { name: 'Editar gestor' })
    expect(within(form).getByRole('option', { name: 'Setor inativo (inativo)' })).toBeDisabled()
    expect(within(form).getByLabelText('Setor')).toHaveValue('2')
    fireEvent.change(within(form).getByLabelText('Nome do gestor'), { target: { value: 'Nome atualizado' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(mocks.atualizarGestor).toHaveBeenCalledWith(8, { nome: 'Nome atualizado' }))
  })

  it('exibe o erro de e-mail duplicado ao editar sem exibir sucesso', async () => {
    const gestor: Usuario = { id: 8, nome: 'Gestor Recepção', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1 }
    mocks.listarUsuarios.mockResolvedValue([gestor])
    mocks.atualizarGestor.mockRejectedValue(new Error('EMAIL_EXISTS'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Gestor Recepção' }))
    const form = screen.getByRole('form', { name: 'Editar gestor' })
    fireEvent.change(within(form).getByLabelText('E-mail do gestor'), { target: { value: 'duplicado@fundacao.com' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta com esse e-mail (pode estar na lista de acessos removidos — reative por lá).')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('pede confirmação e remove o acesso do gestor pela API', async () => {
    const gestor: Usuario = { id: 8, nome: 'Gestor Recepção', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1 }
    mocks.listarUsuarios.mockResolvedValueOnce([gestor]).mockResolvedValueOnce([])
    mocks.excluirGestor.mockResolvedValue(undefined)
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Remover acesso' }))

    await waitFor(() => expect(mocks.excluirGestor).toHaveBeenCalledWith(8))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining(gestor.email))
    expect(await screen.findByRole('status')).toHaveTextContent('acesso de Gestor Recepção foi removido')
  })

  it('permite remover acesso de Ouvidoria sem oferecer edição de gestor', async () => {
    const ouvidoria: Usuario = { id: 9, nome: 'Equipe Ouvidoria', email: 'ouvidoria@fundacao.com', perfil: 'ouvidoria', permissoes: ['ouvidoria'] }
    mocks.listarUsuarios.mockResolvedValueOnce([ouvidoria]).mockResolvedValueOnce([])
    mocks.excluirGestor.mockResolvedValue(undefined)
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderPage()

    const email = await screen.findByText(ouvidoria.email)
    const linha = email.closest('li')
    if (!linha) throw new Error('Conta de Ouvidoria não encontrada na lista.')

    expect(within(linha).getByText('Ouvidoria')).toBeInTheDocument()
    expect(within(linha).queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    fireEvent.click(within(linha).getByRole('button', { name: 'Remover acesso' }))

    await waitFor(() => expect(mocks.excluirGestor).toHaveBeenCalledWith(ouvidoria.id))
  })

  it('não chama a API se o admin cancelar a remoção', async () => {
    const gestor: Usuario = { id: 8, nome: 'Gestor Recepção', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1 }
    mocks.listarUsuarios.mockResolvedValueOnce([gestor])
    vi.stubGlobal('confirm', vi.fn(() => false))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Remover acesso' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(mocks.excluirGestor).not.toHaveBeenCalled()
  })

  it('cria uma conta de Ouvidoria sem exigir setor', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Equipe Ouvidoria' } })
    fireEvent.change(screen.getByLabelText('E-mail de acesso'), { target: { value: 'ouvidoria2@fundacao.com' } })
    fireEvent.change(screen.getByLabelText(/Senha inicial/), { target: { value: 'senha-forte-123' } })
    fireEvent.change(screen.getByLabelText('Perfil'), { target: { value: 'ouvidoria' } })
    expect(screen.queryByLabelText('Setor')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Criar gestor' }))
    await waitFor(() => expect(mocks.criarGestor).toHaveBeenCalledWith({ nome: 'Equipe Ouvidoria', email: 'ouvidoria2@fundacao.com', senha: 'senha-forte-123', perfil: 'ouvidoria' }))
  })

  it('redefine a senha de uma conta com confirmação', async () => {
    const gestor: Usuario = { id: 8, nome: 'Gestor Recepção', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1 }
    mocks.listarUsuarios.mockResolvedValue([gestor])
    mocks.redefinirSenha.mockResolvedValue({ ok: true })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Redefinir senha' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Nova senha'), { target: { value: 'senha-nova-123' } })
    fireEvent.change(within(dialog).getByLabelText('Confirme a nova senha'), { target: { value: 'senha-nova-123' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar nova senha' }))
    await waitFor(() => expect(mocks.redefinirSenha).toHaveBeenCalledWith(8, 'senha-nova-123'))
    expect(await screen.findByRole('status')).toHaveTextContent('A senha de Gestor Recepção foi redefinida.')
  })

  it('reativa um acesso removido', async () => {
    const usuarioInativo: Usuario = { id: 8, nome: 'Gestor Recepção', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1, ativo: false }
    mocks.listarUsuarios.mockResolvedValue([usuarioInativo])
    mocks.reativar.mockResolvedValue({ ok: true })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }))
    await waitFor(() => expect(mocks.reativar).toHaveBeenCalledWith(8))
    expect(await screen.findByRole('status')).toHaveTextContent('O acesso de Gestor Recepção foi reativado.')
  })
})
