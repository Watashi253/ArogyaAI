import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui'

export function ProtectedRoute({ requireProfile = true }) {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireProfile && needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export function PublicRoute() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <PageLoader />
  }

  if (isAuthenticated) {
    const destination = needsOnboarding ? '/onboarding' : (location.state?.from?.pathname || '/')
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}

export function OnboardingRoute() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!needsOnboarding) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
