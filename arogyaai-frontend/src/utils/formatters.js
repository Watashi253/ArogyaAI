export function formatNumber(value, decimals = 0) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatMl(ml) {
  if (ml == null) return '—'
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`
  return `${ml}ml`
}

export function formatHours(hours) {
  if (hours == null) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatPercent(value) {
  if (value == null) return '—'
  return `${Math.round(Number(value))}%`
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

export function mealTypeLabel(type) {
  const labels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  }
  return labels[type] || capitalize(type)
}
