import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import { isGestao } from '../../lib/permissions'
import { Marca } from '../../components/Marca'

export function GestorLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(event: React.FormEvent) {
    event.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      const resposta = await api.auth.login(email, senha)
      const setorValido = resposta.usuario.setor_id !== undefined && Number.isInteger(resposta.usuario.setor_id) && resposta.usuario.setor_id > 0
      if (!isGestao(resposta.usuario) || !setorValido) {
        setErro('Esta conta não está configurada como gestor de um setor.')
        return
      }
      auth.save(resposta.token, resposta.usuario)
      navigate('/admin')
    } catch {
      setErro('E-mail ou senha inválidos.')
    } finally {
      setEnviando(false)
    }
  }

  return <><Marca /><main className="mx-auto max-w-md p-5 pt-12 sm:pt-16"><form onSubmit={event => void entrar(event)} className="rounded-3xl bg-white p-6 shadow-card sm:p-8"><div className="mb-6 h-1.5 w-16 rounded-full bg-brand-600" /><h1 className="text-2xl font-bold tracking-tight text-ink">Acesso do gestor</h1><p className="mt-2 leading-relaxed text-slate-700">Entre com o e-mail e a senha fornecidos pelo administrador.</p>{erro && <p className="alert-error mt-4" role="alert">⚠ {erro}</p>}<label className="mt-6 block font-semibold">E-mail<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="field" /></label><label className="mt-4 block font-semibold">Senha<input required type="password" autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} className="field" /></label><button disabled={enviando} className="btn-primary mt-6 w-full">{enviando ? 'Entrando…' : 'Entrar'}</button><p className="mt-5 text-center text-sm text-slate-700"><Link to="/admin/login" className="font-semibold text-brand-800 underline underline-offset-2">Acesso da equipe administrativa</Link></p></form></main></>
}
