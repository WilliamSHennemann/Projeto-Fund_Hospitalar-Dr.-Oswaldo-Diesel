import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'

export function AlterarSenha() {
  const [aberto, setAberto] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErro(''); setSucesso('')
    if (novaSenha.length < 8 || novaSenha.length > 72) { setErro('A nova senha deve ter entre 8 e 72 caracteres.'); return }
    if (novaSenha !== confirmacao) { setErro('As senhas novas não são iguais.'); return }
    setSalvando(true)
    try { await api.auth.alterarSenha({ senha_atual: senhaAtual, nova_senha: novaSenha }); setSucesso('Sua senha foi alterada.'); setSenhaAtual(''); setNovaSenha(''); setConfirmacao('') }
    catch { setErro('Não foi possível alterar a senha. Confira a senha atual e tente novamente.') }
    finally { setSalvando(false) }
  }

  return <>
    <button onClick={() => { setAberto(true); setErro(''); setSucesso('') }} className="min-h-12 rounded-xl border border-white/30 bg-white/10 px-4 text-base font-semibold text-white hover:bg-white/20">Alterar minha senha</button>
    {aberto && <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/60 p-4 text-ink"><form onSubmit={event => void salvarSenha(event)} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-card"><h2 className="text-xl font-bold">Alterar minha senha</h2><label className="mt-5 block font-semibold">Senha atual<input required type="password" autoComplete="current-password" value={senhaAtual} onChange={event => setSenhaAtual(event.target.value)} className="field" /></label><label className="mt-4 block font-semibold">Nova senha<input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={novaSenha} onChange={event => setNovaSenha(event.target.value)} className="field" /></label><label className="mt-4 block font-semibold">Confirme a nova senha<input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={confirmacao} onChange={event => setConfirmacao(event.target.value)} className="field" /></label>{erro && <p role="alert" className="alert-error mt-4">{erro}</p>}{sucesso && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-900">{sucesso}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setAberto(false)} className="btn-secondary">Fechar</button><button disabled={salvando} className="btn-primary">{salvando ? 'Salvando…' : 'Alterar senha'}</button></div></form></div>}
  </>
}
