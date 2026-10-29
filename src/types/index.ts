export type Perfil = 'super_admin' | 'ouvidoria' | 'gestao' | 'admin_setor' | 'visualizador'
export type Acao = 'dashboard' | 'manifestacoes' | 'exportacoes' | 'jobs' | 'perguntas' | 'setores' | 'usuarios' | 'perfis' | 'limiares'
export type TipoPergunta = 'rostinho' | 'nps' | 'texto' | 'multipla'
export type StatusManifestacao = 'aberta' | 'em_tratamento' | 'concluida'
export type TipoManifestacao = 'elogio' | 'reclamacao' | 'sugestao'

export interface ErroApi { erro: string; codigo: string; detalhes?: unknown }
export interface Setor { id: number; nome: string; slug: string; url: string; qrcode: string; ativo: boolean }
export interface OpcaoResposta { id: number; pergunta_id: number; valor: number; rotulo: string; emoji?: string }
export interface Pergunta { id: number; texto: string; tipo: TipoPergunta; geral: boolean; setor_id?: number | null; ordem: number; numero: number; obrigatoria?: boolean; url?: string; opcoes: OpcaoResposta[]; ativo?: boolean }
export interface FluxoPesquisa { setor: Setor; fluxo: Pergunta[] }
/** O backend atual retorna o slug; o mock também aceita o objeto completo. */
export interface PesquisaCriada { pesquisa_id: number; token: string; setor: Setor | string }
export interface CriarPesquisa { setor_id: number; anonimo: boolean; consentimento: boolean; data_atendimento: string }
export interface RespostaEnviada { ok: boolean; proximaPergunta: number | null; mediaParcial: number | null; ultima: boolean }
export interface ResultadoFinalizacao { destino: 'ouvidoria' | 'agradecimento'; motivo: string }
export interface Usuario { id: number; nome: string; email: string; perfil: Perfil; permissoes: string[]; setor_id?: number }
export interface LoginResposta { token: string; usuario: Usuario }
export interface DashboardResumo { nps_geral: number; media_geral: number; total_pesquisas: number; percentual_parciais: number; periodo: string }
export interface DashboardSetor { setor_id: number; nome: string; nps: number; media: number | null }
export interface DashboardFiltro { inicio?: string; fim?: string; setor_id?: number }
export interface Turno { turno: string; total: number; nps: number; media: number }
export interface PesquisaAndamento { id: number; setor_id: number; media_parcial: number | null; ultima_atividade: string; status: string }
export interface Manifestacao { id: number; tipo: TipoManifestacao; descricao: string; status: StatusManifestacao; setor?: Setor; created_at?: string; data?: string; parecer_interno?: string; pesquisa?: { id: number; nps_nota?: number | null; media_parcial?: number | null }; respostas?: Array<{ pergunta_id: number; valor?: number | null; texto?: string | null }>; paciente?: { nome?: string; telefone?: string; consentimento: boolean } | null }
export interface TvWall { nps_geral: number; media_geral: number; setores: Array<{ nome: string; slug: string; nps: number }>; elogios_gerais: number; cache_seconds: number }
