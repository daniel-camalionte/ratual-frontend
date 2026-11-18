import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { RequireAuth, RequireRole } from '@/lib/auth'

// Toda pagina e carregada sob demanda (code splitting): o bundle inicial fica minimo.
const Dashboard = lazy(() => import('@/pages/DashboardPage'))
const Refrigeradores = lazy(() => import('@/pages/RefrigeradoresPage'))
const RefrigeradorDetalhe = lazy(() => import('@/pages/RefrigeradorDetalhePage'))
const Alertas = lazy(() => import('@/pages/AlertasPage'))
const Cameras = lazy(() => import('@/pages/CamerasPage'))
const Servicos = lazy(() => import('@/pages/ServicosPage'))
const Gestao = lazy(() => import('@/pages/GestaoPage'))
const Conta = lazy(() => import('@/pages/ContaPage'))
const Login = lazy(() => import('@/pages/LoginPage'))
const NotFound = lazy(() => import('@/pages/NotFoundPage'))
// Paginas de referencia do template: so existem em desenvolvimento (fora do bundle de producao).
const FormsBasic = lazy(() => import('@/pages/FormsBasicPage'))
const FormsValidation = lazy(() => import('@/pages/FormsValidationPage'))
const Tables = lazy(() => import('@/pages/TablesPage'))
const Charts = lazy(() => import('@/pages/ChartsPage'))
const UiButtons = lazy(() => import('@/pages/UiButtonsPage'))
const UiCards = lazy(() => import('@/pages/UiCardsPage'))
const UiOverlays = lazy(() => import('@/pages/UiOverlaysPage'))

export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/refrigeradores" element={<Refrigeradores />} />
        <Route path="/refrigeradores/:id" element={<RefrigeradorDetalhe />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/cameras" element={<Cameras />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route
          path="/gestao"
          element={
            <RequireRole role="admin">
              <Gestao />
            </RequireRole>
          }
        />
        <Route path="/conta" element={<Conta />} />
        {import.meta.env.DEV && (
          <>
            <Route path="/formularios/basico" element={<FormsBasic />} />
            <Route path="/formularios/validacao" element={<FormsValidation />} />
            <Route path="/tabelas" element={<Tables />} />
            <Route path="/graficos" element={<Charts />} />
            <Route path="/ui/botoes" element={<UiButtons />} />
            <Route path="/ui/cards" element={<UiCards />} />
            <Route path="/ui/modais" element={<UiOverlays />} />
          </>
        )}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
