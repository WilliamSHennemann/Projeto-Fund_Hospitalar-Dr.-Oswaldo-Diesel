import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { lerSessao, limparSessao, salvarSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'
import { BarraPublica } from '../../components/BarraPublica'

export function BoasVindasPage() {
  const { slug = '' } = useParams(); const navigate = useNavigate(); const [erro, setErro] = useState(''); const hoje = new Date().toLocaleDateString('sv-SE'); const [dataAtendimento, setDataAtendimento] = useState(hoje); const [outroDia, setOutroDia] = useState(false); const [iniciando, setIniciando] = useState(false)
  const [searchParams] = useSearchParams()
  const previa = searchParams.get('previa') === '1'
  const [retomavel, setRetomavel] = useState(false)
  useEffect(() => {
    if (previa) { setRetomavel(false); return }
    const sessao = lerSessao()
    if (!sessao) return
    const setorDaSessao = typeof sessao.setor === 'object' ? sessao.setor : null
    if (setorDaSessao?.slug !== slug) return
    void api.pesquisas.progresso(sessao.pesquisa_id).then(progresso => {
      if (progresso.status === 'concluida') limparSessao()
      else {
        setRetomavel(true)
      }
    }).catch(() => {})
  }, [slug, previa])
  function comPrevia(rota: string) { return previa ? `${rota}?previa=1` : rota }
  const setor = useQuery({ queryKey: ['setor', slug], queryFn: () => api.setores.obter(slug) })
  async function iniciar() { if (!setor.data) return; setIniciando(true); setErro(''); if (previa) { navigate(comPrevia(`/pesquisa/${slug}/pergunta/1`)); setIniciando(false); return } try { const pesquisa = await api.pesquisas.criar({ setor_id: setor.data.id, anonimo: true, consentimento: false, data_atendimento: outroDia && dataAtendimento ? dataAtendimento : hoje }); salvarSessao(pesquisa); navigate(comPrevia(`/pesquisa/${slug}/pergunta/1`)) } catch (error) { const status = typeof error === 'object' && error !== null && 'response' in error ? (error as { response?: { status?: number } }).response?.status : undefined; setErro(status === 429 ? 'Muitas pessoas estão respondendo agora. Aguarde um instante e tente de novo.' : 'Não foi possível iniciar agora. Verifique sua conexão e tente novamente.') } finally { setIniciando(false) } }
  async function retomar() { const sessao = lerSessao(); if (!sessao) return; try { const progresso = await api.pesquisas.progresso(sessao.pesquisa_id); if (progresso.status === 'concluida') { limparSessao(); setRetomavel(false); return } let primeira = 1; const fluxo = await api.setores.fluxo(slug); const naoRespondidas = fluxo.fluxo.filter(pergunta => !progresso.respondidas.includes(pergunta.id)); primeira = naoRespondidas[0]?.numero ?? 1; navigate(comPrevia(`/pesquisa/${slug}/pergunta/${primeira}`)) } catch { setErro('Não foi possível retomar agora. Tente continuar a avaliação novamente.') } }
  function novoInicio() { limparSessao(); setRetomavel(false); void iniciar() }
  if (setor.isLoading) return <><BarraPublica previa={previa} /><Marca /><main className="public-shell"><div className="h-72 animate-pulse rounded-3xl bg-white shadow-card motion-reduce:animate-none" aria-label="Carregando" /></main></>
  if (setor.isError) return <><Marca /><main className="public-shell"><section className="card py-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-2xl text-brand-700" aria-hidden="true">ⓘ</div><h1 className="mt-5 text-2xl font-bold">Página não encontrada</h1><p className="mt-3 text-base leading-relaxed text-slate-700">Confira o QR Code ou volte ao início para escolher um setor.</p><button onClick={() => navigate('/')} className="btn-primary mt-6 w-full">Voltar ao início</button></section></main></>
  return <><BarraPublica previa={previa} /><Marca /><main className="public-shell sm:pt-14"><section className="overflow-hidden rounded-3xl border border-white bg-white p-5 shadow-card sm:p-8"><div className="mb-6 h-1.5 w-16 rounded-full bg-brand-600" /><p className="font-semibold text-brand-700">Você está em</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{setor.data?.nome}</h1><p className="mt-5 text-base leading-relaxed text-slate-700 sm:text-lg">Sua opinião nos ajuda a cuidar melhor de você. A avaliação é anônima e leva poucos minutos.</p>{retomavel && <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4"><p className="font-bold text-brand-900">Você já começou esta avaliação.</p><button onClick={() => void retomar()} className="btn-primary mt-3 w-full">Continuar de onde parei</button><button onClick={novoInicio} className="btn-secondary mt-3 w-full">Começar de novo</button></div>}<div className="mt-5 flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-base leading-relaxed text-brand-800"><span aria-hidden="true" className="text-lg">✓</span><p><strong>Sua participação é anônima.</strong> A data serve apenas para relacionar sua avaliação ao atendimento.</p></div><label className="mt-6 flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 p-4 text-base font-semibold"><input type="checkbox" checked={outroDia} onChange={e => setOutroDia(e.target.checked)} className="size-6 accent-brand-600" />O atendimento foi em outro dia?</label>{outroDia && <label className="mt-4 block text-base font-semibold">Data do atendimento<input type="date" max={hoje} value={dataAtendimento} onChange={e => setDataAtendimento(e.target.value)} className="field mt-2" /></label>}{erro && <p role="alert" className="alert-error mt-4">⚠ {erro}</p>}<button disabled={iniciando} onClick={() => void iniciar()} className="btn-primary mt-7 w-full text-lg">{iniciando ? 'Iniciando…' : 'Começar avaliação'}</button></section></main></>
}
