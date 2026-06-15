import { format, parseISO, startOfDay, subDays } from 'date-fns'

export function toApiDate(date = new Date()) {
  return format(date, 'yyyy-MM-dd')
}

export function todayApiDate() {
  return toApiDate(new Date())
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr.split('T')[0]) : dateStr
  return format(date, 'MMM d, yyyy')
}

export function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr.split('T')[0]) : dateStr
  return format(date, 'MMM d')
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return format(date, 'h:mm a')
}

export function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => toApiDate(subDays(startOfDay(new Date()), n - 1 - i)))
}
