import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'

const router = express.Router()

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

function sumMeals(meals) {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      proteinG: acc.proteinG + (meal.proteinG || 0),
      fatG: acc.fatG + (meal.fatG || 0),
      carbsG: acc.carbsG + (meal.carbsG || 0),
      fiberG: acc.fiberG + (meal.fiberG || 0),
      sugarG: acc.sugarG + (meal.sugarG || 0),
      count: acc.count + 1,
    }),
    { calories: 0, proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0, sugarG: 0, count: 0 }
  )
}

function groupByMealType(meals) {
  const grouped = {}
  MEAL_TYPES.forEach((type) => {
    const typeMeals = meals.filter((m) => m.mealType === type)
    grouped[type] = { meals: typeMeals, ...sumMeals(typeMeals) }
  })
  return grouped
}

function groupMealsByDay(meals) {
  const grouped = {}
  meals.forEach((meal) => {
    const day = meal.date.toISOString().split('T')[0]
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(meal)
  })
  return grouped
}

// Log a meal
router.post('/log', authenticate, async (req, res) => {
  try {
    const { date, mealType, foodName, calories, proteinG, fatG, carbsG, fiberG, sugarG } = req.body

    const meal = await prisma.mealLog.create({
      data: {
        userId: req.userId,
        date: new Date(date),
        mealType,
        foodName,
        calories,
        proteinG,
        fatG,
        carbsG,
        fiberG: fiberG ?? null,
        sugarG: sugarG ?? null,
        source: 'manual',
      },
    })

    res.json(meal)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get meals for a date
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { date } = req.query
    const meals = await prisma.mealLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const totals = sumMeals(meals)

    res.json({
      meals,
      byMealType: groupByMealType(meals),
      ...totals,
      totalCalories: totals.calories,
      totalProtein: totals.proteinG,
      totalFat: totals.fatG,
      totalCarbs: totals.carbsG,
      totalFiber: totals.fiberG,
      totalSugar: totals.sugarG,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Weekly nutrition summary
router.get('/logs/week', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const meals = await prisma.mealLog.findMany({
      where: { userId: req.userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    })

    const groupedByDay = groupMealsByDay(meals)
    const daySummaries = Object.fromEntries(
      Object.entries(groupedByDay).map(([day, dayMeals]) => [day, sumMeals(dayMeals)])
    )

    const totals = sumMeals(meals)
    const daysLogged = Object.keys(groupedByDay).length

    res.json({
      meals,
      groupedByDay: daySummaries,
      summary: {
        ...totals,
        daysLogged,
        avgCalories: daysLogged ? Math.round(totals.calories / daysLogged) : 0,
        avgProtein: daysLogged ? Math.round((totals.proteinG / daysLogged) * 10) / 10 : 0,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Monthly nutrition summary
router.get('/logs/month', authenticate, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const meals = await prisma.mealLog.findMany({
      where: { userId: req.userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    })

    const groupedByDay = groupMealsByDay(meals)
    const daySummaries = Object.fromEntries(
      Object.entries(groupedByDay).map(([day, dayMeals]) => [day, sumMeals(dayMeals)])
    )

    const totals = sumMeals(meals)
    const daysLogged = Object.keys(groupedByDay).length

    res.json({
      meals,
      groupedByDay: daySummaries,
      summary: {
        ...totals,
        daysLogged,
        daysInMonth: 30,
        avgCalories: daysLogged ? Math.round(totals.calories / daysLogged) : 0,
        avgProtein: daysLogged ? Math.round((totals.proteinG / daysLogged) * 10) / 10 : 0,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
