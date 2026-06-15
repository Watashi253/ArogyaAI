import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export const Textarea = forwardRef(function Textarea(
  { className, label, error, id, rows = 3, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border bg-white text-surface-800 text-sm resize-none',
          'placeholder:text-surface-400 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
          error ? 'border-red-300' : 'border-surface-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
