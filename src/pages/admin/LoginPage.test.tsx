import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../types'

const mocks = vi.hoisted(() => ({ login: vi.fn(), save: vi.fn() }))
vi.mock('../../lib/api', () => ({ api: { auth: { login: mocks.login } } }))
vi.mock('../../lib/auth', () => ({ auth: { save: mocks.save } }))
vi.mock('../../components/Marca', () => ({ Marca: () => null }))

import { GestorLoginPage } from './GestorLoginPage'
import { LoginPage } from './LoginPage'

const gestor: Usuario = { id: 5, nome: 'Gestor', email: 'gestor@fundacao.com', perfil: 'gestao', permissoes: [], setor_id: 1 }
const admin: Usuario = { id: 1, nome: 'Admin', email: 'admin@fundacao.com', perfil: 'super_admin', permissoes: [] }

function CaminhoAtual() {
  const location = useLocation()
  return <output data-testid="rota">{location.pathname}</output>
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('acesso separado do gestor', () => {
  it('permite gestor vinculado a setor pela tela exclusiva', async () => {
    mocks.login.mockResolvedValue({ token: 'token-gestor', usuario: gestor })
    render(<MemoryRouter initialEntries={['/gestor/login']}><Routes><Route path="/gestor/login" element={<GestorLoginPage />} /><Route path="/admin" element={<p>Painel SGEP</p>} /></Routes><CaminhoAtual /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: gestor.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-forte-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Painel SGEP')).toBeInTheDocument()
    expect(mocks.save).toHaveBeenCalledWith('token-gestor', gestor)
  })

  it('recusa gestor sem setor atribuído', async () => {
    mocks.login.mockResolvedValue({ token: 'token-gestor', usuario: { ...gestor, setor_id: undefined } })
    render(<MemoryRouter initialEntries={['/gestor/login']}><GestorLoginPage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: gestor.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-forte-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('não está configurada como gestor')
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('encaminha conta de gestor para a tela exclusiva quando tenta o login da equipe', async () => {
    mocks.login.mockResolvedValue({ token: 'token-gestor', usuario: gestor })
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: gestor.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-forte-123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('acesso exclusivo do gestor')
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('não permite conta administrativa na tela exclusiva do gestor', async () => {
    mocks.login.mockResolvedValue({ token: 'token-admin', usuario: admin })
    render(<MemoryRouter><GestorLoginPage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: admin.email } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-admin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('não está configurada como gestor')
    expect(mocks.save).not.toHaveBeenCalled()
  })
})
