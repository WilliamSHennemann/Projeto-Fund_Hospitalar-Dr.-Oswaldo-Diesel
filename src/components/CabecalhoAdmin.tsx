import { AlterarSenha } from './AlterarSenha'

type Props = {
  titulo: string
  descricao: string
  eyebrow?: string
}

export function CabecalhoAdmin({ titulo, descricao, eyebrow = 'Gestão do sistema' }: Props) {
  return <header className="relative isolate overflow-hidden rounded-[2rem] bg-ink px-6 py-7 text-white shadow-card sm:px-8 sm:py-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/3 overflow-hidden lg:block"><span className="absolute -right-14 -top-24 size-56 rounded-full bg-accent-400/45" /><span className="absolute -bottom-32 right-12 size-56 rounded-full bg-support-600/40" /></div>
    <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-400">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{titulo}</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-white/75">{descricao}</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end"><span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white">SGEP · FHDOD</span><AlterarSenha /></div>
    </div>
  </header>
}
