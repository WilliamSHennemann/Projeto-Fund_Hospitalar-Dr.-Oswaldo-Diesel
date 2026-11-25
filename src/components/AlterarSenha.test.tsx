import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { alterarSenha } = vi.hoisted(() => ({ alterarSenha: vi.fn() }))
vi.mock('../lib/api', () => ({ api: { auth: { alterarSenha } } }))

import { AlterarSenha } from './AlterarSenha'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('alteração da própria senha', () => {
  it('envia a senha atual e a nova senha confirmada', async () => {
    alterarSenha.mockResolvedValue({ ok: true })
    render(<AlterarSenha />)
    fireEvent.click(screen.getByRole('button', { name: 'Alterar minha senha' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Senha atual'), { target: { value: 'senha-atual' } })
    fireEvent.change(within(dialog).getByLabelText('Nova senha'), { target: { value: 'senha-nova-123' } })
    fireEvent.change(within(dialog).getByLabelText('Confirme a nova senha'), { target: { value: 'senha-nova-123' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Alterar senha' }))
    await waitFor(() => expect(alterarSenha).toHaveBeenCalledWith({ senha_atual: 'senha-atual', nova_senha: 'senha-nova-123' }))
    expect(await within(dialog).findByRole('status')).toHaveTextContent('Sua senha foi alterada.')
  })

  it('recusa confirmação diferente sem chamar a API', async () => {
    render(<AlterarSenha />)
    fireEvent.click(screen.getByRole('button', { name: 'Alterar minha senha' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Senha atual'), { target: { value: 'senha-atual' } })
    fireEvent.change(within(dialog).getByLabelText('Nova senha'), { target: { value: 'senha-nova-123' } })
    fireEvent.change(within(dialog).getByLabelText('Confirme a nova senha'), { target: { value: 'senha-diferente' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Alterar senha' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('As senhas novas não são iguais.')
    expect(alterarSenha).not.toHaveBeenCalled()
  })
})
