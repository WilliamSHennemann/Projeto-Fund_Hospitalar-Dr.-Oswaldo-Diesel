import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ finalizar: vi.fn(), manifestacao: vi.fn() }))
vi.mock('../../lib/api', () => ({ api: { pesquisas: { finalizar: mocks.finalizar, manifestacao: mocks.manifestacao } } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))
import { FinalPage } from './FinalPage'

const setor = { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true }
function RotaAtual() { const local = useLocation(); return <output data-testid="rota">{local.pathname}</output> }
function renderizar(nota: number) {
  sessionStorage.setItem('sgep.pesquisa', JSON.stringify({ pesquisa_id: 7, token: 'abc', setor, nps_nota: nota, finalizacao: { destino: nota <= 6 ? 'ouvidoria' : 'agradecimento', motivo: 'finalizada' } }))
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/pesquisa/recepcao/final']}><Routes><Route path="/pesquisa/:slug/final" element={<FinalPage />} /><Route path="/pesquisa/:slug/obrigado" element={<><p>Obrigado</p><RotaAtual /></>} /></Routes></MemoryRouter></QueryClientProvider>)
}
afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks() })

describe('etapa final da pesquisa', () => {
  it('oferece elogio pré-selecionado para nota alta e envia um único formulário com contato', async () => {
    mocks.manifestacao.mockResolvedValue({ id: 9, tipo: 'elogio', status: 'aberta', contato_registrado: true })
    renderizar(10)
    expect(await screen.findByText('Que bom! Quer deixar um elogio?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Elogio' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByLabelText('Quero que a Ouvidoria entre em contato comigo'))
    fireEvent.change(screen.getByLabelText('Nome (opcional)'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Telefone com DDD (obrigatório)'), { target: { value: '11912345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await waitFor(() => expect(mocks.manifestacao).toHaveBeenCalledWith(7, { tipo: 'elogio', descricao: '', contato: { nome: 'Ana', telefone: '(11) 91234-5678', consentimento: true } }))
    expect(await screen.findByTestId('rota')).toHaveTextContent('/pesquisa/recepcao/obrigado')
    expect(JSON.parse(sessionStorage.getItem('sgep.pesquisa')!).contato_registrado).toBe(true)
  })

  it('pré-seleciona reclamação e valida observação sem contato', async () => {
    renderizar(3)
    expect(await screen.findByText('Sentimos muito que sua experiência não tenha sido boa. Quer nos contar o que aconteceu?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reclamação' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Escreva pelo menos 5 caracteres')
    expect(mocks.manifestacao).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Escreva aqui (opcional)'), { target: { value: 'Demorou demais' } })
    mocks.manifestacao.mockResolvedValue({ id: 10, tipo: 'reclamacao', status: 'aberta', contato_registrado: false })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await waitFor(() => expect(mocks.manifestacao).toHaveBeenCalledWith(7, { tipo: 'reclamacao', descricao: 'Demorou demais' }))
  })

  it('permite terminar sem enviar mensagem para uma nota intermediária', async () => {
    renderizar(8)
    expect(await screen.findByText('Quer deixar uma sugestão para melhorarmos?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Não quero enviar, terminar' }))
    expect(await screen.findByText('Obrigado')).toBeInTheDocument()
    expect(mocks.manifestacao).not.toHaveBeenCalled()
  })
})
