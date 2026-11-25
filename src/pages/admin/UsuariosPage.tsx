import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import type { AtualizarGestor, CriarGestor, ErroApi, Perfil, Usuario } from '../../types'
import { Marca } from '../../components/Marca'
import { CabecalhoAdmin } from '../../components/CabecalhoAdmin'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'

type PerfilCriavel = Exclude<Perfil, 'super_admin'>
const formularioInicial = { nome: '', email: '', senha: '', setor_id: '', perfil: 'gestao' as PerfilCriavel }
const formularioEdicaoInicial = { nome: '', email: '', setor_id: '' }
const rotuloPerfil: Record<Perfil, string> = { super_admin: 'Super administrador', ouvidoria: 'Ouvidoria', gestao: 'Gestão', admin_setor: 'Admin de setor', visualizador: 'Visualizador' }

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
  const usuarios = useQuery({ queryKey: ['admin-usuarios'], queryFn: () => api.admin.usuarios.listar(true), enabled: superAdmin })
  const [formulario, setFormulario] = useState(formularioInicial)
  const [formularioEdicao, setFormularioEdicao] = useState(formularioEdicaoInicial)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [senhaUsuario, setSenhaUsuario] = useState<Usuario | null>(null)
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('')
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
    } else if (status === 403) setErro('Você não tem permissão para realizar esta ação.')
    else if (codigo === 'EMAIL_EXISTS' || codigo === 'EMAIL_DUPLICADO') setErro('Já existe uma conta com esse e-mail (pode estar na lista de acessos removidos — reative por lá).')
    else if (status === 404 || codigo === 'SETOR_NOT_FOUND' || codigo === 'USER_NOT_FOUND') setErro('O setor ou usuário não foi encontrado.')
    else setErro(fallback)
  }

  async function criarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErro(''); setSucesso('')
    const exigeSetor = formulario.perfil === 'gestao' || formulario.perfil === 'admin_setor'
    const setorId = Number(formulario.setor_id)
    if (exigeSetor && !setoresAtivos.some(setor => setor.id === setorId)) { setErro('Selecione um setor ativo para este perfil.'); return }
    const dados: CriarGestor = { nome: formulario.nome.trim(), email: formulario.email.trim(), senha: formulario.senha, perfil: formulario.perfil, ...(exigeSetor ? { setor_id: setorId } : {}) }
    setSalvando(true)
    try {
      await api.admin.usuarios.criar(dados)
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] })
      setFormulario(formularioInicial)
      setSucesso(formulario.perfil === 'gestao' ? 'Gestor criado. Ele já pode entrar pela tela Acesso da equipe.' : 'Usuário criado. Ele já pode entrar pela tela Acesso da equipe.')
    } catch (error) { tratarErro(error, 'Não foi possível criar o usuário. Verifique os dados e tente novamente.') }
    finally { setSalvando(false) }
  }

  function iniciarEdicao(gestor: Usuario) {
    setErro(''); setSucesso(''); setEditando(gestor)
    setFormularioEdicao({ nome: gestor.nome, email: gestor.email, setor_id: gestor.setor_id === undefined ? '' : String(gestor.setor_id) })
  }
  async function atualizarGestor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editando) return
    setErro(''); setSucesso('')
    const dados: AtualizarGestor = {}
    const nome = formularioEdicao.nome.trim(); const email = formularioEdicao.email.trim()
    if (nome !== editando.nome) dados.nome = nome
    if (email !== editando.email) dados.email = email
    if (formularioEdicao.setor_id !== '' && Number(formularioEdicao.setor_id) !== editando.setor_id) {
      const setorId = Number(formularioEdicao.setor_id)
      if (!setoresAtivos.some(setor => setor.id === setorId)) { setErro('Selecione um setor ativo.'); return }
      dados.setor_id = setorId
    }
    if (!Object.keys(dados).length) { setErro('Nenhuma alteração foi feita.'); return }
    setSalvandoEdicao(true)
    try {
      await api.admin.usuarios.atualizar(editando.id, dados)
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] })
      setSucesso(`Os dados de ${editando.nome} foram atualizados.`); setEditando(null); setFormularioEdicao(formularioEdicaoInicial)
    } catch (error) { tratarErro(error, 'Não foi possível atualizar o gestor. Verifique os dados e tente novamente.') }
    finally { setSalvandoEdicao(false) }
  }
  async function removerUsuario(alvo: Usuario) {
    if (!confirm(`Remover o acesso de ${alvo.nome} (${alvo.email})? Ele não poderá entrar novamente.`)) return
    setErro(''); setSucesso(''); setRemovendoId(alvo.id)
    try {
      await api.admin.usuarios.excluir(alvo.id)
      await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] })
      setSucesso(`O acesso de ${alvo.nome} foi removido.`)
    } catch (error) { tratarErro(error, 'Não foi possível remover o acesso. Tente novamente.') }
    finally { setRemovendoId(null) }
  }
  async function redefinirSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!senhaUsuario) return
    setErro('')
    if (senhaNova.length < 8 || senhaNova.length > 72) { setErro('A senha deve ter entre 8 e 72 caracteres.'); return }
    if (senhaNova !== senhaConfirmacao) { setErro('As senhas não são iguais.'); return }
    setSalvando(true)
    try {
      await api.admin.usuarios.redefinirSenha(senhaUsuario.id, senhaNova)
      setSenhaUsuario(null); setSenhaNova(''); setSenhaConfirmacao(''); setSucesso(`A senha de ${senhaUsuario.nome} foi redefinida.`)
    } catch (error) { tratarErro(error, 'Não foi possível redefinir a senha. Tente novamente.') }
    finally { setSalvando(false) }
  }
  async function reativar(alvo: Usuario) {
    setErro('')
    try { await api.admin.usuarios.reativar(alvo.id); await cliente.invalidateQueries({ queryKey: ['admin-usuarios'] }); setSucesso(`O acesso de ${alvo.nome} foi reativado.`) }
    catch (error) { tratarErro(error, 'Não foi possível reativar o acesso. Tente novamente.') }
  }

  const ativos = usuarios.data?.filter(item => item.ativo !== false) ?? []
  const inativos = usuarios.data?.filter(item => item.ativo === false) ?? []
  const setorAtualInativo = editando?.setor_id !== undefined && !setoresAtivos.some(setor => setor.id === editando.setor_id) ? setores.data?.find(setor => setor.id === editando.setor_id) : undefined
  const mostrarSetor = formulario.perfil === 'gestao' || formulario.perfil === 'admin_setor'

  return <><Marca /><main className="page-shell">
    <CabecalhoAdmin titulo="Gestores e acessos" descricao="Crie e acompanhe as contas da equipe, seus perfis e setores vinculados." />
    <NavegacaoAdmin />
    <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form aria-label="Criar gestor" onSubmit={event => void criarUsuario(event)} className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-bold text-ink">Criar acesso</h2>
        <label className="mt-5 block font-semibold">Nome<input required autoComplete="name" value={formulario.nome} onChange={event => setFormulario({ ...formulario, nome: event.target.value })} className="field" /></label>
        <label className="mt-4 block font-semibold">E-mail de acesso<input required type="email" autoComplete="off" value={formulario.email} onChange={event => setFormulario({ ...formulario, email: event.target.value })} className="field" /></label>
        <label className="mt-4 block font-semibold">Senha inicial<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={formulario.senha} onChange={event => setFormulario({ ...formulario, senha: event.target.value })} className="field" /><span className="mt-1 block text-sm font-normal text-slate-700">Use de 8 a 72 caracteres.</span></label>
        <label className="mt-4 block font-semibold">Perfil<select value={formulario.perfil} onChange={event => setFormulario({ ...formulario, perfil: event.target.value as PerfilCriavel, setor_id: '' })} className="field"><option value="gestao">Gestão</option><option value="ouvidoria">Ouvidoria</option><option value="visualizador">Visualizador</option><option value="admin_setor">Admin de setor</option></select></label>
        {mostrarSetor && <label className="mt-4 block font-semibold">Setor<select required value={formulario.setor_id} onChange={event => setFormulario({ ...formulario, setor_id: event.target.value })} className="field"><option value="">Selecione o setor</option>{setoresAtivos.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></label>}
        {setores.error && <p role="alert" className="alert-error mt-4">Não foi possível carregar os setores.</p>}
        {usuarios.error && <p role="alert" className="alert-error mt-4">Não foi possível carregar os usuários existentes.</p>}
        {erro && <p role="alert" className="alert-error mt-4">⚠ {erro}</p>}
        {sucesso && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">{sucesso}</p>}
        <button disabled={salvando || (mostrarSetor && (setores.isLoading || !setoresAtivos.length))} className="btn-primary mt-5 w-full disabled:opacity-50">{salvando ? 'Criando…' : 'Criar gestor'}</button>
      </form>

      <section className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-bold text-ink">Acessos ativos</h2>
        {editando && <form aria-label="Editar gestor" onSubmit={event => void atualizarGestor(event)} className="mt-4 rounded-xl bg-warm-50 p-4">
          <h3 className="font-bold text-ink">Editar gestor</h3>
          <label className="mt-4 block font-semibold">Nome do gestor<input required autoComplete="name" value={formularioEdicao.nome} onChange={event => setFormularioEdicao({ ...formularioEdicao, nome: event.target.value })} className="field" /></label>
          <label className="mt-4 block font-semibold">E-mail do gestor<input required type="email" autoComplete="off" value={formularioEdicao.email} onChange={event => setFormularioEdicao({ ...formularioEdicao, email: event.target.value })} className="field" /></label>
          <label className="mt-4 block font-semibold">Setor<select value={formularioEdicao.setor_id} onChange={event => setFormularioEdicao({ ...formularioEdicao, setor_id: event.target.value })} className="field"><option value="">Manter setor atual</option>{setorAtualInativo && <option value={setorAtualInativo.id} disabled>{setorAtualInativo.nome} (inativo)</option>}{setoresAtivos.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></label>
          <div className="mt-5 flex flex-wrap gap-3"><button disabled={salvandoEdicao || setores.isLoading} className="btn-primary disabled:opacity-50">{salvandoEdicao ? 'Salvando…' : 'Salvar alterações'}</button><button type="button" disabled={salvandoEdicao} onClick={() => { setEditando(null); setErro('') }} className="min-h-11 rounded-xl border border-warm-200 bg-white px-4 font-semibold text-slate-700 disabled:opacity-50">Cancelar</button></div>
        </form>}
        {usuarios.isLoading ? <p className="mt-4 text-slate-700">Carregando acessos…</p> : ativos.length ? <ul className="mt-4 divide-y divide-warm-100">{ativos.map(alvo => <li key={alvo.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"><div><p className="font-semibold text-ink">{alvo.nome}</p><p className="mt-1 break-all text-sm text-slate-700">{alvo.email}</p><p className="mt-1 text-sm font-medium text-brand-800">{alvo.setor_id ? `Setor: ${setores.data?.find(setor => setor.id === alvo.setor_id)?.nome ?? 'Não identificado'}` : rotuloPerfil[alvo.perfil]}</p></div><div className="flex flex-wrap gap-2">{alvo.perfil === 'gestao' && <><button type="button" disabled={salvandoEdicao || removendoId !== null} onClick={() => iniciarEdicao(alvo)} className="min-h-10 rounded-xl border border-brand-300 bg-brand-50 px-3 text-sm font-semibold text-brand-900 disabled:opacity-50">Editar {alvo.nome}</button><button type="button" disabled={salvandoEdicao || removendoId !== null} onClick={() => void removerUsuario(alvo)} className="min-h-10 rounded-xl border border-red-300 bg-red-50 px-3 text-sm font-semibold text-red-900 disabled:opacity-50">{removendoId === alvo.id ? 'Removendo…' : 'Remover acesso'}</button></>}<button type="button" onClick={() => { setSenhaUsuario(alvo); setErro('') }} className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800">Redefinir senha</button></div></li>)}</ul> : <p className="mt-4 rounded-xl bg-warm-50 p-4 text-slate-700">Nenhum acesso cadastrado.</p>}
      </section>
    </section>
    {inativos.length > 0 && <section className="mt-6 rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6"><h2 className="text-xl font-bold text-ink">Acessos removidos</h2><ul className="mt-4 divide-y divide-warm-100">{inativos.map(alvo => <li key={alvo.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-semibold text-ink">{alvo.nome}</p><p className="mt-1 break-all text-sm text-slate-700">{alvo.email}</p><p className="mt-1 text-sm text-slate-600">{rotuloPerfil[alvo.perfil]}</p></div><button type="button" onClick={() => void reativar(alvo)} className="btn-secondary min-h-12">Reativar</button></li>)}</ul></section>}
    {senhaUsuario && <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/60 p-4"><form onSubmit={event => void redefinirSenha(event)} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-card"><h2 className="text-xl font-bold text-ink">Redefinir senha de {senhaUsuario.nome}</h2><label className="mt-5 block font-semibold">Nova senha<input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={senhaNova} onChange={event => setSenhaNova(event.target.value)} className="field" /></label><label className="mt-4 block font-semibold">Confirme a nova senha<input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={senhaConfirmacao} onChange={event => setSenhaConfirmacao(event.target.value)} className="field" /></label>{erro && <p role="alert" className="alert-error mt-4">{erro}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setSenhaUsuario(null); setSenhaNova(''); setSenhaConfirmacao('') }} className="btn-secondary">Cancelar</button><button disabled={salvando} className="btn-primary">{salvando ? 'Salvando…' : 'Salvar nova senha'}</button></div></form></div>}
  </main></>
}
