import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import { pode } from '../../lib/permissions'
import { Marca } from '../../components/Marca'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mensagem = (location.state as { mensagem?: string } | null)?.mensagem
  const [email, setEmail] = useState('super@fundacao.com')
  const [senha, setSenha] = useState('super123')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(event: React.FormEvent) {
    event.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      const resposta = await api.auth.login(email, senha)
      const destino = pode(resposta.usuario, 'dashboard')
        ? '/admin'
        : pode(resposta.usuario, 'perguntas')
          ? '/admin/perguntas'
          : pode(resposta.usuario, 'manifestacoes')
            ? '/admin/manifestacoes'
            : null
      if (!destino) {
        setErro('Esta conta não tem acesso a nenhuma área do sistema.')
        return
      }
      auth.save(resposta.token, resposta.usuario)
      navigate(destino)
    } catch {
      setErro('E-mail ou senha inválidos.')
    } finally {
      setEnviando(false)
    }
  }

  return <><Marca /><main className="mx-auto max-w-md p-5 pt-12 sm:pt-16"><form onSubmit={event => void entrar(event)} className="rounded-3xl bg-white p-6 shadow-card sm:p-8"><div className="mb-6 h-1.5 w-16 rounded-full bg-brand-600" /><h1 className="text-2xl font-bold tracking-tight text-ink">Acesso da equipe</h1><p className="mt-2 leading-relaxed text-slate-700">Entre para acessar o painel SGEP.</p>{(erro || mensagem) && <p className="alert-error mt-4" role="alert">⚠ {erro || mensagem}</p>}<label className="mt-6 block font-semibold">E-mail<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="field" /></label><label className="mt-4 block font-semibold">Senha<input type="password" autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} className="field" /></label><button disabled={enviando} className="btn-primary mt-6 w-full">{enviando ? 'Entrando…' : 'Entrar'}</button></form></main></>
}
