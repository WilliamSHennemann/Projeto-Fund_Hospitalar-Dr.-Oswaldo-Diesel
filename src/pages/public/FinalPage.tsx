import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { lerSessao, salvarSessao } from '../../lib/pesquisa-session'
import type { ErroApi, ErrosCamposManifestacao, TipoManifestacao } from '../../types'
import { Marca } from '../../components/Marca'

const telefoneFormatado = (valor: string) => {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

export function FinalPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const sessao = lerSessao()
  const [pronto, setPronto] = useState(Boolean(sessao?.finalizacao))
  const [erro, setErro] = useState('')
  const [erroDescricao, setErroDescricao] = useState('')
  const [erroTelefone, setErroTelefone] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tentativaFinalizacao, setTentativaFinalizacao] = useState(0)
  const [tipo, setTipo] = useState<TipoManifestacao>(sessao?.nps_nota !== undefined ? sessao.nps_nota <= 6 ? 'reclamacao' : sessao.nps_nota <= 8 ? 'sugestao' : 'elogio' : sessao?.finalizacao?.destino === 'ouvidoria' ? 'reclamacao' : 'elogio')
  const [descricao, setDescricao] = useState('')
  const [querContato, setQuerContato] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  useEffect(() => {
    if (!sessao) {
      navigate(`/${slug}`, { replace: true })
      return
    }
    if (sessao.finalizacao) return
    api.pesquisas.finalizar(sessao.pesquisa_id)
      .then(finalizacao => { salvarSessao({ ...sessao, finalizacao }); setPronto(true) })
      .catch(() => setErro('Não foi possível concluir sua avaliação. Tente novamente.'))
  }, [navigate, slug, sessao?.pesquisa_id, Boolean(sessao?.finalizacao), tentativaFinalizacao])

  const mensagem = (sessao?.nps_nota !== undefined ? sessao.nps_nota <= 6 : sessao?.finalizacao?.destino === 'ouvidoria')
    ? 'Sentimos muito que sua experiência não tenha sido boa. Quer nos contar o que aconteceu?'
    : sessao?.nps_nota !== undefined && sessao.nps_nota <= 8
      ? 'Quer deixar uma sugestão para melhorarmos?'
      : 'Que bom! Quer deixar um elogio?'

  async function enviar() {
    const sessaoAtual = lerSessao()
    setErro('')
    setErroDescricao('')
    setErroTelefone('')
    if (!sessaoAtual) {
      navigate(`/${slug}`, { replace: true })
      return
    }
    if (!querContato && descricao.trim().length < 5) {
      setErroDescricao('Escreva pelo menos 5 caracteres ou marque a opção para receber contato.')
      return
    }
    const digitos = telefone.replace(/\D/g, '')
    if (querContato && (digitos.length < 10 || digitos.length > 11)) {
      setErroTelefone('Digite o telefone com DDD, por exemplo (11) 91234-5678.')
      return
    }
    setEnviando(true)
    try {
      const resultado = await api.pesquisas.manifestacao(sessaoAtual.pesquisa_id, {
        tipo,
        descricao: descricao.trim(),
        ...(querContato ? { contato: { ...(nome.trim() ? { nome: nome.trim() } : {}), telefone, consentimento: true as const } } : {}),
      })
      sessaoAtual.contato_registrado = resultado.contato_registrado
      salvarSessao(sessaoAtual)
      navigate(`/pesquisa/${slug}/obrigado`)
    } catch (error) {
      if (isAxiosError<ErroApi>(error) && error.response?.status === 409 && error.response.data?.codigo === 'MANIFESTACAO_LIMITE') {
        setErro('Você já enviou sua mensagem. Obrigado!')
        navigate(`/pesquisa/${slug}/obrigado`, { state: { mensagem: 'Você já enviou sua mensagem. Obrigado!' } })
        return
      }
      if (isAxiosError<ErroApi>(error) && error.response?.data?.codigo === 'VALIDATION_ERROR') {
        const campos = error.response.data.detalhes as { fieldErrors?: ErrosCamposManifestacao } | undefined
        setErroDescricao(campos?.fieldErrors?.descricao?.[0] ?? '')
        setErroTelefone(campos?.fieldErrors?.telefone?.[0] ?? '')
        setErro(campos?.fieldErrors?.consentimento?.[0] ?? '')
      } else {
        setErro('Não foi possível enviar. Verifique a internet e toque em Tentar novamente.')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (!pronto && !erro) return <><Marca /><main className="public-shell"><div className="h-72 animate-pulse rounded-3xl bg-white shadow-card motion-reduce:animate-none" aria-label="Carregando" /></main></>
  if (erro === 'Não foi possível concluir sua avaliação. Tente novamente.') return <><Marca /><main className="public-shell"><section className="card"><p role="alert" className="alert-error">{erro}</p><button className="btn-primary mt-5 w-full" onClick={() => { setErro(''); setPronto(false); setTentativaFinalizacao(value => value + 1) }}>Tentar novamente</button></section></main></>

  return <><Marca /><main className="public-shell sm:pt-10"><section className="rounded-3xl bg-white p-5 shadow-card sm:p-8">
    <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Sua opinião</p>
    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{mensagem}</h1>
    <fieldset className="mt-6"><legend className="text-base font-bold text-ink">Escolha uma opção</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{([
      ['elogio', 'Elogio', 'bg-emerald-50 border-emerald-200'],
      ['sugestao', 'Sugestão', 'bg-amber-50 border-amber-200'],
      ['reclamacao', 'Reclamação', 'bg-rose-50 border-rose-200'],
    ] as const).map(([valor, rotulo, cor]) => <button key={valor} type="button" aria-pressed={tipo === valor} onClick={() => setTipo(valor)} className={`min-h-14 rounded-2xl border px-4 text-lg font-bold ${tipo === valor ? 'border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-300' : `${cor} text-ink`}`}>{rotulo}</button>)}</div></fieldset>
    <label className="mt-6 block text-base font-semibold" htmlFor="descricao">Escreva aqui (opcional)<textarea id="descricao" maxLength={2000} value={descricao} onChange={event => setDescricao(event.target.value)} className="field mt-2 min-h-32 resize-y py-3" /></label>
    <p className="mt-1 text-right text-sm text-slate-600">{descricao.length}/2000</p>
    {erroDescricao && <p role="alert" className="mt-2 text-base font-semibold text-red-800">{erroDescricao}</p>}
    <label className="mt-5 flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-warm-50 p-4 text-base leading-relaxed"><input type="checkbox" checked={querContato} onChange={event => setQuerContato(event.target.checked)} className="mt-1 size-6 shrink-0 accent-brand-600" />Quero que a Ouvidoria entre em contato comigo</label>
    {querContato && <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4">
      <label className="block text-base font-semibold">Nome (opcional)<input maxLength={120} autoComplete="name" value={nome} onChange={event => setNome(event.target.value)} className="field mt-2" /></label>
      <label className="mt-4 block text-base font-semibold">Telefone com DDD (obrigatório)<input type="tel" inputMode="tel" autoComplete="tel" value={telefone} onChange={event => { setTelefone(telefoneFormatado(event.target.value)); setErroTelefone('') }} placeholder="(11) 91234-5678" className="field mt-2" /></label>
      {erroTelefone && <p role="alert" className="mt-2 text-base font-semibold text-red-800">{erroTelefone}</p>}
      <p className="mt-4 text-base leading-relaxed text-slate-800">Autorizo a Ouvidoria do hospital a usar meu telefone apenas para retornar este contato.</p>
    </div>}
    {erro && <p role="alert" className="alert-error mt-4">{erro}</p>}
    <button disabled={enviando || !pronto} onClick={() => void enviar()} className="btn-primary mt-6 w-full text-lg">{enviando ? 'Enviando…' : 'Enviar'}</button>
    <button disabled={enviando} onClick={() => navigate(`/pesquisa/${slug}/obrigado`)} className="btn-secondary mt-3 min-h-12 w-full">Não quero enviar, terminar</button>
  </section></main></>
}
