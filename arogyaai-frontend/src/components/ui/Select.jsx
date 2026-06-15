import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export const Select = forwardRef(function Select(
  { className, label, error, children, id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-surface-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          'w-full h-10 px-3.5 rounded-xl border bg-white text-surface-800 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
          error ? 'border-red-300' : 'border-surface-200',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
