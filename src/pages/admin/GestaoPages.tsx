import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { Pergunta, Setor, TipoPergunta } from '../../types'
import { Marca } from '../../components/Marca'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'

const opcoesRostinho = [
  { valor: 1, rotulo: 'Muito ruim', emoji: '😡' }, { valor: 2, rotulo: 'Ruim', emoji: '🙁' },
  { valor: 3, rotulo: 'Neutro', emoji: '😐' }, { valor: 4, rotulo: 'Bom', emoji: '🙂' }, { valor: 5, rotulo: 'Muito bom', emoji: '😍' },
]

export function PerguntasPage() {
  const cliente = useQueryClient()
  const perguntas = useQuery<Pergunta[]>({ queryKey: ['perguntas'], queryFn: api.admin.perguntas.listar })
  const setores = useQuery<Setor[]>({ queryKey: ['admin-setores'], queryFn: api.admin.setores.listar })
  const [edicao, setEdicao] = useState<Pergunta | null>(null)
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState('')
  const [setorSelecionado, setSetorSelecionado] = useState<number | 'todos'>('todos')
  const listaExibida = (perguntas.data ?? []).filter(pergunta => pergunta.geral || setorSelecionado === 'todos' || pergunta.setor_id === setorSelecionado)

  async function salvar(dados: { texto: string; setor_id: number; tipo: TipoPergunta }) {
    setErro('')
    try {
      const payload = { ...dados, ativo: true, obrigatoria: false, opcoes: dados.tipo === 'rostinho' ? opcoesRostinho.map((opcao, indice) => ({ ...opcao, id: indice + 1, pergunta_id: edicao?.id ?? 0 })) : [] }
      if (edicao) await api.admin.perguntas.atualizar(edicao.id, { ...payload, ordem: edicao.ordem })
      else await api.admin.perguntas.criar(payload)
      await cliente.invalidateQueries({ queryKey: ['perguntas'] })
      setAberto(false); setEdicao(null)
    } catch { setErro('Não foi possível salvar a pergunta. Confira os dados e tente novamente.') }
  }

  async function excluir(pergunta: Pergunta) {
    if (!confirm(`Desativar a pergunta “${pergunta.texto}”?`)) return
    try { await api.admin.perguntas.excluir(pergunta.id); await cliente.invalidateQueries({ queryKey: ['perguntas'] }) } catch { setErro('Não foi possível desativar a pergunta.') }
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const lista = listaExibida.filter(pergunta => !pergunta.geral); const destino = indice + direcao
    if (destino < 0 || destino >= lista.length) return
    const reorganizada = [...lista]; [reorganizada[indice], reorganizada[destino]] = [reorganizada[destino], reorganizada[indice]]
    try { await api.admin.perguntas.reordenar({ perguntas: reorganizada.map((pergunta, ordem) => ({ id: pergunta.id, ordem: ordem + 1 })) }); await cliente.invalidateQueries({ queryKey: ['perguntas'] }) } catch { setErro('Não foi possível reordenar as perguntas.') }
  }

  return <Admin titulo="Perguntas"><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-slate-600">Selecione um setor para administrar suas perguntas. A pergunta NPS é fixa e sempre encerra a pesquisa.</p><button onClick={() => { setEdicao(null); setAberto(true) }} className="min-h-11 rounded-lg bg-hospital-600 px-4 font-bold text-white">Nova pergunta</button></div><label className="mt-5 block max-w-sm font-semibold">Perguntas do setor<select value={setorSelecionado} onChange={e => setSetorSelecionado(e.target.value === 'todos' ? 'todos' : Number(e.target.value))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value="todos">Todos os setores</option>{setores.data?.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></label>{setorSelecionado === 'todos' && <p className="mt-3 text-sm text-slate-500">Para alterar a ordem, selecione um setor específico.</p>}{erro && <p role="alert" className="mt-4 text-red-700">{erro}</p>}<div className="mt-5 space-y-3">{perguntas.isLoading && <p className="text-slate-600">Carregando perguntas…</p>}{listaExibida.map((pergunta, indice) => <article key={pergunta.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p><strong>{pergunta.geral ? 'NPS fixa: ' : ''}</strong>{pergunta.texto}</p><p className="mt-1 text-sm text-slate-500">{pergunta.geral ? 'Pergunta geral' : setores.data?.find(setor => setor.id === pergunta.setor_id)?.nome ?? 'Setor'} · {pergunta.tipo} · ordem {pergunta.ordem}</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><button disabled={pergunta.geral || setorSelecionado === 'todos' || indice === 0} onClick={() => mover(listaExibida.filter(item => !item.geral).findIndex(item => item.id === pergunta.id), -1)} className="min-h-10 rounded-lg border px-3 disabled:opacity-40" aria-label="Mover para cima">↑ Mover</button><button disabled={pergunta.geral || setorSelecionado === 'todos' || indice === listaExibida.length - 1} onClick={() => mover(listaExibida.filter(item => !item.geral).findIndex(item => item.id === pergunta.id), 1)} className="min-h-10 rounded-lg border px-3 disabled:opacity-40" aria-label="Mover para baixo">↓ Mover</button><button disabled={pergunta.geral} onClick={() => { setEdicao(pergunta); setAberto(true) }} className="min-h-10 rounded-lg border px-3 disabled:opacity-40">Editar</button><button disabled={pergunta.geral} onClick={() => excluir(pergunta)} className="min-h-10 rounded-lg border border-red-200 px-3 text-red-700 disabled:opacity-40">Desativar</button></div></article>)}</div>{aberto && <FormularioPergunta pergunta={edicao} setores={setores.data ?? []} setorPreselecionado={setorSelecionado === 'todos' ? undefined : setorSelecionado} onCancelar={() => { setAberto(false); setEdicao(null) }} onSalvar={salvar} />}</Admin>
}

