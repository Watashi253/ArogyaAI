import { callGemini, parseJsonResponse } from './gemini.js'

const INSIGHTS_PROMPT = (stats) => `
Generate 4 wellness observations based on this 7-day health data:
- Average sleep: ${stats.avgSleep} hours (target: ${stats.targetSleepHrs})
- Average calories: ${stats.avgCalories} kcal/day (target: ${stats.targetCalories})
- Average protein: ${stats.avgProtein} g/day (target: ${stats.targetProteinG})
- Total water this week: ${stats.totalWater}ml (daily target: ${stats.targetWaterMl}ml)
- Total activity: ${stats.totalActivity} minutes across ${stats.activitySessions} sessions

Rules:
- If water or activity logs are missing, say data was not logged rather than assuming zero consumption or zero activity.
- Never diagnose, never suggest diseases
- Be specific with numbers, compare to targets
- Be encouraging but honest
- Last insight must always be: "Always consult a healthcare professional for personalized medical advice."

Return ONLY valid JSON:
{ "insights": ["insight 1", "insight 2", "insight 3", "insight 4"] }
`

export async function generateWeeklyInsights(stats) {
  if (!stats || typeof stats !== 'object') {
    throw new Error('Invalid stats object provided')
  }

  const prompt = INSIGHTS_PROMPT(stats)
  const response = await callGemini(prompt)
  const result = parseJsonResponse(response)

  if (!Array.isArray(result.insights) || result.insights.length !== 4) {
    throw new Error('Invalid insights response: expected 4 insights')
  }

  return result
}

export function calculateHealthStats(data, profile) {
  const { sleepLogs, meals, waterLogs, activities } = data

  // Group meals by day
  const caloriesByDay = {}
  const proteinByDay = {}

  meals.forEach(meal => {
    const day = new Date(meal.date).toISOString().split('T')[0]

    caloriesByDay[day] =
      (caloriesByDay[day] || 0) + meal.calories

    proteinByDay[day] =
      (proteinByDay[day] || 0) + meal.proteinG
  })

  const activeMealDays = Object.keys(caloriesByDay).length

  const avgCaloriesPerDay = activeMealDays
    ? (
      Object.values(caloriesByDay).reduce((a, b) => a + b, 0) /
      activeMealDays
    ).toFixed(0)
    : 0

  const avgProteinPerDay = activeMealDays
    ? (
      Object.values(proteinByDay).reduce((a, b) => a + b, 0) /
      activeMealDays
    ).toFixed(1)
    : 0

  return {
    avgSleep: sleepLogs.length
      ? (
        sleepLogs.reduce((s, l) => s + l.hours, 0) /
        sleepLogs.length
      ).toFixed(1)
      : 0,

    avgCalories: avgCaloriesPerDay,
    avgProtein: avgProteinPerDay,

    totalWater: waterLogs.reduce(
      (s, w) => s + w.amountMl,
      0
    ),

    totalActivity: activities.reduce(
      (s, a) => s + a.durationMins,
      0
    ),

    activitySessions: activities.length,

    hasWaterLogs: waterLogs.length > 0,
    hasActivityLogs: activities.length > 0,

    targetSleepHrs: profile?.targetSleepHrs || 8,
    targetCalories: profile?.targetCalories || 2000,
    targetProteinG: profile?.targetProteinG || 50,
    targetWaterMl: profile?.targetWaterMl || 2000
  }
}