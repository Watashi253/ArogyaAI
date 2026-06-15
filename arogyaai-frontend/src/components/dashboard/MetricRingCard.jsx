import { Link } from 'react-router-dom'
import { ProgressRing } from '@/components/ui'
import { cn } from '@/utils/cn'

export function MetricRingCard({
  label,
  value,
  display,
  percent,
  color,
  to,
  icon: Icon,
}) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center p-4 rounded-2xl bg-white border border-surface-100 shadow-card',
        to && 'hover:shadow-elevated transition-shadow'
      )}
    >
      {Icon && (
        <Icon className="h-4 w-4 mb-2" style={{ color }} />
      )}
      <ProgressRing
        value={percent}
        max={100}
        size={72}
        strokeWidth={6}
        color={color}
      >
        <span className="text-sm font-semibold text-surface-800 tabular-nums">
          {percent}%
        </span>
      </ProgressRing>
      <p className="mt-2 text-xs font-medium text-surface-500">{label}</p>
      <p className="text-sm font-semibold text-surface-900 tabular-nums mt-0.5">
        {display ?? value}
      </p>
    </div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }
  return content
}
