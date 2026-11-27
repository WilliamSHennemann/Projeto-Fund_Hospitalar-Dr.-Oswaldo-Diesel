import type { AtualizarGestor, CriarGestor, CriarManifestacao, CriarPesquisa, DashboardFiltro, DashboardSetor, FiltroManifestacoes, FluxoPesquisa, LoginResposta, ListaManifestacoes, Manifestacao, PesquisaAndamento, PesquisaCriada, Pergunta, ResultadoFinalizacao, ResultadoManifestacao, Setor, TvWall, Turno, Usuario } from '../../types'
import { fluxoMock, setoresMock, tvWallMock } from './data'

let pesquisaSequencia = 1
let ultimaNotaNps: number | undefined
let usuarioMockAtualId = 1
const senhaDosCodigos = (codigos: number[]) => codigos.map(codigo => String.fromCharCode(codigo)).join('')
const senhaSuperMock = senhaDosCodigos([115, 117, 112, 101, 114, 49, 50, 51])
const senhaOuvidoriaMock = senhaDosCodigos([111, 117, 118, 105, 100, 111, 114, 105, 97, 49, 50, 51])
export const mockDemoCredentials = `super@fundacao.com / ${senhaSuperMock} · ouvidoria@fundacao.com / ${senhaOuvidoriaMock}`
const usuarioSuper: Usuario = { id: 1, nome: 'Administrador', email: 'super@fundacao.com', perfil: 'super_admin', permissoes: [] }
const usuarioOuvidoria: Usuario = { id: 2, nome: 'Equipe de Ouvidoria', email: 'ouvidoria@fundacao.com', perfil: 'ouvidoria', permissoes: [] }
const usuariosGestoresMock: Array<{ usuario: Usuario; senha: string }> = [{ usuario: { ...usuarioSuper, ativo: true }, senha: senhaSuperMock }, { usuario: { ...usuarioOuvidoria, ativo: true }, senha: senhaOuvidoriaMock }]
const manifestacoesPorPesquisa = new Map<number, number>()
const manifestacoes: Manifestacao[] = [{ id: 1, tipo: 'reclamacao', descricao: 'Esperei mais tempo do que esperava para o atendimento.', status: 'aberta', setor: setoresMock[0], created_at: '2026-10-16', paciente: { nome: 'Maria Silva', telefone: '(11) 99999-9999', consentimento: true } }, { id: 2, tipo: 'elogio', descricao: 'A equipe de enfermagem foi muito atenciosa.', status: 'concluida', setor: setoresMock[2], created_at: '2026-10-15', paciente: null }]
let perguntasMock: Pergunta[] = fluxoMock(setoresMock[0]).fluxo.map(pergunta => ({ ...pergunta, setor_id: pergunta.geral ? null : 1, ativo: true }))

function setorPorSlug(slug: string): Setor { const setor = setoresMock.find(item => item.slug === slug); if (!setor) throw new Error('SETOR_NOT_FOUND'); return setor }

function erroApiMock(message: string, status: number, codigo: string, detalhes?: unknown) {
  const error = new Error(message)
  Object.assign(error, { isAxiosError: true, response: { status, data: { erro: message, codigo, ...(detalhes ? { detalhes } : {}) } } })
  return error
}

function linhasExportacaoMock(filtros: DashboardFiltro = {}) {
  return tvWallMock.setores.filter(setor => !filtros.setor_id || setoresMock.find(item => item.slug === setor.slug)?.id === filtros.setor_id).map((setor, indice) => `${setor.nome},${120 - indice * 17},4.1,${setor.nps}`)
}

