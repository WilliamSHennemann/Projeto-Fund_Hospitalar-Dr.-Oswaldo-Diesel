import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { HomePage, NotFoundPage } from '../pages/public/HomePage'
import { BoasVindasPage } from '../pages/public/BoasVindasPage'
import { PerguntaPage } from '../pages/public/PerguntaPage'
import { FinalPage } from '../pages/public/FinalPage'
import { ObrigadoPage } from '../pages/public/ObrigadoPage'
import { LoginPage } from '../pages/admin/LoginPage'
import { DashboardPage } from '../pages/admin/DashboardPage'
import { Protegido } from '../components/Protegido'
import { PerguntasPage, SetoresPage } from '../pages/admin/GestaoPages'
import { ManifestacoesPage } from '../pages/admin/ManifestacoesPage'
import { TvWallPage } from '../pages/public/TvWallPage'
import { UsuariosPage } from '../pages/admin/UsuariosPage'
import { DocsRedirect } from '../pages/public/DocsRedirect'

const queryClient = new QueryClient()

function SessionExpiredHandler() {
  const navigate = useNavigate()
  useEffect(() => {
    const handle = () => navigate('/admin/login', { replace: true, state: { mensagem: 'Sua sessão expirou. Entre novamente.' } })
    window.addEventListener('sgep:session-expired', handle)
    return () => window.removeEventListener('sgep:session-expired', handle)
  }, [navigate])
  return null
}

function TvWallRoute() {
  const [params] = useSearchParams()
  return params.get('chave') ? <TvWallPage /> : <Protegido acao="dashboard"><TvWallPage /></Protegido>
}

export function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter><SessionExpiredHandler /><Routes><Route path="/" element={<HomePage />} /><Route path="/admin/login" element={<LoginPage />} /><Route path="/admin" element={<Protegido acao="dashboard"><DashboardPage /></Protegido>} /><Route path="/admin/manifestacoes" element={<Protegido acao="manifestacoes"><ManifestacoesPage /></Protegido>} /><Route path="/admin/perguntas" element={<Protegido acao="perguntas"><PerguntasPage /></Protegido>} /><Route path="/admin/setores" element={<Protegido acao="setores"><SetoresPage /></Protegido>} /><Route path="/admin/usuarios" element={<Protegido acao="usuarios"><UsuariosPage /></Protegido>} /><Route path="/tvwall" element={<TvWallRoute />} /><Route path="/docs" element={<DocsRedirect />} /><Route path="/pesquisa/:slug/pergunta/:n" element={<PerguntaPage />} /><Route path="/pesquisa/:slug/final" element={<FinalPage />} /><Route path="/pesquisa/:slug/obrigado" element={<ObrigadoPage />} /><Route path="/:slug" element={<BoasVindasPage />} /><Route path="*" element={<NotFoundPage />} /></Routes></BrowserRouter></QueryClientProvider>
}
