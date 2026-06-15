import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'

const router = express.Router()

// Add a new medicine
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, dose, frequency, times, startDate, endDate, notes } = req.body

    if (!name || !dose || !frequency || !startDate) {
    return res.status(400).json({
        error: "Missing required fields"
    })
}

    const medicine = await prisma.medicine.create({
      data: {
        userId: req.userId,
        name,
        dose,
        frequency,
        times: times || [],
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null
      }
    })

    res.json(medicine)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all medicines for user
router.get('/', authenticate, async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })

    // Separate active vs completed
    const now = new Date()
    const active = medicines.filter(m => !m.endDate || new Date(m.endDate) >= now)
    const completed = medicines.filter(m => m.endDate && new Date(m.endDate) < now)

    res.json({ active, completed, total: medicines.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark medicine as taken
router.post('/:id/take', authenticate, async (req, res) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id: req.params.id }
    })

    if (!medicine || medicine.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const startOfDay = new Date(); 
    startOfDay.setHours(0, 0, 0, 0); 
    const endOfDay = new Date(); 
    endOfDay.setHours(23, 59, 59, 999); 
    const existing = await prisma.medicineLog.findFirst({ 
        where: { 
            medicineId: req.params.id, 
            userId: req.userId, 
            scheduledAt: { gte: startOfDay, lte: endOfDay, }, 
        }, 
    });

    if (existing) { 
        return res.json(existing); 
    }

    const log = await prisma.medicineLog.create({
      data: {
        medicineId: req.params.id,
        userId: req.userId,
        scheduledAt: new Date(),
        takenAt: new Date(),
        status: 'taken',
      },
    })

    res.json(log)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get today's medicine schedule with taken/pending status
router.get('/today', authenticate, async (req, res) => {
  try {
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const endOfDay = new Date(now.setHours(23, 59, 59, 999))

    const medicines = await prisma.medicine.findMany({
      where: {
        userId: req.userId,
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    })

    const todayLogs = await prisma.medicineLog.findMany({
      where: {
        userId: req.userId,
        scheduledAt: { gte: startOfDay, lte: endOfDay }
      }
    })

    const schedule = medicines.map(med => ({
      ...med,
      takenToday: todayLogs.some(log => log.medicineId === med.id && log.status === 'taken')
    }))

    const adherenceRate = schedule.length > 0
      ? ((schedule.filter(m => m.takenToday).length / schedule.length) * 100).toFixed(0)
      : 0

    res.json({ schedule, adherenceRate })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Medicine log history and adherence analytics
router.get('/history', authenticate, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90)
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const [logs, medicines] = await Promise.all([
      prisma.medicineLog.findMany({
        where: {
          userId: req.userId,
          scheduledAt: { gte: since },
        },
        include: { medicine: { select: { name: true, dose: true, frequency: true, times: true } } },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.medicine.findMany({
        where: { userId: req.userId },
      }),
    ])

    const taken = logs.filter((l) => l.status === 'taken').length
    const missed = logs.filter((l) => l.status === 'missed').length
    const pending = logs.filter((l) => l.status === 'pending').length

    const now = new Date()
    const activeMeds = medicines.filter(
      (m) => m.startDate <= now && (!m.endDate || new Date(m.endDate) >= now)
    )

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayLogs = logs.filter(
      (l) => l.scheduledAt >= todayStart && l.scheduledAt <= todayEnd
    )
    const missedToday = activeMeds.filter(
      (med) => !todayLogs.some((l) => l.medicineId === med.id && l.status === 'taken')
    )

    const adherenceRate =
      taken + missed > 0 ? Math.round((taken / (taken + missed + pending)) * 100) : 0

    res.json({
      logs,
      missedToday: missedToday.map((m) => ({
        id: m.id,
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        times: m.times,
      })),
      summary: {
        taken,
        missed,
        pending,
        adherenceRate,
        missedTodayCount: missedToday.length,
        activeMedicines: activeMeds.length,
        periodDays: days,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update medicine
router.put('/:id', authenticate, async (req, res) => {
  try {
    const medicine = await prisma.medicine.findUnique({ 
        where: { id: req.params.id } })
    if (!medicine || medicine.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const updated = await prisma.medicine.update({
      where: { id: req.params.id },
      data: req.body
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete medicine
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const medicine = await prisma.medicine.findUnique({ where: { id: req.params.id } })
    if (!medicine || medicine.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.medicine.delete({ where: { id: req.params.id } })
    res.json({ message: 'Medicine deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router