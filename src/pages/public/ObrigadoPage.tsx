import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { limparSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'
export function ObrigadoPage() { const { slug = '' } = useParams(); const navigate = useNavigate(); useEffect(() => limparSessao(), []); return <><Marca /><main className="mx-auto max-w-xl p-5 pt-16 text-center"><div className="text-6xl">💛</div><h1 className="mt-5 text-3xl font-bold">Obrigado por sua avaliação!</h1><p className="mt-4 text-lg text-slate-600">Sua opinião é muito importante para melhorarmos o cuidado com nossos pacientes.</p><button onClick={() => navigate(`/${slug}`)} className="mt-9 min-h-12 rounded-xl bg-hospital-600 px-6 font-bold text-white">Nova avaliação</button></main></> }
