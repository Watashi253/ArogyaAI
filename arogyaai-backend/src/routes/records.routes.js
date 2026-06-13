import express from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'
import { extractLabValues } from '../services/ocr.service.js'
import cloudinary from '../config/cloudinary.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB max

// Upload a health record
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `arogyaai/${req.userId}`, resource_type: 'auto' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer)
    })

    // Create health record
    const record = await prisma.healthRecord.create({
      data: {
        userId: req.userId,
        title: req.body.title || req.file.originalname,
        type: req.body.type || 'other',
        fileUrl: uploadResult.secure_url,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        notes: req.body.notes || null
      }
    })

    // Run OCR and extract lab values
let labValues = []

try {
  console.log('========== HEALTH REPORT OCR ==========')
  console.log('Title:', req.file.originalname)
  console.log('Type:', req.body.type)
  console.log('Mime Type:', req.file.mimetype)

  const labData = await extractLabValues(
    req.file.buffer,
    req.file.mimetype
  )

  console.log('OCR RESULT:')
  console.dir(labData, { depth: null })

  const values = labData?.values || []

  for (const val of values) {
    const saved = await prisma.labValue.create({
      data: {
        recordId: record.id,
        userId: req.userId,
        parameter: val.parameter,
        value: parseFloat(val.value) || 0,
        unit: val.unit || '',
        referenceRange: val.referenceRange || null,
        isAbnormal: val.isAbnormal || false,
        testDate: labData?.testDate
          ? new Date(labData.testDate)
          : new Date()
      }
    })

    labValues.push(saved)
  }

  console.log(`Saved ${labValues.length} lab values`)
} catch (ocrError) {
  console.error('OCR EXTRACTION ERROR:')
  console.error(ocrError)
}

    res.json({ record, labValues })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all health records
router.get('/', authenticate, async (req, res) => {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { userId: req.userId },
      include: { labValues: true },
      orderBy: { uploadedAt: 'desc' }
    })

    res.json(records)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single record with lab values
router.get('/:id', authenticate, async (req, res) => {
  try {
    const record = await prisma.healthRecord.findUnique({
      where: { id: req.params.id },
      include: { labValues: { orderBy: { testDate: 'desc' } } }
    })

    if (!record || record.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json(record)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get lab value trends for a parameter (e.g., hemoglobin over 6 months)
router.get('/labs/trend/:parameter', authenticate, async (req, res) => {
  try {
    const labValues = await prisma.labValue.findMany({
      where: {
        userId: req.userId,
        parameter: { contains: req.params.parameter, mode: 'insensitive' }
      },
      orderBy: { testDate: 'asc' }
    })

    res.json(labValues)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete a record
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const record = await prisma.healthRecord.findUnique({ where: { id: req.params.id } })
    if (!record || record.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.healthRecord.delete({ where: { id: req.params.id } })
    res.json({ message: 'Record deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router