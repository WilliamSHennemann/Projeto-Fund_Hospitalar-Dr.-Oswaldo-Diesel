import type { Acao, Perfil, Usuario } from '../types'

const todas: Acao[] = ['dashboard', 'manifestacoes', 'exportacoes', 'perguntas', 'setores', 'usuarios', 'perfis', 'limiares', 'pesquisa']
export const matrizPermissoes: Record<Perfil, readonly Acao[]> = {
  super_admin: todas,
  ouvidoria: ['dashboard', 'manifestacoes', 'exportacoes', 'pesquisa'],
  gestao: ['dashboard', 'exportacoes', 'perguntas', 'pesquisa'],
  admin_setor: ['perguntas', 'pesquisa'],
  visualizador: ['dashboard', 'pesquisa']
}
export function isGestao(usuario: Usuario | null): boolean {
  return Boolean(usuario && usuario.perfil !== 'super_admin' && (usuario.permissoes.includes('gestao') || usuario.perfil === 'gestao'))
}
export function pode(usuario: Usuario | null, acao: Acao): boolean {
  return Boolean(usuario && (usuario.permissoes.includes(acao) || matrizPermissoes[usuario.perfil].includes(acao) || (isGestao(usuario) && matrizPermissoes.gestao.includes(acao))))
}
