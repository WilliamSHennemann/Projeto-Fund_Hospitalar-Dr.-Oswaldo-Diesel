import logoFhdod from '../assets/logo-fhdod.png'

export function Marca() {
  return <header className="relative border-b border-slate-200/80 bg-white/95 px-5 py-3 shadow-sm backdrop-blur">
    <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1"><span className="w-3/5 bg-brand-600" /><span className="w-1/4 bg-accent-400" /><span className="flex-1 bg-support-600" /></div>
    <div className="mx-auto flex max-w-7xl items-center">
      <img src={logoFhdod} alt="Fundação Hospitalar Dr. Oswaldo Diesel" className="h-auto w-48 max-w-full transition-transform duration-200 hover:scale-[1.02] sm:w-56" />
    </div>
  </header>
}
