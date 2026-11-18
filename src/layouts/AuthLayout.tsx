import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Brand } from '@/components/ui/Brand'

export function AuthLayout() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary p-3">
      <div className="card shadow-sm w-100" style={{ maxWidth: 440 }}>
        <div className="card-body p-4">
          <Link to="/" className="d-flex align-items-center justify-content-center gap-2 mb-4" aria-label="Refrigeração Atual - início">
            <Brand markSize={40} />
          </Link>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
