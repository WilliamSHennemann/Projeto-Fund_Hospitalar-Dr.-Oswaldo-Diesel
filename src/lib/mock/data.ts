import type { FluxoPesquisa, Setor, TvWall } from '../../types'

export const setoresMock: Setor[] = [
  { id: 1, nome: 'Recepção', slug: 'recepcao', url: '/recepcao', qrcode: '', ativo: true },
  { id: 2, nome: 'Triagem', slug: 'triagem', url: '/triagem', qrcode: '', ativo: true },
  { id: 3, nome: 'Enfermagem', slug: 'enfermagem', url: '/enfermagem', qrcode: '', ativo: true },
  { id: 4, nome: 'Médico', slug: 'medico', url: '/medico', qrcode: '', ativo: true },
  { id: 5, nome: 'Internação', slug: 'internacao', url: '/internacao', qrcode: '', ativo: true },
  { id: 6, nome: 'Raio-X', slug: 'raio-x', url: '/raio-x', qrcode: '', ativo: true }
]
const rostinhos = [
  { id: 1, pergunta_id: 1, valor: 1, rotulo: 'Muito ruim', emoji: '😡' }, { id: 2, pergunta_id: 1, valor: 2, rotulo: 'Ruim', emoji: '🙁' }, { id: 3, pergunta_id: 1, valor: 3, rotulo: 'Neutro', emoji: '😐' }, { id: 4, pergunta_id: 1, valor: 4, rotulo: 'Bom', emoji: '🙂' }, { id: 5, pergunta_id: 1, valor: 5, rotulo: 'Muito bom', emoji: '😍' }
]
export function fluxoMock(setor: Setor): FluxoPesquisa {
  return { setor, fluxo: [
    { id: 1, texto: 'Como você avalia o atendimento recebido?', tipo: 'rostinho', geral: false, ordem: 1, numero: 1, opcoes: rostinhos },
    { id: 2, texto: 'Como você avalia o tempo de espera?', tipo: 'rostinho', geral: false, ordem: 2, numero: 2, opcoes: rostinhos.map(o => ({ ...o, id: o.id + 10, pergunta_id: 2 })) },
    { id: 99, texto: 'De 0 a 10, quanto você recomendaria nosso hospital?', tipo: 'nps', geral: true, ordem: 3, numero: 3, opcoes: Array.from({ length: 11 }, (_, valor) => ({ id: 100 + valor, pergunta_id: 99, valor, rotulo: String(valor) })) }
  ] }
}
export const tvWallMock: TvWall = { nps_geral: 72, media_geral: 4.3, setores: setoresMock.map((setor, index) => ({ nome: setor.nome, slug: setor.slug, nps: 62 + index * 5 })), elogios_gerais: 128, cache_seconds: 30 }
