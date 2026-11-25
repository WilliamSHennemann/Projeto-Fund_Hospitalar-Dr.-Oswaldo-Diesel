import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../types'

const mocks = vi.hoisted(() => ({ login: vi.fn(), save: vi.fn() }))
vi.mock('../../lib/api', () => ({ api: { auth: { login: mocks.login } } }))
vi.mock('../../lib/auth', () => ({ auth: { save: mocks.save } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))

import { LoginPage } from './LoginPage'

const gestor: Usuario = { id: 5, nome: 'Gestor', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1 }
const admin: Usuario = { id: 1, nome: 'Admin', email: 'admin@fundacao.com', perfil: 'super_admin', permissoes: [] }
const adminSetor: Usuario = { id: 6, nome: 'Admin setor', email: 'setor@fundacao.com', perfil: 'admin_setor', permissoes: [], setor_id: 1 }

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('login compartilhado da equipe', () => {
  it('inicia com as credenciais vazias', () => {
    render(<MemoryRouter initialEntries={['/admin/login']}><Routes><Route path="/admin/login" element={<LoginPage />} /></Routes></MemoryRouter>)
    expect(screen.getByLabelText('E-mail')).toHaveValue('')
    expect(screen.getByLabelText('Senha')).toHaveValue('')
  })

  it.each([gestor, admin])('autentica $perfil pela mesma tela e encaminha ao painel', async usuario => {
    mocks.login.mockResolvedValue({ token: 'token-validado', usuario })
    render(<MemoryRouter initialEntries={['/admin/login']}><Routes><Route path="/admin/login" element={<LoginPage />} /><Route path="/admin" element={<p>Painel SGEP</p>} /></Routes></MemoryRouter>)

    expect(screen.queryByText(/É gestor/i)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: usuario.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-forte-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Painel SGEP')).toBeInTheDocument()
    expect(mocks.login).toHaveBeenCalledWith(usuario.email, 'senha-forte-123')
    expect(mocks.save).toHaveBeenCalledWith('token-validado', usuario)
  })

  it('encaminha admin_setor para perguntas após o login compartilhado', async () => {
    mocks.login.mockResolvedValue({ token: 'token-validado', usuario: adminSetor })
    render(<MemoryRouter initialEntries={['/admin/login']}><Routes><Route path="/admin/login" element={<LoginPage />} /><Route path="/admin/perguntas" element={<p>Perguntas do setor</p>} /></Routes></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: adminSetor.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-forte-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Perguntas do setor')).toBeInTheDocument()
    expect(mocks.save).toHaveBeenCalledWith('token-validado', adminSetor)
  })

  it.each([
    [401, 'E-mail ou senha inválidos.'],
    [429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'],
    [503, 'O sistema está iniciando ou indisponível. Aguarde cerca de 1 minuto e tente novamente.'],
  ])('mostra mensagem adequada quando o login responde %s', async (status, mensagem) => {
    mocks.login.mockRejectedValue(Object.assign(new Error('falha'), { isAxiosError: true, response: { status } }))
    render(<MemoryRouter initialEntries={['/admin/login']}><Routes><Route path="/admin/login" element={<LoginPage />} /></Routes></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'equipe@fundacao.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-forte-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
  })
})
