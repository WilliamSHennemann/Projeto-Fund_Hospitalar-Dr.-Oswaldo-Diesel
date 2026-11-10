import logoFhdod from '../assets/logo-fhdod.png'

export function Marca() {
  return <header className="relative border-b border-warm-100 bg-white px-5 py-3 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-brand-600">
    <div className="mx-auto flex max-w-6xl items-center">
      <img src={logoFhdod} alt="Fundação Hospitalar Dr. Oswaldo Diesel" className="h-auto w-48 max-w-full sm:w-56" />
    </div>
  </header>
}
