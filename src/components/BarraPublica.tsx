import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/auth'
import { pode } from '../lib/permissions'

export function BarraPublica({ previa = false }: { previa?: boolean }) {
  const usuario = auth.getUser()
  const navigate = useNavigate()
  function voltarAoPainel() {
    if (!usuario) return
    const destino = pode(usuario, 'dashboard') ? '/admin'
      : pode(usuario, 'perguntas') ? '/admin/perguntas'
      : pode(usuario, 'manifestacoes') ? '/admin/manifestacoes'
      : '/admin'
    navigate(destino)
  }
  if (previa) return <div className="sticky top-0 z-30 flex min-h-12 flex-wrap items-center justify-between gap-2 bg-amber-300 px-4 py-2 text-ink shadow-sm"><strong>MODO PRÉVIA — nada do que você responder será salvo</strong>{usuario ? <button onClick={voltarAoPainel} className="min-h-11 rounded-xl bg-white px-4 font-bold">Voltar ao painel</button> : <button onClick={() => navigate('/', { replace: true })} className="min-h-11 rounded-xl bg-white px-4 font-bold">Sair da prévia</button>}</div>
  if (!usuario) return null
  return <div className="sticky top-0 z-30 flex min-h-12 flex-wrap items-center justify-between gap-2 bg-brand-50 px-4 py-2 text-ink shadow-sm"><span>Você está logado como <strong>{usuario.nome}</strong></span><button onClick={voltarAoPainel} className="min-h-11 rounded-xl border border-brand-300 bg-white px-4 font-bold text-brand-900">Voltar ao painel</button></div>
}
