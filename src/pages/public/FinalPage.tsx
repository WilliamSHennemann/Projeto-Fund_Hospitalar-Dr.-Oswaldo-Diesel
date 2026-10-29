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

  if (!pronto && !erro) return <><Marca /><main className="mx-auto max-w-xl p-6"><div className="h-72 animate-pulse rounded-3xl bg-slate-200" /></main></>

  if (!mostrarFormulario) return <><Marca /><main className="mx-auto max-w-xl p-5 sm:pt-14"><section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100"><h1 className="text-3xl font-bold text-slate-800">Queremos ouvir você</h1><p className="mt-4 text-lg leading-relaxed text-slate-600">Percebemos que sua experiência não foi a esperada. Sua opinião é importante para melhorarmos o nosso atendimento.</p><p className="mt-5 font-semibold text-slate-800">Gostaria de nos contar o que aconteceu?</p>{erro && <p role="alert" className="mt-4 text-red-700">{erro}</p>}<div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={() => setMostrarFormulario(true)} className="min-h-12 rounded-xl bg-hospital-600 px-5 font-bold text-white hover:bg-hospital-800">Sim, quero contar</button><button onClick={() => navigate(`/pesquisa/${slug}/obrigado`)} className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700">Não, concluir avaliação</button></div></section></main></>

  return <><Marca /><main className="mx-auto max-w-xl p-4 sm:p-5 sm:pt-10"><h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">Conte-nos o que aconteceu</h1><p className="mt-3 text-slate-600">Seu relato é voluntário e nos ajuda a melhorar. Você também pode deixar um contato para a Ouvidoria retornar.</p>{erro && <p role="alert" className="mt-4 text-red-700">{erro}</p>}<div className="mt-7 flex border-b border-slate-200"><button onClick={() => setAba('observacao')} className={`min-h-12 flex-1 px-2 text-sm font-semibold sm:px-4 sm:text-base ${aba === 'observacao' ? 'border-b-2 border-hospital-600 text-hospital-800' : 'text-slate-500'}`}>Deixar uma observação</button><button onClick={() => setAba('contato')} className={`min-h-12 flex-1 px-2 text-sm font-semibold sm:px-4 sm:text-base ${aba === 'contato' ? 'border-b-2 border-hospital-600 text-hospital-800' : 'text-slate-500'}`}>Quero ser contatado</button></div>{aba === 'observacao' ? <section className="mt-6"><label className="block font-semibold">Tipo<select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3"><option value="reclamacao">Reclamação</option><option value="sugestao">Sugestão</option><option value="elogio">Elogio</option></select></label><label className="mt-4 block font-semibold">Sua observação<textarea value={descricao} onChange={e => setDescricao(e.target.value)} minLength={5} className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 p-3" /></label><button disabled={enviando} onClick={enviarObservacao} className="mt-5 min-h-12 w-full rounded-xl bg-hospital-600 font-bold text-white hover:bg-hospital-800 disabled:opacity-50">Enviar observação</button></section> : <section className="mt-6"><p className="rounded-xl bg-hospital-50 p-4 text-sm text-hospital-800">Seu contato só será usado pela Ouvidoria para retornar.</p>{(['nome', 'nome_mae', 'data_nascimento', 'telefone'] as const).map(campo => <label key={campo} className="mt-4 block font-semibold">{campo === 'nome' ? 'Nome' : campo === 'nome_mae' ? 'Nome da mãe (opcional)' : campo === 'data_nascimento' ? 'Data de nascimento' : 'Telefone'}<input type={campo === 'data_nascimento' ? 'date' : 'text'} value={contato[campo]} onChange={e => setContato({ ...contato, [campo]: e.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3" /></label>)}<label className="mt-5 flex gap-3 text-sm"><input type="checkbox" checked={contato.consentimento} onChange={e => setContato({ ...contato, consentimento: e.target.checked })} className="size-5 accent-yellow-600" />Autorizo a Ouvidoria a usar meus dados para contato.</label><button disabled={enviando} onClick={enviarContato} className="mt-5 min-h-12 w-full rounded-xl bg-hospital-600 font-bold text-white hover:bg-hospital-800 disabled:opacity-50">Enviar contato</button></section>}<button onClick={() => navigate(`/pesquisa/${slug}/obrigado`)} className="mt-5 min-h-12 w-full text-slate-600 underline">Concluir sem enviar nada</button></main></>
}
