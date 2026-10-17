import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { salvarSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'

export function BoasVindasPage() {
  const { slug = '' } = useParams(); const navigate = useNavigate(); const [termo, setTermo] = useState(false); const [erro, setErro] = useState('')
  const setor = useQuery({ queryKey: ['setor', slug], queryFn: () => api.setores.obter(slug) })
  async function iniciar() { if (!setor.data) return; try { const pesquisa = await api.pesquisas.criar({ setor_id: setor.data.id, anonimo: true, consentimento: termo }); salvarSessao(pesquisa); navigate(`/pesquisa/${slug}/pergunta/1`) } catch { setErro('Não foi possível iniciar agora. Verifique sua conexão e tente novamente.') } }
  if (setor.isLoading) return <><Marca /><main className="mx-auto max-w-3xl p-6"><div className="h-64 animate-pulse rounded-3xl bg-slate-200" /></main></>
  if (setor.isError) return <><Marca /><main className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-bold">Setor não encontrado</h1><p className="mt-3 text-slate-600">Confira o QR Code ou peça orientação à equipe.</p></main></>
  return <><Marca /><main className="mx-auto max-w-xl p-5 sm:pt-14"><section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100"><p className="text-hospital-600">Você está em</p><h1 className="mt-2 text-3xl font-bold text-slate-800">{setor.data?.nome}</h1><p className="mt-6 text-lg leading-relaxed text-slate-600">Sua opinião nos ajuda a cuidar melhor de você. A avaliação é anônima e leva poucos minutos.</p><label className="mt-7 flex cursor-pointer gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><input className="mt-1 size-5 accent-teal-700" type="checkbox" checked={termo} onChange={e => setTermo(e.target.checked)} /><span><strong>Termo de uso de imagem</strong><br />Li e concordo com o termo. Sua participação não depende desta concordância.</span></label>{erro && <p role="alert" className="mt-4 text-red-700">{erro}</p>}<button onClick={iniciar} className="mt-7 min-h-12 w-full rounded-xl bg-hospital-600 px-6 py-3 text-lg font-bold text-white hover:bg-hospital-800">Começar avaliação</button></section></main></>
}
