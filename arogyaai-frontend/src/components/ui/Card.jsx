import { cn } from '@/utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-surface-100 shadow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn('px-5 pt-5 pb-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn('font-semibold text-surface-900', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children }) {
  return (
    <p className={cn('text-sm text-surface-500 mt-0.5', className)}>
      {children}
    </p>
  )
}

export function CardContent({ className, children }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('px-5 py-4 border-t border-surface-100', className)}>
      {children}
    </div>
  )
}
