import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import type { CriarGestor } from '../../types'
import { Marca } from '../../components/Marca'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'

const formularioInicial = { nome: '', email: '', senha: '', setor_id: '' }

export function UsuariosPage() {
  const cliente = useQueryClient()
  const usuario = auth.getUser()
  const superAdmin = usuario?.perfil === 'super_admin'
  const setores = useQuery({ queryKey: ['admin-setores'], queryFn: api.admin.setores.listar, enabled: superAdmin })
  const usuarios = useQuery({ queryKey: ['admin-usuarios'], queryFn: api.admin.usuarios.listar, enabled: superAdmin })
  const [formulario, setFormulario] = useState(formularioInicial)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)
  const setoresAtivos = setores.data?.filter(setor => setor.ativo) ?? []

  if (!superAdmin) return <Navigate to="/admin" replace />

  async function criarGestor(event: React.FormEvent<HTMLFormElement>) {
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
      setSucesso('Gestor criado. Ele já pode entrar pelo acesso do gestor.')
    } catch (error) {
      setErro(error instanceof Error && error.message === 'EMAIL_DUPLICADO' ? 'Já existe uma conta com esse e-mail.' : 'Não foi possível criar o gestor. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const gestores = usuarios.data?.filter(item => item.perfil === 'gestao') ?? []
  return <><Marca /><main className="page-shell"><p className="text-sm font-bold uppercase tracking-wider text-brand-700">Gestão do sistema</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Gestores</h1><p className="mt-2 text-slate-700">Crie o acesso do gestor e vincule a conta a um setor. Ele poderá consultar resultados, exportar dados e administrar perguntas somente desse setor.</p><NavegacaoAdmin /><section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><form onSubmit={event => void criarGestor(event)} className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6"><h2 className="text-xl font-bold text-ink">Criar gestor</h2><label className="mt-5 block font-semibold">Nome<input required autoComplete="name" value={formulario.nome} onChange={event => setFormulario({ ...formulario, nome: event.target.value })} className="field" /></label><label className="mt-4 block font-semibold">E-mail de acesso<input required type="email" autoComplete="off" value={formulario.email} onChange={event => setFormulario({ ...formulario, email: event.target.value })} className="field" /></label><label className="mt-4 block font-semibold">Senha inicial<input required type="password" minLength={8} autoComplete="new-password" value={formulario.senha} onChange={event => setFormulario({ ...formulario, senha: event.target.value })} className="field" /><span className="mt-1 block text-sm font-normal text-slate-700">Use pelo menos 8 caracteres.</span></label><label className="mt-4 block font-semibold">Setor<select required value={formulario.setor_id} onChange={event => setFormulario({ ...formulario, setor_id: event.target.value })} className="field"><option value="">Selecione o setor</option>{setoresAtivos.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></label>{setores.error && <p role="alert" className="alert-error mt-4">Não foi possível carregar os setores.</p>}{usuarios.error && <p role="alert" className="alert-error mt-4">Não foi possível carregar os gestores existentes.</p>}{erro && <p role="alert" className="alert-error mt-4">⚠ {erro}</p>}{sucesso && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">{sucesso}</p>}<button disabled={salvando || setores.isLoading || !setoresAtivos.length} className="btn-primary mt-5 w-full disabled:opacity-50">{salvando ? 'Criando…' : 'Criar gestor'}</button>{!setores.isLoading && !setores.error && !setoresAtivos.length && <p className="mt-3 text-sm text-slate-700">Cadastre um setor ativo antes de criar um gestor.</p>}</form><section className="rounded-2xl border border-warm-100 bg-white p-5 shadow-card sm:p-6"><h2 className="text-xl font-bold text-ink">Gestores cadastrados</h2>{usuarios.isLoading ? <p className="mt-4 text-slate-700">Carregando gestores…</p> : gestores.length ? <ul className="mt-4 divide-y divide-warm-100">{gestores.map(gestor => <li key={gestor.id} className="py-4 first:pt-0"><p className="font-semibold text-ink">{gestor.nome}</p><p className="mt-1 break-all text-sm text-slate-700">{gestor.email}</p><p className="mt-1 text-sm font-medium text-brand-800">Setor: {setores.data?.find(setor => setor.id === gestor.setor_id)?.nome ?? 'Não identificado'}</p></li>)}</ul> : <p className="mt-4 rounded-xl bg-warm-50 p-4 text-slate-700">Nenhum gestor cadastrado.</p>}</section></section></main></>
}
