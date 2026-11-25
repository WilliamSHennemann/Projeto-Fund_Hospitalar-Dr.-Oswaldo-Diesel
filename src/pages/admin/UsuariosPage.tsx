import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import type { AtualizarGestor, CriarGestor, ErroApi, Usuario } from '../../types'
import { Marca } from '../../components/Marca'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'

const formularioInicial = { nome: '', email: '', senha: '', setor_id: '' }
const formularioEdicaoInicial = { nome: '', email: '', setor_id: '' }

function obterErro(error: unknown) {
  if (isAxiosError<ErroApi>(error)) return { status: error.response?.status, codigo: error.response?.data?.codigo }
  return { codigo: error instanceof Error ? error.message : undefined }
}

export function UsuariosPage() {
  const cliente = useQueryClient()
  const navigate = useNavigate()
  const usuario = auth.getUser()
  const superAdmin = usuario?.perfil === 'super_admin'
  const setores = useQuery({ queryKey: ['admin-setores'], queryFn: api.admin.setores.listar, enabled: superAdmin })
  const usuarios = useQuery({ queryKey: ['admin-usuarios'], queryFn: api.admin.usuarios.listar, enabled: superAdmin })
  const [formulario, setFormulario] = useState(formularioInicial)
  const [formularioEdicao, setFormularioEdicao] = useState(formularioEdicaoInicial)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [removendoId, setRemovendoId] = useState<number | null>(null)
  const setoresAtivos = setores.data?.filter(setor => setor.ativo) ?? []

  if (!superAdmin) return <Navigate to="/admin" replace />

  function tratarErro(error: unknown, fallback: string) {
    const { status, codigo } = obterErro(error)
    if (status === 401) {
      auth.clear()
      navigate('/admin/login', { replace: true, state: { mensagem: 'Sua sessão expirou. Entre novamente.' } })
    } else if (status === 403) {
      setErro('Você não tem permissão para realizar esta ação.')
    } else if ((status === 409 && codigo === 'EMAIL_EXISTS') || codigo === 'EMAIL_EXISTS' || codigo === 'EMAIL_DUPLICADO') {
      setErro('Já existe uma conta com esse e-mail.')
    } else if (status === 404 || codigo === 'SETOR_NOT_FOUND' || codigo === 'USER_NOT_FOUND') {
      setErro('O setor ou gestor não foi encontrado.')
    } else {
      setErro(fallback)
    }
  }

  async function criarGestor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setSucesso('')
    const setorId = Number(formulario.setor_id)
    if (!setoresAtivos.some(setor => setor.id === setorId)) {
      setErro('Selecione um setor ativo.')
      return
    }

    const dados: CriarGestor = { nome: formulario.nome.trim(), email: formulario.email.trim(), senha: formulario.senha, perfil: 'gestao', setor_id: setorId }
    setSalvando(true)
    try {
      await api.admin.usuarios.criar(dados)
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] })
      setFormulario(formularioInicial)
      setSucesso('Gestor criado. Ele já pode entrar pela tela Acesso da equipe.')
    } catch (error) {
      tratarErro(error, 'Não foi possível criar o gestor. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function iniciarEdicao(gestor: Usuario) {
    setErro('')
    setSucesso('')
    setEditando(gestor)
    setFormularioEdicao({ nome: gestor.nome, email: gestor.email, setor_id: gestor.setor_id === undefined ? '' : String(gestor.setor_id) })
  }

  async function atualizarGestor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editando) return
    setErro('')
    setSucesso('')

    const dados: AtualizarGestor = {}
    const nome = formularioEdicao.nome.trim()
    const email = formularioEdicao.email.trim()
    if (nome !== editando.nome) dados.nome = nome
    if (email !== editando.email) dados.email = email

    if (formularioEdicao.setor_id !== '' && Number(formularioEdicao.setor_id) !== editando.setor_id) {
      const setorId = Number(formularioEdicao.setor_id)
      if (!setoresAtivos.some(setor => setor.id === setorId)) {
        setErro('Selecione um setor ativo.')
        return
      }
      dados.setor_id = setorId
    }

    if (Object.keys(dados).length === 0) {
      setErro('Nenhuma alteração foi feita.')
      return
    }

    setSalvandoEdicao(true)
    try {
      await api.admin.usuarios.atualizar(editando.id, dados)
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] })
      setSucesso(`Os dados de ${editando.nome} foram atualizados.`)
      setEditando(null)
      setFormularioEdicao(formularioEdicaoInicial)
    } catch (error) {
      tratarErro(error, 'Não foi possível atualizar o gestor. Verifique os dados e tente novamente.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function removerGestor(gestor: Usuario) {
    if (!confirm(`Remover o acesso de ${gestor.nome} (${gestor.email})? Ele não poderá entrar novamente.`)) return
    setErro('')
    setSucesso('')
    setRemovendoId(gestor.id)
    try {
      await api.admin.usuarios.excluir(gestor.id)
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] })
      setSucesso(`O acesso de ${gestor.nome} foi removido.`)
    } catch (error) {
      tratarErro(error, 'Não foi possível remover o gestor. Tente novamente.')
    } finally {
      setRemovendoId(null)
    }
  }

  const gestores = usuarios.data?.filter(item => item.perfil === 'gestao') ?? []
  const setorAtualInativo = editando?.setor_id !== undefined
    && !setoresAtivos.some(setor => setor.id === editando.setor_id)
    ? setores.data?.find(setor => setor.id === editando.setor_id)
    : undefined

  return <><Marca /><main className="page-shell"><p className="text-sm font-bold uppercase tracking-wider text-brand-700">Gestão do sistema</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Gestores</h1><p className="mt-2 text-slate-700">Crie o acesso do gestor e vincule a conta a um setor. Ele poderá consultar resultados, exportar dados e administrar perguntas somente desse setor.</p><NavegacaoAdmin /><section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><form aria-label="Criar gestor" onSubmit={event => void criarGestor(event)} className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6"><h2 className="text-xl font-bold text-ink">Criar gestor</h2><label className="mt-5 block font-semibold">Nome<input required autoComplete="name" value={formulario.nome} onChange={event => setFormulario({ ...formulario, nome: event.target.value })} className="field" /></label><label className="mt-4 block font-semibold">E-mail de acesso<input required type="email" autoComplete="off" value={formulario.email} onChange={event => setFormulario({ ...formulario, email: event.target.value })} className="field" /></label><label className="mt-4 block font-semibold">Senha inicial<input required type="password" minLength={8} autoComplete="new-password" value={formulario.senha} onChange={event => setFormulario({ ...formulario, senha: event.target.value })} className="field" /><span className="mt-1 block text-sm font-normal text-slate-700">Use pelo menos 8 caracteres.</span></label><label className="mt-4 block font-semibold">Setor<select required value={formulario.setor_id} onChange={event => setFormulario({ ...formulario, setor_id: event.target.value })} className="field"><option value="">Selecione o setor</option>{setoresAtivos.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></label>{setores.error && <p role="alert" className="alert-error mt-4">Não foi possível carregar os setores.</p>}{usuarios.error && <p role="alert" className="alert-error mt-4">Não foi possível carregar os gestores existentes.</p>}{erro && <p role="alert" className="alert-error mt-4">⚠ {erro}</p>}{sucesso && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">{sucesso}</p>}<button disabled={salvando || setores.isLoading || !setoresAtivos.length} className="btn-primary mt-5 w-full disabled:opacity-50">{salvando ? 'Criando…' : 'Criar gestor'}</button>{!setores.isLoading && !setores.error && !setoresAtivos.length && <p className="mt-3 text-sm text-slate-700">Cadastre um setor ativo antes de criar um gestor.</p>}</form><section className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6"><h2 className="text-xl font-bold text-ink">Gestores cadastrados</h2>{editando && <form aria-label="Editar gestor" onSubmit={event => void atualizarGestor(event)} className="mt-4 rounded-xl bg-warm-50 p-4"><h3 className="font-bold text-ink">Editar gestor</h3><label className="mt-4 block font-semibold">Nome do gestor<input required autoComplete="name" value={formularioEdicao.nome} onChange={event => setFormularioEdicao({ ...formularioEdicao, nome: event.target.value })} className="field" /></label><label className="mt-4 block font-semibold">E-mail do gestor<input required type="email" autoComplete="off" value={formularioEdicao.email} onChange={event => setFormularioEdicao({ ...formularioEdicao, email: event.target.value })} className="field" /></label><label className="mt-4 block font-semibold">Setor<select value={formularioEdicao.setor_id} onChange={event => setFormularioEdicao({ ...formularioEdicao, setor_id: event.target.value })} className="field"><option value="">Manter setor atual</option>{setorAtualInativo && <option value={setorAtualInativo.id} disabled>{setorAtualInativo.nome} (inativo)</option>}{setoresAtivos.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></label>{setores.error && <p role="alert" className="alert-error mt-4">Não foi possível carregar os setores.</p>}<div className="mt-5 flex flex-wrap gap-3"><button disabled={salvandoEdicao || setores.isLoading} className="btn-primary disabled:opacity-50">{salvandoEdicao ? 'Salvando…' : 'Salvar alterações'}</button><button type="button" disabled={salvandoEdicao} onClick={() => { setEditando(null); setErro('') }} className="min-h-11 rounded-xl border border-warm-200 bg-white px-4 font-semibold text-slate-700 disabled:opacity-50">Cancelar</button></div></form>}{usuarios.isLoading ? <p className="mt-4 text-slate-700">Carregando gestores…</p> : gestores.length ? <ul className="mt-4 divide-y divide-warm-100">{gestores.map(gestor => <li key={gestor.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"><div><p className="font-semibold text-ink">{gestor.nome}</p><p className="mt-1 break-all text-sm text-slate-700">{gestor.email}</p><p className="mt-1 text-sm font-medium text-brand-800">Setor: {setores.data?.find(setor => setor.id === gestor.setor_id)?.nome ?? 'Não identificado'}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={salvandoEdicao || removendoId !== null} onClick={() => iniciarEdicao(gestor)} className="min-h-10 rounded-xl border border-brand-300 bg-brand-50 px-3 text-sm font-semibold text-brand-900 disabled:opacity-50">Editar {gestor.nome}</button><button type="button" disabled={salvandoEdicao || removendoId !== null} onClick={() => void removerGestor(gestor)} className="min-h-10 rounded-xl border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-900 disabled:opacity-50">{removendoId === gestor.id ? 'Removendo…' : 'Remover acesso'}</button></div></li>)}</ul> : <p className="mt-4 rounded-xl bg-warm-50 p-4 text-slate-700">Nenhum gestor cadastrado.</p>}</section></section></main></>
}
