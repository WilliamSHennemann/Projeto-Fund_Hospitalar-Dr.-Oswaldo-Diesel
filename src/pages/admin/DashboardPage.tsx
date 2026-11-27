import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import { isGestao, pode } from '../../lib/permissions'
import { baixarArquivo } from '../../lib/download'
import { Marca } from '../../components/Marca'
import { AlterarSenha } from '../../components/AlterarSenha'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'
import type { DashboardFiltro, PesquisaAndamento } from '../../types'

function datasDoPeriodo(periodo: string): DashboardFiltro {
  const fim = new Date()
  const inicio = new Date()
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
  const navigate = useNavigate()
  const usuario = auth.getUser()
  const gestao = isGestao(usuario)
  const setorGestaoId = usuario && gestao && usuario.setor_id !== undefined && Number.isInteger(usuario.setor_id) && usuario.setor_id > 0 ? usuario.setor_id : undefined
  const escopoDisponivel = !gestao || setorGestaoId !== undefined
  const [periodo, setPeriodo] = useState('30')
  const [setorId, setSetorId] = useState<number | undefined>()
  const [setorSelecionado, setSetorSelecionado] = useState<number | null>(null)
  const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null)
  const [erroExportacao, setErroExportacao] = useState('')
  const filtros = useMemo(() => ({
    ...datasDoPeriodo(periodo),
    ...(gestao ? (setorGestaoId ? { setor_id: setorGestaoId } : {}) : setorId ? { setor_id: setorId } : {}),
  }), [periodo, setorId, gestao, setorGestaoId])
  const setores = useQuery({ queryKey: ['dashboard-setores', filtros], queryFn: () => api.dashboard.setores(filtros), enabled: escopoDisponivel })
  const andamento = useQuery<PesquisaAndamento[]>({ queryKey: ['andamento', filtros], queryFn: () => api.dashboard.emAndamento(filtros), enabled: escopoDisponivel })
  const turnos = useQuery({ queryKey: ['turnos', setorSelecionado, filtros], queryFn: () => api.dashboard.turnos(setorSelecionado!, filtros), enabled: setorSelecionado !== null && escopoDisponivel })
  const errosDashboard = [setores.error, andamento.error, turnos.error].filter(Boolean)
  const erroDashboard = errosDashboard.find(erro => axios.isAxiosError(erro) && erro.response?.status === 403) ?? errosDashboard[0]
  const setoresVisiveis = gestao ? setores.data?.filter(setor => setor.setor_id === setorGestaoId) : setores.data
  const setorVinculado = setoresVisiveis?.[0]?.nome
  useEffect(() => {
    if (errosDashboard.some(erro => axios.isAxiosError(erro) && erro.response?.status === 401)) {
      navigate('/admin/login', { replace: true, state: { mensagem: 'Sua sessão expirou. Entre novamente para continuar.' } })
    }
  }, [setores.error, andamento.error, turnos.error, navigate])

  async function exportar(formato: 'excel' | 'pdf') {
    setExportando(formato)
    setErroExportacao('')
    try {
      const arquivo = await api.exportacoes[formato](filtros)
      baixarArquivo(arquivo, `resultados-setores-${dataLocalIso()}.${formato === 'excel' ? 'xlsx' : 'pdf'}`)
    } catch (erro) {
      if (axios.isAxiosError(erro) && erro.response?.status === 401) {
        navigate('/admin/login', { replace: true, state: { mensagem: 'Sua sessão expirou. Entre novamente para continuar.' } })
        return
      }
      setErroExportacao(axios.isAxiosError(erro) && erro.response?.status === 403 ? 'Sua conta não tem permissão para exportar estes dados.' : await mensagemDaFalhaDeExportacao(erro))
    } finally {
      setExportando(null)
    }
  }

  const podeExportar = pode(usuario, 'exportacoes')
  const escopoAtual = gestao ? setorVinculado ?? 'Setor vinculado' : setorId ? setores.data?.find(setor => setor.setor_id === setorId)?.nome ?? 'Setor selecionado' : 'Todos os setores'

  return <><Marca /><main className="page-shell">
    <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 px-6 py-7 text-white shadow-card sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/3 overflow-hidden lg:block"><span className="absolute -right-20 -top-28 size-64 rounded-full bg-accent-400/70" /><span className="absolute -bottom-36 right-12 size-60 rounded-full bg-support-600/60" /></div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"><span className="size-2 rounded-full bg-accent-400" />Painel de indicadores</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Painel SGEP</h1>
          <p className="mt-2 text-lg font-semibold text-white/90">Olá, {usuario?.nome}.</p>
          <p className="mt-2 max-w-xl leading-relaxed text-white/80">Acompanhe a experiência dos pacientes e os resultados das avaliações em um só lugar.</p>
        </div>
        <div className="flex flex-col gap-3"><div className="min-w-52 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"><p className="text-xs font-bold uppercase tracking-wider text-white/70">Escopo atual</p><p className="mt-1 text-lg font-bold">{escopoAtual}</p></div><AlterarSenha /></div>
      </div>
    </header>
    <NavegacaoAdmin />

    <section aria-label="Filtros e exportação" className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Personalize sua visão</p><h2 className="mt-1 text-xl font-bold text-ink">Filtros e exportação</h2></div>
        <span className="rounded-full bg-accent-300 px-3 py-1.5 text-sm font-bold text-ink">{periodo === '7' ? 'Últimos 7 dias' : periodo === 'mes' ? 'Este mês' : 'Últimos 30 dias'}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-warm-100 pt-4">
        <label className="block min-w-48 font-semibold">Período<select aria-label="Período" value={periodo} onChange={e => setPeriodo(e.target.value)} className="field mt-1 min-h-11"><option value="30">Últimos 30 dias</option><option value="7">Últimos 7 dias</option><option value="mes">Este mês</option></select></label>
        {!gestao && <label className="block min-w-48 font-semibold">Setor<select aria-label="Setor" value={setorId ?? ''} onChange={e => setSetorId(e.target.value ? Number(e.target.value) : undefined)} className="field mt-1 min-h-11"><option value="">Todos</option>{setores.data?.map(setor => <option key={setor.setor_id} value={setor.setor_id}>{setor.nome}</option>)}</select></label>}
        {podeExportar && <div role="group" aria-label="Exportar" className="flex flex-wrap items-center gap-2"><span className="mr-1 text-sm font-semibold text-slate-700">Exportar</span><button type="button" disabled={exportando !== null || !escopoDisponivel} aria-busy={exportando === 'excel'} onClick={() => void exportar('excel')} className="btn-secondary min-h-11">{exportando === 'excel' ? 'Gerando…' : 'Exportar Excel'}</button><button type="button" disabled={exportando !== null || !escopoDisponivel} aria-busy={exportando === 'pdf'} onClick={() => void exportar('pdf')} className="btn-secondary min-h-11">{exportando === 'pdf' ? 'Gerando…' : 'Exportar PDF'}</button></div>}
      </div>
    </section>

    {gestao && !escopoDisponivel && <p role="alert" className="alert-error mt-4">⚠ Seu usuário não está vinculado a um setor. Solicite a correção do vínculo ao super administrador.</p>}
    {erroExportacao && <p role="alert" className="alert-error mt-4">⚠ {erroExportacao}</p>}
    {erroDashboard && <p role="alert" className="alert-error mt-4">⚠ {axios.isAxiosError(erroDashboard) && erroDashboard.response?.status === 403 ? 'Sua conta não tem permissão para visualizar estes indicadores.' : 'Não foi possível carregar os indicadores.'}</p>}

    <div className="mt-7 grid items-start gap-5 xl:grid-cols-[1.55fr_.85fr]">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Desempenho</p><h2 className="mt-1 text-xl font-bold text-ink">Indicadores por setor</h2></div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-900">0–39 atenção</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">40–69 estável</span><span className="rounded-full bg-accent-300 px-2.5 py-1 text-ink">70+ positivo</span></div>
        </div>
        <div className="mt-5 space-y-3">
          {setores.isLoading && <div className="h-20 animate-pulse rounded-2xl bg-warm-50 motion-reduce:animate-none" />}
          {setoresVisiveis?.map(setor => {
            const status = setor.nps >= 70 ? 'Positivo' : setor.nps >= 40 ? 'Estável' : 'Precisa de atenção'
            const cor = setor.nps >= 70 ? 'bg-accent-500' : setor.nps >= 40 ? 'bg-amber-500' : 'bg-brand-600'
            const selecionado = setorSelecionado === setor.setor_id
            return <button key={setor.setor_id} aria-pressed={selecionado} onClick={() => setSetorSelecionado(setor.setor_id)} className={`block w-full rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft ${selecionado ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white hover:border-brand-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold text-ink">{setor.nome}</span><span className="rounded-full bg-warm-50 px-3 py-1 text-sm font-semibold text-ink">NPS {setor.nps} <span className="mx-1 text-slate-400">·</span> média {setor.media ?? '—'}</span></div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-[width] duration-500 ${cor}`} style={{ width: `${Math.min(100, Math.max(0, setor.nps))}%` }} /></div>
              <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-600"><span>{status}</span><span>Ver indicadores por turno <span aria-hidden="true">→</span></span></div>
            </button>
          })}
          {!setores.isLoading && !setoresVisiveis?.length && <p className="rounded-2xl bg-warm-50 p-5 text-slate-700">Nenhum indicador disponível para este período.</p>}
        </div>
        {setorSelecionado && (!gestao || setorSelecionado === setorGestaoId) && <div className="mt-6 border-t border-warm-100 pt-5">
          <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-ink">Indicadores por turno</h3><span className="rounded-full bg-support-50 px-3 py-1 text-xs font-bold text-support-800">{setoresVisiveis?.find(setor => setor.setor_id === setorSelecionado)?.nome}</span></div>
          {turnos.isLoading ? <p className="mt-3 text-slate-700">Carregando indicadores…</p> : turnos.data?.length ? <div className="mt-3 grid gap-3 sm:grid-cols-3">{turnos.data.map(turno => <article key={turno.turno} className="rounded-2xl border border-support-100 bg-support-50/60 p-4"><p className="font-semibold capitalize text-support-800">{turno.turno}</p><strong className="mt-2 block text-lg text-ink">NPS {turno.nps} · média {turno.media ?? '—'}</strong><span className="text-sm text-slate-600">{turno.total} avaliações</span></article>)}</div> : <p className="mt-3 rounded-xl bg-warm-50 p-4 text-sm text-slate-700">Sem dados por turno para este setor e período.</p>}
        </div>}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Acompanhamento</p><h2 className="mt-1 text-xl font-bold text-ink">Em andamento</h2></div><span className="grid size-11 place-items-center rounded-2xl bg-accent-300 text-lg font-extrabold text-ink">↻</span></div>
        {andamento.isLoading ? <div className="mt-4 h-20 animate-pulse rounded-2xl bg-warm-50 motion-reduce:animate-none" /> : andamento.data?.length ? <ul className="mt-4 divide-y divide-warm-100">{andamento.data.map(item => <li key={item.id} className="flex items-start justify-between gap-3 py-4 first:pt-0"><div><p className="font-bold text-ink">Pesquisa #{item.id}</p><p className="mt-1 text-sm text-slate-600">Setor {setores.data?.find(setor => setor.setor_id === item.setor_id)?.nome ?? item.setor_id}</p><p className="mt-1 text-xs text-slate-500">Atividade {new Date(item.ultima_atividade).toLocaleString('pt-BR')}</p></div><span className="mt-1 size-2.5 shrink-0 rounded-full bg-accent-500 ring-4 ring-accent-300" aria-label="Em andamento" /></li>)}</ul> : <div className="mt-4 rounded-2xl bg-warm-50 p-5"><span className="grid size-10 place-items-center rounded-xl bg-white text-lg text-support-800 shadow-sm" aria-hidden="true">✓</span><p className="mt-3 font-semibold text-ink">Tudo em dia</p><p className="mt-1 text-sm leading-relaxed text-slate-600">Não há avaliações em andamento neste momento.</p></div>}
      </section>
    </div>
  </main></>
}
