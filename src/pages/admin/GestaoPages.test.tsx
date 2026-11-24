import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../types'

const mocks = vi.hoisted(() => ({ user: null as Usuario | null, criar: vi.fn().mockResolvedValue({}), listarPerguntas: vi.fn().mockResolvedValue([]), listarSetores: vi.fn().mockResolvedValue([{ id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }]), listarSetoresPublicos: vi.fn().mockResolvedValue([{ id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }]), atualizarPergunta: vi.fn().mockResolvedValue({}), excluirPergunta: vi.fn().mockResolvedValue({}), apagarPergunta: vi.fn().mockResolvedValue({}), reordenar: vi.fn().mockResolvedValue({}), criarSetor: vi.fn().mockResolvedValue({}), atualizarSetor: vi.fn().mockResolvedValue({}), excluirSetor: vi.fn().mockResolvedValue({}), apagarSetor: vi.fn().mockResolvedValue({}) }))
vi.mock('../../lib/api', () => ({ api: { setores: { listar: mocks.listarSetoresPublicos }, admin: { perguntas: { criar: mocks.criar, listar: mocks.listarPerguntas, atualizar: mocks.atualizarPergunta, excluir: mocks.excluirPergunta, apagarPermanentemente: mocks.apagarPergunta, reordenar: mocks.reordenar }, setores: { listar: mocks.listarSetores, criar: mocks.criarSetor, atualizar: mocks.atualizarSetor, excluir: mocks.excluirSetor, apagarPermanentemente: mocks.apagarSetor } } } }))
vi.mock('../../lib/auth', () => ({ auth: { getUser: () => mocks.user } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))
vi.mock('../../components/NavegacaoAdmin', () => ({ NavegacaoAdmin: () => null }))
import { PerguntasPage, SetoresPage } from './GestaoPages'

function renderPage(page: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{page}</MemoryRouter></QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  mocks.user = null
  mocks.listarPerguntas.mockResolvedValue([])
  mocks.listarSetores.mockResolvedValue([{ id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }])
  mocks.listarSetoresPublicos.mockResolvedValue([{ id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }])
  vi.unstubAllGlobals()
})

