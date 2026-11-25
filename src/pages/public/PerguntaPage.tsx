import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '../../lib/api'
import { lerSessao, salvarSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'
import type { ErroApi } from '../../types'

const fallbackRostinho = [{ valor: 1, rotulo: 'Muito ruim', emoji: '😡' }, { valor: 2, rotulo: 'Ruim', emoji: '🙁' }, { valor: 3, rotulo: 'Neutro', emoji: '😐' }, { valor: 4, rotulo: 'Bom', emoji: '🙂' }, { valor: 5, rotulo: 'Muito bom', emoji: '😍' }]
const fallbackNps = Array.from({ length: 11 }, (_, valor) => ({ valor, rotulo: String(valor) }))

export function PerguntaPage() {
  const { slug = '', n = '1' } = useParams()
  const numero = Number(n)
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sair, setSair] = useState(false)
  const [texto, setTexto] = useState(() => lerSessao()?.respostas?.[numero]?.texto ?? '')
  const [respostaPendente, setRespostaPendente] = useState<{ valor?: number; opcao_id?: number; texto?: string } | null>(null)
  const fluxo = useQuery({ queryKey: ['fluxo', slug], queryFn: () => api.setores.fluxo(slug) })

  useEffect(() => {
    setTexto(lerSessao()?.respostas?.[numero]?.texto ?? '')
  }, [numero])

  const pergunta = fluxo.data?.fluxo.find(item => item.numero === numero)

  async function responder(resposta: { valor?: number; opcao_id?: number; texto?: string }) {
    const sessao = lerSessao()
    if (!pergunta || !sessao) {
      navigate(`/${slug}`)
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await api.pesquisas.responder(sessao.pesquisa_id, pergunta.id, { pergunta_id: pergunta.id, ...resposta })
      const respostas = { ...sessao.respostas, [numero]: resposta }
      const atualizado = { ...sessao, respostas, ...(pergunta.tipo === 'nps' && resposta.valor !== undefined ? { nps_nota: resposta.valor } : {}) }
      salvarSessao(atualizado)
      setRespostaPendente(null)
      const proxima = fluxo.data!.fluxo.find(item => item.numero > numero)
      if (proxima) {
        navigate(`/pesquisa/${slug}/pergunta/${proxima.numero}`)
        return
      }
      const finalizacao = await api.pesquisas.finalizar(sessao.pesquisa_id)
      salvarSessao({ ...atualizado, finalizacao })
      navigate(`/pesquisa/${slug}/final`)
    } catch (error) {
      setRespostaPendente(resposta)
      setErro(isAxiosError<ErroApi>(error) && error.response?.status === 429
        ? 'Muitas pessoas estão respondendo agora. Aguarde um instante e tente de novo.'
        : 'Não foi possível enviar. Verifique a internet e toque em Tentar novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function pular() {
    const proxima = fluxo.data?.fluxo.find(item => item.numero > numero)
    if (proxima) {
      navigate(`/pesquisa/${slug}/pergunta/${proxima.numero}`)
      return
    }
    const sessao = lerSessao()
    if (!sessao) { navigate(`/${slug}`); return }
    setEnviando(true)
    setErro('')
    try {
      const finalizacao = await api.pesquisas.finalizar(sessao.pesquisa_id)
      salvarSessao({ ...sessao, finalizacao })
      navigate(`/pesquisa/${slug}/final`)
    } catch (error) {
      setErro(isAxiosError<ErroApi>(error) && error.response?.status === 429
        ? 'Muitas pessoas estão respondendo agora. Aguarde um instante e tente de novo.'
        : 'Não foi possível enviar. Verifique a internet e toque em Tentar novamente.')
    } finally { setEnviando(false) }
  }

  if (fluxo.isLoading) return <><Marca /><main className="public-shell max-w-3xl"><div className="h-80 animate-pulse rounded-[2rem] bg-white shadow-card motion-reduce:animate-none" aria-label="Carregando pergunta" /></main></>
  if (!pergunta) return <><Marca /><main className="public-shell max-w-3xl"><div role="alert" className="rounded-3xl border border-red-200 bg-white p-8 text-center text-red-800 shadow-card">⚠ Não foi possível carregar esta pergunta.</div></main></>

  const opcoes: Array<{ id: number; pergunta_id: number; valor: number; rotulo: string; emoji?: string }> = pergunta.opcoes.length
    ? pergunta.opcoes
    : (pergunta.tipo === 'rostinho' ? fallbackRostinho : pergunta.tipo === 'nps' ? fallbackNps : []).map((opcao, index) => ({ ...opcao, id: index + 1, pergunta_id: pergunta.id }))
  const totalPerguntas = fluxo.data?.fluxo.length ?? 1
  const progresso = Math.round((numero / totalPerguntas) * 100)
  const nomeSetor = fluxo.data?.setor.nome ?? 'Avaliação'

  return <><Marca /><main className="public-shell max-w-3xl sm:pt-8">
    <header className="relative isolate overflow-hidden rounded-[2rem] bg-brand-700 px-5 py-5 text-white shadow-card sm:px-7 sm:py-6">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-300">Pesquisa de satisfação</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{nomeSetor}</h2><p className="mt-1 text-sm font-medium text-white/75">Sua opinião ajuda a aprimorar o cuidado.</p></div>
        <span className="inline-flex min-h-12 min-w-16 shrink-0 items-center justify-center gap-1 rounded-2xl border border-white/20 bg-white/10 px-3 text-sm font-extrabold backdrop-blur"><span>{numero}</span><span className="text-white/60">/</span><span>{totalPerguntas}</span></span>
      </div>
      <div className="relative z-10 mt-5">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-white/90"><span>Pergunta {numero} de {totalPerguntas}</span><span>{progresso}% concluído</span></div>
        <div role="progressbar" aria-label="Progresso da avaliação" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progresso} className="h-2.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-accent-400 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progresso}%` }} /></div>
      </div>
    </header>

    <section className="relative mt-5 overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-card sm:p-8">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1.5"><span className="w-3/5 bg-brand-600" /><span className="w-1/4 bg-accent-400" /><span className="flex-1 bg-support-600" /></div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><span className={`badge ${pergunta.geral ? 'bg-support-50 text-support-800' : 'bg-brand-50 text-brand-800'}`}>{pergunta.geral ? 'Pergunta geral' : `Pergunta ${numero}`}</span><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{pergunta.tipo === 'nps' ? 'Recomendação' : pergunta.tipo === 'texto' ? 'Resposta aberta' : pergunta.tipo === 'multipla' ? 'Múltipla escolha' : 'Avaliação'}</span></div>
      <h1 className="mt-5 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">{pergunta.texto}</h1>
      {erro && <div className="mt-5"><p role="alert" className="alert-error">⚠ {erro}</p>{respostaPendente && <button onClick={() => void responder(respostaPendente)} className="btn-primary mt-3 w-full">Tentar novamente</button>}{!respostaPendente && <button onClick={() => void pular()} className="btn-primary mt-3 w-full">Tentar novamente</button>}</div>}

      {pergunta.tipo === 'texto' ? <form className="mt-7" onSubmit={e => { e.preventDefault(); if (texto.trim()) void responder({ texto: texto.trim() }) }}>
        <label className="block text-base font-semibold text-ink" htmlFor="resposta-texto">Sua resposta</label>
        <textarea id="resposta-texto" required value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escreva sua resposta aqui…" className="field min-h-40 resize-y py-3 text-base" />
        <button disabled={enviando || !texto.trim()} className="btn-primary mt-4 w-full">{enviando ? 'Enviando…' : 'Continuar'}</button>
      </form> : pergunta.tipo === 'nps' ? <>
        <div className="mt-7 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-11">{opcoes.map(opcao => {
          const escala = opcao.valor <= 6 ? 'bg-brand-700 text-white hover:bg-brand-800' : opcao.valor <= 8 ? 'bg-support-600 text-white hover:bg-support-800' : 'bg-accent-400 text-ink hover:bg-accent-500'
          return <button disabled={enviando} key={opcao.id} aria-label={`Nota ${opcao.valor}`} onClick={() => void responder({ valor: opcao.valor, opcao_id: opcao.id })} className={`min-h-12 min-w-0 rounded-xl font-extrabold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:translate-y-0 disabled:opacity-50 ${escala}`}>{opcao.valor}</button>
        })}</div>
        <div className="mt-3 flex justify-between gap-3 text-sm font-semibold text-slate-700"><span>Nada provável</span><span className="text-right">Muito provável</span></div>
      </> : pergunta.tipo === 'multipla' ? <div className="mt-7 grid gap-3 text-left">{opcoes.map(opcao => <button disabled={enviando} key={opcao.id} aria-label={opcao.rotulo} onClick={() => void responder({ valor: opcao.valor, opcao_id: opcao.id })} className="group flex min-h-16 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left font-semibold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-soft disabled:opacity-50"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-300 text-xl">{opcao.emoji ?? '›'}</span><span className="flex-1">{opcao.rotulo}</span><span aria-hidden="true" className="text-xl text-support-600 transition-transform group-hover:translate-x-1">→</span></button>)}</div> : <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">{opcoes.map(opcao => <button disabled={enviando} key={opcao.id} aria-label={opcao.rotulo} onClick={() => void responder({ valor: opcao.valor, opcao_id: opcao.id })} className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50 hover:shadow-soft active:scale-[.98] disabled:translate-y-0 disabled:opacity-50"><span className="block text-5xl transition-transform group-hover:scale-110" aria-hidden="true">{opcao.emoji}</span><span className="mt-2 text-center text-base font-semibold text-ink">{opcao.rotulo}</span></button>)}</div>}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-warm-100 pt-4">
        {numero > 1 ? <button disabled={enviando} onClick={() => { const anteriores = fluxo.data!.fluxo.filter(item => item.numero < numero); navigate(`/pesquisa/${slug}/pergunta/${anteriores[anteriores.length - 1]?.numero ?? numero - 1}`) }} className="btn-secondary min-h-12">← Voltar</button> : <span className="text-base font-medium text-slate-600">Sua avaliação é anônima</span>}
        {!pergunta.obrigatoria && pergunta.tipo !== 'nps' && <button disabled={enviando} onClick={() => void pular()} className="btn-secondary min-h-12">Pular esta pergunta</button>}
        <button onClick={() => setSair(true)} className="min-h-12 rounded-xl px-3 text-base font-semibold text-slate-600 underline underline-offset-4 hover:text-brand-800">Sair da avaliação</button>
      </div>
    </section>
  </main>
  {sair && <div role="dialog" aria-modal="true" className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-ink/60 p-4"><div className="w-full max-w-md rounded-3xl border border-white bg-white p-6 shadow-card"><div className="mb-5 h-1.5 w-20 overflow-hidden rounded-full bg-gradient-to-r from-brand-600 via-accent-400 to-support-600" /><h2 className="text-xl font-bold text-ink">Deseja sair?</h2><p className="mt-3 leading-relaxed text-slate-700">Tem certeza que deseja sair? Sua avaliação ainda não foi concluída.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row"><button onClick={() => setSair(false)} className="btn-secondary flex-1">Continuar avaliando</button><button onClick={() => navigate(`/${slug}`)} className="btn-primary flex-1 bg-ink hover:bg-slate-800">Sair</button></div></div></div>}
  </>
}
