import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Pergunta } from '../../types'

const mocks = vi.hoisted(() => ({ responder: vi.fn().mockResolvedValue({}), finalizar: vi.fn().mockResolvedValue({ destino: 'agradecimento', motivo: 'ok' }), fluxo: vi.fn() }))
vi.mock('../../lib/api', () => ({ api: { setores: { fluxo: mocks.fluxo }, pesquisas: { responder: mocks.responder, finalizar: mocks.finalizar } } }))
import { PerguntaPage } from './PerguntaPage'

const setor = { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }
function pergunta(tipo: Pergunta['tipo'], opcoes: Pergunta['opcoes'] = []): Pergunta { return { id: 10, texto: 'Como foi?', tipo, geral: false, setor_id: 1, ordem: 1, numero: 1, opcoes } }
function Tela() { const local = useLocation(); return <><Routes><Route path="/pesquisa/:slug/pergunta/:n" element={<PerguntaPage />} /></Routes><output data-testid="rota">{local.pathname}</output></> }
function renderizar(item: Pergunta) { sessionStorage.setItem('sgep.pesquisa', JSON.stringify({ pesquisa_id: 7, token: 'abc', setor })); mocks.fluxo.mockResolvedValue({ setor, fluxo: [item] }); return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/pesquisa/recepcao/pergunta/1']}><Tela /></MemoryRouter></QueryClientProvider>) }

describe('PerguntaPage', () => {
  it('envia rostinho e NPS com valor e opção', async () => {
    renderizar(pergunta('rostinho', [{ id: 2, pergunta_id: 10, valor: 2, rotulo: 'Ruim', emoji: '🙁' }]))
    fireEvent.click(await screen.findByRole('button', { name: 'Ruim' }))
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledWith(7, 10, { pergunta_id: 10, valor: 2, opcao_id: 2 }))
  })

  it('renderiza NPS de 0 a 10 e envia a opção selecionada', async () => {
    renderizar(pergunta('nps'))
    fireEvent.click(await screen.findByRole('button', { name: 'Nota 10' }))
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledWith(7, 10, { pergunta_id: 10, valor: 10, opcao_id: 11 }))
  })

  it('envia texto sem valor', async () => {
    renderizar(pergunta('texto'))
    fireEvent.change(await screen.findByLabelText('Sua resposta'), { target: { value: 'Atendimento excelente' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledWith(7, 10, { pergunta_id: 10, texto: 'Atendimento excelente' }))
  })

  it('envia múltipla escolha com valor e opção e respeita destino do backend', async () => {
    mocks.finalizar.mockResolvedValueOnce({ destino: 'ouvidoria', motivo: 'nps_baixo' })
    renderizar(pergunta('multipla', [{ id: 8, pergunta_id: 10, valor: 3, rotulo: 'Limpeza', emoji: '✨' }]))
    fireEvent.click(await screen.findByRole('button', { name: 'Limpeza' }))
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledWith(7, 10, { pergunta_id: 10, valor: 3, opcao_id: 8 }))
    await waitFor(() => expect(screen.getByTestId('rota')).toHaveTextContent('/pesquisa/recepcao/final'))
  })
})
