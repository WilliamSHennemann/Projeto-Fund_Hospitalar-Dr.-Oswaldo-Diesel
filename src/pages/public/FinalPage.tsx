import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { lerSessao, salvarSessao } from '../../lib/pesquisa-session'
import { Marca } from '../../components/Marca'

type Aba = 'observacao' | 'contato'

export function FinalPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [pronto, setPronto] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [aba, setAba] = useState<Aba>('observacao')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tipo, setTipo] = useState<'elogio' | 'reclamacao' | 'sugestao'>('reclamacao')
  const [descricao, setDescricao] = useState('')
  const [contato, setContato] = useState({ nome: '', nome_mae: '', data_nascimento: '', telefone: '', consentimento: false })

  useEffect(() => {
    const sessao = lerSessao()
    if (!sessao) {
      navigate(`/${slug}`)
      return
    }
    if (sessao.finalizacao) {
      setPronto(true)
      return
    }
    api.pesquisas.finalizar(sessao.pesquisa_id)
      .then(finalizacao => {
        salvarSessao({ ...sessao, finalizacao })
        setPronto(true)
      })
      .catch(() => setErro('Não foi possível concluir sua avaliação. Tente novamente.'))
  }, [navigate, slug])

  async function enviarObservacao() {
    const sessao = lerSessao()
    if (!sessao || descricao.trim().length < 5) {
      setErro('Escreva uma observação com pelo menos 5 caracteres.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await api.pesquisas.manifestacao(sessao.pesquisa_id, { tipo, descricao, anonimo: true })
      navigate(`/pesquisa/${slug}/obrigado`)
    } catch {
      setErro('Não foi possível enviar a observação. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function enviarContato() {
    const sessao = lerSessao()
    if (!sessao || !contato.consentimento || !contato.telefone.trim()) {
      setErro('Informe seu telefone e aceite o consentimento para enviar.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await api.pesquisas.paciente(sessao.pesquisa_id, contato)
      navigate(`/pesquisa/${slug}/obrigado`)
    } catch {
      setErro('Não foi possível enviar o contato. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (!pronto && !erro) return <><Marca /><main className="public-shell"><div className="h-72 animate-pulse rounded-3xl bg-white shadow-card motion-reduce:animate-none" aria-label="Carregando" /></main></>

  if (!mostrarFormulario) return <><Marca /><main className="public-shell sm:pt-14"><section className="rounded-3xl bg-white p-6 shadow-card sm:p-8"><div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-xl text-brand-700" aria-hidden="true">♡</div><h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">Queremos ouvir você</h1><p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">Percebemos que sua experiência não foi a esperada. Sua opinião é importante para melhorarmos o nosso atendimento.</p><p className="mt-5 font-semibold text-ink">Gostaria de nos contar o que aconteceu?</p>{erro && <p role="alert" className="alert-error mt-4">⚠ {erro}</p>}<div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={() => setMostrarFormulario(true)} className="btn-primary">Sim, quero contar</button><button onClick={() => navigate(`/pesquisa/${slug}/obrigado`)} className="btn-secondary">Não, concluir avaliação</button></div></section></main></>

  return <><Marca /><main className="public-shell sm:pt-10"><h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Conte-nos o que aconteceu</h1><p className="mt-3 leading-relaxed text-slate-700">Seu relato é voluntário e nos ajuda a melhorar. Você também pode deixar um contato para a Ouvidoria retornar.</p>{erro && <p role="alert" className="alert-error mt-4">⚠ {erro}</p>}<div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-warm-100 p-1"><button onClick={() => setAba('observacao')} className={`min-h-12 rounded-xl px-2 text-sm font-semibold sm:px-4 sm:text-base ${aba === 'observacao' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-700 hover:bg-white/60'}`}>Deixar uma observação</button><button onClick={() => setAba('contato')} className={`min-h-12 rounded-xl px-2 text-sm font-semibold sm:px-4 sm:text-base ${aba === 'contato' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-700 hover:bg-white/60'}`}>Quero ser contatado</button></div><section className="mt-5 rounded-3xl bg-white p-5 shadow-card sm:p-7">{aba === 'observacao' ? <><label className="block font-semibold">Tipo<select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)} className="field"><option value="reclamacao">Reclamação</option><option value="sugestao">Sugestão</option><option value="elogio">Elogio</option></select></label><label className="mt-4 block font-semibold">Sua observação<textarea value={descricao} onChange={e => setDescricao(e.target.value)} minLength={5} className="field min-h-32 resize-y py-3" /></label><button disabled={enviando} onClick={enviarObservacao} className="btn-primary mt-5 w-full">Enviar observação</button></> : <><p className="rounded-2xl border border-brand-100 bg-brand-50 p-4 leading-relaxed text-brand-800">Seu contato só será usado pela Ouvidoria para retornar.</p>{(['nome', 'nome_mae', 'data_nascimento', 'telefone'] as const).map(campo => <label key={campo} className="mt-4 block font-semibold">{campo === 'nome' ? 'Nome' : campo === 'nome_mae' ? 'Nome da mãe (opcional)' : campo === 'data_nascimento' ? 'Data de nascimento' : 'Telefone'}<input type={campo === 'data_nascimento' ? 'date' : 'text'} value={contato[campo]} onChange={e => setContato({ ...contato, [campo]: e.target.value })} className="field" /></label>)}<label className="mt-5 flex min-h-12 items-start gap-3 rounded-2xl bg-warm-50 p-4 text-base leading-relaxed"><input type="checkbox" checked={contato.consentimento} onChange={e => setContato({ ...contato, consentimento: e.target.checked })} className="mt-1 size-5 shrink-0 accent-brand-600" />Autorizo a Ouvidoria a usar meus dados para contato.</label><button disabled={enviando} onClick={enviarContato} className="btn-primary mt-5 w-full">Enviar contato</button></>}</section><button onClick={() => navigate(`/pesquisa/${slug}/obrigado`)} className="mt-4 min-h-12 w-full font-medium text-slate-700 underline underline-offset-4">Concluir sem enviar nada</button></main></>
}