describe('cadastro de pergunta múltipla', () => {
  it('restringe Gestão ao setor vinculado na lista e no formulário', async () => {
    const setores = [
      { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true },
      { id: 2, nome: 'Enfermagem', slug: 'enfermagem', url: '/enfermagem', qrcode: '', ativo: true },
    ]
    mocks.user = { id: 10, nome: 'Gestão', email: 'gestao@fundacao.com', perfil: 'visualizador', permissoes: ['gestao'], setor_id: 1 }
    mocks.listarSetoresPublicos.mockResolvedValueOnce(setores)
    mocks.listarPerguntas.mockResolvedValueOnce([
      { id: 1, texto: 'Pergunta da Recepção', tipo: 'texto', geral: false, setor_id: 1, ordem: 1, numero: 1, ativo: true, opcoes: [] },
      { id: 2, texto: 'Pergunta da Enfermagem', tipo: 'texto', geral: false, setor_id: 2, ordem: 1, numero: 1, ativo: true, opcoes: [] },
    ])
    renderPage(<PerguntasPage />)

    expect(await screen.findByText('Pergunta da Recepção')).toBeInTheDocument()
    expect(screen.queryByText('Pergunta da Enfermagem')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Perguntas do setor')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Nova pergunta' }))
    const setor = screen.getByLabelText('Setor')
    expect(setor).toHaveValue('1')
    expect(setor.querySelectorAll('option')).toHaveLength(1)
    expect(screen.queryByRole('option', { name: 'Enfermagem' })).not.toBeInTheDocument()
  })

  it.each(['gestao', 'admin_setor'] as const)('%s carrega setores pela rota pública e mantém o setor vinculado', async perfil => {
    mocks.user = { id: 10, nome: 'Gestão', email: 'gestao@fundacao.com', perfil, permissoes: [], setor_id: 1 }
    mocks.listarSetoresPublicos.mockResolvedValueOnce([
      { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true },
      { id: 2, nome: 'Enfermagem', slug: 'enfermagem', url: '/enfermagem', qrcode: '', ativo: true },
    ])
    renderPage(<PerguntasPage />)

    expect(await screen.findByText('Setor: Recepção')).toBeInTheDocument()
    expect(mocks.listarSetoresPublicos).toHaveBeenCalledOnce()
    expect(mocks.listarSetores).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Nova pergunta' }))
    expect(screen.getByLabelText('Setor')).toHaveValue('1')
    expect(screen.getByLabelText('Setor').querySelectorAll('option')).toHaveLength(1)
  })

  it('super_admin carrega setores pela rota administrativa', async () => {
    mocks.user = { id: 1, nome: 'Admin', email: 'admin@fundacao.com', perfil: 'super_admin', permissoes: [] }
    mocks.listarSetores.mockResolvedValueOnce([
      { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true },
      { id: 2, nome: 'Inativo', slug: 'inativo', url: '/inativo', qrcode: '', ativo: false },
    ])
    renderPage(<PerguntasPage />)

    expect(await screen.findByRole('option', { name: 'Inativo' })).toBeInTheDocument()
    expect(mocks.listarSetores).toHaveBeenCalledOnce()
    expect(mocks.listarSetoresPublicos).not.toHaveBeenCalled()
  })

  it('envia opções numeradas e não envia ordem', async () => {
    renderPage(<PerguntasPage />)
    await screen.findByRole('option', { name: 'Recepção' })
    fireEvent.click(screen.getByRole('button', { name: 'Nova pergunta' }))
    fireEvent.change(screen.getByLabelText('Pergunta'), { target: { value: 'O que devemos melhorar?' } })
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'multipla' } })
    fireEvent.change(await screen.findByLabelText('Rótulo da opção 1'), { target: { value: 'Limpeza' } })
    fireEvent.change(screen.getByLabelText('Rótulo da opção 2'), { target: { value: 'Tempo de espera' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(mocks.criar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'multipla', opcoes: [{ valor: 1, rotulo: 'Limpeza', emoji: undefined }, { valor: 2, rotulo: 'Tempo de espera', emoji: undefined }] })))
    expect(mocks.criar.mock.calls[0][0]).not.toHaveProperty('ordem')
  })

  it('desativa pergunta sem apagá-la permanentemente', async () => {
    mocks.listarPerguntas.mockResolvedValueOnce([{ id: 2, texto: 'Pergunta local', tipo: 'texto', geral: false, setor_id: 1, ordem: 1, numero: 1, ativo: true, opcoes: [] }])
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderPage(<PerguntasPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
    await waitFor(() => expect(mocks.excluirPergunta).toHaveBeenCalledWith(2))
    expect(mocks.apagarPergunta).not.toHaveBeenCalled()
  })

  it('apaga pergunta permanentemente em ação separada', async () => {
    mocks.listarPerguntas.mockResolvedValueOnce([{ id: 3, texto: 'Pergunta removível', tipo: 'texto', geral: false, setor_id: 1, ordem: 1, numero: 1, ativo: true, opcoes: [] }])
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderPage(<PerguntasPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Apagar permanentemente' }))
    await waitFor(() => expect(mocks.apagarPergunta).toHaveBeenCalledWith(3))
  })

  it('desativa setor e permite apagá-lo permanentemente', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    renderPage(<SetoresPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
    await waitFor(() => expect(mocks.excluirSetor).toHaveBeenCalledWith(1))
    fireEvent.click(screen.getByRole('button', { name: 'Apagar permanentemente' }))
    await waitFor(() => expect(mocks.apagarSetor).toHaveBeenCalledWith(1))
  })

  it('imprime somente o SVG do QR em uma nova janela', async () => {
    const write = vi.fn()
    const print = vi.fn()
    vi.stubGlobal('open', vi.fn(() => ({ document: { write, close: vi.fn() }, focus: vi.fn(), print })))
    renderPage(<SetoresPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Imprimir QR' }))
    expect(window.open).toHaveBeenCalled()
    expect(write).toHaveBeenCalledWith(expect.stringContaining('qrcode-setor-1'))
    expect(write).toHaveBeenCalledWith(expect.stringContaining('<svg'))
    expect(print).toHaveBeenCalled()
  })
})
