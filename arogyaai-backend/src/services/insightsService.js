import { scanMealImage, validateMealData } from '../ai/mealScanner.js'
import { generateWeeklyInsights, calculateHealthStats } from '../ai/insightsGenerator.js'
import {
  generateDoctorSummary,
  formatSummaryData,
  calculateMetrics
} from '../ai/doctorSummary.js'
import {
  fetchWeeklyData,
  fetchMonthlyData,
  saveMealLog,
  fetchUserProfile,
  fetchUser
} from './healthDataService.js'


/**
 * Process a meal image from Cloudinary and save to database
 * @param {string} cloudinaryUrl - Cloudinary image URL
 * @param {string} userId - User ID
 * @param {string} mealType - Type of meal (breakfast, lunch, etc.)
 * @returns {Promise<Object>} Saved meal log entry
 */
export async function processMealImage(cloudinaryUrl, userId, mealType = 'snack') {
  try {
    if (!cloudinaryUrl) {
      throw new Error('Cloudinary image URL is required')
    }

    // Scan meal from Cloudinary URL
    const mealData = await scanMealImage(cloudinaryUrl)
    await validateMealData(mealData)
    
    // Save to database with Cloudinary URL
    const savedMeal = await saveMealLog(userId, {
      mealType,
      foodName: mealData.foods_detected.join(', '),
      calories: mealData.total_calories,
      proteinG: mealData.protein_g || 0,
      fatG: mealData.fat_g || 0,
      carbsG: mealData.carbs_g || 0,
      fiberG: mealData.fiber_g || null,
      imageUrl: cloudinaryUrl,  // Store Cloudinary URL
      confidence: mealData.confidence,
      notes: mealData.notes,
      source: 'ai_scan'
    })
    
    return savedMeal
  } catch (error) {
    console.error('Error processing meal image:', error)
    throw new Error(`Failed to process meal image: ${error.message}`)
  }
}

/**
 * Get weekly health insights for a user
 */
export async function getWeeklyInsights(userId) {
  try {
    const data = await fetchWeeklyData(userId)
    const stats = calculateHealthStats(data, data.profile)
    const insights = await generateWeeklyInsights(stats)
    
    return {
      period: 'weekly',
      stats,
      insights: insights.insights,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error generating weekly insights:', error)
    throw new Error(`Failed to generate insights: ${error.message}`)
  }
}

/**
 * Get doctor visit summary for a user
 */
export async function getDoctorSummary(userId) {
  try {
    const { profile, user, meals, sleepLogs, activities, medicines, labValues } =
      await fetchMonthlyData(userId)
    
    const metrics = calculateMetrics(meals, sleepLogs, activities)
    const summaryData = formatSummaryData(profile, user, metrics, medicines, labValues)
    const result = await generateDoctorSummary(summaryData)
    
    return {
      ...result,
      userId,
      period: 'monthly'
    }
  } catch (error) {
    console.error('Error generating doctor summary:', error)
    throw new Error(`Failed to generate doctor summary: ${error.message}`)
  }
}

/**
 * Get user's health profile
 */
export async function getUserHealthProfile(userId) {
  return fetchUserProfile(userId)
}