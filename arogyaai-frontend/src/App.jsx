import { RouterProvider } from 'react-router-dom'
import { AuthProvider, ToastProvider } from '@/contexts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { router } from '@/routes'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
