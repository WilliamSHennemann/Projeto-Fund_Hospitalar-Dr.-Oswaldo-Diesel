import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Manifestacao, StatusManifestacao, TipoManifestacao } from '../../types'
import { Marca } from '../../components/Marca'
import { CabecalhoAdmin } from '../../components/CabecalhoAdmin'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'

const pageSize = 20
const statusLabel: Record<StatusManifestacao, string> = { aberta: 'Aberta', em_tratamento: 'Em tratamento', concluida: 'Concluída' }
const tipoLabel: Record<TipoManifestacao, string> = { reclamacao: 'Reclamação', elogio: 'Elogio', sugestao: 'Sugestão' }
const telefoneLegivel = (telefone: string) => {
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return telefone
}

export function ManifestacoesPage() {
  const cliente = useQueryClient()
  const [idSelecionado, setIdSelecionado] = useState<number | null>(null)
  const [status, setStatus] = useState<StatusManifestacao | 'todos'>('todos')
  const [tipo, setTipo] = useState<TipoManifestacao | 'todos'>('todos')
  const [offset, setOffset] = useState(0)
  const [itens, setItens] = useState<Manifestacao[]>([])
  const [parecer, setParecer] = useState('')
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const filtros = { ...(status !== 'todos' ? { status } : {}), ...(tipo !== 'todos' ? { tipo } : {}), limit: pageSize, offset }
  const lista = useQuery({ queryKey: ['manifestacoes', status, tipo, offset], queryFn: () => api.manifestacoes.listar(filtros) })
  const detalhe = useQuery({ queryKey: ['manifestacao', idSelecionado], queryFn: () => api.manifestacoes.obter(idSelecionado!), enabled: idSelecionado !== null })
  const [statusEdicao, setStatusEdicao] = useState<StatusManifestacao>('aberta')
  useEffect(() => { if (!lista.data) return; setItens(previous => offset === 0 ? lista.data.items : [...previous, ...lista.data.items]) }, [lista.data, offset])
  function alterarFiltro(novoStatus: StatusManifestacao | 'todos', novoTipo: TipoManifestacao | 'todos') {
    setStatus(novoStatus); setTipo(novoTipo); setOffset(0); setItens([]); setIdSelecionado(null)
  }
  function selecionar(item: Manifestacao) { setIdSelecionado(item.id); setStatusEdicao(item.status); setParecer(item.parecer_interno ?? ''); setErro(''); setCopiado(false) }
  async function salvar() {
    if (!detalhe.data) return
    setErro('')
    try {
      await api.manifestacoes.atualizar(detalhe.data.id, { status: statusEdicao, parecer_interno: parecer })
      await Promise.all([cliente.invalidateQueries({ queryKey: ['manifestacoes'] }), cliente.invalidateQueries({ queryKey: ['manifestacao', detalhe.data.id] })])
    } catch { setErro('Não foi possível atualizar o registro. Tente novamente.') }
  }
  async function copiarTelefone(telefone: string) {
    try { await navigator.clipboard.writeText(telefoneLegivel(telefone)); setCopiado(true); setErro('') }
    catch { setErro('Não foi possível copiar o telefone neste navegador.') }
  }
  const selecionada = detalhe.data
  const total = lista.data?.total ?? itens.length
  const ordenadas = [...itens].sort((a, b) => Number(a.status !== 'aberta') - Number(b.status !== 'aberta'))
  return <><Marca /><main className="page-shell">
    <CabecalhoAdmin eyebrow="Atendimento e acompanhamento" titulo="Ouvidoria" descricao="Acompanhe e responda às mensagens recebidas dos pacientes." />
    <NavegacaoAdmin />
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <section className="overflow-hidden rounded-2xl border border-warm-100 bg-white shadow-card">
        <div className="border-b border-warm-100 p-4 sm:p-5"><h2 className="font-bold text-ink">Mensagens recebidas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-base font-semibold">Situação<select aria-label="Filtrar por situação" value={status} onChange={event => alterarFiltro(event.target.value as StatusManifestacao | 'todos', tipo)} className="field mt-1 min-h-12"><option value="todos">Todas</option><option value="aberta">Aberta</option><option value="em_tratamento">Em tratamento</option><option value="concluida">Concluída</option></select></label>
            <label className="block text-base font-semibold">Tipo<select aria-label="Filtrar por tipo" value={tipo} onChange={event => alterarFiltro(status, event.target.value as TipoManifestacao | 'todos')} className="field mt-1 min-h-12"><option value="todos">Todos</option><option value="reclamacao">Reclamação</option><option value="elogio">Elogio</option><option value="sugestao">Sugestão</option></select></label>
          </div>
        </div>
        {lista.isLoading && <div className="space-y-3 p-5"><div className="h-16 animate-pulse rounded-xl bg-warm-50 motion-reduce:animate-none" /><div className="h-16 animate-pulse rounded-xl bg-warm-50 motion-reduce:animate-none" /></div>}
        {ordenadas.length > 0 && <ul className="max-h-[70vh] overflow-y-auto">{ordenadas.map(item => {
          const desejaContato = Boolean(item.canal_contato || item.paciente?.telefone)
          return <li key={item.id}><button onClick={() => selecionar(item)} className={`w-full border-b border-warm-100 p-4 text-left transition-colors ${idSelecionado === item.id ? 'bg-brand-50 ring-inset ring-2 ring-brand-600' : 'hover:bg-warm-50'}`}>
            <span className="badge bg-brand-50 text-brand-800">{tipoLabel[item.tipo]}</span><span className={`badge ml-2 ${item.status === 'concluida' ? 'bg-emerald-50 text-emerald-900' : item.status === 'em_tratamento' ? 'bg-amber-50 text-amber-900' : 'bg-warm-100 text-slate-800'}`}>{statusLabel[item.status]}</span>{desejaContato && <span className="badge ml-2 bg-support-50 text-support-800">Quer contato</span>}
            <p className="mt-2 line-clamp-2 text-base text-slate-800">{item.descricao}</p>
            <time className="mt-2 block text-sm text-slate-600">{item.created_at || item.data ? new Date(item.created_at ?? item.data!).toLocaleString('pt-BR') : 'Data não informada'}</time>
          </button></li>
        })}</ul>}
        {!lista.isLoading && !ordenadas.length && <p className="p-5 text-base text-slate-700">Nenhuma mensagem encontrada.</p>}
        {itens.length < total && <button disabled={lista.isFetching} onClick={() => setOffset(value => value + pageSize)} className="btn-secondary m-4 min-h-12">{lista.isFetching ? 'Carregando…' : 'Carregar mais'}</button>}
      </section>
      <section className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6">
        {detalhe.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-warm-50 motion-reduce:animate-none" aria-label="Carregando detalhes" /> : selecionada ? <>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-brand-700">Detalhes</p><h2 className="mt-1 text-xl font-bold capitalize text-ink">{tipoLabel[selecionada.tipo]}</h2></div><span className="badge bg-warm-100 text-slate-800">{statusLabel[selecionada.status]}</span></div>
          <div className="mt-5 rounded-2xl bg-warm-50 p-4"><p className="text-base font-semibold text-slate-700">Relato</p><p className="mt-2 text-base leading-relaxed text-ink">{selecionada.descricao || 'Nenhuma observação foi escrita.'}</p></div>
          {selecionada.created_at || selecionada.data ? <p className="mt-4 text-base text-slate-700"><strong>Recebido:</strong> {new Date(selecionada.created_at ?? selecionada.data!).toLocaleString('pt-BR')}</p> : null}
          {selecionada.setor && <p className="mt-3 text-base text-slate-700"><strong>Setor:</strong> {selecionada.setor.nome}</p>}
          {selecionada.pesquisa && <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-4 text-base font-semibold text-brand-800">Nota: {selecionada.pesquisa.nps_nota ?? '—'} · Média: {selecionada.pesquisa.media_parcial ?? '—'}</p>}
          {selecionada.paciente?.telefone && <div className="mt-4 rounded-xl border border-support-100 bg-support-50 p-4"><p className="text-base font-bold text-ink">Contato autorizado</p>{selecionada.paciente.nome && <p className="mt-2 text-base text-slate-800">{selecionada.paciente.nome}</p>}<a className="mt-2 inline-flex min-h-12 items-center text-lg font-bold text-support-900 underline" href={`tel:${selecionada.paciente.telefone.replace(/\D/g, '')}`}>{telefoneLegivel(selecionada.paciente.telefone)}</a><button type="button" onClick={() => void copiarTelefone(selecionada.paciente!.telefone!)} className="btn-secondary mt-2 min-h-12 w-full sm:w-auto">{copiado ? 'Telefone copiado' : 'Copiar telefone'}</button></div>}
          {selecionada.respostas?.length ? <div className="mt-5"><h3 className="font-bold text-ink">Respostas da pesquisa</h3><ul className="mt-2 divide-y divide-warm-100 text-base text-slate-700">{selecionada.respostas.map((resposta, indice) => <li className="py-3" key={`${resposta.pergunta_id}-${indice}`}><strong>{resposta.pergunta_texto ?? `Pergunta ${resposta.pergunta_id}`}:</strong> {resposta.texto ?? resposta.valor ?? 'Sem resposta'}</li>)}</ul></div> : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block font-semibold">Situação<select value={statusEdicao} onChange={event => setStatusEdicao(event.target.value as StatusManifestacao)} className="field mt-1 min-h-12"><option value="aberta">Aberta</option><option value="em_tratamento">Em tratamento</option><option value="concluida">Concluída</option></select></label><label className="block font-semibold sm:col-span-2">Resposta interna<textarea value={parecer} onChange={event => setParecer(event.target.value)} className="field min-h-24 py-3" /></label></div>
          {erro && <p role="alert" className="alert-error mt-3">{erro}</p>}<button onClick={() => void salvar()} className="btn-primary mt-4 w-full sm:w-auto">Salvar atualização</button>
        </> : <div className="py-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-2xl text-brand-700" aria-hidden="true">↖</div><p className="mt-4 text-base text-slate-700">Selecione uma mensagem para ver os detalhes.</p></div>}
      </section>
    </div>
  </main></>
}