function FormularioPergunta({ pergunta, setores, setorPreselecionado, onCancelar, onSalvar }: { pergunta: Pergunta | null; setores: Setor[]; setorPreselecionado?: number; onCancelar: () => void; onSalvar: (dados: { texto: string; setor_id: number; tipo: TipoPergunta }) => void }) {
  const [texto, setTexto] = useState(pergunta?.texto ?? '')
  const [setorId, setSetorId] = useState(String(pergunta?.setor_id ?? setorPreselecionado ?? setores[0]?.id ?? ''))
  const [tipo, setTipo] = useState<TipoPergunta>(pergunta?.tipo ?? 'rostinho')
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-10 grid place-items-center bg-slate-900/50 p-5"><form onSubmit={e => { e.preventDefault(); if (texto.trim() && setorId) onSalvar({ texto: texto.trim(), setor_id: Number(setorId), tipo }) }} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">{pergunta ? 'Editar pergunta' : 'Nova pergunta'}</h2><label className="mt-5 block font-semibold">Pergunta<textarea required value={texto} onChange={e => setTexto(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3" /></label><label className="mt-4 block font-semibold">Setor<select required value={setorId} onChange={e => setSetorId(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3">{setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></label><label className="mt-4 block font-semibold">Tipo<select value={tipo} onChange={e => setTipo(e.target.value as TipoPergunta)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"><option value="rostinho">Rostinhos (1 a 5)</option><option value="texto">Texto livre</option><option value="multipla">Múltipla escolha</option></select></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancelar} className="min-h-11 rounded-lg border px-4">Cancelar</button><button className="min-h-11 rounded-lg bg-hospital-600 px-4 font-bold text-white">Salvar</button></div></form></div>
}

export function SetoresPage() {
  const cliente = useQueryClient(); const setores = useQuery<Setor[]>({ queryKey: ['admin-setores'], queryFn: api.admin.setores.listar }); const [edicao, setEdicao] = useState<Setor | null>(null); const [aberto, setAberto] = useState(false); const [erro, setErro] = useState('')
  async function salvar(dados: { nome: string; slug: string }) { setErro(''); try { if (edicao) await api.admin.setores.atualizar(edicao.id, dados); else await api.admin.setores.criar(dados); await Promise.all([cliente.invalidateQueries({ queryKey: ['admin-setores'] }), cliente.invalidateQueries({ queryKey: ['setores'] })]); setAberto(false); setEdicao(null) } catch { setErro('Não foi possível salvar o setor. Verifique se a URL já está sendo usada.') } }
  async function desativar(setor: Setor) { if (!confirm(`Desativar o setor “${setor.nome}”? O QR Code deixará de aceitar novas avaliações.`)) return; try { await api.admin.setores.excluir(setor.id); await cliente.invalidateQueries({ queryKey: ['admin-setores'] }) } catch { setErro('Não foi possível desativar o setor.') } }
  return <Admin titulo="Setores e QR Codes"><div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-slate-600">Cada setor possui uma URL e um QR Code próprios. Depois de criar um setor, cadastre as perguntas dele.</p><button onClick={() => { setEdicao(null); setAberto(true) }} className="min-h-11 rounded-lg bg-hospital-600 px-4 font-bold text-white">Novo setor</button></div>{erro && <p role="alert" className="mt-4 text-red-700">{erro}</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2">{setores.data?.map(setor => <article key={setor.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{setor.nome}</h2><p className="mt-1 break-all text-sm text-slate-600">{location.origin}/{setor.slug}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${setor.ativo ? 'bg-hospital-50 text-hospital-800' : 'bg-slate-100 text-slate-600'}`}>{setor.ativo ? 'Ativo' : 'Inativo'}</span></div><QRCodeSVG className="mt-4" value={`${location.origin}/${setor.slug}`} size={128} /><div className="mt-4 grid grid-cols-2 gap-2"><Link to="/admin/perguntas" className="grid min-h-10 place-items-center rounded-lg bg-hospital-600 px-3 text-center text-sm font-bold text-white">Perguntas</Link><button onClick={() => { setEdicao(setor); setAberto(true) }} className="min-h-10 rounded-lg border px-3 text-sm font-semibold">Editar</button><button onClick={() => window.print()} className="min-h-10 rounded-lg border px-3 text-sm font-semibold">Imprimir QR</button>{setor.ativo && <button onClick={() => desativar(setor)} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700">Desativar</button>}</div></article>)}</div>{aberto && <FormularioSetor setor={edicao} onCancelar={() => { setAberto(false); setEdicao(null) }} onSalvar={salvar} />}</Admin>
}

function FormularioSetor({ setor, onCancelar, onSalvar }: { setor: Setor | null; onCancelar: () => void; onSalvar: (dados: { nome: string; slug: string }) => void }) {
  const [nome, setNome] = useState(setor?.nome ?? ''); const [slug, setSlug] = useState(setor?.slug ?? '')
  function atualizarNome(valor: string) { setNome(valor); if (!setor) setSlug(valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) }
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-10 grid place-items-center bg-slate-900/50 p-4"><form onSubmit={e => { e.preventDefault(); if (nome.trim() && slug.trim()) onSalvar({ nome: nome.trim(), slug: slug.trim() }) }} className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6"><h2 className="text-xl font-bold">{setor ? 'Editar setor' : 'Novo setor'}</h2><label className="mt-5 block font-semibold">Nome do setor<input required value={nome} onChange={e => atualizarNome(e.target.value)} placeholder="Ex.: Laboratório" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label className="mt-4 block font-semibold">Endereço da pesquisa<input required pattern="[a-z0-9-]+" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} placeholder="laboratorio" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><p className="mt-2 break-all text-sm text-slate-500">A pesquisa ficará em: {location.origin}/{slug || 'nome-do-setor'}</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancelar} className="min-h-11 rounded-lg border px-4">Cancelar</button><button className="min-h-11 rounded-lg bg-hospital-600 px-4 font-bold text-white">Salvar setor</button></div></form></div>
}

function Admin({ titulo, children }: { titulo: string; children: React.ReactNode }) { return <><Marca /><main className="mx-auto max-w-5xl p-5"><h1 className="text-3xl font-bold">{titulo}</h1><NavegacaoAdmin /><section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">{children}</section></main></> }
