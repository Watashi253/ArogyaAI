import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'

const router = express.Router()

// Log a sleep entry
router.post('/log', authenticate, async (req, res) => {
  try {
    const { date, bedtime, wakeTime, qualityRating } = req.body

    // Calculate hours slept
    const bedtimeDate = new Date(bedtime)
    const wakeTimeDate = new Date(wakeTime)
    const hours = (wakeTimeDate - bedtimeDate) / (1000 * 60 * 60)

    // Validate that wake time is after bed time
    if (hours < 0) {
      return res.status(400).json({ error: 'Wake time must be after bedtime' })
    }

    const sleepLog = await prisma.sleepLog.create({
      data: {
        userId: req.userId,
        date: new Date(date),
        bedtime: bedtimeDate,
        wakeTime: wakeTimeDate,
        hours,
        qualityRating: qualityRating || null
      }
    })

    res.json(sleepLog)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get sleep logs for a specific date
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' })
    }

    const startDate = new Date(date)
    const endDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)

    const sleepLogs = await prisma.sleepLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: 'desc' }
    })

    res.json({ logs: sleepLogs })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get weekly sleep summary
router.get('/logs/week', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const sleepLogs = await prisma.sleepLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    })

    const averageHours = sleepLogs.length
      ? (sleepLogs.reduce((sum, log) => sum + log.hours, 0) / sleepLogs.length).toFixed(1)
      : 0

    const averageQuality = sleepLogs.filter(log => log.qualityRating).length
      ? (sleepLogs
          .filter(log => log.qualityRating)
          .reduce((sum, log) => sum + log.qualityRating, 0) /
        sleepLogs.filter(log => log.qualityRating).length).toFixed(1)
      : null

    res.json({
      logs: sleepLogs,
      summary: {
        totalNights: sleepLogs.length,
        averageHours,
        averageQuality,
        targetHours: 8
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get monthly sleep data
router.get('/logs/month', authenticate, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sleepLogs = await prisma.sleepLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    })

    const averageHours = sleepLogs.length
      ? (sleepLogs.reduce((sum, log) => sum + log.hours, 0) / sleepLogs.length).toFixed(1)
      : 0

    res.json({
      logs: sleepLogs,
      summary: {
        totalNights: sleepLogs.length,
        averageHours,
        daysInMonth: 30
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update a sleep log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { bedtime, wakeTime, qualityRating } = req.body

    // Calculate updated hours if times are provided
    let updateData = { qualityRating }

    if (bedtime && wakeTime) {
      const bedtimeDate = new Date(bedtime)
      const wakeTimeDate = new Date(wakeTime)
      const hours = (wakeTimeDate - bedtimeDate) / (1000 * 60 * 60)

      if (hours < 0) {
        return res.status(400).json({ error: 'Wake time must be after bedtime' })
      }

      updateData = {
        ...updateData,
        bedtime: bedtimeDate,
        wakeTime: wakeTimeDate,
        hours
      }
    }

    // Verify ownership
    const sleepLog = await prisma.sleepLog.findUnique({
      where: { id: req.params.id }
    })

    if (!sleepLog || sleepLog.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const updated = await prisma.sleepLog.update({
      where: { id: req.params.id },
      data: updateData
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete a sleep log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const sleepLog = await prisma.sleepLog.findUnique({
      where: { id: req.params.id }
    })

    if (!sleepLog || sleepLog.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.sleepLog.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Sleep log deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router