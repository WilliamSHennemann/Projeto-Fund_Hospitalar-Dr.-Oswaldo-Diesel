import type { DashboardResumo, DashboardSetor, FluxoPesquisa, LoginResposta, Manifestacao, PesquisaAndamento, PesquisaCriada, Pergunta, ResultadoFinalizacao, Setor, TvWall, Turno, Usuario } from '../../types'
import { fluxoMock, setoresMock, tvWallMock } from './data'

let pesquisaSequencia = 1
let ultimaNotaNps: number | undefined
const usuarioSuper: Usuario = { id: 1, nome: 'Administrador', email: 'super@fundacao.com', perfil: 'super_admin', permissoes: [] }
const usuarioOuvidoria: Usuario = { id: 2, nome: 'Equipe de Ouvidoria', email: 'ouvidoria@fundacao.com', perfil: 'ouvidoria', permissoes: [] }
const resumo: DashboardResumo = { nps_geral: 72, media_geral: 4.3, total_pesquisas: 384, percentual_parciais: 8.6, periodo: 'Últimos 30 dias' }
const manifestacoes: Manifestacao[] = [{ id: 1, tipo: 'reclamacao', descricao: 'Esperei mais tempo do que esperava para o atendimento.', status: 'aberta', setor: setoresMock[0], created_at: '2026-10-16', paciente: { nome: 'Maria Silva', telefone: '(11) 99999-9999', consentimento: true } }, { id: 2, tipo: 'elogio', descricao: 'A equipe de enfermagem foi muito atenciosa.', status: 'concluida', setor: setoresMock[2], created_at: '2026-10-15', paciente: null }]

function setorPorSlug(slug: string): Setor { const setor = setoresMock.find(item => item.slug === slug); if (!setor) throw new Error('SETOR_NOT_FOUND'); return setor }

export const mockApi = {
  setores: { listar: async () => setoresMock, obter: async (slug: string) => setorPorSlug(slug), fluxo: async (slug: string): Promise<FluxoPesquisa> => fluxoMock(setorPorSlug(slug)), pergunta: async (slug: string, numero: number) => { const fluxo = fluxoMock(setorPorSlug(slug)); const pergunta = fluxo.fluxo.find(item => item.numero === numero); if (!pergunta) throw new Error('PERGUNTA_NOT_FOUND'); return { pergunta, numero, total: fluxo.fluxo.length, opcoes: pergunta.opcoes } } },
  pesquisas: {
    criar: async ({ setor_id }: { setor_id: number; anonimo: boolean; consentimento: boolean }): Promise<PesquisaCriada> => ({ pesquisa_id: pesquisaSequencia++, token: 'mock-token', setor: setoresMock.find(s => s.id === setor_id)! }),
    responder: async (_id: number, perguntaId: number, data: { valor?: number }) => { if (perguntaId === 99) ultimaNotaNps = data.valor; return { ok: true, proximaPergunta: null, mediaParcial: 4, ultima: perguntaId === 99 } }, finalizar: async (_id: number): Promise<ResultadoFinalizacao> => ultimaNotaNps !== undefined && ultimaNotaNps <= 6 ? { destino: 'ouvidoria', motivo: 'Gostaríamos de entender melhor sua experiência.' } : { destino: 'agradecimento', motivo: 'Avaliação concluída' },
    paciente: async (_id: number, _data: object) => undefined, manifestacao: async (_id: number, _data: object) => undefined
  },
  tvwall: async (): Promise<TvWall> => tvWallMock,
  auth: { login: async (email: string, senha: string): Promise<LoginResposta> => { if (senha !== 'super123' && senha !== 'ouvidoria123') throw new Error('INVALID_CREDENTIALS'); return { token: 'mock-jwt', usuario: email === 'ouvidoria@fundacao.com' ? usuarioOuvidoria : usuarioSuper } }, me: async (): Promise<{ usuario: Usuario }> => ({ usuario: usuarioSuper }) },
  dashboard: { resumo: async () => resumo, setores: async (): Promise<DashboardSetor[]> => tvWallMock.setores.map((setor, index) => ({ setor_id: index + 1, nome: setor.nome, nps: setor.nps, media: 4.1 })), turnos: async (): Promise<Turno[]> => [{ turno: 'manhã', total: 80, nps: 70, media: 4.2 }], emAndamento: async (): Promise<PesquisaAndamento[]> => [], equipes: async () => [] },
  manifestacoes: { listar: async (): Promise<Manifestacao[]> => manifestacoes, obter: async (id: number): Promise<Manifestacao> => { const item = manifestacoes.find(m => m.id === id); if (!item) throw new Error('MANIFESTACAO_NOT_FOUND'); return item }, atualizar: async (id: number, data: Partial<Manifestacao>) => { const indice = manifestacoes.findIndex(m => m.id === id); if (indice >= 0) manifestacoes[indice] = { ...manifestacoes[indice], ...data }; return manifestacoes[indice] } },
  exportacoes: { excel: async () => ({ mensagem: 'Exportação simulada' }), pdf: async () => ({ mensagem: 'Exportação simulada' }) },
  admin: { setores: { listar: async () => setoresMock, criar: async () => undefined }, perfis: async () => [], usuarios: async () => [], perguntas: { listar: async (): Promise<Pergunta[]> => fluxoMock(setoresMock[0]).fluxo, criar: async () => undefined, atualizar: async () => undefined, excluir: async () => undefined, reordenar: async () => undefined }, termoImagem: { obter: async () => 'Autorizo o uso de imagem conforme orientação da Fundação.', salvar: async () => undefined } },
  jobs: { abandono: async () => [], retencao: async () => [] }
}
