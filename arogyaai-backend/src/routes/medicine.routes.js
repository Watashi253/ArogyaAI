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