import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { salvarSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'

export function BoasVindasPage() {
  const { slug = '' } = useParams(); const navigate = useNavigate(); const [erro, setErro] = useState(''); const [dataAtendimento, setDataAtendimento] = useState('')
  const setor = useQuery({ queryKey: ['setor', slug], queryFn: () => api.setores.obter(slug) })
  async function iniciar() { if (!setor.data || !dataAtendimento) { setErro('Informe a data em que foi atendido(a) para começar.'); return } try { const pesquisa = await api.pesquisas.criar({ setor_id: setor.data.id, anonimo: true, consentimento: false, data_atendimento: dataAtendimento }); salvarSessao(pesquisa); navigate(`/pesquisa/${slug}/pergunta/1`) } catch { setErro('Não foi possível iniciar agora. Verifique sua conexão e tente novamente.') } }
  if (setor.isLoading) return <><Marca /><main className="mx-auto max-w-3xl p-6"><div className="h-64 animate-pulse rounded-3xl bg-slate-200" /></main></>
  if (setor.isError) return <><Marca /><main className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-bold">Setor não encontrado</h1><p className="mt-3 text-slate-600">Confira o QR Code ou peça orientação à equipe.</p></main></>
  return <><Marca /><main className="mx-auto max-w-xl p-4 sm:p-5 sm:pt-14"><section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7"><p className="text-hospital-600">Você está em</p><h1 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">{setor.data?.nome}</h1><p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">Sua opinião nos ajuda a cuidar melhor de você. A avaliação é anônima e leva poucos minutos.</p><label className="mt-6 block font-semibold">Em que dia você foi atendido(a)?<input required type="date" max={new Date().toISOString().slice(0, 10)} value={dataAtendimento} onChange={e => setDataAtendimento(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3" /></label><p className="mt-2 text-sm text-slate-500">Usaremos esta data apenas para relacionar sua avaliação ao atendimento.</p>{erro && <p role="alert" className="mt-4 text-red-700">{erro}</p>}<button onClick={iniciar} className="mt-7 min-h-12 w-full rounded-xl bg-hospital-600 px-6 py-3 text-lg font-bold text-white hover:bg-hospital-800">Começar avaliação</button></section></main></>
}
