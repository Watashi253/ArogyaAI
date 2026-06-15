import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'

const router = express.Router()

// Log water intake
router.post('/log', authenticate, async (req, res) => {
  try {
    const { date, amountMl } = req.body

    if (!amountMl || amountMl <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' })
    }

    const waterLog = await prisma.waterLog.create({
      data: {
        userId: req.userId,
        date: new Date(date),
        amountMl
      }
    })

    res.json(waterLog)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get water logs for a specific date
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' })
    }

    const startDate = new Date(date)
    const endDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { loggedAt: 'desc' }
    })

    // Get user's target water intake
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.userId }
    })

    const totalWater = waterLogs.reduce((sum, log) => sum + log.amountMl, 0)
    const targetWater = profile?.targetWaterMl || 2000 // Default 2 liters

    res.json({
      logs: waterLogs,
      summary: {
        totalMl: totalWater,
        targetMl: targetWater,
        percentage: ((totalWater / targetWater) * 100).toFixed(1),
        count: waterLogs.length
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get daily water summary with quick add (common amounts)
router.get('/logs/daily', authenticate, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { loggedAt: 'desc' }
    })

    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.userId }
    })

    const totalWater = waterLogs.reduce((sum, log) => sum + log.amountMl, 0)
    const targetWater = profile?.targetWaterMl || 2000

    res.json({
      logs: waterLogs,
      summary: {
        date: today.toISOString().split('T')[0],
        totalMl: totalWater,
        targetMl: targetWater,
        percentage: ((totalWater / targetWater) * 100).toFixed(1),
        remaining: Math.max(0, targetWater - totalWater),
        count: waterLogs.length
      },
      quickAddOptions: [
        { label: 'Small (200ml)', amount: 200 },
        { label: 'Medium (250ml)', amount: 250 },
        { label: 'Large (500ml)', amount: 500 },
        { label: 'Bottle (1L)', amount: 1000 }
      ]
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get weekly water intake summary
router.get('/logs/week', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    })

    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.userId }
    })

    const targetWater = profile?.targetWaterMl || 2000
    const totalWater = waterLogs.reduce((sum, log) => sum + log.amountMl, 0)
    const averageDaily = waterLogs.length
      ? (totalWater / 7).toFixed(0)
      : 0

    // Group by day
    const groupedByDay = {}
    waterLogs.forEach((log) => {
      const dayKey = log.date.toISOString().split('T')[0]
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = 0
      }
      groupedByDay[dayKey] += log.amountMl
    })

    res.json({
      logs: waterLogs,
      groupedByDay,
      summary: {
        totalMl: totalWater,
        averageDailyMl: averageDaily,
        targetMl: targetWater,
        daysLogged: Object.keys(groupedByDay).length,
        complianceDays: Object.values(groupedByDay).filter(
          (amount) => amount >= targetWater
        ).length
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get monthly water intake summary
router.get('/logs/month', authenticate, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        userId: req.userId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    })

    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.userId },
    })

    const targetWater = profile?.targetWaterMl || 2000
    const totalWater = waterLogs.reduce((sum, log) => sum + log.amountMl, 0)

    const groupedByDay = {}
    waterLogs.forEach((log) => {
      const dayKey = log.date.toISOString().split('T')[0]
      groupedByDay[dayKey] = (groupedByDay[dayKey] || 0) + log.amountMl
    })

    res.json({
      logs: waterLogs,
      groupedByDay,
      summary: {
        totalMl: totalWater,
        averageDailyMl: Object.keys(groupedByDay).length
          ? Math.round(totalWater / Object.keys(groupedByDay).length)
          : 0,
        targetMl: targetWater,
        daysLogged: Object.keys(groupedByDay).length,
        daysInMonth: 30,
        complianceDays: Object.values(groupedByDay).filter((amount) => amount >= targetWater).length,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update a water log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { amountMl } = req.body

    if (!amountMl || amountMl <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' })
    }

    // Verify ownership
    const waterLog = await prisma.waterLog.findUnique({
      where: { id: req.params.id }
    })

    if (!waterLog || waterLog.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const updated = await prisma.waterLog.update({
      where: { id: req.params.id },
      data: { amountMl }
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete a water log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const waterLog = await prisma.waterLog.findUnique({
      where: { id: req.params.id }
    })

    if (!waterLog || waterLog.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.waterLog.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Water log deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router