import logoFhdod from '../assets/logo-fhdod.png'

export function Marca() {
  return <header className="border-b border-slate-100 bg-white px-5 py-3">
    <div className="mx-auto max-w-3xl">
      <img src={logoFhdod} alt="Fundação Hospitalar Dr. Oswaldo Diesel" className="h-auto w-52 max-w-full" />
    </div>
  </header>
}
