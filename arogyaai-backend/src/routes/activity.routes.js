import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'

const router = express.Router()

// Activity types with calories burned per hour (approximate)
const ACTIVITY_TYPES = {
  walking: { name: 'Walking', caloriesPerHour: 280 },
  running: { name: 'Running', caloriesPerHour: 600 },
  cycling: { name: 'Cycling', caloriesPerHour: 500 },
  swimming: { name: 'Swimming', caloriesPerHour: 500 },
  gym: { name: 'Gym Workout', caloriesPerHour: 400 },
  yoga: { name: 'Yoga', caloriesPerHour: 240 },
  sports: { name: 'Sports', caloriesPerHour: 450 },
  hiking: { name: 'Hiking', caloriesPerHour: 380 },
  dancing: { name: 'Dancing', caloriesPerHour: 350 },
  other: { name: 'Other', caloriesPerHour: 300 }
}

// Get available activity types
router.get('/types', (req, res) => {
  res.json(ACTIVITY_TYPES)
})

// Log an activity
router.post('/log', authenticate, async (req, res) => {
  try {
    const { date, type, durationMins, caloriesBurned, notes } = req.body

    if (!type || !durationMins) {
      return res.status(400).json({ error: 'Type and duration are required' })
    }

    if (durationMins <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than 0' })
    }

    // Calculate calories if not provided
    let calculatedCalories = caloriesBurned

    if (!caloriesBurned && ACTIVITY_TYPES[type]) {
      const caloriesPerHour = ACTIVITY_TYPES[type].caloriesPerHour
      calculatedCalories = Math.round((caloriesPerHour / 60) * durationMins)
    }

    const activityLog = await prisma.activityLog.create({
      data: {
        userId: req.userId,
        date: new Date(date),
        type,
        durationMins,
        caloriesBurned: calculatedCalories || null,
        notes: notes || null
      }
    })

    res.json(activityLog)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get activities for a specific date
router.get('/logs', authenticate, async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' })
    }

    const startDate = new Date(date)
    const endDate = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: 'desc' }
    })

    const totalDuration = activities.reduce((sum, activity) => sum + activity.durationMins, 0)
    const totalCalories = activities.reduce((sum, activity) => sum + (activity.caloriesBurned || 0), 0)

    res.json({
      logs: activities,
      summary: {
        date: date,
        totalDurationMins: totalDuration,
        totalCalories,
        activityCount: activities.length
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get weekly activity summary
router.get('/logs/week', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    })

    const totalDuration = activities.reduce((sum, activity) => sum + activity.durationMins, 0)
    const totalCalories = activities.reduce((sum, activity) => sum + (activity.caloriesBurned || 0), 0)
    const averageDuration = activities.length > 0 ? (totalDuration / 7).toFixed(1) : 0

    // Group by activity type
    const groupedByType = {}
    activities.forEach((activity) => {
      if (!groupedByType[activity.type]) {
        groupedByType[activity.type] = {
          name: ACTIVITY_TYPES[activity.type]?.name || activity.type,
          count: 0,
          totalMins: 0,
          totalCalories: 0
        }
      }
      groupedByType[activity.type].count += 1
      groupedByType[activity.type].totalMins += activity.durationMins
      groupedByType[activity.type].totalCalories += activity.caloriesBurned || 0
    })

    res.json({
      logs: activities,
      groupedByType,
      summary: {
        totalDurationMins: totalDuration,
        totalCalories,
        averageDailyMins: averageDuration,
        activityCount: activities.length,
        daysActive: new Set(activities.map((a) => a.date.toISOString().split('T')[0])).size
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get monthly activity summary
router.get('/logs/month', authenticate, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    })

    const totalDuration = activities.reduce((sum, activity) => sum + activity.durationMins, 0)
    const totalCalories = activities.reduce((sum, activity) => sum + (activity.caloriesBurned || 0), 0)
    const averageDuration = activities.length > 0 ? (totalDuration / 30).toFixed(1) : 0

    // Group by day
    const groupedByDay = {}
    activities.forEach((activity) => {
      const dayKey = activity.date.toISOString().split('T')[0]
      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = {
          activities: [],
          totalMins: 0,
          totalCalories: 0
        }
      }
      groupedByDay[dayKey].activities.push(activity)
      groupedByDay[dayKey].totalMins += activity.durationMins
      groupedByDay[dayKey].totalCalories += activity.caloriesBurned || 0
    })

    res.json({
      logs: activities,
      groupedByDay,
      summary: {
        totalDurationMins: totalDuration,
        totalCalories,
        averageDailyMins: averageDuration,
        activityCount: activities.length,
        daysActive: Object.keys(groupedByDay).length,
        daysInMonth: 30
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update an activity log
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { type, durationMins, caloriesBurned, notes } = req.body

    // Verify ownership
    const activity = await prisma.activityLog.findUnique({
      where: { id: req.params.id }
    })

    if (!activity || activity.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Calculate calories if type/duration changed but calories not provided
    let updateData = { type, durationMins, notes }

    if (!caloriesBurned && type && durationMins && ACTIVITY_TYPES[type]) {
      const caloriesPerHour = ACTIVITY_TYPES[type].caloriesPerHour
      updateData.caloriesBurned = Math.round((caloriesPerHour / 60) * durationMins)
    } else if (caloriesBurned !== undefined) {
      updateData.caloriesBurned = caloriesBurned
    }

    const updated = await prisma.activityLog.update({
      where: { id: req.params.id },
      data: updateData
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete an activity log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const activity = await prisma.activityLog.findUnique({
      where: { id: req.params.id }
    })

    if (!activity || activity.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.activityLog.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Activity log deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get activity stats and achievements
router.get('/stats', authenticate, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: thirtyDaysAgo
        }
      }
    })

    const totalDuration = activities.reduce((sum, activity) => sum + activity.durationMins, 0)
    const totalCalories = activities.reduce((sum, activity) => sum + (activity.caloriesBurned || 0), 0)
    const daysActive = new Set(activities.map((a) => a.date.toISOString().split('T')[0])).size

    const mostCommonActivity = Object.entries(
      activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]

    res.json({
      stats: {
        totalDurationMins: totalDuration,
        totalCalories,
        daysActive,
        activityCount: activities.length,
        averageDailyMins: (totalDuration / 30).toFixed(1),
        mostFrequentActivity: mostCommonActivity
          ? {
              type: mostCommonActivity[0],
              name: ACTIVITY_TYPES[mostCommonActivity[0]]?.name || mostCommonActivity[0],
              count: mostCommonActivity[1]
            }
          : null
      },
      achievements: {
        week5Days: daysActive >= 5,
        calories500: totalCalories >= 500,
        hours5Total: totalDuration >= 300,
        consistency7Days: daysActive >= 7
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router