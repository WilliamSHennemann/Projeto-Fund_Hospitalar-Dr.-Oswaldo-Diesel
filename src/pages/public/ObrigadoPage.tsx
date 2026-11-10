import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { limparSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'
export function ObrigadoPage() { const { slug = '' } = useParams(); const navigate = useNavigate(); useEffect(() => limparSessao(), []); return <><Marca /><main className="public-shell pt-14 text-center sm:pt-20"><section className="rounded-3xl bg-white px-6 py-10 shadow-card sm:px-10"><div className="mx-auto grid size-20 place-items-center rounded-full bg-brand-50 text-5xl" aria-hidden="true">💛</div><h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">Obrigado por sua avaliação!</h1><p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">Sua opinião é muito importante para melhorarmos o cuidado com nossos pacientes.</p><button onClick={() => navigate(`/${slug}`)} className="btn-primary mt-8 w-full">Nova avaliação</button></section></main></> }
