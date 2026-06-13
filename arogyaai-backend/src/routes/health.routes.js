import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  processMealImage,
  getWeeklyInsights,
  getDoctorSummary,
  getUserHealthProfile
} from '../services/insightsService.js'

const router = express.Router()

// Configure multer for memory storage (temporary, will upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
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

    // Convert buffer to stream and pipe to Cloudinary
    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })
}

/**
 * POST /api/health/scan-meal
 * Upload image to Cloudinary and scan meal
 */
router.post('/scan-meal', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' })
    }

    // Upload to Cloudinary
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
        imageUrl: cloudinaryUrl // Include the Cloudinary URL in response
      }
    })
  } catch (error) {
    console.error('Meal scan error:', error)
    next(error)
  }
})

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

/**
 * GET /api/health/doctor-summary
 * Get 30-day health summary for doctor visit
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