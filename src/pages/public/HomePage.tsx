import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Marca } from '../../components/Marca'
import { BarraPublica } from '../../components/BarraPublica'
import { auth } from '../../lib/auth'

export function HomePage() {
  const usuario = auth.getUser()
  const setores = useQuery({ queryKey: ['setores'], queryFn: api.setores.listar })
  return <><BarraPublica /><Marca /><main className="public-shell sm:pt-12">
    <section className="rounded-[2rem] bg-white p-6 shadow-card sm:p-10">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Pesquisa de atendimento</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Fundação Hospitalar Dr. Oswaldo Diesel</h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-700">Conte como foi o seu atendimento</p>
      {setores.isLoading && <p className="mt-7 text-base text-slate-700">Carregando os setores…</p>}
      {setores.isError && <div className="mt-7"><p role="alert" className="alert-error">Não foi possível carregar os setores. Tente novamente.</p><button onClick={() => void setores.refetch()} className="btn-primary mt-3 min-h-12">Tentar novamente</button></div>}
      {!!setores.data?.length && <div className="mt-7 grid gap-3 sm:grid-cols-2">{setores.data.filter(setor => setor.ativo).map(setor => <Link key={setor.id} to={`/${setor.slug}`} className="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-lg font-bold text-ink shadow-sm transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"><span>{setor.nome}</span><span aria-hidden="true" className="text-2xl text-brand-700">→</span></Link>)}</div>}
      {!setores.isLoading && !setores.isError && !setores.data?.some(setor => setor.ativo) && <p className="mt-7 text-base text-slate-700">Não há setores disponíveis no momento.</p>}
      <Link to="/admin/login" className="mt-8 inline-flex min-h-12 items-center text-base font-semibold text-slate-600 underline underline-offset-4">{usuario ? 'Ir para o painel' : 'Acesso da equipe'}</Link>
    </section>
  </main></>
}

export function NotFoundPage() {
  return <><Marca /><main className="public-shell pt-12"><section className="rounded-3xl bg-white p-8 text-center shadow-card"><h1 className="text-3xl font-bold text-ink">Página não encontrada</h1><p className="mt-3 text-lg text-slate-700">Confira o endereço ou volte ao início.</p><Link to="/" className="btn-primary mt-7 inline-flex">Voltar ao início</Link></section></main></>
}
