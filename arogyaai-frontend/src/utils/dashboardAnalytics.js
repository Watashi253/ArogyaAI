import { format, parseISO } from 'date-fns'
import { lastNDays } from './dates'

export { buildMacroChartData, buildMedicineAdherenceChart } from './trackingAnalytics'

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function toDayKey(dateValue) {
  if (!dateValue) return null
  const str = typeof dateValue === 'string' ? dateValue : dateValue.toISOString?.() || String(dateValue)
  return str.split('T')[0]
}

export function metricPercent(value, target) {
  if (!target || target <= 0) return 0
  return clamp(Math.round((Number(value) / Number(target)) * 100))
}

export function caloriesScore(consumed, target) {
  const pct = metricPercent(consumed, target)
  if (pct > 110) return clamp(100 - (pct - 110) * 2)
  return pct
}

export function computeHealthScore({
  calories = 0,
  protein = 0,
  waterMl = 0,
  sleepHrs = 0,
  activityMins = 0,
  medicineAdherence = null,
}, targets = {}) {
  const parts = []

  if (targets.targetCalories) {
    parts.push(caloriesScore(calories, targets.targetCalories))
  }
  if (targets.targetProteinG) {
    parts.push(metricPercent(protein, targets.targetProteinG))
  }
  if (targets.targetWaterMl) {
    parts.push(metricPercent(waterMl, targets.targetWaterMl))
  }
  if (targets.targetSleepHrs && sleepHrs > 0) {
    parts.push(metricPercent(sleepHrs, targets.targetSleepHrs))
  }
  if (activityMins > 0) {
    parts.push(metricPercent(activityMins, targets.activityTargetMins || 30))
  }
  if (medicineAdherence != null) {
    parts.push(clamp(Number(medicineAdherence)))
  }

  if (parts.length === 0) return null
  return Math.round(parts.reduce((sum, n) => sum + n, 0) / parts.length)
}

export function getScoreLabel(score) {
  if (score == null) return { label: 'No data', color: '#a8a29e' }
  if (score >= 85) return { label: 'Excellent', color: '#0d9488' }
  if (score >= 70) return { label: 'Good', color: '#14b8a6' }
  if (score >= 50) return { label: 'Fair', color: '#f59e0b' }
  return { label: 'Needs focus', color: '#f97316' }
}

function groupMealsByDay(meals = []) {
  const map = {}
  meals.forEach((meal) => {
    const day = toDayKey(meal.date)
    if (!day) return
    if (!map[day]) map[day] = { calories: 0, protein: 0 }
    map[day].calories += meal.calories || 0
    map[day].protein += meal.proteinG || 0
  })
  return map
}

function groupSleepByDay(logs = []) {
  const map = {}
  logs.forEach((log) => {
    const day = toDayKey(log.date)
    if (!day) return
    map[day] = (map[day] || 0) + (log.hours || 0)
  })
  return map
}

function groupActivityByDay(logs = []) {
  const map = {}
  logs.forEach((log) => {
    const day = toDayKey(log.date)
    if (!day) return
    map[day] = (map[day] || 0) + (log.durationMins || 0)
  })
  return map
}

export function buildWeeklyRhythm({
  waterWeek,
  sleepWeek,
  activityWeek,
  meals = [],
  targets = {},
}) {
  const days = lastNDays(7)
  const mealsByDay = groupMealsByDay(meals)
  const sleepByDay = groupSleepByDay(sleepWeek?.logs || [])
  const activityByDay = groupActivityByDay(activityWeek?.logs || [])
  const waterByDay = waterWeek?.groupedByDay || {}

  return days.map((date) => {
    const calories = mealsByDay[date]?.calories || 0
    const protein = mealsByDay[date]?.protein || 0
    const water = typeof waterByDay[date] === 'number' ? waterByDay[date] : 0
    const sleep = sleepByDay[date] || 0
    const activity = activityByDay[date] || 0

    const score = computeHealthScore(
      {
        calories,
        protein,
        waterMl: water,
        sleepHrs: sleep,
        activityMins: activity,
      },
      { ...targets, activityTargetMins: 30 }
    )

    return {
      date,
      label: format(parseISO(date), 'EEE'),
      score: score ?? 0,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      water,
      sleep: Math.round(sleep * 10) / 10,
      activity,
    }
  })
}

export function buildNutritionTrend(meals = []) {
  const days = lastNDays(7)
  const mealsByDay = groupMealsByDay(meals)

  return days.map((date) => ({
    date,
    label: format(parseISO(date), 'EEE'),
    calories: Math.round(mealsByDay[date]?.calories || 0),
    protein: Math.round((mealsByDay[date]?.protein || 0) * 10) / 10,
  }))
}

export function buildWaterTrend(waterWeek) {
  const days = lastNDays(7)
  const waterByDay = waterWeek?.groupedByDay || {}

  return days.map((date) => ({
    date,
    label: format(parseISO(date), 'EEE'),
    total: typeof waterByDay[date] === 'number' ? waterByDay[date] : 0,
  }))
}

export function buildSleepTrend(sleepWeek) {
  const sleepByDay = groupSleepByDay(sleepWeek?.logs || [])
  const days = lastNDays(7)

  return days.map((date) => ({
    date,
    label: format(parseISO(date), 'EEE'),
    hours: Math.round((sleepByDay[date] || 0) * 10) / 10,
  }))
}

export function buildActivityTrend(activityWeek) {
  const activityByDay = groupActivityByDay(activityWeek?.logs || [])
  const days = lastNDays(7)

  return days.map((date) => ({
    date,
    label: format(parseISO(date), 'EEE'),
    minutes: activityByDay[date] || 0,
  }))
}

export function getTargetsFromProfile(profile) {
  return {
    targetCalories: profile?.targetCalories || 2000,
    targetProteinG: profile?.targetProteinG || 50,
    targetWaterMl: profile?.targetWaterMl || 2000,
    targetSleepHrs: profile?.targetSleepHrs || 8,
    activityTargetMins: 30,
  }
}
