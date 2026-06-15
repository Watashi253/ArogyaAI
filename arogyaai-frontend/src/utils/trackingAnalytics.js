import { format, parseISO } from 'date-fns'
import { lastNDays } from './dates'

export function buildDaySeries(groupedByDay = {}, dataKey = 'calories', days = 7) {
  const dayList = lastNDays(days)
  return dayList.map((date) => {
    const entry = groupedByDay[date]
    const value = entry
      ? typeof entry === 'number'
        ? entry
        : entry[dataKey] ?? entry.calories ?? 0
      : 0
    return {
      date,
      label: format(parseISO(date), days > 14 ? 'MMM d' : 'EEE'),
      value: Math.round(value * 10) / 10,
    }
  })
}

export function buildMacroChartData(groupedByDay = {}, days = 7) {
  const dayList = lastNDays(days)
  return dayList.map((date) => {
    const entry = groupedByDay[date] || {}
    return {
      date,
      label: format(parseISO(date), days > 14 ? 'MMM d' : 'EEE'),
      calories: Math.round(entry.calories || 0),
      protein: Math.round((entry.proteinG || 0) * 10) / 10,
      fat: Math.round((entry.fatG || 0) * 10) / 10,
      carbs: Math.round((entry.carbsG || 0) * 10) / 10,
    }
  })
}

export function buildWaterChartData(groupedByDay = {}, days = 7) {
  return buildDaySeries(groupedByDay, null, days).map((d) => ({
    ...d,
    total: d.value,
  }))
}

export function buildSleepChartData(logs = [], days = 7) {
  const byDay = {}
  logs.forEach((log) => {
    const day = log.date?.split?.('T')?.[0] || new Date(log.date).toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + (log.hours || 0)
  })
  return lastNDays(days).map((date) => ({
    date,
    label: format(parseISO(date), days > 14 ? 'MMM d' : 'EEE'),
    hours: Math.round((byDay[date] || 0) * 10) / 10,
    quality: null,
  }))
}

export function buildActivityChartData(logs = [], days = 7) {
  const byDay = {}
  logs.forEach((log) => {
    const day = log.date?.split?.('T')?.[0] || new Date(log.date).toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + (log.durationMins || 0)
  })
  return lastNDays(days).map((date) => ({
    date,
    label: format(parseISO(date), days > 14 ? 'MMM d' : 'EEE'),
    minutes: byDay[date] || 0,
  }))
}

export function buildActivityTypeBreakdown(groupedByType = {}) {
  return Object.entries(groupedByType).map(([key, val]) => ({
    type: key,
    name: val.name || key,
    minutes: val.totalMins || 0,
    calories: val.totalCalories || 0,
    count: val.count || 0,
  }))
}

export function formatBedWake(log) {
  if (!log) return { bedtime: '—', wakeTime: '—', duration: '—' }
  const bedtime = new Date(log.bedtime)
  const wakeTime = new Date(log.wakeTime)
  return {
    bedtime: format(bedtime, 'h:mm a'),
    wakeTime: format(wakeTime, 'h:mm a'),
    duration: `${log.hours?.toFixed(1) || 0}h`,
  }
}

export const MEAL_TYPE_CONFIG = [
  { key: 'breakfast', label: 'Breakfast', color: '#f59e0b' },
  { key: 'lunch', label: 'Lunch', color: '#14b8a6' },
  { key: 'dinner', label: 'Dinner', color: '#6366f1' },
  { key: 'snack', label: 'Snacks', color: '#f43f5e' },
]

export const FEATURED_ACTIVITIES = [
  { key: 'walking', label: 'Walking' },
  { key: 'running', label: 'Running' },
  { key: 'cycling', label: 'Cycling' },
  { key: 'gym', label: 'Gym' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'swimming', label: 'Swimming' },
]

export function buildMedicineAdherenceChart(logs = [], days = 7) {
  const dayList = lastNDays(days)
  const byDay = {}
  logs.forEach((log) => {
    const day = log.scheduledAt?.split('T')[0]
    if (!day) return
    if (!byDay[day]) byDay[day] = { taken: 0, missed: 0 }
    if (log.status === 'taken') byDay[day].taken += 1
    else if (log.status === 'missed') byDay[day].missed += 1
  })
  return dayList.map((date) => ({
    date,
    label: format(parseISO(date), days > 14 ? 'MMM d' : 'EEE'),
    taken: byDay[date]?.taken || 0,
    missed: byDay[date]?.missed || 0,
  }))
}
