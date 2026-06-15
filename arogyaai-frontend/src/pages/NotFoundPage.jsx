import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-display text-brand-200 mb-2">404</p>
      <h1 className="text-xl font-semibold text-surface-900 mb-2">Page not found</h1>
      <p className="text-surface-500 text-sm mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
