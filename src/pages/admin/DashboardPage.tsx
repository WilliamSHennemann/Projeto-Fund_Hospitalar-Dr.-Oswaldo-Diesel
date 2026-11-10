import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import { pode } from '../../lib/permissions'
import { baixarArquivo } from '../../lib/download'
import { Marca } from '../../components/Marca'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'
import type { DashboardFiltro, PesquisaAndamento } from '../../types'

function datasDoPeriodo(periodo: string): DashboardFiltro {
  const fim = new Date(); const inicio = new Date()
  if (periodo === '7') inicio.setDate(fim.getDate() - 6)
  else if (periodo === '30') inicio.setDate(fim.getDate() - 29)
  else inicio.setDate(1)
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) }
}

function dataLocalIso() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

async function mensagemDaFalhaDeExportacao(erro: unknown): Promise<string> {
  if (axios.isAxiosError(erro)) {
    const dados: unknown = erro.response?.data
    if (dados instanceof Blob) {
      try {
        const json = JSON.parse(await dados.text()) as { erro?: unknown }
        if (typeof json.erro === 'string' && json.erro.trim()) return json.erro
      } catch { /* Respostas não JSON usam a mensagem padrão abaixo. */ }
    } else if (dados && typeof dados === 'object' && 'erro' in dados && typeof dados.erro === 'string') {
      return dados.erro
    }
  }
  return 'Não foi possível exportar. Tente novamente.'
}