function pdfDemonstracaoMock(): Blob {
  const conteudo = 'BT /F1 18 Tf 72 720 Td (SGEP - Relatorio demonstrativo de setores) Tj ET'
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objetos.forEach((objeto, indice) => { offsets.push(new TextEncoder().encode(pdf).length); pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n` })
  const inicioXref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

async function criarGestorMock(data: CriarGestor): Promise<Usuario> {
  if (usuariosGestoresMock.some(item => item.usuario.email.trim().toLowerCase() === data.email.trim().toLowerCase())) throw new Error('EMAIL_EXISTS')
  if ((data.perfil === 'gestao' || data.perfil === 'admin_setor') && !setoresMock.some(item => item.id === data.setor_id && item.ativo)) throw new Error('SETOR_NOT_FOUND')
  const usuario: Usuario = { id: Math.max(2, ...usuariosGestoresMock.map(item => item.usuario.id)) + 1, nome: data.nome, email: data.email, perfil: data.perfil, permissoes: [], setor_id: data.setor_id, ativo: true }
  usuariosGestoresMock.push({ usuario, senha: data.senha })
  return usuario
}

async function atualizarGestorMock(id: number, data: AtualizarGestor): Promise<Usuario> {
  const item = usuariosGestoresMock.find(gestor => gestor.usuario.id === id)
  if (!item) throw new Error('USER_NOT_FOUND')
  if (data.email !== undefined && usuariosGestoresMock.some(gestor => gestor.usuario.id !== id && gestor.usuario.email.trim().toLowerCase() === data.email!.trim().toLowerCase())) throw new Error('EMAIL_EXISTS')
  if (data.setor_id !== undefined && !setoresMock.some(setor => setor.id === data.setor_id && setor.ativo)) throw new Error('SETOR_NOT_FOUND')
  item.usuario = { ...item.usuario, ...data }
  return item.usuario
}

async function excluirGestorMock(id: number): Promise<void> {
  const indice = usuariosGestoresMock.findIndex(item => item.usuario.id === id)
  if (indice < 0) throw new Error('USER_NOT_FOUND')
  usuariosGestoresMock[indice].usuario = { ...usuariosGestoresMock[indice].usuario, ativo: false }
}

export const mockApi = {
  setores: { listar: async () => setoresMock, obter: async (slug: string) => setorPorSlug(slug), fluxo: async (slug: string): Promise<FluxoPesquisa> => fluxoMock(setorPorSlug(slug)), pergunta: async (slug: string, numero: number) => { const fluxo = fluxoMock(setorPorSlug(slug)); const pergunta = fluxo.fluxo.find(item => item.numero === numero); if (!pergunta) throw new Error('PERGUNTA_NOT_FOUND'); return { pergunta, numero, total: fluxo.fluxo.length, opcoes: pergunta.opcoes } } },
  pesquisas: {
    criar: async ({ setor_id }: CriarPesquisa): Promise<PesquisaCriada> => { ultimaNotaNps = undefined; return { pesquisa_id: pesquisaSequencia++, token: 'mock-token', setor: setoresMock.find(s => s.id === setor_id)! } },
    responder: async (_id: number, perguntaId: number, data: { valor?: number }) => { if (perguntaId === 99) ultimaNotaNps = data.valor; return { ok: true, proximaPergunta: null, mediaParcial: 4, ultima: perguntaId === 99 } },
    finalizar: async (_id: number): Promise<ResultadoFinalizacao> => ultimaNotaNps !== undefined && ultimaNotaNps <= 6 ? { destino: 'ouvidoria', motivo: 'Gostaríamos de entender melhor sua experiência.' } : { destino: 'agradecimento', motivo: 'Avaliação concluída' },
    abandonar: async (_id: number) => ({ ok: true as const, status: 'parcial' as const }),
    progresso: async (_id: number) => ({ status: 'em_andamento', respondidas: [], total: 3 }),
    manifestacao: async (id: number, data: CriarManifestacao): Promise<ResultadoManifestacao> => {
      const quantidade = manifestacoesPorPesquisa.get(id) ?? 0
      if (quantidade >= 3) throw erroApiMock('Você já enviou o limite de mensagens desta pesquisa.', 409, 'MANIFESTACAO_LIMITE')
      if (!data.contato && data.descricao.trim().length < 5) throw erroApiMock('A descrição precisa ter ao menos 5 caracteres.', 400, 'VALIDATION_ERROR', { fieldErrors: { descricao: ['Escreva pelo menos 5 caracteres.'] } })
      if (data.contato && ![10, 11].includes(data.contato.telefone.replace(/\D/g, '').replace(/^55/, '').length)) throw erroApiMock('O telefone precisa conter DDD e número.', 400, 'VALIDATION_ERROR', { fieldErrors: { telefone: ['Digite um telefone com DDD.'] } })
      manifestacoesPorPesquisa.set(id, quantidade + 1)
      const item: Manifestacao = { id: Math.max(0, ...manifestacoes.map(value => value.id)) + 1, tipo: data.tipo, descricao: data.descricao, status: 'aberta', created_at: new Date().toISOString(), paciente: data.contato ? { nome: data.contato.nome, telefone: data.contato.telefone, consentimento: true } : null }
      manifestacoes.unshift(item)
      return { id: item.id, tipo: item.tipo, status: item.status, contato_registrado: Boolean(data.contato) }
    }
  },
  tvwall: async (): Promise<TvWall> => tvWallMock,
  tvwallPublico: async (_chave: string): Promise<TvWall> => tvWallMock,
  auth: { login: async (email: string, senha: string): Promise<LoginResposta> => { const usuario = usuariosGestoresMock.find(item => item.usuario.ativo !== false && item.usuario.email.toLowerCase() === email.toLowerCase() && item.senha === senha); if (!usuario) throw new Error('INVALID_CREDENTIALS'); usuarioMockAtualId = usuario.usuario.id; return { token: `mock-jwt-${usuario.usuario.id}`, usuario: usuario.usuario } }, me: async (): Promise<{ usuario: Usuario }> => ({ usuario: usuariosGestoresMock.find(item => item.usuario.id === usuarioMockAtualId)?.usuario ?? usuarioSuper }), alterarSenha: async ({ senha_atual, nova_senha }: { senha_atual: string; nova_senha: string }) => { const item = usuariosGestoresMock.find(value => value.usuario.id === usuarioMockAtualId); if (!item || item.senha !== senha_atual || nova_senha.length < 8 || nova_senha.length > 72) throw new Error('INVALID_PASSWORD'); item.senha = nova_senha; return { ok: true as const } } },
  dashboard: { setores: async (_filtros = {}): Promise<DashboardSetor[]> => tvWallMock.setores.map((setor, index) => ({ setor_id: index + 1, nome: setor.nome, nps: setor.nps, media: 4.1 })), turnos: async (_id?: number, _filtros = {}): Promise<Turno[]> => [{ turno: 'manhã', total: 80, nps: 70, media: 4.2 }], emAndamento: async (_filtros = {}): Promise<PesquisaAndamento[]> => [], equipes: async () => [] },
  manifestacoes: { listar: async (filtros: FiltroManifestacoes = {}): Promise<ListaManifestacoes> => { const filtradas = manifestacoes.filter(item => (!filtros.status || item.status === filtros.status) && (!filtros.tipo || item.tipo === filtros.tipo)).sort((a, b) => Number(a.status !== 'aberta') - Number(b.status !== 'aberta')); const offset = filtros.offset ?? 0; const limit = filtros.limit ?? filtradas.length; return { items: filtradas.slice(offset, offset + limit), total: filtradas.length } }, obter: async (id: number): Promise<Manifestacao> => { const item = manifestacoes.find(m => m.id === id); if (!item) throw new Error('MANIFESTACAO_NOT_FOUND'); return item }, atualizar: async (id: number, data: Partial<Manifestacao>) => { const indice = manifestacoes.findIndex(m => m.id === id); if (indice >= 0) manifestacoes[indice] = { ...manifestacoes[indice], ...data }; return manifestacoes[indice] } },
  exportacoes: { excel: async (filtros: DashboardFiltro = {}): Promise<Blob> => { const linhas = ['Setor,Total de pesquisas,Média das avaliações,NPS', ...linhasExportacaoMock(filtros)]; return new Blob(['\uFEFF', linhas.join('\n')], { type: 'text/csv;charset=utf-8' }) }, pdf: async (_filtros: DashboardFiltro = {}): Promise<Blob> => pdfDemonstracaoMock() },
  admin: { setores: { listar: async () => setoresMock, criar: async (data: { nome: string; slug: string }) => { if (setoresMock.some(setor => setor.slug === data.slug)) throw new Error('SLUG_DUPLICADO'); const setor = { id: setoresMock.length + 1, nome: data.nome, slug: data.slug, url: `/${data.slug}`, qrcode: '', ativo: true }; setoresMock.push(setor); return setor }, atualizar: async (id: number, data: { nome: string; slug: string }) => { if (setoresMock.some(setor => setor.id !== id && setor.slug === data.slug)) throw new Error('SLUG_DUPLICADO'); const indice = setoresMock.findIndex(setor => setor.id === id); if (indice < 0) throw new Error('SETOR_NOT_FOUND'); setoresMock[indice] = { ...setoresMock[indice], ...data, url: `/${data.slug}` }; return setoresMock[indice] }, excluir: async (id: number) => { const indice = setoresMock.findIndex(setor => setor.id === id); if (indice < 0) throw new Error('SETOR_NOT_FOUND'); setoresMock[indice] = { ...setoresMock[indice], ativo: false } }, apagarPermanentemente: async (id: number) => { const indice = setoresMock.findIndex(setor => setor.id === id); if (indice < 0) throw new Error('SETOR_NOT_FOUND'); setoresMock.splice(indice, 1); perguntasMock = perguntasMock.filter(pergunta => pergunta.setor_id !== id) } }, perfis: async () => [], usuarios: { listar: async (incluirInativos = false) => usuariosGestoresMock.filter(item => incluirInativos || item.usuario.ativo !== false).map(item => item.usuario), criar: criarGestorMock, atualizar: atualizarGestorMock, excluir: excluirGestorMock, redefinirSenha: async (id: number, senha: string) => { const item = usuariosGestoresMock.find(value => value.usuario.id === id && value.usuario.ativo !== false); if (!item) throw new Error('USER_NOT_FOUND'); if (senha.length < 8 || senha.length > 72) throw new Error('VALIDATION_ERROR'); item.senha = senha; return { ok: true as const } }, reativar: async (id: number) => { const item = usuariosGestoresMock.find(value => value.usuario.id === id); if (!item) throw new Error('USER_NOT_FOUND'); item.usuario = { ...item.usuario, ativo: true }; return { ok: true as const } } }, perguntas: { listar: async (): Promise<Pergunta[]> => [...perguntasMock].sort((a, b) => Number(a.geral) - Number(b.geral) || a.ordem - b.ordem), criar: async (data: object) => { const pergunta = data as { texto: string; setor_id: number; tipo: Pergunta['tipo']; opcoes?: Array<{ valor: number; rotulo: string; emoji?: string }> }; const doSetor = perguntasMock.filter(item => item.setor_id === pergunta.setor_id); perguntasMock.push({ id: Math.max(...perguntasMock.map(item => item.id)) + 1, texto: pergunta.texto, tipo: pergunta.tipo, geral: false, setor_id: pergunta.setor_id, ordem: doSetor.length + 1, numero: doSetor.length + 1, ativo: true, opcoes: (pergunta.opcoes ?? []).map((opcao, indice) => ({ ...opcao, id: 1000 + indice, pergunta_id: 0 })) }) }, atualizar: async (id: number, data: object) => { const indice = perguntasMock.findIndex(pergunta => pergunta.id === id); if (indice >= 0) perguntasMock[indice] = { ...perguntasMock[indice], ...(data as Partial<Pergunta>) } }, excluir: async (id: number) => { perguntasMock = perguntasMock.map(pergunta => pergunta.id === id ? { ...pergunta, ativo: false } : pergunta) }, apagarPermanentemente: async (id: number) => { perguntasMock = perguntasMock.filter(pergunta => pergunta.id !== id) }, reordenar: async (data: { perguntas: Array<{ id: number; ordem: number }> }) => { perguntasMock = perguntasMock.map(pergunta => ({ ...pergunta, ordem: data.perguntas.find(item => item.id === pergunta.id)?.ordem ?? pergunta.ordem })) } } },
}
