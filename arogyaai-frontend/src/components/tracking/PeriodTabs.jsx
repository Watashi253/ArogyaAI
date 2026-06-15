import { cn } from '@/utils/cn'

export function PeriodTabs({ value, onChange, className }) {
  const periods = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ]

  return (
    <div className={cn('inline-flex rounded-xl bg-surface-100 p-1', className)}>
      {periods.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
            value === p.key
              ? 'bg-white text-surface-900 shadow-soft'
              : 'text-surface-500 hover:text-surface-700'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
