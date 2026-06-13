import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'
import { authenticate } from '../middleware/auth.middleware.js'
import { prisma } from '../config/db.js'
import {
  processMealImage,
  getWeeklyInsights,
  getDoctorSummary,
  getUserHealthProfile
} from '../services/insightsService.js'
import {
  generateDoctorSummaryPDF,
  generateWeeklyReportPDF,
  generateMealHistoryPDF,
  generateComprehensiveHealthReportPDF,
  validatePDFInputs
} from '../services/pdf.service.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'))
    }
  }
})

/**
 * Upload to Cloudinary and return URL
 */
async function uploadToCloudinary(fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'arogya-meals',
        filename_override: filename,
        public_id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tags: ['meal-scan', 'arogya']
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result.secure_url)
        }
      }
    )

    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })
}

// ═══════════════════════════════════════════════════════════
// MEAL SCANNING ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/health/scan-meal
 * Upload image to Cloudinary and scan meal
 */
router.post('/scan-meal', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' })
    }

    console.log(`Uploading meal image for user ${req.userId} to Cloudinary...`)
    const cloudinaryUrl = await uploadToCloudinary(
      req.file.buffer,
      `meal-${req.userId}-${Date.now()}`
    )
    console.log(`✓ Image uploaded to Cloudinary: ${cloudinaryUrl}`)

    // Process meal from Cloudinary URL
    const result = await processMealImage(
      cloudinaryUrl,
      req.userId,
      req.body.mealType || 'snack'
    )

    res.status(201).json({
      success: true,
      message: 'Meal scanned and saved successfully',
      data: {
        ...result,
        imageUrl: cloudinaryUrl
      }
    })
  } catch (error) {
    console.error('Meal scan error:', error)
    next(error)
  }
})

// ═══════════════════════════════════════════════════════════
// INSIGHTS ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/health/insights
 * Get AI-generated weekly health insights
 */
router.get('/insights', authenticate, async (req, res, next) => {
  try {
    const insights = await getWeeklyInsights(req.userId)
    res.json({
      success: true,
      data: insights
    })
  } catch (error) {
    next(error)
  }
})

// ═══════════════════════════════════════════════════════════
// DOCTOR SUMMARY ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/health/doctor-summary
 * Get 30-day doctor summary (JSON)
 */
router.get('/doctor-summary', authenticate, async (req, res, next) => {
  try {
    const summary = await getDoctorSummary(req.userId)
    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/health/doctor-summary/pdf
 * Generate doctor summary as PDF
 */
router.get('/doctor-summary/pdf', authenticate, async (req, res, next) => {
  try {
    // Get summary and user data
    const [summary, user] = await Promise.all([
      getDoctorSummary(req.userId),
      prisma.user.findUnique({ where: { id: req.userId } })
    ])

    // Validate PDF data
    validatePDFInputs(summary, 'doctor-summary')

    // Generate PDF
    generateDoctorSummaryPDF(summary, user, res)
  } catch (error) {
    console.error('Doctor summary PDF error:', error)
    next(error)
  }
})

// ═══════════════════════════════════════════════════════════
// WEEKLY REPORT ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/health/weekly-report
 * Get weekly report (JSON)
 */
router.get('/weekly-report', authenticate, async (req, res, next) => {
  try {
    const report = await getWeeklyInsights(req.userId)
    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/health/weekly-report/pdf
 * Generate weekly report as PDF
 */
router.get('/weekly-report/pdf', authenticate, async (req, res, next) => {
  try {
    // Get report and user data
    const [report, user] = await Promise.all([
      getWeeklyInsights(req.userId),
      prisma.user.findUnique({ where: { id: req.userId } })
    ])

    // Validate PDF data
    validatePDFInputs(report, 'weekly-report')

    // Generate PDF
    generateWeeklyReportPDF(report, user, res)
  } catch (error) {
    console.error('Weekly report PDF error:', error)
    next(error)
  }
})

// ═══════════════════════════════════════════════════════════
// MEAL HISTORY ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/health/meal-history
 * Get meal history (JSON)
 */
router.get('/meal-history', authenticate, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const meals = await prisma.mealLog.findMany({
      where: {
        userId: req.userId,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: 'desc' }
    })

    res.json({
      success: true,
      count: meals.length,
      data: meals
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/health/meal-history/pdf
 * Generate meal history as PDF
 */
router.get('/meal-history/pdf', authenticate, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get meals and user data
    const [meals, user] = await Promise.all([
      prisma.mealLog.findMany({
        where: {
          userId: req.userId,
          date: { gte: thirtyDaysAgo }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.user.findUnique({ where: { id: req.userId } })
    ])

    // Generate PDF
    generateMealHistoryPDF(meals, user, res)
  } catch (error) {
    console.error('Meal history PDF error:', error)
    next(error)
  }
})

// ═══════════════════════════════════════════════════════════
// COMPREHENSIVE REPORT ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/health/comprehensive-report
 * Get all health data combined (JSON)
 */
router.get('/comprehensive-report', authenticate, async (req, res, next) => {
  try {
    const [summary, weeklyReport] = await Promise.all([
      getDoctorSummary(req.userId),
      getWeeklyInsights(req.userId)
    ])

    res.json({
      success: true,
      data: {
        doctorSummary: summary,
        weeklyReport: weeklyReport
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/health/comprehensive-report/pdf
 * Generate comprehensive health report as multi-page PDF
 */
router.get('/comprehensive-report/pdf', authenticate, async (req, res, next) => {
  try {
    // Get all data needed for comprehensive report
    const [summary, weeklyReport, user] = await Promise.all([
      getDoctorSummary(req.userId),
      getWeeklyInsights(req.userId),
      prisma.user.findUnique({ where: { id: req.userId } })
    ])

    // Combine data
    const reportData = {
      doctorSummary: summary,
      stats: weeklyReport.stats,
      insights: weeklyReport.insights,
      recommendations: summary.recommendations || []
    }

    // Validate PDF data
    validatePDFInputs(reportData, 'comprehensive')

    // Generate PDF
    generateComprehensiveHealthReportPDF(reportData, user, res)
  } catch (error) {
    console.error('Comprehensive report PDF error:', error)
    next(error)
  }
})

// ═══════════════════════════════════════════════════════════
// PROFILE ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/health/profile
 * Get user's health profile
 */
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const profile = await getUserHealthProfile(req.userId)

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      })
    }

    res.json({
      success: true,
      data: profile
    })
  } catch (error) {
    next(error)
  }
})

export default router