export function DashboardPage() {
  const navigate = useNavigate(); const [periodo, setPeriodo] = useState('30'); const [setorId, setSetorId] = useState<number | undefined>(); const [setorSelecionado, setSetorSelecionado] = useState<number | null>(null); const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null); const [erroExportacao, setErroExportacao] = useState('')
  const filtros = useMemo(() => ({ ...datasDoPeriodo(periodo), ...(setorId ? { setor_id: setorId } : {}) }), [periodo, setorId])
  const resumo = useQuery({ queryKey: ['resumo', filtros], queryFn: () => api.dashboard.resumo(filtros) })
  const setores = useQuery({ queryKey: ['dashboard-setores', filtros], queryFn: () => api.dashboard.setores(filtros) })
  const andamento = useQuery<PesquisaAndamento[]>({ queryKey: ['andamento', filtros], queryFn: () => api.dashboard.emAndamento(filtros) })
  const turnos = useQuery({ queryKey: ['turnos', setorSelecionado, filtros], queryFn: () => api.dashboard.turnos(setorSelecionado!, filtros), enabled: setorSelecionado !== null })
  const usuario = auth.getUser(); const cards = resumo.data && [['NPS geral', resumo.data.nps_geral], ['Média geral', resumo.data.media_geral ?? '—'], ['Pesquisas', resumo.data.total_pesquisas], ['Parciais', `${Number(resumo.data.percentual_parciais).toFixed(1)}%`]]
  async function exportar(formato: 'excel' | 'pdf') {
    setExportando(formato); setErroExportacao('')
    try {
      const arquivo = await api.exportacoes[formato](filtros)
      baixarArquivo(arquivo, `resultados-setores-${dataLocalIso()}.${formato === 'excel' ? 'xlsx' : 'pdf'}`)
    } catch (erro) {
      if (axios.isAxiosError(erro) && erro.response?.status === 401) { navigate('/admin/login', { replace: true }); return }
      setErroExportacao(await mensagemDaFalhaDeExportacao(erro))
    } finally { setExportando(null) }
  }
  const podeExportar = pode(usuario, 'exportacoes')
  return <><Marca /><main className="page-shell"><div><p className="text-sm font-bold uppercase tracking-wider text-brand-700">Visão geral</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Painel SGEP</h1><p className="mt-1 text-slate-700">Olá, {usuario?.nome}.</p></div><NavegacaoAdmin /><section className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-warm-100 bg-white p-4 shadow-sm"><label className="block font-semibold">Período<select aria-label="Período" value={periodo} onChange={e => setPeriodo(e.target.value)} className="field mt-1 min-h-11"><option value="30">Últimos 30 dias</option><option value="7">Últimos 7 dias</option><option value="mes">Este mês</option></select></label><label className="block font-semibold">Setor<select aria-label="Setor" value={setorId ?? ''} onChange={e => setSetorId(e.target.value ? Number(e.target.value) : undefined)} className="field mt-1 min-h-11"><option value="">Todos</option>{setores.data?.map(setor => <option key={setor.setor_id} value={setor.setor_id}>{setor.nome}</option>)}</select></label>{podeExportar && <div role="group" aria-label="Exportar" className="flex flex-wrap items-center gap-2"><span className="mr-1 text-sm font-semibold text-slate-700">Exportar</span><button type="button" disabled={exportando !== null} aria-busy={exportando === 'excel'} onClick={() => void exportar('excel')} className="btn-secondary min-h-11">{exportando === 'excel' ? 'Gerando…' : 'Exportar Excel'}</button><button type="button" disabled={exportando !== null} aria-busy={exportando === 'pdf'} onClick={() => void exportar('pdf')} className="btn-secondary min-h-11">{exportando === 'pdf' ? 'Gerando…' : 'Exportar PDF'}</button></div>}</section>{erroExportacao && <p role="alert" className="alert-error mt-4">⚠ {erroExportacao}</p>}{resumo.isError && <p role="alert" className="alert-error mt-4">⚠ Não foi possível carregar os indicadores.</p>}<section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards?.map(([titulo, valor], indice) => <article key={titulo} className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card"><p className="text-sm font-semibold text-slate-700">{titulo}</p><p className={`mt-3 text-3xl font-bold tracking-tight ${indice === 0 ? 'text-emerald-800' : 'text-ink'}`}>{valor}</p></article>)}</section><section className="mt-6 rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm font-bold uppercase tracking-wider text-brand-700">Desempenho</p><h2 className="mt-1 text-xl font-bold text-ink">Indicadores por setor</h2></div><p className="text-xs text-slate-700">NPS: <span className="font-semibold text-rose-900">0–39 precisa de atenção</span> · <span className="font-semibold text-amber-800">40–69 estável</span> · <span className="font-semibold text-emerald-800">70+ positivo</span></p></div><div className="mt-5 space-y-2">{setores.isLoading && <div className="h-20 animate-pulse rounded-xl bg-warm-50 motion-reduce:animate-none" />}{setores.data?.map(setor => { const status = setor.nps >= 70 ? 'Positivo' : setor.nps >= 40 ? 'Estável' : 'Precisa de atenção'; const cor = setor.nps >= 70 ? 'bg-emerald-700' : setor.nps >= 40 ? 'bg-amber-500' : 'bg-rose-900'; return <button key={setor.setor_id} onClick={() => setSetorSelecionado(setor.setor_id)} className="block w-full rounded-xl p-3 text-left hover:bg-warm-50"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-ink">{setor.nome}</span><strong className="text-sm text-ink">NPS {setor.nps} · média {setor.media ?? '—'} <span className="ml-1 text-slate-700">· {status}</span></strong></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-warm-100"><div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max(0, setor.nps)}%` }} /></div></button> })}{!setores.isLoading && !setores.data?.length && <p className="rounded-xl bg-warm-50 p-4 text-slate-700">Nenhum indicador disponível para este período.</p>}</div>{setorSelecionado && <div className="mt-5 border-t border-warm-100 pt-5"><h3 className="font-bold text-ink">Indicadores por turno</h3>{turnos.isLoading ? <p className="mt-2 text-slate-700">Carregando…</p> : <div className="mt-3 grid gap-3 sm:grid-cols-3">{turnos.data?.map(turno => <article key={turno.turno} className="rounded-xl border border-brand-100 bg-brand-50 p-4"><p className="font-semibold capitalize text-brand-800">{turno.turno}</p><strong className="mt-2 block text-lg text-ink">NPS {turno.nps} · média {turno.media ?? '—'}</strong><span className="text-sm text-slate-700">{turno.total} avaliações</span></article>)}</div>}</div>}</section><section className="mt-6 rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6"><h2 className="text-xl font-bold text-ink">Avaliações em andamento</h2>{andamento.data?.length ? <ul className="mt-3 divide-y divide-warm-100">{andamento.data.map(item => <li key={item.id} className="py-3 text-slate-700">Pesquisa #{item.id} · setor {item.setor_id} · última atividade {new Date(item.ultima_atividade).toLocaleString('pt-BR')}</li>)}</ul> : <p className="mt-3 rounded-xl bg-warm-50 p-4 text-slate-700">Nenhuma avaliação em andamento.</p>}</section></main></>
}
