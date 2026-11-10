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
  if (setor.isLoading) return <><Marca /><main className="public-shell"><div className="h-72 animate-pulse rounded-3xl bg-white shadow-card motion-reduce:animate-none" aria-label="Carregando" /></main></>
  if (setor.isError) return <><Marca /><main className="public-shell"><section className="card py-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-2xl text-brand-700" aria-hidden="true">ⓘ</div><h1 className="mt-5 text-2xl font-bold">Setor não encontrado</h1><p className="mt-3 text-base leading-relaxed text-slate-700">Confira o QR Code ou peça orientação à equipe.</p></section></main></>
  return <><Marca /><main className="public-shell sm:pt-14"><section className="overflow-hidden rounded-3xl border border-white bg-white p-5 shadow-card sm:p-8"><div className="mb-6 h-1.5 w-16 rounded-full bg-brand-600" /><p className="font-semibold text-brand-700">Você está em</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{setor.data?.nome}</h1><p className="mt-5 text-base leading-relaxed text-slate-700 sm:text-lg">Sua opinião nos ajuda a cuidar melhor de você. A avaliação é anônima e leva poucos minutos.</p><div className="mt-5 flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm leading-relaxed text-brand-800"><span aria-hidden="true" className="text-lg">✓</span><p><strong>Sua participação é anônima.</strong> A data serve apenas para relacionar sua avaliação ao atendimento.</p></div><label className="mt-6 block font-semibold">Em que dia você foi atendido(a)?<input required type="date" max={new Date().toISOString().slice(0, 10)} value={dataAtendimento} onChange={e => setDataAtendimento(e.target.value)} className="field" /></label>{erro && <p role="alert" className="alert-error mt-4">⚠ {erro}</p>}<button onClick={iniciar} className="btn-primary mt-7 w-full text-lg">Começar avaliação</button></section></main></>
}
