import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'

const router = express.Router()

// Log a meal
router.post('/log', authenticate, async (req, res) => {
  try {
    const { date, mealType, foodName, calories, proteinG, fatG, carbsG, fiberG } = req.body
    
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
        fiberG,
        source: 'manual'
      }
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
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })
    
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
    const totalProtein = meals.reduce((sum, meal) => sum + meal.proteinG, 0)
    
    res.json({ meals, totalCalories, totalProtein })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router