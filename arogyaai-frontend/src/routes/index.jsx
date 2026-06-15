import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/ui'
import { ProtectedRoute, PublicRoute, OnboardingRoute } from '@/components/ProtectedRoute'
import { DashboardLayout, AuthLayout } from '@/layouts'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const OnboardingPage = lazy(() => import('@/pages/onboarding/OnboardingPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const NutritionPage = lazy(() => import('@/pages/nutrition/NutritionPage'))
const WaterPage = lazy(() => import('@/pages/water/WaterPage'))
const SleepPage = lazy(() => import('@/pages/sleep/SleepPage'))
const ActivityPage = lazy(() => import('@/pages/activity/ActivityPage'))
const MedicinesPage = lazy(() => import('@/pages/medicines/MedicinesPage'))
const RecordsPage = lazy(() => import('@/pages/records/RecordsPage'))
const InsightsPage = lazy(() => import('@/pages/insights/InsightsPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LazyPage><LoginPage /></LazyPage>,
          },
          {
            path: '/signup',
            element: <LazyPage><SignupPage /></LazyPage>,
          },
          {
            path: '/forgot-password',
            element: <LazyPage><ForgotPasswordPage /></LazyPage>,
          },
          {
            path: '/reset-password',
            element: <LazyPage><ResetPasswordPage /></LazyPage>,
          },
        ],
      },
    ],
  },
  {
    element: <OnboardingRoute />,
    children: [
      {
        path: '/onboarding',
        element: <LazyPage><OnboardingPage /></LazyPage>,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <LazyPage><DashboardPage /></LazyPage> },
          { path: 'nutrition', element: <LazyPage><NutritionPage /></LazyPage> },
          { path: 'water', element: <LazyPage><WaterPage /></LazyPage> },
          { path: 'sleep', element: <LazyPage><SleepPage /></LazyPage> },
          { path: 'activity', element: <LazyPage><ActivityPage /></LazyPage> },
          { path: 'medicines', element: <LazyPage><MedicinesPage /></LazyPage> },
          { path: 'records', element: <LazyPage><RecordsPage /></LazyPage> },
          { path: 'insights', element: <LazyPage><InsightsPage /></LazyPage> },
          { path: 'profile', element: <LazyPage><ProfilePage /></LazyPage> },
        ],
      },
    ],
  },
  {
    path: '/404',
    element: <LazyPage><NotFoundPage /></LazyPage>,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
])
