import { cn } from '@/utils/cn'

export function MacroStat({ label, value, unit, subtext, className }) {
  return (
    <div className={cn('rounded-2xl bg-white border border-surface-100 p-4 shadow-card', className)}>
      <p className="text-xs font-medium text-surface-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-surface-900 tabular-nums mt-1">
        {value}
        {unit && <span className="text-sm font-normal text-surface-400 ml-0.5">{unit}</span>}
      </p>
      {subtext && <p className="text-xs text-surface-400 mt-1">{subtext}</p>}
    </div>
  )
}

export function MacroGrid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <MacroStat key={item.label} {...item} />
      ))}
    </div>
  )
}
