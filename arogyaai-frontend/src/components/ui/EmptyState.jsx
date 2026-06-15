import { cn } from '@/utils/cn'

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="font-semibold text-surface-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}

export function StatCard({ label, value, subtext, icon: Icon, trend, className }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-surface-100 p-5 shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500">{label}</p>
          <p className="text-2xl font-semibold text-surface-900 mt-1 tabular-nums">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-surface-400 mt-1">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend != null && (
        <p
          className={cn(
            'text-xs mt-3 font-medium',
            trend >= 0 ? 'text-emerald-600' : 'text-red-500'
          )}
        >
          {trend >= 0 ? '+' : ''}
          {trend}% vs last week
        </p>
      )}
    </div>
  )
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl text-surface-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-surface-500 mt-1 text-balance">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
