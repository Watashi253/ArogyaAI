import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const PRIMARY_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODEL = 'gemini-2.5-flash-lite'

export const getModel = (modelName = PRIMARY_MODEL) => {
  return genAI.getGenerativeModel({
    model: modelName
  })
}

export const parseJsonResponse = (responseText) => {
  try {
    let cleaned = responseText.trim()

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/\s*```$/g, '')
    
    // Extract JSON object if mixed with text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}(?=\s*$)/);
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }

    // Remove trailing commas (invalid JSON)
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')
    
    cleaned = cleaned.trim()
    
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Parse error - response text:', responseText.substring(0, 500))
    throw new Error(`Failed to parse AI response: ${error.message}`)
  }
}

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms))

async function generateWithRetry(modelName, content, retries = 3) {
  const model = getModel(modelName)

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `[Gemini] ${modelName} attempt ${attempt}/${retries}`
      )

      const result = await model.generateContent(content)

      return result.response.text()
    } catch (error) {
      const message = error?.message || ''

      const retryable =
        message.includes('503') ||
        message.includes('429') ||
        message.includes('Service Unavailable')

      if (retryable && attempt < retries) {
        const delay = attempt * 2000

        console.log(
          `[Gemini] Retrying in ${delay}ms...`
        )

        await sleep(delay)
        continue
      }

      throw error
    }
  }
}

export const callGemini = async (
  prompt,
  imageData = null
) => {
  let content

  if (imageData) {
    if (imageData.isUrl && imageData.url) {
      try {
        const response = await fetch(imageData.url)

        if (!response.ok) {
          throw new Error(
            `Failed to fetch image: ${response.statusText}`
          )
        }

        const buffer = await response.arrayBuffer()

        const base64 = Buffer.from(buffer).toString(
          'base64'
        )

        const mimeType =
          imageData.mimeType || 'image/jpeg'

        content = [
          {
            inlineData: {
              data: base64,
              mimeType
            }
          },
          { text: prompt }
        ]
      } catch (error) {
        console.error(
          'Error fetching image from Cloudinary:',
          error
        )

        throw new Error(
          `Failed to process image URL: ${error.message}`
        )
      }
    } else if (
      imageData.data &&
      imageData.mimeType
    ) {
      content = [
        {
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType
          }
        },
        { text: prompt }
      ]
    } else {
      throw new Error('Invalid image data format')
    }
  } else {
    content = [{ text: prompt }]
  }

  try {
    // Primary model with retries
    return await generateWithRetry(
      PRIMARY_MODEL,
      content
    )
  } catch (primaryError) {
    console.warn(
      `[Gemini] Primary model failed. Switching to ${FALLBACK_MODEL}`
    )

    try {
      // Fallback model with retries
      return await generateWithRetry(
        FALLBACK_MODEL,
        content
      )
    } catch (fallbackError) {
      console.error(
        'All Gemini models failed:',
        fallbackError
      )

      throw new Error(
        `Gemini unavailable. Primary error: ${primaryError.message}`
      )
    }
  }
}