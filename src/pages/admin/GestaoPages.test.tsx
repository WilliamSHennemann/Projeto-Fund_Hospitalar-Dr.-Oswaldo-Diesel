import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ criar: vi.fn().mockResolvedValue({}), listarPerguntas: vi.fn().mockResolvedValue([]), listarSetores: vi.fn().mockResolvedValue([{ id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }]) }))
vi.mock('../../lib/api', () => ({ api: { admin: { perguntas: { criar: mocks.criar, listar: mocks.listarPerguntas, atualizar: vi.fn(), excluir: vi.fn(), reordenar: vi.fn() }, setores: { listar: mocks.listarSetores } } } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))
vi.mock('../../components/NavegacaoAdmin', () => ({ NavegacaoAdmin: () => null }))
import { PerguntasPage } from './GestaoPages'

describe('cadastro de pergunta múltipla', () => {
  it('envia opções numeradas e não envia ordem', async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><PerguntasPage /></MemoryRouter></QueryClientProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Nova pergunta' }))
    fireEvent.change(screen.getByLabelText('Pergunta'), { target: { value: 'O que devemos melhorar?' } })
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'multipla' } })
    fireEvent.change(await screen.findByLabelText('Rótulo da opção 1'), { target: { value: 'Limpeza' } })
    fireEvent.change(screen.getByLabelText('Rótulo da opção 2'), { target: { value: 'Tempo de espera' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(mocks.criar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'multipla', opcoes: [{ valor: 1, rotulo: 'Limpeza', emoji: undefined }, { valor: 2, rotulo: 'Tempo de espera', emoji: undefined }] })))
    expect(mocks.criar.mock.calls[0][0]).not.toHaveProperty('ordem')
  })
})
