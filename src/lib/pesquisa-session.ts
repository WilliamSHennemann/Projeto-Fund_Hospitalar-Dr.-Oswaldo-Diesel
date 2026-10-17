import type { PesquisaCriada, ResultadoFinalizacao } from '../types'

const CHAVE = 'sgep.pesquisa'
export type SessaoPesquisa = PesquisaCriada & { finalizacao?: ResultadoFinalizacao }
export function lerSessao(): SessaoPesquisa | null { const item = sessionStorage.getItem(CHAVE); return item ? JSON.parse(item) as SessaoPesquisa : null }
export function salvarSessao(sessao: SessaoPesquisa) { sessionStorage.setItem(CHAVE, JSON.stringify(sessao)) }
export function limparSessao() { sessionStorage.removeItem(CHAVE) }
