import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { api } from '../../lib/api'
import { mockDemoCredentials } from '../../lib/mock/api'
import { auth } from '../../lib/auth'
import { pode } from '../../lib/permissions'
import { Marca } from '../../components/Marca'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const mensagem = (location.state as { mensagem?: string } | null)?.mensagem
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
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : error instanceof Error && error.message === 'INVALID_CREDENTIALS' ? 401 : undefined
      setErro(status === 401
        ? 'E-mail ou senha inválidos.'
        : status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
          : 'O sistema está iniciando ou indisponível. Aguarde cerca de 1 minuto e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return <><Marca /><main className="mx-auto grid min-h-[calc(100svh-6rem)] max-w-7xl place-items-center p-4 sm:p-7 lg:p-10"><div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-card md:min-h-[570px] md:grid-cols-[1.05fr_.95fr]"><section className="relative isolate overflow-hidden bg-brand-600 px-6 py-8 text-white sm:px-10 sm:py-10 md:flex md:flex-col md:justify-between"><div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden"><span className="absolute -right-20 -top-20 size-72 rounded-full bg-accent-400" /><span className="absolute -bottom-36 -left-24 size-80 rounded-full bg-support-600/90" /><span className="absolute bottom-24 right-10 size-28 rounded-full border-[18px] border-white/15" /></div><div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"><span className="size-2 rounded-full bg-accent-400" />SGEP · FHDOD</div><div className="relative z-10 mt-8 max-w-md md:mt-0"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Experiência do paciente</p><h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Uma experiência melhor começa com escuta.</h2><p className="mt-4 max-w-sm text-base leading-relaxed text-white/90">Acesse os indicadores e ferramentas que apoiam o cuidado oferecido pela Fundação.</p></div><p className="relative z-10 mt-8 text-sm font-medium text-white/75 md:mt-0">Plataforma institucional · Acesso seguro da equipe</p></section><form onSubmit={event => void entrar(event)} className="p-6 sm:p-10 lg:p-12"><div className="mb-6 flex h-1.5 w-20 overflow-hidden rounded-full"><span className="w-3/5 bg-brand-600" /><span className="w-1/4 bg-accent-400" /><span className="flex-1 bg-support-600" /></div><p className="text-sm font-bold uppercase tracking-wider text-brand-700">Área administrativa</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Acesso da equipe</h1><p className="mt-2 leading-relaxed text-slate-700">Entre para acessar o painel SGEP.</p>{(erro || mensagem) && <p className="alert-error mt-4" role="alert">⚠ {erro || mensagem}</p>}<label className="mt-7 block font-semibold">E-mail<input required type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className="field" /></label><label className="mt-4 block font-semibold">Senha<input required type="password" autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} className="field" /></label><button disabled={enviando} className="btn-primary mt-7 w-full">{enviando ? 'Entrando…' : 'Entrar'}</button>{import.meta.env.VITE_USE_MOCK === 'true' && <p className="mt-4 rounded-xl bg-warm-50 p-3 text-sm text-slate-700">Acesso de demonstração: {mockDemoCredentials}</p>}<p className="mt-5 text-center text-xs text-slate-600">Acesso restrito a profissionais autorizados.</p></form></div></main></>
}
