import type { Acao, Perfil, Usuario } from '../types'

const todas: Acao[] = ['dashboard', 'manifestacoes', 'exportacoes', 'perguntas', 'setores', 'usuarios', 'perfis', 'limiares']
export const matrizPermissoes: Record<Perfil, readonly Acao[]> = {
  super_admin: todas,
  ouvidoria: ['dashboard', 'manifestacoes', 'exportacoes'],
  gestao: ['dashboard', 'exportacoes', 'perguntas'],
  admin_setor: ['perguntas'],
  visualizador: ['dashboard']
}
export function pode(usuario: Usuario | null, acao: Acao): boolean {
  return Boolean(usuario && (usuario.permissoes.includes(acao) || matrizPermissoes[usuario.perfil].includes(acao)))
}
