import { describe, expect, it } from 'vitest'
import { pode } from './permissions'
import type { Usuario } from '../types'

const usuario = (perfil: Usuario['perfil']): Usuario => ({ id: 1, nome: 'Teste', email: 'teste@fundacao.com', perfil, permissoes: [] })
describe('matriz de permissões', () => {
  it('separa a Ouvidoria da gestão de perguntas', () => { expect(pode(usuario('ouvidoria'), 'manifestacoes')).toBe(true); expect(pode(usuario('ouvidoria'), 'perguntas')).toBe(false) })
  it('permite tudo ao super admin', () => { expect(pode(usuario('super_admin'), 'setores')).toBe(true); expect(pode(usuario('super_admin'), 'jobs')).toBe(true) })
  it('deixa visualizador apenas no dashboard', () => { expect(pode(usuario('visualizador'), 'dashboard')).toBe(true); expect(pode(usuario('visualizador'), 'exportacoes')).toBe(false) })
})
