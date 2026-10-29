import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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

const queryClient = new QueryClient()

export function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter><Routes><Route path="/admin/login" element={<LoginPage />} /><Route path="/admin" element={<Protegido acao="dashboard"><DashboardPage /></Protegido>} /><Route path="/admin/manifestacoes" element={<Protegido acao="manifestacoes"><ManifestacoesPage /></Protegido>} /><Route path="/admin/perguntas" element={<Protegido acao="perguntas"><PerguntasPage /></Protegido>} /><Route path="/admin/setores" element={<Protegido acao="setores"><SetoresPage /></Protegido>} /><Route path="/tvwall" element={<TvWallPage />} /><Route path="/pesquisa/:slug/pergunta/:n" element={<PerguntaPage />} /><Route path="/pesquisa/:slug/final" element={<FinalPage />} /><Route path="/pesquisa/:slug/obrigado" element={<ObrigadoPage />} /><Route path="/:slug" element={<BoasVindasPage />} /><Route path="*" element={<Navigate to="/recepcao" replace />} /></Routes></BrowserRouter></QueryClientProvider>
}
