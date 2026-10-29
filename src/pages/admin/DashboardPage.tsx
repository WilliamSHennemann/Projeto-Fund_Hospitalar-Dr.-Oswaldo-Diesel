import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
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

export function DashboardPage() {
  const [periodo, setPeriodo] = useState('30'); const [setorId, setSetorId] = useState<number | undefined>(); const [setorSelecionado, setSetorSelecionado] = useState<number | null>(null)
  const filtros = useMemo(() => ({ ...datasDoPeriodo(periodo), ...(setorId ? { setor_id: setorId } : {}) }), [periodo, setorId])
  const resumo = useQuery({ queryKey: ['resumo', filtros], queryFn: () => api.dashboard.resumo(filtros) })
  const setores = useQuery({ queryKey: ['dashboard-setores', filtros], queryFn: () => api.dashboard.setores(filtros) })
  const andamento = useQuery<PesquisaAndamento[]>({ queryKey: ['andamento', filtros], queryFn: () => api.dashboard.emAndamento(filtros) })
  const turnos = useQuery({ queryKey: ['turnos', setorSelecionado, filtros], queryFn: () => api.dashboard.turnos(setorSelecionado!, filtros), enabled: setorSelecionado !== null })
  const usuario = auth.getUser(); const cards = resumo.data && [['NPS geral', resumo.data.nps_geral], ['Média geral', resumo.data.media_geral ?? '—'], ['Pesquisas', resumo.data.total_pesquisas], ['Parciais', `${Number(resumo.data.percentual_parciais).toFixed(1)}%`]]
  return <><Marca /><main className="mx-auto max-w-6xl p-5"><div><h1 className="text-3xl font-bold">Painel SGEP</h1><p className="text-slate-600">Olá, {usuario?.nome}.</p></div><NavegacaoAdmin /><div className="mt-6 flex flex-wrap gap-3"><label className="font-semibold">Período<select aria-label="Período" value={periodo} onChange={e => setPeriodo(e.target.value)} className="ml-2 min-h-11 rounded-lg border border-slate-300 px-3"><option value="30">Últimos 30 dias</option><option value="7">Últimos 7 dias</option><option value="mes">Este mês</option></select></label><label className="font-semibold">Setor<select value={setorId ?? ''} onChange={e => setSetorId(e.target.value ? Number(e.target.value) : undefined)} className="ml-2 min-h-11 rounded-lg border border-slate-300 px-3"><option value="">Todos</option>{setores.data?.map(setor => <option key={setor.setor_id} value={setor.setor_id}>{setor.nome}</option>)}</select></label></div>{resumo.isError && <p role="alert" className="mt-4 text-red-700">Não foi possível carregar os indicadores.</p>}<section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards?.map(([titulo, valor]) => <article key={titulo} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-sm text-slate-500">{titulo}</p><p className="mt-2 text-3xl font-bold text-hospital-800">{valor}</p></article>)}</section><section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-bold">Indicadores por setor</h2><div className="mt-4 space-y-4">{setores.data?.map(setor => <button key={setor.setor_id} onClick={() => setSetorSelecionado(setor.setor_id)} className="block w-full text-left"><div className="flex justify-between gap-3"><span>{setor.nome}</span><strong>NPS {setor.nps} · média {setor.media ?? '—'}</strong></div><div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-hospital-600" style={{ width: `${Math.max(0, setor.nps)}%` }} /></div></button>)}</div>{setorSelecionado && <div className="mt-6 border-t pt-5"><h3 className="font-bold">Indicadores por turno</h3>{turnos.isLoading ? <p className="mt-2 text-slate-600">Carregando…</p> : <div className="mt-3 grid gap-3 sm:grid-cols-3">{turnos.data?.map(turno => <article key={turno.turno} className="rounded-xl bg-hospital-50 p-4"><p className="capitalize">{turno.turno}</p><strong className="mt-2 block">NPS {turno.nps} · média {turno.media ?? '—'}</strong><span className="text-sm text-slate-600">{turno.total} avaliações</span></article>)}</div>}</div>}</section><section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-bold">Avaliações em andamento</h2>{andamento.data?.length ? <ul className="mt-3 divide-y">{andamento.data.map(item => <li key={item.id} className="py-3">Pesquisa #{item.id} · setor {item.setor_id} · última atividade {new Date(item.ultima_atividade).toLocaleString('pt-BR')}</li>)}</ul> : <p className="mt-3 text-slate-600">Nenhuma avaliação em andamento.</p>}</section></main></>
}
