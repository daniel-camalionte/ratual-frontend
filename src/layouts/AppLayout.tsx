import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Topbar } from '@/components/layout/Topbar'
import { HorizontalNav } from '@/components/layout/HorizontalNav'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function AppLayout() {
  return (
    <div id="main-wrapper">
      <div className="page-wrapper">
        <Topbar />
        <HorizontalNav />
        <main className="body-wrapper" id="conteudo">
          <div className="container-fluid">
            <ErrorBoundary>
              <Suspense fallback={<Spinner />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
        <footer className="text-center text-muted py-4 small">© {new Date().getFullYear()} Ratual</footer>
      </div>
    </div>
  )
}
