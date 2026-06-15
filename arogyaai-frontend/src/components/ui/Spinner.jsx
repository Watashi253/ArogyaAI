import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Spinner({ className, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <Loader2 className={cn('animate-spin text-brand-600', sizes[size], className)} />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-surface-500">Loading...</p>
      </div>
    </div>
  )
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-2xl">
      <div className="text-center">
        <Spinner />
        <p className="mt-2 text-sm text-surface-500">{message}</p>
      </div>
    </div>
  )
}
