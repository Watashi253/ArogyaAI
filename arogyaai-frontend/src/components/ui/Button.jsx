import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 shadow-soft active:scale-[0.98]',
  secondary:
    'bg-white text-surface-700 border border-surface-200 hover:bg-surface-50 shadow-soft',
  ghost: 'text-surface-600 hover:bg-surface-100 hover:text-surface-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-soft',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
}

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
