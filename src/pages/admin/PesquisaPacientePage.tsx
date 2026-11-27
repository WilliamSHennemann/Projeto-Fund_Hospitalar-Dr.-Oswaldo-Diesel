import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { auth } from '../../lib/auth'
import { isGestao } from '../../lib/permissions'
import { Marca } from '../../components/Marca'
import { CabecalhoAdmin } from '../../components/CabecalhoAdmin'
import { NavegacaoAdmin } from '../../components/NavegacaoAdmin'

export function PesquisaPacientePage() {
  const usuario = auth.getUser()
  const gestao = isGestao(usuario) || usuario?.perfil === 'admin_setor'
  const setores = useQuery({ queryKey: ['admin-pesquisa-setores'], queryFn: api.setores.listar })
  const visiveis = gestao ? setores.data?.filter(setor => setor.id === usuario?.setor_id) : setores.data?.filter(setor => setor.ativo)

  async function copiar(url: string) {
    await navigator.clipboard.writeText(url)
  }
  function baixarQr(setorId: number, url: string) {
    const svg = document.getElementById(`qr-paciente-${setorId}`)
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const objeto = URL.createObjectURL(blob)
    const imagem = new Image()
    imagem.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 512; canvas.height = 512
      canvas.getContext('2d')?.drawImage(imagem, 0, 0, 512, 512)
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `qr-${url.split('/').pop()}.png`
      link.click()
      URL.revokeObjectURL(objeto)
    }
    imagem.src = objeto
  }
  function imprimirQr(setorId: number, nome: string) {
    const svg = document.getElementById(`qr-paciente-${setorId}`)
    if (!svg) return
    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(`<!doctype html><html><body><h1>${nome}</h1>${svg.outerHTML}</body></html>`)
    janela.document.close(); janela.focus(); janela.print()
  }

  return <><Marca /><main className="page-shell"><CabecalhoAdmin titulo="Pesquisa do paciente" descricao="Veja a avaliação como o paciente verá e compartilhe o link do setor." /><NavegacaoAdmin /><section className="mt-6 grid gap-4 sm:grid-cols-2">{visiveis?.map(setor => {
    const url = `${location.origin}/${setor.slug}`
    return <article key={setor.id} className="rounded-3xl border border-warm-100 bg-white p-5 shadow-card"><h2 className="text-xl font-bold text-ink">{setor.nome}</h2><p className="mt-2 break-all text-sm text-slate-600">{url}</p><div className="mt-4"><QRCodeSVG id={`qr-paciente-${setor.id}`} value={url} size={160} /></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><Link to={`/${setor.slug}?previa=1`} className="btn-primary min-h-12 text-center">Ver como o paciente vê</Link><Link to={`/${setor.slug}`} className="btn-secondary min-h-12 text-center">Ver perguntas deste setor</Link><button onClick={() => window.open(url, '_self')} className="btn-secondary min-h-12">Abrir link</button><button onClick={() => void copiar(url)} className="btn-secondary min-h-12">Copiar link</button><button onClick={() => baixarQr(setor.id, url)} className="btn-secondary min-h-12">Baixar QR Code</button><button onClick={() => imprimirQr(setor.id, setor.nome)} className="btn-secondary min-h-12">Imprimir QR</button></div><Roteiro slug={setor.slug} /></article>
  })}</section></main></>
}

function Roteiro({ slug }: { slug: string }) {
  const fluxo = useQuery({ queryKey: ['roteiro-paciente', slug], queryFn: () => api.setores.fluxo(slug) })
  if (fluxo.isLoading) return <p className="mt-4 text-slate-600">Carregando roteiro…</p>
  if (!fluxo.data) return null
  return <div className="mt-5 border-t border-warm-100 pt-4"><h3 className="font-bold">Roteiro completo</h3><ol className="mt-3 space-y-2">{fluxo.data.fluxo.map((pergunta, indice) => <li key={pergunta.id} className="rounded-xl bg-warm-50 p-3 text-sm"><strong>{indice + 1}. {pergunta.texto}</strong><br /><span className="text-slate-600">{pergunta.tipo} · {pergunta.opcoes.map(opcao => opcao.rotulo).join(' · ')}</span></li>)}</ol></div>
}
