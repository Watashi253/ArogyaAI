import { callGemini, parseJsonResponse } from './gemini.js'

const MEAL_SCAN_PROMPT = `Analyze this meal image. Return ONLY valid JSON, no markdown:
{
  "foods_detected": ["rice", "dal", "sabzi"],
  "total_calories": 450,
  "protein_g": 18,
  "fat_g": 12,
  "carbs_g": 65,
  "fiber_g": 6,
  "confidence": "medium",
  "notes": "Estimated for typical Indian thali portion"
}
confidence must be: "low", "medium", or "high"
Return null for values you cannot estimate.`

/**
 * Scan meal image from Cloudinary URL
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<Object>} Parsed meal data
 */
export async function scanMealImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Valid image URL is required')
  }

  // Call Gemini with image URL directly (Gemini accepts URLs)
  const response = await callGemini(MEAL_SCAN_PROMPT, {
    url: imageUrl,
    isUrl: true
  })

  const result = parseJsonResponse(response)
  
  if (!result.foods_detected || !Array.isArray(result.foods_detected)) {
    throw new Error('Invalid meal scan response structure')
  }

  return result
}

export async function validateMealData(mealData) {
  const required = ['foods_detected', 'total_calories', 'confidence']
  const missing = required.filter(field => !(field in mealData))
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }

  if (!['low', 'medium', 'high'].includes(mealData.confidence)) {
    throw new Error('Invalid confidence level')
  }

  return true
}