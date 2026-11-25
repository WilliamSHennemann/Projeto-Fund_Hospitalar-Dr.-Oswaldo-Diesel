import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { lerSessao, limparSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'
import { BarraPublica } from '../../components/BarraPublica'
import { useSearchParams } from 'react-router-dom'
export function ObrigadoPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const previa = searchParams.get('previa') === '1'
  const [contatoRegistrado] = useState(() => lerSessao()?.contato_registrado === true)
  const estado = location.state as { mensagem?: string; simulacao?: boolean } | null
  const mensagem = estado?.mensagem
  useEffect(() => { if (!previa) limparSessao() }, [previa])
  return <><BarraPublica previa={previa} /><Marca /><main className="public-shell pt-14 text-center sm:pt-20"><section className="rounded-3xl bg-white px-6 py-10 shadow-card sm:px-10"><div className="mx-auto grid size-20 place-items-center rounded-full bg-brand-50 text-5xl" aria-hidden="true">💛</div><h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">{estado?.simulacao ? 'Simulação concluída' : 'Obrigado por sua avaliação!'}</h1><p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">{estado?.simulacao ? 'Esta foi uma simulação. Nada do que você respondeu foi salvo.' : mensagem ?? (contatoRegistrado ? 'Recebemos seu pedido. A Ouvidoria vai ligar para o número informado.' : 'Sua opinião é muito importante para melhorarmos o cuidado com nossos pacientes.')}</p><button onClick={() => navigate(previa ? `/${slug}?previa=1` : `/${slug}`)} className="btn-primary mt-8 w-full">Nova avaliação</button></section></main></>
}
