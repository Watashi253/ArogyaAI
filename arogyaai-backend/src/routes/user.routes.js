import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'

const router = express.Router()

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { heightCm, weightKg, age, gender, targetCalories } = req.body
    
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.userId },
      update: { heightCm, weightKg, age, gender, targetCalories },
      create: { userId: req.userId, heightCm, weightKg, age, gender, targetCalories }
    })
    
    res.json(profile)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router